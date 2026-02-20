# Technology Stack (Auto-generated)

> [!IMPORTANT]
> This file is automatically updated by `scripts/update-tech-stack.ts`. Do not edit manually.
> Last Updated: 2026-02-20T15:51:20.210Z

## 1. Frontend & UI
*   **Next.js 15.5.9:** React-based framework for high-performance web applications and server-side rendering.
*   **MUI (Material UI) 7.3.4:** Comprehensive UI component library for implementing Google's Material Design system.
*   **Tailwind CSS 4:** Utility-first CSS framework for rapid UI development and consistent styling.
*   **TypeScript 5:** Strongly typed programming language for enhanced productivity and code quality.

## 2. Backend & Services
*   **Supabase (@supabase/supabase-js 2.76.1):** Backend-as-a-Service providing PostgreSQL, Auth, and Real-time.
    *   **Features Active:** Progress Tracking, AI Provider Management, AI Request Caching.
*   **Vercel:** Cloud platform for static site hosting and serverless functions.

## 3. Architectural Patterns

### 3.1 Schema-First Architecture
The platform is transitioning to a schema-first approach where module structure is defined in a centralized `module.yaml` manifest.

### 3.2 The Ingestion Pipeline
A dedicated ingestion step (`scripts/ingest.ts`) parses module manifests and synchronizes the defined structure to Supabase.

### 3.3 The AI Gateway
A provider-agnostic gateway (`app/api/ai/route.ts`) handles all AI interactions, including provider selection and prompt-hash caching.

## 4. Content Processing
*   **Remark & Gray-matter:** Toolset for parsing and processing Markdown content and YAML frontmatter.
*   **Zod 4.3.5:** TypeScript-first schema validation used for manifest and AI task validation.
*   **Content Engine:** Custom logic (`lib/content.ts`) for dynamically rendering Markdown files from the repository.
