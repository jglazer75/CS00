# Architecture Redesign Proposal: The Schema-First Content Engine

## 1. Executive Summary

The current architecture relies heavily on filesystem conventions (numbered filenames, frontmatter) to define the structure and behavior of learning modules. While this allowed for a rapid MVP, it has created fragility and rigidity. Complex features like branching scenarios, role-based visibility, and deep AI integration are becoming difficult to implement without "hacking" the markdown parser.

This proposal outlines a shift to a **Schema-First Architecture**. In this model, the *structure* of a module is defined explicitly in a configuration file (Manifest), while the *content* remains in Markdown. This separation of concerns will unlock greater stability, extensibility, and the advanced interactive features required by the roadmap.

## 2. Current Limitations

*   **Fragile Navigation:** Page ordering and slugs are tied to filenames (e.g., `01-foundations.md`). Renaming a file to change its order breaks its URL and any database records tracking progress against it.
*   **Limited Metadata:** Frontmatter is stuck inside individual files. Getting a high-level view of a module (e.g., "What are all the learning objectives for Module 1?") requires parsing every single file.
*   **Implicit Relationships:** There is no easy way to define complex relationships, such as "Page B is only unlocked if Quiz A is passed" or "Page C is only visible to users with the 'BigTech' role."
*   **Syncing Drift:** The database tracks user progress, but the filesystem tracks structure. These two sources of truth easily drift out of sync, leading to errors where users have progress on pages that no longer exist.

## 3. Proposed Architecture

### 3.1 The Module Manifest (`module.yaml`)

We will introduce a strict schema for defining a module. Every module directory will contain a `module.yaml` (or `.json`) file that acts as the single source of truth for that module's structure.

**Example Structure:**

```yaml
id: "CS01"
title: "Venture Capital Term Sheet Negotiation"
version: "1.0.0"
description: "A deep dive into the dynamics of early-stage financing."
roles: ["NewCo", "BigTech", "Observer"]

navigation:
  - id: "foundations"
    title: "Foundations"
    type: "page"
    content_source: "./pages/foundations.md"
    
  - id: "the-deal"
    title: "The Deal"
    type: "section" # Sections can have children
    children:
      - id: "term-sheet-basics"
        title: "Term Sheet Basics"
        content_source: "./pages/deal/basics.md"
        learning_objectives: ["Define pre-money valuation", "Understand liquidity"]
        
      - id: "negotiation-sim"
        title: "The Negotiation"
        type: "ai-interaction" # Specialized content type
        config: 
            ai_task_id: "dealcraft-sim-v1"
            role_required: true

  - id: "confidential-bigtech"
    title: "BigTech Confidential Briefing"
    content_source: "./pages/confidential/bigtech.md"
    visibility: 
      rule: "user.role == 'BigTech'" # Logic-based visibility
```

### 3.2 Decoupled Content Files

Markdown files (e.g., `foundations.md`) will no longer need numeric prefixes or structural frontmatter. They will purely contain the educational content (text, images, local components).
-   **Old:** `01-foundations.md` (Contains title, order, etc.)
-   **New:** `foundations.md` (Contains just the text. Title and Order are in `module.yaml`.)

### 3.3 The Ingestion Pipeline

We will replace the runtime filesystem scanning with a build-time (or administrative) **Ingestion Step**.

1.  **Parse:** The Ingester reads `module.yaml`.
2.  **Validate:** It ensures all referenced files exist and that the structure is valid.
3.  **Sync:** It upserts records into the `modules` and `module_pages` tables in Supabase.
    -   This ensures the database *always* matches the defined structure.
    -   It assigns stable UUIDs to pages based on their string `id` in the YAML, preserving progress tracking even if the content file moves.

### 3.4 Runtime Flow

1.  **Client Request:** User visits `/modules/CS01`.
2.  **Data Fetch:** The application queries **Supabase** (not the filesystem) to get the module structure, navigation, and user progress.
3.  **Content Resolution:** 
    -   For the *structure*, it uses the DB response.
    -   For the *body content*, it fetches the processed HTML/Markdown. (In a serverless environment, the text content can be bundled or fetched from a KV store/blob storage populated during ingestion).

## 4. Data Model Changes

The Supabase schema will need to evolve to support this richer structure.

```sql
-- Enhanced Module Pages Table
create table public.module_nodes (
  id uuid primary key default gen_random_uuid(),
  module_id text references public.modules(id),
  node_id text not null, -- The string ID from YAML (e.g., "foundations")
  parent_node_id text,   -- Support for nested hierarchy
  type text not null,    -- 'page', 'section', 'ai-interaction'
  title text not null,
  content_source text,   -- Path to file (if applicable)
  visibility_rules jsonb, -- Logic for role-based access
  metadata jsonb,        -- Learning objectives, tags, etc.
  sort_order integer not null,
  unique(module_id, node_id)
);
```

## 5. Benefits for AI & DealCraft

This architecture is critical for the **DealCraft** negotiation simulator:
1.  **State Management:** We can define the negotiation "node" in the YAML with specific configurations (e.g., "Use Prompt V2", "Allow Audio").
2.  **Branching:** The manifest can support conditional paths. "If User Score > 80, unlock Advanced Negotiation."
3.  **Role Injection:** The architecture natively understands that `confidential-bigtech.md` is tied to the `BigTech` role, preventing data leaks.

## 6. Migration Strategy

1.  **Tooling:** Build the `IngestionService` (TypeScript class) that parses YAML and writes to Supabase.
2.  **Conversion:** Write a script to convert the existing `content/CS01` folder into a `module.yaml` and clean markdown files.
3.  **Update UI:** Refactor `ModuleNav` and `ModulePage` to consume the new DB-first data structure.
4.  **Verify:** Run the ingestion locally and verify the app renders correctly.
