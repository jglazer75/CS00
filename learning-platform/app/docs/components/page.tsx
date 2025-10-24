import { Box, Container, Divider, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

const sections = [
  {
    title: 'MetadataCard',
    source: 'app/components/cards/MetadataCard.tsx',
    props: [
      { name: 'metadata', type: 'PageMetadata', description: 'Content metadata including title, description, learning objectives, keywords, author, date, pageId, and team.' },
    ],
    usage: `import MetadataCard from '@/app/components/cards/MetadataCard';

<MetadataCard
  metadata={{
    title: 'Module 1: Foundations',
    description: 'Introductory context for the case study.',
    learningObjectives: ['Understand key stakeholders'],
    coreConcepts: ['Economics vs Control'],
    keywords: [{ term: 'IP', definition: 'Intellectual Property' }],
    author: 'Course Author',
    date: '2025-10-18',
  }}
/>`,
  },
  {
    title: 'ContentCard',
    source: 'app/components/cards/ContentCard.tsx',
    props: [
      { name: 'chunk', type: 'ContentChunk', description: 'Structured content chunk containing id, heading, html, order, and isKeyConcept.' },
    ],
    notes: ['Key concept chunks render with a warning accent, chip, and border.', 'The card uses MarkdownContent to render the supplied HTML.'],
    usage: `import ContentCard from '@/app/components/cards/ContentCard';

<ContentCard
  chunk={{
    id: 'economics-control',
    heading: 'Economics vs Control',
    order: 1,
    isKeyConcept: true,
    html: '<p>Founders must balance valuation and governance.</p>',
  }}
/>`,
  },
  {
    title: 'InstructorNoteCard',
    source: 'app/components/cards/InstructorNoteCard.tsx',
    props: [
      { name: 'title', type: 'string', description: 'Heading displayed at the top of the card.' },
      { name: 'html', type: 'string', description: 'Rendered instructor note markup.' },
    ],
    notes: ['Instructor notes are only visible when instructor mode is enabled via InstructorModeContext.'],
    usage: `import InstructorNoteCard from '@/app/components/cards/InstructorNoteCard';

<InstructorNoteCard
  title="Facilitator Notes"
  html="<p>Prompt the class to identify leverage points.</p>"
/>`,
  },
  {
    title: 'ModuleNav',
    source: 'app/components/ModuleNav.tsx',
    props: [
      { name: 'moduleId', type: 'string', description: 'Identifier for the module (used to build URLs).' },
      { name: 'activeSlug', type: 'string', description: 'Current page slug; applied to highlight the active list item.' },
      { name: 'pages', type: 'ModulePageSummary[]', description: 'Ordered list of pages used for navigation labels.' },
      { name: 'completedSlugs', type: 'string[]', description: 'Slugs the user has completed; shows check icons.', optional: true },
      { name: 'percentComplete', type: 'number', description: 'Completion percentage for the module progress bar.', optional: true },
      { name: 'lastVisitedSlug', type: 'string', description: 'Most recent slug visited; displays a caption marker.', optional: true },
    ],
  },
  {
    title: 'ModulePageContent',
    source: 'app/components/ModulePageContent.tsx',
    props: [
      { name: 'metadata', type: 'PageMetadata', description: 'Page metadata displayed in the header and metadata card.' },
      { name: 'chunks', type: 'ContentChunk[]', description: 'Ordered content chunks for the body of the module page.' },
      { name: 'instructorNote', type: 'InstructorNote', description: 'HTML notes shown when instructor mode is active.', optional: true },
      { name: 'tableOfContents', type: 'TableOfContentsItem[]', description: 'Section anchors shown in the sticky TOC column.' },
      { name: 'progressStatus', type: `'idle' | 'loading' | 'unauthenticated' | 'ready' | 'error'`, description: 'Current progress hook state.' },
      { name: 'progressError', type: 'string', description: 'Error message surfaced by the progress hook.', optional: true },
      { name: 'isCompleted', type: 'boolean', description: 'Indicates whether the current page is marked complete.' },
      { name: 'isProcessingProgress', type: 'boolean', description: 'True while a progress mutation is in flight.' },
      { name: 'onMarkComplete', type: '() => void | Promise<void>', description: 'Handler invoked when the user clicks “Mark as complete.”' },
    ],
    notes: ['The component consumes InstructorModeContext to control visibility of instructor content and exposes a “Mark as complete” action connected to Supabase progress tracking.'],
  },
  {
    title: 'MarkdownContent',
    source: 'app/components/MarkdownContent.tsx',
    props: [
      { name: 'html', type: 'string', description: 'Sanitized HTML produced by the markdown pipeline.' },
    ],
    notes: ['Applies typography, table, blockquote, key concept, and code styling across rendered markdown.', 'Tables are responsive with zebra striping and overflow scrolling for smaller screens.'],
  },
];

const renderPropsTable = (props: { name: string; type: string; description: string; optional?: boolean }[]) => (
  <Table size="small" sx={{ mt: 2 }}>
    <TableHead>
      <TableRow>
        <TableCell sx={{ fontWeight: 600 }}>Prop</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {props.map((prop) => (
        <TableRow key={prop.name}>
          <TableCell>
            {prop.name}
            {prop.optional ? ' (optional)' : ''}
          </TableCell>
          <TableCell>
            <Typography component="code" sx={{ fontSize: '0.9rem' }}>
              {prop.type}
            </Typography>
          </TableCell>
          <TableCell>{prop.description}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default function ComponentDocsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={6}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Component API Reference
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This guide outlines the primary reusable components in the learning platform and the props each one
            expects. Use it as a quick reference when composing new views or extending existing pages.
          </Typography>
        </Box>
        {sections.map((section) => (
          <Box key={section.title}>
            <Typography variant="h4" component="h2" gutterBottom>
              {section.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Source: {section.source}
            </Typography>
            {renderPropsTable(section.props)}
            {section.notes && (
              <Box sx={{ mt: 2 }}>
                {section.notes.map((note, index) => (
                  <Typography key={index} variant="body2" color="text.secondary">
                    • {note}
                  </Typography>
                ))}
              </Box>
            )}
            {section.usage && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Example Usage
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    p: 2,
                    overflowX: 'auto',
                    fontSize: '0.85rem',
                  }}
                >
                  <code>{section.usage}</code>
                </Box>
              </Box>
            )}
            <Divider sx={{ mt: 4 }} />
          </Box>
        ))}
        <Box>
          <Typography variant="body2" color="text.secondary">
            For additional integration notes, see the inline comments within each component and the Supabase integration guide maintained in `supabase.md`.
          </Typography>
        </Box>
      </Stack>
    </Container>
  );
}
