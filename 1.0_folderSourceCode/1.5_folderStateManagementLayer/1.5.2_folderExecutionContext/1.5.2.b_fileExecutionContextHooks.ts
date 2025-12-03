// ============================================
// PROTOCOL OS - EXECUTION CONTEXT HOOKS
// ============================================
// Address: 1.5.2.b
// Purpose: Specialized hooks for execution operations
// ============================================

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useExecutionContext } from './1.5.2.a_fileExecutionContextProvider';
import type { ExecutionLogEntry, ExecutionStatus } from '@types/1.9.h_fileExecutionResultTypeDefinitions';

/**
 * Hook to get execution status for a specific handshake
 */
export function useExecutionStatus(handshakeId: string): {
  status: ExecutionStatus;
  isRunning: boolean;
  isComplete: boolean;
  isFailed: boolean;
  isCancelled: boolean;
  progress: number;
  error: string | null;
} {
  const { getExecution } = useExecutionContext();
  const execution = getExecution(handshakeId);

  return useMemo(() => {
    if (!execution) {
      return {
        status: 'idle' as ExecutionStatus,
        isRunning: false,
        isComplete: false,
        isFailed: false,
        isCancelled: false,
        progress: 0,
        error: null,
      };
    }

    const progress = execution.totalRequests > 0
      ? (execution.currentRequestIndex / execution.totalRequests) * 100
      : 0;

    return {
      status: execution.status,
      isRunning: execution.status === 'running',
      isComplete: execution.status === 'completed',
      isFailed: execution.status === 'failed',
      isCancelled: execution.status === 'cancelled',
      progress,
      error: execution.error,
    };
  }, [execution]);
}

/**
 * Hook to get execution logs for a specific handshake
 */
export function useExecutionLogs(
  handshakeId: string,
  options?: {
    level?: ExecutionLogEntry['level'];
    limit?: number;
  }
): ExecutionLogEntry[] {
  const { getExecution } = useExecutionContext();
  const execution = getExecution(handshakeId);

  return useMemo(() => {
    if (!execution) return [];

    let logs = execution.logs;

    // Filter by level
    if (options?.level) {
      logs = logs.filter(log => log.level === options.level);
    }

    // Apply limit
    if (options?.limit) {
      logs = logs.slice(-options.limit);
    }

    return logs;
  }, [execution, options?.level, options?.limit]);
}

/**
 * Hook to get execution results for a specific handshake
 */
export function useExecutionResults(handshakeId: string) {
  const { getExecution } = useExecutionContext();
  const execution = getExecution(handshakeId);

  return useMemo(() => {
    if (!execution) {
      return {
        results: [],
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        totalDurationMs: 0,
        averageLatencyMs: 0,
      };
    }

    const results = execution.results;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    const totalDurationMs = results.reduce(
      (sum, r) => sum + (r.metrics?.totalDurationMs ?? 0),
      0
    );

    return {
      results,
      successCount,
      failureCount,
      successRate: results.length > 0 ? (successCount / results.length) * 100 : 0,
      totalDurationMs,
      averageLatencyMs: results.length > 0 ? totalDurationMs / results.length : 0,
    };
  }, [execution]);
}

/**
 * Hook for global execution logs
 */
export function useGlobalLogs(limit: number = 100): ExecutionLogEntry[] {
  const { state } = useExecutionContext();

  return useMemo(() => {
    return state.globalLogs.slice(-limit);
  }, [state.globalLogs, limit]);
}

/**
 * Hook to check if any execution is running
 */
export function useIsAnyExecuting(): boolean {
  const { state } = useExecutionContext();
  return state.isAnyExecuting;
}

/**
 * Hook for execution timing
 */
export function useExecutionTiming(handshakeId: string): {
  startTime: Date | null;
  endTime: Date | null;
  durationMs: number | null;
  elapsedMs: number;
} {
  const { getExecution } = useExecutionContext();
  const execution = getExecution(handshakeId);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!execution?.startTime || execution.status !== 'running') {
      return;
    }

    const startTime = new Date(execution.startTime).getTime();
    
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [execution?.startTime, execution?.status]);

  return useMemo(() => {
    if (!execution) {
      return { startTime: null, endTime: null, durationMs: null, elapsedMs: 0 };
    }

    const startTime = execution.startTime ? new Date(execution.startTime) : null;
    const endTime = execution.endTime ? new Date(execution.endTime) : null;

    let durationMs: number | null = null;
    if (startTime && endTime) {
      durationMs = endTime.getTime() - startTime.getTime();
    }

    return { startTime, endTime, durationMs, elapsedMs };
  }, [execution, elapsedMs]);
}

/**
 * Hook for execution actions bound to a specific handshake
 */
export function useHandshakeExecution(handshakeId: string) {
  const { 
    executeHandshake,
    cancelExecution,
    clearExecution,
    getExecution,
  } = useExecutionContext();

  const execution = getExecution(handshakeId);

  const cancel = useCallback(() => {
    cancelExecution(handshakeId);
  }, [cancelExecution, handshakeId]);

  const clear = useCallback(() => {
    clearExecution(handshakeId);
  }, [clearExecution, handshakeId]);

  return {
    execution,
    executeHandshake,
    cancel,
    clear,
    status: execution?.status ?? 'idle',
    isRunning: execution?.status === 'running',
    results: execution?.results ?? [],
    logs: execution?.logs ?? [],
    error: execution?.error ?? null,
  };
}

/**
 * Hook to get all running executions
 */
export function useRunningExecutions() {
  const { state } = useExecutionContext();

  return useMemo(() => {
    return Array.from(state.executions.values())
      .filter(e => e.status === 'running');
  }, [state.executions]);
}

/**
 * Hook for execution statistics across all executions
 */
export function useExecutionStats() {
  const { state } = useExecutionContext();

  return useMemo(() => {
    const executions = Array.from(state.executions.values());
    
    return {
      total: executions.length,
      running: executions.filter(e => e.status === 'running').length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      cancelled: executions.filter(e => e.status === 'cancelled').length,
      totalResults: executions.reduce((sum, e) => sum + e.results.length, 0),
      totalLogs: executions.reduce((sum, e) => sum + e.logs.length, 0),
    };
  }, [state.executions]);
}
