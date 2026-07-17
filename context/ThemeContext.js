/**
 * ThemeContext — provides dark/light mode state and color tokens app-wide.
 */

import React, { createContext, useContext, useState } from 'react';

const dark = {
  background: '#0D0D0D',
  headerBackground: '#111111',
  drawerBackground: '#111111',
  surfaceVariant: '#1A1A2E',
  card: '#1A1A2E',
  border: '#2A2A4A',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  iconColor: '#FFFFFF',
  accent: '#F5A623',
  danger: '#FF4444',
  expired: '#FF4444',
};

const light = {
  background: '#F2F2F7',
  headerBackground: '#FFFFFF',
  drawerBackground: '#FFFFFF',
  surfaceVariant: '#EBEBF0',
  card: '#FFFFFF',
  border: '#DCDCDC',
  text: '#1C1C1E',
  textSecondary: '#6C6C70',
  iconColor: '#1C1C1E',
  accent: '#F5A623',
  danger: '#FF3B30',
  expired: '#FF3B30',
};

const ThemeContext = createContext({
  isDark: true,
  colors: dark,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  function toggleTheme() {
    setIsDark((prev) => !prev);
  }

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? dark : light, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
