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

## Navigation & Progress

### BUG-003 — Module entry point redirects to a stale/deleted page slug
**Reported:** 2026-03-05
**Observed:** Clicking "Start Module" (or equivalent entry point) navigates to `/modules/CS01/tips/`, a slug that no longer exists in the manifest. User must manually edit the URL.

**Root cause:** `user_module_state.last_module_page_id` stores a UUID from the `module_pages` table. When a page is removed from the manifest and re-ingested, the `module_nodes` record is deleted but the `module_pages` row may persist (the ingest script does not clean `module_pages`). The UUID still resolves to a slug via `useModuleProgress`'s `idToSlug` map, and any navigation path that doesn't validate the resolved slug against the current live slug list will follow it blindly into a 404.

`ModuleLandingClient` has a `slugs.includes(lastVisitedSlug)` guard that should catch this, but the bug reproduces — likely via a different entry point (home page "Start Module" link or similar) that uses the stored slug directly.

**Fix options (pick one):**
1. **Validate everywhere** — any component that reads `lastVisitedSlug` must check it against the current `slugs` prop before navigating; fall back to `slugs[0]` if missing.
2. **Clean `module_pages` on ingest** — delete `module_pages` rows whose slugs are no longer in the manifest, making stale UUIDs unresolvable at the hook level.
3. **Both** — belt-and-suspenders.

**Affected:** `app/hooks/useModuleProgress.ts`, `scripts/ingest.ts`, any component that navigates to `lastVisitedSlug` without validation.

---

## Content Authoring

### BUG-004 — Page classification taxonomy is undefined and unenforceable
**Reported:** 2026-03-05

**Context:** The manifest schema has two orthogonal concepts that are currently conflated or underspecified:

| Field | Current values | Purpose |
|-------|---------------|---------|
| `type` | `page`, `section`, `ai-interaction` | Structural/rendering type |
| `layout` | `reader`, `workbench`, `immersive` | Display layout |
| `metadata.*` | free-form JSON | Catch-all, including any nav badge hints from P6 |

**Problems:**
1. **No pedagogical classification.** There is no formal field for "what kind of activity is this page?" A `page` node could be a reading, a required written exercise, a group discussion prompt, a quiz, or a non-AI simulation — but the schema treats them identically. `ai-interaction` is the only node type that implies "exercise," and only for AI-driven ones.
2. **No `required` flag.** There is no standard way to mark a page as required vs. optional. Any such marking currently lives in free-form `metadata`, undocumented and unenforced.
3. **Nav badges (P6) read from an informal vocabulary.** The badge system introduced in Sprint 2 reads classification from somewhere in `node.metadata` or `node.config`, but there is no schema validation, no documented list of valid values, and no authoring guide telling a Module Owner what strings to write in their YAML.
4. **Non-AI exercises have no type.** An exercise that involves a written deliverable, a group negotiation without AI, or an in-class activity cannot be distinguished from a plain reading page in the DB or the UI.

**Proposed resolution (design, not code yet):**
- Add a formal `page_category` (or `badge`) field to `PageNodeSchema` (and optionally `AiInteractionNodeSchema`) with a defined enum: e.g., `reading | exercise | discussion | simulation | reference`
- Add a boolean `required` field to `BaseNodeSchema`
- Update nav badges to read from `page_category` (validated at ingest) rather than free-form metadata
- Document the full taxonomy in `content/AUTHORING.md` for Module Owners

**Affected:** `lib/schema/manifest.ts`, `scripts/ingest.ts`, nav badge component (P6), Module Owner dashboard

---

<!-- Add new items below this line -->
