# Specification: Redesign Foundation (Schema & Ingestion)

## 1. Overview
This track implements the foundational data layer for the Schema-First Architecture. It involves creating the necessary database schema, defining the Manifest file format (`module.yaml`), and building an Ingestion Service to sync the manifest to the database.

## 2. Goals
- Decouple module structure from the filesystem.
- Establish Supabase (`module_nodes` table) as the single source of truth for runtime navigation.
- Enable rich metadata and hierarchical structures via `module.yaml`.
- Convert the pilot module `CS01` to the new format.

## 3. Deliverables

### 3.1 Database Schema
- **Table:** `module_nodes`
    - `id` (uuid, PK)
    - `module_id` (fk -> modules.id)
    - `node_id` (text, unique per module)
    - `parent_node_id` (text, nullable)
    - `type` (enum: 'page', 'section', 'ai-interaction')
    - `title` (text)
    - `content_source` (text, nullable)
    - `visibility_rules` (jsonb)
    - `config` (jsonb) - for layout/AI props
    - `metadata` (jsonb)
    - `sort_order` (int)

### 3.2 Manifest Schema (`lib/schema/manifest.ts`)
- Zod schema defining the structure of `module.yaml`.
- Must support recursive nesting (sections containing pages/sections).
- Validation rules for `id` formats and required fields.

### 3.3 Ingestion Service (`scripts/ingest.ts`)
- CLI tool runnable via `npm run ingest`.
- **Logic:**
    1. Scan `content/` for directories with `module.yaml`.
    2. Parse and validate YAML against Zod schema.
    3. Verify existence of referenced `content_source` files.
    4. Perform idempotent sync (Upsert) to Supabase.
        - Match on `(module_id, node_id)`.
        - Prune nodes present in DB but missing from Manifest.

### 3.4 Content Migration (CS01)
- Create `content/CS01/module.yaml` reflecting current structure.
- Rename files: `01-foundations.md` -> `foundations.md`.
- Remove frontmatter from markdown files.

## 4. Acceptance Criteria
- [ ] `module_nodes` table exists in Supabase.
- [ ] `npm run ingest` runs without errors.
- [ ] `CS01` structure is correctly populated in `module_nodes`.
- [ ] Modifying `module.yaml` and re-running ingest updates the DB correctly.
