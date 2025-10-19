import { visit } from 'unist-util-visit';

const KRAMDOWN_SYNTAX_REGEX = /\{:\s*\.keyconcept\s*\}/;

export default function remarkKeyConcept() {
  return (tree) => {
    visit(tree, 'heading', (node, index, parent) => {
      // Check the first child of the heading, which is the text node
      const firstChild = node.children[0];
      if (firstChild.type !== 'text' || !KRAMDOWN_SYNTAX_REGEX.test(firstChild.value)) {
        return;
      }

      // Clean the heading text
      firstChild.value = firstChild.value.replace(KRAMDOWN_SYNTAX_REGEX, '').trim();

      // Find the end of the key concept section (the next heading of the same or higher level)
      let endIndex = parent.children.length;
      for (let i = index + 1; i < parent.children.length; i++) {
        const sibling = parent.children[i];
        if (sibling.type === 'heading' && sibling.depth <= node.depth) {
          endIndex = i;
          break;
        }
      }

      // Get all the nodes that belong to this section
      const sectionChildren = parent.children.slice(index, endIndex);

      // Create a new container node that will be transformed into a <div>
      const containerNode = {
        type: 'container', // A generic name
        children: sectionChildren,
        data: {
          hName: 'div', // When converted to HTML, this becomes a <div>
          hProperties: {
            className: 'key-concept', // With this class
          },
        },
      };

      // Replace the original nodes with our new container
      parent.children.splice(index, sectionChildren.length, containerNode);

      // Tell visit to skip over the nodes we just processed
      return [visit.SKIP, index + 1];
    });
  };
}
