# AI Gateway Blueprint Specs

This catalog converts the Phase 1 blueprints into author-ready task definitions that comply with the `AiTaskDefinition` schema (`lib/ai/schema.ts`). Every section pairs UX intent with the JSON contract the gateway will consume.

---

## Shared Conventions

- **Versioning:** Start each task with `"version": "1.0.0"`. Increment the patch when content changes, the minor when prompt/UX changes, and the major when schema usage changes.
- **Module Scope:** `moduleId` matches the enclosing content folder (e.g. `CS01`). Additional blueprints for future modules should duplicate these patterns but swap `moduleId`.
- **Persona & Difficulty:** Declare personas under `toggles.persona` and `difficulty` under `toggles.difficulty`. Use `promptInjections` to maintain a single source of truth for tone and depth.
- **Context Handles:** Assign deterministic `context` IDs (e.g. `"caseSummary"`, `"rubric"`) so prompts and data capture stay readable. Stick to markdown excerpts unless a tabular dataset is required.
- **Data Capture:** All blueprints record a normalized row in `ai_task_runs`. Each blueprint may perform additional writes to scenario-specific tables (see sections below).
- **Telemetry:** Use the canonical event names listed in each blueprint to power analytics dashboards (`ai.task.submitted`, `ai.negotiation.round_submitted`, etc.).

---

## Document Analyzer (Phase 1 Launch)

### Intent

Single-shot analysis of an uploaded learner document with rubric-aligned feedback. Deploys inside `CS01` Module 3 and future modules that require document review.

### Schema Highlights

| Aspect | Specification |
| --- | --- |
| Component | `DocumentAnalyzer` |
| Inputs | Required file upload (`.pdf`, `.docx`) plus optional textarea for focus areas. |
| Toggles | Difficulty (`standard`, `advanced`); Personas (`mba`, `founder`, `associate`). |
| Context | Module markdown excerpts, static rubric block, optional instructor notes. |
| Prompt | Ordered system/user segments; difficulty and persona injectors tune depth and tone. |
| Response | Structured JSON with `summary`, `strengths`, `risks`, `nextSteps`, `recommendedClauses`. |
| Data Capture | Insert into `ai_task_runs`; optional insert into `ai_document_reviews` for downstream analytics. |
| Telemetry | `ai.task.submitted` (base), `ai.document.analysis_completed`. |

### JSON Skeleton

```json
{
  "version": "1.0.0",
  "id": "term-sheet-analysis",
  "moduleId": "CS01",
  "status": "active",
  "metadata": {
    "title": "Term Sheet Analyzer",
    "summary": "Upload a draft term sheet for rubric-aligned coaching.",
    "tags": ["document", "analysis"],
    "estimatedDurationMinutes": 15,
    "rubricId": "cs01-term-sheet-v1"
  },
  "placement": {
    "pageSlug": "03-the-exercise",
    "anchorId": "ai-term-sheet-analysis"
  },
  "ui": {
    "component": "DocumentAnalyzer",
    "props": {
      "title": "AI-Powered Term Sheet Review",
      "description": "Immediate coaching on your current draft.",
      "submitLabel": "Analyze Draft"
    }
  },
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
          "promptInjections": {
            "system": [
              "Keep the guidance accessible for learners midway through CS01."
            ]
          }
        },
        {
          "id": "advanced",
          "label": "Advanced",
          "promptInjections": {
            "system": [
              "Assume the learner is prepping for a partner meeting; highlight nuanced tradeoffs and negotiation tactics."
            ]
          }
        }
      ]
    },
    "persona": {
      "id": "persona",
      "label": "Persona",
      "type": "single",
      "defaultValue": "mba",
      "options": [
        {
          "id": "mba",
          "label": "MBA Student",
          "promptInjections": {
            "user": ["Anchor recommendations in business outcomes and stakeholder alignment."]
          }
        },
        {
          "id": "founder",
          "label": "Founder",
          "promptInjections": {
            "user": ["Highlight control provisions, dilution pressure, and negotiation leverage for operators."]
          }
        },
        {
          "id": "associate",
          "label": "VC Associate",
          "promptInjections": {
            "user": ["Evaluate how the draft aligns with firm thesis, risk appetite, and downstream financing strategy."]
          }
        }
      ],
      "exposeAsInput": true,
      "ui": {
        "control": "pill",
        "order": 1
      }
    }
  },
  "inputs": [
    {
      "id": "termSheet",
      "name": "termSheet",
      "label": "Upload your term sheet",
      "kind": "file",
      "accept": [".pdf", ".docx"],
      "maxSizeMB": 15,
      "required": true,
      "description": "Uploads are stored securely in Supabase storage."
    },
    {
      "id": "focusAreas",
      "name": "focusAreas",
      "label": "What should we double-check?",
      "kind": "textarea",
      "placeholder": "List clauses or themes (optional)",
      "maxLength": 400
    }
  ],
  "context": [
    {
      "id": "foundationsOverview",
      "type": "markdown",
      "path": "CS01/01-foundations.md",
      "includeHeadings": ["Foundations Overview", "Key Definitions"]
    },
    {
      "id": "dealObjectives",
      "type": "markdown",
      "path": "CS01/02-the-deal.md",
      "includeHeadings": ["Negotiation Goals"]
    },
    {
      "type": "static",
      "id": "rubric",
      "value": "### Evaluation Rubric\n- Identify red flags\n- Tie recommendations to CS01 goals\n- Offer next-step actions"
    }
  ],
  "prompt": {
    "segments": [
      {
        "role": "system",
        "template": "You are an expert startup lawyer coaching learners through CS01."
      },
      {
        "role": "system",
        "template": "{{context.rubric}}"
      },
      {
        "role": "user",
        "template": "Learner persona: {{toggles.persona.label}}."
      },
      {
        "role": "user",
        "template": "Submitted term sheet contents:\n{{inputs.termSheet.content}}"
      },
      {
        "role": "user",
        "template": "Learner focus areas: {{inputs.focusAreas}}",
        "when": {
          "toggleId": "difficulty",
          "optionIds": ["advanced"]
        }
      }
    ],
    "responseFormat": {
      "type": "structured",
      "schema": {
        "type": "object",
        "properties": {
          "summary": { "type": "string" },
          "strengths": {
            "type": "array",
            "items": { "type": "string" }
          },
          "risks": { "type": "array", "items": { "type": "string" } },
          "nextSteps": {
            "type": "array",
            "items": { "type": "string" }
          },
          "recommendedClauses": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["summary", "risks", "nextSteps"]
      }
    }
  },
  "dataCapture": {
    "storeRawResponse": true,
    "operations": [
      {
        "table": "ai_task_runs",
        "operation": "insert",
        "fields": [
          { "column": "task_id", "value": "{{task.id}}" },
          { "column": "module_id", "value": "{{task.moduleId}}" },
          { "column": "user_id", "value": "{{auth.userId}}" },
          { "column": "difficulty", "value": "{{toggles.difficulty.id}}" },
          { "column": "persona", "value": "{{toggles.persona.id}}" },
          { "column": "inputs", "value": "{{inputs.json}}" },
          { "column": "response", "value": "{{response.json}}" }
        ]
      },
      {
        "table": "ai_document_reviews",
        "operation": "insert",
        "fields": [
          { "column": "task_run_id", "value": "{{run.id}}" },
          { "column": "strengths", "value": "{{response.json.strengths}}" },
          { "column": "risks", "value": "{{response.json.risks}}" }
        ]
      }
    ]
  },
  "cache": {
    "enabled": true,
    "strategy": "prompt-hash",
    "ttlSeconds": 2592000
  },
  "telemetry": {
    "eventName": "ai.task.submitted",
    "additional": {
      "completionEvent": "ai.document.analysis_completed"
    }
  }
}
```

---

## Negotiation Simulator (Phase 2 Planning)

### Intent

Multi-turn DealCraft-inspired negotiation coach. Learners plan moves, exchange offers with AI personas, and receive round-by-round feedback plus a final debrief.

### Schema Highlights

| Aspect | Specification |
| --- | --- |
| Component | `NegotiationSimulator` |
| Inputs | Round planner (`textarea`), optional checklist for negotiation goals, file upload for draft offer. |
| Toggles | Difficulty (`practice`, `stretch`), Persona (`vc`, `founder`, `lawyer`), Scenario variants (debt vs equity). |
| Context | Module briefings, opponent profiles, scenario facts, optionally Supabase dataset of prior offers. |
| Prompt | Segmented to drive planning guidance and AI persona responses; includes assistant preamble for in-round persona voice. |
| Response | Structured JSON capturing `aiMove`, `roundFeedback`, `scorecards`. |
| Data Capture | Inserts into `ai_task_runs`, plus `ai_negotiation_rounds` for each turn with the learner's inputs and AI responses. |
| Telemetry | `ai.negotiation.round_submitted`, `ai.negotiation.completed`. |

### JSON Skeleton

```json
{
  "version": "1.0.0",
  "id": "term-sheet-negotiation",
  "moduleId": "CS01",
  "status": "draft",
  "metadata": {
    "title": "DealCraft Negotiation Simulator",
    "summary": "Plan each move, negotiate against an AI partner, and receive coaching.",
    "tags": ["negotiation", "simulation"],
    "estimatedDurationMinutes": 25,
    "rubricId": "cs01-dealcraft-v1"
  },
  "placement": {
    "pageSlug": "04-dealcraft-simulator",
    "anchorId": "ai-dealcraft-simulator",
    "order": 3
  },
  "ui": {
    "component": "NegotiationSimulator",
    "props": {
      "maxRounds": 3,
      "requiresPlanningStep": true,
      "showPersonaTips": true,
      "roundLabels": ["Kickoff", "Middle Game", "Close"]
    }
  },
  "toggles": {
    "difficulty": {
      "id": "difficulty",
      "label": "Difficulty",
      "type": "single",
      "defaultValue": "practice",
      "options": [
        {
          "id": "practice",
          "label": "Practice",
          "promptInjections": {
            "system": [
              "Provide supportive feedback and explain concessions in plain language."
            ]
          }
        },
        {
          "id": "stretch",
          "label": "Stretch",
          "promptInjections": {
            "system": [
              "Adopt a rigorous, fast-paced negotiation cadence and press the learner on weak positions."
            ]
          }
        }
      ]
    },
    "persona": {
      "id": "persona",
      "label": "Opponent Persona",
      "type": "single",
      "defaultValue": "vc",
      "options": [
        {
          "id": "vc",
          "label": "VC Partner",
          "promptInjections": {
            "assistant": [
              "Speak as a seasoned VC partner balancing portfolio risk and upside."
            ]
          }
        },
        {
          "id": "founder",
          "label": "Founder CEO",
          "promptInjections": {
            "assistant": [
              "Respond as a founder safeguarding control and runway."
            ]
          }
        },
        {
          "id": "lawyer",
          "label": "Company Counsel",
          "promptInjections": {
            "assistant": [
              "Argue from the perspective of outside counsel focused on risk mitigation."
            ]
          }
        }
      ],
      "exposeAsInput": true,
      "ui": {
        "control": "radio",
        "order": 1
      }
    },
    "additional": [
      {
        "id": "scenario",
        "label": "Scenario Variant",
        "type": "single",
        "defaultValue": "equity",
        "options": [
          {
            "id": "equity",
            "label": "Equity Round",
            "promptInjections": {
              "system": [
                "Scenario: Seed equity financing, $8M pre-money valuation, $2M raise."
              ]
            }
          },
          {
            "id": "venture_debt",
            "label": "Venture Debt",
            "promptInjections": {
              "system": [
                "Scenario: Venture debt facility with covenants tied to ARR and burn rate."
              ]
            }
          }
        ]
      }
    ]
  },
  "inputs": [
    {
      "id": "roundPlan",
      "name": "roundPlan",
      "label": "Round strategy",
      "kind": "textarea",
      "placeholder": "Outline your goals, must-haves, and walk-away points for this round.",
      "maxLength": 800,
      "required": true
    },
    {
      "id": "offerFile",
      "name": "offerFile",
      "label": "Upload supporting offer (optional)",
      "kind": "file",
      "accept": [".pdf", ".docx"],
      "maxSizeMB": 10
    },
    {
      "id": "goalChecklist",
      "name": "goalChecklist",
      "label": "Select focus goals (optional)",
      "kind": "select",
      "options": [
        { "value": "valuation", "label": "Valuation" },
        { "value": "governance", "label": "Governance" },
        { "value": "liquidation", "label": "Liquidation Preference" },
        { "value": "employment", "label": "Executive Employment" }
      ],
      "defaultValue": "valuation"
    }
  ],
  "context": [
    {
      "id": "scenarioBriefing",
      "type": "markdown",
      "path": "CS01/04-dealcraft-briefing.md",
      "includeHeadings": ["Scenario Overview", "Team Roles"]
    },
    {
      "type": "static",
      "id": "opponentProfile",
      "value": "### Opponent Tendencies\n- Opens aggressively on valuation\n- Values founder credibility\n- Sensitive to pro rata and board seats"
    }
  ],
  "prompt": {
    "segments": [
      {
        "role": "system",
        "template": "You are orchestrating a negotiation simulation for CS01. Stay in character as {{toggles.persona.label}} during the dialogue rounds."
      },
      {
        "role": "system",
        "template": "{{context.opponentProfile}}"
      },
      {
        "role": "user",
        "template": "Learner's round strategy:\n{{inputs.roundPlan}}"
      },
      {
        "role": "user",
        "template": "Learner uploaded supporting offer:\n{{inputs.offerFile.content}}",
        "when": {
          "toggleId": "scenario",
          "optionIds": ["equity", "venture_debt"]
        }
      },
      {
        "role": "assistant",
        "template": "Acknowledge the learner's strategy, propose your counter, and end with a question driving the next decision."
      }
    ],
    "responseFormat": {
      "type": "structured",
      "schema": {
        "type": "object",
        "properties": {
          "aiMove": { "type": "string" },
          "roundFeedback": { "type": "string" },
          "scorecard": {
            "type": "object",
            "properties": {
              "valueCreation": { "type": "number" },
              "relationship": { "type": "number" },
              "executionRisk": { "type": "number" }
            }
          },
          "nextPrompt": { "type": "string" }
        },
        "required": ["aiMove", "roundFeedback", "nextPrompt"]
      }
    }
  },
  "dataCapture": {
    "storeRawResponse": true,
    "operations": [
      {
        "table": "ai_task_runs",
        "operation": "insert",
        "fields": [
          { "column": "task_id", "value": "{{task.id}}" },
          { "column": "module_id", "value": "{{task.moduleId}}" },
          { "column": "user_id", "value": "{{auth.userId}}" },
          { "column": "difficulty", "value": "{{toggles.difficulty.id}}" },
          { "column": "persona", "value": "{{toggles.persona.id}}" },
          { "column": "inputs", "value": "{{inputs.json}}" }
        ]
      },
      {
        "table": "ai_negotiation_rounds",
        "operation": "insert",
        "fields": [
          { "column": "task_run_id", "value": "{{run.id}}" },
          { "column": "round_number", "value": "{{round.index}}" },
          { "column": "learner_plan", "value": "{{inputs.roundPlan}}" },
          { "column": "ai_move", "value": "{{response.json.aiMove}}" },
          { "column": "feedback", "value": "{{response.json.roundFeedback}}" },
          { "column": "scorecard", "value": "{{response.json.scorecard}}" }
        ]
      }
    ]
  },
  "cache": {
    "enabled": false
  },
  "telemetry": {
    "eventName": "ai.negotiation.round_submitted",
    "additional": {
      "completionEvent": "ai.negotiation.completed"
    }
  }
}
```

---

## Guided Annotation Walkthrough (Phase 2 Planning)

### Intent

Clause-by-clause walkthrough of a pre-selected document. Learners explore annotated cards for each section, optionally generate audio scripts, and collect highlights tied to module objectives.

### Schema Highlights

| Aspect | Specification |
| --- | --- |
| Component | `GuidedAnnotation` |
| Inputs | Clause selection (enum), optional follow-up question textbox, toggle for audio script generation. |
| Toggles | Difficulty (`spotlight`, `deep-dive`), Persona (`law_student`, `entrepreneur`), Delivery mode (`text`, `text_with_audio`). |
| Context | Markdown excerpts for each clause, instructor commentary, citation index. |
| Prompt | System primes on teaching tone, user segments supply clause text and learner questions, assistant segment generates narrative plus optional audio script. |
| Response | Structured JSON with `narrative`, `keyTakeaways`, `questionsToAsk`, and optional `audioScript`. |
| Data Capture | `ai_task_runs` insert plus `ai_guided_annotations` row storing clause ID, takeaways, and script metadata. |
| Telemetry | `ai.annotation.generated`, `ai.annotation.audio_requested`. |

### JSON Skeleton

```json
{
  "version": "1.0.0",
  "id": "term-sheet-guided-annotation",
  "moduleId": "CS01",
  "status": "draft",
  "metadata": {
    "title": "Guided Term Sheet Annotation",
    "summary": "Select a clause to receive narrative coaching and optional audio walkthrough.",
    "tags": ["annotation", "coaching"],
    "estimatedDurationMinutes": 20,
    "rubricId": "cs01-annotation-v1"
  },
  "placement": {
    "pageSlug": "05-guided-annotation",
    "anchorId": "ai-guided-annotation",
    "order": 4
  },
  "ui": {
    "component": "GuidedAnnotation",
    "props": {
      "showAudioToggle": true,
      "defaultClauseId": "valuation",
      "ctaLabel": "Generate Guided Walkthrough"
    }
  },
  "toggles": {
    "difficulty": {
      "id": "difficulty",
      "label": "Depth",
      "type": "single",
      "defaultValue": "spotlight",
      "options": [
        {
          "id": "spotlight",
          "label": "Spotlight",
          "promptInjections": {
            "system": [
              "Provide a concise overview focused on the clause's purpose and red flags."
            ]
          }
        },
        {
          "id": "deep_dive",
          "label": "Deep Dive",
          "promptInjections": {
            "system": [
              "Deliver a thorough breakdown including negotiation strategies, alternative clause structures, and practitioner tips."
            ]
          }
        }
      ]
    },
    "persona": {
      "id": "persona",
      "label": "Learner Persona",
      "type": "single",
      "defaultValue": "law_student",
      "options": [
        {
          "id": "law_student",
          "label": "Law Student",
          "promptInjections": {
            "user": [
              "Focus on doctrine, statutory references, and career-ready insights."
            ]
          }
        },
        {
          "id": "entrepreneur",
          "label": "Entrepreneur",
          "promptInjections": {
            "user": [
              "Explain implications for control, dilution, and investor relations in plain language."
            ]
          }
        },
        {
          "id": "mba",
          "label": "MBA",
          "promptInjections": {
            "user": [
              "Bridge legal concepts to financial modeling and commercialization strategy."
            ]
          }
        }
      ],
      "exposeAsInput": true,
      "ui": {
        "control": "pill",
        "order": 1
      }
    },
    "additional": [
      {
        "id": "delivery",
        "label": "Delivery Mode",
        "type": "single",
        "defaultValue": "text",
        "options": [
          {
            "id": "text",
            "label": "Text Only"
          },
          {
            "id": "audio",
            "label": "Text + Audio Script",
            "promptInjections": {
              "system": [
                "Provide an additional section formatted as an audio script suitable for voiceover."
              ]
            }
          }
        ]
      }
    ]
  },
  "inputs": [
    {
      "id": "clauseId",
      "name": "clauseId",
      "label": "Clause",
      "kind": "select",
      "options": [
        { "value": "valuation", "label": "Valuation" },
        { "value": "liquidation", "label": "Liquidation Preference" },
        { "value": "board", "label": "Board Composition" },
        { "value": "protective", "label": "Protective Provisions" }
      ],
      "defaultValue": "valuation",
      "required": true
    },
    {
      "id": "question",
      "name": "question",
      "label": "Follow-up question (optional)",
      "kind": "textarea",
      "placeholder": "What confuses you about this clause?",
      "maxLength": 300
    },
    {
      "id": "audioToggle",
      "name": "audioToggle",
      "label": "Request audio script",
      "kind": "checkbox",
      "defaultValue": false
    }
  ],
  "context": [
    {
      "id": "clauseDataset",
      "type": "dataset",
      "table": "term_sheet_clauses",
      "filter": { "module_id": "CS01", "id": "{{inputs.clauseId}}" },
      "select": ["id", "heading", "body", "citations"]
    },
    {
      "id": "annotationGoals",
      "type": "markdown",
      "path": "CS01/05-guided-annotation.md",
      "includeHeadings": ["Instructional Goals"]
    },
    {
      "type": "static",
      "id": "audioStyle",
      "value": "### Audio Voice Guidelines\n- Conversational\n- Wisconsin accent optional\n- Keep pace at ~150 words per minute"
    }
  ],
  "prompt": {
    "segments": [
      {
        "role": "system",
        "template": "You are coaching learners through annotated venture term sheet clauses. Maintain an encouraging tone and keep references accessible."
      },
      {
        "role": "system",
        "template": "{{context.audioStyle}}",
        "when": {
          "toggleId": "delivery",
          "optionIds": ["audio"]
        }
      },
      {
        "role": "user",
        "template": "Clause requested: {{inputs.clauseId}}."
      },
      {
        "role": "user",
        "template": "Clause text:\n{{datasets.clauseDataset.body}}"
      },
      {
        "role": "user",
        "template": "Learner question: {{inputs.question}}"
      }
    ],
    "responseFormat": {
      "type": "structured",
      "schema": {
        "type": "object",
        "properties": {
          "narrative": { "type": "string" },
          "keyTakeaways": {
            "type": "array",
            "items": { "type": "string" }
          },
          "questionsToAsk": {
            "type": "array",
            "items": { "type": "string" }
          },
          "audioScript": { "type": ["string", "null"] }
        },
        "required": ["narrative", "keyTakeaways", "questionsToAsk"]
      }
    }
  },
  "dataCapture": {
    "storeRawResponse": true,
    "operations": [
      {
        "table": "ai_task_runs",
        "operation": "insert",
        "fields": [
          { "column": "task_id", "value": "{{task.id}}" },
          { "column": "module_id", "value": "{{task.moduleId}}" },
          { "column": "user_id", "value": "{{auth.userId}}" },
          { "column": "difficulty", "value": "{{toggles.difficulty.id}}" },
          { "column": "persona", "value": "{{toggles.persona.id}}" },
          { "column": "inputs", "value": "{{inputs.json}}" }
        ]
      },
      {
        "table": "ai_guided_annotations",
        "operation": "insert",
        "fields": [
          { "column": "task_run_id", "value": "{{run.id}}" },
          { "column": "clause_id", "value": "{{inputs.clauseId}}" },
          { "column": "takeaways", "value": "{{response.json.keyTakeaways}}" },
          { "column": "questions_to_ask", "value": "{{response.json.questionsToAsk}}" },
          { "column": "audio_requested", "value": "{{inputs.audioToggle}}" },
          { "column": "audio_script", "value": "{{response.json.audioScript}}" }
        ]
      }
    ]
  },
  "cache": {
    "enabled": true,
    "strategy": "prompt-hash",
    "ttlSeconds": 604800
  },
  "telemetry": {
    "eventName": "ai.annotation.generated",
    "additional": {
      "audioEvent": "ai.annotation.audio_requested"
    }
  }
}
```

---

### Next Steps

* Use these skeletons to backfill real task definitions under `content/CS01/ai-tasks/` (starting with Document Analyzer).
* Extend Supabase schema with `ai_task_runs`, `ai_document_reviews`, `ai_negotiation_rounds`, and `ai_guided_annotations` to satisfy the declared data capture operations.
* Implement validation middleware in the AI gateway that loads a task JSON, runs it through `zod`/`typescript-json-schema`, and raises descriptive author errors.
