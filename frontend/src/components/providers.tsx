'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export type Theme = 'light' | 'dark' | 'system';
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };
const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', setTheme: () => {} });

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem('theme');
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function subscribeTheme(callback: () => void) {
  window.addEventListener('crm-theme-change', callback);
  return () => window.removeEventListener('crm-theme-change', callback);
}

export function useTheme() { return useContext(ThemeContext); }

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, (): Theme => 'system');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (value: Theme) => {
      const dark = value === 'dark' || (value === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    };
    applyTheme(theme);
    const onSystemChange = () => { if (theme === 'system') applyTheme('system'); };
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, [theme]);

  function changeTheme(nextTheme: Theme) {
    window.localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new Event('crm-theme-change'));
  }

  return <ThemeContext.Provider value={{ theme, setTheme: changeTheme }}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></ThemeContext.Provider>;
}
