### **Part 1: System Architecture**

This architecture is designed for maintainability, scalability, and a rich, interactive user experience, using a modern tech stack.

#### **1.1. Guiding Principles**

*   **Material Design:** The user interface will strictly adhere to [Google Material Design](https://m3.material.io/) principles. This ensures a consistent, intuitive, and accessible user experience.
*   **Clarity and Focus:** The design will minimize distractions and use a card-based layout to "chunk" content into digestible pieces, reducing cognitive load.
*   **Content-Driven:** Your Markdown files are the source of truth. The system will be built to render them beautifully within Material Design components.
*   **Modular & Scalable:** The frontend, backend, database, and AI components are decoupled, allowing them to be developed, maintained, and scaled independently.

#### **1.2. Technology Stack**

*   **Frontend:** **Next.js (React)** hosted on Vercel.
*   **UI Component Library:** **MUI for React** (formerly Material-UI). This library provides robust components that follow Google Material Design guidelines.
*   **Backend & Database:** **Supabase**. It will provide authentication, a PostgreSQL database, and file storage.
*   **Content Source:** **Markdown (`.md`/`.mdx`) files** stored in the project's GitHub repository.
*   **AI Integration:** **Vercel Serverless Functions** to securely interact with third-party AI models.
*   **Deployment:** **Vercel**.

#### **1.3. Architectural Diagram**

```
+-------------+      +-----------------+      +------------------------+
|             |----->|                 |----->|                        |
|    User     |      |  Next.js App    |      |   AI Service (OpenAI)  |
| (Browser)   |<-----|  (on Vercel)    |<-----| (via Serverless Func)  |
|             |      |                 |      |                        |
+-------------+      +-------+---------+      +------------------------+
                             |
                             |
                             v
                  +--------------------+
                  |      Supabase      |
                  |--------------------|
                  | - Authentication   |
                  | - Database (Users, |
                  |   Progress, Files) |
                  | - Storage (Uploads)|
                  +--------------------+
```

#### **1.4. Core Components**

1.  **Content Engine:**
    *   The application will read Markdown files from a `/content` directory. For the pilot, this will contain the contents of the `CS01/docs` folder.
    *   **Module Structure:** The engine will recognize the numbered file convention (e.g., `01-foundations.md`, `02-the-deal.md`) to automatically order the pages and build the module's navigation structure.
    *   **Content Types:** The engine will differentiate between standard content (`.md`) and specialized AI interactions (`.ai.md`), allowing the UI to render a different component (e.g., a chat interface) for the AI-centric lessons.
    *   **Frontmatter Handling:** Each file's YAML frontmatter will be parsed. If missing, the system will use the filename to generate a title (e.g., `01-foundations.md` becomes "Foundations").

2.  **User & Progress System (Supabase):**
    *   **Authentication:** Supabase will handle OAuth with providers like Google and GitHub.
    *   **Database Schema:**
        *   `users`: Stores user profile information.
        *   `user_module_progress`: Tracks which pages a user has completed, linking `user_id` to `page_id`.
        *   `user_documents`: Stores metadata about files uploaded by users for exercises, linking them to the user and the specific module exercise.

***

### **Part 2: UI/UX and Visual Identity (Material Design Implementation)**

The UI will be clean, approachable, and encouraging, using a card-based layout to organize all content and interactions.

#### **2.1. Wireframes (Card-Based Layout)**

**Wireframe 1: Dashboard / Module Selection**

The dashboard is a clean grid of Material Design "Cards." Each card represents a module, showing progress and a clear call-to-action.

```
+----------------------------------------------------------------------+
| [App Bar with Logo and User Profile Icon]                            |
|----------------------------------------------------------------------|
|                                                                      |
|  <Grid of Cards with Ample Whitespace>                               |
|                                                                      |
|  +---------------------------------+  +-----------------------------+  |
|  | [Card Media: Module Image]      |  | [Card Media: Module Image]  |  |
|  |                                 |  |                             |  |
|  | **Venture Capital Term Sheet**  |  | **Financing a CPG Product** |  |
|  | [Linear Progress Bar: 75%]      |  | [Linear Progress Bar: 0%]   |  |
|  |                                 |  |                             |  |
|  | [Button: RESUME]                |  | [Button: START]             |  |
|  +---------------------------------+  +-----------------------------+  |
|                                                                      |
+----------------------------------------------------------------------+
```

**Wireframe 2: Core Module Page (Pilot Module Example)**

This view shows how the content from the `CS01` module would be rendered as a series of cards. The user scrolls down to progress through the lesson.

```
+----------------------------------------------------------------------+
| [App Bar: VC Term Sheet Negotiation] [Progress: 15%]      [Exit Icon]|
|----------------------------------------------------------------------|
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | **1. Foundations** (from 01-foundations.md)                    |  |
|  |                                                                |  |
|  | This card would contain the introductory text, key concepts,   |  |
|  | and learning objectives parsed from the markdown file.         |  |
|  |                                                                |  |
|  | [Checkbox: Mark as Complete]                                   |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | **3. The Exercise** (from 03-the-exercise.md)                  |  |
|  |                                                                |  |
|  | This card would present the primary task, such as redlining a  |  |
|  | source document.                                               |  |
|  |                                                                |  |
|  | [Button: DOWNLOAD TERM SHEET] [Upload Button: SUBMIT REDLINE]  |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | **AI Analysis** (from term-sheet-analysis-plan.ai.md)          |  |
|  |                                                                |  |
|  | This card would feature an interactive AI chat interface.      |  |
|  | User Prompt: "Review my uploaded redline for market standards."|  |
|  | [Text Input Field] [Send Button]                               |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
+----------------------------------------------------------------------+
```

#### **2.2. Visual Identity**

*   **Color Palette (Material Theme):**
    *   **Primary:** `#002D5A` (Deep Navy)
    *   **Secondary:** `#2A5A2A` (Forest Green)
    *   **Surface:** `#FFFFFF` (White) / `#F7F7F7` (Light Gray)
    *   **On Primary/Secondary/Surface:** `#FFFFFF` / `#212121`
    *   **Accent/Highlight:** `#FDB813` (Harvest Gold)
*   **Typography:**
    *   **Primary Font:** **Roboto**.
*   **Icons:**
    *   **Material Symbols (Icons)**.

***

### **Part 3: Development Roadmap**

#### **Phase 1: Minimum Viable Product (MVP)**

**Goal:** Launch a polished, single-user learning platform with the "Venture Capital Term Sheet Negotiation" module fully implemented.

1.  **Project Setup:**
    *   Initialize Next.js application and configure it with MUI for React.
    *   Set up Supabase and Vercel.
2.  **Pilot Module Implementation:**
    *   **Copy Content:** Move the contents of `CS01/docs` and `CS01/source-documents` into the Next.js project's `/content` directory.
    *   **Build Content Engine:** Develop the Markdown parser to specifically handle the file structure (`01-...`, `...ai.md`) and content of the pilot module.
3.  **UI/UX Foundation:**
    *   Implement the Material Design Theme.
    *   Build the core layouts and `Card` components required to render the pilot module exactly as shown in the refined wireframe.
4.  **Authentication & State Management:**
    *   Integrate Supabase Auth.
    *   Connect the frontend to Supabase to track user progress through the specific pages of the pilot module.
5.  **Document Upload & Basic AI Interaction:**
    *   Enable file uploads for "The Exercise" card.
    *   Create the Vercel Serverless Function and the AI chat card, ensuring it can respond to prompts related to the module's content.

#### **Phase 2: Collaboration & Community**

**Goal:** Enable users to learn together in small groups.

1.  **Team Data Model:** Extend the Supabase schema for teams.
2.  **Team Management:** Build UI for creating and managing teams.
3.  **Real-time Collaboration:** Integrate Supabase Realtime for shared exercises.

#### **Phase 3: Advanced Features & Personalization**

**Goal:** Enhance the learning experience with more powerful tools and role-based content.

1.  **Advanced AI:** Introduce features like selecting AI difficulty levels or models.
2.  **Expanded Assessments:** Integrate new assessment types like quizzes.
3.  **Persona-Based Roles:** Implement a role-based access control (RBAC) system.
