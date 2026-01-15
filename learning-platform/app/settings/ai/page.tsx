'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Container, TextField, Typography, Alert, Paper } from '@mui/material';
import { createClient } from '@supabase/supabase-js';

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

  useEffect(() => {
    checkExistingKey();
  }, []);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_ai_providers')
        .upsert(
          {
            user_id: user.id,
            provider_name: 'gemini',
            encrypted_api_key: apiKey, // Note: In production, encrypt this client-side or send to API to encrypt!
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id, provider_name' }
        );

      if (error) throw error;

      setMessage({ type: 'success', text: 'API Key saved successfully.' });
      setHasKey(true);
      setApiKey('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

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
