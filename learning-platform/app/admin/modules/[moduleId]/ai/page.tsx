'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Breadcrumbs,
  Link as MuiLink,
  MenuItem,
} from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';

type ModuleAiSettings = {
  module_id: string;
  provider: string;
  model: string | null;
  encrypted_api_key: string | null;
};

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini' },
  // { value: 'openai', label: 'OpenAI' },
];

export default function ModuleAiSettingsPage() {
  const { moduleId } = useParams() as { moduleId: string };
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [apiKey, setApiKey] = useState('');
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      if (!supabase || !moduleId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('module_ai_settings')
        .select('*')
        .eq('module_id', moduleId)
        .maybeSingle<ModuleAiSettings>();

      if (error) {
        setError(error.message);
      } else if (data) {
        setProvider(data.provider);
        setModel(data.model || 'gemini-2.0-flash');
        setHasExistingKey(!!data.encrypted_api_key);
      }
      setLoading(false);
    }

    fetchSettings();
  }, [supabase, moduleId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setSaving(true);
    setMessage(null);

    try {
      const payload: Partial<ModuleAiSettings> = {
        module_id: moduleId,
        provider,
        model,
      };

      if (apiKey) {
        payload.encrypted_api_key = apiKey;
      }

      const { error } = await supabase
        .from('module_ai_settings')
        .upsert(payload, { onConflict: 'module_id' });

      if (error) throw error;

      setMessage({ type: 'success', text: 'AI Settings saved successfully.' });
      setHasExistingKey(true);
      setApiKey('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred';
      setMessage({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink component={Link} href="/admin/modules" underline="hover" color="inherit">
          Modules
        </MuiLink>
        <Typography color="text.primary">{moduleId}</Typography>
        <Typography color="text.primary">AI Settings</Typography>
      </Breadcrumbs>

      <Typography variant="h4" gutterBottom>
        Module AI Configuration: {moduleId}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper component="form" onSubmit={handleSave} sx={{ p: 4, mt: 3, maxWidth: 600 }}>
        <Stack spacing={3}>
          <Typography variant="h6">Provider Settings</Typography>
          
          <TextField
            select
            label="AI Provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            fullWidth
          >
            {PROVIDERS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Model Name"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            fullWidth
            helperText="e.g. gemini-2.0-flash, gpt-4o"
          />

          <Divider />

          <Typography variant="h6">Credentials</Typography>
          <Typography variant="body2" color="text.secondary">
            This key will be used specifically for tasks within the <strong>{moduleId}</strong> module.
          </Typography>

          {hasExistingKey && (
            <Alert severity="info">
              A key is already configured for this module. Enter a new one to overwrite it.
            </Alert>
          )}

          <TextField
            label="Module API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            fullWidth
            placeholder={hasExistingKey ? "••••••••••••••••" : "Enter API Key"}
          />

          <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{ minWidth: 120 }}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
            <Button
              component={Link}
              href="/admin/modules"
              disabled={saving}
            >
              Cancel
            </Button>
          </Box>

          {message && (
            <Alert severity={message.type}>
              {message.text}
            </Alert>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
