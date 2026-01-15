-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. user_ai_providers
CREATE TABLE IF NOT EXISTS public.user_ai_providers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_name text NOT NULL, -- e.g., 'gemini', 'openai'
    encrypted_api_key text NOT NULL, -- Application-side encryption expected
    model_preferences jsonb DEFAULT '{}'::jsonb, -- e.g., {"default": "gpt-4"}
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, provider_name)
);

ALTER TABLE public.user_ai_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI providers"
    ON public.user_ai_providers
    FOR ALL
    USING (auth.uid() = user_id);

-- 2. ai_request_cache
CREATE TABLE IF NOT EXISTS public.ai_request_cache (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key text NOT NULL UNIQUE, -- SHA256 hash of prompt + model + config
    response_data jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT now() + INTERVAL '30 days'
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_ai_request_cache_key ON public.ai_request_cache(cache_key);

-- Enable RLS (Default deny all, assumes Service Role access for the API Gateway)
ALTER TABLE public.ai_request_cache ENABLE ROW LEVEL SECURITY;

-- 3. ai_task_runs (Telemetry/History)
CREATE TABLE IF NOT EXISTS public.ai_task_runs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id text NOT NULL,
    task_id text NOT NULL,
    inputs jsonb,
    response jsonb,
    metadata jsonb DEFAULT '{}'::jsonb, -- Execution time, model used, tokens, etc.
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_task_runs_user ON public.ai_task_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_task_runs_module_task ON public.ai_task_runs(module_id, task_id);

ALTER TABLE public.ai_task_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own task runs"
    ON public.ai_task_runs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task runs"
    ON public.ai_task_runs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Helper to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_ai_providers_updated
  BEFORE UPDATE ON public.user_ai_providers
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
