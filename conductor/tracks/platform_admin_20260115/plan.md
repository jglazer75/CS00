# Implementation Plan: Module-Level AI Configuration

## Phase 1: Database Schema
- [x] Task: Create `module_ai_settings` table
    - [x] Write Supabase migration SQL.
    - [x] Enable RLS and add policies for Admin access.

## Phase 2: Gateway Logic
- [x] Task: Update `providerResolver.ts`
    - [x] Implement `lookupModuleProvider` function.
    - [x] Insert it into the resolution chain between User and System.

## Phase 3: Admin UI
- [x] Task: Admin Layout & Navigation
    - [x] Ensure `/admin` routes are protected.
    - [x] Create a module list page at `/admin/modules`.
- [x] Task: Module AI Settings Page
    - [x] Create `app/admin/modules/[moduleId]/ai/page.tsx`.
    - [x] Implement form state and Supabase client-side upsert logic.

## Phase 4: Verification
- [ ] Task: End-to-End Test
    - [ ] Configure a key for `CS01` via the Admin UI.
    - [ ] Run the "AI Gateway Test" task.
    - [ ] Verify (via logs or temporary debug output) that the Module Key was used instead of the System Key.