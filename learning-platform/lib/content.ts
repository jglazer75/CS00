import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkKeyConcept from './remark/keyConcept';
import { MarkdownNode, renderMarkdown, renderMarkdownFromNodes } from './markdown';

const contentDirectory = path.join(process.cwd(), 'content');

type KeyValue = Record<string, unknown>;

export type Keyword = {
  term: string;
  definition?: string;
};

export type PageMetadata = {
  title: string;
  description?: string;
  learningObjectives: string[];
  coreConcepts: string[];
  keywords: Keyword[];
  author?: string;
  date?: string;
  pageId?: string;
  team?: string;
};

export type ContentChunk = {
  id: string;
  heading: string;
  order: number;
  html: string;
  isKeyConcept: boolean;
};

export type TableOfContentsItem = {
  id: string;
  title: string;
  order: number;
};

export type InstructorNote = {
  title: string;
  html: string;
};

export type ModulePageSummary = {
  slug: string;
  title: string;
  pageId?: string;
  order: number;
  metadata: PageMetadata;
};

export type ModulePage = {
  slug: string;
  metadata: PageMetadata;
  chunks: ContentChunk[];
  tableOfContents: TableOfContentsItem[];
  instructorNote?: InstructorNote;
};

type RawChunk = {
  id: string;
  heading: string;
  nodes: MarkdownNode[];
  order: number;
  isKeyConcept: boolean;
};

export async function getAllModuleIds() {
  const moduleEntries = fs
    .readdirSync(contentDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  return moduleEntries.map((moduleId) => ({
    params: { moduleId },
  }));
}

export async function getSortedPagesData(moduleId: string): Promise<ModulePageSummary[]> {
  const moduleDirectory = path.join(contentDirectory, moduleId);
  const entries = fs.readdirSync(moduleDirectory, { withFileTypes: true });

  const summaries = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const slug = entry.name.replace(/\.md$/i, '');
      const filePath = path.join(moduleDirectory, entry.name);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      const metadata = buildPageMetadata(data, slugToTitle(slug));

      return {
        slug,
        title: metadata.title,
        pageId: metadata.pageId,
        order: 0,
        metadata,
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug, undefined, { numeric: true, sensitivity: 'base' }));

  return summaries.map((summary, index) => ({
    ...summary,
    order: index,
  }));
}

export async function getPageData(moduleId: string, slug: string): Promise<ModulePage> {
  const moduleDirectory = path.join(contentDirectory, moduleId);
  const fullPath = path.join(moduleDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Markdown file not found for slug "${slug}" in module "${moduleId}"`);
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const metadata = buildPageMetadata(data, slugToTitle(slug));

  const processor = remark().use(remarkKeyConcept);
  const parsedTree = processor.parse(content) as { type: string; children?: MarkdownNode[] };
  const transformedTree = (await processor.run(parsedTree)) as { type: string; children?: MarkdownNode[] };
  const { rawChunks, tableOfContents } = splitIntoChunks(transformedTree.children ?? [], metadata.title);

  const chunks = await Promise.all(
    rawChunks.map(async (chunk) => ({
      id: chunk.id,
      heading: chunk.heading,
      order: chunk.order,
      isKeyConcept: chunk.isKeyConcept,
      html: await renderMarkdownFromNodes(chunk.nodes),
    }))
  );

  const instructorNote = await loadInstructorNote(moduleDirectory, slug);

  return {
    slug,
    metadata,
    chunks,
    tableOfContents,
    instructorNote,
  };
}

async function loadInstructorNote(moduleDirectory: string, slug: string): Promise<InstructorNote | undefined> {
  const instructorPath = path.join(moduleDirectory, 'instructor', `${slug}.md`);
  if (!fs.existsSync(instructorPath)) {
    return undefined;
  }

  const noteContents = fs.readFileSync(instructorPath, 'utf8');
  const { data, content } = matter(noteContents);

  return {
    title: typeof data.title === 'string' ? data.title : 'Instructor Notes',
    html: await renderMarkdown(content),
  };
}

function splitIntoChunks(nodes: MarkdownNode[], defaultTitle: string) {
  const rawChunks: RawChunk[] = [];
  const tableOfContents: TableOfContentsItem[] = [];
  const slugCounts = new Map<string, number>();

  let pendingNodes: MarkdownNode[] = [];
  let pendingHeading: string | null = null;
  let pendingId: string | null = null;
  let pendingKeyConcept = false;
  let order = 0;

  const pushPending = (force = false) => {
    if (pendingNodes.length === 0 && !force) {
      pendingHeading = null;
      pendingId = null;
      pendingKeyConcept = false;
      return;
    }

    const heading = pendingHeading ?? 'Overview';
    const id = pendingId ?? ensureUniqueSlug(slugify(heading), slugCounts);

    rawChunks.push({
      id,
      heading,
      nodes: [...pendingNodes],
      order: order++,
      isKeyConcept: pendingKeyConcept,
    });

    pendingNodes = [];
    pendingHeading = null;
    pendingId = null;
    pendingKeyConcept = false;
  };

  for (const node of nodes) {
    if (isHeading(node)) {
      if (node.depth === 2) {
        pushPending();

        const { text, id } = extractHeadingInfo(node);
        const headingText = text || defaultTitle;
        const uniqueId = ensureUniqueSlug(id ?? slugify(headingText), slugCounts);

        tableOfContents.push({
          id: uniqueId,
          title: headingText,
          order: tableOfContents.length,
        });

        pendingHeading = headingText;
        pendingId = uniqueId;
        pendingKeyConcept = isKeyConceptNode(node);
      }

      continue;
    }

    if (isKeyConceptNode(node)) {
      pendingKeyConcept = true;
    }

    pendingNodes.push(node);
  }

  pushPending(Boolean(pendingHeading));

  return { rawChunks, tableOfContents };
}

function buildPageMetadata(data: KeyValue, fallbackTitle: string): PageMetadata {
  const title = typeof data.title === 'string' ? data.title : fallbackTitle;

  return {
    title,
    description: pickString(data.description),
    learningObjectives: toStringArray(data.learning_objectives),
    coreConcepts:
      toStringArray(data.core_concepts).length > 0
        ? toStringArray(data.core_concepts)
        : toStringArray(data.learning_concepts),
    keywords: normalizeKeywords(data.keywords),
    author: pickString(data.author),
    date: pickString(data.date),
    pageId: pickString(data.pageId),
    team: pickString(data.team),
  };
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    return [value.trim()].filter((item) => item.length > 0);
  }

  return [];
}

function normalizeKeywords(value: unknown): Keyword[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => parseKeywordEntry(item))
      .filter((item): item is Keyword => item !== null);
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([term, definition]) => ({
      term,
      definition: typeof definition === 'string' ? definition : undefined,
    }));
  }

  return [];
}

function parseKeywordEntry(entry: unknown): Keyword | null {
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) {
      return null;
    }

    const [termPart, ...definitionParts] = trimmed.split(':');
    const term = termPart.trim();
    const definition = definitionParts.join(':').trim();

    if (!term) {
      return null;
    }

    return {
      term,
      definition: definition.length > 0 ? definition : undefined,
    };
  }

  if (entry && typeof entry === 'object') {
    const maybeKeyword = entry as { term?: unknown; definition?: unknown };
    if (typeof maybeKeyword.term === 'string') {
      return {
        term: maybeKeyword.term,
        definition:
          typeof maybeKeyword.definition === 'string' && maybeKeyword.definition.length > 0
            ? maybeKeyword.definition
            : undefined,
      };
    }
  }

  return null;
}

function pickString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function slugToTitle(slug: string): string {
  const withoutPrefix = slug.replace(/^\d+[-_]?/, '');
  return withoutPrefix
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function isKeyConceptNode(node: MarkdownNode): boolean {
  return Boolean(node.data && (node.data as { keyConcept?: unknown }).keyConcept);
}

function isHeading(node: MarkdownNode): boolean {
  return node.type === 'heading';
}

function extractHeadingInfo(node: MarkdownNode) {
  const text = getNodeText(node).trim();
  const anchorMatch = text.match(/\s*\{#([a-z0-9\-_]+)\}\s*$/i);

  if (anchorMatch) {
    const cleanText = text.slice(0, anchorMatch.index).trim();
    return {
      text: cleanText,
      id: anchorMatch[1],
    };
  }

  return {
    text,
    id: undefined,
  };
}

function getNodeText(node: MarkdownNode): string {
  if (typeof node.value === 'string') {
    return node.value;
  }

  if (node.children && node.children.length > 0) {
    return node.children.map((child) => getNodeText(child)).join('');
  }

  return '';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .trim();
}

function ensureUniqueSlug(base: string, slugCounts: Map<string, number>) {
  const normalized = base.length > 0 ? base : 'section';
  const current = slugCounts.get(normalized);

  if (current === undefined) {
    slugCounts.set(normalized, 1);
    return normalized;
  }

  const next = current + 1;
  slugCounts.set(normalized, next);
  return `${normalized}-${next}`;
}
