'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import Link from 'next/link';
import { useSupabaseClient } from '@/app/context/SupabaseClientContext';

type ModuleRecord = {
  id: string;
  title: string;
  description: string | null;
  owner_user_id: string | null;
  metadata: Record<string, unknown> | null;
};

export default function AdminModulesPage() {
  const supabase = useSupabaseClient();
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModules() {
      if (!supabase) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('modules')
        .select('id, title, description, owner_user_id, metadata')
        .order('id');

      if (error) {
        setError(error.message);
      } else {
        setModules(data || []);
      }
      setLoading(false);
    }

    fetchModules();
  }, [supabase]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Modules
      </Typography>

      <Grid container spacing={3}>
        {modules.map((module) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={module.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="overline" color="text.secondary">
                  {module.id}
                </Typography>
                <Typography variant="h6" component="div">
                  {module.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {module.description || 'No description provided.'}
                </Typography>
                {Boolean((module.metadata as Record<string, unknown>)?.author) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {'Author: ' + String((module.metadata as Record<string, unknown>).author)}
                  </Typography>
                )}
                {Boolean((module.metadata as Record<string, unknown>)?.terms_of_use) && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, fontStyle: 'italic' }}>
                    {'Terms: ' + String((module.metadata as Record<string, unknown>).terms_of_use).slice(0, 80) + (String((module.metadata as Record<string, unknown>).terms_of_use).length > 80 ? '…' : '')}
                  </Typography>
                )}
                {module.owner_user_id && (
                  <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                    Owner set
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  component={Link}
                  href={`/admin/modules/${module.id}/ai`}
                  startIcon={<SettingsIcon />}
                >
                  AI Settings
                </Button>
                <Button
                  size="small"
                  component={Link}
                  href={`/admin/modules/${module.id}/teams`}
                  startIcon={<GroupsIcon />}
                >
                  Teams
                </Button>
                <Button
                  size="small"
                  component={Link}
                  href={`/module-owner/${module.id}`}
                  startIcon={<PersonIcon />}
                >
                  Owner View
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
