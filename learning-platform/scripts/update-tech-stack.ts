import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../../');
const packageJsonPath = path.join(projectRoot, 'learning-platform/package.json');
const schemaSqlPath = path.join(projectRoot, 'learning-platform/supabase/schema.sql');
const techStackPath = path.join(projectRoot, 'conductor/tech-stack.md');

function updateTechStack() {
  console.log('Updating conductor/tech-stack.md...');

  // 1. Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const getVersion = (name: string) => deps[name]?.replace('^', '').replace('~', '') || 'unknown';

  const nextVersion = getVersion('next');
  const muiVersion = getVersion('@mui/material');
  const tailwindVersion = getVersion('tailwindcss');
  const tsVersion = getVersion('typescript');
  const supabaseJsVersion = getVersion('@supabase/supabase-js');
  const zodVersion = getVersion('zod');

  // 2. Read schema.sql for backend context
  const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
  const hasAiCache = schemaSql.includes('ai_request_cache');
  const hasAiProviders = schemaSql.includes('user_ai_providers');
  const hasProgress = schemaSql.includes('user_module_progress');

  // 3. Construct new tech-stack.md content
  // Using concatenation to avoid issues with backticks in nested strings for now
  let content = '# Technology Stack (Auto-generated)\n\n';
  content += '> [!IMPORTANT]\n';
  content += '> This file is automatically updated by `scripts/update-tech-stack.ts`. Do not edit manually.\n';
  content += '> Last Updated: ' + new Date().toISOString() + '\n\n';

  content += '## 1. Frontend & UI\n';
  content += '*   **Next.js ' + nextVersion + ':** React-based framework for high-performance web applications and server-side rendering.\n';
  content += '*   **MUI (Material UI) ' + muiVersion + ':** Comprehensive UI component library for implementing Google\'s Material Design system.\n';
  content += '*   **Tailwind CSS ' + tailwindVersion + ':** Utility-first CSS framework for rapid UI development and consistent styling.\n';
  content += '*   **TypeScript ' + tsVersion + ':** Strongly typed programming language for enhanced productivity and code quality.\n\n';

  content += '## 2. Backend & Services\n';
  content += '*   **Supabase (@supabase/supabase-js ' + supabaseJsVersion + '):** Backend-as-a-Service providing PostgreSQL, Auth, and Real-time.\n';
  const features = [];
  if (hasProgress) features.push('Progress Tracking');
  if (hasAiProviders) features.push('AI Provider Management');
  if (hasAiCache) features.push('AI Request Caching');
  content += '    *   **Features Active:** ' + features.join(', ') + '.\n';
  content += '*   **Vercel:** Cloud platform for static site hosting and serverless functions.\n\n';

  content += '## 3. Architectural Patterns\n\n';
  content += '### 3.1 Schema-First Architecture\n';
  content += 'The platform is transitioning to a schema-first approach where module structure is defined in a centralized `module.yaml` manifest.\n\n';
  content += '### 3.2 The Ingestion Pipeline\n';
  content += 'A dedicated ingestion step (`scripts/ingest.ts`) parses module manifests and synchronizes the defined structure to Supabase.\n\n';
  content += '### 3.3 The AI Gateway\n';
  content += 'A provider-agnostic gateway (`app/api/ai/route.ts`) handles all AI interactions, including provider selection and prompt-hash caching.\n\n';

  content += '## 4. Content Processing\n';
  content += '*   **Remark & Gray-matter:** Toolset for parsing and processing Markdown content and YAML frontmatter.\n';
  content += '*   **Zod ' + zodVersion + ':** TypeScript-first schema validation used for manifest and AI task validation.\n';
  content += '*   **Content Engine:** Custom logic (`lib/content.ts`) for dynamically rendering Markdown files from the repository.\n';

  fs.writeFileSync(techStackPath, content, 'utf8');
  console.log('Successfully updated conductor/tech-stack.md');
}

updateTechStack();
