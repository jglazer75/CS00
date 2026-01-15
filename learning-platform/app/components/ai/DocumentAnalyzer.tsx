'use client';

import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import type { AiTaskDefinition } from '@/lib/ai/schema';

export type DocumentAnalyzerProps = {
  task: AiTaskDefinition;
};

export default function DocumentAnalyzer({ task }: DocumentAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  // const [inputs, setInputs] = useState<Record<string, unknown>>({});

  const handleRun = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In a real app, ensure Auth header is passed if using a custom client, 
          // but Next.js middleware or cookies typically handle it. 
          // Here we assume the browser cookie is sufficient or we need to pass the access token.
          // For MVP with Supabase Auth Helpers, cookies are automatic.
        },
        body: JSON.stringify({
          moduleId: task.moduleId,
          taskId: task.id,
          payload: {
            inputs: {}, // TODO: Bind actual inputs
            toggles: {}, // TODO: Bind actual toggles
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Analysis failed');
      }

      const data = await res.json();
      setResponse(typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setResponse(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ my: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {task.metadata.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {task.metadata.summary}
        </Typography>

        <Box sx={{ my: 2 }}>
            <Typography variant="caption" display="block" sx={{ mb: 1, fontStyle: 'italic' }}>
                (Placeholder for Input Fields: {task.inputs.map(i => i.label).join(', ')})
            </Typography>
            <Button variant="contained" onClick={handleRun} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (task.ui.props?.submitLabel as string || 'Analyze')}
            </Button>
        </Box>

        {response && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2">Analysis Result:</Typography>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{response}</pre>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
