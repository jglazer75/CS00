import React from 'react';
import { Card, CardContent, Typography, Box, Stack, Chip, LinearProgress, CardActionArea, useTheme, alpha } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';

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

  return (
    <Card sx={{ 
      position: 'relative', 
      transition: 'all 0.3s ease-in-out',
      height: '100%',
      '&:hover': {
        transform: 'translateY(-4px)',
        borderColor: theme.palette.secondary.main,
        boxShadow: `0 8px 12px ${alpha(theme.palette.secondary.main, 0.1)}`
      }
    }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              {isEnrolled && (
                <Chip label="Enrolled" color="primary" size="small" sx={{ fontWeight: 700, borderRadius: 1 }} />
              )}
              {isPublic ? 
                <PublicIcon fontSize="small" sx={{ color: 'text.secondary' }} /> : 
                <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              }
            </Stack>
            <Typography variant="caption" sx={{ color: theme.palette.secondary.main, fontWeight: 700 }}>
              EST. 2024
            </Typography>
          </Box>

          <Typography variant="h5" component="h3" mb={1} sx={{ color: 'primary.main', fontWeight: 700 }}>
            {title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" mb={3} sx={{
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {description}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={3}>
            {tags.map(tag => (
              <Chip key={tag} label={tag} variant="outlined" size="small" sx={{ 
                color: 'text.primary', borderColor: alpha(theme.palette.primary.main, 0.3), 
              }} />
            ))}
          </Stack>

          <Box mt="auto">
            <Typography variant="subtitle2" color="text.primary" mb={1} display="flex" justifyContent="space-between">
              Completion <span>{progressPercent}%</span>
            </Typography>
            <LinearProgress variant="determinate" value={progressPercent} color="secondary" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};