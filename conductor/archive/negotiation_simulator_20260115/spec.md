# Specification: Negotiation Simulator (DealCraft)

## 1. Core Concept
A stateful, chat-based interface where a learner negotiates with an AI persona. The system tracks "Rounds" and "Deal Terms."

## 2. Data Model (`negotiations` table)
*   `id`: UUID
*   `user_id`: UUID
*   `module_id`: String
*   `task_id`: String
*   `status`: 'active' | 'completed' | 'stalemate'
*   `current_round`: Integer
*   `history`: JSONB (Array of messages)
*   `deal_state`: JSONB (Current agreed terms vs. starting terms)

## 3. UI Component: `NegotiationSimulator`
*   **Chat Interface:** Standard message history view (User right, AI left).
*   **Input Area:** Text input + "Offer" buttons (if structured).
*   **Sidebar:** Display current "Deal State" (e.g., Valuation: $15M [Pending]).
*   **Controls:** "End Round", "Accept Deal", "Walk Away".

## 4. AI Gateway Extensions
*   The gateway needs to support **conversational context**.
*   Instead of a single prompt, it injects `history` into the context.
*   **Tool Calling (Function Calling):** The AI should be able to emit structured updates (e.g., `update_term({ term: "Valuation", value: "$12M" })`) to update the `deal_state`.

## 5. CS01 Scenario
*   **Role:** AI plays "BigTech Corp Counsel".
*   **User:** Learner plays "NewCo Founder Counsel".
*   **Objective:** Negotiate Valuation, Option Pool, and Board Seats.
