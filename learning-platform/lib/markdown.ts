import { remark } from 'remark';
import html from 'remark-html';
import remarkKeyConcept from './remark/keyConcept';

export type MarkdownNode = {
  type: string;
  depth?: number;
  value?: string;
  children?: MarkdownNode[];
  data?: Record<string, unknown>;
};

type MarkdownRoot = {
  type: 'root';
  children: MarkdownNode[];
};

export async function renderMarkdown(markdown: string): Promise<string> {
  const processor = createProcessor();
  const file = await processor.process(markdown);
  return String(file);
}

export async function renderMarkdownFromNodes(nodes: MarkdownNode[]): Promise<string> {
  if (!nodes || nodes.length === 0) {
    return '';
  }

  const processor = createProcessor();
  const tree: MarkdownRoot = {
    type: 'root',
    children: nodes,
  };

  const transformed = (await processor.run(tree as unknown)) as MarkdownRoot;
  return processor.stringify(transformed as unknown);
}

function createProcessor() {
  return remark().use(remarkKeyConcept).use(html);
}
