'use client';
import { createTheme, alpha } from '@mui/material/styles';
import { Montserrat, Lora } from 'next/font/google';

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const lora = Lora({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
});

const draftingTeal = '#006064';
const harvestGold = '#FBC02D';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: draftingTeal,
      contrastText: '#ffffff',
    },
    secondary: {
      main: harvestGold,
      contrastText: '#000000',
    },
    warning: {
      main: harvestGold,
      contrastText: '#000000',
    },
    background: {
      default: '#FAF8F5',
      paper: '#ffffff',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#424242',
    },
    divider: alpha(draftingTeal, 0.15),
  },
  typography: {
    fontFamily: lora.style.fontFamily,
    h1: { fontFamily: montserrat.style.fontFamily, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em' },
    h2: { fontFamily: montserrat.style.fontFamily, fontWeight: 700 },
    h3: { fontFamily: montserrat.style.fontFamily, fontWeight: 600, textTransform: 'uppercase' as const },
    h4: { fontFamily: montserrat.style.fontFamily, fontWeight: 600 },
    h5: { fontFamily: montserrat.style.fontFamily, fontWeight: 600 },
    h6: { fontFamily: lora.style.fontFamily, fontWeight: 700 },
    subtitle1: { fontFamily: montserrat.style.fontFamily, fontWeight: 500 },
    body1: { lineHeight: 1.8, fontSize: '1.05rem' },
    button: { fontFamily: montserrat.style.fontFamily, textTransform: 'uppercase' as const, fontWeight: 700, letterSpacing: '0.15em' },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { padding: '12px 28px', border: '2px solid transparent' },
        containedPrimary: {
          '&:hover': { backgroundColor: 'transparent', color: draftingTeal, borderColor: draftingTeal },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${alpha(draftingTeal, 0.15)}`,
          boxShadow: 'none',
          '&:hover': { borderColor: draftingTeal, boxShadow: `4px 4px 0px ${alpha(draftingTeal, 0.1)}` },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 0, fontFamily: montserrat.style.fontFamily, fontWeight: 600, textTransform: 'uppercase' as const, fontSize: '0.7rem' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 4, backgroundColor: alpha(draftingTeal, 0.1) },
        bar: { backgroundColor: harvestGold },
      },
    },
  },
});

export default theme;
