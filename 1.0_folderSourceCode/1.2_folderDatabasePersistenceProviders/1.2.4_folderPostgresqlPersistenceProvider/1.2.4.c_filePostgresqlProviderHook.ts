// ============================================
// PROTOCOL OS - POSTGRESQL PROVIDER HOOK
// ============================================
// Address: 1.2.4.c
// Purpose: React hook for PostgreSQL persistence operations
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { PostgreSQLProvider } from './1.2.4.a_filePostgresqlProviderImplementation';
import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { SavedHandshakeSnapshot } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import type { DatabaseOperationResult } from '../1.2.a_fileDatabaseProviderInterface';

/**
 * Hook state interface
 */
interface UsePostgreSQLState {
  isInitialized: boolean;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  platforms: Platform[];
  savedHandshakes: SavedHandshakeSnapshot[];
}

/**
 * Hook return interface
 */
interface UsePostgreSQLReturn extends UsePostgreSQLState {
  // Platform operations
  refreshPlatforms: () => Promise<void>;
  createPlatform: (platform: Platform) => Promise<DatabaseOperationResult<Platform>>;
  updatePlatform: (id: string, updates: Partial<Platform>) => Promise<DatabaseOperationResult<Platform>>;
  deletePlatform: (id: string) => Promise<DatabaseOperationResult>;
  getPlatformById: (id: string) => Platform | undefined;
  
  // Saved handshake operations
  refreshSavedHandshakes: () => Promise<void>;
  saveHandshakeSnapshot: (snapshot: SavedHandshakeSnapshot) => Promise<DatabaseOperationResult<SavedHandshakeSnapshot>>;
  deleteSavedHandshake: (id: string) => Promise<DatabaseOperationResult>;
  getSavedHandshakesByBaseName: (baseName: string) => SavedHandshakeSnapshot[];
  
  // Bulk operations
  exportAllData: () => Promise<DatabaseOperationResult<string>>;
  importAllData: (jsonData: string) => Promise<DatabaseOperationResult>;
  clearAllData: () => Promise<DatabaseOperationResult>;
  
  // Connection management
  reconnect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Provider access
  provider: PostgreSQLProvider;
}

// Singleton provider instance
let providerInstance: PostgreSQLProvider | null = null;

function getProvider(): PostgreSQLProvider {
  if (!providerInstance) {
    providerInstance = new PostgreSQLProvider();
  }
  return providerInstance;
}

/**
 * React hook for PostgreSQL persistence
 * 
 * Provides reactive state management for platforms and saved handshakes
 * stored in a PostgreSQL database via backend proxy.
 * 
 * Note: PostgreSQL requires a backend service to proxy requests from
 * the browser to the database. This hook expects the backend URL
 * to be configured in VITE_POSTGRESQL_PROXY_URL.
 * 
 * @example
 * ```tsx
 * function PlatformManager() {
 *   const {
 *     platforms,
 *     isConnected,
 *     isLoading,
 *     error,
 *     createPlatform,
 *     reconnect,
 *   } = usePostgreSQL();
 * 
 *   if (!isConnected) {
 *     return (
 *       <div>
 *         <p>Not connected to database</p>
 *         <button onClick={reconnect}>Reconnect</button>
 *       </div>
 *     );
 *   }
 * 
 *   return (
 *     <ul>
 *       {platforms.map(p => <li key={p.id}>{p.name}</li>)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function usePostgreSQL(): UsePostgreSQLReturn {
  const provider = getProvider();
  
  const [state, setState] = useState<UsePostgreSQLState>({
    isInitialized: false,
    isLoading: true,
    isConnected: false,
    error: null,
    platforms: [],
    savedHandshakes: [],
  });

  // Initialize provider and load data
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Check configuration first
        const configStatus = await provider.checkConfiguration();
        
        if (!configStatus.isConfigured) {
          if (mounted) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: configStatus.errorMessage || 'PostgreSQL not configured',
            }));
          }
          return;
        }

        await provider.initialize();
        
        const [platformsResult, handshakesResult] = await Promise.all([
          provider.getAllPlatforms(),
          provider.getAllSavedHandshakes(),
        ]);

        if (mounted) {
          setState({
            isInitialized: true,
            isLoading: false,
            isConnected: true,
            error: null,
            platforms: platformsResult.data ?? [],
            savedHandshakes: handshakesResult.data ?? [],
          });
        }
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isConnected: false,
            error: error instanceof Error ? error.message : 'Connection failed',
          }));
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================
  // PLATFORM OPERATIONS
  // ============================================

  const refreshPlatforms = useCallback(async () => {
    const result = await provider.getAllPlatforms();
    if (result.success && result.data) {
      setState(prev => ({ ...prev, platforms: result.data! }));
    } else if (result.error) {
      setState(prev => ({ ...prev, error: result.error! }));
    }
  }, []);

  const createPlatform = useCallback(async (platform: Platform) => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await provider.createPlatform(platform);
    
    if (result.success) {
      await refreshPlatforms();
    }
    
    setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    return result;
  }, [refreshPlatforms]);

  const updatePlatform = useCallback(async (id: string, updates: Partial<Platform>) => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await provider.updatePlatform(id, updates);
    
    if (result.success) {
      await refreshPlatforms();
    }
    
    setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    return result;
  }, [refreshPlatforms]);

  const deletePlatform = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await provider.deletePlatform(id);
    
    if (result.success) {
      await refreshPlatforms();
    }
    
    setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    return result;
  }, [refreshPlatforms]);

  const getPlatformById = useCallback((id: string) => {
    return state.platforms.find(p => p.id === id);
  }, [state.platforms]);

  // ============================================
  // SAVED HANDSHAKE OPERATIONS
  // ============================================

  const refreshSavedHandshakes = useCallback(async () => {
    const result = await provider.getAllSavedHandshakes();
    if (result.success && result.data) {
      setState(prev => ({ ...prev, savedHandshakes: result.data! }));
    }
  }, []);

  const saveHandshakeSnapshot = useCallback(async (snapshot: SavedHandshakeSnapshot) => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await provider.saveHandshakeSnapshot(snapshot);
    
    if (result.success) {
      await refreshSavedHandshakes();
    }
    
    setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    return result;
  }, [refreshSavedHandshakes]);

  const deleteSavedHandshake = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await provider.deleteSavedHandshake(id);
    
    if (result.success) {
      await refreshSavedHandshakes();
    }
    
    setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    return result;
  }, [refreshSavedHandshakes]);

  const getSavedHandshakesByBaseName = useCallback((baseName: string) => {
    return state.savedHandshakes.filter(s => s.baseName === baseName);
  }, [state.savedHandshakes]);

  // ============================================
  // BULK OPERATIONS
  // ============================================

  const exportAllData = useCallback(async () => {
    return provider.exportAllData();
  }, []);

  const importAllData = useCallback(async (jsonData: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await provider.importAllData(jsonData);
    
    if (result.success) {
      await Promise.all([refreshPlatforms(), refreshSavedHandshakes()]);
    }
    
    setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    return result;
  }, [refreshPlatforms, refreshSavedHandshakes]);

  const clearAllData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    const result = await provider.clearAllData();
    
    if (result.success) {
      setState(prev => ({
        ...prev,
        platforms: [],
        savedHandshakes: [],
        isLoading: false,
        error: null,
      }));
    } else {
      setState(prev => ({ ...prev, isLoading: false, error: result.error ?? null }));
    }
    
    return result;
  }, []);

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  const reconnect = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await provider.disconnect();
      await provider.initialize();
      
      const [platformsResult, handshakesResult] = await Promise.all([
        provider.getAllPlatforms(),
        provider.getAllSavedHandshakes(),
      ]);

      setState({
        isInitialized: true,
        isLoading: false,
        isConnected: true,
        error: null,
        platforms: platformsResult.data ?? [],
        savedHandshakes: handshakesResult.data ?? [],
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Reconnection failed',
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    await provider.disconnect();
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  return {
    ...state,
    refreshPlatforms,
    createPlatform,
    updatePlatform,
    deletePlatform,
    getPlatformById,
    refreshSavedHandshakes,
    saveHandshakeSnapshot,
    deleteSavedHandshake,
    getSavedHandshakesByBaseName,
    exportAllData,
    importAllData,
    clearAllData,
    reconnect,
    disconnect,
    provider,
  };
}

export default usePostgreSQL;
