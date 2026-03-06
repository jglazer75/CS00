// themes/themeC.ts
import { createTheme, alpha } from '@mui/material/styles';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/lora/400.css';
import '@fontsource/lora/500.css';

const draftingTeal = '#006064';
const harvestGold = '#FBC02D';

export const themeC = createTheme({
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
    background: {
      default: '#FAF8F5',
      paper: '#ffffff',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#424242',
    },
    divider: alpha('#006064', 0.15),
  },
  typography: {
    fontFamily: '"Lora", "Serif"',
    h1: { fontFamily: '"Montserrat", sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' },
    h2: { fontFamily: '"Montserrat", sans-serif', fontWeight: 700, color: draftingTeal },
    h3: { fontFamily: '"Montserrat", sans-serif', fontWeight: 600, textTransform: 'uppercase' },
    h4: { fontFamily: '"Montserrat", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Montserrat", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Lora", serif', fontWeight: 700 },
    subtitle1: { fontFamily: '"Montserrat", sans-serif', fontWeight: 500, color: draftingTeal },
    body1: { lineHeight: 1.8, fontSize: '1.05rem' },
    button: { fontFamily: '"Montserrat", sans-serif', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.15em' },
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
          border: `1px solid ${alpha('#006064', 0.15)}`,
          boxShadow: 'none',
          '&:hover': { borderColor: draftingTeal, boxShadow: `4px 4px 0px ${alpha(draftingTeal, 0.1)}` },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 0, fontFamily: '"Montserrat", sans-serif', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 4, backgroundColor: alpha('#006064', 0.1) },
        bar: { backgroundColor: harvestGold },
      },
    },
  },
});