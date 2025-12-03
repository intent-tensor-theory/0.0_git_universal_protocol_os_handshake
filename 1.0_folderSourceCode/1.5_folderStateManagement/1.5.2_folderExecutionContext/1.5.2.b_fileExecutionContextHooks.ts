// ============================================
// PROTOCOL OS - EXECUTION CONTEXT HOOKS
// ============================================
// Address: 1.5.2.b
// Purpose: Custom hooks for execution operations
// ============================================

import { useMemo, useCallback } from 'react';
import { useExecutionContext, useExecutionHistory, useCurrentExecution } from './1.5.2.a_fileExecutionContextProvider';
import type { ExecutionStatus } from './1.5.2.a_fileExecutionContextProvider';

/**
 * Hook for execution operations
 */
export function useExecutionOperations() {
  const {
    startExecution,
    updateProgress,
    addLog,
    completeExecution,
    failExecution,
    cancelExecution,
    clearCurrent,
    clearHistory,
  } = useExecutionContext();

  return {
    start: startExecution,
    progress: updateProgress,
    log: addLog,
    complete: completeExecution,
    fail: failExecution,
    cancel: cancelExecution,
    clearCurrent,
    clearHistory,
  };
}

/**
 * Hook for execution logs
 */
export function useExecutionLogs() {
  const currentRun = useCurrentExecution();

  return {
    logs: currentRun?.logs ?? [],
    hasLogs: (currentRun?.logs.length ?? 0) > 0,
    lastLog: currentRun?.logs[currentRun.logs.length - 1],
    errorLogs: currentRun?.logs.filter((l) => l.level === 'ERROR') ?? [],
    warningLogs: currentRun?.logs.filter((l) => l.level === 'WARNING') ?? [],
  };
}

/**
 * Hook for execution progress
 */
export function useExecutionProgress() {
  const currentRun = useCurrentExecution();

  return {
    progress: currentRun?.progress,
    percentage: currentRun?.progress
      ? Math.round((currentRun.progress.current / currentRun.progress.total) * 100)
      : 0,
    message: currentRun?.progress?.message ?? '',
  };
}

/**
 * Hook for execution statistics
 */
export function useExecutionStats() {
  const history = useExecutionHistory();

  return useMemo(() => {
    const total = history.length;
    const successful = history.filter((r) => r.status === 'success').length;
    const failed = history.filter((r) => r.status === 'failed').length;
    const cancelled = history.filter((r) => r.status === 'cancelled').length;

    const avgDuration = history
      .filter((r) => r.endTime)
      .reduce((acc, r) => {
        const duration = new Date(r.endTime!).getTime() - new Date(r.startTime).getTime();
        return acc + duration;
      }, 0) / (history.filter((r) => r.endTime).length || 1);

    return {
      total,
      successful,
      failed,
      cancelled,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgDurationMs: Math.round(avgDuration),
    };
  }, [history]);
}

/**
 * Hook for filtering execution history
 */
export function useExecutionHistoryFilter() {
  const history = useExecutionHistory();

  const filterByStatus = useCallback(
    (status: ExecutionStatus) => history.filter((r) => r.status === status),
    [history]
  );

  const filterByHandshake = useCallback(
    (handshakeId: string) => history.filter((r) => r.handshakeId === handshakeId),
    [history]
  );

  const filterByDateRange = useCallback(
    (startDate: Date, endDate: Date) =>
      history.filter((r) => {
        const runDate = new Date(r.startTime);
        return runDate >= startDate && runDate <= endDate;
      }),
    [history]
  );

  const getRecent = useCallback(
    (count: number) => history.slice(0, count),
    [history]
  );

  return {
    filterByStatus,
    filterByHandshake,
    filterByDateRange,
    getRecent,
  };
}

/**
 * Hook for execution timing
 */
export function useExecutionTiming() {
  const currentRun = useCurrentExecution();

  const getElapsedTime = useCallback(() => {
    if (!currentRun) return 0;
    const start = new Date(currentRun.startTime).getTime();
    const end = currentRun.endTime
      ? new Date(currentRun.endTime).getTime()
      : Date.now();
    return end - start;
  }, [currentRun]);

  const formatElapsedTime = useCallback(() => {
    const ms = getElapsedTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }, [getElapsedTime]);

  return {
    elapsedMs: getElapsedTime(),
    formatted: formatElapsedTime(),
    startTime: currentRun?.startTime,
    endTime: currentRun?.endTime,
  };
}

/**
 * Hook for execution result
 */
export function useExecutionResult() {
  const currentRun = useCurrentExecution();

  return {
    result: currentRun?.result,
    hasResult: !!currentRun?.result,
    isSuccess: currentRun?.status === 'success',
    isFailed: currentRun?.status === 'failed',
    statusCode: currentRun?.result?.metrics?.statusCode,
    responseBody: currentRun?.result?.responseBody,
    headers: currentRun?.result?.headers,
  };
}
