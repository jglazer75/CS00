# Track: Document Analyzer Launch (CS01)

**Status:** IN PROGRESS
**Started:** 2026-01-15

## Context
This track completes the implementation of the first "Blueprint" AI component: the **Document Analyzer**. It focuses on enabling the specific "Term Sheet Analysis" task for module CS01, which requires document text extraction, structured prompting with context, and a polished UI for learners to submit their redlines.

## Goals
1.  Complete the `DocumentAnalyzer` React component (supporting file uploads and input binding).
2.  Implement document text extraction (`pdf-parse`, `mammoth`) in the gateway or a utility.
3.  Author the final `term-sheet-analysis.json` task with module-specific rubrics and context.
4.  Launch and verify the analysis flow in the `the-exercise` page.

## Resources
- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [AGENTS.md](../../../AGENTS.md) (Blueprint Catalog)
