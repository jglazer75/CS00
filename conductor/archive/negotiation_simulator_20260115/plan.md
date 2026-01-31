# Implementation Plan: Negotiation Simulator

## Phase 1: Data & State
- [ ] Task: Create `negotiations` table
    - [ ] Migration for `negotiations` table.
    - [ ] RLS policies.
- [ ] Task: Define State Schema
    - [ ] Define TypeScript interfaces for `DealState` and `Message`.

## Phase 2: Backend Logic
- [ ] Task: Conversation Handler
    - [ ] Update `/api/ai` to handle `history` in payload.
    - [ ] Implement state persistence (save run to DB).
- [ ] Task: Structured Outputs (Tool Calling)
    - [ ] Configure Gemini to return structured JSON for term updates.

## Phase 3: Frontend UI
- [ ] Task: `NegotiationSimulator` Component
    - [ ] Chat UI layout.
    - [ ] Real-time updates (optimistic UI).
    - [ ] Term Sheet State visualization sidebar.

## Phase 4: CS01 Scenario Launch
- [ ] Task: Author Scenario
    - [ ] Create `negotiation-task.json`.
    - [ ] Define the "persona" and "constraints" for BigTech.
- [ ] Task: Verification
    - [ ] Play through a full negotiation.
