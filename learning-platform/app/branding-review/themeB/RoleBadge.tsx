import React from 'react';
import { Chip } from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CreateIcon from '@mui/icons-material/Create';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

export interface RoleBadgeProps {
  role: 'student' | 'instructor' | 'module-owner' | 'admin';
}

const roleConfigs = {
  student: { label: 'Learner', icon: MenuBookIcon, color: 'primary' as const },
  instructor: { label: 'Instructor', icon: VerifiedUserIcon, color: 'success' as const },
  'module-owner': { label: 'Author', icon: CreateIcon, color: 'secondary' as const },
  admin: { label: 'Admin', icon: AdminPanelSettingsIcon, color: 'default' as const },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const config = roleConfigs[role];
  const Icon = config.icon;

  return (
    <Chip 
      icon={<Icon />}
      label={config.label}
      size="small"
      color={config.color}
      sx={{ 
        fontWeight: 600,
        borderRadius: '6px',
        fontSize: '0.7rem',
        height: 24,
        '& .MuiChip-icon': { fontSize: 16 }
      }}
    />
  );
};