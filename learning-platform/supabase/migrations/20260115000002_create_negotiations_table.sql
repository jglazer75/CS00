-- 20260115000002_create_negotiations_table.sql
-- Migration to support stateful AI negotiations (DealCraft)

CREATE TABLE IF NOT EXISTS public.negotiations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id text NOT NULL,
    task_id text NOT NULL,
    status text NOT NULL DEFAULT 'active', -- 'active', 'completed', 'stalemate', 'aborted'
    user_role text NOT NULL,
    ai_role text NOT NULL,
    current_state jsonb NOT NULL DEFAULT '{}'::jsonb, -- The "Deal State" (e.g., current term sheet values)
    history jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of message objects [{role, content, timestamp, state_delta?}]
    metadata jsonb DEFAULT '{}'::jsonb, -- difficulty, persona_id, model_used, etc.
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_negotiations_user ON public.negotiations(user_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_module_task ON public.negotiations(module_id, task_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_status ON public.negotiations(status);

-- Enable RLS
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own negotiations"
    ON public.negotiations
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own negotiations"
    ON public.negotiations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own negotiations"
    ON public.negotiations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER on_negotiations_updated
    BEFORE UPDATE ON public.negotiations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Comment for documentation
COMMENT ON TABLE public.negotiations IS 'Stores stateful, multi-turn AI negotiation sessions (DealCraft).';
