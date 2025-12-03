// ============================================
// PROTOCOL OS - THEME CONTEXT
// ============================================
// Address: 1.5.3.a
// Purpose: React context for theme/appearance management
// ============================================

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// ----------------------------------------
// Theme Types
// ----------------------------------------

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'teal' | 'blue' | 'purple' | 'green' | 'orange' | 'red';
export type GlassIntensity = 'none' | 'subtle' | 'medium' | 'strong';
export type AnimationLevel = 'none' | 'reduced' | 'full';

interface ThemeSettings {
  mode: ThemeMode;
  resolvedMode: 'dark' | 'light';
  accentColor: AccentColor;
  glassIntensity: GlassIntensity;
  animationLevel: AnimationLevel;
  fontSize: number; // 12-20
  compactMode: boolean;
  highContrast: boolean;
}

// ----------------------------------------
// Storage Key
// ----------------------------------------

const THEME_STORAGE_KEY = 'protocol-os-theme';

// ----------------------------------------
// Default Settings
// ----------------------------------------

const defaultSettings: ThemeSettings = {
  mode: 'dark',
  resolvedMode: 'dark',
  accentColor: 'teal',
  glassIntensity: 'medium',
  animationLevel: 'full',
  fontSize: 14,
  compactMode: false,
  highContrast: false,
};

// ----------------------------------------
// Context Types
// ----------------------------------------

interface ThemeContextValue {
  settings: ThemeSettings;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setGlassIntensity: (intensity: GlassIntensity) => void;
  setAnimationLevel: (level: AnimationLevel) => void;
  setFontSize: (size: number) => void;
  setCompactMode: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  resetToDefaults: () => void;
  isDark: boolean;
}

// ----------------------------------------
// Context
// ----------------------------------------

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ----------------------------------------
// Provider
// ----------------------------------------

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({ children, defaultMode = 'dark' }: ThemeProviderProps) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return { ...defaultSettings, ...parsed };
        } catch {
          // Invalid stored data
        }
      }
    }
    return { ...defaultSettings, mode: defaultMode };
  });

  // Resolve system theme preference
  const resolveMode = useCallback((mode: ThemeMode): 'dark' | 'light' => {
    if (mode === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return mode;
  }, []);

  // Watch for system theme changes
  useEffect(() => {
    if (settings.mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSettings((prev) => ({
        ...prev,
        resolvedMode: e.matches ? 'dark' : 'light',
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.mode]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Mode
    root.setAttribute('data-theme', settings.resolvedMode);
    root.classList.toggle('dark', settings.resolvedMode === 'dark');
    root.classList.toggle('light', settings.resolvedMode === 'light');
    
    // Accent color
    root.setAttribute('data-accent', settings.accentColor);
    
    // Glass intensity
    root.setAttribute('data-glass', settings.glassIntensity);
    
    // Animation level
    root.setAttribute('data-animation', settings.animationLevel);
    
    // Font size
    root.style.setProperty('--base-font-size', `${settings.fontSize}px`);
    
    // Compact mode
    root.classList.toggle('compact', settings.compactMode);
    
    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);
  }, [settings]);

  // Setters
  const setMode = useCallback((mode: ThemeMode) => {
    setSettings((prev) => ({
      ...prev,
      mode,
      resolvedMode: resolveMode(mode),
    }));
  }, [resolveMode]);

  const setAccentColor = useCallback((accentColor: AccentColor) => {
    setSettings((prev) => ({ ...prev, accentColor }));
  }, []);

  const setGlassIntensity = useCallback((glassIntensity: GlassIntensity) => {
    setSettings((prev) => ({ ...prev, glassIntensity }));
  }, []);

  const setAnimationLevel = useCallback((animationLevel: AnimationLevel) => {
    setSettings((prev) => ({ ...prev, animationLevel }));
  }, []);

  const setFontSize = useCallback((fontSize: number) => {
    setSettings((prev) => ({ ...prev, fontSize: Math.min(20, Math.max(12, fontSize)) }));
  }, []);

  const setCompactMode = useCallback((compactMode: boolean) => {
    setSettings((prev) => ({ ...prev, compactMode }));
  }, []);

  const setHighContrast = useCallback((highContrast: boolean) => {
    setSettings((prev) => ({ ...prev, highContrast }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value: ThemeContextValue = {
    settings,
    setMode,
    setAccentColor,
    setGlassIntensity,
    setAnimationLevel,
    setFontSize,
    setCompactMode,
    setHighContrast,
    resetToDefaults,
    isDark: settings.resolvedMode === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ----------------------------------------
// Hook
// ----------------------------------------

export function useThemeContext() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  
  return context;
}

// ----------------------------------------
// Selector Hooks
// ----------------------------------------

export function useTheme() {
  const { settings, isDark } = useThemeContext();
  return { ...settings, isDark };
}

export function useThemeMode() {
  const { settings, setMode } = useThemeContext();
  return { mode: settings.mode, resolvedMode: settings.resolvedMode, setMode };
}

export function useAccentColor() {
  const { settings, setAccentColor } = useThemeContext();
  return { accentColor: settings.accentColor, setAccentColor };
}

export default ThemeContext;
