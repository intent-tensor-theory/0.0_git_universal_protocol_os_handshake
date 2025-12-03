// ============================================
// PROTOCOL OS - PLATFORM CONTEXT
// ============================================
// Address: 1.5.1.a
// Purpose: React Context for platform state management
// ============================================

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import { getDatabaseProvider } from '@database/1.2.c_fileIndex';

/**
 * Platform state shape
 */
interface PlatformState {
  platforms: Platform[];
  selectedPlatformId: string | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * Platform actions
 */
type PlatformAction =
  | { type: 'SET_PLATFORMS'; payload: Platform[] }
  | { type: 'ADD_PLATFORM'; payload: Platform }
  | { type: 'UPDATE_PLATFORM'; payload: Platform }
  | { type: 'DELETE_PLATFORM'; payload: string }
  | { type: 'SELECT_PLATFORM'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

/**
 * Initial state
 */
const initialState: PlatformState = {
  platforms: [],
  selectedPlatformId: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

/**
 * Platform reducer
 */
function platformReducer(state: PlatformState, action: PlatformAction): PlatformState {
  switch (action.type) {
    case 'SET_PLATFORMS':
      return {
        ...state,
        platforms: action.payload,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      };

    case 'ADD_PLATFORM':
      return {
        ...state,
        platforms: [...state.platforms, action.payload],
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_PLATFORM':
      return {
        ...state,
        platforms: state.platforms.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
        lastUpdated: new Date().toISOString(),
      };

    case 'DELETE_PLATFORM':
      return {
        ...state,
        platforms: state.platforms.filter(p => p.id !== action.payload),
        selectedPlatformId: state.selectedPlatformId === action.payload 
          ? null 
          : state.selectedPlatformId,
        lastUpdated: new Date().toISOString(),
      };

    case 'SELECT_PLATFORM':
      return {
        ...state,
        selectedPlatformId: action.payload,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

/**
 * Context value type
 */
interface PlatformContextValue {
  state: PlatformState;
  // Actions
  loadPlatforms: () => Promise<void>;
  createPlatform: (platform: Omit<Platform, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Platform | null>;
  updatePlatform: (platform: Platform) => Promise<boolean>;
  deletePlatform: (id: string) => Promise<boolean>;
  selectPlatform: (id: string | null) => void;
  clearError: () => void;
  // Selectors
  getSelectedPlatform: () => Platform | null;
  getPlatformById: (id: string) => Platform | undefined;
}

/**
 * Create context
 */
const PlatformContext = createContext<PlatformContextValue | null>(null);

/**
 * Platform Provider component
 */
export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(platformReducer, initialState);

  /**
   * Load all platforms from database
   */
  const loadPlatforms = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const db = getDatabaseProvider();
      const result = await db.getAllPlatforms();
      
      if (result.success && result.data) {
        dispatch({ type: 'SET_PLATFORMS', payload: result.data });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to load platforms' });
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Unknown error loading platforms' 
      });
    }
  }, []);

  /**
   * Create a new platform
   */
  const createPlatform = useCallback(async (
    platformData: Omit<Platform, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Platform | null> => {
    try {
      const db = getDatabaseProvider();
      const result = await db.createPlatform(platformData);
      
      if (result.success && result.data) {
        dispatch({ type: 'ADD_PLATFORM', payload: result.data });
        return result.data;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to create platform' });
        return null;
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Unknown error creating platform' 
      });
      return null;
    }
  }, []);

  /**
   * Update an existing platform
   */
  const updatePlatform = useCallback(async (platform: Platform): Promise<boolean> => {
    try {
      const db = getDatabaseProvider();
      const result = await db.updatePlatform(platform);
      
      if (result.success && result.data) {
        dispatch({ type: 'UPDATE_PLATFORM', payload: result.data });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to update platform' });
        return false;
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Unknown error updating platform' 
      });
      return false;
    }
  }, []);

  /**
   * Delete a platform
   */
  const deletePlatform = useCallback(async (id: string): Promise<boolean> => {
    try {
      const db = getDatabaseProvider();
      const result = await db.deletePlatform(id);
      
      if (result.success) {
        dispatch({ type: 'DELETE_PLATFORM', payload: id });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to delete platform' });
        return false;
      }
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Unknown error deleting platform' 
      });
      return false;
    }
  }, []);

  /**
   * Select a platform
   */
  const selectPlatform = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_PLATFORM', payload: id });
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /**
   * Get selected platform
   */
  const getSelectedPlatform = useCallback((): Platform | null => {
    if (!state.selectedPlatformId) return null;
    return state.platforms.find(p => p.id === state.selectedPlatformId) || null;
  }, [state.selectedPlatformId, state.platforms]);

  /**
   * Get platform by ID
   */
  const getPlatformById = useCallback((id: string): Platform | undefined => {
    return state.platforms.find(p => p.id === id);
  }, [state.platforms]);

  // Load platforms on mount
  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  const value: PlatformContextValue = {
    state,
    loadPlatforms,
    createPlatform,
    updatePlatform,
    deletePlatform,
    selectPlatform,
    clearError,
    getSelectedPlatform,
    getPlatformById,
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

/**
 * Hook to use platform context
 */
export function usePlatformContext(): PlatformContextValue {
  const context = useContext(PlatformContext);
  
  if (!context) {
    throw new Error('usePlatformContext must be used within a PlatformProvider');
  }
  
  return context;
}

/**
 * Hook to get just the platforms array
 */
export function usePlatforms(): Platform[] {
  const { state } = usePlatformContext();
  return state.platforms;
}

/**
 * Hook to get selected platform
 */
export function useSelectedPlatform(): Platform | null {
  const { getSelectedPlatform } = usePlatformContext();
  return getSelectedPlatform();
}

export default PlatformContext;
