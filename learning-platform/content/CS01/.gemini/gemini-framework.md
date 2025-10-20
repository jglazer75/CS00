Excellent. This is an exciting project. Adding interactive AI agents will create a dynamic learning experience. Here is a recommended architecture and plan that leverages your existing accounts and the structure of your Jekyll site.

### **Overall Architecture**

Since GitHub Pages hosts static content, it cannot execute backend code. Therefore, we'll adopt a **hybrid architecture**. The existing Jekyll site will serve as the frontend, and we will build a lightweight, serverless backend to handle the AI processing and data persistence.

*   **Frontend**: The existing Jekyll site. We will add HTML and JavaScript to the Module 3 pages to create the user interfaces for the agents.
*   **Backend**: **Vercel Serverless Functions**. Since you have a Vercel account, this is a perfect fit. We can write simple, standalone functions (e.g., in Node.js) that live in an `/api` directory in your project. Vercel automatically deploys them as scalable API endpoints.
*   **AI**: **Gemini Pro API**. This will be called from our Vercel backend to perform the analysis and negotiation logic.
*   **Database**: **Supabase**. Needed for Agent 2 to maintain the state of the negotiation across multiple interactions.

This approach is cost-effective, scalable, and integrates smoothly with your existing setup without requiring you to manage a traditional server.

---

### **Plan & Implementation Details**

#### **Phase 1: Backend Setup**

1.  **Project Structure**:
    *   In your project's root directory, create a new folder named `api`. Any JavaScript or TypeScript files placed here will be treated as a serverless API endpoint by Vercel.
    *   Example: `api/analyze-terms.js` would become accessible at `your-vercel-url.com/api/analyze-terms`.
2.  **Vercel Configuration**:
    *   Connect your GitHub repository to your Vercel account.
    *   Set the build command in Vercel to `jekyll build` and the output directory to `_site`. This ensures Vercel builds your Jekyll site correctly before deploying.
    *   Add your Gemini Pro API key and Supabase project details as Environment Variables in the Vercel project settings. This keeps them secure.
3.  **Required Libraries (Backend)**:
    *   You will need a `package.json` file in your root directory to manage backend dependencies.
    *   **Key Node.js modules**:
        *   `@google/generative-ai`: The official Node.js client for the Gemini API.
        *   `@supabase/supabase-js`: The official client for interacting with your Supabase database.
        *   `mammoth`: A robust library for converting `.docx` files into plain text, preserving comments if needed.
        *   `formidable` or `multer`: To handle file uploads sent from the frontend.

---

#### **Phase 2: Agent 1 (Term Sheet Analyzer)**

This agent is stateless and simpler. It takes a file, analyzes it, and returns a result.

*   **Backend (`api/analyze-terms.js`)**:
    1.  **Endpoint Definition**: Create a function that accepts a `POST` request containing the uploaded `.docx` file.
    2.  **File Parsing**: Use `formidable` to process the incoming file upload.
    3.  **Content Extraction**: Use the `mammoth` library to extract the text and any user comments from the DOCX file.
    4.  **AI Prompting**: Construct a detailed prompt for the Gemini Pro API. The prompt should include:
        *   The extracted text and comments from the term sheet.
        *   A clear instruction defining the agent's persona: "You are an expert legal technology assistant providing feedback to a law or graduate business student."
        *   Specific instructions: "Analyze the user's revisions and comments. Provide constructive analysis of their suggestions. Then, suggest 3-5 other important concepts or clauses they may have missed. Frame your response in a clear, educational tone."
    5.  **API Call**: Send the prompt to the Gemini API.
    6.  **Response**: Return the AI's analysis as a JSON object to the frontend.

*   **Frontend (`03-the-exercise.md`)**:
    1.  **UI**: Add a simple HTML form to the page with a file input (`<input type="file" accept=".docx">`) and a "Submit for Analysis" button. Add a `div` to display the results.
    2.  **JavaScript**:
        *   Write a script that listens for the form submission.
        *   On submit, use the `fetch()` API to send the selected file in a `POST` request to your `/api/analyze-terms` endpoint.
        *   When the response is received, parse the JSON and display the agent's analysis in the results `div`.

---

#### **Phase 3: Agent 2 (Negotiation Bot)**

This agent is stateful and requires a database to track the conversation.

*   **Supabase Schema**:
    1.  Create a table named `negotiations`.
    2.  **Columns**: `id` (primary key), `created_at`, `user_id` (optional, for future features), `current_terms_text` (to store the evolving state of the term sheet), and `conversation_history` (a JSONB field to store the back-and-forth messages).

*   **Backend (`api/negotiate.js`)**:
    1.  **Endpoint Definition**: This single endpoint can handle different actions based on the request body (e.g., `action: 'start'`, `action: 'send_message'`).
    2.  **Start Negotiation**:
        *   If `action` is `start`, parse the uploaded `.docx` file (similar to Agent 1).
        *   Create a new row in the Supabase `negotiations` table, storing the initial text and a welcome message in the `conversation_history`.
        *   Return the `id` of the new negotiation to the frontend.
    3.  **Send Message**:
        *   If `action` is `send_message`, the request will include the `negotiation_id` and the user's message.
        *   Fetch the `conversation_history` and `current_terms_text` from Supabase using the ID.
        *   Append the user's message to the history.
        *   Construct a prompt for Gemini Pro, including:
            *   The persona: "You are a [Licensor/Licensee] negotiating a term sheet. Your goal is to [state goals for that role]."
            *   The full `conversation_history`.
            *   The `current_terms_text`.
            *   An instruction: "Generate the next response in the negotiation. Provide commentary and, if appropriate, a proposed amendment to the terms."
        *   Call the Gemini API.
        *   Append the agent's response to the history and update the `current_terms_text` if the agent proposed a change.
        *   Save the updated record back to Supabase.
        *   Return the agent's latest message to the frontend.

*   **Frontend (`03-the-exercise.md`)**:
    1.  **UI**: This will be a more complex, two-part UI.
        *   Part 1: A form to upload the initial term sheet and select a role (Licensor or Licensee).
        *   Part 2: A chat interface (a message display area and a text input box) that appears after the negotiation starts.
    2.  **JavaScript**:
        *   The script will first handle the file upload to start the negotiation, storing the returned `negotiation_id`.
        *   It will then manage the chat interface, sending user messages to the `/api/negotiate` endpoint (with `action: 'send_message'`) and displaying the agent's responses as they arrive.