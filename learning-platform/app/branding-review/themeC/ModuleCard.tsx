import React from 'react';
import { Card, CardContent, Typography, Box, Stack, Chip, LinearProgress, CardActionArea, useTheme, alpha, Divider } from '@mui/material';
import SquareIcon from '@mui/icons-material/Square';
import AdjustIcon from '@mui/icons-material/Adjust';

export interface ModuleCardProps {
  title: string;
  description: string;
  tags: string[];
  progressPercent: number;
  isEnrolled: boolean;
  isPublic: boolean;
  onClick: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  title, description, tags, progressPercent, isEnrolled, isPublic, onClick
}) => {
  const theme = useTheme();
  const isComplete = progressPercent === 100;

  return (
    <Card sx={{ 
      position: 'relative',
      height: '100%',
      transition: 'all 0.2s ease-out',
      borderTop: `4px solid ${isEnrolled ? theme.palette.secondary.main : 'transparent'}`,
      borderRadius: 0,
    }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%', display: 'flex', alignItems: 'stretch' }}>
        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', width: '100%' }}>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AdjustIcon sx={{ color: isEnrolled ? theme.palette.secondary.main : theme.palette.divider, fontSize: 20 }} />
              <Typography variant="caption" sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                {isPublic ? 'Public Access' : 'Restricted'}
              </Typography>
            </Stack>
            {isComplete && (
               <SquareIcon sx={{ color: 'primary.main', fontSize: 16 }} titleAccess="Completed" />
            )}
          </Box>

          <Typography variant="h5" component="h3" mb={2} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            {title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" mb={4} sx={{
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontStyle: 'italic',
            flexGrow: 1
          }}>
            {description}
          </Typography>

          <Box sx={{ mt: 'auto' }}>
            <Divider sx={{ mb: 2, borderColor: alpha(theme.palette.primary.main, 0.1) }} />
            
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={3}>
              {tags.map(tag => (
                <Chip key={tag} label={tag} variant="outlined" size="small" sx={{ color: theme.palette.primary.main, borderRadius: 0 }} />
              ))}
            </Stack>

            <Box>
                <Typography variant="caption" component="div" sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, color: theme.palette.primary.main, mb: 0.5, textAlign: 'right' }}>
                  PHASE: {progressPercent}%
                </Typography>
                <LinearProgress variant="determinate" value={progressPercent} color="secondary" />
            </Box>
          </Box>

        </CardContent>
      </CardActionArea>
    </Card>
  );
};