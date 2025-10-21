-- Create the negotiations table
CREATE TABLE public.negotiations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    status text NULL,
    user_role text NULL,
    ai_role text NULL,
    original_term_sheet text NULL,
    current_term_sheet_json jsonb NULL,
    history jsonb NULL,
    CONSTRAINT negotiations_pkey PRIMARY KEY (id),
    CONSTRAINT negotiations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add comments to the columns for clarity
COMMENT ON COLUMN public.negotiations.id IS 'Unique identifier for each negotiation session.';
COMMENT ON COLUMN public.negotiations.user_id IS 'Foreign key to the users table in Supabase auth. Optional for now.';
COMMENT ON COLUMN public.negotiations.created_at IS 'Timestamp for when the session started.';
COMMENT ON COLUMN public.negotiations.status IS 'e.g., ''initializing'', ''in_progress'', ''completed_agreement'', ''completed_stalemate''.';
COMMENT ON COLUMN public.negotiations.user_role IS 'The role chosen by the user, e.g., ''NewCo'' or ''BigTech''.';
COMMENT ON COLUMN public.negotiations.ai_role IS 'The role assumed by the AI, e.g., ''NewCo'' or ''BigTech''.';
COMMENT ON COLUMN public.negotiations.original_term_sheet IS 'The full text of the initially uploaded document.';
COMMENT ON COLUMN public.negotiations.current_term_sheet_json IS 'A JSON representation of the term sheet''s key negotiable points and their current status/values.';
COMMENT ON COLUMN public.negotiations.history IS 'An array of objects, where each object represents a turn in the conversation.';

-- Enable Row Level Security (RLS) on the table
-- This is a crucial security step in Supabase.
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;

-- Create Policies for anonymous access
-- These policies allow the application to work without user logins, which is suitable for the MVP.
-- The 'anon' role refers to any user accessing the database with the public anonymous key.

-- Allow anonymous users to create new negotiations
CREATE POLICY "Allow anonymous insert"
ON public.negotiations
FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous users to view any negotiation record
-- Access will be controlled at the application level by knowing the session 'id'
CREATE POLICY "Allow anonymous read access"
ON public.negotiations
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to update any negotiation record
-- Access will be controlled at the application level by knowing the session 'id'
CREATE POLICY "Allow anonymous update access"
ON public.negotiations
FOR UPDATE
TO anon
USING (true);
