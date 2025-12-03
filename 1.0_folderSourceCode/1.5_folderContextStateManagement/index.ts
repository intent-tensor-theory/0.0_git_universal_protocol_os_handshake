// ============================================
// PROTOCOL OS - CONTEXT STATE MANAGEMENT INDEX
// ============================================
// Address: 1.5
// Purpose: Export all Zustand stores
// ============================================

// Platform Store
export { usePlatformStore, default as PlatformStore } from './1.5.1_folderPlatformContext/1.5.1.a_filePlatformStore';

// Resource Store
export { useResourceStore, default as ResourceStore } from './1.5.2_folderResourceContext/1.5.2.a_fileResourceStore';

// Handshake Store
export { useHandshakeStore, default as HandshakeStore } from './1.5.3_folderHandshakeContext/1.5.3.a_fileHandshakeStore';

// Execution Store
export { useExecutionStore, default as ExecutionStore } from './1.5.4_folderExecutionContext/1.5.4.a_fileExecutionStore';

// Saved Handshakes Store
export { useSavedHandshakesStore, default as SavedHandshakesStore } from './1.5.5_folderSavedHandshakesContext/1.5.5.a_fileSavedHandshakesStore';

// UI Store
export { useUiStore, default as UiStore } from './1.5.6_folderUiContext/1.5.6.a_fileUiStore';
export type { ThemeMode, PanelLayout, Toast, ModalState } from './1.5.6_folderUiContext/1.5.6.a_fileUiStore';

/**
 * Initialize all stores
 * Call this once at app startup
 */
export async function initializeStores(): Promise<void> {
  const { usePlatformStore } = await import('./1.5.1_folderPlatformContext/1.5.1.a_filePlatformStore');
  const { useSavedHandshakesStore } = await import('./1.5.5_folderSavedHandshakesContext/1.5.5.a_fileSavedHandshakesStore');
  const { useUiStore } = await import('./1.5.6_folderUiContext/1.5.6.a_fileUiStore');

  // Load data
  await Promise.all([
    usePlatformStore.getState().loadPlatforms(),
    useSavedHandshakesStore.getState().loadSavedHandshakes(),
  ]);

  // Register keyboard shortcuts
  useUiStore.getState().registerShortcuts();

  // Apply theme
  useUiStore.getState().setThemeMode(useUiStore.getState().themeMode);
}

/**
 * Reset all stores to initial state
 */
export function resetAllStores(): void {
  // Each store would need a reset method for this to work fully
  // For now, clear local storage
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('protocol-os-')) {
        localStorage.removeItem(key);
      }
    });
    window.location.reload();
  }
}

/**
 * Export all data from stores
 */
export async function exportAllData(): Promise<string> {
  const { usePlatformStore } = await import('./1.5.1_folderPlatformContext/1.5.1.a_filePlatformStore');
  const { useSavedHandshakesStore } = await import('./1.5.5_folderSavedHandshakesContext/1.5.5.a_fileSavedHandshakesStore');

  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    platforms: usePlatformStore.getState().platforms,
    savedHandshakes: useSavedHandshakesStore.getState().savedHandshakes,
  };

  return JSON.stringify(data, null, 2);
}
