'use client';
import React, { useEffect, useState } from 'react';
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
import { useSupabaseClient } from '../context/SupabaseClientContext';

const PUBLIC_ADMIN_EMAILS = getAdminEmails('public');

export default function Header() {
  const { isInstructorMode, setIsInstructorMode } = useInstructorMode();
  const { user, loading, signOut } = useAuth();
  const supabase = useSupabaseClient();
  const [instructorModuleId, setInstructorModuleId] = useState(null);

  useEffect(() => {
    if (!user || !supabase) { setInstructorModuleId(null); return; }
    if (isAdminEmail(user.email, 'public')) { setInstructorModuleId(null); return; }

    supabase
      .from('module_instructors')
      .select('module_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setInstructorModuleId(data.module_id);
        } else {
          supabase
            .from('profiles')
            .select('is_instructor')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data: profile }) => {
              setInstructorModuleId(profile?.is_instructor ? '__global__' : null);
            });
        }
      });
  }, [user, supabase]);

  const handleToggle = (event) => {
    setIsInstructorMode(event.target.checked);
  };

  const userInitials = useMemo(() => {
    if (!user?.email) return '';
    const [namePart] = user.email.split('@');
    if (!namePart) return '';
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
    <AppBar position="static" elevation={0} sx={{ borderBottom: '2px solid', borderColor: 'secondary.main' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '0.05em' }}>
          <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            Wisconsin Rural Entrepreneurship Legal Hub
          </Link>
        </Typography>

        {!loading && user?.email && PUBLIC_ADMIN_EMAILS.length > 0 && isAdminEmail(user.email, 'public') && (
          <Button component={Link} href="/docs/components" variant="outlined" color="inherit" size="small">
            Docs
          </Button>
        )}

        {!loading && user?.email && PUBLIC_ADMIN_EMAILS.length > 0 && isAdminEmail(user.email, 'public') && (
          <Button component={Link} href="/admin/modules" variant="outlined" color="inherit" size="small">
            Admin
          </Button>
        )}

        {!loading && user && instructorModuleId && !isAdminEmail(user.email ?? '', 'public') && (
          <Button
            component={Link}
            href={instructorModuleId === '__global__' ? '/instructor' : `/instructor/${instructorModuleId}`}
            variant="outlined"
            color="inherit"
            size="small"
          >
            Instructor
          </Button>
        )}

        {!loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                <Typography variant="caption" sx={{ opacity: 0.75, display: { xs: 'none', sm: 'block' } }}>
                  {user.email}
                </Typography>
                <Button variant="outlined" color="inherit" size="small" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <Button component={Link} href="/login" variant="outlined" color="inherit" size="small">
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
          sx={{ color: 'inherit', ml: 0 }}
        />
      </Toolbar>
    </AppBar>
  );
}
