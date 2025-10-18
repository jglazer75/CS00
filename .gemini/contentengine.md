# Plan: Building an Extensible Content Engine for Next.js

This document outlines the step-by-step plan for creating a maintainable and extensible content engine. The primary goal is to build a system where new modules (like CS02, CS03, etc.) can be added by simply adding new folders and markdown files, without requiring any changes to the application code.

---

### **Step 1: Install Necessary Tools**

First, we need to add specialized libraries to the project to handle file parsing and markdown conversion.

1.  **Navigate to your project directory:**
    ```bash
    cd learning-platform
    ```
2.  **Install the libraries:**
    *   **`gray-matter`**: To parse YAML frontmatter from markdown files.
    *   **`remark` & `remark-html`**: To convert the main markdown content into an HTML string for safe rendering.
    ```bash
    npm install gray-matter remark remark-html
    ```

---

### **Step 2: Create a Generic, Centralized Content Library**

All logic for accessing and parsing content will be centralized in a single helper file. This keeps the code organized and reusable.

1.  **Create the library file:**
    *   Create a new directory at the root of your project named `lib/`.
    *   Inside it, create a new file named `content.js`.

2.  **Define the library functions:** This file will contain three core functions:

    *   **`getAllModuleIds()`**:
        *   **Purpose:** To discover all available course modules automatically.
        *   **Logic:** Reads the names of all subdirectories within the `content/` folder (e.g., `CS01`, `CS02`).
        *   **Returns:** An array of module ID strings: `['CS01', 'CS02', ...]`.

    *   **`getSortedPagesData(moduleId)`**:
        *   **Purpose:** To get the metadata for all pages within a *specific* module, sorted correctly for navigation.
        *   **Argument:** `moduleId` (string, e.g., `"CS01"`).
        *   **Logic:**
            1.  Constructs the path to the module's directory (e.g., `content/CS01`).
            2.  Reads all `.md` filenames within that directory.
            3.  For each file, it parses the frontmatter using `gray-matter`.
            4.  It creates a "slug" from the filename (e.g., `01-foundations`).
            5.  It sorts the list of pages based on the numerical filename prefix.
        *   **Returns:** A sorted array of objects, each containing the page slug and its frontmatter data.

    *   **`getPageData(moduleId, slug)`**:
        *   **Purpose:** To get the full, renderable content for a single page.
        *   **Arguments:** `moduleId` (string) and `slug` (string).
        *   **Logic:**
            1.  Constructs the full path to the target markdown file (e.g., `content/CS01/01-foundations.md`).
            2.  Reads the file content.
            3.  Uses `gray-matter` to separate frontmatter from the markdown body.
            4.  Uses `remark` to convert the markdown body into an HTML string.
        *   **Returns:** A single object containing the frontmatter data and the final HTML content string.

---

### **Step 3: Implement Fully Dynamic Routing in Next.js**

Next, we will create the dynamic route structure that will automatically generate pages for all content in all modules.

1.  **Create the Dynamic Route Directory:**
    *   In the `app/` directory, create the following nested folder structure: `app/modules/[moduleId]/[slug]/`. The square brackets denote dynamic segments.
    *   Inside the final `[slug]` folder, create a `page.js` file. This file will be the template for every module page.

2.  **Implement `generateStaticParams` in `page.js`:**
    *   **Purpose:** To tell Next.js at build time about every single page it needs to pre-render.
    *   **Logic:**
        1.  Call `getAllModuleIds()` to get the list of all modules.
        2.  Loop through each `moduleId`.
        3.  For each module, call `getSortedPagesData(moduleId)` to get all of its page slugs.
        4.  Construct and return a flat list of all possible `{ moduleId, slug }` combinations.

3.  **Fetch Data in the Page Component:**
    *   The `page.js` component will receive `params` containing the `moduleId` and `slug` for the current page from the URL.
    *   It will then call `getPageData(params.moduleId, params.slug)` to fetch the content for that specific page.

---

### **Step 4: Display Content and Create Navigation**

The final step is to render the fetched data and provide navigation.

1.  **Create a Main Dashboard Page:**
    *   Use the main `app/page.js` file as the course dashboard.
    *   This page will call `getAllModuleIds()` to get a list of all available courses.
    *   It will then render a list of links, where each link points to the first page of a module (e.g., `/modules/CS01/01-foundations`).

2.  **Create a Module-Specific Navigation Component:**
    *   Create a new component, e.g., `components/ModuleNav.js`.
    *   This component will receive the current `moduleId` as a prop.
    *   It will call `getSortedPagesData(moduleId)` to get the list of all pages for the *current* module.
    *   It will render a list of links to each page within that module, highlighting the currently active page.
    *   This component will be placed in a shared layout that applies to the module pages.

3.  **Render the Page Content:**
    *   In the `app/modules/[moduleId]/[slug]/page.js` component:
    *   Display the title and other metadata from the frontmatter directly.
    *   Render the main HTML content using `dangerouslySetInnerHTML`. This is the standard, safe way to display HTML that has been processed by `remark`.

---

### **Workflow for Adding a New Module (e.g., CS05)**

With this system in place, adding a completely new module involves these simple steps:

1.  Create a new folder named `CS05` inside the `content/` directory.
2.  Add your numbered markdown files (`01-intro.md`, `02-topic.md`, etc.) with the appropriate frontmatter inside `content/CS05/`.
3.  (If applicable) Add any source documents to `content/CS05/source-documents/`.

That's it. The content engine will automatically discover the new module and its pages the next time the application is built. No code changes are needed.
