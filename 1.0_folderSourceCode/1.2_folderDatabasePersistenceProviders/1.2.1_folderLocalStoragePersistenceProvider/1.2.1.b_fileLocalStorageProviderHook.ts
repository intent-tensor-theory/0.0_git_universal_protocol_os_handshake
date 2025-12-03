// ============================================
// PROTOCOL OS - LOCALSTORAGE PROVIDER HOOK
// ============================================
// Address: 1.2.1.b
// Purpose: React hook for localStorage persistence operations
// ============================================

import { useState, useCallback, useEffect } from 'react';
import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { SavedHandshakeSnapshot } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { LocalStorageProvider } from './1.2.1.a_fileLocalStorageProviderImplementation';

/**
 * Hook state for localStorage operations
 */
interface UseLocalStorageState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  platforms: Platform[];
  savedHandshakes: SavedHandshakeSnapshot[];
}

/**
 * Hook return type
 */
interface UseLocalStorageReturn extends UseLocalStorageState {
  // Initialization
  initialize: () => Promise<void>;
  
  // Platform operations
  refreshPlatforms: () => Promise<void>;
  createPlatform: (platform: Platform) => Promise<boolean>;
  updatePlatform: (id: string, updates: Partial<Platform>) => Promise<boolean>;
  deletePlatform: (id: string) => Promise<boolean>;
  getPlatformById: (id: string) => Platform | undefined;
  
  // Saved handshakes operations
  refreshSavedHandshakes: () => Promise<void>;
  saveHandshakeSnapshot: (snapshot: SavedHandshakeSnapshot) => Promise<boolean>;
  deleteSavedHandshake: (id: string) => Promise<boolean>;
  getSavedHandshakesByBaseName: (baseName: string) => SavedHandshakeSnapshot[];
  
  // Bulk operations
  exportData: () => Promise<string | null>;
  importData: (jsonData: string) => Promise<boolean>;
  clearAllData: () => Promise<boolean>;
  
  // Error handling
  clearError: () => void;
}

/**
 * React hook for localStorage database operations
 * 
 * Provides a reactive interface to the LocalStorageProvider with
 * automatic state management and error handling.
 * 
 * @example
 * ```tsx
 * function PlatformList() {
 *   const {
 *     isInitialized,
 *     isLoading,
 *     platforms,
 *     initialize,
 *     createPlatform,
 *   } = useLocalStorage();
 * 
 *   useEffect(() => {
 *     initialize();
 *   }, [initialize]);
 * 
 *   if (!isInitialized) return <Loading />;
 * 
 *   return (
 *     <ul>
 *       {platforms.map(p => <li key={p.id}>{p.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useLocalStorage(): UseLocalStorageReturn {
  const [provider] = useState(() => new LocalStorageProvider());
  
  const [state, setState] = useState<UseLocalStorageState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    platforms: [],
    savedHandshakes: [],
  });

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // ============================================
  // INITIALIZATION
  // ============================================

  const initialize = useCallback(async () => {
    setLoading(true);
    
    const result = await provider.initialize();
    
    if (!result.success) {
      setError(result.error ?? 'Failed to initialize');
      return;
    }
    
    // Load initial data
    const [platformsResult, handshakesResult] = await Promise.all([
      provider.getAllPlatforms(),
      provider.getAllSavedHandshakes(),
    ]);
    
    setState(prev => ({
      ...prev,
      isInitialized: true,
      isLoading: false,
      platforms: platformsResult.data ?? [],
      savedHandshakes: handshakesResult.data ?? [],
    }));
  }, [provider, setLoading, setError]);

  // ============================================
  // PLATFORM OPERATIONS
  // ============================================

  const refreshPlatforms = useCallback(async () => {
    const result = await provider.getAllPlatforms();
    
    if (result.success && result.data) {
      setState(prev => ({ ...prev, platforms: result.data! }));
    }
  }, [provider]);

  const createPlatform = useCallback(async (platform: Platform): Promise<boolean> => {
    setLoading(true);
    
    const result = await provider.createPlatform(platform);
    
    if (result.success) {
      await refreshPlatforms();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to create platform');
    return false;
  }, [provider, setLoading, setError, refreshPlatforms]);

  const updatePlatform = useCallback(async (
    id: string,
    updates: Partial<Platform>
  ): Promise<boolean> => {
    setLoading(true);
    
    const result = await provider.updatePlatform(id, updates);
    
    if (result.success) {
      await refreshPlatforms();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to update platform');
    return false;
  }, [provider, setLoading, setError, refreshPlatforms]);

  const deletePlatform = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    
    const result = await provider.deletePlatform(id);
    
    if (result.success) {
      await refreshPlatforms();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to delete platform');
    return false;
  }, [provider, setLoading, setError, refreshPlatforms]);

  const getPlatformById = useCallback((id: string): Platform | undefined => {
    return state.platforms.find(p => p.id === id);
  }, [state.platforms]);

  // ============================================
  // SAVED HANDSHAKES OPERATIONS
  // ============================================

  const refreshSavedHandshakes = useCallback(async () => {
    const result = await provider.getAllSavedHandshakes();
    
    if (result.success && result.data) {
      setState(prev => ({ ...prev, savedHandshakes: result.data! }));
    }
  }, [provider]);

  const saveHandshakeSnapshot = useCallback(async (
    snapshot: SavedHandshakeSnapshot
  ): Promise<boolean> => {
    setLoading(true);
    
    const result = await provider.saveHandshakeSnapshot(snapshot);
    
    if (result.success) {
      await refreshSavedHandshakes();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to save handshake snapshot');
    return false;
  }, [provider, setLoading, setError, refreshSavedHandshakes]);

  const deleteSavedHandshake = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    
    const result = await provider.deleteSavedHandshake(id);
    
    if (result.success) {
      await refreshSavedHandshakes();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to delete saved handshake');
    return false;
  }, [provider, setLoading, setError, refreshSavedHandshakes]);

  const getSavedHandshakesByBaseName = useCallback((baseName: string): SavedHandshakeSnapshot[] => {
    return state.savedHandshakes.filter(s => s.baseName === baseName);
  }, [state.savedHandshakes]);

  // ============================================
  // BULK OPERATIONS
  // ============================================

  const exportData = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    
    const result = await provider.exportAllData();
    
    setState(prev => ({ ...prev, isLoading: false }));
    
    if (result.success && result.data) {
      return result.data;
    }
    
    setError(result.error ?? 'Failed to export data');
    return null;
  }, [provider, setLoading, setError]);

  const importData = useCallback(async (jsonData: string): Promise<boolean> => {
    setLoading(true);
    
    const result = await provider.importAllData(jsonData);
    
    if (result.success) {
      await Promise.all([refreshPlatforms(), refreshSavedHandshakes()]);
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to import data');
    return false;
  }, [provider, setLoading, setError, refreshPlatforms, refreshSavedHandshakes]);

  const clearAllData = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    
    const result = await provider.clearAllData();
    
    if (result.success) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        platforms: [],
        savedHandshakes: [],
      }));
      return true;
    }
    
    setError(result.error ?? 'Failed to clear data');
    return false;
  }, [provider, setLoading, setError]);

  // ============================================
  // STORAGE EVENT LISTENER (cross-tab sync)
  // ============================================

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('protocol-os-')) {
        // Refresh data when storage changes in another tab
        refreshPlatforms();
        refreshSavedHandshakes();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshPlatforms, refreshSavedHandshakes]);

  return {
    ...state,
    initialize,
    refreshPlatforms,
    createPlatform,
    updatePlatform,
    deletePlatform,
    getPlatformById,
    refreshSavedHandshakes,
    saveHandshakeSnapshot,
    deleteSavedHandshake,
    getSavedHandshakesByBaseName,
    exportData,
    importData,
    clearAllData,
    clearError,
  };
}

export default useLocalStorage;
