# Migration Plan: Schema-First Architecture

**Status:** Approved for Execution  
**Date:** January 14, 2026  
**Context:** Moving CS00 to a Schema-First Architecture to enable advanced AI and Hybrid UI.

---

## Track 1: Redesign Foundation (Schema & Ingestion)
**Goal:** Establish the Database as the Source of Truth and decouple content structure from filenames.

### Context
*   Reference: `REDESIGN.TECH.md` (Sections 3.3, 5.1, 6 - Phase 1 & 2)
*   Dependencies: None. Safe to execute alongside current operations.

### Key Deliverables
1.  **Database Migration:** `module_nodes` table in Supabase.
2.  **Manifest Schema:** TypeScript/Zod definition for `module.yaml`.
3.  **Ingestion Engine:** A CLI tool to parse, validate, and sync `module.yaml` to Supabase.
4.  **Content Conversion (CS01):**
    *   `module.yaml` created.
    *   Files renamed (numeric prefixes removed).
    *   Frontmatter stripped.
5.  **Verification:** Successful idempotent sync of the CS01 manifest to the database.

---

## Track 2: Runtime Migration (DB-First Routing)
**Goal:** Switch the application's "Brain" from scanning files to querying the database.

### Context
*   Reference: `REDESIGN.TECH.md` (Section 6 - Phase 3)
*   Dependencies: Track 1 must be complete (Data must be in DB).

### Key Deliverables
1.  **Data Layer Refactor (`lib/content.ts`):**
    *   `getAllModuleIds` -> DB Query.
    *   `getSortedPagesData` -> DB Query (Hierarchy aware).
    *   `getPageData` -> DB Metadata + File Content Fetch.
2.  **Routing Update:** Next.js dynamic routes updated to handle the new nested node structure.
3.  **Metadata Wiring:** Frontend components updated to read metadata from the DB object, not file frontmatter.

---

## Track 3: Hybrid Frontend Engine
**Goal:** Implement the "Dojo" layout strategy and Layout Resolver.

### Context
*   Reference: `FRONTEND_ALTERNATIVES.md`, `REDESIGN.TECH.md` (Section 7)
*   Dependencies: Track 2 recommended (easier to pass layout props from DB).

### Key Deliverables
1.  **Layout Resolver:** High-level component to switch `Reader` vs `Workbench` vs `Immersive`.
2.  **Reader Layout:** Refactor of current card-view into a dedicated component.
3.  **Workbench Layout:** Split-screen component with resizable panes.
4.  **Workbench Context:** Event bus for Guide <-> Artifact communication.
5.  **Pilot:** "The Deal" section of CS01 converted to Workbench mode.

---

## Track 4: AI & Role System Integration
**Goal:** Implement the advanced node types and access control.

### Context
*   Reference: `REDESIGN.TECH.md` (Section 4)
*   Dependencies: Track 2 (Routing) and Track 3 (for Immersive Layout).

### Key Deliverables
1.  **Role Gating:** Middleware/Logic to enforce `visibility_rules`.
2.  **AI Node Renderer:** Component to handle `type: "ai-interaction"`.
3.  **Task Loader:** Logic to load/validate `ai-tasks/*.json`.
4.  **Prompt Injection:** Wiring User Role context into the AI engine.
