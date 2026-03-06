import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha, Avatar } from '@mui/material';
import TagIcon from '@mui/icons-material/Tag';

export interface ContentCardProps {
  title: string;
  children: React.ReactNode;
  sectionIndex: number;
}

export const ContentCard: React.FC<ContentCardProps> = ({ title, children, sectionIndex }) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ 
      mb: 4, 
      overflow: 'visible',
      scrollMarginTop: '100px',
      border: '1px solid',
      borderColor: theme.palette.divider,
      boxShadow: 'none',
      '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }
    }} id={`section-${sectionIndex}`}>
      <CardContent sx={{ p: { xs: 3, md: 6 }, position: 'relative' }}>
        
        <Avatar sx={{ 
            bgcolor: theme.palette.secondary.main, 
            width: 40, height: 40, 
            position: 'absolute', 
            top: -20, left: { xs: 16, md: 32 },
            boxShadow: `0 4px 6px ${alpha(theme.palette.secondary.main, 0.3)}`,
            typography: 'subtitle2',
            fontWeight: 700,
            color: theme.palette.secondary.contrastText
        }}>
            {sectionIndex}
        </Avatar>

        <Box display="flex" alignItems="center" mb={3} mt={1}>
            <TagIcon sx={{ color: alpha(theme.palette.primary.main, 0.3), mr: 1 }} />
            <Typography variant="h4" component="h2" sx={{ color: 'text.primary' }}>
                {title}
            </Typography>
        </Box>

        <Box sx={{
          color: 'text.primary',
          maxWidth: '72ch',
          fontSize: '1.05rem',
          '& p': { mb: 2.5 },
          '& ul, & ol': { mb: 2.5, pl: 2.5, color: 'text.secondary' },
          '& li': { mb: 1 },
          '& strong': { color: 'text.primary', fontWeight: 600 },
          '& blockquote': { 
            borderLeft: `4px solid ${theme.palette.primary.main}`, 
            ml: 0, pl: 3, color: 'text.secondary', fontStyle: 'italic' 
          }
        }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
};