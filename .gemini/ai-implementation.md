# AI Implementation Plan: A Provider-Agnostic AI Gateway

This document outlines the complete architecture and implementation plan for a modular, flexible, and extensible AI system within the learning platform.

---

## 1. Overview & Core Concepts

The goal is to create a system where interactive, AI-powered exercises can be authored and embedded directly into learning modules without requiring code changes. The system must be provider-agnostic, allowing users and teams to configure their own AI models (e.g., OpenAI, Anthropic) while providing a default (Gemini).

This will be achieved through a **Provider-Agnostic AI Gateway** architecture.

### Core Concepts

*   **AI Gateway:** A centralized API route (`/api/ai`) that acts as a smart router. All AI requests from the frontend go through this single endpoint. It handles authentication, provider selection, credential management, and task orchestration.
*   **AI Task Definition:** A JSON file that serves as a complete blueprint for an AI-powered exercise. It defines not only the AI prompt but also the UI component to be used, its placement on the page, and its input/output contract. This allows non-developers to author complex AI interactions.
*   **AI Component Registry:** A mapping of component names (defined in the Task Definition) to actual, reusable React components built with MUI and conforming to the platform's design standards.
*   **Provider Adapters:** A set of classes on the backend, each responsible for translating a generic AI request from the gateway into the specific format required by a particular AI provider (e.g., a `GeminiAdapter`, an `OpenAIAdapter`).

---

## 2. Detailed Architecture

### 2.1. Database Schema (Supabase)

Two new tables are required to manage AI provider settings.

#### `user_ai_providers`
Stores individual user credentials for different AI services.

```sql
CREATE TABLE public.user_ai_providers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL, -- e.g., 'gemini', 'openai'
    encrypted_api_key TEXT NOT NULL, -- Encrypted at rest
    model_preferences jsonb, -- e.g., {"default": "gpt-4o"}
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own AI providers"
    ON public.user_ai_providers
    FOR ALL USING (auth.uid() = user_id);
```

#### `team_ai_settings` (For Phase II)
Stores the team admin's choice of which user's provider configuration the team should use.

```sql
CREATE TABLE public.team_ai_settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    selected_user_provider_id uuid REFERENCES public.user_ai_providers(id) ON DELETE SET NULL,
    allow_system_fallback BOOLEAN DEFAULT true,
    updated_at timestamptz DEFAULT now()
);
-- RLS policies will allow team admins to manage this table.
```

### 2.2. Content Layer: The AI Task Definition

This is the core of the authoring experience. For each AI task in a module (e.g., `CS01`), a corresponding file is created at `content/CS01/ai-tasks/[task-name].json`.

**Structure of `[task-name].json`:**
```json
{
  "description": "A brief explanation of what this task does.",
  "placement": {
    "page_slug": "03-the-exercise",
    "anchor_id": "unique-anchor-for-this-task"
  },
  "ui": {
    "component": "DocumentAnalyzer",
    "props": {
      "title": "AI-Powered Term Sheet Analysis",
      "description": "Upload your redlined term sheet (.docx or .pdf) to receive an instant analysis based on the case study's objectives.",
      "submitButtonText": "Analyze My Document"
    }
  },
  "inputs": [
    {
      "type": "file",
      "name": "document_to_analyze",
      "accept": [".docx", ".pdf"]
    }
  ],
  "outputs": {
    "format": "markdown"
  },
  "system_prompt_template": [
    "You are an expert legal AI specializing in venture capital deals.",
    "Your analysis should be based on the context provided in the following documents: {{content:CS01/01-foundations.md}} and {{content:CS01/02-the-deal.md}}.",
    "The user has submitted a document named {{inputs:document_to_analyze:fileName}}. Its content is: {{inputs:document_to_analyze:fileContent}}.",
    "Return your response as a markdown-formatted string."
  ],
  "allowed_database_operations": [
    {
      "action": "insert",
      "table": "user_document_analysis",
      "schema": {
        "user_document_id": "uuid",
        "analysis_summary": "text"
      }
    }
  ]
}
```

### 2.3. API Layer: The AI Gateway

A single serverless function at `app/api/ai/route.ts` will handle all AI requests.

**Logic:**
1.  Receives a request: `{ "moduleId": "CS01", "taskName": "term-sheet-analysis", "data": { ... } }`.
2.  Authenticates the user via Supabase.
3.  **Provider Selection:**
    *   Checks `team_ai_settings` for the user's team.
    *   If not found, checks `user_ai_providers` for the user's personal setting.
    *   If not found, falls back to the system default Gemini provider (credentials in Vercel env vars).
4.  **Task Orchestration:**
    *   Reads the corresponding `[task-name].json` file.
    *   Constructs the final prompt, replacing template variables like `{{inputs:...}}` and `{{content:...}}` with the actual data.
5.  **Execution:**
    *   Instantiates the correct Provider Adapter (e.g., `GeminiAdapter`).
    *   Passes the constructed prompt to the adapter.
    *   The adapter makes the provider-specific API call.
6.  **Response & Database Interaction:**
    *   The adapter normalizes the AI's response.
    *   If the AI's response requests a database operation (and it's listed in `allowed_database_operations`), the gateway safely performs the operation.
    *   Returns a standardized response to the frontend.

### 2.4. Frontend Layer: Dynamic Component Rendering

The frontend will be responsible for discovering and rendering the AI tasks.

1.  **Content Parsing (`lib/content.ts`):** The `getPage-data` function will be updated to scan the module's `/ai-tasks` directory. If it finds a task whose `placement.page_slug` matches the current page, it will parse the JSON and inject it into an `aiTasks` array in the page data object.

2.  **Component Rendering (`ModulePageContent.tsx`):**
    *   The component will receive the `aiTasks` array.
    *   When rendering the markdown content (`chunks`), it will scan the HTML for anchor comments (e.g., `<!-- AI_TASK_ANCHOR: unique-anchor-for-this-task -->`).
    *   When an anchor is found, it will replace the comment with the React component specified in the corresponding task's `ui.component` field, passing the `ui.props`.
    *   A new `app/components/ai/` directory will house these reusable, pre-styled MUI components (`DocumentAnalyzer.tsx`, etc.).

### 2.5. Caching & Optimization Layer

To manage costs and improve performance, the AI Gateway will include a caching layer that intercepts requests and returns stored responses for identical, repeated queries.

#### `ai_request_cache` Table (Supabase)
A new table will store AI responses.

```sql
CREATE TABLE public.ai_request_cache (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key TEXT NOT NULL UNIQUE, -- A SHA256 hash of the final prompt + model name
    response_data jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT now() + INTERVAL '30 day'
);

-- Create an index for faster lookups on the cache key
CREATE INDEX idx_ai_request_cache_key ON public.ai_request_cache(cache_key);

-- Optional: Create a cron job in Supabase to periodically delete expired rows
SELECT cron.schedule('daily-cache-cleanup', '0 0 * * *', 'DELETE FROM public.ai_request_cache WHERE expires_at < now()');
```

> **Architectural Note on Caching:**
> The initial implementation uses PostgreSQL for caching primarily for **simplicity**. It leverages our existing database infrastructure, avoiding the need to add and manage a separate service. For this application's use case, where the primary latency comes from the multi-second response time of the AI provider, the performance of a properly indexed Postgres table is more than sufficient.
>
> A higher-performance alternative is **Vercel KV**, a serverless, Redis-compatible in-memory store. Should the platform's performance requirements evolve, the AI Gateway's encapsulated design allows for a straightforward migration. The caching logic can be swapped from a Postgres query to a Vercel KV query with minimal changes to the surrounding architecture.

#### Updated AI Gateway Logic with Caching

The gateway's logic will be amended with a new step:

1.  Receives a request.
2.  Authenticates the user.


#### Updated AI Gateway Logic with Caching

The gateway's logic will be amended with a new step:

1.  Receives a request.
2.  Authenticates the user.
3.  Provider Selection.
4.  Task Orchestration & Final Prompt Construction.
5.  **Check Cache:**
    *   Generate a SHA256 hash of the final prompt string combined with the selected model identifier (e.g., `gemini-1.5-pro`). This is the `cache_key`.
    *   Query the `ai_request_cache` table for a non-expired entry with this key.
    *   **Cache Hit:** If a valid entry is found, return the `response_data` immediately and terminate the process.
    *   **Cache Miss:** If no entry is found, proceed to the next step.
6.  **Execution (API Call):**
    *   Instantiate the Provider Adapter and make the external API call.
7.  **Response & Database Interaction:**
    *   On successful response from the AI provider, **store the result in the cache table** with the `cache_key` before returning the data to the user.
    *   Handle database operations as previously defined.
    *   Return the response to the frontend.

This caching mechanism ensures that the system is efficient and cost-effective, as it avoids redundant API calls for identical tasks while guaranteeing that any change in the input prompt results in a fresh, uncached request.

---

## 3. Implementation Steps

1.  **Create Documentation:**
    *   Create a new page at `/docs/module-author-guide` that details the module structure, frontmatter, and the complete AI Task Definition file format.

2.  **Backend Setup:**
    *   Create the `user_ai_providers` and `ai_request_cache` tables in Supabase.
    *   Create the AI Gateway API route at `app/api/ai/route.ts`.
    *   Implement the provider selection, **caching logic**, and task orchestration.
    *   Create the initial `GeminiAdapter`.

3.  **Content Engine Update:**
    *   Modify `lib/content.ts` to find and parse `ai-tasks` JSON files and attach them to the page data.

4.  **Frontend Development:**
    *   Create the `app/components/ai/` directory.
    *   Build the first AI component, `DocumentAnalyzer.tsx`, as a placeholder with UI but no backend connection.
    *   Update `ModulePageContent.tsx` to implement the anchor-based rendering logic.
    *   Build the settings page at `/settings/ai-providers` for users to manage their API keys.

5.  **Initial Module Implementation:**
    *   Create the `content/CS01/ai-tasks/` directory.
    *   Create the `term-sheet-analysis.json` file with the full task definition.
    *   Add the anchor `<!-- AI_TASK_ANCHOR: term-sheet-analysis-anchor -->` to the `03-the-exercise.md` file.

This plan establishes a powerful, scalable, and author-friendly framework for integrating AI into the learning platform.
