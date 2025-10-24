@./.gemini/GEMINI.md
@./.gemini/design.md
@./.gemini/systemdesign.md
@./.gemini/uiux.md
@./.gemini/contentengine.md
@./.gemini/frontmatter.md
@./.gemini/ai-implementation.md
@./.gemini/CS01-ai/term-sheet-analysis-plan.ai.md
@./.gemini/CS01-ai/term-sheet-dealcraft-implmentation.ai.md
@./.gemini/CS01-ai/term-sheet-dealcraft.ai.md
@./.gemini/CS01-ai/term-sheet-dealcraft-sql.ai.md
@./.gemini/coding-rules/database.md
@./.gemini/coding-rules/react.md
@./.gemini/coding-rules/tailwind.md
@./.gemini/coding-rules/typescript.md

# AGENTS BRIEFING

## App Overview
- Next.js 15 + MUI (Material Design) platform delivering interactive case-study modules for the Wisconsin Rural Entrepreneurship Legal Hub.
- Content-driven architecture: Markdown modules under `content/` with YAML frontmatter parsed by `lib/content.js` into `<h2>`-based card chunks and optional instructor notes.
- UI shell: global Material theme (`app/theme.ts`), `Header`, `ModuleNav`, and card layouts render dashboard and module views while maintaining consistent navigation.
- Platform roadmap pairs Supabase (auth, database, storage, realtime) with Vercel serverless functions to mediate AI interactions and secure deployments on Vercel.
- Visual tone stays professional-yet-grounded using the mandated palette, typography, and Wisconsin-themed imagery.

## Design Mandates
- **User-Centered Learning**: Design for defined personas (law students, MBAs, lawyers, entrepreneurs), enforce WCAG accessibility, and iterate through continuous learner testing.
- **Clarity & Chunking**: Embrace microlearning, minimalism, and scannable layouts; reveal complexity progressively to avoid cognitive overload.
- **Guided Interaction & Engagement**: Deliver instant feedback, consistent CTAs, visible progress tracking, rewards, optional challenges, and narrative framing to keep learners motivated.
- **Process & Methodology**: Use progressive onboarding, rigorous information architecture, mobile-first responsiveness, personalization, social learning features, and purposeful whitespace; ground the system in Atomic Design and UXDL frameworks.
- **Material Design Compliance**: Implement Google Material guidelines through MUI components, card-based layouts, sticky navigation, and consistent component styling.
- **Visual System**: Apply palette `#002D5A` (primary), `#2A5A2A` (secondary), `#FDB813` (accent), `#F7F7F7` (background), `#212121` (text); pair Montserrat/Lato headings with Lora/Merriweather body text (current build leverages Roboto); use Feather or Heroicons; prefer authentic Wisconsin imagery.
- **Content Architecture**: Standardize frontmatter fields (`title`, `learning_objectives`, `core_concepts`, `keywords`, `author`, `date`, `pageId`, future `team`) and ensure the parser returns structured chunks plus instructor notes sourced from `/instructor`.
- **Component Roadmap**: Deliver `MetadataCard`, `TableOfContents`, custom remark handling for `{:.keyconcept}`, instructor-mode context toggle, and other reusable components specified in the UI/UX plan.
- **Collaboration & AI**: Secure AI access through Vercel serverless functions and adopt Supabase realtime features to power collaborative team workflows in later phases.

## AI Interaction Blueprint Catalog
- **Document Analyzer** *(Phase 1 launch)*: Single-shot analysis of uploaded or pre-selected case documents with structured feedback and optional rubric scoring.
- **Negotiation Simulator** *(Phase 2 rollout)*: DealCraft-style multi-turn negotiation with personas, difficulty modes, round planning, summaries, and after-action coaching.
- **Guided Annotation Walkthrough** *(Phase 2 rollout)*: Clause-by-clause walkthrough of case documents, producing narrative cards and optional audio scripts tailored to learner personas.
- **Future Blueprint Backlog**: Pitch Practice (slide + timed voice critique), Form Practice Coach (fillable documents with AI review), Scenario Wargame (strategy simulation around market dynamics), Document Annotation Voiceover.

## Phased Delivery
### Phase 1 — AI-Ready MVP (Single Learner)
Goal: Launch the VC Term Sheet module with an end-to-end AI gateway for individual learners.
1. ✅ **1.1 Project Setup**: Initialize Next.js with MUI, configure Supabase services, and link deployment to Vercel.
2. ✅ **1.2 Pilot Content Migration**: Move `CS01/docs` and `CS01/source-documents` into `/content`; retain numbered ordering and handle `*.ai.md` cases.
3. ✅ **1.3 UI/UX Foundation**:
   - Structured `lib/content.ts` output with metadata, chunk anchors, instructor notes, and `{:.keyconcept}` handling.
   - Delivered reusable cards, markdown styling, sticky three-column layout, `ModuleNav`, `TableOfContents`, and `/docs/components`.
   - Implemented Supabase auth + progress tracking, resumed modules, and polished markdown tables/key concept behavior.
4. ✅ **1.4 Authentication & Progress Persistence**:
   - Shipped invite + password reset UX and consolidated session handling.
   - Stored per-user progress, resume CTAs, and module state sync.
5. 🔄 **1.5 AI Gateway Foundation** (current):
   - ✅ Lock in the AI task schema (prompt structure, difficulty/persona toggles, data capture) and document the contract.
   - ✅ Author blueprint specs for Document Analyzer, Negotiation Simulator, and Guided Annotation that align with the gateway contract.
   - ✅ Add Supabase tables `user_ai_providers` (+RLS) and `ai_request_cache` (with eviction cron guidance).
   - ☐ Scaffold `app/api/ai/route.ts` with provider selection, caching checks, and a stub `GeminiAdapter` wired to Vercel secrets.
   - ☐ Produce `/docs/module-author-guide` once the gateway contract is stable to capture the validated author workflow.
6. ☐ **1.6 AI Authoring Integration**:
   - Extend `lib/content.ts` to surface `aiTasks` metadata and anchor markers from `content/**/ai-tasks/*.json`.
   - Build `app/components/ai/` registry, including `DocumentAnalyzer` scaffold and `/settings/ai-providers` management screen.
   - Connect frontend anchor replacement and form handling to the `/api/ai` gateway with provider selection + caching hooks.
7. ☐ **1.7 Document Analyzer Launch & QA**:
   - Implement the Document Analyzer blueprint end-to-end (prompt pack, response schema, Supabase persistence).
   - Author `content/CS01/ai-tasks/term-sheet-analysis.json` and embed anchors in module markdown.
   - Ship smoke tests, logging/alerting, and walkthrough validation for the analysis flow.

### Phase 2 — AI Blueprint Rollout
Goal: Deliver immersive AI learning experiences built on the prioritized blueprints.
1. ☐ **2.1 Negotiation Simulator (DealCraft) Delivery**: Wire negotiation blueprint to `negotiations` table, round planning, difficulty/persona toggles, and after-action coaching.
2. ☐ **2.2 Guided Annotation Walkthrough**: Build clause selection + annotation pipeline, optional audio script generation, and UI presentation within module cards.
3. ☐ **2.3 Blueprint QA & Toolkit**: Publish authoring templates, add linting for task definitions, and standardize telemetry dashboards across blueprints.

### Phase 3 — Collaborative & Shared AI Workflows
Goal: Enable teams to collaborate while sharing AI resources and progress.
1. ☐ **3.1 Team Data Model Expansion**: Extend Supabase schema with `teams`, membership tables, and `team_ai_settings` tying to `user_ai_providers`.
2. ☐ **3.2 Team & Provider Management UX**: Deliver create/join/manage team flows plus admin controls to choose shared AI providers or fallbacks.
3. ☐ **3.3 Realtime Collaboration Layer**: Use Supabase Realtime for shared progress, comments, and synced AI task states.
4. ☐ **3.4 Shared Exercise Enhancements**: Support team document lockers, co-authored submissions, and visibility rules within AI tasks.

### Phase 4 — Personalization & Advanced Learning Tools
Goal: Deepen adaptive learning, assessments, and content operations.
1. ☐ **4.1 Advanced AI Controls**: Allow model/difficulty selection, provider overrides, and richer AI feedback loops with usage analytics.
2. ☐ **4.2 Expanded Assessments**: Introduce quizzes and additional assessment types beyond document uploads, integrating with AI review flows.
3. ☐ **4.3 Persona-Based Personalization**: Implement RBAC and persona-aware navigation, guidance, and AI task tailoring.
4. ☐ **4.4 Module Ingester Automation**: Automate ingestion of new modules, promoting H1 to `title`, generating descriptions, stripping TOCs, and extracting goals/objectives/keywords.
