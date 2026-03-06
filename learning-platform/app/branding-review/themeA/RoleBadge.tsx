import React from 'react';
import { Chip, alpha, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SchoolIcon from '@mui/icons-material/School';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import GavelIcon from '@mui/icons-material/Gavel';

export interface RoleBadgeProps {
  role: 'student' | 'instructor' | 'module-owner' | 'admin';
}

const roleConfigs = {
  student: { label: 'Student', icon: SchoolIcon, color: '#C5A059' }, 
  instructor: { label: 'Instructor', icon: AccountCircleIcon, color: '#002147' },
  'module-owner': { label: 'Module Owner', icon: HistoryEduIcon, color: '#555' },
  admin: { label: 'Admin', icon: GavelIcon, color: '#d32f2f' },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const theme = useTheme();
  const config = roleConfigs[role];
  const Icon = config.icon;

  return (
    <Chip 
      icon={<Icon sx={{ '&&': { color: config.color } }} />}
      label={config.label}
      size="small"
      sx={{ 
        fontWeight: 700,
        color: config.color,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        borderRadius: 1,
        height: 20,
        fontSize: '0.6rem',
        bgcolor: alpha(config.color, 0.1),
        border: `1px solid ${alpha(config.color, 0.2)}`,
        '& .MuiChip-label': { pl: 0.5, pr: 1 }
      }}
    />
  );
};