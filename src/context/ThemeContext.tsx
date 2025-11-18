import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  effectiveMode: 'light' | 'dark';
  primary: string; // CSS color value, e.g. #2563eb
  setMode: (m: ThemeMode) => void;
  setPrimary: (c: string) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  mode: 'theme:mode',
  primary: 'theme:primary',
};

function getSystemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.mode) as ThemeMode | null;
    return saved || 'system';
  });
  const [primary, setPrimaryState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.primary) || '#2563eb'; // blue-600
  });

  const effectiveMode: 'light' | 'dark' = useMemo(() => {
    if (mode === 'system') return getSystemPrefersDark() ? 'dark' : 'light';
    return mode;
  }, [mode]);

  // Apply to document
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (effectiveMode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [effectiveMode]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', primary);
  }, [primary]);

  // Listen to system changes when mode==='system'
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (mode === 'system') {
        const root = document.documentElement;
        if (media.matches) root.classList.add('dark');
        else root.classList.remove('dark');
      }
    };
    media.addEventListener?.('change', handler);
    return () => media.removeEventListener?.('change', handler);
  }, [mode]);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEYS.mode, m);
  };
  const setPrimary = (c: string) => {
    setPrimaryState(c);
    localStorage.setItem(STORAGE_KEYS.primary, c);
  };

  const value: ThemeContextValue = { mode, effectiveMode, primary, setMode, setPrimary };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
