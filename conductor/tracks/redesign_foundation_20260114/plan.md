# Implementation Plan: Redesign Foundation

## Phase 1: Database & Schema Definition
- [x] Task: Create `module_nodes` migration [commit: 7c2fe67]
    - [ ] Create Supabase migration file `supabase/migrations/<timestamp>_create_module_nodes.sql`.
    - [ ] Define table schema with RLS policies.
    - [ ] Apply migration locally and verify.
- [ ] Task: Define Manifest Zod Schema
    - [ ] Create `lib/schema/manifest.ts`.
    - [ ] Define types for `ModuleManifest`, `ModuleNode`, `VisibilityRule`.
    - [ ] Write unit tests for schema validation (valid/invalid yamls).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database & Schema Definition' (Protocol in workflow.md)

## Phase 2: Ingestion Service
- [ ] Task: Scaffold Ingestion Script
    - [ ] Create `scripts/ingest.ts`.
    - [ ] Implement `loadManifest(path)` function.
    - [ ] Implement `validateManifest(manifest)` function.
- [ ] Task: Implement DB Sync Logic
    - [ ] Implement `syncModule(module)` function.
    - [ ] Implement recursive node upsert logic.
    - [ ] Implement deletion logic for removed nodes.
- [ ] Task: Implement File Verification
    - [ ] Add check to ensure `content_source` paths exist on disk.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Ingestion Service' (Protocol in workflow.md)

## Phase 3: Content Migration (CS01)
- [ ] Task: Create Module Manifest
    - [ ] Analyze `content/CS01` structure.
    - [ ] Author `content/CS01/module.yaml` mapping all existing pages.
- [ ] Task: Clean Content Files
    - [ ] Rename markdown files (remove prefixes).
    - [ ] Strip YAML frontmatter from all CS01 markdown files.
- [ ] Task: Run Ingestion & Verify
    - [ ] Execute `npm run ingest`.
    - [ ] Verify Supabase table data matches `module.yaml`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Content Migration (CS01)' (Protocol in workflow.md)
