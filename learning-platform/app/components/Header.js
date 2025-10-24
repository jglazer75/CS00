'use client';
import React from 'react';
import { useMemo } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from 'next/link';
import { useInstructorMode } from '../context/InstructorModeContext';
import { useAuth } from '../context/AuthContext';
import { getAdminEmails, isAdminEmail } from '@/lib/auth';

const PUBLIC_ADMIN_EMAILS = getAdminEmails('public');

export default function Header() {
  const { isInstructorMode, setIsInstructorMode } = useInstructorMode();
  const { user, loading, signOut } = useAuth();

  const handleToggle = (event) => {
    setIsInstructorMode(event.target.checked);
  };

  const userInitials = useMemo(() => {
    if (!user?.email) {
      return '';
    }
    const [namePart] = user.email.split('@');
    if (!namePart) {
      return '';
    }
    return namePart
      .split(/[._-]/)
      .filter(Boolean)
      .map((fragment) => fragment.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            Wisconsin Rural Entrepreneurship Legal Hub
          </Link>
        </Typography>
        <Button
          component={Link}
          href="/docs/components"
          variant="outlined"
          color="inherit"
          sx={{ mr: { xs: 0, sm: 1 } }}
        >
          Docs
        </Button>
        {!loading && user?.email && PUBLIC_ADMIN_EMAILS.length > 0 && isAdminEmail(user.email, 'public') && (
          <Button
            component={Link}
            href="/admin/invite"
            variant="outlined"
            color="inherit"
            sx={{ mr: { xs: 0, sm: 1 } }}
          >
            Invite users
          </Button>
        )}
        {!loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography variant="body2">{user.email}</Typography>
                  {userInitials && (
                    <Typography variant="caption" color="text.secondary">
                      {userInitials}
                    </Typography>
                  )}
                </Box>
                <Button variant="outlined" color="inherit" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                component={Link}
                href="/login"
                variant="outlined"
                color="inherit"
              >
                Sign in
              </Button>
            )}
          </Box>
        )}
        <FormControlLabel
          control={
            <Switch
              color="secondary"
              checked={isInstructorMode}
              onChange={handleToggle}
              inputProps={{ 'aria-label': 'Toggle instructor mode' }}
            />
          }
          label="Instructor Mode"
          sx={{ color: 'inherit' }}
        />
      </Toolbar>
    </AppBar>
  );
}
