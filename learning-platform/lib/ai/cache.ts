import { getSupabaseServerClient } from '@/lib/supabase/server';

type CacheRecord = {
  id: string;
  cache_key: string;
  provider_name: string | null;
  model_name: string | null;
  task_id: string | null;
  response_data: {
    model: string;
    content: string | Record<string, unknown>;
    metadata?: Record<string, unknown>;
    capturedData?: Record<string, unknown>;
  };
  created_at: string;
  expires_at: string;
};

export type CacheHit = {
  providerName?: string | null;
  modelName?: string | null;
  response: {
    model: string;
    content: string | Record<string, unknown>;
    metadata?: Record<string, unknown>;
    capturedData?: Record<string, unknown>;
  };
  ttlRemainingSeconds: number;
};

export async function getCachedResponse(cacheKey: string): Promise<CacheHit | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from<CacheRecord>('ai_request_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .maybeSingle();

  if (error) {
    console.warn('AI cache lookup failed', error);
    return null;
  }

  if (!data) {
    return null;
  }

  const expiresAt = new Date(data.expires_at);
  const now = new Date();
  if (!(expiresAt.getTime() > now.getTime())) {
    return null;
  }

  return {
    providerName: data.provider_name,
    modelName: data.model_name,
    response: data.response_data,
    ttlRemainingSeconds: Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function storeCachedResponse(params: {
  cacheKey: string;
  providerName: string;
  modelName: string;
  taskId: string;
  response: {
    model: string;
    content: string | Record<string, unknown>;
    metadata?: Record<string, unknown>;
    capturedData?: Record<string, unknown>;
  };
  ttlSeconds: number;
}) {
  const supabase = getSupabaseServerClient();
  const expiresAt = new Date(Date.now() + params.ttlSeconds * 1000).toISOString();

  const { error } = await supabase.from('ai_request_cache').upsert(
    {
      cache_key: params.cacheKey,
      provider_name: params.providerName,
      model_name: params.modelName,
      task_id: params.taskId,
      response_data: params.response,
      expires_at: expiresAt,
    },
    {
      onConflict: 'cache_key',
    }
  );

  if (error) {
    console.warn('AI cache write failed', error);
  }
}
