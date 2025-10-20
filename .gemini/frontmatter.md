# Front-matter Glossary

This document defines the YAML front-matter fields used in the Markdown content files for the learning platform.

---

### **Learning Metadata**

This information is considered core to the learning experience and is typically displayed prominently in a `MetadataCard` at the beginning of a page.

*   **`title`**
    *   **Type:** String
    *   **Description:** The main title of the page. Used for the page heading and in navigation menus.
    *   **Example:** `title: "Foundations of Venture Capital"`

*   **`learning_objectives`**
    *   **Type:** Array of Strings
    *   **Description:** A list of specific, measurable goals that the learner should be able to achieve after completing the page.
    *   **Example:**
        ```yaml
        learning_objectives:
          - "Define a venture capital term sheet."
          - "Identify key stakeholders in a negotiation."
        ```

*   **`core_concepts`**
    *   **Type:** Array of Strings
    *   **Description:** A list of the fundamental ideas or principles introduced on the page.
    *   **Example:**
        ```yaml
        core_concepts:
          - "Valuation"
          - "Liquidation Preference"
          - "Anti-Dilution"
        ```

*   **`keywords`**
    *   **Type:** Array of Strings
    *   **Description:** A list of key terms or tags associated with the page content, useful for search and categorization.
    *   **Example:**
        ```yaml
        keywords:
          - "Startup Finance"
          - "Term Sheet"
          - "Seed Round"
        ```

---

### **Demographic & File Metadata**

This information provides context about the document itself and is typically displayed in a less prominent location, such as a page header or footer.

*   **`author`**
    *   **Type:** String
    *   **Description:** The name of the person or entity that created the content.
    *   **Example:** `author: "J. Glazer"`

*   **`date`**
    *   **Type:** String (ISO 8601 Format: YYYY-MM-DD)
    *   **Description:** The publication or last modification date of the content.
    *   **Example:** `date: "2025-10-19"`

---

### **Page & Team Metadata**

This metadata controls how the page functions within the platform, including access control.

*   **`pageId`**
    *   **Type:** String
    *   **Description:** A unique identifier for the page within a module. Used internally for tracking progress.
    *   **Example:** `pageId: "cs01_01_foundations"`

*   **`team`**
    *   **Type:** String
    *   **Description:** (For Phase 2+) Restricts the visibility of this page to a specific team during a simulation or collaborative exercise.
    *   **Example:** `team: "bigtech"`
