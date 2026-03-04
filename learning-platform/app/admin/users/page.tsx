'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type UserRow = {
  id: string;
  email: string;
  created_at: string;
  ai_enabled: boolean;
  is_instructor: boolean;
};

export default function AdminUsersPage() {
  const supabase = useSupabaseClient();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    // Fetch auth users via service-role (admin API not available client-side;
    // we read from profiles joined to auth.users via the admin API route instead).
    // For now, query profiles only — email comes from auth.users which is server-side only.
    // We'll use the admin route that exposes user list.
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, ai_enabled, is_instructor, created_at');

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    // Fetch emails from admin API (requires auth token)
    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
    const res = await fetch('/api/admin/users', {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    });
    if (!res.ok) {
      setError('Failed to load user emails.');
      setLoading(false);
      return;
    }
    const { users: authUsers } = await res.json() as { users: { id: string; email: string }[] };
    const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));

    setUsers(
      (data ?? []).map((p) => ({
        id: p.user_id,
        email: emailMap.get(p.user_id) ?? p.user_id,
        created_at: p.created_at,
        ai_enabled: p.ai_enabled,
        is_instructor: p.is_instructor,
      }))
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateProfile = async (userId: string, field: 'ai_enabled' | 'is_instructor', value: boolean) => {
    if (!supabase) return;
    setSaving(userId + field);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('user_id', userId);
    if (updateError) {
      setError(updateError.message);
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u))
      );
    }
    setSaving(null);
  };

  const enableAllAi = async () => {
    if (!supabase) return;
    setSaving('bulk');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ai_enabled: true })
      .eq('ai_enabled', false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setUsers((prev) => prev.map((u) => ({ ...u, ai_enabled: true })));
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">Users</Typography>
        <Button variant="outlined" onClick={enableAllAi} disabled={saving === 'bulk'}>
          Enable AI for All
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="center">AI Enabled</TableCell>
              <TableCell align="center">Instructor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{user.email}</TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell align="center">
                  <Switch
                    size="small"
                    checked={user.ai_enabled}
                    disabled={saving === user.id + 'ai_enabled'}
                    onChange={(e) => updateProfile(user.id, 'ai_enabled', e.target.checked)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Switch
                    size="small"
                    checked={user.is_instructor}
                    disabled={saving === user.id + 'is_instructor'}
                    onChange={(e) => updateProfile(user.id, 'is_instructor', e.target.checked)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
