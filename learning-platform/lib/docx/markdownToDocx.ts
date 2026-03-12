import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  ExternalHyperlink,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from 'docx';
import type { Node, Parent, Literal } from 'unist';

// ─── inline conversion ────────────────────────────────────────────────────────

type InlineOpts = {
  bold?: boolean;
  italics?: boolean;
  strike?: boolean;
  font?: string;
  color?: string;
};

function inlineToRuns(node: Node, opts: InlineOpts = {}): (TextRun | ExternalHyperlink)[] {
  switch (node.type) {
    case 'text':
      return [new TextRun({ text: (node as Literal).value as string, ...opts })];

    case 'strong':
      return children(node).flatMap((c) => inlineToRuns(c, { ...opts, bold: true }));

    case 'emphasis':
      return children(node).flatMap((c) => inlineToRuns(c, { ...opts, italics: true }));

    case 'delete':
      return children(node).flatMap((c) => inlineToRuns(c, { ...opts, strike: true }));

    case 'inlineCode':
      return [new TextRun({ text: (node as Literal).value as string, font: 'Courier New', ...opts })];

    case 'link': {
      const n = node as { url?: string; children?: Node[] };
      const innerRuns = (n.children ?? []).flatMap((c) =>
        inlineToRuns(c, { ...opts, color: '0563C1' })
      );
      if (n.url?.startsWith('http')) {
        return [new ExternalHyperlink({ children: innerRuns as TextRun[], link: n.url })];
      }
      // Internal link — just show text
      return innerRuns;
    }

    default:
      // Fallthrough for any other inline parent (e.g. image alt text)
      if ('children' in node) {
        return children(node).flatMap((c) => inlineToRuns(c, opts));
      }
      return [];
  }
}

// ─── block conversion ─────────────────────────────────────────────────────────

type BlockOpts = {
  indentLeft?: number; // twips; 720 = 0.5 inch
};

function blockToDocx(node: Node, opts: BlockOpts = {}): (Paragraph | Table)[] {
  const indent = opts.indentLeft ? { left: opts.indentLeft } : undefined;

  switch (node.type) {
    case 'heading': {
      const n = node as unknown as { depth: number; children: Node[] };
      const levels = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ];
      return [
        new Paragraph({
          heading: levels[Math.min(n.depth - 1, 5)],
          children: n.children.flatMap((c) => inlineToRuns(c)) as TextRun[],
          indent,
        }),
      ];
    }

    case 'paragraph': {
      const runs = children(node).flatMap((c) => inlineToRuns(c));
      if (runs.length === 0) return [];
      return [new Paragraph({ children: runs as TextRun[], indent, spacing: { after: 120 } })];
    }

    case 'list': {
      const n = node as unknown as { ordered: boolean; start?: number; children: Node[] };
      const result: Paragraph[] = [];
      n.children.forEach((item, idx) => {
        const listItem = item as unknown as { children: Node[] };
        listItem.children.forEach((child) => {
          if (child.type === 'paragraph') {
            const runs = children(child).flatMap((c) => inlineToRuns(c));
            if (n.ordered) {
              const num = (n.start ?? 1) + idx;
              result.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: `${num}.\t`, bold: false }),
                    ...(runs as TextRun[]),
                  ],
                  indent: { left: (opts.indentLeft ?? 0) + 720, hanging: 360 },
                  spacing: { after: 60 },
                })
              );
            } else {
              result.push(
                new Paragraph({
                  children: runs as TextRun[],
                  bullet: { level: opts.indentLeft ? Math.floor(opts.indentLeft / 720) : 0 },
                  spacing: { after: 60 },
                })
              );
            }
          } else if (child.type === 'list') {
            result.push(
              ...(blockToDocx(child, { indentLeft: (opts.indentLeft ?? 0) + 720 }) as Paragraph[])
            );
          }
        });
      });
      return result;
    }

    case 'blockquote':
      return children(node).flatMap((c) =>
        blockToDocx(c, { indentLeft: (opts.indentLeft ?? 0) + 720 })
      );

    case 'code': {
      const n = node as Literal;
      const lines = String(n.value ?? '').split('\n');
      return lines.map(
        (line) =>
          new Paragraph({
            children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 18 })],
            indent: { left: 720 },
            spacing: { before: 0, after: 0 },
            shading: { fill: 'F5F5F5' },
          })
      );
    }

    case 'thematicBreak':
      return [
        new Paragraph({
          children: [],
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: 'CCCCCC' },
          },
          spacing: { before: 200, after: 200 },
        }),
      ];

    case 'table': {
      const n = node as unknown as { children: { type: string; children: { children: Node[] }[] }[] };
      const rows = n.children.map(
        (row, rowIdx) =>
          new TableRow({
            children: row.children.map(
              (cell) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      children: cell.children.flatMap((c) =>
                        inlineToRuns(c as Node, rowIdx === 0 ? { bold: true } : {})
                      ) as TextRun[],
                    }),
                  ],
                })
            ),
          })
      );
      return [
        new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      ];
    }

    case 'html':
      // Skip raw HTML blocks
      return [];

    default:
      if ('children' in node) {
        return children(node).flatMap((c) => blockToDocx(c, opts));
      }
      return [];
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function children(node: Node): Node[] {
  return (node as Parent).children ?? [];
}

// ─── public API ───────────────────────────────────────────────────────────────

export async function markdownToDocxBuffer(
  markdownContent: string,
  title: string
): Promise<Buffer> {
  const processor = remark().use(remarkGfm);
  const tree = processor.parse(markdownContent);

  const docNodes = children(tree).flatMap((n) => blockToDocx(n));

  const doc = new Document({
    title,
    sections: [
      {
        properties: {},
        children: docNodes,
      },
    ],
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: { font: 'Calibri', size: 24 },
        },
      ],
    },
  });

  return Packer.toBuffer(doc);
}
