// ============================================
// PROTOCOL OS - EXECUTION CONTEXT PROVIDER
// ============================================
// Address: 1.5.2.a
// Purpose: React Context for handshake execution state
// ============================================

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import type { Handshake } from '@types/1.9.c_fileHandshakeTypeDefinitions';
import type { 
  HandshakeExecutionResult, 
  ExecutionLogEntry,
  ExecutionStatus,
} from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { getProtocolRegistry } from '@registry/1.3.b_fileProtocolHandlerRegistry';

/**
 * Execution state for a single handshake
 */
interface HandshakeExecution {
  handshakeId: string;
  status: ExecutionStatus;
  currentRequestIndex: number;
  totalRequests: number;
  results: HandshakeExecutionResult[];
  logs: ExecutionLogEntry[];
  startTime: string | null;
  endTime: string | null;
  error: string | null;
}

/**
 * Global execution state
 */
interface ExecutionState {
  executions: Map<string, HandshakeExecution>;
  activeExecutionId: string | null;
  globalLogs: ExecutionLogEntry[];
  isAnyExecuting: boolean;
}

/**
 * Execution actions
 */
type ExecutionAction =
  | { type: 'START_EXECUTION'; payload: { handshakeId: string; totalRequests: number } }
  | { type: 'UPDATE_PROGRESS'; payload: { handshakeId: string; currentIndex: number } }
  | { type: 'ADD_RESULT'; payload: { handshakeId: string; result: HandshakeExecutionResult } }
  | { type: 'ADD_LOG'; payload: { handshakeId: string; log: ExecutionLogEntry } }
  | { type: 'COMPLETE_EXECUTION'; payload: { handshakeId: string; success: boolean; error?: string } }
  | { type: 'CANCEL_EXECUTION'; payload: string }
  | { type: 'CLEAR_EXECUTION'; payload: string }
  | { type: 'SET_ACTIVE_EXECUTION'; payload: string | null }
  | { type: 'ADD_GLOBAL_LOG'; payload: ExecutionLogEntry }
  | { type: 'CLEAR_ALL' };

/**
 * Initial state
 */
const initialState: ExecutionState = {
  executions: new Map(),
  activeExecutionId: null,
  globalLogs: [],
  isAnyExecuting: false,
};

/**
 * Execution reducer
 */
function executionReducer(state: ExecutionState, action: ExecutionAction): ExecutionState {
  switch (action.type) {
    case 'START_EXECUTION': {
      const newExecutions = new Map(state.executions);
      newExecutions.set(action.payload.handshakeId, {
        handshakeId: action.payload.handshakeId,
        status: 'running',
        currentRequestIndex: 0,
        totalRequests: action.payload.totalRequests,
        results: [],
        logs: [],
        startTime: new Date().toISOString(),
        endTime: null,
        error: null,
      });
      return {
        ...state,
        executions: newExecutions,
        activeExecutionId: action.payload.handshakeId,
        isAnyExecuting: true,
      };
    }

    case 'UPDATE_PROGRESS': {
      const execution = state.executions.get(action.payload.handshakeId);
      if (!execution) return state;
      
      const newExecutions = new Map(state.executions);
      newExecutions.set(action.payload.handshakeId, {
        ...execution,
        currentRequestIndex: action.payload.currentIndex,
      });
      return { ...state, executions: newExecutions };
    }

    case 'ADD_RESULT': {
      const execution = state.executions.get(action.payload.handshakeId);
      if (!execution) return state;
      
      const newExecutions = new Map(state.executions);
      newExecutions.set(action.payload.handshakeId, {
        ...execution,
        results: [...execution.results, action.payload.result],
      });
      return { ...state, executions: newExecutions };
    }

    case 'ADD_LOG': {
      const execution = state.executions.get(action.payload.handshakeId);
      if (!execution) return state;
      
      const newExecutions = new Map(state.executions);
      newExecutions.set(action.payload.handshakeId, {
        ...execution,
        logs: [...execution.logs, action.payload.log],
      });
      return { ...state, executions: newExecutions };
    }

    case 'COMPLETE_EXECUTION': {
      const execution = state.executions.get(action.payload.handshakeId);
      if (!execution) return state;
      
      const newExecutions = new Map(state.executions);
      newExecutions.set(action.payload.handshakeId, {
        ...execution,
        status: action.payload.success ? 'completed' : 'failed',
        endTime: new Date().toISOString(),
        error: action.payload.error || null,
      });
      
      // Check if any other executions are still running
      const isAnyExecuting = Array.from(newExecutions.values())
        .some(e => e.status === 'running');
      
      return { ...state, executions: newExecutions, isAnyExecuting };
    }

    case 'CANCEL_EXECUTION': {
      const execution = state.executions.get(action.payload);
      if (!execution) return state;
      
      const newExecutions = new Map(state.executions);
      newExecutions.set(action.payload, {
        ...execution,
        status: 'cancelled',
        endTime: new Date().toISOString(),
      });
      
      const isAnyExecuting = Array.from(newExecutions.values())
        .some(e => e.status === 'running');
      
      return { ...state, executions: newExecutions, isAnyExecuting };
    }

    case 'CLEAR_EXECUTION': {
      const newExecutions = new Map(state.executions);
      newExecutions.delete(action.payload);
      return {
        ...state,
        executions: newExecutions,
        activeExecutionId: state.activeExecutionId === action.payload 
          ? null 
          : state.activeExecutionId,
      };
    }

    case 'SET_ACTIVE_EXECUTION':
      return { ...state, activeExecutionId: action.payload };

    case 'ADD_GLOBAL_LOG':
      return {
        ...state,
        globalLogs: [...state.globalLogs.slice(-499), action.payload], // Keep last 500
      };

    case 'CLEAR_ALL':
      return initialState;

    default:
      return state;
  }
}

/**
 * Context value type
 */
interface ExecutionContextValue {
  state: ExecutionState;
  // Actions
  executeHandshake: (handshake: Handshake, variables?: Record<string, string>) => Promise<HandshakeExecutionResult[]>;
  cancelExecution: (handshakeId: string) => void;
  clearExecution: (handshakeId: string) => void;
  setActiveExecution: (handshakeId: string | null) => void;
  addGlobalLog: (log: ExecutionLogEntry) => void;
  clearAll: () => void;
  // Selectors
  getExecution: (handshakeId: string) => HandshakeExecution | undefined;
  getActiveExecution: () => HandshakeExecution | undefined;
}

/**
 * Create context
 */
const ExecutionContext = createContext<ExecutionContextValue | null>(null);

/**
 * Execution Provider component
 */
export function ExecutionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(executionReducer, initialState);
  
  // Store abort controllers for cancellation
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  /**
   * Execute a handshake
   */
  const executeHandshake = useCallback(async (
    handshake: Handshake,
    variables?: Record<string, string>
  ): Promise<HandshakeExecutionResult[]> => {
    const { id: handshakeId, authenticationConfig, curlRequests } = handshake;
    
    // Create abort controller for this execution
    const abortController = new AbortController();
    abortControllers.current.set(handshakeId, abortController);

    // Start execution
    dispatch({
      type: 'START_EXECUTION',
      payload: { handshakeId, totalRequests: curlRequests.length },
    });

    const results: HandshakeExecutionResult[] = [];

    try {
      // Get the protocol handler
      const registry = getProtocolRegistry();
      const handler = registry.getHandler(authenticationConfig.protocolType);

      if (!handler) {
        throw new Error(`No handler for protocol: ${authenticationConfig.protocolType}`);
      }

      // Authenticate first
      const authResult = await handler.authenticate(authenticationConfig);
      
      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }

      const credentials = authResult.credentials!;

      // Execute each curl request
      for (let i = 0; i < curlRequests.length; i++) {
        // Check if cancelled
        if (abortController.signal.aborted) {
          break;
        }

        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: { handshakeId, currentIndex: i },
        });

        const curlRequest = curlRequests[i];
        
        const result = await handler.executeRequest(
          curlRequest,
          authenticationConfig,
          credentials,
          {
            variables,
            signal: abortController.signal,
            onLog: (log) => {
              dispatch({ type: 'ADD_LOG', payload: { handshakeId, log } });
            },
          }
        );

        results.push(result);
        dispatch({ type: 'ADD_RESULT', payload: { handshakeId, result } });

        // Stop on failure if not configured to continue
        if (!result.success && !handshake.continueOnError) {
          break;
        }
      }

      const allSuccessful = results.every(r => r.success);
      dispatch({
        type: 'COMPLETE_EXECUTION',
        payload: { handshakeId, success: allSuccessful },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      dispatch({
        type: 'COMPLETE_EXECUTION',
        payload: { handshakeId, success: false, error: errorMessage },
      });
    } finally {
      abortControllers.current.delete(handshakeId);
    }

    return results;
  }, []);

  /**
   * Cancel an execution
   */
  const cancelExecution = useCallback((handshakeId: string) => {
    const controller = abortControllers.current.get(handshakeId);
    if (controller) {
      controller.abort();
    }
    dispatch({ type: 'CANCEL_EXECUTION', payload: handshakeId });
  }, []);

  /**
   * Clear execution history for a handshake
   */
  const clearExecution = useCallback((handshakeId: string) => {
    dispatch({ type: 'CLEAR_EXECUTION', payload: handshakeId });
  }, []);

  /**
   * Set active execution
   */
  const setActiveExecution = useCallback((handshakeId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_EXECUTION', payload: handshakeId });
  }, []);

  /**
   * Add global log entry
   */
  const addGlobalLog = useCallback((log: ExecutionLogEntry) => {
    dispatch({ type: 'ADD_GLOBAL_LOG', payload: log });
  }, []);

  /**
   * Clear all execution state
   */
  const clearAll = useCallback(() => {
    // Abort all running executions
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  /**
   * Get execution by handshake ID
   */
  const getExecution = useCallback((handshakeId: string): HandshakeExecution | undefined => {
    return state.executions.get(handshakeId);
  }, [state.executions]);

  /**
   * Get active execution
   */
  const getActiveExecution = useCallback((): HandshakeExecution | undefined => {
    if (!state.activeExecutionId) return undefined;
    return state.executions.get(state.activeExecutionId);
  }, [state.activeExecutionId, state.executions]);

  const value: ExecutionContextValue = {
    state,
    executeHandshake,
    cancelExecution,
    clearExecution,
    setActiveExecution,
    addGlobalLog,
    clearAll,
    getExecution,
    getActiveExecution,
  };

  return (
    <ExecutionContext.Provider value={value}>
      {children}
    </ExecutionContext.Provider>
  );
}

/**
 * Hook to use execution context
 */
export function useExecutionContext(): ExecutionContextValue {
  const context = useContext(ExecutionContext);
  
  if (!context) {
    throw new Error('useExecutionContext must be used within an ExecutionProvider');
  }
  
  return context;
}

export default ExecutionContext;
