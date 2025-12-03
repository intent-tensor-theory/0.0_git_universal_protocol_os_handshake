// ============================================
// PROTOCOL OS - EXECUTION STORE
// ============================================
// Address: 1.5.4.a
// Purpose: Zustand store for execution state management
// ============================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import type { EkgStatusType } from '@ui/1.7.2_folderEkgStatusIndicator/1.7.2.b_fileEkgStatusIndicatorHook';

/**
 * Execution Run
 */
interface ExecutionRun {
  id: string;
  handshakeId: string;
  resourceId: string;
  platformId: string;
  startedAt: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  result?: HandshakeExecutionResult;
  logs: ExecutionLogEntry[];
  progress: number; // 0-100
}

/**
 * Execution Store State
 */
interface ExecutionState {
  // Current Execution
  currentRun: ExecutionRun | null;
  isExecuting: boolean;
  
  // History
  executionHistory: ExecutionRun[];
  maxHistorySize: number;
  
  // EKG Status
  ekgStatus: EkgStatusType;
  
  // Abort Controller
  abortController: AbortController | null;
}

/**
 * Execution Store Actions
 */
interface ExecutionActions {
  // Execution Control
  startExecution: (handshakeId: string, resourceId: string, platformId: string) => string;
  updateProgress: (runId: string, progress: number) => void;
  addLog: (runId: string, log: ExecutionLogEntry) => void;
  completeExecution: (runId: string, result: HandshakeExecutionResult) => void;
  failExecution: (runId: string, error: string) => void;
  cancelExecution: () => void;
  
  // History
  clearHistory: () => void;
  removeFromHistory: (runId: string) => void;
  getRunById: (runId: string) => ExecutionRun | undefined;
  getRunsForHandshake: (handshakeId: string) => ExecutionRun[];
  
  // EKG Status
  setEkgStatus: (status: EkgStatusType) => void;
  deriveEkgStatus: () => void;
  
  // Retry
  retryExecution: (runId: string) => Promise<void>;
}

type ExecutionStore = ExecutionState & ExecutionActions;

/**
 * Create Execution Store
 */
export const useExecutionStore = create<ExecutionStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      currentRun: null,
      isExecuting: false,
      executionHistory: [],
      maxHistorySize: 50,
      ekgStatus: 'unconfigured',
      abortController: null,

      // Execution Control
      startExecution: (handshakeId, resourceId, platformId) => {
        const runId = crypto.randomUUID();
        const abortController = new AbortController();

        const newRun: ExecutionRun = {
          id: runId,
          handshakeId,
          resourceId,
          platformId,
          startedAt: new Date().toISOString(),
          status: 'running',
          logs: [],
          progress: 0,
        };

        set({
          currentRun: newRun,
          isExecuting: true,
          abortController,
          ekgStatus: 'processing',
        });

        return runId;
      },

      updateProgress: (runId, progress) => {
        set(state => {
          if (state.currentRun?.id !== runId) return state;
          return {
            currentRun: { ...state.currentRun, progress: Math.min(100, Math.max(0, progress)) },
          };
        });
      },

      addLog: (runId, log) => {
        set(state => {
          if (state.currentRun?.id !== runId) return state;
          return {
            currentRun: {
              ...state.currentRun,
              logs: [...state.currentRun.logs, log],
            },
          };
        });
      },

      completeExecution: (runId, result) => {
        set(state => {
          if (state.currentRun?.id !== runId) return state;

          const completedRun: ExecutionRun = {
            ...state.currentRun,
            completedAt: new Date().toISOString(),
            status: result.success ? 'success' : 'failed',
            result,
            progress: 100,
            logs: [...state.currentRun.logs, ...result.logs],
          };

          // Add to history
          const newHistory = [completedRun, ...state.executionHistory].slice(0, state.maxHistorySize);

          return {
            currentRun: null,
            isExecuting: false,
            abortController: null,
            executionHistory: newHistory,
            ekgStatus: result.success ? 'healthy' : 'failed',
          };
        });
      },

      failExecution: (runId, error) => {
        set(state => {
          if (state.currentRun?.id !== runId) return state;

          const failedRun: ExecutionRun = {
            ...state.currentRun,
            completedAt: new Date().toISOString(),
            status: 'failed',
            progress: state.currentRun.progress,
            logs: [
              ...state.currentRun.logs,
              { timestamp: new Date().toISOString(), level: 'ERROR', message: error },
            ],
          };

          const newHistory = [failedRun, ...state.executionHistory].slice(0, state.maxHistorySize);

          return {
            currentRun: null,
            isExecuting: false,
            abortController: null,
            executionHistory: newHistory,
            ekgStatus: 'failed',
          };
        });
      },

      cancelExecution: () => {
        const { abortController, currentRun } = get();
        
        if (abortController) {
          abortController.abort();
        }

        if (currentRun) {
          const cancelledRun: ExecutionRun = {
            ...currentRun,
            completedAt: new Date().toISOString(),
            status: 'cancelled',
            logs: [
              ...currentRun.logs,
              { timestamp: new Date().toISOString(), level: 'WARNING', message: 'Execution cancelled by user' },
            ],
          };

          set(state => ({
            currentRun: null,
            isExecuting: false,
            abortController: null,
            executionHistory: [cancelledRun, ...state.executionHistory].slice(0, state.maxHistorySize),
            ekgStatus: 'configured',
          }));
        }
      },

      // History
      clearHistory: () => {
        set({ executionHistory: [] });
      },

      removeFromHistory: (runId) => {
        set(state => ({
          executionHistory: state.executionHistory.filter(r => r.id !== runId),
        }));
      },

      getRunById: (runId) => {
        const { currentRun, executionHistory } = get();
        if (currentRun?.id === runId) return currentRun;
        return executionHistory.find(r => r.id === runId);
      },

      getRunsForHandshake: (handshakeId) => {
        return get().executionHistory.filter(r => r.handshakeId === handshakeId);
      },

      // EKG Status
      setEkgStatus: (status) => {
        set({ ekgStatus: status });
      },

      deriveEkgStatus: () => {
        const { isExecuting, executionHistory, currentRun } = get();
        
        if (isExecuting) {
          set({ ekgStatus: 'processing' });
          return;
        }

        if (currentRun) {
          set({ ekgStatus: 'processing' });
          return;
        }

        const lastRun = executionHistory[0];
        if (!lastRun) {
          set({ ekgStatus: 'configured' });
          return;
        }

        switch (lastRun.status) {
          case 'success':
            set({ ekgStatus: 'healthy' });
            break;
          case 'failed':
            set({ ekgStatus: 'failed' });
            break;
          default:
            set({ ekgStatus: 'configured' });
        }
      },

      // Retry
      retryExecution: async (runId) => {
        const run = get().getRunById(runId);
        if (!run) throw new Error('Execution run not found');

        // This would be implemented to actually re-execute
        // For now, just start a new execution with the same params
        get().startExecution(run.handshakeId, run.resourceId, run.platformId);
      },
    }),
    { name: 'ExecutionStore' }
  )
);

export default useExecutionStore;
