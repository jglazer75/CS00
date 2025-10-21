import type { Plugin } from 'unified';
import type { Root, Content, Paragraph, Heading } from 'mdast';
import type { Data } from 'unist';

const KEY_CONCEPT_MARKER_REGEX = /^\{\s*:\s*\.keyconcept\s*\}$/i;

const remarkKeyConcept: Plugin<[], Root> = () => {
  return (tree) => {
    const children = tree.children ?? [];

    for (let index = 0; index < children.length; index += 1) {
      const node = children[index];
      if (!isKeyConceptMarker(node)) {
        continue;
      }

      const previous = index > 0 ? children[index - 1] : undefined;
      const next = index + 1 < children.length ? children[index + 1] : undefined;

      if (previous) {
        annotateNode(previous);
      }

      if (next && !isHeading(next)) {
        annotateNode(next);
      }

      children.splice(index, 1);
      index -= 1;
    }
  };
};

export default remarkKeyConcept;

function isKeyConceptMarker(node: Content): node is Paragraph {
  if (node.type !== 'paragraph') {
    return false;
  }

  if (!node.children || node.children.length !== 1) {
    return false;
  }

  const child = node.children[0];
  return child.type === 'text' && KEY_CONCEPT_MARKER_REGEX.test(String(child.value || '').trim());
}

function annotateNode(node: Content) {
  const data = (node.data ??= {}) as Data & Record<string, unknown>;

  data.keyConcept = true;

  let hProperties = data.hProperties as Record<string, unknown> | undefined;
  if (!hProperties || typeof hProperties !== 'object') {
    hProperties = {};
    data.hProperties = hProperties;
  }

  const existing = hProperties.className;
  const classList = Array.isArray(existing)
    ? new Set(existing.map((value) => String(value)))
    : new Set<string>(existing ? [String(existing)] : []);

  classList.add('key-concept');
  hProperties.className = Array.from(classList);
}

function isHeading(node: Content): node is Heading {
  return node.type === 'heading';
}
