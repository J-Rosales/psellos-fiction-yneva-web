import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouterProvider } from './router';
import { appTheme } from './theme/appTheme';
import './style.css';

const queryClient = new QueryClient();

const container = document.querySelector<HTMLDivElement>('#app');

if (!container) {
  throw new Error('App root not found');
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <AppRouterProvider />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
