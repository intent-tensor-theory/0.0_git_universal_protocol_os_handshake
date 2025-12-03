// ============================================
// PROTOCOL OS - SUPABASE PROVIDER HOOK
// ============================================
// Address: 1.2.2.c
// Purpose: React hook for Supabase persistence with realtime subscriptions
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { SavedHandshakeSnapshot } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { SupabaseProvider } from './1.2.2.a_fileSupabaseProviderImplementation';

/**
 * Realtime subscription handler type
 */
type RealtimeSubscription = {
  unsubscribe: () => void;
};

/**
 * Hook state for Supabase operations
 */
interface UseSupabaseState {
  isInitialized: boolean;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  platforms: Platform[];
  savedHandshakes: SavedHandshakeSnapshot[];
}

/**
 * Hook return type
 */
interface UseSupabaseReturn extends UseSupabaseState {
  // Initialization
  initialize: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  
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
  
  // Realtime
  subscribeToChanges: () => void;
  unsubscribeFromChanges: () => void;
  
  // Error handling
  clearError: () => void;
}

/**
 * React hook for Supabase database operations
 * 
 * Provides a reactive interface to the SupabaseProvider with
 * automatic state management, error handling, and realtime subscriptions.
 * 
 * @example
 * ```tsx
 * function PlatformDashboard() {
 *   const {
 *     isInitialized,
 *     isConnected,
 *     platforms,
 *     initialize,
 *     subscribeToChanges,
 *   } = useSupabase();
 * 
 *   useEffect(() => {
 *     initialize().then(() => {
 *       subscribeToChanges();
 *     });
 *   }, [initialize, subscribeToChanges]);
 * 
 *   if (!isInitialized) return <Loading />;
 *   if (!isConnected) return <ConnectionError />;
 * 
 *   return (
 *     <ul>
 *       {platforms.map(p => <li key={p.id}>{p.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useSupabase(): UseSupabaseReturn {
  const [provider] = useState(() => new SupabaseProvider());
  const subscriptionsRef = useRef<RealtimeSubscription[]>([]);
  
  const [state, setState] = useState<UseSupabaseState>({
    isInitialized: false,
    isLoading: false,
    isConnected: false,
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

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const status = await provider.checkConfiguration();
    setState(prev => ({ ...prev, isConnected: status.isConnected }));
    return status.isConnected;
  }, [provider]);

  const initialize = useCallback(async () => {
    setLoading(true);
    
    const configStatus = await provider.checkConfiguration();
    
    if (!configStatus.isConfigured) {
      setError(`Supabase not configured: ${configStatus.errorMessage || 'Missing configuration'}`);
      return;
    }
    
    const result = await provider.initialize();
    
    if (!result.success) {
      setError(result.error ?? 'Failed to initialize Supabase');
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
      isConnected: true,
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
  // REALTIME SUBSCRIPTIONS
  // ============================================

  const subscribeToChanges = useCallback(() => {
    // Note: This is a placeholder for Supabase realtime subscriptions
    // Full implementation requires the Supabase client with realtime enabled
    console.log('[Supabase] Realtime subscriptions would be set up here');
    
    // In a full implementation, you would:
    // 1. Subscribe to protocol_os_platforms changes
    // 2. Subscribe to protocol_os_saved_handshakes changes
    // 3. Update state when changes are detected
  }, []);

  const unsubscribeFromChanges = useCallback(() => {
    subscriptionsRef.current.forEach(sub => sub.unsubscribe());
    subscriptionsRef.current = [];
    console.log('[Supabase] Realtime subscriptions removed');
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromChanges();
    };
  }, [unsubscribeFromChanges]);

  return {
    ...state,
    initialize,
    checkConnection,
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
    subscribeToChanges,
    unsubscribeFromChanges,
    clearError,
  };
}

export default useSupabase;
