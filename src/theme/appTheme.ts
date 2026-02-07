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
      borderRadius: 10,
    },
    typography: {
      fontFamily: '"IBM Plex Sans", "Inter", system-ui, -apple-system, sans-serif',
      h4: { fontWeight: 700, letterSpacing: -0.4 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            border: isDark ? '1px solid #273244' : '1px solid #e5eaf2',
            boxShadow: 'none',
          },
        },
      },
    },
  });
}
