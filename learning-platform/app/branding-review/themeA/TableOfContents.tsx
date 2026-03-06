import React from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, alpha, useTheme, Drawer, Fab } from '@mui/material';
import TocIcon from '@mui/icons-material/Toc';

export interface TableOfContentsProps {
  sections: { id: string; title: string }[];
  activeId: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ sections, activeId }) => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleScroll = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const tocList = (
    <Box sx={{ width: { md: 240 } }}>
      <Typography variant="subtitle1" component="div" gutterBottom sx={{ color: theme.palette.secondary.main, fontWeight: 700, px: 2, pt: 2, mb: 2 }}>
        Table of Contents
      </Typography>
      <List dense disablePadding>
        {sections.map(section => (
          <ListItem key={section.id} disablePadding>
            <ListItemButton 
              onClick={() => handleScroll(section.id)}
              selected={activeId === section.id}
              sx={{
                borderLeft: `2px solid`,
                borderColor: activeId === section.id ? theme.palette.secondary.main : 'transparent',
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.15) },
                  '& .MuiListItemText-primary': { fontWeight: 700, color: theme.palette.secondary.main }
                }
              }}
            >
              <ListItemText 
                primary={section.title} 
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {/* Desktop Version */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 80, alignSelf: 'start' }}>
        {tocList}
      </Box>

      {/* Mobile Version */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Fab 
          color="secondary" 
          aria-label="Table of Contents" 
          onClick={handleDrawerToggle}
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1200 }}
        >
          <TocIcon />
        </Fab>
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          sx={{ '& .MuiDrawer-paper': { pt: 8 } }}
        >
          {tocList}
        </Drawer>
      </Box>
    </>
  );
};