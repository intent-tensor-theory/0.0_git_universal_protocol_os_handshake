// ============================================
// PROTOCOL OS - WEBSOCKET UTILITIES
// ============================================
// Address: 1.4.8.b
// Purpose: Utility functions for WebSocket operations
// ============================================

/**
 * WebSocket ready states
 */
export const WS_READY_STATES = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

/**
 * WebSocket close codes
 */
export const WS_CLOSE_CODES = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_DATA: 1007,
  POLICY_VIOLATION: 1008,
  TOO_LARGE: 1009,
  MISSING_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN: 1013,
} as const;

/**
 * Get human-readable close code description
 */
export function getCloseCodeDescription(code: number): string {
  const descriptions: Record<number, string> = {
    1000: 'Normal closure',
    1001: 'Going away',
    1002: 'Protocol error',
    1003: 'Unsupported data',
    1005: 'No status received',
    1006: 'Abnormal closure',
    1007: 'Invalid frame payload',
    1008: 'Policy violation',
    1009: 'Message too big',
    1010: 'Missing extension',
    1011: 'Internal server error',
    1012: 'Service restart',
    1013: 'Try again later',
  };
  return descriptions[code] || `Unknown code: ${code}`;
}

/**
 * Create reconnecting WebSocket wrapper
 */
export function createReconnectingWebSocket(
  url: string,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    onConnect?: () => void;
    onMessage?: (data: unknown) => void;
    onError?: (error: Event) => void;
    onClose?: (code: number) => void;
  }
): { connect: () => void; send: (data: string) => void; close: () => void } {
  const { maxRetries = 5, retryDelay = 1000, onConnect, onMessage, onError, onClose } = options || {};
  
  let ws: WebSocket | null = null;
  let retries = 0;
  let shouldReconnect = true;

  const connect = () => {
    ws = new WebSocket(url);
    
    ws.onopen = () => {
      retries = 0;
      onConnect?.();
    };
    
    ws.onmessage = (event) => onMessage?.(event.data);
    ws.onerror = (error) => onError?.(error);
    
    ws.onclose = (event) => {
      onClose?.(event.code);
      
      if (shouldReconnect && retries < maxRetries) {
        retries++;
        setTimeout(connect, retryDelay * retries);
      }
    };
  };

  const send = (data: string) => {
    if (ws?.readyState === WS_READY_STATES.OPEN) {
      ws.send(data);
    }
  };

  const close = () => {
    shouldReconnect = false;
    ws?.close();
  };

  return { connect, send, close };
}

/**
 * Create ping/pong heartbeat
 */
export function createHeartbeat(
  ws: WebSocket,
  interval: number = 30000,
  pingMessage: string = 'ping'
): { start: () => void; stop: () => void } {
  let intervalId: number | null = null;

  const start = () => {
    intervalId = window.setInterval(() => {
      if (ws.readyState === WS_READY_STATES.OPEN) {
        ws.send(pingMessage);
      }
    }, interval);
  };

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  return { start, stop };
}
