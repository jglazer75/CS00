import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import toc from 'remark-toc';

const contentDirectory = path.join(process.cwd(), 'content');

/**
 * @returns {Promise<Array<{params: {moduleId: string}}>>}
 * @description Reads the names of all subdirectories within the content/ folder (e.g., CS01, CS02).
 * @see ../.gemini/contentengine.md
 */
export function getAllModuleIds() {
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
 * @returns {Promise<Array<{id: string, title: string}>>}
 * @description Get the metadata for all pages within a *specific* module, sorted correctly for navigation.
 * @see ../.gemini/contentengine.md
 */
export function getSortedPagesData(moduleId) {
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
 * @returns {Promise<{slug: string, contentHtml: string}>}
 * @description Get the full, renderable content for a single page.
 * @see ../.gemini/contentengine.md
 */
export async function getPageData(moduleId, slug) {
  const moduleDirectory = path.join(contentDirectory, moduleId);
  const fullPath = path.join(moduleDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(toc)
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    contentHtml,
    ...matterResult.data,
  };
}