# Implementation Plan: Document Analyzer Launch

## Phase 1: Core Utilities
- [ ] Task: Document Text Extraction
    - [ ] Install `pdf-parse` and `mammoth`.
    - [ ] Implement `lib/ai/extraction.ts` to handle file buffers.
    - [ ] Integrate extraction into the `/api/ai` route logic (look for 'file' kind inputs).

## Phase 2: Frontend Polishing
- [ ] Task: Enhance `DocumentAnalyzer` Component
    - [ ] Replace placeholder with actual form handling.
    - [ ] Implement file upload to Supabase Storage.
    - [ ] Implement input binding for all task-defined inputs.
    - [ ] Add markdown rendering for the result (`MarkdownContent`).

## Phase 3: CS01 Task Authoring
- [ ] Task: Finalize Term Sheet Analysis Task
    - [ ] Create `content/CS01/ai-tasks/term-sheet-analysis.json`.
    - [ ] Define prompt segments with coaching rubrics.
    - [ ] Embed the anchor in `content/CS01/the-exercise.md`.

## Phase 4: Launch & Verification
- [ ] Task: Walkthrough & QA
    - [ ] Test with sample PDF/DOCX files.
    - [ ] Verify that feedback is contextually accurate based on CS01 materials.
    - [ ] Confirm telemetry is logging to `ai_task_runs`.
