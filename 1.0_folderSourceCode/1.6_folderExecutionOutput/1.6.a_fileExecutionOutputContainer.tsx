// ============================================
// PROTOCOL OS - EXECUTION OUTPUT CONTAINER
// ============================================
// Address: 1.6.a
// Purpose: Main Container for Execution Output Display
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ExecutionMetricsPanel } from './1.6.b_fileExecutionMetricsPanel';
import { ExecutionLogsPanel } from './1.6.c_fileExecutionLogsPanel';
import { ExecutionResponsePanel } from './1.6.d_fileExecutionResponsePanel';
import './1.6.e_fileExecutionOutputDisplay.css';

/**
 * Execution Output Container
 * 
 * Orchestrates the display of execution results including:
 * - Performance metrics (timing, size, status)
 * - Execution logs (request/response flow)
 * - Response data (headers, body, cookies)
 * 
 * Implements Intent Tensor Theory principles for
 * recursive collapse visualization of API handshakes.
 */

/**
 * Execution status
 */
export type ExecutionStatus = 
  | 'idle'
  | 'preparing'
  | 'connecting'
  | 'sending'
  | 'waiting'
  | 'receiving'
  | 'complete'
  | 'error'
  | 'timeout'
  | 'cancelled';

/**
 * Execution phase for ITT mapping
 */
export type ExecutionPhase = 
  | 'genesis'      // Δ₁ - Request initialization
  | 'transform'    // Δ₂ - Request transformation
  | 'transmit'     // Δ₃ - Network transmission
  | 'collapse'     // Δ₄ - Response reception
  | 'validate'     // Δ₅ - Response validation
  | 'complete';    // Δ₆ - Execution complete

/**
 * Timing breakdown
 */
export interface ExecutionTiming {
  /** DNS lookup time (ms) */
  dns?: number;
  
  /** TCP connection time (ms) */
  connect?: number;
  
  /** TLS handshake time (ms) */
  ssl?: number;
  
  /** Time to send request (ms) */
  send?: number;
  
  /** Time waiting for first byte (ms) */
  wait?: number;
  
  /** Time to receive response (ms) */
  receive?: number;
  
  /** Total execution time (ms) */
  total: number;
  
  /** Timestamp when execution started */
  startedAt: Date;
  
  /** Timestamp when execution completed */
  completedAt?: Date;
}

/**
 * Log entry
 */
export interface ExecutionLogEntry {
  /** Unique ID */
  id: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  
  /** Log phase */
  phase: ExecutionPhase;
  
  /** Log message */
  message: string;
  
  /** Additional data */
  data?: unknown;
  
  /** Duration since start (ms) */
  elapsed?: number;
}

/**
 * Response data
 */
export interface ExecutionResponse {
  /** HTTP status code */
  statusCode: number;
  
  /** Status text */
  statusText: string;
  
  /** Response headers */
  headers: Record<string, string>;
  
  /** Response body */
  body?: unknown;
  
  /** Body size in bytes */
  bodySize?: number;
  
  /** Content type */
  contentType?: string;
  
  /** Response cookies */
  cookies?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
  }>;
  
  /** Redirect chain */
  redirects?: Array<{
    url: string;
    statusCode: number;
  }>;
}

/**
 * Request data for display
 */
export interface ExecutionRequest {
  /** HTTP method */
  method: string;
  
  /** Request URL */
  url: string;
  
  /** Request headers */
  headers: Record<string, string>;
  
  /** Request body */
  body?: unknown;
  
  /** Body size in bytes */
  bodySize?: number;
}

/**
 * Complete execution result
 */
export interface ExecutionResult {
  /** Unique execution ID */
  id: string;
  
  /** Handshake serial reference */
  handshakeSerial: string;
  
  /** Execution status */
  status: ExecutionStatus;
  
  /** Current phase */
  phase: ExecutionPhase;
  
  /** Was execution successful */
  success: boolean;
  
  /** Request data */
  request: ExecutionRequest;
  
  /** Response data */
  response?: ExecutionResponse;
  
  /** Timing breakdown */
  timing: ExecutionTiming;
  
  /** Execution logs */
  logs: ExecutionLogEntry[];
  
  /** Error message if failed */
  error?: string;
  
  /** Error details */
  errorDetails?: {
    code?: string;
    stack?: string;
    cause?: string;
  };
  
  /** Retry count */
  retryCount: number;
  
  /** Max retries allowed */
  maxRetries: number;
}

/**
 * Execution output container props
 */
export interface ExecutionOutputContainerProps {
  /** Execution result */
  result: ExecutionResult | null;
  
  /** Is currently executing */
  isExecuting?: boolean;
  
  /** Current execution progress (0-100) */
  progress?: number;
  
  /** Show request details */
  showRequest?: boolean;
  
  /** Show timing breakdown */
  showTiming?: boolean;
  
  /** Show logs panel */
  showLogs?: boolean;
  
  /** Default active panel */
  defaultPanel?: 'response' | 'logs' | 'metrics';
  
  /** Max log entries to display */
  maxLogEntries?: number;
  
  /** Auto-scroll logs */
  autoScrollLogs?: boolean;
  
  /** On retry handler */
  onRetry?: () => void;
  
  /** On cancel handler */
  onCancel?: () => void;
  
  /** On copy response */
  onCopyResponse?: (data: string) => void;
  
  /** On download response */
  onDownloadResponse?: (data: unknown, filename: string) => void;
  
  /** Custom class name */
  className?: string;
  
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Execution Output Container Component
 */
export const ExecutionOutputContainer: React.FC<ExecutionOutputContainerProps> = ({
  result,
  isExecuting = false,
  progress = 0,
  showRequest = true,
  showTiming = true,
  showLogs = true,
  defaultPanel = 'response',
  maxLogEntries = 100,
  autoScrollLogs = true,
  onRetry,
  onCancel,
  onCopyResponse,
  onDownloadResponse,
  className = '',
  style,
}) => {
  // ============================================
  // STATE
  // ============================================

  const [activePanel, setActivePanel] = useState<'response' | 'logs' | 'metrics'>(defaultPanel);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedLogLevel, setSelectedLogLevel] = useState<'all' | 'debug' | 'info' | 'warn' | 'error'>('all');

  // ============================================
  // EFFECTS
  // ============================================

  // Auto-switch to logs panel when executing
  useEffect(() => {
    if (isExecuting) {
      setActivePanel('logs');
    }
  }, [isExecuting]);

  // Switch to response panel when complete
  useEffect(() => {
    if (result?.status === 'complete' && result.response) {
      setActivePanel('response');
    }
  }, [result?.status, result?.response]);

  // ============================================
  // COMPUTED
  // ============================================

  const statusInfo = useMemo(() => {
    if (!result) return null;
    
    const statusMap: Record<ExecutionStatus, { icon: string; label: string; color: string }> = {
      idle: { icon: '○', label: 'Idle', color: 'neutral' },
      preparing: { icon: '◐', label: 'Preparing', color: 'info' },
      connecting: { icon: '◑', label: 'Connecting', color: 'info' },
      sending: { icon: '◒', label: 'Sending', color: 'info' },
      waiting: { icon: '◓', label: 'Waiting', color: 'warning' },
      receiving: { icon: '◔', label: 'Receiving', color: 'info' },
      complete: { icon: '✓', label: 'Complete', color: 'success' },
      error: { icon: '✗', label: 'Error', color: 'error' },
      timeout: { icon: '⏱', label: 'Timeout', color: 'warning' },
      cancelled: { icon: '⊘', label: 'Cancelled', color: 'neutral' },
    };
    
    return statusMap[result.status] || statusMap.idle;
  }, [result?.status]);

  const phaseInfo = useMemo(() => {
    if (!result) return null;
    
    const phaseMap: Record<ExecutionPhase, { operator: string; label: string }> = {
      genesis: { operator: 'Δ₁', label: 'Genesis' },
      transform: { operator: 'Δ₂', label: 'Transform' },
      transmit: { operator: 'Δ₃', label: 'Transmit' },
      collapse: { operator: 'Δ₄', label: 'Collapse' },
      validate: { operator: 'Δ₅', label: 'Validate' },
      complete: { operator: 'Δ₆', label: 'Complete' },
    };
    
    return phaseMap[result.phase] || phaseMap.genesis;
  }, [result?.phase]);

  const filteredLogs = useMemo(() => {
    if (!result?.logs) return [];
    
    let logs = result.logs;
    
    if (selectedLogLevel !== 'all') {
      logs = logs.filter(log => log.level === selectedLogLevel);
    }
    
    return logs.slice(-maxLogEntries);
  }, [result?.logs, selectedLogLevel, maxLogEntries]);

  const logCounts = useMemo(() => {
    if (!result?.logs) return { debug: 0, info: 0, warn: 0, error: 0 };
    
    return result.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, { debug: 0, info: 0, warn: 0, error: 0 } as Record<string, number>);
  }, [result?.logs]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleCopy = useCallback(async () => {
    if (!result?.response?.body) return;
    
    const data = typeof result.response.body === 'string' 
      ? result.response.body 
      : JSON.stringify(result.response.body, null, 2);
    
    if (onCopyResponse) {
      onCopyResponse(data);
    } else {
      try {
        await navigator.clipboard.writeText(data);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, [result?.response?.body, onCopyResponse]);

  const handleDownload = useCallback(() => {
    if (!result?.response?.body || !onDownloadResponse) return;
    
    const contentType = result.response.contentType || 'application/json';
    const extension = contentType.includes('json') ? 'json' : 
                      contentType.includes('xml') ? 'xml' :
                      contentType.includes('html') ? 'html' : 'txt';
    
    const filename = `response-${result.id}.${extension}`;
    onDownloadResponse(result.response.body, filename);
  }, [result, onDownloadResponse]);

  // ============================================
  // RENDER
  // ============================================

  const containerClasses = [
    'execution-output-container',
    isExecuting ? 'execution-output-container--executing' : '',
    result?.success ? 'execution-output-container--success' : '',
    result?.status === 'error' ? 'execution-output-container--error' : '',
    isExpanded ? 'execution-output-container--expanded' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} style={style}>
      {/* Header */}
      <div className="execution-output-container__header">
        <div className="execution-output-container__header-left">
          <button
            type="button"
            className="execution-output-container__toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse output' : 'Expand output'}
          >
            <span className={`execution-output-container__toggle-icon ${isExpanded ? 'execution-output-container__toggle-icon--expanded' : ''}`}>
              ▶
            </span>
          </button>
          
          <h3 className="execution-output-container__title">
            Execution Output
          </h3>
          
          {statusInfo && (
            <span className={`execution-output-container__status execution-output-container__status--${statusInfo.color}`}>
              <span className="execution-output-container__status-icon">
                {isExecuting ? <span className="execution-output-container__spinner">⏳</span> : statusInfo.icon}
              </span>
              <span className="execution-output-container__status-label">
                {statusInfo.label}
              </span>
            </span>
          )}
          
          {phaseInfo && isExecuting && (
            <span className="execution-output-container__phase">
              <span className="execution-output-container__phase-operator">
                {phaseInfo.operator}
              </span>
              <span className="execution-output-container__phase-label">
                {phaseInfo.label}
              </span>
            </span>
          )}
        </div>
        
        <div className="execution-output-container__header-right">
          {result?.timing && (
            <span className="execution-output-container__duration">
              ⏱ {result.timing.total}ms
            </span>
          )}
          
          {result?.response?.statusCode && (
            <span className={`execution-output-container__http-status execution-output-container__http-status--${getStatusClass(result.response.statusCode)}`}>
              {result.response.statusCode} {result.response.statusText}
            </span>
          )}
          
          {isExecuting && onCancel && (
            <button
              type="button"
              className="execution-output-container__cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          
          {result?.status === 'error' && onRetry && result.retryCount < result.maxRetries && (
            <button
              type="button"
              className="execution-output-container__retry-btn"
              onClick={onRetry}
            >
              Retry ({result.retryCount}/{result.maxRetries})
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isExecuting && (
        <div className="execution-output-container__progress">
          <div 
            className="execution-output-container__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="execution-output-container__content">
          {/* Panel Tabs */}
          <div className="execution-output-container__tabs">
            <button
              type="button"
              className={`execution-output-container__tab ${activePanel === 'response' ? 'execution-output-container__tab--active' : ''}`}
              onClick={() => setActivePanel('response')}
            >
              Response
              {result?.response && (
                <span className={`execution-output-container__tab-badge execution-output-container__tab-badge--${result.success ? 'success' : 'error'}`}>
                  {result.response.statusCode}
                </span>
              )}
            </button>
            
            {showLogs && (
              <button
                type="button"
                className={`execution-output-container__tab ${activePanel === 'logs' ? 'execution-output-container__tab--active' : ''}`}
                onClick={() => setActivePanel('logs')}
              >
                Logs
                <span className="execution-output-container__tab-count">
                  ({result?.logs.length || 0})
                </span>
                {logCounts.error > 0 && (
                  <span className="execution-output-container__tab-badge execution-output-container__tab-badge--error">
                    {logCounts.error}
                  </span>
                )}
              </button>
            )}
            
            {showTiming && (
              <button
                type="button"
                className={`execution-output-container__tab ${activePanel === 'metrics' ? 'execution-output-container__tab--active' : ''}`}
                onClick={() => setActivePanel('metrics')}
              >
                Metrics
              </button>
            )}
          </div>

          {/* Panel Content */}
          <div className="execution-output-container__panel">
            {activePanel === 'response' && (
              <ExecutionResponsePanel
                request={showRequest ? result?.request : undefined}
                response={result?.response}
                error={result?.error}
                errorDetails={result?.errorDetails}
                onCopy={handleCopy}
                onDownload={onDownloadResponse ? handleDownload : undefined}
              />
            )}
            
            {activePanel === 'logs' && showLogs && (
              <ExecutionLogsPanel
                logs={filteredLogs}
                selectedLevel={selectedLogLevel}
                onLevelChange={setSelectedLogLevel}
                logCounts={logCounts}
                autoScroll={autoScrollLogs}
                isExecuting={isExecuting}
              />
            )}
            
            {activePanel === 'metrics' && showTiming && (
              <ExecutionMetricsPanel
                timing={result?.timing}
                request={result?.request}
                response={result?.response}
                status={result?.status}
                phase={result?.phase}
              />
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !isExecuting && isExpanded && (
        <div className="execution-output-container__empty">
          <div className="execution-output-container__empty-icon">📡</div>
          <div className="execution-output-container__empty-text">
            No execution results yet
          </div>
          <div className="execution-output-container__empty-hint">
            Execute a handshake to see results here
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get HTTP status class
 */
function getStatusClass(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return 'success';
  if (statusCode >= 300 && statusCode < 400) return 'redirect';
  if (statusCode >= 400 && statusCode < 500) return 'client-error';
  if (statusCode >= 500) return 'server-error';
  return 'unknown';
}

/**
 * Compact execution summary
 */
export interface ExecutionSummaryProps {
  result: ExecutionResult | null;
  isExecuting?: boolean;
  className?: string;
}

export const ExecutionSummary: React.FC<ExecutionSummaryProps> = ({
  result,
  isExecuting = false,
  className = '',
}) => {
  if (!result && !isExecuting) return null;
  
  return (
    <div className={`execution-summary ${className}`}>
      {isExecuting ? (
        <div className="execution-summary__executing">
          <span className="execution-summary__spinner">⏳</span>
          <span>Executing...</span>
        </div>
      ) : result ? (
        <div className={`execution-summary__result execution-summary__result--${result.success ? 'success' : 'error'}`}>
          <span className="execution-summary__icon">
            {result.success ? '✓' : '✗'}
          </span>
          <span className="execution-summary__status">
            {result.response?.statusCode} {result.response?.statusText}
          </span>
          <span className="execution-summary__duration">
            {result.timing.total}ms
          </span>
        </div>
      ) : null}
    </div>
  );
};

/**
 * Create empty execution result
 */
export function createEmptyExecutionResult(handshakeSerial: string): ExecutionResult {
  return {
    id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    handshakeSerial,
    status: 'idle',
    phase: 'genesis',
    success: false,
    request: {
      method: 'GET',
      url: '',
      headers: {},
    },
    timing: {
      total: 0,
      startedAt: new Date(),
    },
    logs: [],
    retryCount: 0,
    maxRetries: 3,
  };
}

/**
 * Add log entry helper
 */
export function addLogEntry(
  result: ExecutionResult,
  level: ExecutionLogEntry['level'],
  phase: ExecutionPhase,
  message: string,
  data?: unknown
): ExecutionResult {
  const now = new Date();
  const elapsed = now.getTime() - result.timing.startedAt.getTime();
  
  return {
    ...result,
    logs: [
      ...result.logs,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        level,
        phase,
        message,
        data,
        elapsed,
      },
    ],
  };
}

export default ExecutionOutputContainer;
