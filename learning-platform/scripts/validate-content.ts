import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

function validateContent() {
  const moduleDirs = fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'));

  let hasErrors = false;

  for (const moduleDir of moduleDirs) {
    const moduleId = moduleDir.name;
    const modulePath = path.join(CONTENT_DIR, moduleId);
    const files = fs
      .readdirSync(modulePath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(modulePath, file.name);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);

      const errors: string[] = [];

      // 1. Metadata Checks
      if (!data.title) errors.push('Missing "title" in frontmatter');
      if (!Array.isArray(data.learning_objectives)) errors.push('Missing or invalid "learning_objectives" array');
      if (!Array.isArray(data.core_concepts)) errors.push('Missing or invalid "core_concepts" array');

      // 2. Exercise Density Check
      // Matches <!-- AI_TASK_ANCHOR: id --> OR AI_TASK_ANCHOR: id
      const anchorRegex = /(?:<!--\s*AI_TASK_ANCHOR:\s*([a-zA-Z0-9\-_]+)\s*-->)|(?:AI_TASK_ANCHOR:\s*([a-zA-Z0-9\-_]+))/g;
      const matches = [...content.matchAll(anchorRegex)];
      
      if (matches.length > 1) {
        errors.push(`Violates "One Exercise Per Page" rule. Found ${matches.length} AI Task anchors.`);
      }

      if (errors.length > 0) {
        hasErrors = true;
        console.error(`\n❌ Validation Failed: ${moduleId}/${file.name}`);
        errors.forEach(err => console.error(`   - ${err}`));
      }
    }
  }

  if (hasErrors) {
    console.error('\nContent validation failed.');
    process.exit(1);
  } else {
    console.log('\n✅ Content validation passed.');
  }
}

validateContent();
