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

    // Regex matches <!-- AI_TASK_ANCHOR: id --> OR AI_TASK_ANCHOR: id (plain text)
    // Markdown might wrap plain text in <p>, so we just look for the string sequence.
    // Updated regex to handle both:
    // 1. <!-- AI_TASK_ANCHOR: id -->
    // 2. AI_TASK_ANCHOR: id
    // We capture 'id' in group 1 or 2.
    const regex = /(?:<!--\s*AI_TASK_ANCHOR:\s*([a-zA-Z0-9\-_]+)\s*-->)|(?:AI_TASK_ANCHOR:\s*([a-zA-Z0-9\-_]+))/g;
    const split = html.split(regex);
    
    // split results can be complex with multiple capturing groups.
    // If we have 2 groups, split output will be: [text, group1, group2, text, group1, group2...]
    // If group1 matches, group2 is undefined.
    
    const result: Array<{ type: 'html' | 'task'; content?: string; task?: AiTaskDefinition }> = [];

    for (let i = 0; i < split.length; i += 3) {
      const textSegment = split[i];
      const group1 = split[i + 1]; // comment capture
      const group2 = split[i + 2]; // text capture
      const capturedId = group1 || group2;

      if (textSegment) {
        result.push({ type: 'html', content: textSegment });
      }

      if (capturedId) {
        const task = aiTasks.find(t => t.placement.anchorId === capturedId);
        if (task) {
          result.push({ type: 'task', task });
        } else {
             // Debugging or warning
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
        {(aiTasks.length > 0 || html.includes('AI_TASK_ANCHOR')) && (
            <Box sx={{ mb: 2, p: 1, bgcolor: '#f0f0f0', fontSize: '10px', fontFamily: 'monospace' }}>
                DEBUG: Tasks: {aiTasks.length} | HTML includes anchor: {html.includes('AI_TASK_ANCHOR').toString()}
                {aiTasks.length > 0 && <span> | First Task Anchor: {aiTasks[0].placement.anchorId}</span>}
                <br/>
                First 100 chars of HTML: {html.substring(0, 100).replace(/</g, '&lt;')}
            </Box>
        )}
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