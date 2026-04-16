import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'crm_theme';
const DEFAULT_THEME = 'dark';
const THEMES = {
  light: () => import('primereact/resources/themes/lara-light-blue/theme.css'),
  dark: () => import('primereact/resources/themes/lara-dark-blue/theme.css'),
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    THEMES[theme]?.();
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const setThemeAndSync = useCallback(async (newTheme) => {
    if (!newTheme || newTheme === theme) return;

    setTheme(newTheme);
    try {
      await api.put('/auth/preferences', { theme: newTheme });
    } catch {}
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: setThemeAndSync }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
