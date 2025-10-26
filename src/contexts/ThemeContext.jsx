import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Theme configurations
export const THEMES = {
   amber: {
    name: 'Amber',
    primary: '#D97706',
    primaryLight: '#F59E0B',
    primaryDark: '#B45309',
    accent: '#FBBF24',
    accentLight: '#FDE68A',
    accentDark: '#92400E',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
   slate: {
    name: 'Slate',
    primary: '#64748B',
    primaryLight: '#94A3B8',
    primaryDark: '#475569',
    accent: '#60A5FA',
    accentLight: '#93C5FD',
    accentDark: '#2563EB',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  mehendi: {
    name: 'Mehendi',
    primary: '#6B4423', // Mehendi brown
    primaryLight: '#8B5A3C',
    primaryDark: '#4A2F1A',
    accent: '#D4A574', // Light mehendi
    accentLight: '#E8C4A0',
    accentDark: '#B8935F',
    background: '#0F0F0F',
    surface: '#1A1A1A',
    surfaceLight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  ocean: {
    name: 'Ocean',
    primary: '#0369A1', // Sky blue
    primaryLight: '#0EA5E9',
    primaryDark: '#075985',
    accent: '#06B6D4', // Cyan
    accentLight: '#22D3EE',
    accentDark: '#0891B2',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  forest: {
    name: 'Forest',
    primary: '#15803D', // Green
    primaryLight: '#22C55E',
    primaryDark: '#0F5132',
    accent: '#84CC16', // Lime
    accentLight: '#BFDBFE',
    accentDark: '#65A30D',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  sunset: {
    name: 'Sunset',
    primary: '#DC2626', // Red
    primaryLight: '#EF4444',
    primaryDark: '#991B1B',
    accent: '#F97316', // Orange
    accentLight: '#FB923C',
    accentDark: '#EA580C',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  purple: {
    name: 'Purple',
    primary: '#7C3AED', // Violet
    primaryLight: '#A78BFA',
    primaryDark: '#5B21B6',
    accent: '#EC4899', // Pink
    accentLight: '#F472B6',
    accentDark: '#BE185D',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  indigo: {
    name: 'Indigo',
    primary: '#4F46E5',
    primaryLight: '#6366F1',
    primaryDark: '#3730A3',
    accent: '#60A5FA',
    accentLight: '#93C5FD',
    accentDark: '#2563EB',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  teal: {
    name: 'Teal',
    primary: '#0D9488',
    primaryLight: '#14B8A6',
    primaryDark: '#0F766E',
    accent: '#2DD4BF',
    accentLight: '#5EEAD4',
    accentDark: '#0D9488',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
 
  cobalt: {
    name: 'Cobalt',
    primary: '#1D4ED8',
    primaryLight: '#3B82F6',
    primaryDark: '#1E40AF',
    accent: '#06B6D4',
    accentLight: '#22D3EE',
    accentDark: '#0891B2',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceLight: '#334155',
    text: '#FFFFFF',
    textSecondary: '#CBD5E1',
    border: '#475569',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
 
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // Validate that the saved theme exists in THEMES
    if (savedTheme && THEMES[savedTheme]) {
      return savedTheme;
    }
    return 'amber';
  });

  const theme = THEMES[currentTheme] || THEMES.mehendi;

  const applyThemeToCSSVariables = (themeObj) => {
    if (!themeObj) return;
    const root = document.documentElement;
    Object.entries(themeObj).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('#')) {
        root.style.setProperty(`--color-${key}`, value);
      }
    });
  };

  useEffect(() => {
    localStorage.setItem('theme', currentTheme);
    // Apply theme to CSS variables
    applyThemeToCSSVariables(theme);
  }, [currentTheme, theme]);

  const switchTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const value = {
    currentTheme,
    theme,
    switchTheme,
    availableThemes: Object.keys(THEMES),
    themeNames: Object.entries(THEMES).map(([key, val]) => ({ key, name: val.name })),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

