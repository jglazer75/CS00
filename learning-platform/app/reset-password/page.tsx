'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Box, Button, Container, Stack, TextField, Typography } from '@mui/material';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';
import { useAuth } from '@/app/context/AuthContext';

export default function ResetPasswordPage() {
  const supabase = useSupabaseClient();
  const { refreshSession } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'verifying' | 'ready' | 'submitting' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      if (!supabase) {
        setStatus('error');
        setErrorMessage('Supabase client is not available.');
        return;
      }

      const accessToken = searchParams?.get('access_token');
      const refreshToken = searchParams?.get('refresh_token');
      const type = searchParams?.get('type');

      if (accessToken && refreshToken && type === 'recovery') {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          setStatus('error');
          setErrorMessage('This reset link is invalid or has expired.');
          return;
        }
        await refreshSession();
        setStatus('ready');
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setStatus('ready');
        return;
      }

      setStatus('error');
      setErrorMessage('This reset link is invalid or has expired. Request a new password reset email.');
    }

    initialize();
  }, [refreshSession, searchParams, supabase]);

  const canSubmit = useMemo(() => {
    return status === 'ready' && password.length >= 8 && password === confirmPassword;
  }, [confirmPassword, password, status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!supabase) {
      setErrorMessage('Supabase client is not available.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setStatus('submitting');

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus('ready');
      setErrorMessage(error.message);
      return;
    }

    setStatus('success');
    setSuccessMessage('Password updated. You can now sign in with the new password.');

    setTimeout(() => {
      router.replace('/login');
    }, 2000);
  }

  const heading = status === 'success' ? 'Password updated' : 'Set a new password';
  const isSubmitting = status === 'submitting';

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={4} component="form" onSubmit={handleSubmit}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {heading}
          </Typography>
          {status === 'verifying' && (
            <Typography variant="body1" color="text.secondary">
              Verifying your reset link...
            </Typography>
          )}
          {status === 'ready' && (
            <Typography variant="body1" color="text.secondary">
              Choose a new password for your account.
            </Typography>
          )}
          {status === 'success' && successMessage && (
            <Alert severity="success">{successMessage}</Alert>
          )}
          {status === 'error' && errorMessage && (
            <Alert severity="error">{errorMessage}</Alert>
          )}
        </Box>

        {(status === 'ready' || status === 'submitting') && (
          <>
            {errorMessage && (
              <Alert severity="error" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            )}
            <TextField
              label="New password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isSubmitting}
            />
            <TextField
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={isSubmitting}
            />
            <Button type="submit" variant="contained" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Update password'}
            </Button>
          </>
        )}

        {status === 'success' && (
          <Typography variant="body2" color="text.secondary">
            Redirecting you to the sign-in page…
          </Typography>
        )}

        {status !== 'success' && (
          <Box>
            <Button
              type="button"
              variant="text"
              onClick={() => router.replace('/login')}
              disabled={isSubmitting}
            >
              Return to sign-in
            </Button>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
