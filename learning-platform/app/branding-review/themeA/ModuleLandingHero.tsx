import React from 'react';
import { Box, Container, Typography, Grid, Stack, Button, alpha, useTheme, Card, CardContent } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import TargetIcon from '@mui/icons-material/Adjust';

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

  return (
    <Box sx={{ 
      width: '100%', 
      bgcolor: theme.palette.primary.main,
      color: 'white',
      py: { xs: 8, md: 12 },
      borderBottom: `8px solid ${theme.palette.secondary.main}`
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.secondary.main, textTransform: 'uppercase', letterSpacing: 2 }}>
              Legal Case Study CS00
            </Typography>
            <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '3rem', md: '4rem' }, color: 'white', fontWeight: 700 }}>
              {moduleTitle}
            </Typography>
            {author && (
              <Typography variant="subtitle1" mb={3} sx={{ color: alpha('#fff', 0.8) }}>
                Authored by: <span style={{ color: theme.palette.secondary.main, fontWeight: 700 }}>{author}</span>
              </Typography>
            )}
            <Typography variant="body1" mb={6} sx={{ fontSize: '1.2rem', color: alpha('#fff', 0.9), maxWidth: '65ch' }}>
              {description}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              {isEnrolled ? (
                <Button variant="contained" color="secondary" size="large" onClick={onStart} startIcon={<PlayArrowIcon />} sx={{ px: 5, py: 1.5 }}>
                  Begin Study
                </Button>
              ) : (
                <Button variant="outlined" color="secondary" size="large" onClick={onEnroll} startIcon={<AppRegistrationIcon />} sx={{ px: 5, py: 1.5, borderColor: alpha(theme.palette.secondary.main, 0.5) }}>
                  Enroll in Module
                </Button>
              )}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ bgcolor: alpha('#fff', 0.03), border: '1px solid', borderColor: alpha('#fff', 0.1), color: 'white', borderRadius: theme.shape.borderRadius }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: theme.palette.secondary.main }}>
                  <TargetIcon sx={{ mr: 1 }} /> Top Learning Objectives
                </Typography>
                <Stack spacing={2} pt={2}>
                  {learningObjectives.slice(0, 3).map((obj, index) => (
                    <Box key={index} display="flex">
                      <Typography variant="h6" sx={{ color: theme.palette.secondary.main, mr: 2, mt: -0.5 }}>{`0${index + 1}`}</Typography>
                      <Typography variant="body2" color="inherit">{obj}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};