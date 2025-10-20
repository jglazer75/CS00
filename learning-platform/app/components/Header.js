'use client';
import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Link from 'next/link';
import { useInstructorMode } from '../context/InstructorModeContext';

export default function Header() {
  const { isInstructorMode, setIsInstructorMode } = useInstructorMode();

  const handleToggle = (event) => {
    setIsInstructorMode(event.target.checked);
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            Wisconsin Rural Entrepreneurship Legal Hub
          </Link>
        </Typography>
        <FormControlLabel
          control={
            <Switch
              color="secondary"
              checked={isInstructorMode}
              onChange={handleToggle}
              inputProps={{ 'aria-label': 'Toggle instructor mode' }}
            />
          }
          label="Instructor Mode"
          sx={{ color: 'inherit' }}
        />
      </Toolbar>
    </AppBar>
  );
}
