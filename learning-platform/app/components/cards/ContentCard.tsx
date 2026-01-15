'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, Chip, Box } from '@mui/material';
import MarkdownContent from '../MarkdownContent';
import type { ContentChunk } from '@/lib/content';
import type { AiTaskDefinition } from '@/lib/ai/schema';
import { getAiComponent } from '../ai/registry';

type ContentCardProps = {
  chunk: ContentChunk;
  aiTasks?: AiTaskDefinition[];
};

export default function ContentCard({ chunk, aiTasks = [] }: ContentCardProps) {
  const { id, heading, html, isKeyConcept } = chunk;

  const contentParts = useMemo(() => {
    if (!aiTasks.length || !html.includes('AI_TASK_ANCHOR')) {
      return [{ type: 'html' as const, content: html }];
    }

    // Regex matches <!-- AI_TASK_ANCHOR: id --> with flexibility for whitespace
    const regex = /<!--\s*AI_TASK_ANCHOR:\s*([a-zA-Z0-9\-_]+)\s*-->/g;
    const split = html.split(regex);
    
    // split results in [html, captured_id, html, captured_id, html]
    const result: Array<{ type: 'html' | 'task'; content?: string; task?: AiTaskDefinition }> = [];

    for (let i = 0; i < split.length; i++) {
      const segment = split[i];
      
      // Even indices are HTML content
      if (i % 2 === 0) {
        if (segment) { // allow empty strings if necessary to preserve spacing, but usually we just want content
           // Check if it's purely whitespace? No, markdown html usually is significant.
           // However, if split resulted in empty string (e.g. anchor at start/end), ignore?
           // If anchor is at start: ["", "id", "text"]. We push ""? 
           // MarkdownContent handles empty strings gracefully.
           result.push({ type: 'html', content: segment });
        }
      } else {
        // Odd indices are captured IDs
        const task = aiTasks.find(t => t.placement.anchorId === segment);
        if (task) {
          result.push({ type: 'task', task });
        } else {
            console.warn(`AI Task anchor found for "${segment}" but no matching task definition.`);
        }
      }
    }

    return result;

  }, [html, aiTasks]);

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
                return <Box key={index} sx={{ p: 2, border: '1px dashed error.main', color: 'error.main' }}>Component &quot;{part.task.ui.component}&quot; not found.</Box>;
            }
            return null;
        })}
      </CardContent>
    </Card>
  );
}