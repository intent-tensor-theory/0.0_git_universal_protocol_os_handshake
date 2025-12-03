// ============================================
// PROTOCOL OS - EXECUTION CONTEXT
// ============================================
// Address: 1.5.2.a
// Purpose: React context for handshake execution state
// ============================================

import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import type { Handshake } from '@types/1.9.c_filePlatformTypeDefinitions';

// ----------------------------------------
// State Types
// ----------------------------------------

export type ExecutionStatus = 'idle' | 'preparing' | 'running' | 'success' | 'failed' | 'cancelled';

interface ExecutionRun {
  id: string;
  handshakeId: string;
  handshakeTitle: string;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  result?: HandshakeExecutionResult;
  logs: ExecutionLogEntry[];
  progress?: {
    current: number;
    total: number;
    message: string;
  };
}

interface ExecutionState {
  currentRun: ExecutionRun | null;
  history: ExecutionRun[];
  maxHistorySize: number;
  isExecuting: boolean;
}

// ----------------------------------------
// Action Types
// ----------------------------------------

type ExecutionAction =
  | { type: 'START_EXECUTION'; payload: { id: string; handshakeId: string; handshakeTitle: string } }
  | { type: 'UPDATE_PROGRESS'; payload: { current: number; total: number; message: string } }
  | { type: 'ADD_LOG'; payload: ExecutionLogEntry }
  | { type: 'COMPLETE_EXECUTION'; payload: { result: HandshakeExecutionResult } }
  | { type: 'FAIL_EXECUTION'; payload: { error: string } }
  | { type: 'CANCEL_EXECUTION' }
  | { type: 'CLEAR_CURRENT' }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_MAX_HISTORY'; payload: number };

// ----------------------------------------
// Initial State
// ----------------------------------------

const initialState: ExecutionState = {
  currentRun: null,
  history: [],
  maxHistorySize: 50,
  isExecuting: false,
};

// ----------------------------------------
// Reducer
// ----------------------------------------

function executionReducer(state: ExecutionState, action: ExecutionAction): ExecutionState {
  switch (action.type) {
    case 'START_EXECUTION':
      return {
        ...state,
        isExecuting: true,
        currentRun: {
          id: action.payload.id,
          handshakeId: action.payload.handshakeId,
          handshakeTitle: action.payload.handshakeTitle,
          status: 'preparing',
          startTime: new Date().toISOString(),
          logs: [],
        },
      };

    case 'UPDATE_PROGRESS':
      if (!state.currentRun) return state;
      return {
        ...state,
        currentRun: {
          ...state.currentRun,
          status: 'running',
          progress: action.payload,
        },
      };

    case 'ADD_LOG':
      if (!state.currentRun) return state;
      return {
        ...state,
        currentRun: {
          ...state.currentRun,
          logs: [...state.currentRun.logs, action.payload],
        },
      };

    case 'COMPLETE_EXECUTION':
      if (!state.currentRun) return state;
      const completedRun: ExecutionRun = {
        ...state.currentRun,
        status: action.payload.result.success ? 'success' : 'failed',
        endTime: new Date().toISOString(),
        result: action.payload.result,
        logs: [...state.currentRun.logs, ...action.payload.result.logs],
      };
      return {
        ...state,
        isExecuting: false,
        currentRun: completedRun,
        history: [completedRun, ...state.history].slice(0, state.maxHistorySize),
      };

    case 'FAIL_EXECUTION':
      if (!state.currentRun) return state;
      const failedRun: ExecutionRun = {
        ...state.currentRun,
        status: 'failed',
        endTime: new Date().toISOString(),
        logs: [
          ...state.currentRun.logs,
          {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: action.payload.error,
          },
        ],
      };
      return {
        ...state,
        isExecuting: false,
        currentRun: failedRun,
        history: [failedRun, ...state.history].slice(0, state.maxHistorySize),
      };

    case 'CANCEL_EXECUTION':
      if (!state.currentRun) return state;
      const cancelledRun: ExecutionRun = {
        ...state.currentRun,
        status: 'cancelled',
        endTime: new Date().toISOString(),
        logs: [
          ...state.currentRun.logs,
          {
            timestamp: new Date().toISOString(),
            level: 'WARNING',
            message: 'Execution cancelled by user',
          },
        ],
      };
      return {
        ...state,
        isExecuting: false,
        currentRun: cancelledRun,
        history: [cancelledRun, ...state.history].slice(0, state.maxHistorySize),
      };

    case 'CLEAR_CURRENT':
      return {
        ...state,
        currentRun: null,
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [],
      };

    case 'SET_MAX_HISTORY':
      return {
        ...state,
        maxHistorySize: action.payload,
        history: state.history.slice(0, action.payload),
      };

    default:
      return state;
  }
}

// ----------------------------------------
// Context Types
// ----------------------------------------

interface ExecutionContextValue {
  state: ExecutionState;
  startExecution: (handshake: Handshake) => string;
  updateProgress: (current: number, total: number, message: string) => void;
  addLog: (log: ExecutionLogEntry) => void;
  completeExecution: (result: HandshakeExecutionResult) => void;
  failExecution: (error: string) => void;
  cancelExecution: () => void;
  clearCurrent: () => void;
  clearHistory: () => void;
  getRunById: (id: string) => ExecutionRun | undefined;
}

// ----------------------------------------
// Context
// ----------------------------------------

const ExecutionContext = createContext<ExecutionContextValue | null>(null);

// ----------------------------------------
// Provider
// ----------------------------------------

interface ExecutionProviderProps {
  children: ReactNode;
  maxHistorySize?: number;
}

export function ExecutionProvider({ children, maxHistorySize = 50 }: ExecutionProviderProps) {
  const [state, dispatch] = useReducer(executionReducer, {
    ...initialState,
    maxHistorySize,
  });

  const startExecution = useCallback((handshake: Handshake): string => {
    const id = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    dispatch({
      type: 'START_EXECUTION',
      payload: {
        id,
        handshakeId: handshake.id,
        handshakeTitle: handshake.title,
      },
    });
    return id;
  }, []);

  const updateProgress = useCallback((current: number, total: number, message: string) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { current, total, message } });
  }, []);

  const addLog = useCallback((log: ExecutionLogEntry) => {
    dispatch({ type: 'ADD_LOG', payload: log });
  }, []);

  const completeExecution = useCallback((result: HandshakeExecutionResult) => {
    dispatch({ type: 'COMPLETE_EXECUTION', payload: { result } });
  }, []);

  const failExecution = useCallback((error: string) => {
    dispatch({ type: 'FAIL_EXECUTION', payload: { error } });
  }, []);

  const cancelExecution = useCallback(() => {
    dispatch({ type: 'CANCEL_EXECUTION' });
  }, []);

  const clearCurrent = useCallback(() => {
    dispatch({ type: 'CLEAR_CURRENT' });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, []);

  const getRunById = useCallback(
    (id: string): ExecutionRun | undefined => {
      if (state.currentRun?.id === id) return state.currentRun;
      return state.history.find((run) => run.id === id);
    },
    [state.currentRun, state.history]
  );

  const value: ExecutionContextValue = {
    state,
    startExecution,
    updateProgress,
    addLog,
    completeExecution,
    failExecution,
    cancelExecution,
    clearCurrent,
    clearHistory,
    getRunById,
  };

  return (
    <ExecutionContext.Provider value={value}>
      {children}
    </ExecutionContext.Provider>
  );
}

// ----------------------------------------
// Hook
// ----------------------------------------

export function useExecutionContext() {
  const context = useContext(ExecutionContext);
  
  if (!context) {
    throw new Error('useExecutionContext must be used within an ExecutionProvider');
  }
  
  return context;
}

// ----------------------------------------
// Selector Hooks
// ----------------------------------------

export function useCurrentExecution() {
  const { state } = useExecutionContext();
  return state.currentRun;
}

export function useExecutionHistory() {
  const { state } = useExecutionContext();
  return state.history;
}

export function useIsExecuting() {
  const { state } = useExecutionContext();
  return state.isExecuting;
}

export default ExecutionContext;
