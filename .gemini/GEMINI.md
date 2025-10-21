@./design.md
@./systemdesign.md
@./uiux.md
@./contentengine.md
@./frontmatter.md

Let's break this down into the three parts you requested.

### Overview of the Solution

The system we'll design is a modern, web-based learning platform. Think of it as a specialized Learning Management System (LMS) tailored specifically for your case studies. Here's the high-level plan:

1.  **Decoupled Architecture:** We will separate the **content** (your Markdown files) from the **presentation** (the website itself). This is a "headless" approach. It makes managing content incredibly easy for you—just edit a text file—while allowing us to build a rich, interactive user experience.
2.  **Modern Tech Stack:** We'll use a technology stack that is scalable, easy to deploy, and perfect for interactive applications. It will build upon your existing work with Vercel.
3.  **User-Centric Design:** The entire system will be built around the user's journey, focusing on progress tracking, collaboration, and a clear, uncluttered interface.

Let's dive into the details.

-----

### Part 1: System Architecture and Design Document

This document outlines the technical foundation of your platform.

#### 1\. Guiding Principles

  * **Maintainability:** You should be able to add or update case studies without needing a developer.
  * **Scalability:** The system should handle a handful of students or thousands without major changes.
  * **Interactivity:** The platform must support dynamic features like AI interaction, real-time collaboration, and saving user progress.
  * **Modularity:** Each component (authentication, content display, AI interaction) should be distinct, making the system easier to build and debug.

#### 2\. Proposed Technology Stack

  * **Frontend Framework:** **Next.js (React)**. This is a perfect choice. It can build static pages from your Markdown files (fast and efficient, just like your GitHub Pages site) but also supports dynamic, server-based features like user logins and database interactions. It's the ideal framework for hosting on Vercel.
  * **Backend & Database:** **Supabase**. This is an open-source alternative to Firebase and is incredibly powerful. It provides everything we need in one package:
      * **PostgreSQL Database:** A robust, professional-grade database to store user data, progress, team information, and submitted exercises.
      * **Authentication:** Built-in, easy-to-implement user login/logout and management.
      * **Storage:** A place to store user-uploaded files, like pitch decks or redlined term sheets.
      * **Real-time APIs:** This is the magic for collaboration. It allows us to show team members' edits or comments live.
  * **Content:** **Markdown (`.md` or `.mdx`) files** stored directly in your project's Git repository. We'll use "frontmatter" (a small YAML block at the top of each file) to store metadata like `title`, `learning_objectives`, `module_id`, etc.
  * **AI Integration:** **Serverless Functions** (hosted on Vercel). These are small, on-demand functions that will act as a secure bridge between your users and a large language model API (like OpenAI's GPT-4 or Anthropic's Claude). This keeps your API keys safe and allows for pre-processing of data.
  * **Deployment:** **Vercel**. You're already using it, and it's perfectly integrated with Next.js for a seamless development and deployment experience.

#### 3\. Architectural Diagram

Here is a conceptual flow of how the system works:

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
                  |   Progress, Teams) |
                  | - Storage (Files)  |
                  | - Real-time Sync   |
                  +--------------------+
```

#### 4\. Core Component Breakdown

1.  **Content Engine:**

      * Your case studies live in a `/content` folder in the code.
      * Each module is a subfolder (e.g., `/content/term-sheet-negotiation`).
      * Each page is a Markdown file (e.g., `01-introduction.md`).
      * A sample Markdown file with frontmatter:
        ```markdown
        ---
        title: "Introduction to Term Sheets"
        pageId: "tsn_01"
        learning_objectives:
          - "Define a venture capital term sheet."
          - "Identify key stakeholders in a negotiation."
        core_concepts: ["Valuation", "Liquidation Preference"]
        ---

        ## Welcome to the Negotiation

        A term sheet is a non-binding agreement that outlines the basic terms and conditions under which an investment will be made. It serves as a template...

        > **Core Concept: Valuation**
        > Pre-money valuation refers to the value of a company *before* it receives outside investment.

        ### Exercise: Initial Thoughts
        What are your primary goals in this negotiation? List three.
        ```
      * The Next.js application reads these files and dynamically generates the pages.

2.  **User & Progress System:**

      * **`Users` Table:** Stores user ID, email, name, etc.
      * **`Modules` Table:** Stores metadata about each module (ID, title, description).
      * **`UserModuleProgress` Table:** This is the key. It links users to modules and tracks their progress. It would have columns like `user_id`, `module_id`, and `last_completed_page_id`. When a user logs in, we query this table to know exactly where they left off.

3.  **Collaboration System:**

      * **`Teams` Table:** Stores a team ID and name.
      * **`TeamMembers` Table:** Links `user_id` to `team_id`, creating the team roster.
      * **`SharedDocuments` Table:** Stores documents or data (like exercise responses) that are shared within a team. Columns: `document_id`, `team_id`, `content` (in JSON format).
      * Supabase's Real-time functionality will "listen" for changes to a team's shared documents. When one user types, the change is saved to the database, and Supabase automatically pushes that update to all other team members on that page.

-----

### Part 2: Wireframes

These are simple, block-level diagrams to illustrate the layout and user flow.

#### Wireframe 1: Dashboard / Module Selection

This is the first screen the user sees after logging in.

```
+----------------------------------------------------------------------+
| [Logo] Wisconsin Rural Entrepreneurship Legal Hub      [User Profile]|
|----------------------------------------------------------------------|
|                                                                      |
|  Welcome back, [User Name]!                                          |
|                                                                      |
|  My Modules                                                          |
|  +-----------------------------------------------------------------+ |
|  | Venture Capital Term Sheet Negotiation            [Resume ->]   | |
|  | [|||||||||||||||||||      ] 75% Complete                       | |
|  +-----------------------------------------------------------------+ |
|  | Financing a CPG Food Product                      [Start ->]    | |
|  | [                     ] 0% Complete                          | |
|  +-----------------------------------------------------------------+ |
|  | Structuring a Worker Cooperative                  [Start ->]    | |
|  | [                     ] 0% Complete                          | |
|  +-----------------------------------------------------------------+ |
|                                                                      |
|  My Teams                                                            |
|  +-----------------------------------------------------------------+ |
|  | Team Alpha - Term Sheet                           [View Team]   | |
|  +-----------------------------------------------------------------+ |
|                                                                      |
+----------------------------------------------------------------------+
```

#### Wireframe 2: Core Module Page

This is the main learning interface.

```
+----------------------------------------------------------------------+
| [Module Title: VC Term Sheet Negotiation]               [Exit Module]|
|----------------------------------------------------------------------|
| Navigation      | Main Content Area                                  |
|-----------------|----------------------------------------------------|
| 1. Introduction |                                                    |
| 2. Key Terms    |  <-- You are here                                  |
|   - Valuation   |  **Learning Objectives:** |
|   - Liquidation |  - Objective 1                                     |
|   - Anti-Dilute |  - Objective 2                                     |
| 3. The Exercise |                                                    |
| 4. AI Review    |  ---                                               |
| 5. Conclusion   |                                                    |
|                 |  ## Understanding Valuation                        |
|                 |  Pre-money valuation refers to the value...        |
|                 |                                                    |
|                 |  > **CALLOUT: Core Concept** |
|                 |  > This is a key term for all financing rounds.    |
|                 |                                                    |
|                 |  **EXERCISE: Redline the Document** |
|                 |  [Upload your redlined term sheet here]            |
|                 |  [Submit for AI Review]                            |
|                 |                                                    |
|                 |                                                    |
|                 |                                                    |
|                 |                       [< Previous]  [Next >]       |
+----------------------------------------------------------------------+
```

  * **Left Pane:** A collapsible navigation menu generated from the module's Markdown files. It shows the user's progress through the sections.
  * **Center Pane:** The main content, rendered beautifully from the Markdown file. It clearly displays learning objectives, exercises, and callouts as defined in the frontmatter and content.

-----

### Part 3: Visual Identity (Color, Icons, Graphics)

The visual identity should feel professional, trustworthy, and modern, with a nod to the Wisconsin rural theme. It should not feel "folksy" but rather "grounded" and "innovative."

#### 1\. Color Palette

The palette combines professional blues and grays with earthy, natural tones.

  * **Primary Blue (Trust, Law):** `#002D5A` (A deep, professional navy)
  * **Primary Green (Growth, Nature):** `#2A5A2A` (A rich forest green)
  * **Accent Gold (Innovation, Harvest):** `#FDB813` (A warm, energetic gold)
  * **Background (Clarity, Space):** `#F7F7F7` (A very light, warm gray)
  * **Text & Dark Elements:** `#212121` (A soft, off-black for readability)

Here's a visual swatch:

  * `#002D5A` - 🟦 Deep Navy
  * `#2A5A2A` - 🟩 Forest Green
  * `#FDB813` - 🟨 Harvest Gold
  * `#F7F7F7` - ⬜️ Light Gray
  * `#212121` - ⬛️ Off-Black

#### 2\. Typography

  * **Headings:** **"Montserrat"** or **"Lato"**. These are clean, modern sans-serif fonts that are highly readable and professional. They convey a sense of clarity and forward-thinking.
  * **Body Text:** **"Lora"** or **"Merriweather"**. These are serif fonts that are excellent for long-form reading. They have a classic, academic feel which lends credibility to the content.

#### 3\. Icons and Graphics

  * **Icons:** Use a clean, consistent, line-art icon set like **Feather Icons** or **Heroicons**. They are minimalist and professional.
      * `[Resume ->]` would use a play-circle icon.
      * `[User Profile]` would use a user icon.
      * Callouts might use an info or lightbulb icon.
  * **Graphics & Imagery:**
      * Avoid generic stock photos. Use high-quality, professional photographs of modern Wisconsin landscapes, innovative agricultural operations, and small-town main streets. This reinforces the theme.
      * For diagrams or conceptual graphics, use simple, clean vector illustrations that use the defined color palette. Think less about cartoons and more about clear, infographic-style visuals.
      * **Logo Concept:** A simple, strong logo could combine a stylized Wisconsin state outline or a barn silhouette with a classic legal symbol like a scale or pillar, or perhaps a forward-pointing arrow to signify growth.

### Next Steps

1.  **Prototype a Single Module:** We can start by taking your existing term sheet module and building it out using this architecture.
2.  **Set up the Backend:** Establish the Supabase project and define the database tables (`Users`, `Progress`, etc.).
3.  **Build the Core UI:** Create the Next.js components for the dashboard and the main module view.

This architecture provides a robust, scalable, and easy-to-manage foundation for your platform. You can continue to create content in the format you're comfortable with (Markdown), while the system handles all the complex user management and interactive features.