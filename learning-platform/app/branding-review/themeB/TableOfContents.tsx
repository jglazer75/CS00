import React from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, alpha, useTheme, Drawer, Fab, Stack, Avatar } from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';

export interface TableOfContentsProps {
  sections: { id: string; title: string }[];
  activeId: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ sections, activeId }) => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const neutralGrey = '#F3F4F6';

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleScroll = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const tocList = (
    <Box sx={{ p: 2, width: { md: 260 } }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={3} pl={1}>
        <BubbleChartIcon color="primary" />
        <Typography variant="h6" component="div" sx={{ color: 'text.primary' }}>
          Explore Lesson
        </Typography>
      </Stack>
      <List dense disablePadding>
        {sections.map((section, index) => (
          <ListItem key={section.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton 
              onClick={() => handleScroll(section.id)}
              selected={activeId === section.id}
              sx={{
                borderRadius: 2,
                py: 1,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                  '& .MuiListItemText-primary': { fontWeight: 600, color: theme.palette.primary.main },
                  '& .toc-index': { bgcolor: theme.palette.primary.main, color: 'white' }
                }
              }}
            >
              <Avatar className="toc-index" sx={{ 
                width: 24, height: 24, mr: 1.5, 
                fontSize: '0.75rem', fontWeight: 700,
                bgcolor: neutralGrey, color: 'text.secondary',
                transition: 'all 0.2s'
              }}>
                {index + 1}
              </Avatar>
              <ListItemText 
                primary={section.title} 
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true }}
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
      <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 100, alignSelf: 'start' }}>
        {tocList}
      </Box>

      {/* Mobile Version */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Fab 
          color="primary" 
          variant="extended"
          onClick={handleDrawerToggle}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200, textTransform: 'none', px: 3 }}
        >
          <MenuOpenIcon sx={{ mr: 1 }} /> Contents
        </Fab>
        <Drawer
          anchor="bottom"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          sx={{ '& .MuiDrawer-paper': { height: 'auto', maxHeight: '80vh', borderTopLeftRadius: 20, borderTopRightRadius: 20, pb: 4 } }}
        >
          {tocList}
        </Drawer>
      </Box>
    </>
  );
};