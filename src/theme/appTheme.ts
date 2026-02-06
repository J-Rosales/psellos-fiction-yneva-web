import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2454c5',
    },
    secondary: {
      main: '#2d7a53',
    },
    background: {
      default: '#f5f7fb',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Inter", system-ui, -apple-system, sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: -0.4,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e5eaf2',
          boxShadow: 'none',
        },
      },
    },
  },
});
