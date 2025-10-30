import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  loadTaskDefinition,
  renderTaskPrompt,
  extractResponseFormat,
  loadTaskContextValues,
  buildTemplateContext,
} from '@/lib/ai/taskLoader';
import { buildPromptCacheKey } from '@/lib/ai/hash';
import { getCachedResponse, storeCachedResponse } from '@/lib/ai/cache';
import { resolveProviderCredentials, ProviderResolutionError } from '@/lib/ai/providerResolver';
import { createProviderAdapter } from '@/lib/ai/adapterFactory';
import type { ProviderRunResult } from '@/lib/ai/providers';
import type { ProviderCredentials } from '@/lib/ai/types';
import { TaskNotFoundError } from '@/lib/ai/taskLoader';
import { AiTaskValidationError } from '@/lib/ai/validation';
import { executeDataCapture } from '@/lib/ai/dataCapture';

type AiGatewayRequestBody = {
  moduleId?: string;
  taskId?: string;
  provider?: string;
  inputs?: Record<string, unknown>;
  toggles?: Record<string, unknown>;
  cache?: {
    bypass?: boolean;
  };
  teamId?: string;
};

type AiGatewayResponse = {
  requestId: string;
  moduleId: string;
  taskId: string;
  provider: string;
  model: string;
  cache: {
    hit: boolean;
    ttlRemainingSeconds?: number;
  };
  content: string | Record<string, unknown>;
  metadata: Record<string, unknown>;
  capturedData?: Record<string, unknown>;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or anon key is not configured.');
}

const resolvedSupabaseUrl = supabaseUrl as string;
const resolvedSupabaseAnonKey = supabaseAnonKey as string;

export async function POST(request: NextRequest) {
  const requestId = randomUUID();

  let body: AiGatewayRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.', requestId }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request payload must be a JSON object.', requestId }, { status: 400 });
  }

  const moduleId = typeof body.moduleId === 'string' ? body.moduleId.trim() : '';
  const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : '';

  if (!moduleId || !taskId) {
    return NextResponse.json({ error: 'Both moduleId and taskId are required.', requestId }, { status: 400 });
  }

  const userAuth = await authenticateRequest(request);
  if (userAuth.status !== 200) {
    return NextResponse.json({ error: userAuth.error, requestId }, { status: userAuth.status });
  }

  const { userId, email } = userAuth;
  const teamId = typeof body.teamId === 'string' ? body.teamId.trim() : undefined;

  let task;
  try {
    task = loadTaskDefinition(moduleId, taskId);
  } catch (error) {
    if (error instanceof TaskNotFoundError) {
      return NextResponse.json({ error: error.message, requestId }, { status: 404 });
    }
    if (error instanceof AiTaskValidationError) {
      return NextResponse.json({ error: error.message, requestId }, { status: 422 });
    }
    return NextResponse.json({ error: 'Failed to load AI task definition.', requestId }, { status: 500 });
  }

  const inputs = isRecord(body.inputs) ? body.inputs : {};
  const toggleMap = normalizeToggleSelections(body.toggles);
  let contextValues: Record<string, string>;
  try {
    contextValues = loadTaskContextValues(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load task context.';
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }

  const prompt = renderTaskPrompt({
    task,
    moduleId,
    inputs,
    toggles: toggleMap,
    context: contextValues,
    auth: {
      userId,
      email,
      teamId,
    },
  });
  const responseFormat = extractResponseFormat(task.prompt);

  let credentials: ProviderCredentials;
  try {
    credentials = await resolveProviderCredentials({
      userId,
      preferredProvider: body.provider,
      teamId,
    });
  } catch (error) {
    if (error instanceof ProviderResolutionError) {
      return NextResponse.json({ error: error.message, requestId }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to resolve AI provider.', requestId }, { status: 500 });
  }

  const adapter = createProviderAdapter(credentials);
  const cacheConfig = task.cache;
  const cacheEnabled = cacheConfig?.strategy === 'prompt-hash' && cacheConfig.enabled !== false;

  if (cacheEnabled && body.cache?.bypass !== true) {
    const cacheFingerprint = JSON.stringify({ inputs, toggles: toggleMap });
    const cacheKey = buildPromptCacheKey({
      prompt,
      provider: credentials.provider,
      model: credentials.model,
      taskId: task.id,
      payloadFingerprint: cacheFingerprint,
    });

    const cacheHit = await getCachedResponse(cacheKey);
    if (cacheHit) {
      const response: AiGatewayResponse = {
        requestId,
        moduleId: task.moduleId,
        taskId: task.id,
        provider: cacheHit.providerName ?? credentials.provider,
        model: cacheHit.response.model ?? cacheHit.modelName ?? credentials.model ?? 'unknown',
        cache: {
          hit: true,
          ttlRemainingSeconds: cacheHit.ttlRemainingSeconds,
        },
        content: cacheHit.response.content,
        metadata: {
          ...(cacheHit.response.metadata ?? {}),
          isUserSuppliedProvider: credentials.isUserSupplied,
          source: 'cache',
        },
        capturedData: cacheHit.response.capturedData,
      };

      return NextResponse.json(response);
    }
  }

  let providerResult: ProviderRunResult;
  try {
    providerResult = await adapter.run({
      prompt,
      responseFormat,
    });
  } catch (error) {
    console.error('AI provider execution failed', error);
    return NextResponse.json({ error: 'AI provider execution failed.', requestId }, { status: 502 });
  }

  const response: AiGatewayResponse = {
    requestId,
    moduleId: task.moduleId,
    taskId: task.id,
    provider: adapter.name,
    model: providerResult.model,
    cache: {
      hit: false,
    },
    content: providerResult.content,
    metadata: {
      isUserSuppliedProvider: credentials.isUserSupplied,
    },
  };

  try {
    const templateContextWithResponse = buildTemplateContext({
      task,
      moduleId,
      inputs,
      toggles: toggleMap,
      context: contextValues,
      auth: {
        userId,
        email,
        teamId,
      },
      response: {
        content: providerResult.content,
        raw: providerResult.rawResponse,
        model: providerResult.model,
      },
    });

    await executeDataCapture({
      task,
      dataCapture: task.dataCapture,
      templateContext: templateContextWithResponse,
    });

    if (task.dataCapture?.operations?.length) {
      response.capturedData = {
        executed: true,
        operations: task.dataCapture.operations.length,
      };
      response.metadata.dataCapture = {
        executed: true,
        operations: task.dataCapture.operations.length,
      };
    }
  } catch (error) {
    console.error('AI data capture failed', error);
    return NextResponse.json({ error: 'Failed to persist AI task results.', requestId }, { status: 500 });
  }

  if (cacheEnabled && cacheConfig?.ttlSeconds && cacheConfig.ttlSeconds > 0) {
    const cacheFingerprint = JSON.stringify({ inputs, toggles: toggleMap });
    const cacheKey = buildPromptCacheKey({
      prompt,
      provider: credentials.provider,
      model: providerResult.model,
      taskId: task.id,
      payloadFingerprint: cacheFingerprint,
    });

    await storeCachedResponse({
      cacheKey,
      providerName: credentials.provider,
      modelName: providerResult.model,
      taskId: task.id,
      response: {
        model: providerResult.model,
        content: providerResult.content,
        metadata: response.metadata,
        capturedData: response.capturedData,
      },
      ttlSeconds: cacheConfig.ttlSeconds,
    });
  }

  return NextResponse.json(response);
}

async function authenticateRequest(
  request: NextRequest
): Promise<{ status: number; error?: string; userId?: string; email?: string | null }> {
  const authHeader = request.headers.get('authorization') ?? '';
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return { status: 401, error: 'Unauthorized.' };
  }

  const accessToken = authHeader.slice(7).trim();
  if (!accessToken) {
    return { status: 401, error: 'Unauthorized.' };
  }

  const userClient = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user?.id) {
    return { status: 401, error: 'Unauthorized.' };
  }

  return { status: 200, userId: user.id, email: user.email ?? null };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeToggleSelections(raw: unknown) {
  if (!isRecord(raw)) {
    return {};
  }

  const normalized: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      normalized[key] = value;
      continue;
    }

    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      normalized[key] = value;
    }
  }

  return normalized;
}
