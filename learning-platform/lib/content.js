import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const contentDirectory = path.join(process.cwd(), 'content');

/**
 * Extracts plain text from a Markdown AST node.
 * @param {object} node - The AST node.
 * @returns {string} The plain text content.
 */
function getNodeText(node) {
  if (node && node.type === 'text') {
    return node.value;
  }
  if (node && node.children && Array.isArray(node.children)) {
    return node.children.map(getNodeText).join('');
  }
  return '';
}


/**
 * @returns {Promise<Array<{params: {moduleId: string}}>>}
 * @description Reads the names of all subdirectories within the content/ folder (e.g., CS01, CS02).
 * @see ../.gemini/contentengine.md
 */
export async function getAllModuleIds() {
  const moduleNames = fs.readdirSync(contentDirectory);
  return moduleNames.map((moduleName) => {
    return {
      params: {
        moduleId: moduleName,
      },
    };
  });
}

/**
 * @param {string} moduleId
 * @returns {Promise<Array<{slug: string, [key: string]: any}>>}
 * @description Get the metadata for all pages within a *specific* module, sorted correctly for navigation.
 * @see ../.gemini/contentengine.md
 */
export async function getSortedPagesData(moduleId) {
  const moduleDirectory = path.join(contentDirectory, moduleId);
  const fileNames = fs.readdirSync(moduleDirectory).filter((fileName) => fileName.endsWith('.md'));

  const allPagesData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(moduleDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    return {
      slug,
      ...matterResult.data,
    };
  });

  return allPagesData.sort((a, b) => {
    if (a.slug < b.slug) {
      return -1;
    } else {
      return 1;
    }
  });
}

/**
 * @param {string} moduleId
 * @param {string} slug
 * @returns {Promise<{slug: string, contentChunks: Array<{title: string, contentHtml: string}>, instructorNoteHtml: string|null}>}
 * @description Get the full, renderable content for a single page, split into chunks.
 * @see ../.gemini/contentengine.md
 */
export async function getPageData(moduleId, slug) {
  const moduleDirectory = path.join(contentDirectory, moduleId);
  const fullPath = path.join(moduleDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  // Card splitting logic
  const ast = remark().parse(matterResult.content);

  const chunks = [];
  let currentChunkNodes = [];
  // Use page title from frontmatter as the title for the first chunk of content (before the first h2)
  let currentChunkTitle = matterResult.data.title || 'Overview';

  for (const node of ast.children) {
    if (node.type === 'heading' && node.depth === 2) {
      // When a new h2 is found, push the previous chunk
      if (currentChunkNodes.length > 0) {
        chunks.push({ title: currentChunkTitle, nodes: currentChunkNodes });
      }
      // Start a new chunk
      currentChunkTitle = getNodeText(node);
      currentChunkNodes = [];
    } else {
      currentChunkNodes.push(node);
    }
  }
  // Push the last chunk
  if (currentChunkNodes.length > 0) {
    chunks.push({ title: currentChunkTitle, nodes: currentChunkNodes });
  }

  const contentChunks = await Promise.all(
    chunks.map(async (chunk) => {
      const contentAst = { type: 'root', children: chunk.nodes };
      const contentHtml = await remark().use(html).stringify(contentAst);
      return {
        title: chunk.title,
        contentHtml: contentHtml,
      };
    })
  );


  // Instructor notes logic
  const instructorNotePath = path.join(moduleDirectory, 'instructor', `${slug}.md`);
  let instructorNoteHtml = null;
  if (fs.existsSync(instructorNotePath)) {
    const instructorNoteContents = fs.readFileSync(instructorNotePath, 'utf8');
    const instructorMatterResult = matter(instructorNoteContents);
    const processedInstructorNote = await remark()
      .use(html)
      .process(instructorMatterResult.content);
    instructorNoteHtml = processedInstructorNote.toString();
  }

  return {
    slug,
    contentChunks,
    instructorNoteHtml,
    ...matterResult.data,
  };
}