### Phase 1: Core Backend & Text-Based MVP (Completed)

**Goal:** Establish the foundational architecture and a working text-only negotiation loop.

1.  **Database Setup (Supabase):**
    *   **Action:** Create the `negotiations` table in Supabase.
    *   **Details:** Use the Supabase SQL editor or dashboard to create a new table named `negotiations` with the following schema:
        *   `id` (uuid, primary key)
        *   `user_id` (uuid, foreign key, optional)
        *   `created_at` (timestamp)
        *   `status` (text)
        *   `user_role` (text)
        *   `ai_role` (text)
        *   `original_term_sheet` (text)
        *   `current_term_sheet_json` (jsonb)
        *   `history` (jsonb)

2.  **Backend Scaffolding (Vercel):**
    *   **Action:** Create the `api/negotiate.js` serverless function.
    *   **Details:** Create a new file `negotiate.js` inside the `api` directory. This file will contain the core logic for handling negotiation sessions.

3.  **Session Management:**
    *   **Action:** Implement API logic to create a new negotiation session.
    *   **Details:**
        *   The frontend will send a request to `api/negotiate.js` with the user's selected role and the uploaded term sheet.
        *   The `negotiate.js` function will:
            *   Create a new record in the `negotiations` table.
            *   Store the initial term sheet text and user role.
            *   Return a unique `session_id` to the frontend.

4.  **Initial Prompt Engineering:**
    *   **Action:** Develop the first version of the Gemini system prompt.
    *   **Details:**
        *   Create a separate file (e.g., `api/prompts.js`) to store the system prompts for both NewCo and BigTech roles.
        *   The prompts should define the AI's persona, objectives, and constraints based on the case study materials.

5.  **Core Negotiation Logic:**
    *   **Action:** Implement the main API loop in `api/negotiate.js`.
    *   **Details:**
        *   The function will receive a `session_id` and the user's text input.
        *   It will load the session data (history, current term sheet state) from the `negotiations` table.
        *   It will construct a prompt for the Gemini API, including the system prompt, conversation history, and the user's latest message.
        *   It will send the prompt to the Gemini API and receive the AI's response.
        *   It will update the session data in the database with the new turn and any changes to the term sheet state.
        *   It will return the AI's response to the frontend.

6.  **Minimal Frontend:**
    *   **Action:** Build a simple UI in `03-the-exercise.md`.
    *   **Details:**
        *   Add a new section to the `03-the-exercise.md` file for the DealCraft feature.
        *   Include a text input for the user to type their messages and a display area to show the conversation history.
        *   Add a new JavaScript file `assets/js/dealcraft.js` to handle the frontend logic:
            *   Sending user messages to the backend.
            *   Displaying the AI's responses.

### Phase 2: Full Frontend UI & Feature Integration

**Goal:** Build the complete user interface and integrate features like round structuring and the after-action report.

1.  **UI Development:**
    *   **Action:** Build the full DealCraft interface.
    *   **Details:**
        *   Enhance the UI in `03-the-exercise.md` to include:
            *   A file upload screen for the term sheet.
            *   A modal for role selection (NewCo or BigTech).
            *   A more polished negotiation view with clear chat history.
        *   Use vanilla JavaScript or a lightweight library like Preact to manage the UI components.

2.  **Round Proposal Logic:**
    *   **Action:** Implement the pre-negotiation analysis for proposing rounds.
    *   **Details:**
        *   After the user uploads the term sheet and selects their role, the frontend will make a special call to the `api/negotiate.js` endpoint.
        *   The backend will send a prompt to the Gemini API to analyze the term sheet and propose negotiation rounds.
        *   The frontend will display the proposed rounds to the user for approval before starting the negotiation.

3.  **Round Summaries:**
    *   **Action:** Implement logic to generate and display round summaries.
    *   **Details:**
        *   The backend will detect when a round is completed based on the conversation.
        *   It will send a prompt to the Gemini API to summarize the agreed-upon points for that round.
        *   The frontend will display the summary to the user before proceeding to the next round.

4.  **After-Action Report:**
    *   **Action:** Create the logic to generate the final analysis.
    *   **Details:**
        *   When the negotiation is completed (either by agreement or stalemate), the frontend will trigger a final analysis.
        *   The backend will send a prompt to the Gemini API with the entire negotiation history and the final term sheet state.
        *   The Gemini API will generate a comprehensive after-action report.
        *   The frontend will display the report to the user.

### Phase 3: Advanced Interaction Modes

**Goal:** Introduce voice chat and the ability to trade redlined documents.

1.  **Voice Chat Integration:**
    *   **Action:** Use the Web Speech API for voice input and output.
    *   **Details:**
        *   **Frontend:**
            *   Use the `SpeechRecognition` API to capture the user's voice and transcribe it to text.
            *   Send the transcribed text to the backend.
            *   Use the `SpeechSynthesis` API to speak the AI's text response aloud.

2.  **Redline Trading Logic:**
    *   **Action:** Allow users to upload new versions of the term sheet mid-negotiation.
    *   **Details:**
        *   **Frontend:** Add a button to the UI to allow file uploads during the negotiation.
        *   **Backend:**
            *   When a new document is uploaded, the backend will extract its text.
            *   It will construct a specific prompt for the Gemini API, asking it to analyze the changes between the previous and new versions of the term sheet.
            *   The AI's response will be based on this analysis.

### Phase 4: Refinement, Stalemate Logic & Testing

**Goal:** Polish the experience, add robustness, and prepare for release.

1.  **Stalemate & Termination:**
    *   **Action:** Implement logic to detect and handle negotiation impasses.
    *   **Details:**
        *   The backend will keep track of the number of turns in the negotiation.
        *   It will also use the Gemini API to detect if a stalemate has been reached on a critical deal term.
        *   If a stalemate is detected or the turn limit is reached, the negotiation will be gracefully ended.

2.  **AI Persona Tuning:**
    *   **Action:** Refine the Gemini system prompts.
    *   **Details:**
        *   Based on test negotiations, the system prompts for both NewCo and BigTech will be refined to make the AI's persona more realistic and its negotiation strategy more nuanced.

3.  **Error Handling:**
    *   **Action:** Improve frontend and backend error handling.
    *   **Details:**
        *   Implement robust error handling for failed API calls, invalid file types, and other potential issues.

4.  **User Testing:**
    *   **Action:** Conduct thorough testing with target users.
    *   **Details:**
        *   Gather feedback on the difficulty, realism, and quality of the AI's feedback.
        *   Iterate on the implementation based on user feedback.
