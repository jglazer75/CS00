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

## Student Experience

### FEATURE-001 — Module summary popover on the "Available Modules" selection screen
**Reported:** 2026-03-05

Students browsing available modules have no way to preview what a module covers before entering it. The module card shows only a title and short description.

**Requested:** An info/expand action on each module card (e.g., an icon button) that reveals a summary panel containing:
- Learning objectives (`modules.metadata.learning_objectives`)
- Key concepts / topics (new field — `modules.metadata.key_concepts`? or derived from manifest sections)
- Prerequisites (`modules.metadata.prerequisites`)
- Author / terms of use if set

**Notes:**
- All data is already in `modules.metadata` for modules that have been ingested with Sprint 3 attribution fields; the gap is the UI surface and the `key_concepts` field (not yet in schema or ingest)
- The popover/drawer should be read-only for students; Module Owners editing this content is covered by BUG-001/BUG-004 work
- Consider whether this also appears on the module orientation landing page (`ModuleLandingClient`) or only on the selection screen

**Affected:** module listing/home page (wherever "Available Modules" cards render), `lib/schema/manifest.ts` (add `key_concepts`), `scripts/ingest.ts`

---

## Content & Files

### BUG-005 — Source documents: broken page, no upload/storage system, copyright considerations
**Reported:** 2026-03-05

**Observed:** `/modules/CS01/instructor-sourcedocs/` renders a blank page (the route likely exists as a stub or leftover slug with no content backing it).

**Bigger gap:** There is no defined system for Module Owners to attach supplementary reading materials (PDFs, docs, etc.) to a module and make them available to enrolled students for download or on-site reading.

**What's needed (three layered problems):**

**1. Storage & delivery**
- Module Owner uploads files (PDF, DOCX, etc.) to a per-module folder in Supabase Storage
- Students with module access can list and download/view those files
- Files are scoped to a module — no cross-module leakage
- Likely route: `/modules/[moduleId]/sourcedocs` renders a file list; clicking opens/downloads the file

**2. Schema**
- No `module_documents` table (or equivalent Storage bucket structure) exists yet
- Could be pure Storage (bucket `module-docs/[moduleId]/`) with no DB table, relying on Storage RLS
- Or a `module_documents` table (id, module_id, file_path, display_name, uploaded_by, created_at) for richer metadata and soft-delete

**3. Copyright / legal (deferred, but plan for it)**
- Most source documents will be third-party materials (case studies, articles, legal filings) that the Module Owner may not hold copyright on
- Short-term: upload disclaimer in Module Owner UI — "By uploading, you confirm you have rights to distribute this material to enrolled students"
- Medium-term: add `terms_acknowledged_at` timestamp on upload to create audit trail
- Long-term: DMCA takedown request flow (receive complaint → notify uploader → remove file → log action); standard safe-harbor compliance

**Affected (new work):**
- Supabase Storage bucket + RLS policy (`module-docs` bucket, scoped by module_id)
- `app/modules/[moduleId]/sourcedocs/page.tsx` — student file browser
- `app/module-owner/[moduleId]/page.tsx` — upload UI with disclaimer
- `app/api/module-owner/[moduleId]/documents/route.ts` — signed URL generation + delete
- Optional: `supabase/migrations/XXXXXX_module_documents.sql`

---

<!-- Add new items below this line -->
