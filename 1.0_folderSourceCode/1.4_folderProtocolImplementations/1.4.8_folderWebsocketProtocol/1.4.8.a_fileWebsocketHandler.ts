// ============================================
// PROTOCOL OS - WEBSOCKET HANDLER
// ============================================
// Address: 1.4.8.a
// Purpose: WebSocket real-time communication handler
// ============================================

import {
  BaseProtocolHandler,
  type AuthenticationValidationResult,
  type HandshakeExecutionOptions,
} from '@registry/1.3.a_fileProtocolHandlerInterface';
import type { AuthenticationConfig, AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';

/**
 * WebSocket Handler
 * 
 * Real-time bidirectional communication via WebSocket.
 */
export class WebsocketHandler extends BaseProtocolHandler {
  readonly protocolType = 'websocket' as const;
  readonly displayName = 'WebSocket';
  readonly description = 'Real-time bidirectional communication';
  readonly supportsTokenRefresh = false;
  readonly requiresUserInteraction = false;
  readonly iconId = 'radio';

  private activeConnections: Map<string, WebSocket> = new Map();

  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult {
    const missingFields: string[] = [];
    const wsConfig = config.websocket;

    if (!wsConfig) {
      return { isValid: false, missingFields: ['websocket configuration'], invalidFields: [], warnings: [] };
    }

    if (!wsConfig.url) missingFields.push('url');

    const warnings: string[] = [];
    if (wsConfig.url && !wsConfig.url.startsWith('wss://')) {
      warnings.push('Consider using wss:// for secure WebSocket connections');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      invalidFields: [],
      warnings,
    };
  }

  getRequiredFields(): string[] {
    return ['url'];
  }

  getOptionalFields(): string[] {
    return ['protocols', 'authToken', 'pingInterval', 'reconnect'];
  }

  async authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    const wsConfig = config.websocket;
    
    if (!wsConfig) {
      return { success: false, error: 'WebSocket configuration not provided' };
    }

    return {
      success: true,
      credentials: {
        type: 'websocket',
        url: wsConfig.url,
        authToken: wsConfig.authToken,
        protocols: wsConfig.protocols,
        obtainedAt: new Date().toISOString(),
      },
    };
  }

  async executeRequest(
    curlRequest: CurlRequest,
    config: AuthenticationConfig,
    credentials: AuthenticationCredentials,
    options?: HandshakeExecutionOptions
  ): Promise<HandshakeExecutionResult> {
    const startTime = Date.now();
    const logs: ExecutionLogEntry[] = [];

    const log = (level: ExecutionLogEntry['level'], message: string) => {
      logs.push({ timestamp: new Date().toISOString(), level, message });
      options?.onLog?.({ timestamp: new Date().toISOString(), level, message });
    };

    log('INFO', `WebSocket: ${curlRequest.title}`);

    const wsConfig = config.websocket!;
    
    return new Promise((resolve) => {
      try {
        // Build URL with auth token if provided
        let url = wsConfig.url;
        if (wsConfig.authToken) {
          const urlObj = new URL(url);
          urlObj.searchParams.set('token', wsConfig.authToken);
          url = urlObj.toString();
        }

        log('INFO', `Connecting to ${url}`);

        const ws = new WebSocket(url, wsConfig.protocols);
        const connectionId = `ws-${Date.now()}`;
        
        const timeout = setTimeout(() => {
          ws.close();
          log('ERROR', 'Connection timeout');
          resolve(this.createErrorResult('Connection timeout', logs, startTime));
        }, options?.timeout ?? 30000);

        ws.onopen = () => {
          clearTimeout(timeout);
          log('SUCCESS', 'WebSocket connected');
          this.activeConnections.set(connectionId, ws);

          // Send test message if provided
          if (curlRequest.testData) {
            log('INFO', 'Sending test message');
            ws.send(curlRequest.testData);
          }
        };

        ws.onmessage = (event) => {
          log('INFO', `Received: ${String(event.data).substring(0, 100)}`);
          
          // Close connection after first message for handshake test
          ws.close();
          this.activeConnections.delete(connectionId);
          
          resolve({
            success: true,
            metrics: {
              startTime: new Date(startTime).toISOString(),
              endTime: new Date().toISOString(),
              totalDurationMs: Date.now() - startTime,
              statusCode: 101,
              responseSize: String(event.data).length,
            },
            headers: {},
            responseBody: event.data,
            logs,
          });
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          log('ERROR', 'WebSocket error');
          resolve(this.createErrorResult('WebSocket connection error', logs, startTime));
        };

        ws.onclose = (event) => {
          clearTimeout(timeout);
          this.activeConnections.delete(connectionId);
          
          if (event.code !== 1000) {
            log('WARNING', `Connection closed: ${event.code} ${event.reason}`);
          }
        };

        // Handle abort signal
        options?.signal?.addEventListener('abort', () => {
          ws.close();
          this.activeConnections.delete(connectionId);
        });

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        log('ERROR', message);
        resolve(this.createErrorResult(message, logs, startTime));
      }
    });
  }

  generateSampleCurl(config: AuthenticationConfig): string {
    const url = config.websocket?.url || 'wss://api.example.com/ws';
    
    return `# WebSocket connection (using websocat CLI)
websocat "${url}"

# Or with wscat
wscat -c "${url}"`;
  }

  async testConnection(config: AuthenticationConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const wsConfig = config.websocket;
    if (!wsConfig?.url) {
      return { success: false, message: 'WebSocket URL not configured' };
    }

    const startTime = Date.now();

    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(wsConfig.url, wsConfig.protocols);
        
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ success: false, message: 'Connection timeout', latencyMs: Date.now() - startTime });
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({
            success: true,
            message: 'WebSocket connection successful',
            latencyMs: Date.now() - startTime,
          });
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve({ success: false, message: 'Connection failed', latencyMs: Date.now() - startTime });
        };
      } catch (error) {
        resolve({ success: false, message: error instanceof Error ? error.message : 'Connection failed' });
      }
    });
  }

  /**
   * Close all active connections
   */
  closeAllConnections(): void {
    this.activeConnections.forEach((ws) => ws.close());
    this.activeConnections.clear();
  }
}

export default WebsocketHandler;
