# Specification: Runtime Migration (DB-First Routing)

## 1. Overview
This track executes the core runtime switch from filesystem-based routing to database-driven routing using the `module_nodes` table populated in the previous track. It involves refactoring the data layer (`lib/content.ts`) and updating the Next.js page generation logic.

## 2. Goals
- Eliminate runtime dependency on the filesystem for navigation structure.
- Enable `generateStaticParams` to fetch routes from Supabase.
- Update `ModuleNav` and page components to handle nested node structures (sections vs. pages) derived from the DB.

## 3. Deliverables

### 3.1 Data Layer Refactor (`lib/content.ts`)
- **`getAllModuleIds`**:
    - **Old:** `fs.readdir` on `content/`
    - **New:** Select `id` from `modules` table (via `getSupabaseServerClient`).
- **`getSortedPagesData`**:
    - **Old:** `fs.readdir` + frontmatter parse.
    - **New:** Query `module_nodes` where `module_id = $1`. Return tree structure (preserving hierarchy).
- **`getPageData`**:
    - **Old:** `fs.readFileSync` + metadata parse.
    - **New:**
        1. Query `module_nodes` by `module_id` and `node_id`.
        2. If node is a page, read `content_source` path.
        3. If running in Vercel (production), fetch content from Blob Storage (Future) or bundled files (Current fallback).
        4. *For this track:* Continue reading content body from filesystem using the `content_source` path stored in DB.

### 3.2 Routing Update (`app/modules/[moduleId]/[slug]/page.tsx`)
- Update `generateStaticParams` to call new `getAllModuleIds` and `getSortedPagesData`.
- Refactor page component to receive the Node object from DB instead of flat file data.

### 3.3 Frontend Component Updates
- **`ModuleNav`**: Update recursive rendering logic to handle Sections (collapsible) and Pages.
- **`ModulePageClient`**: Ensure it correctly displays metadata from the DB node object.

## 4. Acceptance Criteria
- [ ] Application builds without errors.
- [ ] `/modules/CS01` renders the navigation correctly based on `module.yaml` structure (synced to DB).
- [ ] Navigation works: clicking a link loads the correct content.
- [ ] `generateStaticParams` generates routes for all DB-defined pages.
- [ ] No file system scanning for *structure* (only content body reading allowed).
