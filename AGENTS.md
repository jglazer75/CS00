@./.gemini/GEMINI.md
@./.gemini/design.md
@./.gemini/systemdesign.md
@./.gemini/uiux.md
@./.gemini/contentengine.md
@./.gemini/frontmatter.md

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

## Phased Delivery
### Phase 1 — Minimum Viable Product
Goal: Launch a polished single-user module (Venture Capital Term Sheet Negotiation).
1. **Project Setup**: Initialize Next.js with MUI, configure Supabase project services, and link deployment to Vercel.
2. **Pilot Module Import**: Move `CS01/docs` and `CS01/source-documents` into `/content`; keep numbered file ordering and handle `*.ai.md` special cases.
3. **UI/UX Foundation (Phase 1.3)**:
   - ✅ Expanded `lib/content.ts` to return structured metadata (learning objectives, keywords, demographics, `team`) plus anchored content chunks and instructor notes. Added remark plugin for `{:.keyconcept}` markers.
   - ✅ Built reusable cards (`MetadataCard`, `ContentCard`, `InstructorNoteCard`) and markdown renderer styling. Added sticky three-column module layout with `ModuleNav` and new `TableOfContents`.
   - ✅ Updated content markdown files to pull glossary keywords from inline designators into frontmatter.
   - **Next:** Integrate Supabase-authored progress indicators once auth layer is ready; document component APIs (Storybook or MDX) for team onboarding.
4. **Authentication & Progress**: Integrate Supabase Auth and store per-user page completion in `user_module_progress`.
5. **Exercise Workflow & AI Bridge**: Enable file uploads into `user_documents` and route submissions through Vercel serverless functions to the AI provider.

### Phase 2 — Collaboration & Community
Goal: Enable team-based learning experiences.
1. **Team Data Model**: Extend Supabase schema with team and membership tables.
2. **Team Management UI**: Add flows to create, join, and manage teams inside the app.
3. **Realtime Collaboration**: Use Supabase Realtime to sync shared exercises, comments, and progress across teammates.

### Phase 3 — Advanced Features & Personalization
Goal: Deepen learning tools and persona-aware content.
1. **Advanced AI Tools**: Support model and difficulty selection alongside richer AI feedback loops.
2. **Expanded Assessments**: Introduce quizzes and additional assessment types beyond document uploads.
3. **Persona-Based Roles**: Implement RBAC to tailor content visibility and guidance per learner persona.
