// ============================================
// PROTOCOL OS - EKG STATUS INDICATOR HOOK
// ============================================
// Address: 1.7.2.b
// Purpose: Custom hook for managing EKG status state and transitions
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import type { HandshakeStatus } from '@types/1.9.c_fileHandshakeTypeDefinitions';

/**
 * Options for the useEkgStatus hook
 */
export interface UseEkgStatusOptions {
  /** Initial status (default: 'unconfigured') */
  initialStatus?: HandshakeStatus;
  
  /** Auto-reset to previous status after processing (ms) */
  processingTimeout?: number;
  
  /** Auto-reset failed status after delay (ms, 0 = never) */
  failedResetDelay?: number;
  
  /** Callback when status changes */
  onStatusChange?: (newStatus: HandshakeStatus, previousStatus: HandshakeStatus) => void;
}

/**
 * Return type for useEkgStatus hook
 */
export interface UseEkgStatusReturn {
  /** Current status */
  status: HandshakeStatus;
  
  /** Previous status (before current) */
  previousStatus: HandshakeStatus | null;
  
  /** Set status to unconfigured */
  setUnconfigured: () => void;
  
  /** Set status to configured */
  setConfigured: () => void;
  
  /** Set status to healthy */
  setHealthy: () => void;
  
  /** Set status to failed */
  setFailed: () => void;
  
  /** Set status to processing */
  setProcessing: () => void;
  
  /** Set any status directly */
  setStatus: (status: HandshakeStatus) => void;
  
  /** Check if currently in a specific status */
  isStatus: (status: HandshakeStatus) => boolean;
  
  /** Check if status indicates an error state */
  isErrorState: boolean;
  
  /** Check if status indicates success */
  isSuccessState: boolean;
  
  /** Check if status is in transition (processing) */
  isTransitioning: boolean;
  
  /** Time spent in current status (ms) */
  statusDuration: number;
  
  /** Reset to initial status */
  reset: () => void;
}

/**
 * Custom hook for managing EKG status state
 * 
 * Provides status management with optional auto-reset behaviors,
 * status history tracking, and convenient state checks.
 * 
 * @example
 * ```tsx
 * const {
 *   status,
 *   setProcessing,
 *   setHealthy,
 *   setFailed,
 *   isErrorState,
 * } = useEkgStatus({
 *   initialStatus: 'configured',
 *   onStatusChange: (newStatus) => console.log('Status:', newStatus),
 * });
 * 
 * // Start execution
 * setProcessing();
 * 
 * // On success
 * setHealthy();
 * 
 * // On failure
 * setFailed();
 * ```
 */
export function useEkgStatus(options: UseEkgStatusOptions = {}): UseEkgStatusReturn {
  const {
    initialStatus = 'unconfigured',
    processingTimeout = 0,
    failedResetDelay = 0,
    onStatusChange,
  } = options;

  const [status, setStatusInternal] = useState<HandshakeStatus>(initialStatus);
  const [previousStatus, setPreviousStatus] = useState<HandshakeStatus | null>(null);
  const [statusStartTime, setStatusStartTime] = useState<number>(Date.now());
  const [statusDuration, setStatusDuration] = useState<number>(0);

  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;

  // Update duration every second while in current status
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setStatusDuration(Date.now() - statusStartTime);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [statusStartTime]);

  // Set status with history tracking
  const setStatus = useCallback((newStatus: HandshakeStatus) => {
    setStatusInternal((prevStatus) => {
      if (prevStatus !== newStatus) {
        setPreviousStatus(prevStatus);
        setStatusStartTime(Date.now());
        setStatusDuration(0);
        
        // Call status change callback
        if (onStatusChangeRef.current) {
          onStatusChangeRef.current(newStatus, prevStatus);
        }
      }
      return newStatus;
    });

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Auto-reset processing status
  useEffect(() => {
    if (status === 'processing' && processingTimeout > 0) {
      timeoutRef.current = window.setTimeout(() => {
        // Reset to previous status or configured
        setStatus(previousStatus === 'processing' ? 'configured' : (previousStatus ?? 'configured'));
      }, processingTimeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [status, processingTimeout, previousStatus, setStatus]);

  // Auto-reset failed status
  useEffect(() => {
    if (status === 'failed' && failedResetDelay > 0) {
      timeoutRef.current = window.setTimeout(() => {
        setStatus('configured');
      }, failedResetDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [status, failedResetDelay, setStatus]);

  // Convenience setters
  const setUnconfigured = useCallback(() => setStatus('unconfigured'), [setStatus]);
  const setConfigured = useCallback(() => setStatus('configured'), [setStatus]);
  const setHealthy = useCallback(() => setStatus('healthy'), [setStatus]);
  const setFailed = useCallback(() => setStatus('failed'), [setStatus]);
  const setProcessing = useCallback(() => setStatus('processing'), [setStatus]);

  // Status checks
  const isStatus = useCallback((checkStatus: HandshakeStatus) => status === checkStatus, [status]);
  const isErrorState = status === 'failed';
  const isSuccessState = status === 'healthy';
  const isTransitioning = status === 'processing';

  // Reset to initial status
  const reset = useCallback(() => {
    setStatus(initialStatus);
    setPreviousStatus(null);
  }, [initialStatus, setStatus]);

  return {
    status,
    previousStatus,
    setUnconfigured,
    setConfigured,
    setHealthy,
    setFailed,
    setProcessing,
    setStatus,
    isStatus,
    isErrorState,
    isSuccessState,
    isTransitioning,
    statusDuration,
    reset,
  };
}

/**
 * Derive EKG status from execution result
 */
export function deriveStatusFromExecution(
  success: boolean,
  isExecuting: boolean
): HandshakeStatus {
  if (isExecuting) return 'processing';
  if (success) return 'healthy';
  return 'failed';
}

/**
 * Derive EKG status from configuration state
 */
export function deriveStatusFromConfiguration(
  hasRequiredFields: boolean,
  hasBeenExecuted: boolean,
  lastExecutionSucceeded: boolean | null
): HandshakeStatus {
  if (!hasRequiredFields) return 'unconfigured';
  if (!hasBeenExecuted) return 'configured';
  if (lastExecutionSucceeded === true) return 'healthy';
  if (lastExecutionSucceeded === false) return 'failed';
  return 'configured';
}

export default useEkgStatus;
