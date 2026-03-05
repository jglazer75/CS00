'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Typography,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useModuleProgress } from '../hooks/useModuleProgress';

type ModuleLandingClientProps = {
  moduleId: string;
  slugs: string[];
  teamName: string | null;
  teamRole: string | null;
  moduleMetadata: Record<string, unknown>;
};

export default function ModuleLandingClient({
  moduleId,
  slugs,
  teamName,
  teamRole,
  moduleMetadata,
}: ModuleLandingClientProps) {
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const { status, lastVisitedSlug, completedSlugs, percentComplete } = useModuleProgress(moduleId, slugs);

  const isReturningVisitor = useMemo(() => {
    if (status !== 'ready') return false;
    return percentComplete > 0 || !!lastVisitedSlug;
  }, [status, percentComplete, lastVisitedSlug]);

  const resumeSlug = useMemo(() => {
    if (lastVisitedSlug && slugs.includes(lastVisitedSlug)) {
      return lastVisitedSlug;
    }
    if (completedSlugs.length > 0) {
      const remaining = slugs.find((slug) => !completedSlugs.includes(slug));
      if (remaining) return remaining;
    }
    return slugs[0];
  }, [completedSlugs, lastVisitedSlug, slugs]);

  // Auto-redirect returning visitors
  useEffect(() => {
    if (hasRedirected) return;

    if (status === 'unauthenticated' || status === 'error') {
      setHasRedirected(true);
      router.replace(slugs[0] ? `/modules/${moduleId}/${slugs[0]}` : '/');
      return;
    }

    if (status === 'ready' && isReturningVisitor && resumeSlug) {
      setHasRedirected(true);
      router.replace(`/modules/${moduleId}/${resumeSlug}`);
    }
  }, [hasRedirected, status, isReturningVisitor, resumeSlug, moduleId, router, slugs]);

  // Loading state
  if (status === 'loading' || (status === 'ready' && isReturningVisitor && !hasRedirected)) {
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

  // First-time visitor orientation view
  const learningObjectives = Array.isArray(moduleMetadata.learning_objectives)
    ? (moduleMetadata.learning_objectives as string[])
    : [];
  const termsOfUse = moduleMetadata.terms_of_use ? String(moduleMetadata.terms_of_use) : null;

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="overline" color="text.secondary">{moduleId}</Typography>
      <Typography variant="h4" sx={{ mb: 1 }}>Welcome</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        This is your starting point for this module. Review the information below, then begin when you&apos;re ready.
      </Typography>

      {/* Team card */}
      {teamName && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupIcon color="primary" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                You are on <strong>{teamName}</strong>
              </Typography>
              {teamRole && (
                <Typography variant="body2" color="text.secondary">
                  Your role: <Chip label={teamRole} size="small" sx={{ ml: 0.5 }} />
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Learning objectives */}
      {learningObjectives.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Learning Objectives</Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {learningObjectives.map((obj, i) => (
              <li key={i}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>{obj}</Typography>
              </li>
            ))}
          </Box>
        </Box>
      )}

      {/* Terms of use */}
      {termsOfUse && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Terms of Use</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {termsOfUse}
          </Typography>
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* CTAs */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          onClick={() => {
            setHasRedirected(true);
            router.push(`/modules/${moduleId}/${slugs[0]}`);
          }}
        >
          Begin Module
        </Button>
        {lastVisitedSlug && lastVisitedSlug !== slugs[0] && (
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              setHasRedirected(true);
              router.push(`/modules/${moduleId}/${lastVisitedSlug}`);
            }}
          >
            Jump to Last Position
          </Button>
        )}
      </Box>
    </Container>
  );
}
