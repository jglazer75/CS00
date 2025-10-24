'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';
import { useAuth } from '@/app/context/AuthContext';
import { getAdminEmails, isAdminEmail } from '@/lib/auth';

const PUBLIC_ADMIN_EMAILS = getAdminEmails('public');

type InviteStatus = 'idle' | 'submitting' | 'success' | 'error';

type InviteResponse = {
  success?: boolean;
  error?: string;
};

export default function InvitePage() {
  const supabase = useSupabaseClient();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<InviteStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const isAdmin = user?.email ? isAdminEmail(user.email, 'public') : false;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!supabase) {
      setStatus('error');
      setMessage('Supabase client is not available.');
      return;
    }

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setStatus('error');
      setMessage('Enter an email address before sending an invite.');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setStatus('error');
      setMessage('Unable to read your Supabase session. Please sign in again.');
      return;
    }

    setStatus('submitting');

    let response: Response;
    try {
      response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });
    } catch {
      setStatus('error');
      setMessage('Network error while sending invite.');
      return;
    }

    const payload = (await response.json()) as InviteResponse;
    if (!response.ok || !payload.success) {
      setStatus('error');
      setMessage(payload.error ?? 'Failed to send invite.');
      return;
    }

    setStatus('success');
    setMessage(`Invitation sent to ${normalizedEmail}.`);
    setEmail('');
  }

  if (loading) {
    return null;
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="warning">
          You do not have permission to view this page.
        </Alert>
      </Container>
    );
  }

  if (PUBLIC_ADMIN_EMAILS.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">
          ADMIN_EMAILS configuration is missing. Set `ADMIN_EMAILS` and `NEXT_PUBLIC_ADMIN_EMAILS` in your environment
          to enable invitations.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={4} component="form" onSubmit={handleSubmit}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Invite a Teammate
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Send a Supabase invitation email. Invited users will receive a link to set their password and sign in.
          </Typography>
        </Box>

        {message && (
          <Alert
            severity={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}
            onClose={() => {
              setMessage(null);
              setStatus('idle');
            }}
          >
            {message}
          </Alert>
        )}

        <TextField
          label="Email address"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoFocus
        />

        <Button type="submit" variant="contained" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending...' : 'Send invite'}
        </Button>
      </Stack>
    </Container>
  );
}
