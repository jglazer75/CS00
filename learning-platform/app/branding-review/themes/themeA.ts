// themes/themeA.ts
import { createTheme, alpha } from '@mui/material/styles';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';

const oxfordBlue = '#002147';
const agedGold = '#C5A059';

export const themeA = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: oxfordBlue,
      contrastText: '#ffffff',
    },
    secondary: {
      main: agedGold,
      contrastText: oxfordBlue,
    },
    background: {
      default: '#fcfcfc',
      paper: '#ffffff',
    },
    text: {
      primary: alpha(oxfordBlue, 0.9),
      secondary: alpha(oxfordBlue, 0.7),
    },
    divider: alpha(oxfordBlue, 0.1),
    action: {
      hover: alpha(agedGold, 0.08),
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
    h2: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
    h3: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
    h4: { fontFamily: '"Playfair Display", serif', fontWeight: 700, color: agedGold },
    h5: { fontFamily: '"Playfair Display", serif', fontWeight: 400 },
    h6: { fontFamily: '"Inter", sans-serif', fontWeight: 700 },
    subtitle1: { fontFamily: '"Inter", sans-serif', fontWeight: 500, letterSpacing: 1 },
    body1: { lineHeight: 1.7, fontSize: '1rem' },
    button: { textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 },
  },
  shape: {
    borderRadius: 2, 
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { padding: '10px 24px' },
        containedPrimary: {
          backgroundImage: `linear-gradient(45deg, ${oxfordBlue} 30%, ${alpha(oxfordBlue, 0.9)} 90%)`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${alpha(oxfordBlue, 0.1)}`,
          boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 2 },
        filledSecondary: { backgroundColor: agedGold, color: oxfordBlue },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 6, backgroundColor: alpha(oxfordBlue, 0.05) },
        bar: { backgroundImage: `linear-gradient(90deg, ${agedGold} 0%, ${alpha(agedGold, 0.7)} 100%)` },
      },
    },
  },
});