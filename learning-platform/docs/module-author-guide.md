# Module Authoring Guide: AI Integration

This guide details how to add interactive AI tasks to learning modules.

## Overview

AI tasks are defined as JSON files within a module's `ai-tasks` directory. The content engine automatically discovers these files and injects them into the corresponding learning page based on the `placement` configuration.

## Directory Structure

```text
content/
└── CS01/
    ├── 01-foundations.md
    ├── ...
    └── ai-tasks/
        ├── term-sheet-analysis.json
        └── another-task.json
```

## Task Definition Schema

Each AI task file must be a valid JSON object matching the `AiTaskDefinition` schema.

### Core Fields

| Field | Type | Description |
| :--- | :--- | :--- |
| `version` | string | Schema version (currently "1.0.0"). |
| `id` | string | Unique identifier for the task within the module. |
| `moduleId` | string | The ID of the parent module (e.g., "CS01"). |
| `metadata` | object | Display metadata (title, summary, estimatedDurationMinutes). |
| `placement` | object | Where the task appears (`pageSlug`, `anchorId`). |
| `ui` | object | The UI component to render (`component`, `props`). |
| `prompt` | object | The prompt template and settings. |

### Inputs

Define what data the learner provides.

```json
"inputs": [
  {
    "id": "userDocument",
    "kind": "file",
    "name": "termSheet",
    "label": "Upload Term Sheet",
    "accept": [".pdf", ".docx"]
  },
  {
    "id": "concerns",
    "kind": "textarea",
    "name": "concerns",
    "label": "What are your main concerns?",
    "placeholder": "e.g., Valuation, Board Control"
  }
]
```

### Toggles (Difficulty / Persona)

Allow learners (or the system) to configure the task.

```json
"toggles": {
  "difficulty": {
    "id": "difficulty",
    "label": "Difficulty",
    "type": "single",
    "defaultValue": "standard",
    "options": [
      {
        "id": "standard",
        "label": "Standard",
        "promptInjections": { "system": ["Act as a helpful coach."] }
      },
      {
        "id": "hard",
        "label": "Hard Mode",
        "promptInjections": { "system": ["Act as a tough counterparty."] }
      }
    ]
  }
}
```

### Prompt Template

Use handlebars-style variables to inject inputs and context.

```json
"prompt": {
  "segments": [
    {
      "role": "system",
      "template": "You are an expert lawyer. {{toggles.difficulty.label}} mode."
    },
    {
      "role": "user",
      "template": "Analyze this document:\n{{inputs.userDocument.content}}"
    }
  ]
}
```

## Placing the Task in Markdown

To render the AI task component in the lesson flow, insert an HTML comment anchor in the markdown file corresponding to `placement.pageSlug`.

```markdown
## The Exercise

Please complete the analysis below.

<!-- AI_TASK_ANCHOR: term-sheet-analysis-anchor -->
```

The `anchorId` in your JSON must match the ID inside the comment (e.g., `term-sheet-analysis-anchor`).

## Available Components

*   **`DocumentAnalyzer`**: A standard component for file upload + text input + AI analysis response.

## Validation

The build system validates all JSON files against the Zod schema in `lib/ai/schema.ts`. Errors will fail the build or ingestion process.

```