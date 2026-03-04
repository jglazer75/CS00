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
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import { useParams } from 'next/navigation';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type TeamMemberRow = { id: string; user_id: string; email?: string };
type TeamRow = { id: string; name: string; role: string | null; members: TeamMemberRow[] };
type ModuleRow = { id: string; title: string; is_public: boolean; metadata: Record<string, unknown> | null };

export default function AdminTeamsPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const supabase = useSupabaseClient();
  const [module, setModule] = useState<ModuleRow | null>(null);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate dialog state
  const [genOpen, setGenOpen] = useState(false);
  const [genBy, setGenBy] = useState<'numTeams' | 'studentsPerTeam'>('numTeams');
  const [genValue, setGenValue] = useState(4);
  const [genRoles, setGenRoles] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!supabase || !moduleId) return;
    setLoading(true);
    setError(null);

    const [{ data: moduleData, error: modErr }, { data: teamsData, error: teamsErr }] = await Promise.all([
      supabase.from('modules').select('id, title, is_public, metadata').eq('id', moduleId).single(),
      supabase
        .from('teams')
        .select('id, name, role, team_members(id, user_id)')
        .eq('module_id', moduleId)
        .order('name'),
    ]);

    if (modErr) { setError(modErr.message); setLoading(false); return; }
    if (teamsErr) { setError(teamsErr.message); setLoading(false); return; }

    setModule(moduleData as ModuleRow);

    // Fetch user emails
    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
    let emailMap = new Map<string, string>();
    if (session) {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const { users } = await res.json() as { users: { id: string; email: string }[] };
        emailMap = new Map(users.map((u) => [u.id, u.email]));
      }
    }

    setTeams(
      (teamsData ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        members: ((t.team_members ?? []) as { id: string; user_id: string }[]).map((m) => ({
          id: m.id,
          user_id: m.user_id,
          email: emailMap.get(m.user_id),
        })),
      }))
    );
    setLoading(false);
  }, [supabase, moduleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePublic = async (value: boolean) => {
    if (!supabase || !module) return;
    const { error: updateError } = await supabase
      .from('modules')
      .update({ is_public: value })
      .eq('id', moduleId);
    if (updateError) { setError(updateError.message); return; }
    setModule({ ...module, is_public: value });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
    const res = await fetch('/api/admin/teams/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        moduleId,
        by: genBy,
        value: genValue,
        assignRolesRandomly: genRoles,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? 'Failed to generate teams');
    } else {
      setGenOpen(false);
      await fetchData();
    }
    setGenerating(false);
  };

  const assignRole = async (teamId: string, role: string) => {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from('teams')
      .update({ role })
      .eq('id', teamId);
    if (updateError) { setError(updateError.message); return; }
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, role } : t)));
  };

  const moduleRoles: string[] = (module?.metadata?.roles as string[] | undefined)?.filter((r) => r !== 'Instructor') ?? [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">
          {module?.title ?? moduleId} — Teams
        </Typography>
        <Button
          variant="contained"
          startIcon={<GroupsIcon />}
          onClick={() => setGenOpen(true)}
        >
          Generate Teams
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Module visibility toggle */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={module?.is_public ?? false}
              onChange={(e) => togglePublic(e.target.checked)}
            />
          }
          label="Module is public (any authenticated user can access)"
        />
      </Paper>

      {/* Teams list */}
      {teams.length === 0 ? (
        <Typography color="text.secondary">No teams yet. Use &ldquo;Generate Teams&rdquo; to create them.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {teams.map((team) => (
            <Paper key={team.id} variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">{team.name}</Typography>
                {moduleRoles.length > 0 ? (
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      label="Role"
                      value={team.role ?? ''}
                      onChange={(e) => assignRole(team.id, e.target.value)}
                    >
                      <MenuItem value=""><em>Unassigned</em></MenuItem>
                      {moduleRoles.map((r) => (
                        <MenuItem key={r} value={r}>{r}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : team.role ? (
                  <Chip label={team.role} size="small" color="primary" />
                ) : null}
              </Box>
              <Divider sx={{ mb: 1 }} />
              <List dense disablePadding>
                {team.members.map((m) => (
                  <ListItem key={m.id} disablePadding>
                    <ListItemText
                      primary={m.email ?? m.user_id}
                      primaryTypographyProps={{ variant: 'body2', sx: { fontFamily: 'monospace' } }}
                    />
                  </ListItem>
                ))}
                {team.members.length === 0 && (
                  <ListItem disablePadding>
                    <ListItemText primary="No members" primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                  </ListItem>
                )}
              </List>
            </Paper>
          ))}
        </Box>
      )}

      {/* Generate Teams dialog */}
      <Dialog open={genOpen} onClose={() => setGenOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Generate Teams</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Split by</InputLabel>
            <Select
              label="Split by"
              value={genBy}
              onChange={(e) => setGenBy(e.target.value as 'numTeams' | 'studentsPerTeam')}
            >
              <MenuItem value="numTeams">Number of teams</MenuItem>
              <MenuItem value="studentsPerTeam">Students per team</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={genBy === 'numTeams' ? 'Number of teams' : 'Students per team'}
            type="number"
            value={genValue}
            onChange={(e) => setGenValue(parseInt(e.target.value) || 1)}
            inputProps={{ min: 1 }}
          />
          {moduleRoles.length > 0 && (
            <FormControlLabel
              control={
                <Switch
                  checked={genRoles}
                  onChange={(e) => setGenRoles(e.target.checked)}
                />
              }
              label="Assign roles randomly"
            />
          )}
          <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
            This will replace all existing teams for this module.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={16} /> : null}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
