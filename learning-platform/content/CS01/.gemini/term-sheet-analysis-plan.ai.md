### **Phase 1: Account Setup & Service Configuration (User Actions)**

This foundational phase involves setting up the necessary accounts and services. I cannot perform these steps for you as they require access to your personal accounts and sensitive information.

*   **Step 1: Vercel Project Setup**
    *   **Your Action:** Go to your [Vercel dashboard](https://vercel.com/dashboard). Connect your GitHub account and import the repository for this project. Vercel will automatically detect the project type. This enables continuous deployment, where any `git push` will trigger a new build.

*   **Step 2: Supabase Project Setup**
    *   **Your Action:** Go to your [Supabase dashboard](https://app.supabase.io/).
        1.  Create a new project.
        2.  In your new project, go to the "Storage" section and create a new "Bucket". You can name it `term-sheet-uploads`. For now, you can make the bucket public for simplicity, but we will implement a more secure upload policy later.
        3.  Go to "Project Settings" > "API". Keep this page open; you will need the **Project URL** and the `service_role` **Secret Key** in a later step.

*   **Step 3: Gather API Keys**
    *   **Your Action:** Collect the following secret keys. You will add these to Vercel in Phase 4.
        1.  **Supabase URL & Service Key:** From the previous step.
        2.  **Gemini API Key:** From your Google AI account dashboard.

---

### **Phase 2: Backend Implementation (AI Actions)**

In this phase, I will build the serverless function that powers the analysis.

*   **Step 4: Scaffold the Backend**
    *   **My Action:**
        1.  Create a new directory named `api` in the project root. Vercel automatically recognizes this as the location for serverless functions.
        2.  Create a `package.json` file inside the `api` directory to manage backend dependencies.
        3.  Install the necessary Node.js packages: `supabase-js` (to talk to Supabase), `mammoth` (to read `.docx` files), `pdf-parse` (to read `.pdf` files), and `@google/generative-ai` (to use the Gemini API).

*   **Step 5: Implement the Analysis Logic**
    *   **My Action:** I will write the code for the serverless function in a new file, `api/analyze.js`. This code will perform the following steps:
        1.  Receive a request containing the filename of the uploaded term sheet.
        2.  Use the Supabase SDK to download the specified file from your storage bucket.
        3.  Extract the raw text from the document.
        4.  Read the content of `01-foundations.md` and `02-the-deal.md` to create a detailed context for the AI.
        5.  Construct a comprehensive prompt for the Gemini API, including the case study context and the user's redlined text.
        6.  Send the prompt to the Gemini API and wait for the analysis.
        7.  Format the AI's response and send it back to the frontend.

---

### **Phase 3: Frontend Implementation (AI Actions)**

Now, I will build the user-facing component on the Jekyll site.

*   **Step 6: Create the User Interface**
    *   **My Action:** I will edit the `03-the-exercise.md` file to add the necessary HTML. This will include:
        1.  A file input field for the user to select their document.
        2.  A "Submit for Analysis" button.
        3.  A designated area to display the results, along with loading and error messages.

*   **Step 7: Implement the Client-Side Logic**
    *   **My Action:** I will create a new file, `assets/js/term-sheet-analyzer.js`, and link it in the site's HTML. This script will:
        1.  Handle the file selection and form submission.
        2.  Directly upload the selected file to your Supabase bucket.
        3.  Once the upload is complete, it will send a request to our `/api/analyze` serverless function.
        4.  Display a "loading" message while the analysis is in progress.
        5.  Receive the formatted analysis from the backend and display it to the user.

---

### **Phase 4: Deployment & Secrets (User Action)**

This is a critical step where you connect the services by providing the secret keys to Vercel.

*   **Step 8: Configure Environment Variables**
    *   **Your Action:** Go to your project's settings in the Vercel dashboard. Navigate to the "Environment Variables" section and add the following keys that you collected in Step 3:
        *   `SUPABASE_URL`
        *   `SUPABASE_SERVICE_KEY`
        *   `GEMINI_API_KEY`
    *   This ensures that our serverless function can securely access these services without exposing the keys in the code.

---

### **Phase 5: Final Testing (User Action)**

After you've configured the environment variables, the final step is to test the entire workflow.

*   **Step 9: Test the Feature**
    *   **Your Action:**
        1.  Push all the code changes to your GitHub repository. Vercel will automatically build and deploy the site.
        2.  Navigate to the live URL for Module 3.
        3.  Upload a test term sheet document (`.docx` or `.pdf`).
        4.  Verify that you receive the AI-powered analysis.
