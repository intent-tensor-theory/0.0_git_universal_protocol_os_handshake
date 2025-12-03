// ============================================
// PROTOCOL OS - EXECUTION RESULT TYPE DEFINITIONS
// ============================================
// Address: 1.9.h
// Purpose: Define types for handshake execution results
// ============================================

/**
 * HTTP status code ranges for categorization
 */
export type HttpStatusCategory =
  | 'informational'  // 1xx
  | 'success'        // 2xx
  | 'redirect'       // 3xx
  | 'client-error'   // 4xx
  | 'server-error';  // 5xx

/**
 * Response content type categories
 */
export type ResponseContentType =
  | 'json'
  | 'xml'
  | 'html'
  | 'text'
  | 'binary'
  | 'image'
  | 'unknown';

/**
 * Individual log entry during execution
 */
export interface ExecutionLogEntry {
  /** Timestamp of log entry */
  timestamp: string;
  
  /** Log level */
  level: 'SYSTEM' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  
  /** Log message */
  message: string;
}

/**
 * Metrics collected during execution
 */
export interface ExecutionMetrics {
  /** HTTP status code */
  status: number;
  
  /** Status category */
  statusCategory: HttpStatusCategory;
  
  /** Total execution duration in milliseconds */
  durationMs: number;
  
  /** HTTP method used */
  method: string;
  
  /** Response size in bytes */
  sizeBytes: number;
  
  /** Time to first byte (TTFB) in ms */
  ttfb?: number;
  
  /** DNS lookup time in ms */
  dnsTime?: number;
  
  /** SSL handshake time in ms */
  sslTime?: number;
  
  /** Number of redirects followed */
  redirectCount?: number;
}

/**
 * Response headers captured
 */
export interface ResponseHeaders {
  /** Content-Type header */
  contentType?: string;
  
  /** Content-Length header */
  contentLength?: string;
  
  /** All headers as key-value pairs */
  all: Record<string, string>;
}

/**
 * Complete execution result from a handshake
 */
export interface HandshakeExecutionResult {
  /** Whether the execution was successful (2xx status) */
  success: boolean;
  
  /** Execution metrics */
  metrics: ExecutionMetrics;
  
  /** Response headers */
  headers: ResponseHeaders;
  
  /** 
   * Response body.
   * For JSON responses, this is the parsed object.
   * For text, this is the raw string.
   * For binary, this is a base64 encoded string.
   */
  responseBody: unknown;
  
  /** Detected content type of response */
  contentType: ResponseContentType;
  
  /** 
   * Raw response text (for display in output panel).
   * For objects, this is JSON.stringify with formatting.
   */
  responseText: string;
  
  /** Execution log entries */
  logs: ExecutionLogEntry[];
  
  /** Error message if execution failed */
  errorMessage?: string;
  
  /** Error stack trace (for debugging) */
  errorStack?: string;
  
  /** Timestamp when execution started */
  startedAt: string;
  
  /** Timestamp when execution completed */
  completedAt: string;
  
  /** The handshake ID that was executed */
  handshakeId: string;
  
  /** The protocol type used */
  protocolType: string;
  
  /** Input that was provided */
  inputProvided?: {
    type: 'text' | 'file';
    value: string;
    fileName?: string;
  };
}

/**
 * Saved handshake configuration (for persistence)
 */
export interface SavedHandshakeSnapshot {
  /** Unique ID for this saved snapshot */
  id: string;
  
  /** Base name for versioning */
  baseName: string;
  
  /** Version string (e.g., 'v1.0', 'v1.1') */
  version: string;
  
  /** Serial number of the handshake */
  serial: string;
  
  /** Protocol type used */
  protocol: string;
  
  /** Input configuration at time of save */
  input: {
    model: string;
    dynamicText: string;
    dynamicFileName?: string;
  };
  
  /** Credential form values (sanitized) */
  config: Record<string, string>;
  
  /** Output from execution */
  output: {
    status: string;
    duration: string;
    method: string;
    size: string;
    logs: string;
    response: string;
  };
  
  /** Timestamp when saved */
  savedAt: string;
}

/**
 * WebSocket-specific execution result
 */
export interface WebSocketExecutionResult extends HandshakeExecutionResult {
  /** WebSocket connection state */
  connectionState: 'connecting' | 'open' | 'closing' | 'closed';
  
  /** Messages received */
  messagesReceived: Array<{
    timestamp: string;
    data: unknown;
  }>;
  
  /** Messages sent */
  messagesSent: Array<{
    timestamp: string;
    data: unknown;
  }>;
}

/**
 * Helper function to categorize HTTP status codes
 */
export function getHttpStatusCategory(status: number): HttpStatusCategory {
  if (status >= 100 && status < 200) return 'informational';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client-error';
  return 'server-error';
}

/**
 * Helper function to detect content type from headers
 */
export function detectContentType(contentTypeHeader?: string): ResponseContentType {
  if (!contentTypeHeader) return 'unknown';
  
  const lower = contentTypeHeader.toLowerCase();
  
  if (lower.includes('application/json')) return 'json';
  if (lower.includes('application/xml') || lower.includes('text/xml')) return 'xml';
  if (lower.includes('text/html')) return 'html';
  if (lower.includes('text/')) return 'text';
  if (lower.includes('image/')) return 'image';
  if (lower.includes('application/octet-stream')) return 'binary';
  
  return 'unknown';
}

/**
 * Create an empty/default execution result
 */
export function createEmptyExecutionResult(handshakeId: string): HandshakeExecutionResult {
  const now = new Date().toISOString();
  return {
    success: false,
    metrics: {
      status: 0,
      statusCategory: 'client-error',
      durationMs: 0,
      method: '',
      sizeBytes: 0,
    },
    headers: {
      all: {},
    },
    responseBody: null,
    contentType: 'unknown',
    responseText: '',
    logs: [],
    startedAt: now,
    completedAt: now,
    handshakeId,
    protocolType: '',
  };
}
