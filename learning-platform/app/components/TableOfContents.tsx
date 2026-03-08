'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import GridOnIcon from '@mui/icons-material/GridOn';
import CloseIcon from '@mui/icons-material/Close';
import type { TableOfContentsItem } from '@/lib/content';

type TableOfContentsProps = {
  items: TableOfContentsItem[];
};

export default function TableOfContents({ items }: TableOfContentsProps) {
  const theme = useTheme();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sectionIds = useMemo(() => items.map((item) => item.id), [items]);

  useEffect(() => {
    if (!activeId && sectionIds.length > 0) setActiveId(sectionIds[0]);
  }, [activeId, sectionIds]);

  useEffect(() => {
    if (sectionIds.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sectionIds]);

  if (items.length === 0) return null;

  const tocList = (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', width: { md: 260 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h6" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem' }}>
          Document Index
        </Typography>
        <Box sx={{ display: { md: 'none' } }}>
          <IconButton onClick={() => setMobileOpen(false)} size="small"><CloseIcon /></IconButton>
        </Box>
      </Stack>

      <List dense disablePadding sx={{ flexGrow: 1 }}>
        {items.map((item, index) => {
          const isActive = activeId === item.id;
          return (
            <ListItem key={item.id} disablePadding sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
              <ListItemButton
                component="a"
                href={`#${item.id}`}
                onClick={() => { setActiveId(item.id); setMobileOpen(false); }}
                selected={isActive}
                sx={{
                  py: 2, px: 1,
                  borderRadius: 0,
                  '&.Mui-selected': {
                    bgcolor: 'transparent',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                  },
                  '&:hover .toc-line': { width: '60%' },
                  '&.Mui-selected .toc-line': { width: '100%', bgcolor: theme.palette.secondary.main },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mr: 2, width: 22, flexShrink: 0 }}>
                  {(index + 1).toString().padStart(2, '0')}
                </Typography>
                <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                  <Typography variant="body2" noWrap sx={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', fontWeight: isActive ? 700 : 400, color: isActive ? 'text.primary' : 'text.secondary' }}>
                    {item.title}
                  </Typography>
                  <Box className="toc-line" sx={{ position: 'absolute', bottom: -4, left: 0, width: 0, height: 2, bgcolor: alpha(theme.palette.divider, 0.5), transition: 'all 0.3s ease' }} />
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {/* Desktop */}
      <Box
        component="nav"
        aria-label="Table of contents"
        sx={{
          display: { xs: 'none', lg: 'block' },
          position: 'sticky',
          top: { md: 96 },
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
          borderRight: `1px solid ${theme.palette.divider}`,
        }}
      >
        {tocList}
      </Box>

      {/* Mobile */}
      <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setMobileOpen(true)}
          startIcon={<GridOnIcon />}
          sx={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 1200, height: 50, boxShadow: 'none', borderRadius: 0 }}
        >
          Index
        </Button>
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: 300, borderRadius: 0 } }}
        >
          {tocList}
        </Drawer>
      </Box>
    </>
  );
}
