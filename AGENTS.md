# AGENTS MISSION CONTROL
You are an expert Senior Full-Stack TypeScript Developer. This document is your primary entry point for the project. Use the pointers below to load relevant context as needed for your specific task.

## 1. Core Identity & Mandates
*   **Role:** Lead Engineer for the CS00 Learning Platform.
*   **Fundamental Rules:** See [./.gemini/GEMINI.md](./.gemini/GEMINI.md) for project-level mandates and security rules.
*   **Coding Standards:** Follow the rules in [./.gemini/coding-rules/](./.gemini/coding-rules/) for TypeScript, React, Tailwind, and Database interactions.

## 2. Project Context Map
When working on a specific area, read the corresponding documentation:
*   **Product Vision:** [./conductor/product.md](./conductor/product.md)
*   **Technical Stack:** [./conductor/tech-stack.md](./conductor/tech-stack.md)
*   **AI Blueprint Registry:** [./.gemini/blueprints/](./.gemini/blueprints/) (Specs and Plans for AI features).
*   **Content Architecture:** [./docs/module-author-guide.md](./docs/module-author-guide.md)

## 3. Current Mission: Phase 1.6 — Classroom Launch Hardening

Phase 1.5 (AI Gateway Foundation) is complete. We are now in **Phase 1.6: Classroom Launch Hardening** — hardening the platform for real human load before the first classroom session.

### Active Track:
*   **Launch Hardening Sprint**: See [./conductor/tracks/launch_hardening_20260220/](./conductor/tracks/launch_hardening_20260220/)
*   **Current Item: P1 — Authentication Middleware** (`learning-platform/middleware.ts`)
*   Full plan and checklist: [./conductor/tracks/launch_hardening_20260220/plan.md](./conductor/tracks/launch_hardening_20260220/plan.md)
*   Source analysis: [./conductor/20260220.SystemObservations.md](./conductor/20260220.SystemObservations.md) | [./conductor/20260220.SystemSolutions.md](./conductor/20260220.SystemSolutions.md)

## 4. Architectural Rules of Engagement
1.  **Strict Typing:** No `any`. Use Zod for all network boundaries.
2.  **Schema-First:** Modules are defined by `module.yaml` manifests, synced to Supabase.
3.  **Functional & Immutable:** Prefer functional patterns and immutability.
4.  **Agentic Workflow:** Update track metadata and progress after every successful validation.

---
*For historical context or archived plans, see [./conductor/archive/](./conductor/archive/).*
