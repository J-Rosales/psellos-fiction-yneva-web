import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { type AccentId } from './appTheme';

const STORAGE_KEY = 'psellos-theme-preferences-v1';

interface ThemePreferences {
  mode: 'light' | 'dark';
  accentId: AccentId;
  setMode: (mode: 'light' | 'dark') => void;
  setAccentId: (accentId: AccentId) => void;
}

const ThemePreferencesContext = createContext<ThemePreferences | null>(null);

function readInitial(): { mode: 'light' | 'dark'; accentId: AccentId } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { mode: 'light', accentId: 'indigo' };
    }
    const parsed = JSON.parse(raw) as { mode?: unknown; accentId?: unknown };
    const mode = parsed.mode === 'dark' ? 'dark' : 'light';
    const accentId = ['pink', 'aqua', 'gold', 'indigo'].includes(String(parsed.accentId))
      ? (parsed.accentId as AccentId)
      : 'indigo';
    return { mode, accentId };
  } catch {
    return { mode: 'light', accentId: 'indigo' };
  }
}

export function ThemePreferencesProvider(props: { children: ReactNode }) {
  const initial = useMemo(readInitial, []);
  const [mode, setMode] = useState<'light' | 'dark'>(initial.mode);
  const [accentId, setAccentId] = useState<AccentId>(initial.accentId);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, accentId }));
  }, [mode, accentId]);

  const value = useMemo(
    () => ({
      mode,
      accentId,
      setMode,
      setAccentId,
    }),
    [mode, accentId],
  );

  return <ThemePreferencesContext.Provider value={value}>{props.children}</ThemePreferencesContext.Provider>;
}

export function useThemePreferences(): ThemePreferences {
  const value = useContext(ThemePreferencesContext);
  if (!value) {
    throw new Error('useThemePreferences must be used within ThemePreferencesProvider');
  }
  return value;
}
