# Implementation Plan: AI Gateway Foundation

## Phase 1: Database & Backend Core
- [x] Task: Supabase Schema Setup
    - [x] Create `user_ai_providers` table with RLS.
    - [x] Create `ai_request_cache` table with RLS and index.
    - [x] Create `ai_task_runs` table for telemetry.
    - [x] Add migration files to `supabase/migrations`.
- [x] Task: AI Library Scaffolding
    - [x] Implement `lib/ai/schema.ts` (Zod definitions).
    - [x] Implement `lib/ai/providers/base.ts` and `gemini.ts`.
    - [x] Implement `lib/ai/providerResolver.ts` (Logic to pick keys).
    - [x] Implement `lib/ai/cache.ts` (DB caching logic).

## Phase 2: The Gateway API
- [x] Task: Implement API Route
    - [x] Create `app/api/ai/route.ts`.
    - [x] Wire up Auth -> Resolver -> Cache -> Adapter flow.
    - [x] Implement error handling and standard response format.
- [x] Task: Task Loading Logic
    - [x] Implement `lib/ai/taskLoader.ts` to read JSON from file system.
    - [x] Validate JSON against schema.
    - [x] Create `app/api/ai/tasks/[moduleId]/[taskId]/route.ts` (optional, or handle inside main route) to serve task config to frontend if needed (or pass via page props). *Decision: Pass via page props preferred for static generation benefits.*

## Phase 3: Content Integration
- [x] Task: Update Content Engine
    - [x] Modify `lib/content.ts` to scan `content/[id]/ai-tasks/`.
    - [x] Attach `aiTasks` array to `getPageData` response.
- [x] Task: Authoring Guide
    - [x] Create `docs/module-author-guide.md`.
    - [x] Document JSON schema and component options.

## Phase 4: Frontend MVP
- [x] Task: AI Component Registry
    - [x] Create `app/components/ai/registry.tsx`.
    - [x] Create stub `DocumentAnalyzer` component.
- [x] Task: Anchor Rendering
    - [x] Update `ModulePageContent.tsx` (or `MarkdownContent.tsx`) to replace anchors with Registry components.
    - [x] Hydrate components with props from the loaded task JSON.
- [x] Task: Settings Page
    - [x] Create `app/admin/settings/ai/page.tsx` (or similar).
    - [x] Allow users to save encrypted keys to `user_ai_providers`.

## Phase 5: Verification
- [x] Task: End-to-End Test
    - [x] Create a dummy AI task in `CS01`.
    - [x] Verify `DocumentAnalyzer` renders.
    - [x] Verify submission triggers API and returns cached/live response.