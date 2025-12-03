// ============================================
// PROTOCOL OS - THEME CONTEXT HOOKS
// ============================================
// Address: 1.5.3.b
// Purpose: Custom hooks for theme operations
// ============================================

import { useMemo, useCallback } from 'react';
import { useThemeContext, type AccentColor, type GlassIntensity, type AnimationLevel } from './1.5.3.a_fileThemeContextProvider';

/**
 * Hook for all theme setters
 */
export function useThemeSetters() {
  const {
    setMode,
    setAccentColor,
    setGlassIntensity,
    setAnimationLevel,
    setFontSize,
    setCompactMode,
    setHighContrast,
    resetToDefaults,
  } = useThemeContext();

  return {
    setMode,
    setAccentColor,
    setGlassIntensity,
    setAnimationLevel,
    setFontSize,
    setCompactMode,
    setHighContrast,
    resetToDefaults,
  };
}

/**
 * Hook for glass effects
 */
export function useGlassEffect() {
  const { settings, setGlassIntensity } = useThemeContext();

  const glassStyles = useMemo(() => {
    const intensityMap: Record<GlassIntensity, { blur: string; opacity: number }> = {
      none: { blur: '0px', opacity: 1 },
      subtle: { blur: '4px', opacity: 0.9 },
      medium: { blur: '8px', opacity: 0.85 },
      strong: { blur: '16px', opacity: 0.75 },
    };
    return intensityMap[settings.glassIntensity];
  }, [settings.glassIntensity]);

  return {
    intensity: settings.glassIntensity,
    setIntensity: setGlassIntensity,
    styles: glassStyles,
    isEnabled: settings.glassIntensity !== 'none',
  };
}

/**
 * Hook for animations
 */
export function useAnimations() {
  const { settings, setAnimationLevel } = useThemeContext();

  const shouldAnimate = useMemo(() => {
    return settings.animationLevel !== 'none';
  }, [settings.animationLevel]);

  const animationDuration = useMemo(() => {
    const durationMap: Record<AnimationLevel, number> = {
      none: 0,
      reduced: 0.1,
      full: 0.3,
    };
    return durationMap[settings.animationLevel];
  }, [settings.animationLevel]);

  return {
    level: settings.animationLevel,
    setLevel: setAnimationLevel,
    shouldAnimate,
    duration: animationDuration,
    prefersReducedMotion: settings.animationLevel === 'reduced',
  };
}

/**
 * Hook for font size
 */
export function useFontSize() {
  const { settings, setFontSize } = useThemeContext();

  const increase = useCallback(() => {
    setFontSize(settings.fontSize + 1);
  }, [settings.fontSize, setFontSize]);

  const decrease = useCallback(() => {
    setFontSize(settings.fontSize - 1);
  }, [settings.fontSize, setFontSize]);

  const reset = useCallback(() => {
    setFontSize(14);
  }, [setFontSize]);

  return {
    size: settings.fontSize,
    setSize: setFontSize,
    increase,
    decrease,
    reset,
    isMin: settings.fontSize <= 12,
    isMax: settings.fontSize >= 20,
  };
}

/**
 * Hook for accent color options
 */
export function useAccentColorOptions() {
  const { settings, setAccentColor } = useThemeContext();

  const colors: Array<{ value: AccentColor; label: string; hex: string }> = [
    { value: 'teal', label: 'Teal', hex: '#14b8a6' },
    { value: 'blue', label: 'Blue', hex: '#3b82f6' },
    { value: 'purple', label: 'Purple', hex: '#8b5cf6' },
    { value: 'green', label: 'Green', hex: '#22c55e' },
    { value: 'orange', label: 'Orange', hex: '#f97316' },
    { value: 'red', label: 'Red', hex: '#ef4444' },
  ];

  const currentColor = colors.find((c) => c.value === settings.accentColor);

  return {
    current: settings.accentColor,
    currentHex: currentColor?.hex ?? '#14b8a6',
    options: colors,
    setColor: setAccentColor,
  };
}

/**
 * Hook for compact mode
 */
export function useCompactMode() {
  const { settings, setCompactMode } = useThemeContext();

  const toggle = useCallback(() => {
    setCompactMode(!settings.compactMode);
  }, [settings.compactMode, setCompactMode]);

  return {
    isCompact: settings.compactMode,
    setCompact: setCompactMode,
    toggle,
    spacing: settings.compactMode ? 'compact' : 'normal',
  };
}

/**
 * Hook for high contrast mode
 */
export function useHighContrast() {
  const { settings, setHighContrast } = useThemeContext();

  const toggle = useCallback(() => {
    setHighContrast(!settings.highContrast);
  }, [settings.highContrast, setHighContrast]);

  return {
    isHighContrast: settings.highContrast,
    setHighContrast,
    toggle,
  };
}

/**
 * Hook for generating CSS variables from current theme
 */
export function useThemeCssVariables() {
  const { settings, isDark } = useThemeContext();

  return useMemo(() => {
    const accentColors: Record<AccentColor, { primary: string; secondary: string }> = {
      teal: { primary: '#14b8a6', secondary: '#0d9488' },
      blue: { primary: '#3b82f6', secondary: '#2563eb' },
      purple: { primary: '#8b5cf6', secondary: '#7c3aed' },
      green: { primary: '#22c55e', secondary: '#16a34a' },
      orange: { primary: '#f97316', secondary: '#ea580c' },
      red: { primary: '#ef4444', secondary: '#dc2626' },
    };

    const accent = accentColors[settings.accentColor];

    return {
      '--color-accent-primary': accent.primary,
      '--color-accent-secondary': accent.secondary,
      '--color-background': isDark ? '#0a0a0a' : '#ffffff',
      '--color-surface': isDark ? '#1a1a1a' : '#f5f5f5',
      '--color-text-primary': isDark ? '#ffffff' : '#0a0a0a',
      '--color-text-secondary': isDark ? '#a1a1aa' : '#71717a',
      '--font-size-base': `${settings.fontSize}px`,
      '--animation-duration': settings.animationLevel === 'none' ? '0s' : 
        settings.animationLevel === 'reduced' ? '0.1s' : '0.3s',
    };
  }, [settings, isDark]);
}
