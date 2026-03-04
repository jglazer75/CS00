'use client';

import React from 'react';
import {
  Alert,
  Box,
  Container,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import { useAuth } from '@/app/context/AuthContext';
import { isAdminEmail } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_LINKS = [
  { text: 'Modules', href: '/admin/modules', icon: <DashboardIcon /> },
  { text: 'Users', href: '/admin/users', icon: <PeopleIcon /> },
  { text: 'Invite', href: '/admin/invite', icon: <PersonAddIcon /> },
  { text: 'System AI', href: '/settings/ai', icon: <SettingsSuggestIcon /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isAdmin = user?.email ? isAdminEmail(user.email, 'public') : false;

  if (loading) {
    return null;
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="warning">
          You do not have permission to access the administration dashboard.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: 240,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
            Platform Admin
          </Typography>
        </Box>
        <Divider />
        <List>
          {ADMIN_LINKS.map((link) => (
            <ListItem key={link.text} disablePadding>
              <ListItemButton
                component={Link}
                href={link.href}
                selected={pathname === link.href}
              >
                <ListItemIcon sx={{ color: pathname === link.href ? 'primary.main' : 'inherit' }}>
                  {link.icon}
                </ListItemIcon>
                <ListItemText primary={link.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        {children}
      </Box>
    </Box>
  );
}
