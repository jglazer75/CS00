'use client';

import { useEffect, useMemo } from 'react';
import { Box } from '@mui/material';
import ModuleNav from './ModuleNav';
import ModulePageContent from './ModulePageContent';
import type { ModulePage, ModuleStructureNode } from '@/lib/content';
import { useModuleProgress } from '../hooks/useModuleProgress';

type ModulePageClientProps = {
  moduleId: string;
  slug: string;
  navData: ModuleStructureNode[];
  pageData: ModulePage;
};

export default function ModulePageClient({ moduleId, slug, navData, pageData }: ModulePageClientProps) {
  const slugs = useMemo(() => {
    const list: string[] = [];
    function collect(nodes: ModuleStructureNode[]) {
      nodes.forEach((n) => {
        if (n.type === 'page' || n.type === 'ai-interaction') {
          list.push(n.id);
        }
        collect(n.children);
      });
    }
    collect(navData);
    return list;
  }, [navData]);

  const { metadata, chunks, instructorNote, tableOfContents, aiTasks } = pageData;

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
        structure={navData}
        completedSlugs={completedSlugs}
        percentComplete={percentComplete}
        lastVisitedSlug={lastVisitedSlug}
      />
      <ModulePageContent
        metadata={metadata}
        chunks={chunks}
        instructorNote={instructorNote}
        tableOfContents={tableOfContents}
        aiTasks={aiTasks}
        progressStatus={status}
        progressError={error}
        isCompleted={isCompleted}
        isProcessingProgress={isProcessing}
        onMarkComplete={() => markPageCompleted(slug)}
      />
    </Box>
  );
}
