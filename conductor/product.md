# Product Definition

## 1. Overview
CS00 is an interactive educational platform designed for the Wisconsin Rural Entrepreneurship Legal Hub. It delivers case studies on complex legal and business topics through a modern, engaging interface. The platform's primary goal is to bridge the gap between theoretical knowledge and practical application for students and professionals in the entrepreneurship ecosystem.

## 2. Target Audience
The platform serves a diverse range of learners:
*   **CS00-Students-Law:** Second or third-year law students with basic business-law backgrounds.
*   **CS00-Students-Business:** MBA students focused on corporate finance, tax, and product development.
*   **CS00-Lawyers:** Practitioners improving or learning new skills in corporate law.
*   **CS00-Entrepreneurs:** Individuals starting businesses or seeking technical industry knowledge.

## 3. Core Features (The MVP Pillars)
The platform is built on three main pillars:
1.  **Content Delivery System:** A robust engine that transforms Markdown content into interactive "cards," supporting instructor notes and structured learning paths.
2.  **Navigation & Scannability:** A user-friendly Material Design interface featuring sticky tables of contents and sidebars to facilitate easy navigation and content consumption.
3.  **Role-Based Access:** A system to distinguish between student and instructor views, ensuring appropriate content visibility and access to confidential teaching materials.

## 4. The Next Evolution: Schema-First & The Hybrid "Dojo"
To move beyond the MVP, the platform is transitioning to a **Schema-First Architecture**. This shift decouples content definition from its file-system placement, unlocking advanced interactive features.

### 4.1 The Module Manifest
Every module is governed by a `module.yaml` file, the single source of truth for its structure, navigation, and role-based visibility. This allows for stable progress tracking and non-linear branching scenarios.

### 4.2 The Hybrid Layout Engine
The platform dynamically switches layouts based on content type:
*   **The Reader (Foundational):** Standard card-based scroll for consumption.
*   **The Workbench (Active):** Split-screen layout for analysis, synchronized between a guide and an artifact (e.g., a PDF viewer).
*   **The Journey (Immersive):** Full-screen, step-by-step flow for simulations (like DealCraft) and branching narratives.

## 5. Visual Identity & Tone
The platform's design aesthetic reflects its dual nature as an innovative tool and an educational resource:
*   **Innovative & Growth-Oriented:** Utilizing warm accent colors and clean lines to convey forward momentum and opportunity.
*   **Academic & Authoritative:** Employing formal serif typography and structured layouts to establish credibility and trust.
