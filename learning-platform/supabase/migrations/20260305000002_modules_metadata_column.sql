-- Add metadata JSONB column to modules table (used for attribution: author, terms_of_use, etc.)
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS metadata jsonb;
