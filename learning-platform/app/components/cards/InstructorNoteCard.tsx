'use client';

import { Card, CardContent, CardHeader } from '@mui/material';
import MarkdownContent from '../MarkdownContent';

type InstructorNoteCardProps = {
  title?: string;
  html: string;
};

export default function InstructorNoteCard({ title = 'Instructor Notes', html }: InstructorNoteCardProps) {
  return (
    <Card
      component="aside"
      sx={{
        borderLeft: 6,
        borderColor: 'secondary.main',
        backgroundColor: 'rgba(42, 90, 42, 0.08)',
      }}
    >
      <CardHeader
        title={title}
        component="h2"
        titleTypographyProps={{ variant: 'h4', component: 'h2' }}
      />
      <CardContent>
        <MarkdownContent html={html} />
      </CardContent>
    </Card>
  );
}
