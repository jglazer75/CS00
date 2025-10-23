'use client';

import Link from 'next/link';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography, LinearProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { ModulePageSummary } from '@/lib/content';

type ModuleNavProps = {
  moduleId: string;
  activeSlug: string;
  pages: ModulePageSummary[];
  completedSlugs?: string[];
  percentComplete?: number;
  lastVisitedSlug?: string;
};

export default function ModuleNav({
  moduleId,
  activeSlug,
  pages,
  completedSlugs = [],
  percentComplete = 0,
  lastVisitedSlug,
}: ModuleNavProps) {
  const completedSet = new Set(completedSlugs);
  const progressValue = Number.isFinite(percentComplete) ? percentComplete : 0;

  return (
    <Box
      component="nav"
      sx={{
        width: { sm: 280 },
        flexShrink: { sm: 0 },
        borderRight: '1px solid',
        borderColor: 'divider',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: '64px',
        overflowY: 'auto',
      }}
    >
      <Typography variant="h6" sx={{ p: 2 }}>
        Module Sections
      </Typography>
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {completedSet.size} of {pages.length} complete
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{ mt: 1 }}
          aria-label={`Module ${moduleId} progress`}
        />
      </Box>
      <List>
        {pages.map(({ slug, title }) => {
          const isActive = slug === activeSlug;
          const isCompleted = completedSet.has(slug);
          const isLastVisited = !isActive && lastVisitedSlug === slug;

          return (
            <ListItem key={slug} disablePadding>
              <ListItemButton component={Link} href={`/modules/${moduleId}/${slug}`} selected={isActive}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <ListItemText
                    primary={title || slug.replace(/-/g, ' ')}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 'bold' : undefined,
                    }}
                    secondary={
                      isLastVisited ? (
                        <Typography component="span" variant="caption" color="text.secondary">
                          Last visited
                        </Typography>
                      ) : undefined
                    }
                  />
                  {isCompleted && (
                    <CheckCircleOutlineIcon
                      fontSize="small"
                      color={isActive ? 'inherit' : 'success'}
                      aria-label="Completed section"
                    />
                  )}
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
