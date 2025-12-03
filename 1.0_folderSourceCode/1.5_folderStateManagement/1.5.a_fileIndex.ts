// ============================================
// PROTOCOL OS - STATE MANAGEMENT INDEX
// ============================================
// Address: 1.5.a
// Purpose: Central export for all state management
// ============================================

// ----------------------------------------
// Platform Context
// ----------------------------------------
export {
  PlatformProvider,
  usePlatformContext,
  usePlatforms,
  useSelectedPlatform,
  usePlatformById,
  default as PlatformContext,
} from './1.5.1_folderPlatformContext/1.5.1.a_filePlatformContextProvider';

export {
  usePlatformOperations,
  usePlatformSelection,
  usePlatformLoading,
  usePlatformStats,
  useResourceSearch,
  useHandshakeSearch,
  usePlatformFilter,
  usePlatformResources,
} from './1.5.1_folderPlatformContext/1.5.1.b_filePlatformContextHooks';

// ----------------------------------------
// Execution Context
// ----------------------------------------
export {
  ExecutionProvider,
  useExecutionContext,
  useCurrentExecution,
  useExecutionHistory,
  useIsExecuting,
  default as ExecutionContext,
  type ExecutionStatus,
} from './1.5.2_folderExecutionContext/1.5.2.a_fileExecutionContextProvider';

export {
  useExecutionOperations,
  useExecutionLogs,
  useExecutionProgress,
  useExecutionStats,
  useExecutionHistoryFilter,
  useExecutionTiming,
  useExecutionResult,
} from './1.5.2_folderExecutionContext/1.5.2.b_fileExecutionContextHooks';

// ----------------------------------------
// Theme Context
// ----------------------------------------
export {
  ThemeProvider,
  useThemeContext,
  useTheme,
  useThemeMode,
  useAccentColor,
  default as ThemeContext,
  type ThemeMode,
  type AccentColor,
  type GlassIntensity,
  type AnimationLevel,
} from './1.5.3_folderThemeContext/1.5.3.a_fileThemeContextProvider';

export {
  useThemeSetters,
  useGlassEffect,
  useAnimations,
  useFontSize,
  useAccentColorOptions,
  useCompactMode,
  useHighContrast,
  useThemeCssVariables,
} from './1.5.3_folderThemeContext/1.5.3.b_fileThemeContextHooks';

// ----------------------------------------
// Combined Provider Component
// ----------------------------------------
import React, { type ReactNode } from 'react';
import { PlatformProvider } from './1.5.1_folderPlatformContext/1.5.1.a_filePlatformContextProvider';
import { ExecutionProvider } from './1.5.2_folderExecutionContext/1.5.2.a_fileExecutionContextProvider';
import { ThemeProvider } from './1.5.3_folderThemeContext/1.5.3.a_fileThemeContextProvider';

interface AppProvidersProps {
  children: ReactNode;
  autoLoadPlatforms?: boolean;
  maxExecutionHistory?: number;
}

/**
 * Combined provider that wraps the app with all context providers
 */
export function AppProviders({
  children,
  autoLoadPlatforms = true,
  maxExecutionHistory = 50,
}: AppProvidersProps) {
  return (
    <ThemeProvider>
      <PlatformProvider autoLoad={autoLoadPlatforms}>
        <ExecutionProvider maxHistorySize={maxExecutionHistory}>
          {children}
        </ExecutionProvider>
      </PlatformProvider>
    </ThemeProvider>
  );
}
