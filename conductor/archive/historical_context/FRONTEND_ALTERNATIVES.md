# Frontend Architecture: Alternatives Analysis

**Date:** January 14, 2026  
**Context:** Redesigning the CS00 Learning Platform to leverage a Schema-First Architecture.

---

## 1. Executive Summary

Moving to a **Schema-First Architecture** unlocks the ability to define complex relationships, branching paths, and rich metadata for our learning modules. This architectural shift presents a strategic opportunity to rethink the frontend experience. 

This document analyzes three distinct frontend directions:
1.  **Option A: Enhanced Status Quo (The Reader)** - Retaining the current text-heavy, card-based design.
2.  **Option B: The Split-Screen Workspace (The Dojo)** - A "Stripe Docs" style layout optimized for active work.
3.  **Option C: The Gamified Narrative (The Journey)** - A "Duolingo" style linear path optimized for engagement.

**Recommendation:** Move towards **Option B (The Dojo)** for "Workshop" modules (like Term Sheets) while retaining **Option A** for purely informational content. The Schema-First architecture supports mixing these modes.

---

## Option A: Enhanced Status Quo ("The Reader")
*The current design: A long-scrolling page of Material Design cards.*

### Concept
The user scrolls through a vertical feed of content chunks. Each "Card" is a discrete unit of information (a paragraph, a diagram, a key concept). Metadata and Instructors notes are injected as distinct cards in the flow.

### Pros
*   **Low Friction:** Users instinctively understand how to scroll a feed.
*   **Mobile-Native:** Vertical stacking works perfectly on mobile devices without complex reflows.
*   **Content-First:** The UI gets out of the way, focusing entirely on the text.
*   **Low Build Effort:** We already have 80% of this built.

### Cons
*   **Passive Learning:** Encourages "skimming" rather than active engagement.
*   **Context Switching:** If a user needs to see the "Term Sheet" while reading about "Valuation," they must scroll up/down or open a new tab, breaking flow.
*   **Tool Isolation:** AI tools (like the negotiator) feel like "roadblocks" in the feed rather than integrated assistants.

### Fit with Schema-First
*   **Neutral.** The schema handles the structure, but the UI doesn't fully leverage the new capabilities like non-linear branching or role-based views.

---

## Option B: The Split-Screen Workspace ("The Dojo")
*A productivity-focused layout inspired by Stripe Docs and IDEs.*

### Concept
The screen is divided into two distinct panes (on desktop):
*   **Left Pane (The Guide):** The educational narrative, specific learning objectives, and instructions.
*   **Right Pane (The Workbench):** The "Active Artifact." This creates a persistent context for the work.

**Examples of "The Workbench":**
*   **Document Analysis:** The PDF/Term Sheet is always visible on the right while the user reads about specific clauses on the left. Interactive hotspots link the two.
*   **Negotiation:** The Chat Bot lives on the right. As the user talks to the AI, the "Guide" on the left updates to show relevant tips for the current negotiation stage.
*   **Drafting:** A text editor or form where the user constructs their answers.

### Pros
*   **Active Learning:** Users are always *looking at* or *working on* the subject matter, not just reading about it.
*   **Contextual Relevance:** The "Guide" can programmatically scroll or update based on what the user selects in the "Workbench" (e.g., clicking a clause in the PDF highlights the explanation in the text).
*   **Professional Feel:** Mimics the actual tools lawyers and founders use (documents side-by-side).

### Cons
*   **Mobile Complexity:** Requires a sophisticated "tab switching" or "drawer" UI for mobile to toggle between Guide/Workbench.
*   **Higher Build Effort:** Requires managing two synchronized scroll states and complex layout logic.

### Fit with Schema-First
*   **High.** The Schema perfectly defines this relationship. `module.yaml` can define the "Workbench" component for a section (e.g., `workbench: term-sheet-viewer`) and the "Guide" content that pairs with it.

---

## Option C: The Gamified Narrative ("The Journey")
*A structured, linear path inspired by Duolingo.*

### Concept
Instead of a scrolling page, content is broken into "Steps." The user sees one screen at a time. To proceed, they must perform an interaction (answer a quiz, click a hotspot, confirm understanding).

### Pros
*   **Maximum Engagement:** Impossible to "doom scroll." Every beat requires user agency.
*   **Granular Analytics:** We know exactly where users drop off or struggle.
*   **Clear Progress:** "You are on Step 5 of 10" is very motivating.
*   **Role-Playing:** Excellent for the "Choose Your Own Adventure" style of the DealCraft simulator.

### Cons
*   **Fragmented Context:** Hard to refer back to a definition learned 3 screens ago.
*   **Frustration Risk:** Can feel patronizing for advanced learners (Lawyers/MBAs) who just want the information.
*   **Content Cost:** Writing effective micro-interactions for *every* step is highly resource-intensive.

### Fit with Schema-First
*   **High.** The Schema's "Node" structure maps 1:1 with these screens. Branching logic in the schema (`next_node: if_pass_goto_B`) is essential here.

---

## Recommendation: The Hybrid "Dojo"

We should not choose one globally. Instead, we should leverage the **Schema-First Architecture** to select the right mode for the right content.

1.  **Foundational Modules (Reading-heavy):** Use **Option A**. Don't overengineer simple reading assignments.
2.  **Workshop Modules (Negotiation, Drafting):** Use **Option B**. When the user enters "The Deal" section of CS01, the UI transitions to the Split-Screen Workbench. The Term Sheet is pinned on the right, and the lessons flow on the left.
3.  **Simulations (DealCraft):** Use **Option C**. When entering the AI Simulator, the UI focuses entirely on the interactive chat stream/game.

**The Schema supports this:**
```yaml
- id: "foundations"
  type: "page"
  layout: "reader" # Option A

- id: "the-exercise"
  type: "section"
  layout: "workbench" # Option B
  workbench_config:
    component: "pdf-viewer"
    source: "term-sheet.pdf"

- id: "negotiation-sim"
  type: "ai-interaction"
  layout: "immersive" # Option C
```
