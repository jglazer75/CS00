'use client';
import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export default function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
            Wisconsin Rural Entrepreneurship Legal Hub
          </Link>
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
