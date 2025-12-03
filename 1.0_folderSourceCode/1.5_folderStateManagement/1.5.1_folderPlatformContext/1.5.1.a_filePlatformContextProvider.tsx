// ============================================
// PROTOCOL OS - PLATFORM CONTEXT
// ============================================
// Address: 1.5.1.a
// Purpose: React context for platform state management
// ============================================

import React, { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react';
import type { Platform } from '@types/1.9.c_filePlatformTypeDefinitions';
import { getDatabaseProvider } from '@database/1.2.c_fileIndex';

// ----------------------------------------
// State Types
// ----------------------------------------

interface PlatformState {
  platforms: Platform[];
  selectedPlatformId: string | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// ----------------------------------------
// Action Types
// ----------------------------------------

type PlatformAction =
  | { type: 'SET_PLATFORMS'; payload: Platform[] }
  | { type: 'ADD_PLATFORM'; payload: Platform }
  | { type: 'UPDATE_PLATFORM'; payload: Platform }
  | { type: 'DELETE_PLATFORM'; payload: string }
  | { type: 'SELECT_PLATFORM'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

// ----------------------------------------
// Initial State
// ----------------------------------------

const initialState: PlatformState = {
  platforms: [],
  selectedPlatformId: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// ----------------------------------------
// Reducer
// ----------------------------------------

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
        platforms: state.platforms.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
        lastUpdated: new Date().toISOString(),
      };

    case 'DELETE_PLATFORM':
      return {
        ...state,
        platforms: state.platforms.filter((p) => p.id !== action.payload),
        selectedPlatformId:
          state.selectedPlatformId === action.payload ? null : state.selectedPlatformId,
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

// ----------------------------------------
// Context Types
// ----------------------------------------

interface PlatformContextValue {
  state: PlatformState;
  // Queries
  getPlatformById: (id: string) => Platform | undefined;
  getSelectedPlatform: () => Platform | undefined;
  // Mutations
  loadPlatforms: () => Promise<void>;
  createPlatform: (platform: Platform) => Promise<void>;
  updatePlatform: (platform: Platform) => Promise<void>;
  deletePlatform: (id: string) => Promise<void>;
  selectPlatform: (id: string | null) => void;
  clearError: () => void;
}

// ----------------------------------------
// Context
// ----------------------------------------

const PlatformContext = createContext<PlatformContextValue | null>(null);

// ----------------------------------------
// Provider
// ----------------------------------------

interface PlatformProviderProps {
  children: ReactNode;
  autoLoad?: boolean;
}

export function PlatformProvider({ children, autoLoad = true }: PlatformProviderProps) {
  const [state, dispatch] = useReducer(platformReducer, initialState);

  // Load platforms from database
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
        payload: error instanceof Error ? error.message : 'Unknown error loading platforms',
      });
    }
  }, []);

  // Create platform
  const createPlatform = useCallback(async (platform: Platform) => {
    try {
      const db = getDatabaseProvider();
      const result = await db.createPlatform(platform);
      
      if (result.success) {
        dispatch({ type: 'ADD_PLATFORM', payload: platform });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to create platform' });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error creating platform',
      });
    }
  }, []);

  // Update platform
  const updatePlatform = useCallback(async (platform: Platform) => {
    try {
      const db = getDatabaseProvider();
      const result = await db.updatePlatform(platform.id, platform);
      
      if (result.success) {
        dispatch({ type: 'UPDATE_PLATFORM', payload: platform });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to update platform' });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error updating platform',
      });
    }
  }, []);

  // Delete platform
  const deletePlatform = useCallback(async (id: string) => {
    try {
      const db = getDatabaseProvider();
      const result = await db.deletePlatform(id);
      
      if (result.success) {
        dispatch({ type: 'DELETE_PLATFORM', payload: id });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to delete platform' });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error deleting platform',
      });
    }
  }, []);

  // Select platform
  const selectPlatform = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_PLATFORM', payload: id });
  }, []);

  // Get platform by ID
  const getPlatformById = useCallback(
    (id: string) => state.platforms.find((p) => p.id === id),
    [state.platforms]
  );

  // Get selected platform
  const getSelectedPlatform = useCallback(
    () => state.selectedPlatformId 
      ? state.platforms.find((p) => p.id === state.selectedPlatformId)
      : undefined,
    [state.platforms, state.selectedPlatformId]
  );

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadPlatforms();
    }
  }, [autoLoad, loadPlatforms]);

  const value: PlatformContextValue = {
    state,
    getPlatformById,
    getSelectedPlatform,
    loadPlatforms,
    createPlatform,
    updatePlatform,
    deletePlatform,
    selectPlatform,
    clearError,
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

// ----------------------------------------
// Hook
// ----------------------------------------

export function usePlatformContext() {
  const context = useContext(PlatformContext);
  
  if (!context) {
    throw new Error('usePlatformContext must be used within a PlatformProvider');
  }
  
  return context;
}

// ----------------------------------------
// Selector Hooks
// ----------------------------------------

export function usePlatforms() {
  const { state } = usePlatformContext();
  return state.platforms;
}

export function useSelectedPlatform() {
  const { getSelectedPlatform } = usePlatformContext();
  return getSelectedPlatform();
}

export function usePlatformById(id: string) {
  const { getPlatformById } = usePlatformContext();
  return getPlatformById(id);
}

export default PlatformContext;
