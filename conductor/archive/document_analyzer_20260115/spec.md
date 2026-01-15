# Specification: Document Analyzer Blueprint

## 1. Component: `DocumentAnalyzer`
A reusable React component built with MUI that handles the learner's interaction with a single-shot AI task.

### Features
*   **File Dropzone:** Supports PDF and DOCX uploads.
*   **Text Inputs:** Renders additional textareas or fields defined in the task JSON.
*   **Progress Tracking:** Show loading states while extracting text and awaiting AI response.
*   **Markdown Result:** Renders the AI response (typically feedback/analysis) as markdown.
*   **Error Handling:** Displays clear, actionable errors if extraction or API fails.

## 2. Extraction Pipeline
Since the AI Gateway expects text content, the platform must extract text from uploaded files before calling the LLM.

*   **Logic Location:** `lib/ai/extraction.ts` (helper) or directly within the `/api/ai` route for small files.
*   **Supported Formats:**
    *   **PDF:** `pdf-parse`
    *   **DOCX:** `mammoth`

## 3. Task Definition: `term-sheet-analysis`
The specific task for module CS01.

*   **Context:** Injects `foundations.md` and `the-deal.md` excerpts.
*   **Prompt:** Calibrated to act as a coach reviewing a learner's redline against market standards.
*   **Inputs:**
    1.  `termSheet`: The uploaded document.
    2.  `concerns`: Optional text input for specific areas of focus.

## 4. Storage
Uploaded files are stored in Supabase Storage (`term-sheet-submissions`) for audit/instructor review, referenced in the `ai_task_runs` metadata.
