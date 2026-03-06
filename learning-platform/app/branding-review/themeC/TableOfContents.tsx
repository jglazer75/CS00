import React from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, alpha, useTheme, Drawer, Button, Stack, IconButton } from '@mui/material';
import GridOnIcon from '@mui/icons-material/GridOn';
import CloseIcon from '@mui/icons-material/Close';

export interface TableOfContentsProps {
  sections: { id: string; title: string }[];
  activeId: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ sections, activeId }) => {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleScroll = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const tocList = (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', width: { md: 280 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h6" component="div" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.9rem', fontFamily: '"Montserrat", sans-serif' }}>
          Document Index
        </Typography>
        <Box sx={{ display: { md: 'none' } }}>
            <IconButton onClick={handleDrawerToggle} size="small"><CloseIcon /></IconButton>
        </Box>
      </Stack>
      
      <List dense disablePadding sx={{ flexGrow: 1 }}>
        {sections.map((section, index) => (
          <ListItem key={section.id} disablePadding sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
            <ListItemButton 
              onClick={() => handleScroll(section.id)}
              selected={activeId === section.id}
              sx={{
                py: 2, px: 1,
                borderRadius: 0,
                '&.Mui-selected': {
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                  '& .MuiListItemText-primary': { fontWeight: 700, color: 'text.primary' },
                  '& .toc-line': { width: '100%', bgcolor: theme.palette.secondary.main }
                },
                '&:hover .toc-line': { width: '60%' }
              }}
            >
               <Typography variant="caption" sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, color: theme.palette.secondary.main, mr: 2, width: 20 }}>
                { (index + 1).toString().padStart(2, '0') }
              </Typography>
              <Box sx={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                <ListItemText 
                    primary={section.title} 
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', noWrap: true, sx: { fontFamily: '"Montserrat", sans-serif', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' } }}
                />
                <Box className="toc-line" sx={{ position: 'absolute', bottom: -4, left: 0, width: 0, height: 2, bgcolor: alpha(theme.palette.divider, 0.5), transition: 'all 0.3s ease' }} />
              </Box>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {/* Desktop Version */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 100, alignSelf: 'start', borderRight: `1px solid ${theme.palette.divider}`, height: 'calc(100vh - 120px)' }}>
        {tocList}
      </Box>

      {/* Mobile Version */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <Button 
          variant="contained"
          color="primary"
          onClick={handleDrawerToggle}
          startIcon={<GridOnIcon />}
          sx={{ position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 1200, height: 50, boxShadow: 'none', borderRadius: 0 }}
        >
          Index
        </Button>
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          sx={{ '& .MuiDrawer-paper': { width: 300, borderRadius: 0 } }}
        >
          {tocList}
        </Drawer>
      </Box>
    </>
  );
};