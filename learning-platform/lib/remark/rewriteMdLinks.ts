import type { Plugin } from 'unified';
import type { Root, Link } from 'mdast';

type Options = {
  moduleId: string;
  sourceToSlugMap: Map<string, string>;
};

/**
 * Remark plugin that rewrites internal .md links to routed module page URLs.
 * Links like `./filename.md` become `/modules/{moduleId}/{slug}`.
 */
const remarkRewriteMdLinks: Plugin<[Options], Root> = (options) => {
  const { moduleId, sourceToSlugMap } = options;

  function visitNode(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    const n = node as { type?: string; url?: string; children?: unknown[] };

    if (n.type === 'link' && typeof n.url === 'string' && n.url.endsWith('.md')) {
      const href = n.url;
      // Try exact match first, then basename only
      const basename = href.split('/').pop() ?? href;
      const slug = sourceToSlugMap.get(href) ?? sourceToSlugMap.get(basename);
      if (slug) {
        (n as Link).url = `/modules/${moduleId}/${slug}`;
      }
    }

    if (Array.isArray(n.children)) {
      n.children.forEach((child) => visitNode(child));
    }
  }

  return (tree) => {
    visitNode(tree);
  };
};

export default remarkRewriteMdLinks;
