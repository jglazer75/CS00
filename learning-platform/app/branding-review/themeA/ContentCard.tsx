import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha } from '@mui/material';

export interface ContentCardProps {
  title: string;
  children: React.ReactNode;
  sectionIndex: number;
}

export const ContentCard: React.FC<ContentCardProps> = ({ title, children, sectionIndex }) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ 
      borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`, 
      position: 'relative', 
      scrollMarginTop: '80px',
      mb: 6
    }} id={`section-${sectionIndex}`}>
      <CardContent sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="subtitle2" color="secondary.main" sx={{
          display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 2
        }}>
          Section {sectionIndex.toString().padStart(2, '0')}
        </Typography>
        
        <Typography variant="h2" component="h2" gutterBottom sx={{ 
          fontSize: { xs: '2rem', md: '2.5rem' }, color: 'primary.main', mb: 4
        }}>
          {title}
        </Typography>

        <Box sx={{
          color: 'text.primary',
          maxWidth: '75ch',
          '& p': { mb: 3 },
          '& ul, & ol': { mb: 3, pl: 3 },
          '& li': { mb: 1 },
          '& strong': { color: 'primary.main', fontWeight: 700 }
        }}>
          {children}
        </Box>
      </CardContent>
    </Card>
  );
};