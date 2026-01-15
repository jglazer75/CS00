# Specification: AI Gateway Foundation

## 1. Overview
The AI Gateway is a secure, serverless API route (`/api/ai`) that mediates all interactions between the learner's browser and third-party LLM providers (e.g., Google Gemini, OpenAI). It enforces authentication, rate limiting (via caching), and provider abstraction.

## 2. Core Components

### 2.1 Backend Architecture
*   **API Route:** `app/api/ai/route.ts`
    *   Handles POST requests with `{ moduleId, taskId, payload }`.
    *   Authenticates user via Supabase.
    *   Resolves the appropriate AI provider (System Default vs. User Defined).
    *   Checks `ai_request_cache` before calling external APIs.
    *   Logs interaction to `ai_task_runs` (if configured in task).

*   **Provider Adapters:**
    *   `lib/ai/providers/base.ts`: Abstract base class/interface.
    *   `lib/ai/providers/gemini.ts`: Implementation for Google Gemini.
    *   `lib/ai/adapterFactory.ts`: Factory to instantiate adapters based on configuration.

*   **Task Logic:**
    *   `lib/ai/taskLoader.ts`: Loads and validates `task.json` files from `content/`.
    *   `lib/ai/validation.ts`: Zod schemas for task definitions.

### 2.2 Database Schema (Supabase)
*   **`user_ai_providers`**: Stores encrypted API keys for users bringing their own keys.
*   **`ai_request_cache`**: Caches LLM responses to reduce costs and latency.
*   **`ai_task_runs`**: Logs execution history.

### 2.3 Content Engine Integration
*   **Task Definition:** JSON files located in `content/[ModuleID]/ai-tasks/[taskId].json`.
*   **Content Parser:** Update `lib/content.ts` to detect `ai-tasks` directory and inject task metadata into the page payload.
*   **Anchor Resolution:** Frontend must detect `<!-- AI_TASK_ANCHOR: ... -->` and render the corresponding component.

### 2.4 Frontend Components
*   **Component Registry:** `app/components/ai/registry.tsx` mapping task `ui.component` strings to React components.
*   **Document Analyzer:** `app/components/ai/DocumentAnalyzer.tsx` (MVP component).
*   **Settings Page:** `/settings/ai-providers` for users to manage keys.

## 3. Security
*   All API keys are stored encrypted (if in DB) or as env vars (system default).
*   Keys never exposed to client.
*   API route enforces `auth.uid()` check.

## 4. Testing
*   Unit tests for `taskLoader` and `validation`.
*   Integration test for `gemini` adapter (using mocked fetch or separate integration suite).
