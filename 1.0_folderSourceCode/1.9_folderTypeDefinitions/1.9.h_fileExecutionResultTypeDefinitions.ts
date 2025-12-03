// ============================================
// PROTOCOL OS - EXECUTION RESULT TYPE DEFINITIONS
// ============================================
// Address: 1.9.h
// Purpose: Types for execution results and logging
// ============================================

import type { EntityId, HttpHeaders } from './1.9.a_fileCoreTypeDefinitions';

/**
 * Log entry level
 */
export type LogLevel = 'SYSTEM' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DEBUG';

/**
 * Execution log entry
 */
export interface ExecutionLogEntry {
  /** Timestamp of the log entry */
  timestamp: string;
  
  /** Log level */
  level: LogLevel;
  
  /** Log message */
  message: string;
  
  /** Additional data */
  data?: unknown;
  
  /** Source of the log (component/request) */
  source?: string;
  
  /** Duration if applicable */
  duration?: number;
}

/**
 * Execution metrics
 */
export interface ExecutionMetrics {
  /** Start time */
  startTime: string;
  
  /** End time */
  endTime: string;
  
  /** Total duration in milliseconds */
  totalDurationMs: number;
  
  /** HTTP status code */
  statusCode?: number;
  
  /** Response size in bytes */
  responseSize?: number;
  
  /** Time to first byte */
  ttfb?: number;
  
  /** DNS lookup time */
  dnsTime?: number;
  
  /** Connection time */
  connectTime?: number;
  
  /** TLS handshake time */
  tlsTime?: number;
  
  /** Request sent time */
  sendTime?: number;
  
  /** Response receive time */
  receiveTime?: number;
}

/**
 * Single request execution result
 */
export interface RequestExecutionResult {
  /** Request ID */
  requestId: EntityId;
  
  /** Request serial number */
  serial: number;
  
  /** Whether request succeeded */
  success: boolean;
  
  /** Execution metrics */
  metrics: ExecutionMetrics;
  
  /** Response headers */
  headers?: HttpHeaders;
  
  /** Response body */
  responseBody?: unknown;
  
  /** Error message if failed */
  error?: string;
  
  /** Assertion results */
  assertions?: Array<{
    name: string;
    passed: boolean;
    expected?: unknown;
    actual?: unknown;
    message?: string;
  }>;
  
  /** Extracted variables */
  extractedVariables?: Record<string, string>;
  
  /** Logs for this request */
  logs: ExecutionLogEntry[];
}

/**
 * Handshake execution result
 */
export interface HandshakeExecutionResult {
  /** Whether overall execution succeeded */
  success: boolean;
  
  /** Overall metrics */
  metrics: ExecutionMetrics;
  
  /** Response headers (from last request or aggregate) */
  headers?: HttpHeaders;
  
  /** Response body (from last request) */
  responseBody?: unknown;
  
  /** Error message if failed */
  error?: string;
  
  /** Individual request results */
  requestResults?: RequestExecutionResult[];
  
  /** Accumulated variables */
  variables?: Record<string, string>;
  
  /** All logs */
  logs: ExecutionLogEntry[];
  
  /** Warnings */
  warnings?: string[];
}

/**
 * Configuration validation result
 */
export interface ConfigurationValidationResult {
  /** Whether configuration is valid */
  valid: boolean;
  
  /** Missing required fields */
  missingFields: string[];
  
  /** Invalid field values */
  invalidFields: Array<{
    field: string;
    reason: string;
  }>;
  
  /** Warnings (non-blocking) */
  warnings: string[];
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  /** Whether connection test passed */
  success: boolean;
  
  /** Status message */
  message: string;
  
  /** Response time in ms */
  responseTime?: number;
  
  /** Server info if available */
  serverInfo?: {
    version?: string;
    headers?: HttpHeaders;
  };
  
  /** Error details if failed */
  error?: string;
}

/**
 * Authentication result
 */
export interface AuthenticationResult {
  /** Whether authentication succeeded */
  success: boolean;
  
  /** Credentials obtained */
  credentials?: {
    type: string;
    value: string;
    expiresAt?: string;
  };
  
  /** Error message if failed */
  error?: string;
  
  /** Logs */
  logs: ExecutionLogEntry[];
}

/**
 * Token refresh result
 */
export interface TokenRefreshResult {
  /** Whether refresh succeeded */
  success: boolean;
  
  /** New credentials */
  credentials?: {
    accessToken: string;
    expiresAt?: string;
    refreshToken?: string;
  };
  
  /** Error message if failed */
  error?: string;
}

/**
 * Execution summary for history
 */
export interface ExecutionSummary {
  /** Execution ID */
  id: EntityId;
  
  /** Handshake ID */
  handshakeId: EntityId;
  
  /** Resource ID */
  resourceId: EntityId;
  
  /** Platform ID */
  platformId: EntityId;
  
  /** Start time */
  startedAt: string;
  
  /** End time */
  completedAt: string;
  
  /** Overall success */
  success: boolean;
  
  /** Total duration */
  durationMs: number;
  
  /** Number of requests executed */
  requestCount: number;
  
  /** Number of successful requests */
  successCount: number;
  
  /** Number of failed requests */
  failedCount: number;
  
  /** Error summary */
  errorSummary?: string;
}

/**
 * Execution progress
 */
export interface ExecutionProgress {
  /** Current step */
  currentStep: number;
  
  /** Total steps */
  totalSteps: number;
  
  /** Progress percentage */
  percentage: number;
  
  /** Current action description */
  currentAction: string;
  
  /** Estimated time remaining (ms) */
  estimatedTimeRemaining?: number;
}
