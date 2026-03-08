import React from 'react';
import { Box, Container, Typography, Stack, Button, useTheme, alpha, Grid, Divider } from '@mui/material';
import EastIcon from '@mui/icons-material/East';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';

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
      py: { xs: 8, md: 14 },
      position: 'relative',
      backgroundImage: `linear-gradient(${alpha('#fff', 0.05)} 2px, transparent 2px), linear-gradient(90deg, ${alpha('#fff', 0.05)} 2px, transparent 2px)`,
      backgroundSize: '50px 50px',
      borderBottom: `1px solid ${alpha('#fff', 0.2)}`
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={0}>
          <Grid size={{ xs: 12, md: 8 }} sx={{ p: { xs: 3, md: 6 }, border: `1px solid ${alpha('#fff', 0.2)}` }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.secondary.main, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.2em', fontFamily: '"Montserrat", sans-serif' }}>
              Case Study Structure // CS00
            </Typography>
            <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '2.5rem', md: '3.8rem' }, color: 'white', mb: 4, letterSpacing: '-0.03em', textTransform: 'none' }}>
              {moduleTitle}
            </Typography>
            
            <Divider sx={{ borderColor: theme.palette.secondary.main, width: '100px', mb: 4, borderBottomWidth: 4 }} />

            <Typography variant="body1" mb={6} sx={{ fontSize: '1.2rem', color: alpha('#fff', 0.9), maxWidth: '60ch', fontStyle: 'italic', lineHeight: 1.8 }}>
              {description}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              {isEnrolled ? (
                <Button variant="contained" color="secondary" size="large" onClick={onStart} endIcon={<EastIcon />} sx={{ bgcolor: theme.palette.secondary.main, color: theme.palette.primary.main, borderRadius: 0 }}>
                  Initialize Study
                </Button>
              ) : (
                <Button variant="outlined" color="secondary" size="large" onClick={onEnroll} startIcon={<AppRegistrationIcon />} sx={{ borderColor: theme.palette.secondary.main, color: theme.palette.secondary.main, borderRadius: 0, borderWidth: 2, '&:hover': {borderWidth: 2} }}>
                  Register for Module
                </Button>
              )}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }} sx={{ p: { xs: 4, md: 6 }, border: `1px solid ${alpha('#fff', 0.2)}`, borderLeft: {md: 'none'}, borderTop: {xs: 'none', md: `1px solid ${alpha('#fff', 0.2)}`}, bgcolor: alpha('#000', 0.2) }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontFamily: '"Montserrat", sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 4 }}>
              System Objectives
            </Typography>
            <Stack spacing={3}>
              {learningObjectives.slice(0, 3).map((obj, index) => (
                <Box key={index} sx={{ pl: 2, borderLeft: `2px solid ${alpha('#fff', 0.3)}` }}>
                    <Typography variant="caption" sx={{ color: theme.palette.secondary.main, fontWeight: 700, fontFamily: '"Montserrat", sans-serif' }}>
                        OBJ_{index + 1}
                    </Typography>
                    <Typography variant="body2" sx={{ color: alpha('#fff', 0.8), mt: 0.5, lineHeight: 1.6 }}>{obj}</Typography>
                </Box>
              ))}
            </Stack>
             {author && (
              <Box sx={{ mt: 6, pt: 3, borderTop: `1px solid ${alpha('#fff', 0.1)}` }}>
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.5), display: 'block' }}>Architected by:</Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, fontFamily: '"Lora", serif' }}>{author}</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};