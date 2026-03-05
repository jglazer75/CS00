'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import { useParams } from 'next/navigation';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';
import { useAuth } from '@/app/context/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/auth';

type ModuleData = {
  id: string;
  title: string;
  description: string | null;
  owner_user_id: string | null;
  metadata: Record<string, unknown>;
};

type Instructor = {
  user_id: string;
  email: string;
  assigned_at: string;
};

export default function ModuleOwnerPage() {
  const params = useParams();
  const moduleId = params?.moduleId as string;
  const supabase = useSupabaseClient();
  const { user } = useAuth();

  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [taskRunCount, setTaskRunCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notAuthorized, setNotAuthorized] = useState(false);

  // Edit form state
  const [editTerms, setEditTerms] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase || !user || !moduleId) return;
    setLoading(true);
    setError(null);

    const { data: mod, error: modError } = await supabase
      .from('modules')
      .select('id, title, description, owner_user_id, metadata')
      .eq('id', moduleId)
      .maybeSingle();

    if (modError || !mod) {
      setError(modError?.message ?? 'Module not found.');
      setLoading(false);
      return;
    }

    const isAdmin = user.email ? isAdminEmail(user.email, 'public') : false;
    if (!isAdmin && mod.owner_user_id !== user.id) {
      setNotAuthorized(true);
      setLoading(false);
      return;
    }

    setModuleData({
      ...mod,
      metadata: (mod.metadata as Record<string, unknown>) ?? {},
    });
    setEditTerms((mod.metadata as Record<string, unknown>)?.terms_of_use as string ?? '');
    setEditDescription(mod.description ?? '');

    // Fetch aggregate stats (no PII)
    const [{ count: enrolled }, { count: taskRuns }] = await Promise.all([
      supabase.from('module_enrollments').select('*', { count: 'exact', head: true }).eq('module_id', moduleId),
      supabase.from('ai_task_runs').select('*', { count: 'exact', head: true }).eq('module_id', moduleId),
    ]);

    setEnrolledCount(enrolled ?? 0);
    setTaskRunCount(taskRuns ?? 0);

    // Fetch instructors (no student PII)
    const { data: instrRows } = await supabase
      .from('module_instructors')
      .select('user_id, assigned_at')
      .eq('module_id', moduleId);

    // Resolve emails via admin route (only if admin)
    let resolvedInstructors: Instructor[] = [];
    if (instrRows && instrRows.length > 0) {
      if (isAdmin) {
        const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
        const res = await fetch('/api/admin/users', {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        if (res.ok) {
          const { users: authUsers } = await res.json() as { users: { id: string; email: string }[] };
          const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));
          resolvedInstructors = instrRows.map((r) => ({
            user_id: r.user_id,
            email: emailMap.get(r.user_id) ?? r.user_id,
            assigned_at: r.assigned_at,
          }));
        }
      } else {
        // Module owner sees user IDs only (no PII)
        resolvedInstructors = instrRows.map((r) => ({
          user_id: r.user_id,
          email: r.user_id,
          assigned_at: r.assigned_at,
        }));
      }
    }

    setInstructors(resolvedInstructors);
    setLoading(false);
  }, [supabase, user, moduleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);

    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
    if (!session) { setSaving(false); return; }

    const res = await fetch(`/api/module-owner/${moduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        metadata: {
          ...(moduleData?.metadata ?? {}),
          terms_of_use: editTerms,
        },
        description: editDescription,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setSaveMessage(`Error: ${json.error}`);
    } else {
      setSaveMessage('Saved.');
      setModuleData((prev) => prev ? { ...prev, metadata: json.metadata, description: editDescription } : prev);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notAuthorized) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', py: 8 }}>
        <Alert severity="error">You are not the owner of this module.</Alert>
      </Box>
    );
  }

  if (!moduleData) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', py: 8 }}>
        <Alert severity="error">{error ?? 'Module not found.'}</Alert>
      </Box>
    );
  }

  const meta = moduleData.metadata;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="overline" color="text.secondary">Module Owner</Typography>
      <Typography variant="h4" sx={{ mb: 1 }}>{moduleData.title}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{moduleData.id}</Typography>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      <Divider sx={{ my: 3 }} />

      {/* Module metadata */}
      <Typography variant="h6" sx={{ mb: 2 }}>Module Info</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1, mb: 3 }}>
        {meta.author != null && [
          <Typography key="author-label" variant="body2" color="text.secondary">Author</Typography>,
          <Typography key="author-val" variant="body2">{String(meta.author)}</Typography>,
        ]}
        {meta.version != null && [
          <Typography key="version-label" variant="body2" color="text.secondary">Version</Typography>,
          <Typography key="version-val" variant="body2">{String(meta.version)}</Typography>,
        ]}
        {Array.isArray(meta.prerequisites) && [
          <Typography key="prereq-label" variant="body2" color="text.secondary">Prerequisites</Typography>,
          <Box key="prereq-val" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(meta.prerequisites as string[]).map((p) => (
              <Chip key={p} label={p} size="small" variant="outlined" />
            ))}
          </Box>,
        ]}
        {Array.isArray(meta.learning_objectives) && [
          <Typography key="obj-label" variant="body2" color="text.secondary">Objectives</Typography>,
          <Box key="obj-val" component="ul" sx={{ m: 0, pl: 2 }}>
            {(meta.learning_objectives as string[]).map((o, i) => (
              <li key={i}><Typography variant="body2">{o}</Typography></li>
            ))}
          </Box>,
        ]}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Aggregate usage stats — no PII */}
      <Typography variant="h6" sx={{ mb: 2 }}>Usage (Aggregate)</Typography>
      <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
        <Box>
          <Typography variant="h3">{enrolledCount}</Typography>
          <Typography variant="body2" color="text.secondary">Enrolled Students</Typography>
        </Box>
        <Box>
          <Typography variant="h3">{taskRunCount}</Typography>
          <Typography variant="body2" color="text.secondary">AI Task Runs</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Assigned instructors */}
      <Typography variant="h6" sx={{ mb: 1 }}>Assigned Instructors</Typography>
      {instructors.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>None assigned.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 3 }}>
          {instructors.map((instr) => (
            <Box key={instr.user_id} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{instr.email}</Typography>
              <Typography variant="caption" color="text.secondary">
                since {new Date(instr.assigned_at).toLocaleDateString()}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Edit form */}
      <Typography variant="h6" sx={{ mb: 2 }}>Edit Module Info</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
        <TextField
          label="Description"
          multiline
          minRows={2}
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          size="small"
        />
        <TextField
          label="Terms of Use"
          multiline
          minRows={3}
          value={editTerms}
          onChange={(e) => setEditTerms(e.target.value)}
          size="small"
          helperText="Plain text statement of terms for users of this module."
        />
        {saveMessage && (
          <Alert severity={saveMessage.startsWith('Error') ? 'error' : 'success'} sx={{ py: 0.5 }}>
            {saveMessage}
          </Alert>
        )}
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ alignSelf: 'flex-start' }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
}
