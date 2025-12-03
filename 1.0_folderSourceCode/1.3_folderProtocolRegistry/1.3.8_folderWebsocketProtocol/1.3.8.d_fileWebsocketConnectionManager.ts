// ============================================
// PROTOCOL OS - WEBSOCKET CONNECTION MANAGER
// ============================================
// Address: 1.3.8.d
// Purpose: Advanced WebSocket connection management
// ============================================

import type {
  WebSocketConnectionState,
  WebSocketMessage,
  WebSocketConfiguration,
  WebSocketEventHandlers,
} from './1.3.8.a_fileWebsocketHandshakeExecutor';

/**
 * Subscription callback type
 */
export type SubscriptionCallback = (data: unknown) => void;

/**
 * Subscription entry
 */
interface Subscription {
  id: string;
  channel: string;
  callback: SubscriptionCallback;
  filter?: (data: unknown) => boolean;
}

/**
 * Pending request entry
 */
interface PendingRequest {
  id: string;
  resolve: (data: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * Message queue entry
 */
interface QueuedMessage {
  data: unknown;
  priority: number;
  timestamp: number;
}

/**
 * Connection statistics
 */
export interface ConnectionStats {
  connectedAt: number | null;
  disconnectedAt: number | null;
  reconnectAttempts: number;
  messagesReceived: number;
  messagesSent: number;
  bytesReceived: number;
  bytesSent: number;
  latencyMs: number;
  uptime: number;
}

/**
 * WebSocket Connection Manager
 * 
 * Provides advanced connection management features:
 * - Channel-based pub/sub
 * - Request/response pattern with timeouts
 * - Message queuing during disconnection
 * - Connection statistics
 * - Automatic reconnection with exponential backoff
 * - Event bus for state changes
 */
export class WebSocketConnectionManager {
  private socket: WebSocket | null = null;
  private config: WebSocketConfiguration | null = null;
  private state: WebSocketConnectionState = 'disconnected';
  
  // Subscriptions
  private subscriptions: Map<string, Subscription[]> = new Map();
  private wildcardSubscriptions: Subscription[] = [];
  
  // Request/Response tracking
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private requestTimeout = 30000; // 30 seconds default
  
  // Message queue
  private messageQueue: QueuedMessage[] = [];
  private maxQueueSize = 1000;
  private queueEnabled = true;
  
  // Reconnection
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  
  // Keep-alive
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastPongTime = 0;
  private pingIntervalMs = 30000;
  private pongTimeoutMs = 5000;
  
  // Statistics
  private stats: ConnectionStats = {
    connectedAt: null,
    disconnectedAt: null,
    reconnectAttempts: 0,
    messagesReceived: 0,
    messagesSent: 0,
    bytesReceived: 0,
    bytesSent: 0,
    latencyMs: 0,
    uptime: 0,
  };
  
  // Event handlers
  private handlers: WebSocketEventHandlers = {};
  
  constructor(config?: Partial<WebSocketConfiguration>) {
    if (config) {
      this.configure(config as WebSocketConfiguration);
    }
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  /**
   * Configure the connection manager
   */
  configure(config: WebSocketConfiguration): void {
    this.config = config;
    
    if (config.pingInterval !== undefined) {
      this.pingIntervalMs = config.pingInterval;
    }
    if (config.pongTimeout !== undefined) {
      this.pongTimeoutMs = config.pongTimeout;
    }
    if (config.maxReconnectAttempts !== undefined) {
      this.maxReconnectAttempts = config.maxReconnectAttempts;
    }
    if (config.reconnectDelay !== undefined) {
      this.baseReconnectDelay = config.reconnectDelay;
    }
  }

  /**
   * Set event handlers
   */
  setHandlers(handlers: WebSocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Get current connection state
   */
  getState(): WebSocketConnectionState {
    return this.state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection statistics
   */
  getStats(): ConnectionStats {
    if (this.stats.connectedAt) {
      this.stats.uptime = Date.now() - this.stats.connectedAt;
    }
    return { ...this.stats };
  }

  /**
   * Update state and notify handlers
   */
  private setState(state: WebSocketConnectionState): void {
    this.state = state;
    this.handlers.onStateChange?.(state);
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'Not configured' };
    }

    if (this.isConnected()) {
      return { success: true };
    }

    this.setState('connecting');

    return new Promise((resolve) => {
      const url = this.buildUrl();
      const subprotocols = this.getSubprotocols();

      try {
        this.socket = subprotocols.length > 0
          ? new WebSocket(url, subprotocols)
          : new WebSocket(url);

        const connectionTimeout = setTimeout(() => {
          this.socket?.close();
          this.setState('error');
          resolve({ success: false, error: 'Connection timeout' });
        }, 30000);

        this.socket.onopen = async (event) => {
          clearTimeout(connectionTimeout);
          this.setState('connected');
          this.stats.connectedAt = Date.now();
          this.stats.disconnectedAt = null;
          this.reconnectAttempts = 0;
          this.stats.reconnectAttempts = 0;
          
          this.handlers.onOpen?.(event);

          // Send first-message auth if needed
          if (this.config?.authMethod === 'first-message') {
            this.setState('authenticating');
            const authSent = await this.sendAuthMessage();
            if (!authSent) {
              this.setState('error');
              resolve({ success: false, error: 'Authentication failed' });
              return;
            }
          }

          this.setState('authenticated');
          this.startPingInterval();
          this.flushMessageQueue();
          
          resolve({ success: true });
        };

        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.stopPingInterval();
          this.stats.disconnectedAt = Date.now();
          this.setState('disconnected');
          this.handlers.onClose?.(event);

          // Auto-reconnect on abnormal closure
          if (this.config?.autoReconnect !== false && !event.wasClean) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (event) => {
          clearTimeout(connectionTimeout);
          this.setState('error');
          this.handlers.onError?.(event);
          resolve({ success: false, error: 'Connection error' });
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        this.setState('error');
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        });
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(code = 1000, reason = 'Client disconnect'): void {
    this.cancelReconnect();
    this.stopPingInterval();
    this.clearPendingRequests();
    
    if (this.socket) {
      try {
        this.socket.close(code, reason);
      } catch {
        // Already closed
      }
      this.socket = null;
    }
    
    this.setState('disconnected');
    this.stats.disconnectedAt = Date.now();
  }

  /**
   * Build WebSocket URL with auth if needed
   */
  private buildUrl(): string {
    if (!this.config) return '';
    
    let url = this.config.url;
    
    if (this.config.authMethod === 'query-param' && this.config.authToken) {
      const paramName = this.config.tokenParamName || 'token';
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}${paramName}=${encodeURIComponent(this.config.authToken)}`;
    }
    
    return url;
  }

  /**
   * Get subprotocols
   */
  private getSubprotocols(): string[] {
    if (!this.config) return [];
    
    const protocols: string[] = [];
    
    if (this.config.subprotocols) {
      const parts = this.config.subprotocols.split(',').map(s => s.trim()).filter(Boolean);
      protocols.push(...parts);
    }
    
    if (this.config.authMethod === 'subprotocol' && this.config.authToken) {
      protocols.push(this.config.authToken);
    }
    
    return protocols;
  }

  /**
   * Send authentication message
   */
  private async sendAuthMessage(): Promise<boolean> {
    if (!this.config?.authToken) return false;
    
    const messageType = this.config.authMessageType || 'authenticate';
    const template = this.config.authMessageTemplate || 
      '{"type": "{{type}}", "token": "{{token}}"}';
    
    try {
      const messageStr = template
        .replace(/\{\{type\}\}/g, messageType)
        .replace(/\{\{token\}\}/g, this.config.authToken);
      
      const message = JSON.parse(messageStr);
      return this.send(message);
    } catch {
      return false;
    }
  }

  // ============================================
  // RECONNECTION
  // ============================================

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.maxReconnectAttempts > 0 && this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setState('error');
      return;
    }

    this.reconnectAttempts++;
    this.stats.reconnectAttempts = this.reconnectAttempts;
    this.setState('reconnecting');
    this.handlers.onReconnect?.(this.reconnectAttempts);

    // Exponential backoff with jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );
    const jitter = Math.random() * 1000;

    this.reconnectTimeoutId = setTimeout(() => {
      this.connect();
    }, delay + jitter);
  }

  /**
   * Cancel scheduled reconnection
   */
  private cancelReconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  // ============================================
  // KEEP-ALIVE
  // ============================================

  /**
   * Start ping interval
   */
  private startPingInterval(): void {
    if (this.pingIntervalMs <= 0) return;

    this.lastPongTime = Date.now();
    
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        const pingMessage = {
          type: 'ping',
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        
        this.send(pingMessage);
        
        // Set pong timeout
        this.pongTimeout = setTimeout(() => {
          if (Date.now() - this.lastPongTime > this.pingIntervalMs + this.pongTimeoutMs) {
            this.disconnect(1001, 'Pong timeout');
          }
        }, this.pongTimeoutMs);
      }
    }, this.pingIntervalMs);
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    this.stats.messagesReceived++;
    this.stats.bytesReceived += event.data.length || 0;

    let data: unknown;
    
    try {
      if (typeof event.data === 'string') {
        data = JSON.parse(event.data);
      } else {
        data = event.data;
      }
    } catch {
      data = event.data;
    }

    // Handle system messages
    if (typeof data === 'object' && data !== null) {
      const msg = data as WebSocketMessage;
      
      // Handle pong
      if (msg.type === 'pong') {
        this.lastPongTime = Date.now();
        if (this.pongTimeout) {
          clearTimeout(this.pongTimeout);
          this.pongTimeout = null;
        }
        
        // Calculate latency
        if (msg.timestamp) {
          this.stats.latencyMs = Date.now() - (msg.timestamp as number);
        }
        return;
      }
      
      // Handle ping (respond with pong)
      if (msg.type === 'ping') {
        this.send({ type: 'pong', id: msg.id, timestamp: msg.timestamp });
        return;
      }

      // Handle request/response
      if (msg.id && this.pendingRequests.has(msg.id)) {
        const pending = this.pendingRequests.get(msg.id)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(msg.id);
        
        if (msg.type === 'error') {
          pending.reject(new Error((msg.payload as { message?: string })?.message || 'Request failed'));
        } else {
          pending.resolve(msg.payload);
        }
        return;
      }
    }

    // Notify handlers
    this.handlers.onMessage?.(data, event);

    // Dispatch to subscriptions
    this.dispatchToSubscriptions(data);
  }

  /**
   * Send a message
   */
  send(data: unknown): boolean {
    if (!this.isConnected()) {
      if (this.queueEnabled) {
        this.queueMessage(data);
      }
      return false;
    }

    try {
      const str = typeof data === 'object' ? JSON.stringify(data) : String(data);
      this.socket!.send(str);
      this.stats.messagesSent++;
      this.stats.bytesSent += str.length;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(data: unknown, priority = 0): void {
    if (this.messageQueue.length >= this.maxQueueSize) {
      // Remove lowest priority message
      this.messageQueue.sort((a, b) => b.priority - a.priority);
      this.messageQueue.pop();
    }

    this.messageQueue.push({
      data,
      priority,
      timestamp: Date.now(),
    });
  }

  /**
   * Flush message queue
   */
  private flushMessageQueue(): void {
    // Sort by priority (highest first), then by timestamp (oldest first)
    this.messageQueue.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    while (this.messageQueue.length > 0 && this.isConnected()) {
      const { data } = this.messageQueue.shift()!;
      this.send(data);
    }
  }

  // ============================================
  // REQUEST/RESPONSE PATTERN
  // ============================================

  /**
   * Send a request and wait for response
   */
  async request<T = unknown>(
    type: string,
    payload?: unknown,
    timeout = this.requestTimeout
  ): Promise<T> {
    const id = crypto.randomUUID();
    
    const message: WebSocketMessage = {
      type,
      id,
      payload,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${type}`));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(id, {
        id,
        resolve: resolve as (data: unknown) => void,
        reject,
        timeout: timeoutId,
      });

      // Send message
      if (!this.send(message)) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(id);
        reject(new Error('Failed to send request'));
      }
    });
  }

  /**
   * Clear all pending requests
   */
  private clearPendingRequests(): void {
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();
  }

  // ============================================
  // PUB/SUB
  // ============================================

  /**
   * Subscribe to a channel
   */
  subscribe(
    channel: string,
    callback: SubscriptionCallback,
    filter?: (data: unknown) => boolean
  ): string {
    const id = crypto.randomUUID();
    const subscription: Subscription = { id, channel, callback, filter };

    if (channel === '*') {
      this.wildcardSubscriptions.push(subscription);
    } else {
      const subs = this.subscriptions.get(channel) || [];
      subs.push(subscription);
      this.subscriptions.set(channel, subs);
    }

    return id;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(subscriptionId: string): boolean {
    // Check wildcard subscriptions
    const wildcardIndex = this.wildcardSubscriptions.findIndex(s => s.id === subscriptionId);
    if (wildcardIndex !== -1) {
      this.wildcardSubscriptions.splice(wildcardIndex, 1);
      return true;
    }

    // Check channel subscriptions
    for (const [channel, subs] of this.subscriptions) {
      const index = subs.findIndex(s => s.id === subscriptionId);
      if (index !== -1) {
        subs.splice(index, 1);
        if (subs.length === 0) {
          this.subscriptions.delete(channel);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.subscriptions.clear();
    this.wildcardSubscriptions = [];
  }

  /**
   * Dispatch message to subscriptions
   */
  private dispatchToSubscriptions(data: unknown): void {
    // Determine channel from message
    let channel = '*';
    if (typeof data === 'object' && data !== null) {
      const msg = data as Record<string, unknown>;
      channel = (msg.channel || msg.type || msg.event || '*') as string;
    }

    // Notify channel subscribers
    const channelSubs = this.subscriptions.get(channel) || [];
    for (const sub of channelSubs) {
      if (!sub.filter || sub.filter(data)) {
        try {
          sub.callback(data);
        } catch (error) {
          console.error('Subscription callback error:', error);
        }
      }
    }

    // Notify wildcard subscribers
    for (const sub of this.wildcardSubscriptions) {
      if (!sub.filter || sub.filter(data)) {
        try {
          sub.callback(data);
        } catch (error) {
          console.error('Wildcard subscription callback error:', error);
        }
      }
    }
  }

  /**
   * Publish to a channel (send to server)
   */
  publish(channel: string, payload: unknown): boolean {
    return this.send({
      type: 'publish',
      channel,
      payload,
      timestamp: Date.now(),
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      connectedAt: this.isConnected() ? this.stats.connectedAt : null,
      disconnectedAt: null,
      reconnectAttempts: 0,
      messagesReceived: 0,
      messagesSent: 0,
      bytesReceived: 0,
      bytesSent: 0,
      latencyMs: 0,
      uptime: 0,
    };
  }

  /**
   * Set queue configuration
   */
  setQueueConfig(enabled: boolean, maxSize = 1000): void {
    this.queueEnabled = enabled;
    this.maxQueueSize = maxSize;
  }

  /**
   * Set request timeout
   */
  setRequestTimeout(timeoutMs: number): void {
    this.requestTimeout = timeoutMs;
  }

  /**
   * Get pending request count
   */
  getPendingRequestCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  clearQueue(): void {
    this.messageQueue = [];
  }
}

/**
 * Create a managed WebSocket connection
 */
export function createWebSocketManager(
  config?: Partial<WebSocketConfiguration>
): WebSocketConnectionManager {
  return new WebSocketConnectionManager(config);
}

export default WebSocketConnectionManager;
