# Implementation Plan: Classroom Launch Hardening Sprint

All proposals reference `conductor/20260220.SystemSolutions.md`.

---

## Sprint 1 — Launch Blockers

### ✓ P1 — Authentication Middleware  `[ DONE ]`
**File:** `learning-platform/middleware.ts` (new)
**Package required:** `@supabase/ssr` (install before writing)
**Scope:** ~40 lines using `createServerClient` from `@supabase/ssr`.

| Route pattern | Unauthenticated |
|---------------|----------------|
| `/` | ✅ Allow |
| `/login`, `/reset-password` | ✅ Allow |
| `/modules/*` | ↩ Redirect to `/login?redirectTo=<path>` |
| `/settings/*` | ↩ Redirect to `/login?redirectTo=<path>` |
| `/admin/*` | ↩ Redirect to `/login?redirectTo=<path>` |

Module public/private access is **not** enforced here — middleware only gates authentication. The module page component handles whether an authenticated user is allowed into a specific module (see PMD below).

---

### → P9 — Remove Development Artifact (test-ai page)  `[ IN PROGRESS ]`
**Files:**
- `learning-platform/content/CS01/module.yaml` — remove the `test-ai` node block
- Re-run `scripts/ingest.ts` to sync removal to `module_nodes`
- Move or delete `learning-platform/content/CS01/99-test-ai.md`

---

### P2 + P2T — User Profiles, AI Permissioning & Team Management  `[ ]`
*Combined workstream — one migration, one admin area, parallel UI work.*

**Migration:** `supabase/migrations/YYYYMMDD_create_profiles_and_teams.sql`

```sql
-- Per-user platform settings
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_enabled boolean NOT NULL DEFAULT false,
  is_instructor boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Users read own; service role manages all

-- Teams within a module
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id text NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,  -- module-defined role e.g. "NewCo", "BigTech"; null until assigned
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team membership
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
```

**AI gateway change** (`app/api/ai/route.ts`): After `auth.getUser()`, query `profiles.ai_enabled`. Return 403 if false.

**Team generation API:** `app/api/admin/teams/generate/route.ts` (new)
- Accepts `{ moduleId, by: "numTeams"|"studentsPerTeam", value: number, assignRolesRandomly: boolean }`
- Fetches non-instructor users, shuffles, splits into teams, optionally assigns module roles
- One-team-per-module-per-user enforced: removes prior membership before inserting

**Admin UI files:**
- `app/admin/users/page.tsx` (new) — roster view with AI enable/disable toggle per user; bulk enable
- `app/admin/modules/[moduleId]/teams/page.tsx` (new) — team management for a module:
  - Current teams with role and member list
  - "Generate Teams" dialog (random config)
  - Manual assign: select students → team, select team → role
  - Role options populated from module `roles` field
  - **Team assignment also writes `module_enrollments` record (PMD integration)**

**PMD — Module Access Control (built here, same migration):**

Schema additions to the same migration file:
```sql
ALTER TABLE public.modules ADD COLUMN is_public boolean NOT NULL DEFAULT false;

CREATE TABLE public.module_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id text NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE (module_id, user_id)
);
ALTER TABLE public.module_enrollments ENABLE ROW LEVEL SECURITY;
```

Access check added to both module page routes (`app/modules/[moduleId]/page.tsx` and `[slug]/page.js`):
- If `module.is_public` → allow any authenticated user
- If private → check `module_enrollments` for the user; instructors always pass
- If neither → `redirect('/')`

Admin UI additions (on the teams page or a settings tab):
- Public / Private toggle per module
- Enrollment list (who has access, who granted it)
- Manual enroll individual students (for modules without teams or for auditors)

**NegotiationSimulator change** (`app/components/ai/NegotiationSimulator.tsx`):
- On load, query `team_members → teams` for the user's role in this module
- If role found: skip role-selection UI; show "You are representing [role]"; proceed directly
- If not found: fall back to current manual selection (existing behavior preserved)

---

### P3a — Hide BYOK Settings from Students  `[ ]`
**File:** `learning-platform/app/settings/ai/page.tsx`
**Scope:** Add role check at page render. If user is not admin/instructor, redirect to `/` or show a "not available" message.
**Dependency:** P2 (profiles table with role concept must exist).

---

### P4 — Enforce module.yaml Visibility Rules  `[ ]`
**Files:**
- `learning-platform/app/modules/[moduleId]/[slug]/page.js` — derive user roles; pass to content layer
- `learning-platform/lib/content.ts` — add `userRoles: string[]` param to `getModuleStructure()` and `loadInstructorNote()`; filter nodes

**No new migration needed** — roles are derived from P2T teams:
```typescript
// In page.js server component:
const { data: teamData } = await supabase
  .from('team_members')
  .select('teams!inner(role)')
  .eq('user_id', user.id)
  .eq('teams.module_id', moduleId)
  .maybeSingle();

const userRoles: string[] = [];
if (profile?.is_instructor) userRoles.push('Instructor');
if (teamData?.teams?.role) userRoles.push(teamData.teams.role);
```

**Pre-check:** Verify `scripts/ingest.ts` writes `visibility` from `module.yaml` into `module_nodes.metadata`. If not, fix ingest first.

**Dependency:** P2T (teams + team_members must exist).

---

### P7 — AI Rate Limiting  `[ ]`
**File:** `learning-platform/app/api/ai/route.ts`
**Scope:** ~15 lines added after auth check.

```typescript
const RATE_LIMIT = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR ?? '25');
const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
const { count } = await supabase
  .from('ai_task_runs')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .gte('created_at', oneHourAgo);

if ((count ?? 0) >= RATE_LIMIT) {
  return NextResponse.json({ error: 'Rate limit reached. Please try again later.' }, { status: 429 });
}
```

Add `AI_RATE_LIMIT_PER_HOUR` to `.env.local` and Vercel env vars. Default: 25.

---

## Sprint 2 — Pre-Launch

### P6 — Page Type UX Differentiation  `[ ]`
**Files:**
- `learning-platform/app/components/ModuleNav.tsx` — add type/layout badge to nav items
- `learning-platform/app/components/ModulePageContent.tsx` — add "Required Exercise" chip to exercise pages
**Pre-check:** Confirm `type` and `layout` fields are available in the node data passed to nav.

---

### P8 — Consolidate Content Pipeline  `[ ]`
**Files:**
- `learning-platform/app/page.tsx` — replace `getSortedPagesData()` with Supabase `modules` query
- `learning-platform/lib/content.ts` — deprecate `getSortedPagesData()`
- Confirm `module_pages` table is unused (search codebase); mark for deprecation.

---

### P10 — Bulk Student Invite / Roster  `[ ]`
**Files:**
- `learning-platform/app/admin/users/page.tsx` — extend with CSV/paste bulk invite and roster view
**Dependency:** P2 admin UI must exist as the base.

---

### P3b — Encrypt Stored API Keys  `[ ]`
**Files:**
- New migration: no schema change needed (column already exists)
- New utility: `learning-platform/lib/ai/crypto.ts` — AES encryption/decryption using env key
- Update `app/api/ai/route.ts` (providerResolver) to decrypt on read
- Update any write path to encrypt on save
**Dependency:** P3a must be done first.

---

## Sprint 3 — Post-Launch

### P11 — Instructor Progress Dashboard  `[ ]`
**File:** `learning-platform/app/admin/progress/page.tsx`
Aggregate view of `user_module_state` and `ai_task_runs` per student.
**Dependency:** P4 (role verification to protect the page).

---

## Completion Checklist

- [x] P1 Auth middleware
- [ ] P9 Remove test-ai artifact
- [ ] P2+P2T+PMD Migration (profiles + teams + team_members + module_enrollments + modules.is_public)
- [ ] P2 AI gateway permissioning check (ai_enabled)
- [ ] P2 Admin users page (roster + AI toggle)
- [ ] P2T Team generation API
- [ ] P2T Admin teams page (generate + manual assign + role assign)
- [ ] P2T NegotiationSimulator auto-role from team
- [ ] PMD Module public/private toggle in admin
- [ ] PMD Access check in module page routes
- [ ] P3a Hide BYOK from students
- [ ] P4 Enforce visibility rules (team-derived roles)
- [ ] P7 Rate limiting
- [ ] P6 Page type UX
- [ ] P8 Consolidate content pipeline
- [ ] P10 Bulk invite / roster
- [ ] P3b Encrypt stored keys
- [ ] P11 Instructor progress dashboard
