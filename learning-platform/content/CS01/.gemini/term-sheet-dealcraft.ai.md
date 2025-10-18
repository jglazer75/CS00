Of course. This is an exciting and ambitious next step. Building a negotiation engine requires careful planning around state management, prompt engineering, and user interaction design.

Here is a detailed plan for the negotiation engine, which we'll call **"DealCraft,"** along with the requested architecture and implementation phases.

---

### **Part 1: The "DealCraft" Negotiation Engine - Detailed Plan**

DealCraft is an interactive AI-powered negotiation simulator designed to operate within the CS01 case study. It moves beyond static analysis to create a dynamic, conversational experience where users can hone their negotiation skills in a realistic, high-stakes environment.

#### **Conceptual User Flow:**

1.  **Initiation:** The user navigates to "Module 3, Part 2: The Negotiation." They are greeted by the DealCraft interface.
2.  **Term Sheet Upload:** The user uploads their redlined term sheet from Part 1. The system parses and ingests this document as the starting point for the negotiation.
3.  **Role & Difficulty Selection:** The user chooses their role:
    *   **Easy (Represent NewCo):** The user advocates for the startup's interests. The AI, as BigTech, will be more flexible and willing to concede on non-critical points.
    *   **Medium (Represent BigTech):** The user advocates for the corporate investor. The AI, as NewCo, will be more assertive about protecting its IP and valuation.
    *   **Hard (Blind Negotiation):** The AI randomly assigns roles to the user and itself, revealing them only after the negotiation begins. This tests the user's ability to adapt quickly.
4.  **Round Structuring:** Before the negotiation starts, the AI analyzes the uploaded term sheet and proposes a structured agenda.
    *   **Example Proposal:** "This negotiation will proceed in three rounds. **Round 1: Economics**, where we will discuss Valuation, Option Pool, and Liquidation Preference. **Round 2: Control**, covering the Board of Directors and Protective Provisions. **Round 3: IP & Exclusivity**, focusing on the License Agreement terms. Do you agree to this structure?"
    *   The user must agree to the proposed rounds before proceeding.
5.  **Multi-Modal Negotiation:** The negotiation begins, proceeding round by round. For each turn, the user can choose their mode of engagement:
    *   **Text Chat:** A standard chatbot interface.
    *   **Voice Chat:** The user speaks, their words are transcribed, and the AI responds with synthesized speech.
    *   **Trade Redlines:** The user uploads a newly edited `.docx` file. The AI parses the changes, comments on them, and proposes its own counter-redline.
    *   The AI will always mirror the user's chosen mode for its response.
6.  **Round Summaries:** After all points in a round are agreed upon, the AI generates a summary.
    *   **Example Summary:** "Conclusion of Round 1: We have agreed to a $15M pre-money valuation, a 20% post-financing option pool, and a 1x non-participating liquidation preference. These terms are now locked."
7.  **Negotiation Conclusion:** The negotiation ends in one of two ways:
    *   **Agreement:** All rounds are completed and all points are resolved.
    *   **Stalemate:** After a set number of turns (e.g., 20) or if the AI detects a persistent impasse on a critical deal term, it will propose ending the negotiation.
8.  **After-Action Report:** Upon conclusion, the AI generates a comprehensive performance review, covering:
    *   A final summary of the agreed-upon terms.
    *   **What Went Well:** "You did an excellent job defending the valuation by using market data effectively."
    *   **Areas for Improvement:** "You conceded on the board seat too quickly. In the future, consider trading that for a concession on protective provisions."
    *   **Market Deviations:** "The agreed-upon 3x participating preferred liquidation preference is highly unusual for a Series A deal and significantly disadvantages the founders."

---

### **Part 2: System Architecture Plan**

The architecture will extend the existing Vercel/Supabase/Gemini stack, introducing a stateful component to manage the negotiation's long-running nature.

1.  **Frontend (Jekyll & Client-Side JavaScript):**
    *   **UI Framework:** To handle the dynamic and stateful nature of the chat interface, we will introduce a lightweight JavaScript library like **Preact** or use vanilla JS components. This will be carefully integrated into the existing Jekyll page (`03-the-exercise.md`).
    *   **Responsibilities:**
        *   Render the DealCraft UI (upload, role selection, chat window, mode selectors).
        *   Manage local UI state (e.g., loading indicators, disabling buttons).
        *   Handle user input: text entry, file selection, and voice input via the browser's **Web Speech API** (`SpeechRecognition` for input, `SpeechSynthesis` for output).
        *   Make API calls to the backend negotiation endpoint.

2.  **Backend (Vercel Serverless Functions):**
    *   A new, primary serverless function: `api/negotiate.js`. This will be the main orchestrator.
    *   **Responsibilities:**
        *   **Session Management:** Create, manage, and retrieve negotiation sessions.
        *   **State Management:** Load and save the negotiation state to the database between turns.
        *   **AI Interaction:** Construct detailed prompts for the Gemini API, including the system persona, term sheet state, conversation history, and user's latest input.
        *   **Business Logic:** Handle role assignment, round structuring, and stalemate detection.

3.  **Database (Supabase Postgres):**
    *   This is the critical new component for ensuring the negotiation is stateful. A new table, `negotiations`, will be created.
    *   **`negotiations` Table Schema:**
        *   `id` (uuid, primary key): Unique identifier for each negotiation session.
        *   `user_id` (uuid, foreign key, optional): If user accounts are ever introduced.
        *   `created_at` (timestamp): When the session started.
        *   `status` (text): e.g., 'initializing', 'in_progress', 'completed_agreement', 'completed_stalemate'.
        *   `user_role` (text): 'NewCo' or 'BigTech'.
        *   `ai_role` (text): 'NewCo' or 'BigTech'.
        *   `original_term_sheet` (text): The full text of the initially uploaded document.
        *   `current_term_sheet_json` (jsonb): A JSON representation of the term sheet's key negotiable points and their current status/values. This is crucial for tracking changes accurately.
        *   `history` (jsonb): An array of objects, where each object represents a turn in the conversation (e.g., `{ "speaker": "user", "mode": "text", "content": "I cannot accept that." }`).

4.  **AI Model (Google Gemini):**
    *   The negotiation logic will be driven by a sophisticated **system prompt**. This prompt will be the "constitution" for the AI, defining its personality, goals, and constraints.
    *   **System Prompt Components:**
        *   **Persona:** "You are the General Counsel for BigTech, a savvy and experienced negotiator..."
        *   **Objective:** "Your goal is to secure favorable terms for BigTech, focusing on board control and IP rights, but you are authorized to concede on valuation within a certain range."
        *   **Knowledge Base:** The prompt will be dynamically populated with the case study context (`01-foundations.md`, `02-the-deal.md`).
        *   **State Awareness:** The `current_term_sheet_json` and `history` will be passed in with every API call, allowing the AI to have a complete memory of the negotiation.

5.  **File Storage (Supabase Storage):**
    *   This will continue to be used for storing the uploaded `.docx` and `.pdf` files, including any mid-negotiation redline trades. The path to the stored file can be referenced in the `negotiations` table.

---

### **Part 3: Phased Implementation Plan**

This plan breaks the project into manageable phases, starting with a core text-based MVP and layering on complexity.

#### **Phase 1: Core Backend & Text-Based MVP**

*   **Goal:** Establish the foundational architecture and a working text-only negotiation loop.
*   **Tasks:**
    1.  **Database Setup:** Create the `negotiations` table in Supabase with the schema defined above.
    2.  **Backend Scaffolding:** Create the `api/negotiate.js` serverless function.
    3.  **Session Management:** Implement API logic to create a new negotiation session in the database upon file upload and role selection.
    4.  **Initial Prompt Engineering:** Develop the first version of the Gemini system prompt for both NewCo and BigTech roles.
    5.  **Core Negotiation Logic:** Implement the main API loop: receive user text, load session state from DB, call Gemini, save the AI's response and new state back to the DB.
    6.  **Minimal Frontend:** Build a simple "barebones" UI in `03-the-exercise.md` with a text input and a display area to test the backend.

#### **Phase 2: Full Frontend UI & Feature Integration**

*   **Goal:** Build the complete user interface and integrate features like round structuring and the after-action report.
*   **Tasks:**
    1.  **UI Development:** Using Preact or vanilla JS, build the full DealCraft interface: the upload screen, role selection modal, and the main negotiation view with chat history.
    2.  **Round Proposal Logic:** Implement the pre-negotiation analysis where the AI proposes the rounds. This will be a special call to the `api/negotiate.js` endpoint.
    3.  **Round Summaries:** Implement the logic to generate and display summaries after each round is completed.
    4.  **After-Action Report:** Create the logic to trigger the final analysis upon negotiation completion. This will be another specialized prompt sent to Gemini, summarizing the entire `history` and `current_term_sheet_json`.

#### **Phase 3: Advanced Interaction Modes**

*   **Goal:** Introduce voice chat and the ability to trade redlined documents.
*   **Tasks:**
    1.  **Voice Chat Integration:**
        *   On the frontend, use the Web Speech API to capture user voice and transcribe it to text.
        *   Send the transcribed text to the backend as normal.
        *   When the AI's text response is received, use the Web Speech API's synthesis feature to speak it aloud.
    2.  **Redline Trading Logic:**
        *   Update the UI to allow file uploads mid-negotiation.
        *   When a new document is uploaded, the backend will extract its text.
        *   The prompt to Gemini will be specifically formatted: "The user has uploaded a new version of the term sheet. Here is the previous version: [text]. Here is the new version: [text]. Please analyze the changes and formulate a response."
        *   This is the most complex phase and will require significant prompt engineering to work reliably.

#### **Phase 4: Refinement, Stalemate Logic & Testing**

*   **Goal:** Polish the experience, add robustness, and prepare for release.
*   **Tasks:**
    1.  **Stalemate & Termination:** Implement the turn-counter and/or AI-driven logic to detect an impasse and gracefully end the negotiation.
    2.  **AI Persona Tuning:** Refine the Gemini system prompts based on test negotiations to make the AI's persona more realistic and its strategy more nuanced.
    3.  **Error Handling:** Improve frontend and backend error handling for issues like failed API calls, invalid file types, etc.
    4.  **User Testing:** Conduct thorough testing with target users to gather feedback on difficulty, realism, and the quality of the AI's feedback. Iterate based on this feedback.
