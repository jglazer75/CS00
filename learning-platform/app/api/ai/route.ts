import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { loadTaskDefinition, renderTaskPrompt, buildTemplateContext } from '@/lib/ai/taskLoader';
import { resolveProviderCredentials } from '@/lib/ai/providerResolver';
import { createProviderAdapter } from '@/lib/ai/adapterFactory';
import { getCachedResponse, storeCachedResponse } from '@/lib/ai/cache';
import { buildPromptCacheKey } from '@/lib/ai/hash';
import { executeDataCapture } from '@/lib/ai/dataCapture';
import { loadTaskContextValues } from '@/lib/ai/taskLoader';
import { extractTextFromBuffer } from '@/lib/ai/extraction';
import { z } from 'zod';
import type { NegotiationMessage, NegotiationSession } from '@/lib/ai/types';

const RequestBodySchema = z.object({
  moduleId: z.string().min(1),
  taskId: z.string().min(1),
  payload: z.object({
    inputs: z.record(z.string(), z.unknown()).default({}),
    toggles: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional().default({}),
    negotiationId: z.string().uuid().optional(),
    message: z.string().optional(),
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = RequestBodySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: result.error.issues },
        { status: 400 }
      );
    }

    const { moduleId, taskId, payload } = result.data;
    const { inputs, toggles, negotiationId, message } = payload;

    // 1. Authenticate User
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Load Task Definition
    let task;
    try {
      task = loadTaskDefinition(moduleId, taskId);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TaskNotFoundError') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      throw error;
    }

    // 2.5 Handle Negotiation State
    let history: NegotiationMessage[] = [];
    let currentState: Record<string, unknown> = {};
    let negotiation: NegotiationSession | null = null;

    if (negotiationId) {
      const { data, error: navError } = await supabase
        .from('negotiations')
        .select('*')
        .eq('id', negotiationId)
        .eq('user_id', user.id)
        .single();

      if (navError || !data) {
        return NextResponse.json({ error: 'Negotiation not found' }, { status: 404 });
      }

      negotiation = {
        ...data,
        currentState: data.current_state,
        userRole: data.user_role,
        aiRole: data.ai_role,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      } as NegotiationSession;

      history = negotiation.history;
      currentState = negotiation.currentState;

      // Add the new user message to history if provided
      if (message) {
        history.push({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 3. Load Context
    const context = loadTaskContextValues(task);

    // 3.5 Process File Inputs (Extract Text)
    const hydratedInputs = { ...inputs };
    for (const inputDef of task.inputs) {
      if (inputDef.kind === 'file') {
        const filePath = inputs[inputDef.name];
        if (typeof filePath === 'string' && filePath.trim() !== '') {
          try {
            const bucketName = 'term-sheet-submissions'; 
            const { data: fileData, error: downloadError } = await supabase.storage
              .from(bucketName)
              .download(filePath);

            if (downloadError) {
              console.warn(`Failed to download file ${filePath} from ${bucketName}`, downloadError);
              continue;
            }

            if (fileData) {
              const buffer = Buffer.from(await fileData.arrayBuffer());
              const extractedText = await extractTextFromBuffer(buffer, fileData.type);
              
              hydratedInputs[inputDef.name] = {
                path: filePath,
                content: extractedText,
                mimeType: fileData.type
              };
            }
          } catch (extractionError) {
            console.error(`Error processing file input ${inputDef.name}:`, extractionError);
          }
        }
      }
    }

    // 4. Resolve Provider
    const credentials = await resolveProviderCredentials({
      userId: user.id,
      moduleId: moduleId,
    });

    // 5. Construct Prompt
    const authContext = { userId: user.id, email: user.email };
    const promptRenderParams = {
      task,
      moduleId,
      inputs: { ...hydratedInputs, ...currentState }, // Merge current deal state into inputs
      toggles,
      context,
      auth: authContext,
      history,
      userRole: negotiation?.userRole,
      aiRole: negotiation?.aiRole,
    };
    
    const renderedPrompt = renderTaskPrompt(promptRenderParams);

    // 6. Check Cache (Skip cache for negotiations to ensure dynamic response)
    const skipCache = !!negotiationId;
    const cacheKey = buildPromptCacheKey({
      prompt: renderedPrompt,
      provider: credentials.provider,
      model: credentials.model,
      taskId: task.id,
    });

    let responseEnvelope;
    let cachedHit = null;

    if (!skipCache && task.cache?.enabled !== false) {
      cachedHit = await getCachedResponse(cacheKey);
    }

    if (cachedHit) {
      responseEnvelope = cachedHit.response;
    } else {
      // 7. Run Adapter
      const adapter = createProviderAdapter(credentials);
      const runResult = await adapter.run({
        prompt: renderedPrompt,
        responseFormat: task.prompt.responseFormat,
      });

      responseEnvelope = {
        model: runResult.model,
        content: runResult.content,
        metadata: {
          provider: credentials.provider,
          cached: false,
        },
      };

      // 8. Store in Cache
      if (!skipCache && task.cache?.enabled !== false) {
        await storeCachedResponse({
          cacheKey,
          providerName: credentials.provider,
          modelName: runResult.model,
          taskId: task.id,
          response: responseEnvelope,
          ttlSeconds: task.cache?.ttlSeconds || 2592000, 
        });
      }
    }

    // 9. Update Negotiation State if applicable
    if (negotiationId) {
      const responseContent = responseEnvelope.content;
      const aiResponseText = typeof responseContent === 'string' 
        ? responseContent 
        : (responseContent as Record<string, unknown>).message as string || JSON.stringify(responseContent);
      
      const stateDelta = typeof responseContent === 'object' && responseContent !== null
        ? (responseContent as Record<string, unknown>).dealStateUpdates as Record<string, unknown> || {} 
        : {};

      const updatedHistory = [...history, {
        role: 'assistant' as const,
        content: aiResponseText,
        timestamp: new Date().toISOString(),
        stateDelta: Object.keys(stateDelta).length > 0 ? stateDelta : undefined,
      }];

      const updatedState = { ...currentState, ...stateDelta };

      const { error: updateError } = await supabase
        .from('negotiations')
        .update({
          history: updatedHistory,
          current_state: updatedState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', negotiationId);

      if (updateError) {
        console.error('Failed to update negotiation state:', updateError);
      }
      
      // Inject updated state and history into response for the frontend
      responseEnvelope.negotiation = {
          id: negotiationId,
          history: updatedHistory,
          currentState: updatedState
      };
    }

    // 10. Data Capture (Telemetry / Persistence)
    const finalTemplateContext = buildTemplateContext({
      ...promptRenderParams,
      response: responseEnvelope,
    });

    if (task.dataCapture) {
      await executeDataCapture({
        task,
        dataCapture: task.dataCapture,
        templateContext: finalTemplateContext,
      });
    }

    // Log to ai_task_runs
    await supabase.from('ai_task_runs').insert({
      user_id: user.id,
      module_id: moduleId,
      task_id: taskId,
      inputs: inputs,
      response: responseEnvelope.content,
      metadata: {
        model: responseEnvelope.model,
        provider: credentials.provider,
        cached: !!cachedHit,
        negotiationId,
        executionTimeMs: 0,
      }
    });

    return NextResponse.json(responseEnvelope);

  } catch (error: unknown) {
    console.error('AI Gateway Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal Server Error', message },
      { status: 500 }
    );
  }
}