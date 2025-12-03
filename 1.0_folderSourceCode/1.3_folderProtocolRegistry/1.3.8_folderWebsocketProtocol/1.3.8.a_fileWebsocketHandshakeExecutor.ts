// ============================================
// PROTOCOL OS - WEBSOCKET HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.8.a
// Purpose: WebSocket Protocol Authentication and Connection
// ============================================

import {
  BaseProtocolModule,
  type ProtocolModuleMetadata,
  type ProtocolCapabilities,
  type ProtocolFieldDefinition,
  type ProtocolAuthenticationFlow,
  type ProtocolExecutionContext,
  type ProtocolExecutionResult,
  type ProtocolTokenRefreshResult,
  type ProtocolHealthCheckResult,
} from '../1.3.b_fileProtocolHandshakeModuleInterface';
import type { AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';

/**
 * WebSocket Protocol
 * 
 * WebSocket provides full-duplex communication channels over a single TCP
 * connection. Unlike HTTP, WebSocket enables:
 * - Persistent connections
 * - Bidirectional data flow
 * - Real-time updates
 * - Low latency messaging
 * 
 * Authentication Methods:
 * - Query parameter (token in URL)
 * - First message authentication
 * - HTTP headers (during handshake)
 * - Subprotocol negotiation
 */

/**
 * WebSocket authentication method
 */
export type WebSocketAuthMethod =
  | 'query-param'       // Token in URL: wss://api.example.com?token=xxx
  | 'first-message'     // Send auth message after connection
  | 'header'            // Auth header during HTTP upgrade (limited browser support)
  | 'subprotocol'       // Token in Sec-WebSocket-Protocol header
  | 'none';             // No authentication

/**
 * WebSocket message format
 */
export type WebSocketMessageFormat = 'json' | 'text' | 'binary';

/**
 * WebSocket connection state
 */
export type WebSocketConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'authenticating'
  | 'authenticated'
  | 'reconnecting'
  | 'error';

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: string;
  payload?: unknown;
  id?: string;
  timestamp?: number;
}

/**
 * WebSocket configuration
 */
export interface WebSocketConfiguration {
  /** WebSocket URL (wss:// or ws://) */
  url: string;
  
  /** Authentication method */
  authMethod: WebSocketAuthMethod;
  
  /** Auth token */
  authToken?: string;
  
  /** Query parameter name for token */
  tokenParamName?: string;
  
  /** Message format */
  messageFormat: WebSocketMessageFormat;
  
  /** Auth message type (for first-message auth) */
  authMessageType?: string;
  
  /** Auth message payload template */
  authMessageTemplate?: string;
  
  /** Ping interval (ms) for keep-alive */
  pingInterval?: number;
  
  /** Pong timeout (ms) */
  pongTimeout?: number;
  
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  
  /** Max reconnect attempts */
  maxReconnectAttempts?: number;
  
  /** Reconnect delay (ms) */
  reconnectDelay?: number;
  
  /** Subprotocols to request */
  subprotocols?: string[];
}

/**
 * WebSocket event handlers
 */
export interface WebSocketEventHandlers {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (data: unknown, raw: MessageEvent) => void;
  onStateChange?: (state: WebSocketConnectionState) => void;
  onReconnect?: (attempt: number) => void;
}

/**
 * WebSocket Protocol Module
 * 
 * Implements WebSocket connections with authentication support,
 * automatic reconnection, and message handling.
 */
export class WebSocketHandshakeExecutor extends BaseProtocolModule {
  private socket: WebSocket | null = null;
  private connectionState: WebSocketConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private pongTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: Array<{ data: unknown; resolve: (v: boolean) => void }> = [];
  private eventHandlers: WebSocketEventHandlers = {};
  private lastPongTime = 0;

  constructor() {
    super();
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'websocket',
      displayName: 'WebSocket',
      description: 'Real-time bidirectional communication over persistent connections.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/websocket',
      icon: 'zap',
      capabilities: this.getCapabilities(),
      useCases: [
        'Real-time chat applications',
        'Live data feeds',
        'Collaborative editing',
        'Gaming multiplayer',
        'IoT device communication',
        'Live notifications',
        'Streaming data',
        'Live dashboards',
      ],
      examplePlatforms: [
        'Socket.io',
        'Pusher',
        'Ably',
        'Phoenix Channels',
        'Action Cable',
        'SignalR',
        'AWS API Gateway WebSocket',
        'Firebase Realtime Database',
      ],
    };
  }

  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRedirectFlow: false,
      supportsTokenRefresh: false, // Managed separately
      supportsTokenRevocation: false,
      supportsScopes: false,
      supportsIncrementalAuth: false,
      supportsOfflineAccess: false, // Requires connection
      supportsPkce: false,
      requiresServerSide: false,
      browserCompatible: true,
      supportsRequestSigning: false,
      supportsAutoInjection: true,
    };
  }

  // ============================================
  // FIELD DEFINITIONS
  // ============================================

  getRequiredFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'url',
        label: 'WebSocket URL',
        type: 'url',
        required: true,
        description: 'The WebSocket endpoint URL (wss:// for secure, ws:// for local).',
        placeholder: 'wss://api.example.com/ws',
        group: 'connection',
        order: 1,
        validation: {
          pattern: '^wss?://.+',
          message: 'URL must start with ws:// or wss://',
        },
      },
      {
        id: 'authMethod',
        label: 'Authentication Method',
        type: 'select',
        required: true,
        description: 'How to authenticate the WebSocket connection.',
        defaultValue: 'query-param',
        options: [
          { value: 'query-param', label: 'Query Parameter (Token in URL)' },
          { value: 'first-message', label: 'First Message (Send auth after connect)' },
          { value: 'subprotocol', label: 'Subprotocol (Token in header)' },
          { value: 'none', label: 'No Authentication' },
        ],
        group: 'authentication',
        order: 1,
      },
      {
        id: 'messageFormat',
        label: 'Message Format',
        type: 'select',
        required: true,
        description: 'Format for sending and receiving messages.',
        defaultValue: 'json',
        options: [
          { value: 'json', label: 'JSON (Most Common)' },
          { value: 'text', label: 'Plain Text' },
          { value: 'binary', label: 'Binary (ArrayBuffer)' },
        ],
        group: 'messages',
        order: 1,
      },
    ];
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'authToken',
        label: 'Auth Token',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'Authentication token or API key.',
        placeholder: 'your-auth-token',
        group: 'authentication',
        order: 2,
        visibleWhen: { field: 'authMethod', notValue: 'none' },
      },
      {
        id: 'tokenParamName',
        label: 'Token Parameter Name',
        type: 'text',
        required: false,
        description: 'Query parameter name for the token.',
        defaultValue: 'token',
        placeholder: 'token',
        group: 'authentication',
        order: 3,
        visibleWhen: { field: 'authMethod', value: 'query-param' },
      },
      {
        id: 'authMessageType',
        label: 'Auth Message Type',
        type: 'text',
        required: false,
        description: 'Message type for authentication.',
        defaultValue: 'authenticate',
        placeholder: 'authenticate',
        group: 'authentication',
        order: 4,
        visibleWhen: { field: 'authMethod', value: 'first-message' },
      },
      {
        id: 'authMessageTemplate',
        label: 'Auth Message Template',
        type: 'json',
        required: false,
        description: 'JSON template for auth message. Use {{token}} for token placeholder.',
        defaultValue: '{"type": "authenticate", "token": "{{token}}"}',
        placeholder: '{"type": "auth", "token": "{{token}}"}',
        group: 'authentication',
        order: 5,
        visibleWhen: { field: 'authMethod', value: 'first-message' },
      },
      {
        id: 'subprotocols',
        label: 'Subprotocols',
        type: 'text',
        required: false,
        description: 'Comma-separated list of subprotocols to request.',
        placeholder: 'graphql-ws, subscriptions-transport-ws',
        group: 'connection',
        order: 2,
      },
      {
        id: 'pingInterval',
        label: 'Ping Interval (ms)',
        type: 'number',
        required: false,
        description: 'Interval for sending ping messages (0 to disable).',
        defaultValue: 30000,
        placeholder: '30000',
        group: 'keepalive',
        order: 1,
      },
      {
        id: 'pongTimeout',
        label: 'Pong Timeout (ms)',
        type: 'number',
        required: false,
        description: 'Time to wait for pong response before assuming disconnect.',
        defaultValue: 5000,
        placeholder: '5000',
        group: 'keepalive',
        order: 2,
      },
      {
        id: 'autoReconnect',
        label: 'Auto Reconnect',
        type: 'checkbox',
        required: false,
        description: 'Automatically reconnect on disconnection.',
        defaultValue: true,
        group: 'reconnection',
        order: 1,
      },
      {
        id: 'maxReconnectAttempts',
        label: 'Max Reconnect Attempts',
        type: 'number',
        required: false,
        description: 'Maximum number of reconnection attempts (0 for unlimited).',
        defaultValue: 10,
        placeholder: '10',
        group: 'reconnection',
        order: 2,
        visibleWhen: { field: 'autoReconnect', value: true },
      },
      {
        id: 'reconnectDelay',
        label: 'Reconnect Delay (ms)',
        type: 'number',
        required: false,
        description: 'Initial delay before reconnecting (uses exponential backoff).',
        defaultValue: 1000,
        placeholder: '1000',
        group: 'reconnection',
        order: 3,
        visibleWhen: { field: 'autoReconnect', value: true },
      },
    ];
  }

  getFieldGroups() {
    return [
      {
        id: 'connection',
        label: 'Connection',
        description: 'WebSocket endpoint configuration.',
      },
      {
        id: 'authentication',
        label: 'Authentication',
        description: 'How to authenticate the connection.',
      },
      {
        id: 'messages',
        label: 'Messages',
        description: 'Message format and handling.',
      },
      {
        id: 'keepalive',
        label: 'Keep-Alive',
        description: 'Ping/pong configuration for connection health.',
        collapsible: true,
        defaultCollapsed: true,
      },
      {
        id: 'reconnection',
        label: 'Reconnection',
        description: 'Automatic reconnection settings.',
        collapsible: true,
        defaultCollapsed: true,
      },
    ];
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Get the current connection state
   */
  getConnectionState(): WebSocketConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: WebSocketEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Update connection state and notify
   */
  private setConnectionState(state: WebSocketConnectionState): void {
    this.connectionState = state;
    this.eventHandlers.onStateChange?.(state);
  }

  /**
   * Build WebSocket URL with authentication
   */
  private buildUrl(credentials: AuthenticationCredentials): string {
    let url = credentials.url as string;
    const authMethod = credentials.authMethod as WebSocketAuthMethod;
    const authToken = credentials.authToken as string;

    if (authMethod === 'query-param' && authToken) {
      const paramName = (credentials.tokenParamName as string) || 'token';
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${paramName}=${encodeURIComponent(authToken)}`;
    }

    return url;
  }

  /**
   * Get subprotocols array
   */
  private getSubprotocols(credentials: AuthenticationCredentials): string[] {
    const authMethod = credentials.authMethod as WebSocketAuthMethod;
    const authToken = credentials.authToken as string;
    const subprotocols = credentials.subprotocols as string;

    const protocols: string[] = [];

    // Parse comma-separated subprotocols
    if (subprotocols) {
      protocols.push(...subprotocols.split(',').map(s => s.trim()).filter(Boolean));
    }

    // Add token as subprotocol if using that auth method
    if (authMethod === 'subprotocol' && authToken) {
      protocols.push(authToken);
    }

    return protocols;
  }

  /**
   * Connect to WebSocket
   */
  async connect(
    credentials: AuthenticationCredentials,
    handlers?: WebSocketEventHandlers
  ): Promise<{ success: boolean; error?: string }> {
    if (handlers) {
      this.setEventHandlers(handlers);
    }

    // Close existing connection
    if (this.socket) {
      this.disconnect();
    }

    this.setConnectionState('connecting');

    try {
      const url = this.buildUrl(credentials);
      const subprotocols = this.getSubprotocols(credentials);

      this.socket = subprotocols.length > 0
        ? new WebSocket(url, subprotocols)
        : new WebSocket(url);

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.setConnectionState('error');
          resolve({ success: false, error: 'Connection timeout' });
        }, 30000);

        this.socket!.onopen = async (event) => {
          clearTimeout(timeout);
          this.setConnectionState('connected');
          this.eventHandlers.onOpen?.(event);

          // Send first-message authentication if needed
          const authMethod = credentials.authMethod as WebSocketAuthMethod;
          if (authMethod === 'first-message') {
            this.setConnectionState('authenticating');
            const authSent = await this.sendAuthMessage(credentials);
            if (authSent) {
              this.setConnectionState('authenticated');
            } else {
              this.setConnectionState('error');
              resolve({ success: false, error: 'Authentication message failed' });
              return;
            }
          } else {
            this.setConnectionState('authenticated');
          }

          // Start ping interval
          this.startPingInterval(credentials);

          // Flush message queue
          this.flushMessageQueue();

          this.status = 'authenticated';
          resolve({ success: true });
        };

        this.socket!.onclose = (event) => {
          clearTimeout(timeout);
          this.stopPingInterval();
          this.setConnectionState('disconnected');
          this.eventHandlers.onClose?.(event);

          // Auto-reconnect
          const autoReconnect = credentials.autoReconnect !== false;
          if (autoReconnect && !event.wasClean) {
            this.handleReconnect(credentials);
          }
        };

        this.socket!.onerror = (event) => {
          clearTimeout(timeout);
          this.setConnectionState('error');
          this.eventHandlers.onError?.(event);
          resolve({ success: false, error: 'Connection error' });
        };

        this.socket!.onmessage = (event) => {
          this.handleMessage(event, credentials);
        };
      });
    } catch (error) {
      this.setConnectionState('error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(code: number = 1000, reason: string = 'Client disconnect'): void {
    this.stopPingInterval();
    this.reconnectAttempts = 0;
    
    if (this.socket) {
      try {
        this.socket.close(code, reason);
      } catch {
        // Socket might already be closed
      }
      this.socket = null;
    }
    
    this.setConnectionState('disconnected');
    this.status = 'unauthenticated';
  }

  /**
   * Send authentication message
   */
  private async sendAuthMessage(credentials: AuthenticationCredentials): Promise<boolean> {
    const authToken = credentials.authToken as string;
    const messageType = (credentials.authMessageType as string) || 'authenticate';
    const template = (credentials.authMessageTemplate as string) || 
      '{"type": "{{type}}", "token": "{{token}}"}';

    try {
      const messageStr = template
        .replace(/\{\{type\}\}/g, messageType)
        .replace(/\{\{token\}\}/g, authToken);

      const message = JSON.parse(messageStr);
      return this.send(message);
    } catch {
      return false;
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent, credentials: AuthenticationCredentials): void {
    const format = (credentials.messageFormat as WebSocketMessageFormat) || 'json';
    let data: unknown;

    try {
      if (format === 'json' && typeof event.data === 'string') {
        data = JSON.parse(event.data);
      } else if (format === 'binary') {
        data = event.data; // ArrayBuffer
      } else {
        data = event.data; // Raw text
      }

      // Handle pong responses
      if (typeof data === 'object' && data !== null) {
        const msg = data as Record<string, unknown>;
        if (msg.type === 'pong' || msg.type === 'ping') {
          this.lastPongTime = Date.now();
          if (this.pongTimeoutId) {
            clearTimeout(this.pongTimeoutId);
            this.pongTimeoutId = null;
          }
          return; // Don't forward ping/pong to handlers
        }
      }

      this.eventHandlers.onMessage?.(data, event);
    } catch (error) {
      // If JSON parsing fails, pass raw data
      this.eventHandlers.onMessage?.(event.data, event);
    }
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(credentials: AuthenticationCredentials): void {
    const maxAttempts = (credentials.maxReconnectAttempts as number) || 10;
    const baseDelay = (credentials.reconnectDelay as number) || 1000;

    if (maxAttempts > 0 && this.reconnectAttempts >= maxAttempts) {
      this.setConnectionState('error');
      return;
    }

    this.reconnectAttempts++;
    this.setConnectionState('reconnecting');
    this.eventHandlers.onReconnect?.(this.reconnectAttempts);

    // Exponential backoff with jitter
    const delay = Math.min(
      baseDelay * Math.pow(2, this.reconnectAttempts - 1) + Math.random() * 1000,
      30000
    );

    setTimeout(() => {
      this.connect(credentials);
    }, delay);
  }

  /**
   * Start ping interval for keep-alive
   */
  private startPingInterval(credentials: AuthenticationCredentials): void {
    const interval = (credentials.pingInterval as number) ?? 30000;
    const pongTimeout = (credentials.pongTimeout as number) ?? 5000;

    if (interval <= 0) return;

    this.pingIntervalId = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping', timestamp: Date.now() });

        // Set pong timeout
        this.pongTimeoutId = setTimeout(() => {
          // No pong received, connection might be dead
          if (Date.now() - this.lastPongTime > interval + pongTimeout) {
            this.disconnect(1001, 'Pong timeout');
          }
        }, pongTimeout);
      }
    }, interval);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
    if (this.pongTimeoutId) {
      clearTimeout(this.pongTimeoutId);
      this.pongTimeoutId = null;
    }
  }

  /**
   * Send a message
   */
  send(data: unknown): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // Queue message for later
      return new Promise((resolve) => {
        this.messageQueue.push({ data, resolve });
      }) as unknown as boolean;
    }

    try {
      if (typeof data === 'object') {
        this.socket.send(JSON.stringify(data));
      } else if (data instanceof ArrayBuffer || data instanceof Blob) {
        this.socket.send(data);
      } else {
        this.socket.send(String(data));
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const { data, resolve } = this.messageQueue.shift()!;
      const sent = this.send(data);
      resolve(sent);
    }
  }

  // ============================================
  // AUTHENTICATION FLOW
  // ============================================

  async authenticate(
    credentials: Partial<AuthenticationCredentials>,
    _currentStep?: number
  ): Promise<ProtocolAuthenticationFlow> {
    // Validate required fields
    const validation = this.validateCredentials(credentials);
    if (!validation.valid) {
      return {
        step: 1,
        totalSteps: 1,
        type: 'error',
        title: 'Configuration Error',
        description: 'Please fix the configuration errors.',
        error: Object.values(validation.fieldErrors).join(', '),
      };
    }

    // Test connection
    const result = await this.connect(credentials as AuthenticationCredentials);

    if (!result.success) {
      return {
        step: 1,
        totalSteps: 1,
        type: 'error',
        title: 'Connection Failed',
        description: 'Could not connect to WebSocket server.',
        error: result.error,
      };
    }

    return {
      step: 1,
      totalSteps: 1,
      type: 'complete',
      title: 'WebSocket Connected',
      description: 'Successfully connected to WebSocket server.',
      data: {
        url: credentials.url,
        authMethod: credentials.authMethod,
        state: this.connectionState,
      },
    };
  }

  // ============================================
  // TOKEN MANAGEMENT (N/A for WebSocket)
  // ============================================

  async refreshTokens(_credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    return {
      success: true,
      accessToken: undefined,
    };
  }

  async revokeTokens(_credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }> {
    this.disconnect();
    return { success: true };
  }

  isTokenExpired(_credentials: AuthenticationCredentials): boolean {
    return false;
  }

  getTokenExpirationTime(_credentials: AuthenticationCredentials): Date | null {
    return null;
  }

  // ============================================
  // REQUEST EXECUTION
  // ============================================

  async injectAuthentication(
    _context: ProtocolExecutionContext
  ): Promise<{
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body?: string | Record<string, unknown>;
  }> {
    // WebSocket auth is handled during connection
    return { headers: {}, queryParams: {} };
  }

  async executeRequest(context: ProtocolExecutionContext): Promise<ProtocolExecutionResult> {
    const startTime = performance.now();

    // For WebSocket, "execute" means sending a message
    if (!this.isConnected()) {
      // Try to connect first
      const connectResult = await this.connect(context.credentials as AuthenticationCredentials);
      if (!connectResult.success) {
        return {
          success: false,
          statusCode: 0,
          headers: {},
          body: null,
          rawBody: '',
          durationMs: performance.now() - startTime,
          credentialsRefreshed: false,
          error: connectResult.error,
          errorCode: 'NOT_CONNECTED',
        };
      }
    }

    const sent = this.send(context.body);

    return {
      success: sent,
      statusCode: sent ? 200 : 500,
      headers: {},
      body: { sent, connectionState: this.connectionState },
      rawBody: '',
      durationMs: performance.now() - startTime,
      credentialsRefreshed: false,
      error: sent ? undefined : 'Failed to send message',
    };
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(credentials: AuthenticationCredentials): Promise<ProtocolHealthCheckResult> {
    const startTime = performance.now();

    // Check current connection
    if (this.isConnected()) {
      return {
        healthy: true,
        message: 'WebSocket connected',
        latencyMs: 0,
        tokenStatus: 'valid',
        tokenExpiresIn: -1,
        canRefresh: false,
        details: {
          connectionState: this.connectionState,
          reconnectAttempts: this.reconnectAttempts,
        },
      };
    }

    // Try to connect
    const result = await this.connect(credentials);
    const latencyMs = performance.now() - startTime;

    if (result.success) {
      return {
        healthy: true,
        message: 'WebSocket connection established',
        latencyMs,
        tokenStatus: 'valid',
        tokenExpiresIn: -1,
        canRefresh: false,
        details: {
          connectionState: this.connectionState,
        },
      };
    }

    return {
      healthy: false,
      message: result.error || 'Connection failed',
      latencyMs,
      tokenStatus: 'invalid',
      tokenExpiresIn: 0,
      canRefresh: false,
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Create a typed message
   */
  static createMessage<T = unknown>(type: string, payload?: T, id?: string): WebSocketMessage {
    return {
      type,
      payload,
      id: id || crypto.randomUUID(),
      timestamp: Date.now(),
    };
  }

  /**
   * Parse a message
   */
  static parseMessage(data: unknown): WebSocketMessage | null {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    if (typeof data === 'object' && data !== null) {
      return data as WebSocketMessage;
    }
    return null;
  }

  /**
   * Get WebSocket close code meaning
   */
  static getCloseReason(code: number): string {
    const reasons: Record<number, string> = {
      1000: 'Normal closure',
      1001: 'Going away (page unload)',
      1002: 'Protocol error',
      1003: 'Unsupported data type',
      1005: 'No status received',
      1006: 'Abnormal closure (no close frame)',
      1007: 'Invalid payload data',
      1008: 'Policy violation',
      1009: 'Message too big',
      1010: 'Missing extension',
      1011: 'Internal server error',
      1012: 'Service restart',
      1013: 'Try again later',
      1014: 'Bad gateway',
      1015: 'TLS handshake failed',
    };
    return reasons[code] || `Unknown (${code})`;
  }
}

// Export default instance
export default WebSocketHandshakeExecutor;
