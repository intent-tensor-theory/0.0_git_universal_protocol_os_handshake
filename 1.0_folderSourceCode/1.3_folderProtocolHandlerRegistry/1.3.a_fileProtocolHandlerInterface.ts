// ============================================
// PROTOCOL OS - PROTOCOL HANDLER INTERFACE
// ============================================
// Address: 1.3.a
// Purpose: Define the contract for all protocol handler implementations
// ============================================

import type { Handshake, HandshakeStatus } from '@types/1.9.c_fileHandshakeTypeDefinitions';
import type { 
  AuthenticationConfig, 
  ProtocolType,
  AuthenticationCredentials,
} from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { 
  HandshakeExecutionResult, 
  ExecutionLogEntry,
} from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';

/**
 * Options for executing a handshake
 */
export interface HandshakeExecutionOptions {
  /** Custom timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Whether to follow redirects (default: true) */
  followRedirects?: boolean;
  
  /** Maximum number of redirects to follow (default: 5) */
  maxRedirects?: number;
  
  /** Whether to validate SSL certificates (default: true) */
  validateSsl?: boolean;
  
  /** Custom headers to add to all requests */
  additionalHeaders?: Record<string, string>;
  
  /** Variables to substitute in curl commands */
  variables?: Record<string, string>;
  
  /** Whether to log verbose output */
  verbose?: boolean;
  
  /** Callback for log entries during execution */
  onLog?: (entry: ExecutionLogEntry) => void;
  
  /** Callback for progress updates */
  onProgress?: (stage: string, percent: number) => void;
  
  /** AbortController signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Result of authentication validation
 */
export interface AuthenticationValidationResult {
  isValid: boolean;
  missingFields: string[];
  invalidFields: { field: string; reason: string }[];
  warnings: string[];
}

/**
 * Result of token refresh operation
 */
export interface TokenRefreshResult {
  success: boolean;
  newCredentials?: AuthenticationCredentials;
  expiresAt?: string;
  error?: string;
}

/**
 * Protocol Handler Interface
 * 
 * All protocol handlers must implement this interface.
 * Each handler knows how to authenticate and execute requests
 * for its specific protocol type.
 */
export interface ProtocolHandler {
  /**
   * Protocol type this handler supports
   */
  readonly protocolType: ProtocolType;

  /**
   * Human-readable display name
   */
  readonly displayName: string;

  /**
   * Short description of the protocol
   */
  readonly description: string;

  /**
   * Whether this protocol supports automatic token refresh
   */
  readonly supportsTokenRefresh: boolean;

  /**
   * Whether this protocol requires user interaction (e.g., OAuth popup)
   */
  readonly requiresUserInteraction: boolean;

  /**
   * Icon identifier for UI display
   */
  readonly iconId: string;

  /**
   * Validate that the authentication configuration is complete and valid
   */
  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult;

  /**
   * Get the list of required fields for this protocol
   */
  getRequiredFields(): string[];

  /**
   * Get the list of optional fields for this protocol
   */
  getOptionalFields(): string[];

  /**
   * Initialize authentication (may trigger OAuth flow, etc.)
   * Returns credentials that can be used for requests
   */
  authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }>;

  /**
   * Refresh expired tokens if supported
   */
  refreshToken?(
    config: AuthenticationConfig,
    currentCredentials: AuthenticationCredentials
  ): Promise<TokenRefreshResult>;

  /**
   * Revoke/logout current credentials if supported
   */
  revokeCredentials?(
    config: AuthenticationConfig,
    credentials: AuthenticationCredentials
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Execute a single curl request with authentication
   */
  executeRequest(
    curlRequest: CurlRequest,
    config: AuthenticationConfig,
    credentials: AuthenticationCredentials,
    options?: HandshakeExecutionOptions
  ): Promise<HandshakeExecutionResult>;

  /**
   * Execute a complete handshake (may include multiple requests)
   */
  executeHandshake(
    handshake: Handshake,
    options?: HandshakeExecutionOptions
  ): Promise<HandshakeExecutionResult>;

  /**
   * Determine the status of a handshake based on its configuration
   */
  determineStatus(handshake: Handshake): HandshakeStatus;

  /**
   * Generate a sample curl command for this protocol
   */
  generateSampleCurl(config: AuthenticationConfig): string;

  /**
   * Test the connection/authentication without executing full request
   */
  testConnection(config: AuthenticationConfig): Promise<{
    success: boolean;
    message: string;
    latencyMs?: number;
  }>;
}

/**
 * Base class providing common functionality for protocol handlers
 * Extend this to create new protocol handlers
 */
export abstract class BaseProtocolHandler implements ProtocolHandler {
  abstract readonly protocolType: ProtocolType;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly supportsTokenRefresh: boolean;
  abstract readonly requiresUserInteraction: boolean;
  abstract readonly iconId: string;

  abstract validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult;
  abstract getRequiredFields(): string[];
  abstract getOptionalFields(): string[];
  abstract authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }>;
  abstract executeRequest(
    curlRequest: CurlRequest,
    config: AuthenticationConfig,
    credentials: AuthenticationCredentials,
    options?: HandshakeExecutionOptions
  ): Promise<HandshakeExecutionResult>;

  /**
   * Default implementation executes all curl requests in sequence
   */
  async executeHandshake(
    handshake: Handshake,
    options?: HandshakeExecutionOptions
  ): Promise<HandshakeExecutionResult> {
    const startTime = Date.now();
    const logs: ExecutionLogEntry[] = [];
    
    const log = (level: ExecutionLogEntry['level'], message: string) => {
      const entry: ExecutionLogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
      };
      logs.push(entry);
      options?.onLog?.(entry);
    };

    log('SYSTEM', `Starting handshake execution: ${handshake.title}`);

    // Validate configuration
    const validation = this.validateConfiguration(handshake.authentication);
    if (!validation.isValid) {
      log('ERROR', `Configuration invalid: ${validation.missingFields.join(', ')}`);
      return this.createErrorResult(
        'Configuration validation failed',
        logs,
        startTime
      );
    }

    // Authenticate
    log('INFO', 'Authenticating...');
    const authResult = await this.authenticate(handshake.authentication);
    
    if (!authResult.success || !authResult.credentials) {
      log('ERROR', `Authentication failed: ${authResult.error}`);
      return this.createErrorResult(
        authResult.error || 'Authentication failed',
        logs,
        startTime
      );
    }

    log('SUCCESS', 'Authentication successful');

    // Execute curl requests
    let lastResult: HandshakeExecutionResult | null = null;
    
    for (let i = 0; i < handshake.curlRequests.length; i++) {
      const curlRequest = handshake.curlRequests[i];
      
      // Check for cancellation
      if (options?.signal?.aborted) {
        log('WARNING', 'Execution cancelled by user');
        return this.createErrorResult('Execution cancelled', logs, startTime);
      }

      log('INFO', `Executing request ${i + 1}/${handshake.curlRequests.length}: ${curlRequest.title}`);
      options?.onProgress?.('executing', ((i + 1) / handshake.curlRequests.length) * 100);

      try {
        lastResult = await this.executeRequest(
          curlRequest,
          handshake.authentication,
          authResult.credentials,
          options
        );

        if (lastResult.success) {
          log('SUCCESS', `Request completed: ${lastResult.metrics.statusCode}`);
        } else {
          log('ERROR', `Request failed: ${lastResult.error}`);
          // Continue with other requests or stop?
          // For now, we continue
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        log('ERROR', `Request exception: ${message}`);
        lastResult = this.createErrorResult(message, logs, startTime);
      }
    }

    // Return the last result with combined logs
    if (lastResult) {
      return {
        ...lastResult,
        logs: [...logs, ...lastResult.logs],
        metrics: {
          ...lastResult.metrics,
          totalDurationMs: Date.now() - startTime,
        },
      };
    }

    return this.createErrorResult('No requests to execute', logs, startTime);
  }

  /**
   * Default status determination based on configuration completeness
   */
  determineStatus(handshake: Handshake): HandshakeStatus {
    const validation = this.validateConfiguration(handshake.authentication);
    
    if (!validation.isValid) {
      return 'unconfigured';
    }
    
    // Check if there are curl requests
    if (handshake.curlRequests.length === 0) {
      return 'configured';
    }
    
    // Would need execution history to determine healthy/failed
    // For now, configured means ready to execute
    return 'configured';
  }

  /**
   * Default sample curl generation
   */
  generateSampleCurl(_config: AuthenticationConfig): string {
    return `curl -X GET "https://api.example.com/resource" \\
  -H "Authorization: Bearer <YOUR_TOKEN>" \\
  -H "Content-Type: application/json"`;
  }

  /**
   * Default connection test
   */
  async testConnection(_config: AuthenticationConfig): Promise<{
    success: boolean;
    message: string;
    latencyMs?: number;
  }> {
    return {
      success: false,
      message: 'Connection test not implemented for this protocol',
    };
  }

  /**
   * Helper to create an error result
   */
  protected createErrorResult(
    error: string,
    logs: ExecutionLogEntry[],
    startTime: number
  ): HandshakeExecutionResult {
    return {
      success: false,
      error,
      metrics: {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        totalDurationMs: Date.now() - startTime,
        statusCode: 0,
        responseSize: 0,
      },
      headers: {},
      responseBody: null,
      logs,
    };
  }

  /**
   * Helper to create a success result
   */
  protected createSuccessResult(
    response: Response,
    body: unknown,
    logs: ExecutionLogEntry[],
    startTime: number
  ): HandshakeExecutionResult {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      success: true,
      metrics: {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        totalDurationMs: Date.now() - startTime,
        statusCode: response.status,
        responseSize: JSON.stringify(body).length,
      },
      headers,
      responseBody: body,
      logs,
    };
  }
}
