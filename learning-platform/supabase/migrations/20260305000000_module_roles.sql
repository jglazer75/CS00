-- Module ownership (one owner per module; extend to many-to-many later if needed)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);

-- Per-module instructor assignments (replaces global is_instructor for new flows)
CREATE TABLE IF NOT EXISTS module_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module_id, user_id)
);

-- RLS: instructors read their own assignments
ALTER TABLE module_instructors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instructors read own" ON module_instructors FOR SELECT USING (user_id = auth.uid());
-- Service role has full access (for admin management)
