# Implementation Plan: Runtime Migration (DB-First Routing)

## Phase 1: Data Layer Refactor [checkpoint: 8beecc3]
- [x] Task: Create DB-backed `getAllModuleIds` 42064b3
    - [ ] Update `lib/content.ts` to fetch modules from Supabase.
    - [ ] Add caching/memoization if necessary.
- [x] Task: Create DB-backed `getModuleStructure` 4cc9866
    - [ ] Implement `getModuleStructure(moduleId)` in `lib/content.ts`.
    - [ ] Query `module_nodes` and reconstruct the tree structure (sections -> children).
- [x] Task: Refactor `getPageData` f6ed1cf
    - [ ] Update to fetch node metadata from DB.
    - [ ] Keep file reading logic for content body only, using `content_source` from DB.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Data Layer Refactor' (Protocol in workflow.md)

## Phase 2: Frontend Integration
- [x] Task: Update `generateStaticParams` 3f4dba7
    - [ ] Modify `app/modules/[moduleId]/[slug]/page.js` (or `.tsx`) to use the new DB functions.
    - [ ] Ensure nested routes are handled if necessary (currently flat `[slug]` might need adjustment or mapping).
- [x] Task: Refactor `ModuleNav` Component a8b965c
    - [ ] Update component to render the hierarchical structure returned by `getModuleStructure`.
    - [ ] Implement collapsible sections if not present.
- [~] Task: Verify Metadata Flow
    - [ ] Ensure page titles, descriptions, and learning objectives are correctly passed from DB to the UI components.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Frontend Integration' (Protocol in workflow.md)
