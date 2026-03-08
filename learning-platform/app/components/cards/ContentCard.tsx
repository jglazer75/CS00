'use client';

import { useMemo } from 'react';
import { Box, Divider, Stack, Typography, alpha, useTheme } from '@mui/material';
import MarkdownContent from '../MarkdownContent';
import type { ContentChunk } from '@/lib/content';
import type { AiTaskDefinition } from '@/lib/ai/schema';
import { getAiComponent } from '../ai/registry';

type ContentCardProps = {
  chunk: ContentChunk;
  aiTasks?: AiTaskDefinition[];
  sectionIndex?: number;
};

export default function ContentCard({ chunk, aiTasks = [], sectionIndex }: ContentCardProps) {
  const { id, heading, html, isKeyConcept } = chunk;
  const theme = useTheme();

  const contentParts = useMemo(() => {
    if (!aiTasks.length || !html.includes('AI_TASK_ANCHOR')) {
      return [{ type: 'html' as const, content: html }];
    }

    const regex = /(?:<!--\s*AI_TASK_ANCHOR:\s*([a-zA-Z0-9\-_]+)\s*-->)|(?:AI_TASK_ANCHOR:\s*([a-zA-Z0-9\-_]+))/g;
    const split = html.split(regex);

    const result: Array<{ type: 'html' | 'task'; content?: string; task?: AiTaskDefinition }> = [];

    for (let i = 0; i < split.length; i += 3) {
      const textSegment = split[i];
      const group1 = split[i + 1];
      const group2 = split[i + 2];
      const capturedId = group1 || group2;

      if (textSegment) result.push({ type: 'html', content: textSegment });

      if (capturedId) {
        const task = aiTasks.find((t) => t.placement.anchorId === capturedId);
        if (task) result.push({ type: 'task', task });
      }
    }

    return result;
  }, [html, aiTasks]);

  return (
    <Box
      id={id}
      component="section"
      aria-labelledby={`${id}-heading`}
      sx={{
        mb: 8,
        scrollMarginTop: { xs: 96, sm: 120 },
        position: 'relative',
        ...(isKeyConcept && {
          '&::before': {
            content: '""',
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            zIndex: 0,
          },
        }),
      }}
    >
      <Box
        sx={{
          borderLeft: `1px solid ${isKeyConcept ? theme.palette.secondary.main : theme.palette.divider}`,
          pl: { xs: 3, md: 6 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center" mb={4}>
          {sectionIndex !== undefined && (
            <Typography
              variant="h3"
              component="div"
              sx={{
                color: theme.palette.secondary.main,
                bgcolor: theme.palette.primary.main,
                p: 2,
                minWidth: 60,
                textAlign: 'center',
                flexShrink: 0,
                boxShadow: `4px 4px 0 ${alpha(theme.palette.text.primary, 0.9)}`,
              }}
            >
              {sectionIndex.toString().padStart(2, '0')}
            </Typography>
          )}
          <Box flex={1} id={`${id}-heading`}>
            <Typography variant="h2" component="h2">
              {heading}
            </Typography>
            <Divider sx={{ borderColor: theme.palette.secondary.main, mt: 1, width: '40%', borderBottomWidth: 2 }} />
            {isKeyConcept && (
              <Typography variant="caption" sx={{ color: theme.palette.secondary.main, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', mt: 0.5, display: 'block' }}>
                Key Concept
              </Typography>
            )}
          </Box>
        </Stack>

        <Box sx={{
          color: 'text.primary',
          maxWidth: '70ch',
          '& p': { mb: 3 },
          '& ul, & ol': { mb: 3, pl: 4 },
          '& li': { mb: 1.5 },
          '& strong': { fontWeight: 700, color: theme.palette.primary.main },
          '& hr': { border: 'none', borderTop: `1px dashed ${theme.palette.divider}`, my: 4 },
        }}>
          {contentParts.map((part, index) => {
            if (part.type === 'html' && part.content) {
              return <MarkdownContent key={index} html={part.content} />;
            }
            if (part.type === 'task' && part.task) {
              const Component = getAiComponent(part.task.ui.component);
              if (Component) {
                return (
                  <Box key={index} sx={{ my: 3 }}>
                    <Component task={part.task} />
                  </Box>
                );
              }
              return (
                <Box key={index} sx={{ p: 2, border: '1px dashed', borderColor: 'error.main', color: 'error.main' }}>
                  Component &quot;{part.task.ui.component}&quot; not found.
                </Box>
              );
            }
            return null;
          })}
        </Box>
      </Box>
    </Box>
  );
}
