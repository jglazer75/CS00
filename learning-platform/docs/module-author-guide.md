# Module Author's Handbook

This handbook provides the standards, structures, and workflows for creating content on the Wisconsin Rural Entrepreneurship Legal Hub platform.

---

## 1. Core Philosophy

*   **Atomic Learning:** Every page is a single, contained unit of learning.
*   **One Action Per Page:** A page may contain *at most one* major interactive exercise (AI Task). Do not clutter pages with multiple heavy interactions.
*   **Structured Metadata:** Navigation and structure live in the Manifest (`module.yaml`), while educational goals live in the Content (`.md`).

---

## 2. Anatomy of a Module

A module is a self-contained directory within `content/`.

```text
content/
└── CS01/                          # Module ID (Folder Name)
    ├── module.yaml                # The Manifest (Navigation Source of Truth)
    ├── foundations.md             # Content Page
    ├── the-exercise.md            # Content Page with Exercise
    ├── ai-tasks/                  # AI Task Definitions
    │   └── term-sheet-analysis.json
    ├── instructor/                # Instructor-only notes (shadows content structure)
    │   └── foundations.md
    └── source-documents/          # PDFs/DOCXs for download
        └── term-sheet.pdf
```

---

## 3. The Manifest (`module.yaml`)

This file defines the **Navigational Structure** and access rules. It is the "Router" for the module.

```yaml
id: "CS01"
title: "Venture Capital Term Sheet Negotiation"
version: "1.0.0"
description: "A short summary of the module."
roles: ["NewCo", "BigTech", "Instructor"]

navigation:
  # A simple page
  - id: "foundations"
    title: "Foundations"       # Navigation Title (Short)
    type: "page"
    content_source: "foundations.md"
    layout: "reader"           # 'reader' (text focused) or 'workbench' (wide)

  # A section with children
  - id: "the-deal"
    title: "The Deal"
    type: "section"
    children:
      - id: "term-sheet"
        title: "Term Sheet Breakdown"
        type: "page"
        content_source: "the-deal.md"
        
  # Restricted content
  - id: "confidential"
    title: "BigTech Briefing"
    type: "page"
    content_source: "confidential.md"
    visibility: 
      role: ["BigTech", "Instructor"]
```

---

## 4. Markdown Content Standards

Every `.md` file represents a page. It must begin with strict YAML frontmatter.

### Frontmatter Schema

```yaml
---
title: "Descriptive Page Title"  # Displayed as H1
pageId: "unique_id_for_tracking" # Optional, defaults to slug
learning_objectives:
  - "Identify the key components of a term sheet."
  - "Explain the difference between pre- and post-money valuation."
core_concepts:
  - "Valuation"
  - "Liquidation Preference"
keywords:
  - "Term Sheet"
  - "Series A"
---
```

### Content Styling

*   **Key Concepts:** Use the `{:.keyconcept}` class to highlight definitions.
    ```markdown
    ## Key Concept: Valuation
    {:.keyconcept}
    
    Valuation is the process of determining...
    ```
*   **Callouts:** Use blockquotes for asides or tips.
    ```markdown
    > **Tip:** Always check the cap table first.
    ```

---

## 5. AI Integration

Interactive AI tasks are defined as JSON files and embedded into pages via anchors.

### A. The Definition (`ai-tasks/*.json`)

Create a JSON file in `ai-tasks/` defining the prompt, inputs, and UI.

```json
{
  "version": "1.0.0",
  "id": "term-sheet-analysis",
  "moduleId": "CS01",
  "metadata": {
    "title": "Analyze Your Redline",
    "summary": "Get AI feedback on your negotiation strategy."
  },
  "placement": {
    "pageSlug": "the-exercise",        // Target Markdown File
    "anchorId": "term-sheet-analysis"  // Anchor ID
  },
  "ui": {
    "component": "DocumentAnalyzer",
    "props": { "submitLabel": "Analyze" }
  },
  "inputs": [
    { "id": "doc", "kind": "file", "label": "Upload Redline", "accept": [".pdf"] }
  ],
  "prompt": {
    "segments": [
      { "role": "system", "template": "You are a helpful coach." },
      { "role": "user", "template": "Analyze this: {{inputs.doc.content}}" }
    ]
  }
}
```

### B. The Anchor (Markdown)

Place the anchor text exactly where you want the component to appear.

```markdown
## The Exercise

Upload your work below.

AI_TASK_ANCHOR: term-sheet-analysis
```

---

## 6. Instructor Notes

Create a file in the `instructor/` directory with the *exact same filename* as the student page.

*   **Student:** `content/CS01/foundations.md`
*   **Instructor:** `content/CS01/instructor/foundations.md`

Content in the instructor file will be visible only when "Instructor Mode" is toggled on.

---

## 7. Workflow & Validation

1.  **Validate Content:** Run the compliance checker.
    ```bash
    npm run validate:content
    ```
    *   Checks for missing metadata.
    *   Enforces "One Exercise Per Page".

2.  **Ingest Changes:** Update the database with the new structure.
    ```bash
    npm run ingest
    ```
    *   Reads `module.yaml` and syncs the navigation tree to Supabase.
