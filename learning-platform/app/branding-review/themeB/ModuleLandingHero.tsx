import React from 'react';
import { Box, Container, Typography, Stack, Button, useTheme, alpha, Grid } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export interface ModuleLandingHeroProps {
  moduleTitle: string;
  description: string;
  author?: string;
  learningObjectives: string[];
  isEnrolled: boolean;
  onStart: () => void;
  onEnroll: () => void;
}

export const ModuleLandingHero: React.FC<ModuleLandingHeroProps> = ({
  moduleTitle, description, author, learningObjectives, isEnrolled, onStart, onEnroll
}) => {
  const theme = useTheme();
  const neutralGrey = '#F3F4F6';

  return (
    <Box sx={{ 
      width: '100%', 
      bgcolor: 'background.paper',
      color: 'text.primary',
      py: { xs: 8, md: 12 },
      borderBottom: `1px solid ${theme.palette.divider}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        position: 'absolute', top: -100, right: -100, 
        width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.background.paper, 0)} 70%)`
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
              <RocketLaunchIcon color="secondary" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                CS00 Learning Venture
              </Typography>
            </Stack>

            <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, color: 'text.primary', mb: 3 }}>
              {moduleTitle}
            </Typography>
            
            <Typography variant="body1" mb={5} sx={{ fontSize: '1.15rem', color: 'text.secondary', maxWidth: '70ch', lineHeight: 1.7 }}>
              {description}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              {isEnrolled ? (
                <Button variant="contained" color="primary" size="large" onClick={onStart} startIcon={<CheckCircleIcon />}>
                  Resume Case Study
                </Button>
              ) : (
                <Button variant="contained" color="secondary" size="large" onClick={onEnroll} startIcon={<AddCircleOutlineIcon />}>
                  Join Module
                </Button>
              )}
               {author && (
                <Typography variant="body2" sx={{ color: 'text.secondary', pl: { sm: 2 }, pt: {xs: 1, sm: 0} }}>
                  Created by <span style={{ color: theme.palette.text.primary, fontWeight: 600 }}>{author}</span>
                </Typography>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ 
                p: 4, 
                bgcolor: neutralGrey, 
                borderRadius: 4,
                border: `1px solid ${theme.palette.divider}`
            }}>
                <Typography variant="h6" gutterBottom color="text.primary" sx={{ fontWeight: 600, mb: 3 }}>
                  What you&apos;ll master:
                </Typography>
                <Stack spacing={2.5}>
                  {learningObjectives.slice(0, 3).map((obj, index) => (
                    <Stack key={index} direction="row" spacing={2} alignItems="start">
                        <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20, mt: '2px' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>{obj}</Typography>
                    </Stack>
                  ))}
                </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};