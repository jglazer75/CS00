### Phase 1.3: UI/UX Foundation - Detailed Implementation Plan

This phase focuses on translating the design system and wireframes into a fully implemented, visually consistent, and user-friendly interface using Material Design principles and the Next.js/MUI stack.

---

#### **Part 1: Data & Content Parsing (`lib/content.js`)**

The foundation of the UI is how we parse and structure the content from the Markdown files.

1.  **Enhance Front-matter Parsing:**
    *   The `getPostData` function will be updated to read and return the following fields:
        *   **Learning Metadata:** `learning_objectives`, `core_concepts`, `keywords`.
        *   **Demographic Metadata:** `author`, `date`.
    *   **Future-Proofing for Phase 2:** The parser will be designed to recognize a `team` field (e.g., `team: 'bigtech'`). For now, it will be parsed and stored, but the logic to restrict access will not be implemented until Phase 2.

2.  **Implement Card Splitting Logic:**
    *   The content parsing logic will be re-architected. After parsing the full Markdown file, it will iterate through the content nodes.
    *   It will treat each `<h2>` heading as the beginning of a new "chunk."
    *   The function will return the page's content not as a single block, but as an array of objects, where each object contains a `title` (from the `<h2>`) and `content` (the Markdown that follows until the next `<h2>`).

3.  **Integrate Instructor Notes:**
    *   The data fetching process for a given page (e.g., `01-foundations.md`) will be updated to automatically look for a corresponding file in the `/instructor` subdirectory.
    *   If an instructor note file is found, its content will be fetched and associated with the main page data, ready to be passed to the UI.

---

#### **Part 2: Core Component Development (`app/components/`)**

We will build a set of reusable components to construct the page according to the wireframes and your feedback.

1.  **`MetadataCard.tsx`:**
    *   This will be the first card displayed on a page.
    *   It will accept props for `learning_objectives`, `core_concepts`, and `keywords`.
    *   It will render three distinct sections within the card, each with a clear title (e.g., "Learning Objectives") and a formatted list of items. This centralizes the page's learning goals.

2.  **`TableOfContents.tsx`:**
    *   This component will receive the array of content "chunks" from the parser.
    *   It will render a vertical list of links, using the `<h2>` titles from each chunk.
    *   It will be styled to be a "sticky" sidebar, positioned on the right side of the screen, allowing users to navigate the page content easily. The main page layout will be adjusted to a two-column design to accommodate this.

3.  **Handling `"{:.keyconcept}"` and Other Special Styling:**
    *   The default Markdown renderer does not support this syntax. We will address this by creating a custom **remark plugin**.
    *   This small plugin will inspect the text nodes of the Markdown, identify patterns like `"{:.keyconcept}"`, and wrap the preceding text in a custom component (e.g., `<KeyConcept>`).
    *   The `<KeyConcept>` React component will then apply the specific styling (e.g., highlighting, a different font weight) consistent with the Material Design theme.

---

#### **Part 3: Page Layout & Final Assembly (`app/modules/[moduleId]/[slug]/page.js`)**

This is where we bring the data and components together into the final user-facing page.

1.  **Implement the Main Page Layout:**
    *   The page will be structured with a CSS Grid or Flexbox to create the main layout:
        *   **Column 1 (Left):** The existing `ModuleNav.js` component, showing navigation for the entire module.
        *   **Column 2 (Center):** The main content area.
        *   **Column 3 (Right):** The new `TableOfContents.tsx` component.

2.  **Render Metadata and Content:**
    *   **Header/Demographic Data:** At the top of the central content column, above the cards, we will render the page's main title. Directly beneath it, in a more subtle typography (`variant="caption"`), we will display the `author` and `date`.
    *   **Card-Based Content:** The page will then map over the array of content "chunks" provided by the parser.
        *   The `MetadataCard` will be rendered first, with the appropriate props.
        *   The rest of the content chunks will be rendered sequentially, each within a generic `ContentCard` component.

3.  **Implement "Instructor Mode" Toggle:**
    *   We will use **React's Context API** to create a simple `InstructorModeContext`.
    *   A toggle switch will be placed in a persistent location, such as the main `Header.js`, allowing the user to enable or disable "Instructor Mode."
    *   On the module page, we will check if this context is `true` and if instructor notes exist for the page. If both conditions are met, the `InstructorNoteCard` will be rendered alongside the relevant student-facing content card.
