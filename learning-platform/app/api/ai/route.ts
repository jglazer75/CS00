import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { loadTaskDefinition, renderTaskPrompt, buildTemplateContext } from '@/lib/ai/taskLoader';
import { resolveProviderCredentials } from '@/lib/ai/providerResolver';
import { createProviderAdapter } from '@/lib/ai/adapterFactory';
import { getCachedResponse, storeCachedResponse } from '@/lib/ai/cache';
import { buildPromptCacheKey } from '@/lib/ai/hash';
import { executeDataCapture } from '@/lib/ai/dataCapture';
import { loadTaskContextValues } from '@/lib/ai/taskLoader';
import { z } from 'zod';

const RequestBodySchema = z.object({
  moduleId: z.string().min(1),
  taskId: z.string().min(1),
  payload: z.object({
    inputs: z.record(z.string(), z.unknown()).default({}),
    toggles: z.record(z.string(), z.union([z.string(), z.array(z.string())])).optional().default({}),
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
    const { inputs, toggles } = payload;

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

    // 3. Load Context
    const context = loadTaskContextValues(task);

    // 4. Resolve Provider
    // Note: teamId is not yet available in MVP auth context, passing undefined.
    const credentials = await resolveProviderCredentials({
      userId: user.id,
      moduleId: moduleId,
      // teamId: ... 
    });

    // 5. Construct Prompt
    const authContext = { userId: user.id, email: user.email };
    const promptRenderParams = {
      task,
      moduleId,
      inputs,
      toggles,
      context,
      auth: authContext,
    };
    
    const renderedPrompt = renderTaskPrompt(promptRenderParams);

    // 6. Check Cache
    const cacheKey = buildPromptCacheKey({
      prompt: renderedPrompt,
      provider: credentials.provider,
      model: credentials.model,
      taskId: task.id,
      // Optional: fingerprint inputs if strictly needed, but prompt hash covers content variation
    });

    let responseEnvelope;
    let cachedHit = null;

    if (task.cache?.enabled !== false) {
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
      if (task.cache?.enabled !== false) {
        await storeCachedResponse({
          cacheKey,
          providerName: credentials.provider,
          modelName: runResult.model,
          taskId: task.id,
          response: responseEnvelope,
          ttlSeconds: task.cache?.ttlSeconds || 2592000, // Default 30 days
        });
      }
    }

    // 9. Data Capture (Telemetry / Persistence)
    // We rebuild template context to include the response
    const finalTemplateContext = buildTemplateContext({
      ...promptRenderParams,
      response: responseEnvelope,
    });

    // Execute capture asynchronously (or await if critical)
    if (task.dataCapture) {
      await executeDataCapture({
        task,
        dataCapture: task.dataCapture,
        templateContext: finalTemplateContext,
      });
    }

    // Log to ai_task_runs (System Telemetry)
    // This is separate from user-defined dataCapture, typically always logged
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
        executionTimeMs: 0, // TODO: Measure time
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