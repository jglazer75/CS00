'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  LinearProgress,
  Collapse,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Chip from '@mui/material/Chip';
import type { ModuleStructureNode } from '@/lib/content';

type ModuleNavProps = {
  moduleId: string;
  activeSlug: string;
  structure: ModuleStructureNode[];
  completedSlugs?: string[];
  percentComplete?: number;
  lastVisitedSlug?: string;
  teamName?: string;
  teamRole?: string;
};

export default function ModuleNav({
  moduleId,
  activeSlug,
  structure,
  completedSlugs = [],
  percentComplete = 0,
  lastVisitedSlug,
  teamName,
  teamRole,
}: ModuleNavProps) {
  const completedSet = new Set(completedSlugs);
  const progressValue = Number.isFinite(percentComplete) ? percentComplete : 0;

  // Flatten for counting pages
  const allPages: string[] = [];
  function collectPages(nodes: ModuleStructureNode[]) {
    nodes.forEach((node) => {
      if (node.type === 'page' || node.type === 'ai-interaction') {
        allPages.push(node.id);
      }
      collectPages(node.children);
    });
  }
  collectPages(structure);

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
        Module Navigation
      </Typography>
      <Box sx={{ px: 2, pb: 2 }}>
        {teamName && (
          <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Chip label={teamName} size="small" color="primary" variant="outlined" />
            {teamRole && <Chip label={teamRole} size="small" color="secondary" variant="outlined" />}
          </Box>
        )}
        <Typography variant="body2" color="text.secondary">
          {completedSet.size} of {allPages.length} complete
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{ mt: 1 }}
          aria-label={`Module ${moduleId} progress`}
        />
      </Box>
      <List component="div" disablePadding>
        {structure.map((node) => (
          <NavNode
            key={node.id}
            node={node}
            moduleId={moduleId}
            activeSlug={activeSlug}
            completedSet={completedSet}
            lastVisitedSlug={lastVisitedSlug}
            level={0}
          />
        ))}
      </List>
    </Box>
  );
}

type NavNodeProps = {
  node: ModuleStructureNode;
  moduleId: string;
  activeSlug: string;
  completedSet: Set<string>;
  lastVisitedSlug?: string;
  level: number;
};

function NavNode({
  node,
  moduleId,
  activeSlug,
  completedSet,
  lastVisitedSlug,
  level,
}: NavNodeProps) {
  const [open, setOpen] = useState(true);
  const handleClick = () => {
    setOpen(!open);
  };

  const isSection = node.type === 'section';
  const isActive = node.id === activeSlug;
  const isCompleted = completedSet.has(node.id);
  const isLastVisited = !isActive && lastVisitedSlug === node.id;

  if (isSection) {
    return (
      <>
        <ListItem disablePadding>
          <ListItemButton onClick={handleClick} sx={{ pl: level * 2 + 2 }}>
            <ListItemText
              primary={node.title}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: 'bold',
                color: 'text.secondary',
              }}
            />
            {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </ListItemButton>
        </ListItem>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {node.children.map((child) => (
              <NavNode
                key={child.id}
                node={child}
                moduleId={moduleId}
                activeSlug={activeSlug}
                completedSet={completedSet}
                lastVisitedSlug={lastVisitedSlug}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      </>
    );
  }

  const isExercise = node.type === 'ai-interaction' || node.layout === 'workbench';

  return (
    <ListItem disablePadding>
      <ListItemButton
        component={Link}
        href={`/modules/${moduleId}/${node.id}`}
        selected={isActive}
        sx={{ pl: level * 2 + 2 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <ListItemText
            primary={node.title}
            primaryTypographyProps={{
              fontWeight: isActive ? 'bold' : undefined,
              variant: 'body2',
            }}
            secondary={
              isLastVisited ? (
                <Typography component="span" variant="caption" color="text.secondary">
                  Last visited
                </Typography>
              ) : undefined
            }
          />
          {isExercise && (
            <Chip
              label="Exercise"
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ height: 18, fontSize: '0.65rem', flexShrink: 0 }}
            />
          )}
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
}
