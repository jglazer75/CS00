'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  TextField,
  Stack,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import type { AiTaskDefinition } from '@/lib/ai/schema';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import MarkdownContent from '../MarkdownContent';

export type DocumentAnalyzerProps = {
  task: AiTaskDefinition;
};

export default function DocumentAnalyzer({ task }: DocumentAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [name]: file }));
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const bucketName = 'term-sheet-submissions';
    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return filePath;
  };

  const handleRun = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('You must be signed in to run AI tasks.');
      }

      // 1. Upload files first
      const updatedInputs = { ...formData };
      for (const [name, file] of Object.entries(files)) {
        setUploading(true);
        const path = await uploadFile(file);
        updatedInputs[name] = path;
      }
      setUploading(false);

      // 2. Call AI Gateway
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          moduleId: task.moduleId,
          taskId: task.id,
          payload: {
            inputs: updatedInputs,
            toggles: {}, // TODO: Support toggles in UI
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Analysis failed with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Card variant="outlined" sx={{ my: 4, borderLeft: 6, borderLeftColor: 'primary.main' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom color="primary">
          {task.metadata.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {task.metadata.summary}
        </Typography>

        <Stack spacing={3} sx={{ my: 3 }}>
          {task.inputs.map((input) => {
            if (input.kind === 'file') {
              return (
                <Box key={input.id}>
                  <Typography variant="subtitle2" gutterBottom>
                    {input.label} {input.required && '*'}
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    color={files[input.name] ? 'success' : 'primary'}
                  >
                    {files[input.name] ? files[input.name].name : 'Select File'}
                    <input
                      type="file"
                      hidden
                      accept={input.accept.join(',')}
                      onChange={(e) => handleFileChange(input.name, e)}
                    />
                  </Button>
                  {input.description && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {input.description}
                    </Typography>
                  )}
                </Box>
              );
            }

            if (input.kind === 'text' || input.kind === 'textarea') {
              return (
                <TextField
                  key={input.id}
                  label={input.label}
                  placeholder={input.placeholder}
                  multiline={input.kind === 'textarea'}
                  rows={input.kind === 'textarea' ? 4 : 1}
                  required={input.required}
                  value={formData[input.name] || ''}
                  onChange={(e) => handleTextChange(input.name, e.target.value)}
                  fullWidth
                  variant="outlined"
                  helperText={input.description}
                />
              );
            }

            return null;
          })}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleRun}
            disabled={loading || uploading}
            size="large"
            sx={{ minWidth: 150 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              task.ui.props?.submitLabel as string || 'Run Analysis'
            )}
          </Button>
          {uploading && (
            <Typography variant="body2" color="text.secondary">
              Uploading document...
            </Typography>
          )}
        </Box>

        {response && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Analysis Feedback
            </Typography>
            <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
              <MarkdownContent html={response} />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}