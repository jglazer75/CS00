'use client';

import { Card, CardContent, CardHeader, Chip } from '@mui/material';
import MarkdownContent from '../MarkdownContent';
import type { ContentChunk } from '@/lib/content';

type ContentCardProps = {
  chunk: ContentChunk;
};

export default function ContentCard({ chunk }: ContentCardProps) {
  const { id, heading, html, isKeyConcept } = chunk;

  return (
    <Card
      id={id}
      component="section"
      aria-labelledby={`${id}-heading`}
      sx={{
        mb: 3,
        scrollMarginTop: { xs: 96, sm: 120 },
        borderLeft: isKeyConcept ? 6 : 0,
        borderColor: isKeyConcept ? 'warning.main' : 'transparent',
        backgroundColor: isKeyConcept ? 'rgba(253, 184, 19, 0.08)' : 'background.paper',
      }}
    >
      <CardHeader
        id={`${id}-heading`}
        title={heading}
        component="h2"
        titleTypographyProps={{ variant: 'h4', component: 'h2' }}
        action={
          isKeyConcept ? (
            <Chip
              label="Key Concept"
              size="small"
              color="warning"
              sx={{ fontWeight: 600, letterSpacing: 0.4 }}
            />
          ) : null
        }
      />
      <CardContent>
        <MarkdownContent html={html} />
      </CardContent>
    </Card>
  );
}
