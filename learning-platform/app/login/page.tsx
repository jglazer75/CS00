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

  // Invite flow state
  const [inviteMode, setInviteMode] = useState(false);
  const [invitePassword, setInvitePassword] = useState('');
  const [invitePasswordConfirm, setInvitePasswordConfirm] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [hashError, setHashError] = useState<string | null>(null);

  // Detect invite token or error in URL hash
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const errorCode = params.get('error_code');
    if (errorCode) {
      const description = params.get('error_description')?.replace(/\+/g, ' ') ?? 'An error occurred with your link.';
      if (errorCode === 'otp_expired') {
        setHashError('Your invite link has expired. Ask an administrator to send you a new one.');
      } else {
        setHashError(description);
      }
      // Clear the hash so the error isn't bookmarked
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      return;
    }
    if (hash.includes('type=invite') || hash.includes('type=recovery')) {
      setInviteMode(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && session && !inviteMode) {
      router.replace(redirectTo);
    }
  }, [loading, redirectTo, router, session, inviteMode]);

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

  async function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError(null);

    if (!supabase) {
      setInviteError('Supabase client is not available.');
      return;
    }

    if (invitePassword !== invitePasswordConfirm) {
      setInviteError('Passwords do not match.');
      return;
    }

    if (invitePassword.length < 8) {
      setInviteError('Password must be at least 8 characters.');
      return;
    }

    setInviteStatus('submitting');
    const { error } = await supabase.auth.updateUser({ password: invitePassword });

    if (error) {
      setInviteError(error.message);
      setInviteStatus('error');
      return;
    }

    setInviteStatus('success');
    router.replace('/');
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

  // Invite / password-set flow
  if (inviteMode) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Set your password
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You were invited to this platform. Choose a password to activate your account.
            </Typography>
          </Box>
          {inviteStatus === 'success' ? (
            <Alert severity="success">
              Password set successfully. Redirecting you to the dashboard…
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleInviteSubmit} noValidate>
              <Stack spacing={3}>
                {inviteError && (
                  <Alert severity="error" onClose={() => setInviteError(null)}>
                    {inviteError}
                  </Alert>
                )}
                <TextField
                  type="password"
                  label="New password"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={inviteStatus === 'submitting'}
                  helperText="At least 8 characters."
                />
                <TextField
                  type="password"
                  label="Confirm password"
                  value={invitePasswordConfirm}
                  onChange={(e) => setInvitePasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={inviteStatus === 'submitting'}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={inviteStatus === 'submitting' || !invitePassword || !invitePasswordConfirm}
                >
                  {inviteStatus === 'submitting' ? 'Setting password…' : 'Set password & continue'}
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    );
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
            {hashError && (
              <Alert severity="warning" onClose={() => setHashError(null)}>
                {hashError}
              </Alert>
            )}
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
