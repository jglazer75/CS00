# CS00 Branding Component Prompt

You are a senior UI/UX designer and React developer. Your task is to design and implement a **component library** for an educational web platform called **CS00**, a case-study learning platform for the **Wisconsin Rural Entrepreneurship Legal Hub**.

---

### Platform Context

CS00 delivers interactive legal and business case studies to four learner personas:
- **Law students** (2L/3L) with grounding in business organizations, contracts, and torts
- **MBA students** focused on corporate finance, tax, media, and product development
- **Practicing lawyers** upskilling in corporate law
- **Entrepreneurs** seeking technical or legal domain knowledge

The platform has three layout modes:
- **The Reader** — card-based scrolling content for foundational knowledge
- **The Workbench** — split-screen for document analysis (PDF viewer + guided questions)
- **The Journey** — full-screen immersive flow for simulations and branching narratives

The tech stack is **Next.js (App Router) + TypeScript + MUI v6**. All components must be valid `.tsx` files compatible with MUI's `sx` prop and theme system. No Tailwind.

The visual identity balances two tensions:
- **Innovative & growth-oriented**: warm accent colors, clean lines, forward momentum
- **Academic & authoritative**: serif typography, structured layouts, credibility and trust

---

### Task

Design **3 distinct visual themes** (branding directions) for the components listed below. For each theme, provide:

1. A short **mood description** (2–3 sentences: palette rationale, font pairing, personality)
2. A **MUI theme object** snippet (`createTheme({...})`) capturing the palette, typography, shape, and key component overrides
3. Full **component implementations** (`.tsx`) for each component, styled within that theme

Think of the three themes as competing design pitches — make them genuinely distinct so a stakeholder can choose a direction:
- **Theme A** — lean professional / law firm / prestige (dark navy, gold, serif headings)
- **Theme B** — modern edtech / startup / approachable (vibrant teal or indigo, rounded corners, friendly sans-serif)
- **Theme C** — your own creative interpretation — surprise me with something unexpected that still fits an academic entrepreneurship audience

---

### Components to Implement

Build each of the following. For themes B and C, vary them meaningfully from Theme A — don't just swap colors.

#### 1. `ModuleCard`
A card shown on the module selection screen. Props:
```ts
{
  title: string;
  description: string;
  tags: string[];          // e.g. ["Corporate Law", "MBA", "Finance"]
  progressPercent: number; // 0–100
  isEnrolled: boolean;
  isPublic: boolean;
  onClick: () => void;
}
```
Requirements: progress indicator, tag chips, enrollment badge, hover state.

#### 2. `ContentCard`
The primary reading unit. Props:
```ts
{
  title: string;
  children: React.ReactNode; // rendered markdown
  sectionIndex: number;
}
```
Requirements: clear section separation, comfortable line length (~70ch), smooth anchor target.

#### 3. `MetadataCard`
Displayed at the top of each lesson. Props:
```ts
{
  learningObjectives: string[];
  coreConcepts: string[];
  keywords: string[];
}
```
Requirements: three visually distinct sections, scannable at a glance, collapsible on mobile.

#### 4. `InstructorNoteCard`
Shown only in instructor mode. Props:
```ts
{
  note: string;
  pageTitle: string;
}
```
Requirements: visually distinct from student content (e.g., different color, icon, or border treatment), clearly labeled "Instructor Only".

#### 5. `TableOfContents`
Sticky sidebar navigation. Props:
```ts
{
  sections: { id: string; title: string }[];
  activeId: string;
}
```
Requirements: highlights active section, smooth scroll on click, collapses to a drawer/FAB on mobile.

#### 6. `ProgressRing` (atom)
A circular progress indicator for module completion. Props:
```ts
{
  percent: number;
  size?: number;
  label?: string;
}
```
Requirements: animated on mount, accessible aria-label.

#### 7. `RoleBadge` (atom)
A chip/badge indicating a user's role in the context of a module. Props:
```ts
{
  role: 'student' | 'instructor' | 'module-owner' | 'admin';
}
```
Requirements: color-coded per role, compact, readable at small size.

#### 8. `ModuleLandingHero`
Full-width hero section shown on a module's landing page. Props:
```ts
{
  moduleTitle: string;
  description: string;
  author?: string;
  learningObjectives: string[];
  isEnrolled: boolean;
  onStart: () => void;
  onEnroll: () => void;
}
```
Requirements: prominent CTA, displays top 3 learning objectives, responsive.

---

### Output Format

For each theme, output in this order:

```
## Theme [A/B/C] — [Theme Name]

### Mood
[2–3 sentence description]

### MUI Theme Snippet
\`\`\`ts
// theme[A/B/C].ts
export const theme = createTheme({ ... });
\`\`\`

### Components

#### ModuleCard.tsx
\`\`\`tsx
...
\`\`\`

[...repeat for each component]
```

Make each component self-contained and importable. Use `useTheme()` where token references are needed. Do not use hardcoded hex values — reference palette tokens only.

---

### Bonus (optional)

If you have capacity, provide a `ThemeShowcase.tsx` page that renders all 8 components side-by-side for each theme, so a developer can toggle between themes at runtime using a `<ToggleButtonGroup>`.

---

**A few notes on tone:** The platform's audience includes seasoned lawyers and finance professionals alongside students. Designs should never feel juvenile or toy-like, even in the more "modern" themes. Credibility is non-negotiable. Warmth and approachability are welcome.
