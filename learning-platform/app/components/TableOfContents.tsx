'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import type { TableOfContentsItem } from '@/lib/content';

type TableOfContentsProps = {
  items: TableOfContentsItem[];
};

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sectionIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (!activeId && sectionIds.length > 0) {
      setActiveId(sectionIds[0]);
    }
  }, [activeId, sectionIds]);

  useEffect(() => {
    if (sectionIds.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-120px 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  if (items.length === 0) {
    return null;
  }

  return (
    <Box
      component="nav"
      aria-label="Table of contents"
      sx={{
        position: 'sticky',
        top: { md: 96 },
        alignSelf: 'flex-start',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        display: { xs: 'none', lg: 'block' },
        borderLeft: '1px solid',
        borderColor: 'divider',
        pl: 3,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        On This Page
      </Typography>
      <List dense disablePadding>
        {items.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              component="a"
              href={`#${item.id}`}
              selected={activeId === item.id}
              onClick={() => setActiveId(item.id)}
              sx={{
                borderRadius: 1,
                py: 0.75,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 45, 90, 0.08)',
                },
              }}
            >
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: activeId === item.id ? 'text.primary' : 'text.secondary',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
