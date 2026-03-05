-- Allow all authenticated users to read module_instructors
-- (mirrors the pattern used for teams/team_members in Sprint 1)
-- The service role retains full access implicitly.
CREATE POLICY "Authenticated users can read module_instructors"
  ON module_instructors FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to read module_enrollments
-- (the Sprint 1 policy only allows users to read their own row;
--  the admin manage dialog needs to read any user's enrollments via browser client)
CREATE POLICY "Authenticated users can read module_enrollments"
  ON module_enrollments FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for module_instructors
CREATE INDEX IF NOT EXISTS idx_module_instructors_module_id ON module_instructors(module_id);
CREATE INDEX IF NOT EXISTS idx_module_instructors_user_id ON module_instructors(user_id);
