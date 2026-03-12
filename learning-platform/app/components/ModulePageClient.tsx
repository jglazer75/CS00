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
  teamName?: string | null;
  teamRole?: string | null;
};

export default function ModulePageClient({ moduleId, slug, navData, pageData, teamName, teamRole }: ModulePageClientProps) {
  const { slugs, currentNode } = useMemo(() => {
    const list: string[] = [];
    let found: ModuleStructureNode | undefined;
    function collect(nodes: ModuleStructureNode[]) {
      nodes.forEach((n) => {
        if (n.type === 'page' || n.type === 'ai-interaction') {
          list.push(n.id);
          if (n.id === slug) found = n;
        }
        collect(n.children);
      });
    }
    collect(navData);
    return { slugs: list, currentNode: found };
  }, [navData, slug]);

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
        teamName={teamName ?? undefined}
        teamRole={teamRole ?? undefined}
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
        isExercise={
          currentNode?.type === 'ai-interaction' || currentNode?.layout === 'workbench'
        }
        exportHref={`/api/modules/${moduleId}/export/${slug}/docx`}
      />
    </Box>
  );
}
