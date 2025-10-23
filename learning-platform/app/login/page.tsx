'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
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

  useEffect(() => {
    if (!loading && session) {
      router.replace(redirectTo);
    }
  }, [loading, redirectTo, router, session]);

  const formDisabled = useMemo(() => status === 'submitting', [status]);

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
            <Typography variant="body2" color="text.secondary">
              Forgot your password? Use the Supabase dashboard to send a password reset or contact support.
            </Typography>
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
