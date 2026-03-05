'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';

type TaskRun = {
  task_id: string;
  module_id: string;
  created_at: string;
};

type ModuleProgress = {
  module_id: string;
  percent_complete: number;
  last_module_page_id: string | null;
};

type StudentRow = {
  id: string;
  email: string;
  moduleProgress: ModuleProgress[];
  taskRuns: TaskRun[];
};

export default function InstructorModulePage() {
  const params = useParams();
  const moduleId = params?.moduleId as string;

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState<string>('');

  const fetchData = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    // Fetch module title
    const { data: moduleData } = await supabase
      .from('modules')
      .select('title')
      .eq('id', moduleId)
      .maybeSingle();
    setModuleTitle(moduleData?.title ?? moduleId);

    // Fetch enrolled students via instructor API
    const studentsRes = await fetch(`/api/instructor/${moduleId}/students`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!studentsRes.ok) {
      const json = await studentsRes.json();
      setError(json.error ?? 'Not authorized to view this module.');
      setLoading(false);
      return;
    }
    const { students: enrolledStudents } = await studentsRes.json() as { students: { id: string; email: string }[] };

    // Fetch module progress rows for this module
    const { data: progressRows } = await supabase
      .from('user_module_state')
      .select('user_id, module_id, percent_complete, last_module_page_id')
      .eq('module_id', moduleId);

    // Fetch AI task runs for this module (last 30 days)
    const since = new Date(Date.now() - 30 * 24 * 3_600_000).toISOString();
    const { data: taskRunRows } = await supabase
      .from('ai_task_runs')
      .select('user_id, task_id, module_id, created_at')
      .eq('module_id', moduleId)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    const progressByUser = new Map<string, ModuleProgress[]>();
    for (const row of progressRows ?? []) {
      const list = progressByUser.get(row.user_id) ?? [];
      list.push({
        module_id: row.module_id,
        percent_complete: row.percent_complete ?? 0,
        last_module_page_id: row.last_module_page_id ?? null,
      });
      progressByUser.set(row.user_id, list);
    }

    const runsByUser = new Map<string, TaskRun[]>();
    for (const row of taskRunRows ?? []) {
      const list = runsByUser.get(row.user_id) ?? [];
      list.push({ task_id: row.task_id, module_id: row.module_id, created_at: row.created_at });
      runsByUser.set(row.user_id, list);
    }

    setStudents(
      enrolledStudents.map((u) => ({
        id: u.id,
        email: u.email,
        moduleProgress: progressByUser.get(u.id) ?? [],
        taskRuns: runsByUser.get(u.id) ?? [],
      }))
    );
    setLoading(false);
  }, [moduleId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="overline" color="text.secondary">{moduleId}</Typography>
      <Typography variant="h4" sx={{ mb: 1 }}>{moduleTitle}</Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>Student Progress</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Student</TableCell>
              <TableCell>AI Tasks (30d)</TableCell>
              <TableCell sx={{ minWidth: 160 }}>Progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => {
              const isOpen = expanded === student.id;
              const progress = student.moduleProgress.find((m) => m.module_id === moduleId);
              const pct = progress?.percent_complete ?? 0;
              return (
                <React.Fragment key={student.id}>
                  <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : student.id)}>
                    <TableCell padding="checkbox">
                      <IconButton size="small">
                        {isOpen ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{student.email}</TableCell>
                    <TableCell>
                      {student.taskRuns.length > 0 ? (
                        <Chip label={student.taskRuns.length} size="small" color="primary" variant="outlined" />
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {Math.round(pct)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={4} sx={{ p: 0, border: isOpen ? undefined : 0 }}>
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <Box sx={{ px: 4, py: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Module Progress</Typography>
                          {!progress ? (
                            <Typography variant="body2" color="text.secondary">No progress recorded.</Typography>
                          ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ width: 36, textAlign: 'right' }}>
                                {Math.round(pct)}%
                              </Typography>
                              {progress.last_module_page_id && (
                                <Tooltip title={`Last page: ${progress.last_module_page_id}`}>
                                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 140 }}>
                                    → {progress.last_module_page_id}
                                  </Typography>
                                </Tooltip>
                              )}
                            </Box>
                          )}

                          {student.taskRuns.length > 0 && (
                            <>
                              <Divider sx={{ mb: 1 }} />
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>AI Task Runs (last 30 days)</Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                {student.taskRuns.slice(0, 20).map((r, i) => (
                                  <Tooltip key={i} title={new Date(r.created_at).toLocaleDateString()}>
                                    <Chip label={r.task_id} size="small" variant="outlined" />
                                  </Tooltip>
                                ))}
                                {student.taskRuns.length > 20 && (
                                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                    +{student.taskRuns.length - 20} more
                                  </Typography>
                                )}
                              </Box>
                            </>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No enrolled students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
