'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Container, Card, CardContent, CardActions, Button, Typography, Box, LinearProgress, Alert } from '@mui/material';
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
                  xs: '100%', // Full width on extra-small screens
                  sm: 'calc(50% - 16px)', // Half width on small screens (minus gap)
                  md: 'calc(33.333% - 22px)', // One-third width on medium screens (minus gap)
                },
              }}
            >
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {title}
                  </Typography>
                  <Typography>
                    {description}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {status === 'unauthenticated' ? (
                      <Typography variant="body2" color="text.secondary">
                        Sign in to track your progress.
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {Math.round(progress)}% complete
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{ mt: 1 }}
                          aria-label={`${title} completion progress`}
                        />
                      </>
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    component={targetHref ? Link : 'button'}
                    href={targetHref || undefined}
                    size="small"
                    variant="contained"
                    disabled={isDisabled}
                  >
                    {ctaLabel}
                  </Button>
                </CardActions>
              </Card>
            </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
