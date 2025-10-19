'use client';
import { createTheme } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    primary: {
      main: '#002D5A', // Deep Navy
    },
    secondary: {
      main: '#2A5A2A', // Forest Green
    },
    background: {
      default: '#F7F7F7', // Light Gray
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121', // Off-Black
    },
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
});

export default theme;
