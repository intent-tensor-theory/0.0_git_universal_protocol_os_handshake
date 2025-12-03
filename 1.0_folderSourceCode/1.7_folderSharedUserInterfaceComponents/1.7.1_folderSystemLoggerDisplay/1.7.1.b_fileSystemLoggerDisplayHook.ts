// ============================================
// PROTOCOL OS - SYSTEM LOGGER DISPLAY HOOK
// ============================================
// Address: 1.7.1.b
// Purpose: Custom hook for managing log state and operations
// ============================================

import { useState, useCallback, useRef } from 'react';
import type { ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';

/**
 * Options for the useSystemLogger hook
 */
export interface UseSystemLoggerOptions {
  /** Maximum number of logs to retain (default: 500) */
  maxLogs?: number;
  
  /** Whether to persist logs to sessionStorage */
  persistToSession?: boolean;
  
  /** Storage key for session persistence */
  storageKey?: string;
}

/**
 * Return type for useSystemLogger hook
 */
export interface UseSystemLoggerReturn {
  /** Current array of log entries */
  logs: ExecutionLogEntry[];
  
  /** Add a new log entry */
  addLog: (level: ExecutionLogEntry['level'], message: string) => void;
  
  /** Add a SYSTEM level log */
  logSystem: (message: string) => void;
  
  /** Add an INFO level log */
  logInfo: (message: string) => void;
  
  /** Add a SUCCESS level log */
  logSuccess: (message: string) => void;
  
  /** Add a WARNING level log */
  logWarning: (message: string) => void;
  
  /** Add an ERROR level log */
  logError: (message: string) => void;
  
  /** Clear all logs */
  clearLogs: () => void;
  
  /** Export logs as JSON string */
  exportLogs: () => string;
  
  /** Import logs from JSON string */
  importLogs: (jsonString: string) => boolean;
  
  /** Get logs filtered by level */
  getLogsByLevel: (level: ExecutionLogEntry['level']) => ExecutionLogEntry[];
  
  /** Get the count of logs by level */
  getLogCountByLevel: () => Record<ExecutionLogEntry['level'], number>;
}

/**
 * Custom hook for managing system logs
 * 
 * Provides methods to add, clear, export, and filter log entries.
 * Optionally persists logs to sessionStorage.
 * 
 * @example
 * ```tsx
 * const { logs, logInfo, logError, clearLogs } = useSystemLogger({
 *   maxLogs: 100,
 *   persistToSession: true,
 * });
 * 
 * // Add logs
 * logInfo('Starting process...');
 * logError('Something went wrong');
 * 
 * // Render logs
 * <SystemLoggerDisplay logs={logs} />
 * ```
 */
export function useSystemLogger(options: UseSystemLoggerOptions = {}): UseSystemLoggerReturn {
  const {
    maxLogs = 500,
    persistToSession = false,
    storageKey = 'protocol-os-logs',
  } = options;

  // Initialize logs from session storage if persistence is enabled
  const getInitialLogs = (): ExecutionLogEntry[] => {
    if (persistToSession && typeof sessionStorage !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore parse errors
      }
    }
    return [];
  };

  const [logs, setLogs] = useState<ExecutionLogEntry[]>(getInitialLogs);
  const logsRef = useRef<ExecutionLogEntry[]>(logs);
  logsRef.current = logs;

  // Persist logs to session storage
  const persistLogs = useCallback((newLogs: ExecutionLogEntry[]) => {
    if (persistToSession && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(newLogs));
      } catch {
        // Ignore storage errors (quota exceeded, etc.)
      }
    }
  }, [persistToSession, storageKey]);

  // Add a new log entry
  const addLog = useCallback((level: ExecutionLogEntry['level'], message: string) => {
    const newEntry: ExecutionLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    setLogs((prevLogs) => {
      // Trim logs if exceeding max
      const updatedLogs = [...prevLogs, newEntry];
      if (updatedLogs.length > maxLogs) {
        updatedLogs.splice(0, updatedLogs.length - maxLogs);
      }
      persistLogs(updatedLogs);
      return updatedLogs;
    });
  }, [maxLogs, persistLogs]);

  // Convenience methods for each log level
  const logSystem = useCallback((message: string) => addLog('SYSTEM', message), [addLog]);
  const logInfo = useCallback((message: string) => addLog('INFO', message), [addLog]);
  const logSuccess = useCallback((message: string) => addLog('SUCCESS', message), [addLog]);
  const logWarning = useCallback((message: string) => addLog('WARNING', message), [addLog]);
  const logError = useCallback((message: string) => addLog('ERROR', message), [addLog]);

  // Clear all logs
  const clearLogs = useCallback(() => {
    setLogs([]);
    if (persistToSession && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(storageKey);
    }
  }, [persistToSession, storageKey]);

  // Export logs as JSON
  const exportLogs = useCallback((): string => {
    return JSON.stringify(logsRef.current, null, 2);
  }, []);

  // Import logs from JSON
  const importLogs = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        setLogs(parsed);
        persistLogs(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [persistLogs]);

  // Get logs filtered by level
  const getLogsByLevel = useCallback((level: ExecutionLogEntry['level']): ExecutionLogEntry[] => {
    return logsRef.current.filter((log) => log.level === level);
  }, []);

  // Get count of logs by level
  const getLogCountByLevel = useCallback((): Record<ExecutionLogEntry['level'], number> => {
    const counts: Record<ExecutionLogEntry['level'], number> = {
      SYSTEM: 0,
      INFO: 0,
      SUCCESS: 0,
      WARNING: 0,
      ERROR: 0,
    };

    logsRef.current.forEach((log) => {
      counts[log.level]++;
    });

    return counts;
  }, []);

  return {
    logs,
    addLog,
    logSystem,
    logInfo,
    logSuccess,
    logWarning,
    logError,
    clearLogs,
    exportLogs,
    importLogs,
    getLogsByLevel,
    getLogCountByLevel,
  };
}

export default useSystemLogger;
