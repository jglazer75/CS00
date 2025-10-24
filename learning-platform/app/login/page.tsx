'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';
import { useAuth } from '@/app/context/AuthContext';

function LoginFormContents() {
  const supabase = useSupabaseClient();
  const { session, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) {
      router.replace(redirectTo);
    }
  }, [loading, redirectTo, router, session]);

  const formDisabled = useMemo(() => status === 'submitting', [status]);
  const resetDisabled = resetStatus === 'submitting';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!supabase) {
      setErrorMessage('Supabase client is not available.');
      return;
    }

    setStatus('submitting');
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setStatus('idle');
      return;
    }

    setStatus('success');
    router.replace(redirectTo);
  }

  async function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError(null);
    setResetMessage(null);

    if (!supabase) {
      setResetError('Supabase client is not available.');
      return;
    }

    const emailToReset = (resetEmail || email).trim();
    if (!emailToReset) {
      setResetError('Enter an email address to receive a reset link.');
      return;
    }

    setResetStatus('submitting');

    const redirectOrigin =
      typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;
    const redirectTo = redirectOrigin
      ? `${redirectOrigin.replace(/\/$/, '')}/reset-password`
      : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
      redirectTo,
    });

    if (error) {
      setResetError(error.message);
      setResetStatus('idle');
      return;
    }

    setResetStatus('success');
    setResetMessage('Password reset email sent. Check your inbox for further instructions.');
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Sign in
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your credentials to continue. Need an account? Ask an administrator to invite you via Supabase Auth.
          </Typography>
        </Box>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            {errorMessage && (
              <Alert severity="error" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}
            <TextField
              type="email"
              name="email"
              label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={formDisabled}
            />
            <TextField
              type="password"
              name="password"
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={formDisabled}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={formDisabled || !email || !password}
            >
              {status === 'submitting' ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button
              type="button"
              variant="text"
              onClick={() => {
                setResetOpen(true);
                setResetEmail(email);
              }}
            >
              Forgot your password?
            </Button>
            {redirectTo !== '/' && (
              <Typography variant="body2">
                <MuiLink component={NextLink} href="/">
                  Return to dashboard
                </MuiLink>
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
      <Dialog
        open={resetOpen}
        onClose={() => {
          if (resetStatus !== 'submitting') {
            setResetOpen(false);
            setResetStatus('idle');
            setResetError(null);
            setResetMessage(null);
          }
        }}
      >
        <Box component="form" onSubmit={handleResetSubmit} noValidate>
          <DialogTitle>Reset password</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Enter the email address associated with your account. We&apos;ll send a link to choose a new password.
            </DialogContentText>
            {resetError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setResetError(null)}>
                {resetError}
              </Alert>
            )}
            {resetMessage && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setResetMessage(null)}>
                {resetMessage}
              </Alert>
            )}
            <TextField
              autoFocus
              margin="dense"
              label="Email address"
              type="email"
              fullWidth
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              disabled={resetDisabled}
              required
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              type="button"
              onClick={() => {
                if (resetStatus !== 'submitting') {
                  setResetOpen(false);
                  setResetStatus('idle');
                  setResetError(null);
                  setResetMessage(null);
                }
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={resetDisabled}>
              {resetDisabled ? 'Sending…' : 'Send reset link'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginFormContents />
    </Suspense>
  );
}
