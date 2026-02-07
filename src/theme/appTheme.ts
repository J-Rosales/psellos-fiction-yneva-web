import { createTheme } from '@mui/material/styles';

export type AccentId = 'pink' | 'aqua' | 'gold' | 'indigo';

export interface AccentPreset {
  id: AccentId;
  label: string;
  primary: string;
  secondary: string;
}

export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { id: 'pink', label: 'Dark pink', primary: '#b23a62', secondary: '#7a2542' },
  { id: 'aqua', label: 'Aquamarine', primary: '#0f8b8d', secondary: '#176b87' },
  { id: 'gold', label: 'Golden', primary: '#b8860b', secondary: '#8c5e00' },
  { id: 'indigo', label: 'Indigo', primary: '#2454c5', secondary: '#2d7a53' },
];

function resolveAccent(accentId: AccentId): AccentPreset {
  return ACCENT_PRESETS.find((entry) => entry.id === accentId) ?? ACCENT_PRESETS[3];
}

export function createAppTheme(mode: 'light' | 'dark', accentId: AccentId) {
  const accent = resolveAccent(accentId);
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: { main: accent.primary },
      secondary: { main: accent.secondary },
      background: {
        default: isDark ? '#0f1218' : '#f5f7fb',
        paper: isDark ? '#151a22' : '#ffffff',
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      h1: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 800, letterSpacing: -0.7 },
      h2: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 800, letterSpacing: -0.6 },
      h3: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700, letterSpacing: -0.5 },
      h4: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700, letterSpacing: -0.4 },
      h5: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 700, letterSpacing: -0.3 },
      h6: { fontFamily: '"Manrope", "Inter", sans-serif', fontWeight: 600, letterSpacing: -0.2 },
      body1: { lineHeight: 1.55 },
      body2: { lineHeight: 1.5 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          code: {
            fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
            fontSize: '0.9em',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: isDark ? '1px solid #273244' : '1px solid #e5eaf2',
            boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.22)' : '0 4px 14px rgba(15,23,42,0.08)',
            borderRadius: 10,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 10,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });
}
