# Implementation Plan: Redesign Foundation

## Phase 1: Database & Schema Definition [checkpoint: e9e4f49]
- [x] Task: Create `module_nodes` migration [commit: 7c2fe67]
    - [x] Create Supabase migration file `supabase/migrations/<timestamp>_create_module_nodes.sql`.
    - [x] Define table schema with RLS policies.
    - [x] Apply migration locally and verify.
- [x] Task: Define Manifest Zod Schema [commit: 882258c]
    - [x] Create `lib/schema/manifest.ts`.
    - [x] Define types for `ModuleManifest`, `ModuleNode`, `VisibilityRule`.
    - [x] Write unit tests for schema validation (valid/invalid yamls).
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database & Schema Definition' (Protocol in workflow.md)

## Phase 2: Ingestion Service [checkpoint: 2f857c7]
- [x] Task: Scaffold Ingestion Script [commit: ebfd7b3]
    - [x] Create `scripts/ingest.ts`.
    - [x] Implement `loadManifest(path)` function.
    - [x] Implement `validateManifest(manifest)` function.
- [x] Task: Implement DB Sync Logic [commit: 0d2bb83]
    - [x] Implement `syncModule(module)` function.
    - [x] Implement recursive node upsert logic.
    - [x] Implement deletion logic for removed nodes.
- [x] Task: Implement File Verification [commit: 16b1fc4]
    - [x] Add check to ensure `content_source` paths exist on disk.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Ingestion Service' (Protocol in workflow.md)

## Phase 3: Content Migration (CS01)
- [x] Task: Create Module Manifest [commit: 6cd7384]
    - [ ] Analyze `content/CS01` structure.
    - [ ] Author `content/CS01/module.yaml` mapping all existing pages.
- [x] Task: Clean Content Files [commit: 0f91c50]
    - [ ] Rename markdown files (remove prefixes).
    - [ ] Strip YAML frontmatter from all CS01 markdown files.
- [~] Task: Run Ingestion & Verify
    - [ ] Execute `npm run ingest`.
    - [ ] Verify Supabase table data matches `module.yaml`.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Content Migration (CS01)' (Protocol in workflow.md)
