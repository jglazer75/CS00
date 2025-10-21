'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Container, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useInstructorMode } from '../context/InstructorModeContext';
import MetadataCard from './cards/MetadataCard';
import ContentCard from './cards/ContentCard';
import InstructorNoteCard from './cards/InstructorNoteCard';
import TableOfContents from './TableOfContents';
import type { ContentChunk, InstructorNote, PageMetadata, TableOfContentsItem } from '@/lib/content';

type ModulePageContentProps = {
  metadata: PageMetadata;
  chunks: ContentChunk[];
  instructorNote?: InstructorNote;
  tableOfContents: TableOfContentsItem[];
};

export default function ModulePageContent({
  metadata,
  chunks,
  instructorNote,
  tableOfContents,
}: ModulePageContentProps) {
  const { isInstructorMode } = useInstructorMode();
  const [showInstructorCard, setShowInstructorCard] = useState(false);

  useEffect(() => {
    if (!isInstructorMode) {
      setShowInstructorCard(false);
    }
  }, [isInstructorMode]);

  const hasInstructorNotes = Boolean(instructorNote?.html);

  const handleInfoToggle = () => {
    setShowInstructorCard((prev) => !prev);
  };

  const publishedAt = useMemo(() => {
    if (!metadata.date) {
      return undefined;
    }

    const parsed = new Date(metadata.date);
    if (Number.isNaN(parsed.getTime())) {
      return metadata.date;
    }

    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [metadata.date]);

  const authorAndDate = [metadata.author, publishedAt].filter(Boolean).join(' • ');

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 4,
        px: 3,
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Box
          sx={{
            display: { xs: 'block', md: 'grid' },
            gridTemplateColumns: { md: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 280px' },
            gap: { md: 4, lg: 6 },
          }}
        >
          <Stack spacing={3}>
            <Box
              sx={{
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box>
                <Typography variant="h1" component="h1" sx={{ mb: 1 }}>
                  {metadata.title}
                </Typography>
                {authorAndDate && (
                  <Typography variant="body2" color="text.secondary">
                    {authorAndDate}
                  </Typography>
                )}
              </Box>
              {isInstructorMode && hasInstructorNotes && (
                <Tooltip title={showInstructorCard ? 'Hide instructor notes' : 'Show instructor notes'}>
                  <IconButton
                    color={showInstructorCard ? 'secondary' : 'default'}
                    onClick={handleInfoToggle}
                    aria-label={showInstructorCard ? 'Hide instructor notes' : 'Show instructor notes'}
                  >
                    <InfoOutlinedIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <MetadataCard metadata={metadata} />

            {chunks.map((chunk) => (
              <ContentCard key={chunk.id} chunk={chunk} />
            ))}

            {isInstructorMode && hasInstructorNotes && showInstructorCard && instructorNote && (
              <InstructorNoteCard title={instructorNote.title} html={instructorNote.html} />
            )}
          </Stack>
          <TableOfContents items={tableOfContents} />
        </Box>
      </Container>
    </Box>
  );
}
