import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const contentDirectory = path.join(process.cwd(), 'content');

export function getAllModuleIds() {
    const ModuleNames = fs.readdirSync(contentDirectory);
    return ModuleNames.map((moduleName) => {
        return {
            params: {
                moduleId: moduleName,
            },
        };
    });
}

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
        if (a.date < b.date) {
            return 1;
        } else {
            return -1;
        }
    });
}

export async function getPageData(moduleId, slug) {
    const moduleDirectory = path.join(contentDirectory, moduleId);
      const fullPath = path.join(moduleDirectory, `${slug}.md`);    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);

    const processedContent = await remark()
        .use(html)
        .process(matterResult.content);
    const contentHtml = processedContent.toString();

    return {
        slug,
        contentHtml,
        ...matterResult.data,
    };
}