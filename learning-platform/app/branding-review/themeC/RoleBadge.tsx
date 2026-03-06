import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import SquareIcon from '@mui/icons-material/Square';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import GavelIcon from '@mui/icons-material/Gavel';

export interface RoleBadgeProps {
  role: 'student' | 'instructor' | 'module-owner' | 'admin';
}

const roleConfigs = {
  student: { label: 'Learner', icon: SquareIcon },
  instructor: { label: 'Instructor', icon: ArchitectureIcon },
  'module-owner': { label: 'Author', icon: ArchitectureIcon },
  admin: { label: 'Admin', icon: GavelIcon },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const theme = useTheme();
  const config = roleConfigs[role];
  const Icon = config.icon;
  
  const mainColor = role === 'admin' ? theme.palette.text.primary : theme.palette.primary.main;

  return (
    <Box 
      sx={{ 
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${mainColor}`,
        p: '2px 8px',
        bgcolor: 'background.paper',
        borderRadius: 0
      }}
    >
      <Icon sx={{ color: mainColor, fontSize: 12, mr: 1 }} />
      <Typography variant="caption" sx={{ 
        fontFamily: '"Montserrat", sans-serif', 
        fontWeight: 700, 
        textTransform: 'uppercase', 
        fontSize: '0.65rem',
        letterSpacing: '0.1em',
        color: mainColor
      }}>
        {config.label}
      </Typography>
    </Box>
  );
};