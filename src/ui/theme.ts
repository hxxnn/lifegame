import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export const THEME_KEY = 'lifegame:theme';

export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}
export const nextTheme = (t: Theme): Theme => (t === 'light' ? 'dark' : 'light');

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(readStored(), matchMedia('(prefers-color-scheme: dark)').matches));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return {
    theme,
    toggle: () => {
      const next = nextTheme(theme);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* preference is optional */
      }
      setTheme(next);
    },
  };
}
