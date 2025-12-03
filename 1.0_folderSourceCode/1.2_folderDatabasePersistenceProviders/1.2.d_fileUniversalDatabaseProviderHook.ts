// ============================================
// PROTOCOL OS - UNIVERSAL DATABASE PROVIDER HOOK
// ============================================
// Address: 1.2.d
// Purpose: Provider-agnostic React hook for database operations
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { SavedHandshakeSnapshot } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import type { DatabaseProvider, DatabaseProviderIdentifier } from './1.2.a_fileDatabaseProviderInterface';
import { getDatabaseProvider, getActiveProvider, DATABASE_PROVIDER_INFO } from './1.2.c_fileIndex';

/**
 * Hook state for database operations
 */
interface UseDatabaseState {
  /** Whether the provider has been initialized */
  isInitialized: boolean;
  
  /** Whether an operation is in progress */
  isLoading: boolean;
  
  /** Current error message, if any */
  error: string | null;
  
  /** Active provider identifier */
  provider: DatabaseProviderIdentifier;
  
  /** Provider display name */
  providerName: string;
  
  /** All platforms from database */
  platforms: Platform[];
  
  /** All saved handshakes from database */
  savedHandshakes: SavedHandshakeSnapshot[];
}

/**
 * Hook return type
 */
interface UseDatabaseReturn extends UseDatabaseState {
  // Initialization
  initialize: () => Promise<void>;
  reinitialize: () => Promise<void>;
  
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
 * Universal database hook that works with any configured provider
 * 
 * This hook automatically uses the provider configured in the
 * ACTIVE_DATABASE_PROVIDER toggle. Switching providers requires
 * only changing that single configuration value.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     isInitialized,
 *     provider,
 *     platforms,
 *     initialize,
 *     createPlatform,
 *   } = useDatabase();
 * 
 *   useEffect(() => {
 *     initialize();
 *   }, [initialize]);
 * 
 *   if (!isInitialized) return <Loading provider={provider} />;
 * 
 *   return (
 *     <div>
 *       <p>Using: {provider}</p>
 *       <PlatformList platforms={platforms} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDatabase(): UseDatabaseReturn {
  const providerRef = useRef<DatabaseProvider | null>(null);
  
  const [state, setState] = useState<UseDatabaseState>(() => {
    const providerType = getActiveProvider();
    return {
      isInitialized: false,
      isLoading: false,
      error: null,
      provider: providerType,
      providerName: DATABASE_PROVIDER_INFO[providerType].displayName,
      platforms: [],
      savedHandshakes: [],
    };
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
    
    try {
      // Get the provider instance
      providerRef.current = getDatabaseProvider();
      
      // Check configuration
      const configStatus = await providerRef.current.checkConfiguration();
      
      if (!configStatus.isConfigured) {
        setError(`Provider not configured: ${configStatus.errorMessage || configStatus.missingFields.join(', ')}`);
        return;
      }
      
      // Initialize provider
      const initResult = await providerRef.current.initialize();
      
      if (!initResult.success) {
        setError(initResult.error ?? 'Failed to initialize provider');
        return;
      }
      
      // Load initial data
      const [platformsResult, handshakesResult] = await Promise.all([
        providerRef.current.getAllPlatforms(),
        providerRef.current.getAllSavedHandshakes(),
      ]);
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        platforms: platformsResult.data ?? [],
        savedHandshakes: handshakesResult.data ?? [],
      }));
      
      console.log(`[Database] Initialized with ${state.provider} provider`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown initialization error');
    }
  }, [setLoading, setError, state.provider]);

  const reinitialize = useCallback(async () => {
    if (providerRef.current) {
      await providerRef.current.disconnect();
      providerRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isInitialized: false,
      platforms: [],
      savedHandshakes: [],
    }));
    
    await initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (providerRef.current) {
        providerRef.current.disconnect().catch(console.error);
      }
    };
  }, []);

  // ============================================
  // PLATFORM OPERATIONS
  // ============================================

  const refreshPlatforms = useCallback(async () => {
    if (!providerRef.current) return;
    
    const result = await providerRef.current.getAllPlatforms();
    
    if (result.success && result.data) {
      setState(prev => ({ ...prev, platforms: result.data! }));
    }
  }, []);

  const createPlatform = useCallback(async (platform: Platform): Promise<boolean> => {
    if (!providerRef.current) {
      setError('Database not initialized');
      return false;
    }
    
    setLoading(true);
    
    const result = await providerRef.current.createPlatform(platform);
    
    if (result.success) {
      await refreshPlatforms();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to create platform');
    return false;
  }, [setLoading, setError, refreshPlatforms]);

  const updatePlatform = useCallback(async (
    id: string,
    updates: Partial<Platform>
  ): Promise<boolean> => {
    if (!providerRef.current) {
      setError('Database not initialized');
      return false;
    }
    
    setLoading(true);
    
    const result = await providerRef.current.updatePlatform(id, updates);
    
    if (result.success) {
      await refreshPlatforms();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to update platform');
    return false;
  }, [setLoading, setError, refreshPlatforms]);

  const deletePlatform = useCallback(async (id: string): Promise<boolean> => {
    if (!providerRef.current) {
      setError('Database not initialized');
      return false;
    }
    
    setLoading(true);
    
    const result = await providerRef.current.deletePlatform(id);
    
    if (result.success) {
      await refreshPlatforms();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to delete platform');
    return false;
  }, [setLoading, setError, refreshPlatforms]);

  const getPlatformById = useCallback((id: string): Platform | undefined => {
    return state.platforms.find(p => p.id === id);
  }, [state.platforms]);

  // ============================================
  // SAVED HANDSHAKES OPERATIONS
  // ============================================

  const refreshSavedHandshakes = useCallback(async () => {
    if (!providerRef.current) return;
    
    const result = await providerRef.current.getAllSavedHandshakes();
    
    if (result.success && result.data) {
      setState(prev => ({ ...prev, savedHandshakes: result.data! }));
    }
  }, []);

  const saveHandshakeSnapshot = useCallback(async (
    snapshot: SavedHandshakeSnapshot
  ): Promise<boolean> => {
    if (!providerRef.current) {
      setError('Database not initialized');
      return false;
    }
    
    setLoading(true);
    
    const result = await providerRef.current.saveHandshakeSnapshot(snapshot);
    
    if (result.success) {
      await refreshSavedHandshakes();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to save handshake snapshot');
    return false;
  }, [setLoading, setError, refreshSavedHandshakes]);

  const deleteSavedHandshake = useCallback(async (id: string): Promise<boolean> => {
    if (!providerRef.current) {
      setError('Database not initialized');
      return false;
    }
    
    setLoading(true);
    
    const result = await providerRef.current.deleteSavedHandshake(id);
    
    if (result.success) {
      await refreshSavedHandshakes();
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to delete saved handshake');
    return false;
  }, [setLoading, setError, refreshSavedHandshakes]);

  const getSavedHandshakesByBaseName = useCallback((baseName: string): SavedHandshakeSnapshot[] => {
    return state.savedHandshakes.filter(s => s.baseName === baseName);
  }, [state.savedHandshakes]);

  // ============================================
  // BULK OPERATIONS
  // ============================================

  const exportData = useCallback(async (): Promise<string | null> => {
    if (!providerRef.current) {
      setError('Database not initialized');
      return null;
    }
    
    setLoading(true);
    
    const result = await providerRef.current.exportAllData();
    
    setState(prev => ({ ...prev, isLoading: false }));
    
    if (result.success && result.data) {
      return result.data;
    }
    
    setError(result.error ?? 'Failed to export data');
    return null;
  }, [setLoading, setError]);

  const importData = useCallback(async (jsonData: string): Promise<boolean> => {
    if (!providerRef.current) {
      setError('Database not initialized');
      return false;
    }
    
    setLoading(true);
    
    const result = await providerRef.current.importAllData(jsonData);
    
    if (result.success) {
      await Promise.all([refreshPlatforms(), refreshSavedHandshakes()]);
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    }
    
    setError(result.error ?? 'Failed to import data');
    return false;
  }, [setLoading, setError, refreshPlatforms, refreshSavedHandshakes]);

  const clearAllData = useCallback(async (): Promise<boolean> => {
    if (!providerRef.current) {
      setError('Database not initialized');
      return false;
    }
    
    setLoading(true);
    
    const result = await providerRef.current.clearAllData();
    
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
  }, [setLoading, setError]);

  return {
    ...state,
    initialize,
    reinitialize,
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

export default useDatabase;
