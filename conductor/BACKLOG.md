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

**Context:** Modules have a concept of "sides" (factions/roles in a case study — e.g., Buyer vs. Seller) stored today as `teams.role` and defined in `module.yaml` under `roles:`. These sides become meaningful in-page as the case unfolds — including gating which documents and pages a team sees (via `visibility_rules`) and determining opposing team pairings for document exchange workflows (see FEATURE-004).

**Problems:**
1. **Module Owners** have no surface to define or edit the canonical list of sides for their module. Currently sides come only from the YAML manifest and are ingestible only by whoever runs `npm run ingest`. A Module Owner should be able to manage sides from their dashboard.
2. **Instructors** assigned to a module use `/admin/modules/[moduleId]/teams` (an admin-only route) to create student teams and assign a side to each team. Instructors have no equivalent page — the team creation UI lives under `/admin/`, which they can't access.
3. **Opposing team pairing is unmodeled.** Sides imply opposition (Buyer faces Seller), but the DB has no explicit pairing between teams. This is needed for FEATURE-004 Seam 2 (surfacing opponent contact info) and any future handoff or document exchange features. The simplest model: sides defined in pairs in the manifest/owner dashboard (e.g., `[["Buyer", "Seller"]]`); at team generation, a Buyer team is automatically paired with a Seller team.

**Expected:**
- Module Owner dashboard: editable "Sides" list (writes to `modules.metadata.roles` or a dedicated column), defined as opposing pairs
- Instructor teams page at `/instructor/[moduleId]/teams` mirroring the admin teams UI, scoped to their module
- Team generation assigns sides and implicitly creates pairings; pairing stored in DB (new `team_pairings` join table, or `teams.paired_team_id` self-reference)

**Affected:** `app/admin/modules/[moduleId]/teams/page.tsx`, `app/module-owner/[moduleId]/page.tsx`, `app/instructor/[moduleId]/page.tsx`, `supabase/migrations/` (pairing model)

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

## Invite & Onboarding

### BUG-006 — Bulk invite sends users nowhere: no module assignment enforced at invite time
**Reported:** 2026-03-10

**Context:** `/admin/users` has a Bulk Invite panel that calls `POST /api/admin/invite` for each email. The invite sends the user a Supabase magic-link email and creates their auth account, but does **not** assign them to any module or role. When the invited user logs in they land on the home screen with no enrollments and no guidance.

**Expected behavior by inviter role:**

| Who is inviting | Who they're probably inviting | What should happen at invite time |
|-----------------|-------------------------------|-----------------------------------|
| App Admin       | Anyone                        | Optional: pick a module + role (Enrolled / Instructor) before sending |
| Module Owner    | An Instructor for their module | Invitee should be auto-assigned as `module_instructors` for that module |
| Global Instructor | A Student for one of their modules | Invitee should be auto-enrolled in the relevant module |

**Problems:**
1. Bulk invite UI has no module/role picker — inviter cannot specify where the invitee should land.
2. `POST /api/admin/invite` body only accepts `{ email }` — no `moduleId`, `role`, or `assignAs` fields exist.
3. After the invite the API doesn't write to `module_enrollments` or `module_instructors`, so the new user has no context.
4. Module Owners currently can't access `/admin/users` at all — their only invite surface would need to be their own dashboard, which doesn't have one yet.

**Proposed fix (design, not code yet):**
- Add optional `moduleId` and `assignAs: 'student' | 'instructor'` to the invite API body.
- If provided, the API writes the appropriate row (`module_enrollments` or `module_instructors`) **immediately after** creating the auth invite, so the row exists before the user's first login.
- Bulk invite UI: add a "Assign to module (optional)" row — module selector + role dropdown — above the Send button. When filled in, every invite in the batch gets that assignment.
- Module Owner dashboard: add a standalone "Invite Instructor" form that pre-fills `moduleId` from context and hard-codes `assignAs: 'instructor'`.
- Auth guard on the invite API: if the caller is not an App Admin, verify they are a Module Owner or Global Instructor for the specified `moduleId` before accepting the request.

**Affected:** `app/admin/users/page.tsx` (bulk invite UI), `app/api/admin/invite/route.ts`, `app/module-owner/[moduleId]/page.tsx` (new invite section)

---

### BUG-007 — Invite link drops users into app without prompting for password; reset is rate-limited
**Reported:** 2026-03-10

**Context:** Supabase's `inviteUserByEmail` flow sends a one-time magic link. Clicking it signs the user in and redirects to the app — there is no built-in "set a password" screen. The login page (`/login`) does not inspect the URL fragment for `type=invite`, so invited users land fully authenticated but with no password, and no prompt to create one.

**Problems:**
1. Invited user has a session but no password — they cannot log in on a second visit.
2. The only recovery path today is "Forgot your password?" → Supabase sends a reset email → user clicks it → `/reset-password` page lets them set a password. This works, but:
3. Supabase's default email rate limit is **2 emails/hour per project** (covers both invite and reset emails). If two users are invited and then both immediately try to reset, they can hit the cap — further emails are silently dropped or queued.

**Expected behavior:**
- When `/login` loads with `#access_token=...&type=invite` in the URL fragment, detect it and immediately present a "Choose your password" form (call `supabase.auth.updateUser({ password })` on submit).
- Alternatively, redirect to a dedicated `/set-password` page that handles this case.

**Rate-limit note:** Supabase's 2 emails/hr cap applies to the free/pro SMTP relay. Mitigations:
- Configure a custom SMTP provider in Supabase Dashboard → Auth → SMTP Settings (e.g. Resend, SendGrid, Postmark) — removes the cap entirely.
- Or handle the invite-to-password flow fully in-app (option 1 above) so a reset email is never needed for fresh invites.

**Affected:** `app/login/page.tsx` (add invite token detection), optionally a new `app/set-password/page.tsx`

---

## Infrastructure & Branding

### INFRA-001 — Project-specific domain needed
**Reported:** 2026-03-10

Currently using `cs-00.vercel.app` as the production URL and a personal domain for transactional email (Resend SMTP). Both should move to a project-specific domain once branding is settled.

**What changes when the domain is ready:**
- Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables
- Update Supabase → Auth → URL Configuration (Site URL + Redirect URLs allowlist)
- Add new domain to Resend, verify DNS, update Supabase SMTP "From" address
- Add custom domain to Vercel project (Vercel Dashboard → Project → Domains)

**Status:** Rebranding in progress; domain TBD.

---

## Typography & Visual

### BUG-008 — Heading font sizes are too large; H1 renders at ~6rem (~92px)
**Reported:** 2026-03-11

**Observed:** H1 headings appear vastly oversized in production — estimated at ~6rem (~92px). Likely affects H2–H6 scaling proportionally.

**Expected:** Heading sizes should follow a sensible typographic scale appropriate for a learning platform (e.g., H1 ≈ 2–2.5rem, scaling down from there).

**Investigation needed:**
- Locate where heading variants are defined in the MUI theme (`createTheme` → `typography`)
- Check if a global CSS reset or Tailwind/base stylesheet is compounding the scale
- Verify that markdown-rendered content (MDX/prose) has its own heading overrides and they are consistent with the theme

**Affected:** MUI theme file (likely `learning-platform/lib/theme.ts` or similar), global CSS, any prose/markdown stylesheet

---

### FEATURE-002 — Kramdown `{:.keyconcept}` aside rendering + TOC differentiation
**Reported:** 2026-03-11

**Context:** Module markdown content originated as GitHub Pages / Jekyll sites and uses kramdown IAL (Inline Attribute List) syntax to tag headings as supplemental asides. The IAL tag follows the heading it annotates (applies to the **preceding block**):

```markdown
## Key Concepts
{:.keyconcept}

Content here is supplemental...
```

The tag scopes the aside to the heading-level section: everything from that heading until the next sibling or higher heading. Common heading labels in the wild: "Key Concepts", "Key Concept", "Resources". The IAL tag is authoritative; heading-label matching is a fallback only.

**Current state:** The `{:.keyconcept}` IAL syntax is passed through the markdown pipeline unprocessed — it renders as a literal `{:.keyconcept}` string in the page body. No visual distinction is applied.

**Expected behavior:**

1. **Parsing:** Strip the `{:.keyconcept}` IAL token and annotate the preceding heading node (and its section content) in the remark/rehype AST.
2. **Visual treatment:** Render keyconcept sections as a visually distinct aside — subtle background, left border accent, or similar — clearly secondary to the main case-study content. Must not visually dominate or interrupt the primary reading flow. Exact treatment (collapsed-by-default, inline badge, etc.) TBD at implementation time.
3. **TOC column:** Keyconcept headings should be visually differentiated from primary headings in the right-side TOC panel (icon, muted style, or badge). Exact design TBD at implementation time.

**Implementation notes:**
- The remark/rehype pipeline is the right place to handle IAL stripping and AST annotation — not the renderer.
- Other IAL classes may exist (e.g., `{:.warning}`, `{:.note}`); the parser should forward arbitrary classes even if only `keyconcept` is styled today.

**Affected:** MDX/remark pipeline, TOC component, page stylesheet / MUI theme typography overrides

---

### FEATURE-003 — Per-module "Supplemental Guide" compiling Key Concepts, Objectives, and Core Concepts
**Reported:** 2026-03-11

**Context:** Related to FEATURE-002. Each module's `{:.keyconcept}`-tagged sections (plus any nodes typed as Objectives or Core Concepts in the manifest) represent supplemental reference material. Students and instructors benefit from a single compiled view rather than having to flip through every page.

**Expected:** A generated "Supplemental Guide" page (or downloadable document) per module that:
- Collects all keyconcept blocks, learning objectives (`modules.metadata.learning_objectives`), and any nodes tagged as "Core Concepts" in the manifest
- Preserves their source page context (section heading + page title + link back)
- Is accessible from the module nav (e.g., a fixed entry in the sidebar or module landing page)
- Optionally exportable as PDF or printable view

**Open questions (design, not code yet):**
- Is this generated at ingest time (stored in DB) or computed at request time from the parsed markdown?
- Should keyconcept block content be extracted and stored as a structured column (e.g., `module_nodes.keyconcepts jsonb`) during ingest, making runtime assembly trivial?
- Should the Supplemental Guide be a special `module_node` type so it appears in the manifest-driven nav naturally?

**Affected:** `scripts/ingest.ts` (extraction), `lib/schema/manifest.ts` (possible new node type), new page route `app/modules/[moduleId]/supplemental/page.tsx`, remark pipeline (FEATURE-002 dependency)

---

### BUG-009 — Markdown content changes require a full Vercel redeploy; no live-edit path for contributors
**Reported:** 2026-03-11

**Root cause:** `lib/content.ts` serves module markdown by reading files directly from the filesystem at request time (`fs.readFileSync`). On Vercel, the filesystem is the deployed build bundle — files cannot be mutated after deploy. The ingest script (`scripts/ingest.ts`) only syncs manifest/navigation structure to Supabase; it does **not** store markdown body content in the DB. Therefore:

- Any edit to a `.md` content file requires a new git commit → Vercel redeploy before it appears on the live site.
- The same is true for `module.yaml` manifest changes, though those also require re-running `npm run ingest` to update the Supabase `module_nodes` table.
- There is currently no in-app or API path for a Module Owner or Instructor to update content without repo access.

**Why this matters now:** Acceptable with one or two contributors who have repo access. Becomes a hard blocker once Module Owners or external contributors author content, since they would need git access and would trigger redeploys on every edit.

**Options (design, not code yet):**

| Option | Trade-offs |
|--------|-----------|
| **A — Store markdown in Supabase** (`module_nodes.content` text column, populated at ingest) | Eliminates filesystem dependency; enables live edits and in-app editor; requires migrating content read path in `lib/content.ts` from `fs` to DB query; ingest becomes the single source of truth writer |
| **B — Supabase Storage** (upload `.md` files to a bucket, read via signed URL at request time) | Files stay as files; avoids DB text bloat; adds latency per page load; still requires an upload mechanism for contributors |
| **C — Keep filesystem, add a content-only redeploy webhook** (e.g., Vercel Deploy Hook triggered by a content-repo push) | Minimal code change; still requires git access; only improves deploy friction slightly |
| **D — Hybrid: DB for body, git as source of truth** (ingest pushes content to DB; live site reads DB; contributors edit files in git; CI runs ingest on merge) | Best separation of concerns; most implementation work |

**Recommendation (flagged, not decided):** Option A or D. Option A is the simpler near-term path and unblocks the Supplemental Guide (FEATURE-003) since keyconcept extraction can happen at ingest time and be stored alongside the content.

**Affected:** `lib/content.ts` (read path), `scripts/ingest.ts` (write path), Supabase schema (new column or bucket), CI/CD pipeline

---

## Team Management

### BUG-010 — Team generation pools ALL platform students, not just those enrolled in the module
**Reported:** 2026-03-11

**Root cause:** `POST /api/admin/teams/generate` fetches students by querying `profiles` where `is_instructor = false` (line 56–65 of `route.ts`). This returns every non-instructor user on the entire platform, regardless of whether they are enrolled in the target module. There is no filter on `module_enrollments`.

**Consequences:**
1. Students enrolled in a different module entirely are included in the pool.
2. Students enrolled in the same module but in a *different cohort/section* (e.g., two separate class sections run by the same or different instructors) are also pooled together, mixing cohorts.
3. Students who have been enrolled but have not yet set up a profile row would be silently excluded (profile may not exist yet).

**Expected behavior:** The generation pool should be scoped to students enrolled in `moduleId` via `module_enrollments`, not all non-instructor profiles.

**Cohort / section gap (related):** Even with the enrollment fix, there is no concept of a cohort or section within a module enrollment. An instructor running two sections of the same module has no way to say "generate teams only from Section A." This requires either:
- A `cohort` or `section` label on `module_enrollments` (simplest: a free-text `section` column)
- Or a separate `cohort` entity (more structured; enables per-cohort progress views, team generation, etc.)

This is a design decision deferred to implementation, but the enrollment-scoped fix is an immediate correctness fix independent of cohort support.

**Affected:** `app/api/admin/teams/generate/route.ts` (immediate fix: join `module_enrollments`), `supabase/migrations/` (cohort column if pursued), teams generate dialog UI

---

### BUG-011 — Team assignment is only visible to students on the module landing page
**Reported:** 2026-03-11

**Observed:** A student's team name and role are shown in a card on the module landing page (`ModuleLandingClient.tsx`, only rendered when `teamName` is non-null). There is no team indicator anywhere else in the student-facing module experience — not in the persistent nav/header, not in the sidebar, not on individual content pages.

**Problems:**
1. Once a student navigates past the landing page into a content page, there is no visible reminder of their team assignment or role. This is significant in a case-study/negotiation context where the role (e.g., Buyer vs. Seller) affects how they should read the material.
2. If a student navigates directly to a content page (deep link, browser back, etc.) without going through the landing, they may never see their team at all.
3. The NegotiationSimulator (`app/components/ai/NegotiationSimulator.tsx`) auto-populates role from team membership, but there is no persistent visual confirmation outside the simulator that the student knows their role.

**Expected:** Team name and role should be persistently visible within the module context — e.g., a small badge or chip in the module sidebar or page header — so students are never uncertain about their assignment while working through the content.

**Affected:** Module layout/sidebar, `app/modules/[moduleId]/[slug]/page.js`, possibly a shared module context provider to avoid redundant DB fetches per page

---

## In-Class & Document Workflow

### FEATURE-004 — In-class document workflow: export, handoff, and return
**Reported:** 2026-03-11

**Context:** Case studies are used in two modes: (1) **independent/async** — student works through the module alone, interacts with the AI negotiation simulator; (2) **in-class/sync** — students work in teams during a class session, generate redlines collaboratively in Word/Google Docs, and exchange documents with an opposing team to negotiate. The platform handles mode 1 well. Mode 2 is largely unaddressed — students must extract documents manually, collaborate entirely outside the platform, and return only if they choose to continue with the AI. The platform should lower friction at three seams without trying to become a document collaboration tool.

---

**Seam 1 — Export (getting documents out)**

Module owners flag certain pages or source documents as exportable in the manifest (analogous to `{:.keyconcept}` for content sections — an `exportable: true` field or similar IAL tag). The platform surfaces a prominent download action on those pages.

- **Preferred format: DOCX** for pages whose content is the working document (e.g., "Deconstructing the Term Sheet") — students open in Word, immediately apply track changes. PDF is appropriate for reference-only materials.
- **Export format hint:** `export_format: docx | pdf | both` in the manifest node or as a module owner setting.
- **DOCX generation:** Markdown → DOCX conversion at export time (e.g., via `docx` npm package or a server-side route). Does not require a full redeploy — generated on demand.
- **Visibility rules apply:** If a page or document is gated by team/side (via `visibility_rules`), the export action respects the same access rules. A Buyer team can download the Buyer term sheet; a Seller team cannot.
- **Source documents (BUG-005 overlap):** PDFs already in the module's source docs folder should also be surfaceable inline on relevant pages, not only via the separate `/sourcedocs` route.

**Manifest addition (design):**
```yaml
- id: term-sheet
  type: page
  title: Deconstructing the Term Sheet
  exportable: true
  export_format: docx
```

---

**Seam 2 — Handoff (facilitating document exchange between teams)**

The platform does not own file transfer. Students use Word + Google Drive / Sharepoint / email for the actual exchange. The platform's role is to reduce the "who do I send this to?" friction:

- After a student exports a document, surface a **"Share with your opposing team"** panel showing the opposing team's member emails (copy-to-clipboard or mailto link). No file transfer — just contact info.
- This requires the opposing team pairing to be modeled (see BUG-002, problem 3 — `team_pairings` or `teams.paired_team_id`).
- Depends on **user profiles being complete** (see FEATURE-005) — if a student has no display name or email visible to teammates, the handoff panel is less useful.
- Scoped to the cohort/session (see BUG-010 cohort gap) — only show teammates/opponents from the same session, not all module enrollees.

---

**Seam 3 — Return (getting documents back in)**

Two sub-cases, both optional for now:

**3a — Upload for AI continuation:** After the in-class session, a student uploads their team's redline (DOCX/PDF) as context for the NegotiationSimulator. The simulator accepts the uploaded document as the "current draft" and continues the negotiation against the AI. This avoids the student having to re-describe or paste the redline.

**3b — Upload for instructor review:** A team uploads their final redline to a module-scoped file locker. The upload is attached to both the module and the cohort/session (requires BUG-010 cohort model). Instructor can see all team submissions and download them. Whether grading happens in the platform or in an external LMS is instructor's choice — the platform just needs to store and surface the file. This overlaps significantly with BUG-005 (source documents / Supabase Storage); the student upload path is an addition to that same storage architecture.

---

**Immediate priority (pre-Friday):** Seam 1 export only — a download button on flagged pages, DOCX generation from markdown. Seams 2 and 3 are post-launch.

**Dependencies:** BUG-002 (side pairings, for Seam 2), BUG-005 (storage, for Seam 3b), BUG-010 (cohort model, for Seam 2 scoping + Seam 3b attachment), FEATURE-005 (user profiles, for Seam 2 contact info)

**Affected (Seam 1):** `lib/schema/manifest.ts` (exportable flag), new API route `app/api/modules/[moduleId]/export/[nodeId]/route.ts`, page renderer (download button), DOCX generation library
**Affected (Seam 2):** Teams page, module sidebar/page context, `supabase/migrations/` (pairings)
**Affected (Seam 3):** NegotiationSimulator (file upload input), new upload API, Supabase Storage

---

### FEATURE-005 — User profile completion: display name, contact info, and completion prompt
**Reported:** 2026-03-11

**Context:** The `profiles` table exists (`user_id`, `ai_enabled`, `is_instructor`, `created_at`) but there is no user-facing profile page and no fields for display name, preferred contact info, or any identity beyond the auth email. This creates two problems:

1. **Seam 2 handoff (FEATURE-004):** Surfacing opposing team contact info requires that students have a usable display name and/or a confirmed contact email. The auth email is a fallback but students may prefer a different contact or may not want their auth email shared.
2. **General UX:** Students and instructors appear throughout the admin and instructor UIs as raw UUIDs or raw auth emails. A display name would improve every roster and team list.

**Expected:**
- A `/settings/profile` page (or extension of existing `/settings`) where a user can set: display name, preferred contact email (defaults to auth email), optional phone/Slack/other contact for in-class coordination
- A first-login or module-entry prompt nudging users to complete their profile before joining a session (non-blocking but persistent until dismissed or completed)
- Profile completeness indicator — the handoff panel in FEATURE-004 Seam 2 should warn if opposing team members have incomplete profiles

**Schema addition:**
```sql
ALTER TABLE profiles ADD COLUMN display_name text;
ALTER TABLE profiles ADD COLUMN contact_email text; -- defaults to auth email if null
```

**Affected:** `supabase/migrations/`, new `app/settings/profile/page.tsx`, header/nav (profile link), `ModuleLandingClient` (completion nudge), FEATURE-004 Seam 2 handoff panel

---

## Progress & Completion

### BUG-012 — "Mark as complete" has no visible effect
**Reported:** 2026-03-11 (alpha tester)

**Observed:** Clicking "Mark as complete" on a page (Foundations and likely others) produces no visible feedback and does not appear to update any progress state — no button state change, no progress indicator update, no confirmation.

**Investigation needed:**
- Confirm whether the underlying DB write (`user_module_state` or equivalent progress table) is actually occurring but the UI is not reflecting it, or whether the handler is silently failing
- Check the button's `onClick` handler and whether the API call returns an error that is swallowed
- Check whether `dynamic = 'force-dynamic'` pages revalidate progress state after the action

**Affected:** "Mark as complete" button component, progress API route, progress state hook (`useModuleProgress` or equivalent)

---

## TOC & Layout

### BUG-013 — Three TOC defects: header overlap, scroll tracking, and text truncation
**Reported:** 2026-03-11 (alpha tester)

Three related issues with the right-side Table of Contents panel:

**a. Header overlaps TOC** (`Deconstructing the Term Sheet` and likely other pages with long headings): The page heading bleeds into or overlaps the TOC column. Likely a layout/grid width issue, possibly compounded by BUG-008 (oversized heading font sizes).

**b. Scroll tracking doesn't update:** As the user scrolls down the page the active TOC entry does not bold or highlight to reflect the current section. The TOC renders correctly on load but is static thereafter.

**c. TOC entry text truncated:** On the "Negotiating Term Sheets" page, TOC entries are cut off — full heading text is not visible. Likely a `max-width`, `overflow: hidden`, or `text-overflow: ellipsis` issue in the TOC container.

**Affected:** TOC component (likely `app/components/TableOfContents.tsx` or similar), module page layout grid, scroll observer/IntersectionObserver logic

---

## Links & Navigation

### BUG-014 — Broken links: possible systemic markdown link conversion issue
**Reported:** 2026-03-11 (alpha tester)

**Observed:** Multiple links across pages return 404 or are otherwise non-functional. Reported instances:
- "A Primer on Negotiating Term Sheets" (external) — 404
- "Confidential: For Big Tech Eyes Only" (internal) — 404 (see also BUG-015)
- Michael Porter's *Competitive Strategy* (external) — broken
- "Demo days" (external) — broken

**Two likely root causes:**

**1. Internal link path conversion:** The content originated as GitHub Pages / Jekyll, where internal links reference `.md` filenames (e.g., `[text](other-page.md)`). Jekyll converts these to HTML routes automatically. The current Next.js markdown pipeline does not — `other-page.md` becomes a literal href that resolves to a 404. Internal links need to be converted to platform-relative paths (`/modules/[moduleId]/[slug]`) either at ingest time or via a remark plugin that rewrites `.md` hrefs.

**2. Stale external links:** Some external links may simply be dead (publisher paywalls, removed pages). However, given the number of failures, the internal link conversion issue above should be ruled out first — if the remark pipeline is stripping or mangling all hrefs, external links could be affected too.

**Immediate action:** Audit all link hrefs in the rendered HTML (browser devtools) on the affected pages to determine whether the href values are correct before making content edits. Fix the pipeline issue first if confirmed; then address genuinely dead external links as content updates.

**Affected:** Remark/rehype pipeline (link rewriting), content markdown files (stale external URLs)

---

### BUG-015 — Internal 404: "Confidential: For Big Tech Eyes Only" link
**Reported:** 2026-03-11 (alpha tester)

**Observed:** The link labeled "Confidential: For Big Tech Eyes Only" on the Negotiation Exercise page returns a 404.

**Likely cause:** Either (a) the target page slug no longer exists in the manifest (similar to BUG-003 — stale slug), or (b) the link is a `.md`-style internal link not rewritten by the pipeline (see BUG-014). This may also be a visibility-rules issue if the page is gated to a specific team/side and the tester didn't meet the criteria.

**Affected:** Content markdown, possibly remark link pipeline (BUG-014 dependency)

---

## Content & Pages

### BUG-016 — "Negotiation Tips" Overview section appears empty
**Reported:** 2026-03-11 (alpha tester)

**Observed:** The Overview section of the "Negotiation Tips" page is blank except for a caveat noting the content was AI-generated. No substantive content is visible.

**Investigation needed:**
- Check git log for the relevant markdown file to determine if content was ever present and was removed, or if the section was always a stub
- Confirm whether the content exists in the file but is failing to render (e.g., stripped by the markdown pipeline) vs. genuinely absent

**Affected:** `content/CS01/` (negotiation tips markdown file), git history

---

## Navigation & Developer Tooling

### BUG-017 — "Docs" nav link misdirects students to component/developer documentation
**Reported:** 2026-03-11 (alpha tester)

**Observed:** A "Docs" link in the main nav header leads to `/docs/components` — a component manifest/schema reference intended for module developers. A student tester naturally assumed "Docs" meant course documents and was confused to find what appeared to be technical code.

**Two problems:**
1. **Wrong audience in student nav:** Developer/authoring documentation has no place in the student-facing navigation. The link should be removed from the main nav or restricted to admin/instructor roles.
2. **No proper home for developer documentation:** The content currently at `/docs/components` (module manifest schema, component reference, authoring guide) is genuinely useful but belongs in a dedicated developer wiki or help area — not a first-class nav item. This dovetails with the longer-term need for an `AUTHORING.md` guide noted in BUG-004.

**Proposed fix:** Remove "Docs" from the student nav immediately. Longer term, move developer/authoring documentation to a dedicated `/admin/docs` or `/help/authoring` route accessible only to module owners and admins.

**Affected:** Main nav component (remove or role-gate the "Docs" link), future `/admin/docs` or help route

---

## AI Interaction Framework

### FEATURE-006 — AI interaction type library: catalog, zero-trust safety, and new types
**Reported:** 2026-03-11

**Context:** AI interactions are defined in module manifests as `ai-interaction` nodes and resolved at render time via a component registry (`registry.tsx`). The platform currently has two interaction types:

| Component | Pattern | Status |
|-----------|---------|--------|
| `DocumentAnalyzer` | Structured prompt-and-response against an uploaded/provided document | Implemented |
| `NegotiationSimulator` | Stateful multi-turn conversation with role assignment (team-aware) | Implemented |

Additional types were discussed during early design: **video review**, **financial modeling**, and possibly others. These have not been designed or implemented yet.

---

**Architecture assessment:**

The registry pattern is the right approach for zero-trust use. An owner specifies `ui.component: "NegotiationSimulator"` in their task definition JSON; if that string is not in the platform's registry, nothing renders. Owners cannot introduce arbitrary code. This is the correct guarantee.

**The zero-trust risk is not in the component model — it is in configuration flexibility.** Three surfaces in `lib/ai/schema.ts` currently allow owners to write or access arbitrary data:

1. **`prompt.segments[].template`** — owners write arbitrary text into system/user/assistant prompt templates. A malicious owner can attempt to steer AI outputs, exfiltrate user inputs via the prompt, or jailbreak the model. This is the primary attack surface.

2. **`context[].type === 'dataset'`** — owners can query any DB table with any filter. No table whitelist exists in the schema. A careless or malicious owner could pull data outside their module's scope.

3. **`dataCapture.operations[].table`** — owners specify which DB table to write AI output to. No whitelist. A bad actor could target `profiles`, `module_instructors`, or other sensitive tables.

**Zero-trust hardening required before owner self-service upload:**

- **Prompt validation at ingest:** Validate system prompt templates against a content policy (length cap, no URL-fetching instructions, no known jailbreak patterns). This is imperfect but raises the bar significantly. Consider whether owners should be able to write system prompts at all vs. filling in parameterized slots in a platform-defined frame.
- **Context source whitelist:** `type: 'dataset'` should be restricted to a whitelist of tables/views the platform explicitly permits (e.g., the module's own `module_nodes`, `ai_task_runs`). `path`-based sources (`markdown`, `excerpt`) should be validated to only reference files within the module's own content directory.
- **Data capture whitelist:** `dataCapture.operations[].table` should be restricted to a whitelist of writable tables (likely just `ai_task_runs` and any module-specific output tables). Writes to `profiles`, `teams`, `module_instructors`, etc. must be blocked.
- **Schema-level enforcement:** The Zod schema in `lib/ai/schema.ts` is the right place to enforce these constraints at ingest time — invalid task definitions should be rejected before they reach the DB.

**Tighter component/config split (design consideration):**

Currently the component defines the *frame* (UI, interaction pattern) and the task definition JSON defines almost everything else (prompts, inputs, toggles, data capture). A tighter model: **each component defines its own constraint envelope** — permitted input types, required prompt structure, allowed data capture targets — and the task definition only fills content *within* that envelope. This reduces the owner's attack surface to the content layer and makes safety audits per-type rather than per-task.

---

**Planned interaction types (to be designed):**

| Type | Pattern | Notes |
|------|---------|-------|
| `VideoReviewer` | Student uploads or links a video; AI analyzes transcript/content against rubric | Needs transcript extraction pipeline; likely async |
| `FinancialModelReviewer` | Student uploads a spreadsheet or financial model; AI reviews assumptions, calculations, and reasoning | Needs structured data extraction from XLSX/CSV; output probably structured JSON |
| `CaseAnalyzer` | Student submits a written case analysis; AI evaluates against instructor-defined rubric | Close to `DocumentAnalyzer` but output is evaluative/rubric-scored |
| `PitchCoach` | Multi-turn conversation simulating an investor Q&A after a pitch | Stateful like `NegotiationSimulator`; role is investor |
| `SocraticTutor` | AI asks questions to probe student understanding of a concept rather than answering directly | Distinct UX — AI leads, student responds |

**Prioritization note:** New interaction types should not be added to the registry until the zero-trust hardening above is in place, or they are gated behind human review. The current two types were built alongside the module content by the platform owner; they have not been validated for untrusted owner input.

**Affected:** `lib/ai/schema.ts` (whitelist constraints), `scripts/ingest.ts` (task definition validation), `app/components/ai/registry.tsx` (new component entries), `lib/ai/validation.ts` (prompt safety checks)

---

<!-- Add new items below this line -->
