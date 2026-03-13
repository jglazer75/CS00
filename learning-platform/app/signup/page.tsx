'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';

type InviteInfo = {
  email: string;
  moduleId: string;
};

function SignupFormContents() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams?.get('invite') ?? null;

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(Boolean(inviteToken));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Load invite info if token present
  useEffect(() => {
    if (!inviteToken) return;
    fetch(`/api/auth/signup-invite?token=${encodeURIComponent(inviteToken)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setInviteError(data.error);
        } else {
          setInviteInfo({ email: data.email, moduleId: data.moduleId });
          setEmail(data.email);
        }
      })
      .catch(() => setInviteError('Failed to load invite. Try again or contact your instructor.'))
      .finally(() => setLoadingInvite(false));
  }, [inviteToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setStatus('submitting');

    if (inviteToken && inviteInfo) {
      // Invite flow: server handles createUser + enroll + signIn
      const res = await fetch('/api/auth/signup-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Signup failed.');
        setStatus('idle');
        return;
      }

      // Set session in Supabase client
      if (supabase && data.accessToken && data.refreshToken) {
        await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        });
      }

      setStatus('success');
      router.replace(`/modules/${data.moduleId}`);
      return;
    }

    // Standard signup (no invite)
    if (!supabase) {
      setError('Client not available.');
      setStatus('idle');
      return;
    }
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
      setStatus('idle');
      return;
    }

    setStatus('success');
    router.replace('/');
  }

  if (loadingInvite) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (inviteError) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">{inviteError}</Alert>
      </Container>
    );
  }

  const isInvite = Boolean(inviteToken && inviteInfo);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {isInvite ? 'Create your account' : 'Sign up'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isInvite
              ? `You've been invited to join ${inviteInfo?.moduleId ?? 'a module'}. Choose a password to get started.`
              : 'Create an account to access public modules.'}
          </Typography>
        </Box>

        {status === 'success' && !isInvite ? (
          <Alert severity="success">
            Account created! Check your email to confirm your address before signing in.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={3}>
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              <TextField
                type="email"
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={isInvite || status === 'submitting'}
                InputProps={{ readOnly: isInvite }}
                helperText={isInvite ? 'Email is set by your invitation.' : undefined}
              />
              <TextField
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={status === 'submitting'}
                helperText="At least 8 characters."
              />
              <TextField
                type="password"
                label="Confirm password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                required
                disabled={status === 'submitting'}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={status === 'submitting' || !email || !password || !passwordConfirm}
                endIcon={status === 'submitting' ? <CircularProgress size={18} color="inherit" /> : undefined}
              >
                {status === 'submitting' ? 'Creating account…' : 'Create account'}
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>
    </Container>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupFormContents />
    </Suspense>
  );
}
