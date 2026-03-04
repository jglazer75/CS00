'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Container, TextField, Typography, Alert, Paper } from '@mui/material';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/auth';

// Note: In a real app, use the context or hook that provides the Supabase client
// Here we instantiate for the client-side interaction using env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AiSettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAuthorized(false); return; }

    // Admins always have access
    if (user.email && isAdminEmail(user.email)) { setAuthorized(true); checkExistingKey(); return; }

    // Check is_instructor from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_instructor')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.is_instructor) { setAuthorized(true); checkExistingKey(); }
    else { setAuthorized(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { checkAccess(); }, []);

  const checkExistingKey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_ai_providers')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider_name', 'gemini')
      .maybeSingle();

    if (data) {
      setHasKey(true);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch('/api/user/ai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ providerName: 'gemini', apiKey }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to save key');
      }

      setMessage({ type: 'success', text: 'API Key saved successfully.' });
      setHasKey(true);
      setApiKey('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  if (authorized === null) return null;

  if (!authorized) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="info">AI provider settings are not available for your account.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Settings
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Google Gemini Provider
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure your personal Google Gemini API Key. This will be used for AI tasks if the system default is not available or if you are in a team that enforces BYOK.
        </Typography>

        {hasKey && (
          <Alert severity="success" sx={{ mb: 2 }}>
            You have a Gemini API key configured.
          </Alert>
        )}

        <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Gemini API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            fullWidth
            helperText="Your key is stored securely."
          />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || !apiKey}
            sx={{ alignSelf: 'flex-start' }}
          >
            {loading ? 'Saving...' : 'Save Key'}
          </Button>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}
      </Paper>
    </Container>
  );
}
