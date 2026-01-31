# Track: Negotiation Simulator (DealCraft)

**Status:** IN PROGRESS
**Started:** 2026-01-15

## Context
This track focuses on building "DealCraft," an interactive, stateful negotiation simulator. It moves beyond single-shot analysis (like the Document Analyzer) to a multi-turn conversation where the AI plays a specific role (e.g., BigTech Counsel) and the learner negotiates terms.

## Goals
1.  Design the `Negotiation` React component (chat interface, round tracking).
2.  Implement the `negotiations` database table for state persistence.
3.  Create the backend logic (`/api/ai/negotiate` or extended gateway) to handle conversation history and state updates.
4.  Author the `negotiation-scenario.json` task definition for CS01.

## Resources
- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [AGENTS.md](../../../AGENTS.md) (Blueprint Catalog)
