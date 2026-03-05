'use client';

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';
import { useAuth } from '@/app/context/AuthContext';

type ModuleRecord = {
  id: string;
  title: string;
  description: string | null;
};

export default function InstructorIndexPage() {
  const supabase = useSupabaseClient();
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModules() {
      if (!supabase || !user) return;

      // Get modules this user is an instructor for
      const { data: instructorRows, error: instrError } = await supabase
        .from('module_instructors')
        .select('module_id')
        .eq('user_id', user.id);

      if (instrError) { setError(instrError.message); setLoading(false); return; }

      const moduleIds = (instructorRows ?? []).map((r) => r.module_id);
      if (moduleIds.length === 0) {
        // Check for global is_instructor flag
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_instructor')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.is_instructor) {
          // Show all modules
          const { data, error: modError } = await supabase
            .from('modules')
            .select('id, title, description')
            .order('id');
          if (modError) { setError(modError.message); } else { setModules(data ?? []); }
        }
        setLoading(false);
        return;
      }

      const { data, error: modError } = await supabase
        .from('modules')
        .select('id, title, description')
        .in('id', moduleIds)
        .order('id');

      if (modError) { setError(modError.message); } else { setModules(data ?? []); }
      setLoading(false);
    }

    fetchModules();
  }, [supabase, user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', py: 4, px: 2 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>Instructor Dashboard</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {modules.length === 0 ? (
        <Typography color="text.secondary">No modules assigned.</Typography>
      ) : (
        <Grid container spacing={3}>
          {modules.map((module) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={module.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="overline" color="text.secondary">{module.id}</Typography>
                  <Typography variant="h6">{module.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {module.description || 'No description.'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" component={Link} href={`/instructor/${module.id}`}>
                    View Students
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
