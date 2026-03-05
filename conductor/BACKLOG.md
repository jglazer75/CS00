# CS00 Platform — Backlog

Issues, unintended gaps, and deferred features. Not prioritized yet.

---

## Role & Permission Gaps

### BUG-001 — Module Owner cannot set module visibility
**Reported:** 2026-03-05

Module Owners have no way to toggle `modules.is_public` for their own module. Currently only App Admins can flip this flag (directly in the DB or via a missing UI). The Module Owner dashboard (`/module-owner/[moduleId]`) should include a "Public / Private" toggle that writes `modules.is_public` via the owner API.

**Affected:** `app/module-owner/[moduleId]/page.tsx`, `app/api/module-owner/[moduleId]/route.ts`

---

### BUG-002 — Module "sides" not owned by Module Owners; Instructors can't set them independently
**Reported:** 2026-03-05

**Context:** Modules have a concept of "sides" (factions/roles in a case study — e.g., Buyer vs. Seller) stored today as `teams.role` and defined in `module.yaml` under `roles:`. These sides become meaningful in-page as the case unfolds.

**Problems:**
1. **Module Owners** have no surface to define or edit the canonical list of sides for their module. Currently sides come only from the YAML manifest and are ingestible only by whoever runs `npm run ingest`. A Module Owner should be able to manage sides from their dashboard.
2. **Instructors** assigned to a module use `/admin/modules/[moduleId]/teams` (an admin-only route) to create student teams and assign a side to each team. Instructors have no equivalent page — the team creation UI lives under `/admin/`, which they can't access.

**Expected:**
- Module Owner dashboard: editable "Sides" list (writes to `modules.metadata.roles` or a dedicated column)
- Instructor teams page at `/instructor/[moduleId]/teams` mirroring the admin teams UI, scoped to their module

**Affected:** `app/admin/modules/[moduleId]/teams/page.tsx`, `app/module-owner/[moduleId]/page.tsx`, `app/instructor/[moduleId]/page.tsx`

---

<!-- Add new items below this line -->
