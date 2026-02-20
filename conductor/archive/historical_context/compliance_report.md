# CS01 Content Compliance Report

## Overview
This report audits all CS01 markdown files against the "One Exercise Per Page" and Metadata Standards.

**Standard Requirements:**
1.  `learning_objectives` (list)
2.  `core_concepts` (list)
3.  `title` (string)
4.  **One Exercise Per Page** (Visual Check)

## File Audit

| File | Title | Learning Objectives | Core Concepts | Exercises (Est.) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `foundations.md` | Missing (Implied in text) | Missing | Missing | 0 | **FAIL** |
| `Negotiating-term-sheets.md` | "Think Marriage, Not War" (Heading 1) | Missing | Missing | 0 | **FAIL** |
| `tips.md` | "On the Sociology..." (Heading 1) | Missing | Missing | 0 | **FAIL** |
| `the-deal.md` | "Resources" (Heading 1) | Missing | Missing | 0 | **FAIL** |
| `bigtech-confidential.md` | Missing | Missing | Missing | 0 | **FAIL** |
| `the-exercise.md` | Missing | Missing | Missing | **1 (AI Task)** | **FAIL** |
| `financials.md` | Missing | Missing | Missing | 0 | **FAIL** |
| `pitch-competition.md` | Missing | Missing | Missing | **2 (Docs + Pitch)** | **FAIL** |

## Key Findings
1.  **Systematic Missing Metadata:** None of the files currently have YAML frontmatter with `learning_objectives`, `core_concepts`, or `title`. The titles are currently being derived from the H1 or filename by the ingestion script, but the source of truth is not in the file.
2.  **Exercise Density:** `pitch-competition.md` contains multiple distinct exercises (P&L Summary, Sources & Uses, Investor Pitch). This violates the "Atomic Learning" principle.
3.  **Title Inconsistency:** Many files start with headers like "Resources" or "Think Marriage, Not War" which are not appropriate page titles for navigation.

## Proposed Remediation Plan (Automated)

We need a script to "Normalize" these files.

1.  **Extract Titles:** Promote the first H1 to the YAML `title` field.
2.  **Insert Placeholders:** Insert empty `learning_objectives` and `core_concepts` lists for human authoring.
3.  **Split Content:**
    *   `pitch-competition.md` should likely be split into `05-financials-exercise.md` and `06-pitch-exercise.md`.

## Formal Test Proposal

I propose creating a CI/CD script `scripts/validate-content.ts` that runs on every commit.

**Logic:**
```typescript
// Pseudo-code
for (const file of allMarkdownFiles) {
  const { data } = matter(read(file));
  
  assert(data.title, `File ${file} missing 'title'`);
  assert(Array.isArray(data.learning_objectives), `File ${file} missing 'learning_objectives'`);
  assert(Array.isArray(data.core_concepts), `File ${file} missing 'core_concepts'`);
  
  // Future: Check for multiple AI anchors
  const anchors = content.match(/AI_TASK_ANCHOR/g);
  if (anchors && anchors.length > 1) fail("Too many exercises");
}
```
