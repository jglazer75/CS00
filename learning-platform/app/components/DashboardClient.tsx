'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Container, Card, CardActionArea, CardContent, Typography, Box, LinearProgress, Alert, Divider, alpha } from '@mui/material';
import AdjustIcon from '@mui/icons-material/Adjust';
import { useTheme } from '@mui/material/styles';
import { useSupabaseClient } from '../context/SupabaseClientContext';

type ModuleLink = {
  id: string;
  href: string;
  title: string;
  description: string;
};

type ModuleProgressInfo = {
  percent: number;
  lastSlug?: string;
};

export default function DashboardClient({ moduleLinks }: { moduleLinks: ModuleLink[] }) {
  const theme = useTheme();
  const supabase = useSupabaseClient();
  const moduleIds = useMemo(() => moduleLinks.map((link) => link.id), [moduleLinks]);
  const moduleIdsKey = moduleIds.join('|');
  const [progressByModule, setProgressByModule] = useState<Record<string, ModuleProgressInfo>>({});
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (moduleIds.length === 0) {
        setStatus('ready');
        setProgressByModule({});
        return;
      }

      setStatus('loading');
      setError(undefined);

      if (!supabase) {
        setStatus('unauthenticated');
        setProgressByModule({});
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        if (!cancelled) {
          setStatus('error');
          setError(sessionError.message);
        }
        return;
      }

      const session = sessionData.session;
      if (!session) {
        if (!cancelled) {
          setStatus('unauthenticated');
          setProgressByModule({});
        }
        return;
      }

      const { data, error: stateError } = await supabase
        .from('user_module_state')
        .select('module_id, percent_complete, last_module_page_id')
        .in('module_id', moduleIds);

      if (stateError) {
        if (!cancelled) {
          setStatus('error');
          setError(stateError.message);
        }
        return;
      }

      const lastPageIds = (data ?? [])
        .map((row) => row.last_module_page_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0);

      const slugMap = new Map<string, string>();

      if (lastPageIds.length > 0) {
        const { data: pageRows, error: pageError } = await supabase
          .from('module_pages')
          .select('id, slug')
          .in('id', Array.from(new Set(lastPageIds)));

        if (pageError) {
          if (!cancelled) {
            setStatus('error');
            setError(pageError.message);
          }
          return;
        }

        pageRows?.forEach((row) => {
          if (row.id && row.slug) {
            slugMap.set(row.id, row.slug);
          }
        });
      }

      const nextProgress = Object.fromEntries(
        (data ?? []).map((row) => [
          row.module_id,
          {
            percent: typeof row.percent_complete === 'number' ? row.percent_complete : 0,
            lastSlug: row.last_module_page_id ? slugMap.get(row.last_module_page_id) : undefined,
          },
        ])
      );

      if (!cancelled) {
        setProgressByModule(nextProgress);
        setStatus('ready');
      }
    }

    load().catch((loadError: Error) => {
      if (!cancelled) {
        setStatus('error');
        setError(loadError.message);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [moduleIds, moduleIdsKey, supabase]);

  return (
    <Box component="main" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Available Modules
        </Typography>
        {status === 'error' && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4, // Spacing between items
          }}
        >
          {moduleLinks.map(({ id, href, title, description }) => {
            const moduleProgress = progressByModule[id];
            const progress = Math.min(100, Math.max(0, moduleProgress?.percent ?? 0));
            const resumeSlug = moduleProgress?.lastSlug;
            const baseHref = href === '#' ? undefined : href;
            const targetHref = resumeSlug && baseHref ? `/modules/${id}/${resumeSlug}` : baseHref;
            const ctaLabel = status === 'ready' && progress > 0 ? 'Resume module' : 'Start module';
            const isDisabled = !targetHref;

            return (
              <Box
                key={id}
                sx={{
                  width: {
                    xs: '100%',
                    sm: 'calc(50% - 16px)',
                    md: 'calc(33.333% - 22px)',
                  },
                }}
              >
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: `4px solid ${progress > 0 ? theme.palette.secondary.main : 'transparent'}`,
                  transition: 'all 0.2s ease-out',
                }}>
                  <CardActionArea
                    component={targetHref ? Link : 'div'}
                    href={targetHref || undefined}
                    disabled={isDisabled}
                    sx={{ flexGrow: 1, display: 'flex', alignItems: 'stretch' }}
                  >
                    <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={3}>
                        <AdjustIcon sx={{ color: progress > 0 ? theme.palette.secondary.main : theme.palette.divider, fontSize: 18 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                          {status === 'unauthenticated' ? 'Public Access' : progress === 100 ? 'Complete' : progress > 0 ? 'In Progress' : 'Not Started'}
                        </Typography>
                      </Box>

                      <Typography variant="h5" component="h2" mb={2} sx={{ letterSpacing: '-0.02em' }}>
                        {title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        fontStyle: 'italic', flexGrow: 1, mb: 4,
                      }}>
                        {description}
                      </Typography>

                      <Box sx={{ mt: 'auto' }}>
                        <Divider sx={{ mb: 2, borderColor: alpha(theme.palette.primary.main, 0.1) }} />
                        {status === 'unauthenticated' ? (
                          <Typography variant="body2" color="text.secondary">Sign in to track your progress.</Typography>
                        ) : (
                          <>
                            <Typography variant="caption" component="div" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5, textAlign: 'right' }}>
                              PHASE: {Math.round(progress)}%
                            </Typography>
                            <LinearProgress variant="determinate" value={progress} color="secondary" aria-label={`${title} completion progress`} />
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
