'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type UserRow = {
  id: string;
  email: string;
  created_at: string;
  ai_enabled: boolean;
  is_instructor: boolean;
};

type ModuleRecord = {
  id: string;
  title: string;
};

type UserRoles = {
  instructorModules: string[];
  enrolledModules: string[];
};

type ManageState = {
  user: UserRow;
  roles: UserRoles;
  selectedModuleId: string;
  busy: string | null;
  message: string | null;
};

export default function AdminUsersPage() {
  const supabase = useSupabaseClient();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  // Bulk invite state
  const [bulkEmails, setBulkEmails] = useState('');
  const [bulkInviting, setBulkInviting] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ sent: string[]; failed: string[] } | null>(null);

  // Manage dialog state
  const [manageState, setManageState] = useState<ManageState | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, ai_enabled, is_instructor, created_at');

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

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

  const fetchModules = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('modules').select('id, title').order('id');
    setModules(data ?? []);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
    fetchModules();
  }, [fetchUsers, fetchModules]);

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

  const handleBulkInvite = async () => {
    setBulkInviting(true);
    setBulkResult(null);
    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
    if (!session) { setBulkInviting(false); return; }

    const emails = bulkEmails
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    const sent: string[] = [];
    const failed: string[] = [];

    for (const email of emails) {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email }),
      });
      if (res.ok) sent.push(email);
      else failed.push(email);
    }

    setBulkResult({ sent, failed });
    if (sent.length > 0) setBulkEmails('');
    setBulkInviting(false);
    if (sent.length > 0) fetchUsers();
  };

  const openManage = async (user: UserRow) => {
    if (!supabase) return;

    const [{ data: instructorRows }, { data: enrollmentRows }] = await Promise.all([
      supabase.from('module_instructors').select('module_id').eq('user_id', user.id),
      supabase.from('module_enrollments').select('module_id').eq('user_id', user.id),
    ]);

    const roles: UserRoles = {
      instructorModules: (instructorRows ?? []).map((r) => r.module_id),
      enrolledModules: (enrollmentRows ?? []).map((r) => r.module_id),
    };

    setManageState({
      user,
      roles,
      selectedModuleId: modules[0]?.id ?? '',
      busy: null,
      message: null,
    });
  };

  const closeManage = () => setManageState(null);

  const manageAction = async (
    action: 'assign-instructor' | 'remove-instructor' | 'enroll' | 'unenroll' | 'reset-progress'
  ) => {
    if (!manageState) return;
    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
    if (!session) return;

    const { user, selectedModuleId } = manageState;
    setManageState((s) => s ? { ...s, busy: action, message: null } : s);

    let res: Response;

    if (action === 'reset-progress') {
      const confirmReset = window.confirm(
        `Reset all progress for ${user.email} in module ${selectedModuleId}? This cannot be undone.`
      );
      if (!confirmReset) {
        setManageState((s) => s ? { ...s, busy: null } : s);
        return;
      }
      res = await fetch('/api/admin/progress/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ userId: user.id, moduleId: selectedModuleId }),
      });
    } else if (action === 'assign-instructor') {
      res = await fetch('/api/admin/module-instructors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ moduleId: selectedModuleId, userId: user.id }),
      });
    } else if (action === 'remove-instructor') {
      res = await fetch('/api/admin/module-instructors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ moduleId: selectedModuleId, userId: user.id }),
      });
    } else if (action === 'enroll') {
      res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ moduleId: selectedModuleId, userId: user.id }),
      });
    } else {
      // unenroll
      res = await fetch('/api/admin/enrollments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ moduleId: selectedModuleId, userId: user.id }),
      });
    }

    const json = await res.json();
    if (!res.ok) {
      setManageState((s) => s ? { ...s, busy: null, message: `Error: ${json.error}` } : s);
      return;
    }

    // Refresh roles after successful action
    if (!supabase) return;
    const [{ data: instructorRows }, { data: enrollmentRows }] = await Promise.all([
      supabase.from('module_instructors').select('module_id').eq('user_id', user.id),
      supabase.from('module_enrollments').select('module_id').eq('user_id', user.id),
    ]);

    const updatedRoles: UserRoles = {
      instructorModules: (instructorRows ?? []).map((r) => r.module_id),
      enrolledModules: (enrollmentRows ?? []).map((r) => r.module_id),
    };

    setManageState((s) => s ? {
      ...s,
      roles: updatedRoles,
      busy: null,
      message: 'Done.',
    } : s);
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

      {/* Bulk invite */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Bulk Invite</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Paste email addresses (one per line or comma-separated). Each will receive an invitation email.
        </Typography>
        <TextField
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          placeholder="alice@example.com&#10;bob@example.com"
          value={bulkEmails}
          onChange={(e) => setBulkEmails(e.target.value)}
          size="small"
          sx={{ mb: 1.5, fontFamily: 'monospace' }}
        />
        <Button
          variant="contained"
          onClick={handleBulkInvite}
          disabled={bulkInviting || !bulkEmails.trim()}
          startIcon={bulkInviting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {bulkInviting ? 'Sending…' : 'Send Invites'}
        </Button>
        {bulkResult && (
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {bulkResult.sent.length > 0 && (
              <Alert severity="success" sx={{ fontSize: '0.8rem' }}>
                Invited: {bulkResult.sent.join(', ')}
              </Alert>
            )}
            {bulkResult.failed.length > 0 && (
              <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
                Failed: {bulkResult.failed.join(', ')}
              </Alert>
            )}
          </Box>
        )}
      </Paper>

      <Divider sx={{ mb: 3 }} />

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="center">AI Enabled</TableCell>
              <TableCell align="center">Global Instructor</TableCell>
              <TableCell align="center">Manage</TableCell>
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
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ManageAccountsIcon />}
                    onClick={() => openManage(user)}
                  >
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Manage Dialog */}
      {manageState && (
        <Dialog open onClose={closeManage} maxWidth="sm" fullWidth>
          <DialogTitle>
            Manage: <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
              {manageState.user.email}
            </Typography>
          </DialogTitle>
          <DialogContent dividers>
            {manageState.message && (
              <Alert severity="info" sx={{ mb: 2 }}>{manageState.message}</Alert>
            )}

            {/* Current roles summary */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Current Module Roles</Typography>
            <Box sx={{ mb: 2 }}>
              {manageState.roles.instructorModules.length === 0 && manageState.roles.enrolledModules.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No module assignments.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {manageState.roles.instructorModules.map((m) => (
                    <Chip key={`i-${m}`} label={`${m} (Instructor)`} size="small" color="primary" />
                  ))}
                  {manageState.roles.enrolledModules.map((m) => (
                    <Chip key={`e-${m}`} label={`${m} (Enrolled)`} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Module selector */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Module</InputLabel>
              <Select
                value={manageState.selectedModuleId}
                label="Module"
                onChange={(e) => setManageState((s) => s ? { ...s, selectedModuleId: e.target.value, message: null } : s)}
              >
                {modules.map((m) => (
                  <MenuItem key={m.id} value={m.id}>{m.id} — {m.title}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Action buttons */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Button
                variant="contained"
                size="small"
                disabled={!!manageState.busy}
                onClick={() => manageAction('assign-instructor')}
              >
                {manageState.busy === 'assign-instructor' ? <CircularProgress size={16} /> : 'Assign as Instructor'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="warning"
                disabled={!!manageState.busy}
                onClick={() => manageAction('remove-instructor')}
              >
                {manageState.busy === 'remove-instructor' ? <CircularProgress size={16} /> : 'Remove Instructor'}
              </Button>
              <Button
                variant="contained"
                size="small"
                color="success"
                disabled={!!manageState.busy}
                onClick={() => manageAction('enroll')}
              >
                {manageState.busy === 'enroll' ? <CircularProgress size={16} /> : 'Enroll'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="warning"
                disabled={!!manageState.busy}
                onClick={() => manageAction('unenroll')}
              >
                {manageState.busy === 'unenroll' ? <CircularProgress size={16} /> : 'Unenroll'}
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                disabled={!!manageState.busy}
                onClick={() => manageAction('reset-progress')}
                sx={{ gridColumn: '1 / -1' }}
              >
                {manageState.busy === 'reset-progress' ? <CircularProgress size={16} /> : 'Reset Progress'}
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeManage}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
