'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useInstructorMode } from '../context/InstructorModeContext';

type ContentChunk = {
  title: string;
  contentHtml: string;
};

type ModulePageContentProps = {
  title: string;
  contentChunks: ContentChunk[];
  instructorNoteHtml: string | null;
};

export default function ModulePageContent({
  title,
  contentChunks,
  instructorNoteHtml,
}: ModulePageContentProps) {
  const { isInstructorMode } = useInstructorMode();
  const [showInstructorCard, setShowInstructorCard] = useState(false);

  useEffect(() => {
    if (!isInstructorMode) {
      setShowInstructorCard(false);
    }
  }, [isInstructorMode]);

  const hasInstructorNotes = Boolean(instructorNoteHtml);

  const handleInfoToggle = () => {
    setShowInstructorCard((prev) => !prev);
  };

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
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            gap: 1,
          }}
        >
          <Typography variant="h1" component="h1" gutterBottom sx={{ mb: 0 }}>
            {title}
          </Typography>
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

        {contentChunks.map((chunk, index) => (
          <Card key={index} component="article" sx={{ mb: 3 }}>
            <CardHeader title={chunk.title} component="h2" />
            <CardContent>
              <div
                className="prose lg:prose-xl"
                dangerouslySetInnerHTML={{ __html: chunk.contentHtml }}
              />
            </CardContent>
          </Card>
        ))}

        {isInstructorMode && hasInstructorNotes && showInstructorCard && (
          <Card
            component="aside"
            sx={{
              mb: 3,
              border: 2,
              borderColor: 'secondary.main',
              bgcolor: 'secondary.light',
            }}
          >
            <CardHeader
              title="Instructor Notes"
              component="h3"
              sx={{ color: 'secondary.contrastText' }}
            />
            <CardContent>
              <div
                className="prose lg:prose-xl"
                dangerouslySetInnerHTML={{
                  __html: instructorNoteHtml || '',
                }}
              />
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
