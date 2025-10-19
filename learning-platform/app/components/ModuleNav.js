'use client';
import Link from 'next/link';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';

export default function ModuleNav({ moduleId, activeSlug, pages }) {
  return (
    <Box component="nav" sx={{ 
      width: { sm: 280 }, 
      flexShrink: { sm: 0 },
      borderRight: '1px solid',
      borderColor: 'divider',
      height: 'calc(100vh - 64px)', // Full height minus AppBar
      position: 'sticky',
      top: '64px', // Position below AppBar
      overflowY: 'auto'
    }}>
      <Typography variant="h6" sx={{ p: 2 }}>
        Module Sections
      </Typography>
      <List>
        {pages.map(({ slug, title }) => {
          const isActive = slug === activeSlug;
          return (
            <ListItem key={slug} disablePadding>
              <ListItemButton component={Link} href={`/modules/${moduleId}/${slug}`} selected={isActive}>
                <ListItemText primary={title || slug.replace(/-/g, ' ')} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}