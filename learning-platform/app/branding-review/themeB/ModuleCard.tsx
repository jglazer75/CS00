import React from 'react';
import { Card, CardContent, Typography, Box, Stack, Chip, LinearProgress, CardActionArea, useTheme, alpha } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import HubIcon from '@mui/icons-material/Hub';

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
      height: '100%',
      display: 'flex',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: `0 20px 25px -5px ${alpha(theme.palette.primary.main, 0.1)}, 0 10px 10px -5px ${alpha(theme.palette.primary.main, 0.04)}`
      }
    }}>
      <CardActionArea onClick={onClick} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}>
        
        <Box sx={{ 
          height: 80, 
          width: '100%', 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          px: 3
        }}>
           <HubIcon sx={{ color: 'white', opacity: 0.5, fontSize: 40 }} />
           {isEnrolled && (
            <Chip 
              label="Active" 
              size="small" 
              color="success"
              icon={<BoltIcon />}
              sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 700, borderRadius: '20px' }} 
            />
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Typography variant="h6" component="h3" mb={1.5} color="text.primary">
            {title}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" mb={3} sx={{
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flexGrow: 1
          }}>
            {description}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={4}>
            {tags.map(tag => (
              <Chip key={tag} label={tag} variant="filled" color="primary" size="small" />
            ))}
             {!isPublic && (
                <Chip label="Private" size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'divider' }} />
              )}
          </Stack>

          <Box mt="auto">
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    Project Progress
                </Typography>
                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700 }}>
                    {progressPercent}%
                </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={progressPercent} color="primary" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};