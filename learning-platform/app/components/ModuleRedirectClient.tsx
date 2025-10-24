'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Container, Typography } from '@mui/material';
import { useModuleProgress } from '../hooks/useModuleProgress';

type ModuleRedirectClientProps = {
  moduleId: string;
  slugs: string[];
};

export default function ModuleRedirectClient({ moduleId, slugs }: ModuleRedirectClientProps) {
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const { status, lastVisitedSlug, completedSlugs } = useModuleProgress(moduleId, slugs);

  const fallbackSlug = useMemo(() => {
    if (lastVisitedSlug && slugs.includes(lastVisitedSlug)) {
      return lastVisitedSlug;
    }

    if (completedSlugs.length > 0) {
      const remaining = slugs.find((slug) => !completedSlugs.includes(slug));
      if (remaining) {
        return remaining;
      }
    }

    return slugs[0];
  }, [completedSlugs, lastVisitedSlug, slugs]);

  useEffect(() => {
    if (hasRedirected) {
      return;
    }

    if (status === 'ready' || status === 'unauthenticated' || status === 'error') {
      if (fallbackSlug) {
        setHasRedirected(true);
        router.replace(`/modules/${moduleId}/${fallbackSlug}`);
      } else {
        setHasRedirected(true);
        router.replace('/');
      }
    }
  }, [fallbackSlug, hasRedirected, moduleId, router, status]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Loading module…
        </Typography>
      </Box>
    </Container>
  );
}
