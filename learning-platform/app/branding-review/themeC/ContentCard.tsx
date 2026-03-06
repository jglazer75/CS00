import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha, Stack, Divider } from '@mui/material';

export interface ContentCardProps {
  title: string;
  children: React.ReactNode;
  sectionIndex: number;
}

export const ContentCard: React.FC<ContentCardProps> = ({ title, children, sectionIndex }) => {
  const theme = useTheme();

  return (
    <Box 
      id={`section-${sectionIndex}`}
      sx={{ 
        mb: 8, 
        scrollMarginTop: '100px',
        position: 'relative',
        '&::before': {
            content: '""',
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            zIndex: 0
        }
    }}>
      <Card elevation={0} sx={{ 
        bgcolor: 'transparent', 
        border: 'none', 
        borderRadius: 0,
        borderLeft: `1px solid ${theme.palette.divider}`,
        position: 'relative', zIndex: 1
      }}>
        <CardContent sx={{ p: { xs: 3, md: 0 }, pl: { md: 6 } }}>
          
          <Stack direction="row" spacing={3} alignItems="center" mb={4}>
            <Typography variant="h3" sx={{ 
                color: theme.palette.secondary.main, 
                bgcolor: theme.palette.primary.main, 
                p: 2, minWidth: 60, textAlign: 'center',
                fontFamily: '"Montserrat", sans-serif',
                boxShadow: `4px 4px 0 ${alpha(theme.palette.text.primary, 0.9)}`
            }}>
                {sectionIndex.toString().padStart(2, '0')}
            </Typography>
            <Box flex={1}>
                <Typography variant="h2" component="h2">
                    {title}
                </Typography>
                <Divider sx={{ borderColor: theme.palette.secondary.main, mt: 1, width: '40%', borderBottomWidth: 2 }} />
            </Box>
          </Stack>

          <Box sx={{
            color: 'text.primary',
            maxWidth: '70ch',
            '& p': { mb: 3 },
            '& ul, & ol': { mb: 3, pl: 4 },
            '& li': { mb: 1.5 },
            '& strong': { fontWeight: 700, color: theme.palette.primary.main },
            '& hr': { border: 'none', borderTop: `1px dashed ${theme.palette.divider}`, my: 4 }
          }}>
            {children}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};