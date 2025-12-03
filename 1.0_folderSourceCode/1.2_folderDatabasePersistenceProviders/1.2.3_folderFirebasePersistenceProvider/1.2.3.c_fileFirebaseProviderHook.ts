// ============================================
// PROTOCOL OS - FIREBASE PROVIDER HOOK
// ============================================
// Address: 1.2.3.c
// Purpose: React hook for Firebase persistence with realtime listeners
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { SavedHandshakeSnapshot } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { FirebaseProvider } from './1.2.3.a_fileFirebaseProviderImplementation';

/**
 * Unsubscribe function type
 */
type Unsubscribe = () => void;

/**
 * Hook state for Firebase operations
 */
interface UseFirebaseState {
  isInitialized: boolean;
  isLoading: boolean;
  isOnline: boolean;
  error: string | null;
  platforms: Platform[];
  savedHandshakes: SavedHandshakeSnapshot[];
}

/**
 * Hook return type
 */
interface UseFirebaseReturn extends UseFirebaseState {
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
  
  // Realtime
  enableRealtimeSync: () => void;
  disableRealtimeSync: () => void;
  
  // Error handling
  clearError: () => void;
}

/**
 * React hook for Firebase database operations
 * 
 * Provides a reactive interface to the FirebaseProvider with
 * automatic state management, error handling, and realtime listeners.
 * 
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     isInitialized,
 *     isOnline,
 *     platforms,
 *     initialize,
 *     enableRealtimeSync,
 *   } = useFirebase();
 * 
 *   useEffect(() => {
 *     initialize().then(() => {
 *       enableRealtimeSync();
 *     });
 *   }, [initialize, enableRealtimeSync]);
 * 
 *   return <PlatformList platforms={platforms} />;
 * }
 * ```
 */
export function useFirebase(): UseFirebaseReturn {
  const [provider] = useState(() => new FirebaseProvider());
  const unsubscribersRef = useRef<Unsubscribe[]>([]);
  
  const [state, setState] = useState<UseFirebaseState>({
    isInitialized: false,
    isLoading: false,
    isOnline: navigator.onLine,
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
  // ONLINE/OFFLINE DETECTION
  // ============================================

  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ============================================
  // INITIALIZATION
  // ============================================

  const initialize = useCallback(async () => {
    setLoading(true);
    
    const configStatus = await provider.checkConfiguration();
    
    if (!configStatus.isConfigured) {
      setError(`Firebase not configured: ${configStatus.errorMessage || 'Missing configuration'}`);
      return;
    }
    
    const result = await provider.initialize();
    
    if (!result.success) {
      setError(result.error ?? 'Failed to initialize Firebase');
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
  // REALTIME SYNC
  // ============================================

  const enableRealtimeSync = useCallback(async () => {
    // Note: This is a placeholder for Firebase realtime listeners
    // Full implementation requires setting up onSnapshot listeners
    console.log('[Firebase] Realtime sync would be enabled here');
    
    // In a full implementation:
    // const { collection, onSnapshot } = await import('firebase/firestore');
    // const unsubscribe = onSnapshot(collection(db, 'platforms'), (snapshot) => {
    //   const platforms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //   setState(prev => ({ ...prev, platforms }));
    // });
    // unsubscribersRef.current.push(unsubscribe);
  }, []);

  const disableRealtimeSync = useCallback(() => {
    unsubscribersRef.current.forEach(unsubscribe => unsubscribe());
    unsubscribersRef.current = [];
    console.log('[Firebase] Realtime sync disabled');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disableRealtimeSync();
    };
  }, [disableRealtimeSync]);

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
    enableRealtimeSync,
    disableRealtimeSync,
    clearError,
  };
}

export default useFirebase;
