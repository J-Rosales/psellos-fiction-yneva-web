import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import { AppRouterProvider } from './router';
import { createAppTheme } from './theme/appTheme';
import { ThemePreferencesProvider, useThemePreferences } from './theme/themePreferences';
import './style.css';

const queryClient = new QueryClient();

const container = document.querySelector<HTMLDivElement>('#app');

if (!container) {
  throw new Error('App root not found');
}

function ThemedApp() {
  const { mode, accentId } = useThemePreferences();
  const theme = useMemo(() => createAppTheme(mode, accentId), [mode, accentId]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouterProvider />
    </ThemeProvider>
  );
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemePreferencesProvider>
        <ThemedApp />
      </ThemePreferencesProvider>
    </QueryClientProvider>
  </StrictMode>,
);
