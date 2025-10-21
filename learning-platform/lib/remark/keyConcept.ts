import type { MarkdownNode } from '../markdown';

const KEY_CONCEPT_MARKER_REGEX = /^\{\s*:\s*\.keyconcept\s*\}$/i;

export default function remarkKeyConcept() {
  return (tree: { children?: MarkdownNode[] }) => {
    if (!tree.children) {
      return;
    }

    const children = tree.children;

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

      if (next && next.type !== 'heading') {
        annotateNode(next);
      }

      children.splice(index, 1);
      index -= 1;
    }
  };
}

function isKeyConceptMarker(node: MarkdownNode) {
  if (node.type !== 'paragraph' || !node.children || node.children.length !== 1) {
    return false;
  }

  const child = node.children[0];
  return child.type === 'text' && KEY_CONCEPT_MARKER_REGEX.test(String(child.value || '').trim());
}

function annotateNode(node: MarkdownNode) {
  const data = (node.data = node.data || {});
  (data as Record<string, unknown>).keyConcept = true;

  let hProperties = (data as Record<string, unknown>).hProperties;
  if (typeof hProperties !== 'object' || hProperties === null) {
    hProperties = {};
    (data as Record<string, unknown>).hProperties = hProperties;
  }

  const existing = (hProperties as Record<string, unknown>).className;
  const classList = Array.isArray(existing)
    ? new Set(existing.map((value) => String(value)))
    : new Set<string>(existing ? [String(existing)] : []);

  classList.add('key-concept');
  (hProperties as Record<string, unknown>).className = Array.from(classList);
}
