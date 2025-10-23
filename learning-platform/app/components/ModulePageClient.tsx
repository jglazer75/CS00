'use client';

import { useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import ModuleNav from './ModuleNav';
import ModulePageContent from './ModulePageContent';
import type { ModulePage, ModulePageSummary } from '@/lib/content';
import { useModuleProgress } from '../hooks/useModuleProgress';

type ModulePageClientProps = {
  moduleId: string;
  slug: string;
  navData: ModulePageSummary[];
  pageData: ModulePage;
};

export default function ModulePageClient({ moduleId, slug, navData, pageData }: ModulePageClientProps) {
  const slugs = useMemo(() => navData.map((page) => page.slug), [navData]);
  const { metadata, chunks, instructorNote, tableOfContents } = pageData;

  const {
    status,
    completedSlugs,
    percentComplete,
    lastVisitedSlug,
    isProcessing,
    error,
    markPageVisited,
    markPageCompleted,
  } = useModuleProgress(moduleId, slugs);

  useEffect(() => {
    if (status === 'ready') {
      markPageVisited(slug).catch((visitError) => {
        console.warn('Failed to record page visit', visitError);
      });
    }
  }, [markPageVisited, slug, status]);

  const isCompleted = useMemo(() => completedSlugs.includes(slug), [completedSlugs, slug]);

  return (
    <Box sx={{ display: 'flex' }}>
      <ModuleNav
        moduleId={moduleId}
        activeSlug={slug}
        pages={navData}
        completedSlugs={completedSlugs}
        percentComplete={percentComplete}
        lastVisitedSlug={lastVisitedSlug}
      />
      <ModulePageContent
        metadata={metadata}
        chunks={chunks}
        instructorNote={instructorNote}
        tableOfContents={tableOfContents}
        progressStatus={status}
        progressError={error}
        isCompleted={isCompleted}
        isProcessingProgress={isProcessing}
        onMarkComplete={() => markPageCompleted(slug)}
      />
    </Box>
  );
}
