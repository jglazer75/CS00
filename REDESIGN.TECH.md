# Technical Design Document: Schema-First Architecture & AI Integration

**Status:** Proposed  
**Date:** January 14, 2026  
**Target System:** CS00 Learning Platform  

---

## 1. Executive Summary

This document proposes a fundamental architectural shift for the CS00 Learning Platform, moving from a filesystem-based routing model to a **Schema-First Architecture**. 

Currently, the platform relies on file naming conventions (e.g., `01-foundations.md`) to dictate structure. This proposal introduces a centralized **Module Manifest (`module.yaml`)** as the single source of truth for module structure, navigation, and behavior. 

This shift is a prerequisite for implementing the "DealCraft" negotiation simulator and other complex AI workflows. It decouples **Content Placement** from **Content Definition**, allowing for reusable AI engines, complex role-based visibility, and non-linear branching scenarios.

---

## 2. Problem Statement

The current architecture, while sufficient for an MVP, presents significant bottlenecks for the platform's roadmap:

1.  **Fragility:** Navigation logic is tightly coupled to filenames. Renaming a file allows for easy reordering but breaks stable URLs and invalidates database records tracking user progress.
2.  **Implicit Relationships:** There is no schema to define conditional logic (e.g., "Unlock Page B only if Quiz A is passed") or role-based access (e.g., "Only 'BigTech' users see this confidential brief").
3.  **Sync Drift:** The database tracks user progress, but the filesystem tracks structure. These two sources of truth inevitably drift, leading to "orphan" progress records.
4.  **Rigid AI Integration:** embedding AI tasks requires hardcoding logic into specific page slugs, making it difficult to reuse the same AI engine (e.g., a Negotiation Bot) across different modules with different contexts.

---

## 3. Core Architecture: Schema-First Design

### 3.1 The Concept
In the new architecture, the **structure** of a module is defined explicitly in a configuration file (Manifest), while the **educational prose** remains in standard Markdown.

*   **Old Model:** File structure = Site structure.
*   **New Model:** `module.yaml` = Site structure. Markdown files are simply data sources referenced by the Manifest.

### 3.2 The Module Manifest (`module.yaml`)
Every module directory will contain a `module.yaml` file. This file defines the hierarchy, routing, and access control.

#### Schema Definition:
```yaml
id: "CS01"
title: "Venture Capital Term Sheet Negotiation"
version: "1.0.0"
roles: ["NewCo", "BigTech", "Observer"]

navigation:
  # Standard Content Page
  - id: "foundations"
    title: "Foundations"
    type: "page"
    content_source: "./pages/foundations.md"
    
  # Nested Section
  - id: "the-deal"
    title: "The Deal"
    type: "section" 
    children:
      - id: "term-sheet-basics"
        title: "Term Sheet Basics"
        content_source: "./pages/deal/basics.md"
        
  # Role-Gated Content
  - id: "confidential-bigtech"
    title: "BigTech Confidential Briefing"
    content_source: "./pages/confidential/bigtech.md"
    visibility: 
      rule: "user.role == 'BigTech'"

  # AI Interaction Node
  - id: "negotiation-sim-01"
    title: "Sim: Term Sheet Battle"
    type: "ai-interaction"
    config: 
        ai_task_id: "dealcraft-negotiator-v1"
        mode: "async-turn-based"
```

### 3.3 The Ingestion Pipeline
We replace runtime filesystem scanning with a deterministic **Ingestion Step** (Admin/Build-time).

1.  **Parse:** The Ingestion Service reads `module.yaml`.
2.  **Validate:** Ensures all `content_source` files exist and `ai_task_id` references are valid.
3.  **Sync:** Upserts records into the Supabase `modules` and `module_nodes` tables.
    *   This guarantees the database is always the runtime source of truth.
    *   Stable UUIDs are assigned based on the Manifest `id`, preserving user progress even if content files are moved.

---

## 4. AI Sub-System Architecture

The redesign introduces a critical separation of concerns for AI: **Placement vs. Definition**.

### 4.1 Concept: Reference vs. Definition
*   **The Manifest (`module.yaml`)**: Defines **Where** the AI tool appears and **What** context (props) it receives.
*   **The Task Definition (`ai-tasks/*.yaml`)**: Defines **How** the AI behaves (Prompt engineering, UI Component, Data Model).

### 4.2 The AI Interaction Node
In `module.yaml`, an AI node is defined as a reference. This allows the same "Engine" to be used in multiple contexts.

```yaml
# module.yaml (The Usage)
- id: "negotiation-sim-01"
  type: "ai-interaction"
  visibility:
    role: ["NewCo", "BigTech"] # Layer 1: Access Control
  config:
    ai_task_id: "dealcraft-negotiator-v1" 
    # Context Injection: These override default props in the task definition
    starting_state_file: "./assets/term-sheet-v1.json" 
    completion_criteria: { min_turns: 5 }
```

### 4.3 The Task Definition Registry
The `ai_task_id` resolves to a definition file (e.g., `ai-tasks/dealcraft-negotiator-v1.yaml`).

```yaml
# ai-tasks/dealcraft-negotiator-v1.yaml (The Blueprint)
meta:
  id: "dealcraft-negotiator-v1"
  component: "NegotiationInterface" # Maps to React Component

prompts:
  system: |
    You are a venture capital negotiation bot.
    The user is playing the role of: {{user.role}}
    Current Module Context: {{module.title}}
    
    {{#if user.role == "NewCo"}}
      Defend the valuation. Do not go below $5M.
    {{/if}}

io_config:
  input_format: "chat"
  output_schema: 
    type: "object"
    properties:
      counter_offer: { type: "number" }

ui_behavior:
  roles:
    NewCo: { theme_color: "blue", avatar: "founder.png" }
    BigTech: { theme_color: "green", avatar: "vc.png" }
```

### 4.4 Role Management Strategy
Roles function at two distinct layers in this architecture:

1.  **Layer 1: Access (The Manifest)**
    *   The `visibility` rule determines if the node is accessible or rendered in the navigation.
    *   *Mechanism:* The frontend checks `user.role` against the Manifest's allowlist before rendering the route.

2.  **Layer 2: Behavior (Prompt Injection)**
    *   The Platform injects the `user` object into the AI Context.
    *   The **System Prompt** uses template variables (e.g., `{{user.role}}`) to dynamically adapt the AI's persona.
    *   *Result:* One Task Definition serves all sides of the negotiation.

---

## 5. Data Model Schema

The Supabase schema must evolve to support the tree-based structure defined in the Manifest.

### 5.1 `module_nodes` Table
Replaces the flat `module_pages` table.

```sql
create table public.module_nodes (
  id uuid primary key default gen_random_uuid(),
  module_id text references public.modules(id),
  
  -- The stable string ID from YAML (e.g., "foundations")
  node_id text not null, 
  
  -- Hierarchical support
  parent_node_id text,   
  
  -- 'page', 'section', 'ai-interaction'
  type text not null,    
  
  title text not null,
  
  -- For 'page' types: path to markdown
  content_source text,   
  
  -- Logic for role-based access/visibility
  visibility_rules jsonb, 
  
  -- Configuration for 'ai-interaction' (task_id, props)
  config jsonb,          
  
  sort_order integer not null,
  unique(module_id, node_id)
);
```

---

## 6. Migration Strategy

### Phase 1: Tooling & Schema
1.  Implement the `module_nodes` table in Supabase.
2.  Develop the `IngestionService` (TypeScript) to parse `module.yaml`, validate references, and perform the DB sync.

### Phase 2: Content Conversion
1.  Create a script to crawl existing `content/CS01` folders.
2.  Generate an initial `module.yaml` mapping the existing numbered files to the new schema.
3.  Strip numeric prefixes from markdown files (e.g., `01-foundations.md` -> `foundations.md`) and remove structural frontmatter.

### Phase 3: Runtime Refactor
1.  Update `lib/content.ts` to fetch structure from Supabase `module_nodes` instead of the filesystem.
2.  Refactor `ModuleNav` and `ModulePage` components to consume the nested/tree-based data structure.

### Phase 4: AI Pilot
1.  Define the `dealcraft-negotiator-v1` Task Definition.
2.  Update `module.yaml` to include the AI node.
3.  Deploy and verify role-based access logic.

---

## 7. Frontend Architecture: The Hybrid Layout Engine

To support the "Hybrid Dojo" experience, the frontend must become layout-aware.

### 7.1 Schema Extensions
The `module_nodes` table and `module.yaml` will support a `layout` configuration property.

```yaml
# module.yaml
- id: "the-exercise"
  type: "section"
  # New layout property
  layout: "workbench" 
  
  # Layout-specific configuration
  layout_config:
    secondary_component: "PDFViewer"
    secondary_source: "./assets/term-sheet.pdf"
```

### 7.2 The LayoutResolver Component
We will introduce a `LayoutResolver` at the top level of the Module Page (`app/modules/[moduleId]/[slug]/page.tsx`).

**Logic:**
1.  Fetch the current node's data from Supabase.
2.  Read the `layout` property (defaulting to "reader" if undefined).
3.  Render the appropriate shell component:
    *   `ReaderLayout`: Standard centered column, sticky TOC.
    *   `WorkbenchLayout`: Resizable split-pane. Passes `content_source` to Left Pane and `layout_config` to Right Pane.
    *   `ImmersiveLayout`: Fullscreen, no sidebar. Used for "Journey" steps.

### 7.3 State Synchronization (The Workbench)
For the Split-Screen "Workbench" mode, the Left Pane (Guide) and Right Pane (Artifact) must communicate.

*   **Shared Context:** A `WorkbenchContext` will act as the bus.
*   **Action:** When a user clicks a "Hotspot" in the Markdown guide (e.g., `[See Liquidation Clause]`), it dispatches an event: `{ type: 'FOCUS_ARTIFACT', target: 'clause-4.2' }`.
*   **Reaction:** The Right Pane (PDF Viewer) listens for this event and scrolls/zooms to the relevant section.
*   **Reverse Flow:** Clicking an element in the Right Pane can highlight the explanation in the Left Pane guide.