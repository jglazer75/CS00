-- P2: Per-user platform settings
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_enabled boolean NOT NULL DEFAULT false,
  is_instructor boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; service role manages all
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- P2T: Teams within a module
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id text NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages teams"
  ON public.teams FOR ALL
  USING (true)
  WITH CHECK (true);

-- P2T: Team membership
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read team_members"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role manages team_members"
  ON public.team_members FOR ALL
  USING (true)
  WITH CHECK (true);

-- PMD: Public/private flag on modules
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- PMD: Module enrollment
CREATE TABLE public.module_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id text NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE (module_id, user_id)
);
ALTER TABLE public.module_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own enrollments"
  ON public.module_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages enrollments"
  ON public.module_enrollments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_teams_module_id ON public.teams(module_id);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_module_enrollments_module_id ON public.module_enrollments(module_id);
CREATE INDEX idx_module_enrollments_user_id ON public.module_enrollments(user_id);
