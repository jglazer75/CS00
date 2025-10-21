import { remark } from 'remark';
import html from 'remark-html';
import remarkKeyConcept from './remark/keyConcept';
import type { Root, Content } from 'mdast';

export type MarkdownNode = Content;

type MarkdownRoot = Root;

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

  const transformed = (await processor.run(tree)) as MarkdownRoot;
  return processor.stringify(transformed);
}

function createProcessor() {
  return remark().use(remarkKeyConcept).use(html);
}
