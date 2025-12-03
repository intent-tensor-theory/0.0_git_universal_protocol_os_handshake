// ============================================
// PROTOCOL OS - CURL DEFAULT HANDLER
// ============================================
// Address: 1.4.1.a
// Purpose: Direct cURL command execution handler
// ============================================

import {
  BaseProtocolHandler,
  type AuthenticationValidationResult,
  type HandshakeExecutionOptions,
} from '@registry/1.3.a_fileProtocolHandlerInterface';
import type { AuthenticationConfig, AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { parseCurlCommand, curlToFetchOptions } from '@utils/1.8.a_fileCurlCommandParser';
import { substituteAllPlaceholders } from '@utils/1.8.e_fileInputPlaceholderSubstitution';

/**
 * cURL Default Handler
 * 
 * Executes raw cURL commands with minimal processing.
 * Authentication is embedded directly in the cURL command.
 * 
 * Use cases:
 * - Quick testing of APIs
 * - APIs with non-standard authentication
 * - One-off requests that don't need managed auth
 */
export class CurlDefaultHandler extends BaseProtocolHandler {
  readonly protocolType = 'curl-default' as const;
  readonly displayName = 'cURL Default';
  readonly description = 'Direct cURL command execution with manual authentication';
  readonly supportsTokenRefresh = false;
  readonly requiresUserInteraction = false;
  readonly iconId = 'terminal';

  /**
   * Validate configuration - curl-default has no required fields
   */
  validateConfiguration(_config: AuthenticationConfig): AuthenticationValidationResult {
    return {
      isValid: true,
      missingFields: [],
      invalidFields: [],
      warnings: [
        'Authentication must be included directly in cURL commands',
        'Tokens will not be automatically refreshed',
      ],
    };
  }

  /**
   * Get required fields - none for curl-default
   */
  getRequiredFields(): string[] {
    return [];
  }

  /**
   * Get optional fields
   */
  getOptionalFields(): string[] {
    return ['baseUrl', 'defaultHeaders'];
  }

  /**
   * Authenticate - no-op for curl-default
   */
  async authenticate(_config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    // No authentication needed - credentials are in the cURL command
    return {
      success: true,
      credentials: {
        type: 'none',
        obtainedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute a single cURL request
   */
  async executeRequest(
    curlRequest: CurlRequest,
    config: AuthenticationConfig,
    _credentials: AuthenticationCredentials,
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

    log('SYSTEM', `Executing cURL: ${curlRequest.title}`);

    try {
      // Substitute placeholders in the cURL command
      const substitutionResult = substituteAllPlaceholders(
        curlRequest.command,
        options?.variables ?? {},
        { timestamp: true, uuid: true }
      );

      if (substitutionResult.unresolvedPlaceholders.length > 0) {
        log('WARNING', `Unresolved placeholders: ${substitutionResult.unresolvedPlaceholders.join(', ')}`);
      }

      const processedCommand = substitutionResult.result;
      log('INFO', `Processed command: ${processedCommand.substring(0, 100)}...`);

      // Parse the cURL command
      const parsed = parseCurlCommand(processedCommand);
      
      if (!parsed.url) {
        throw new Error('Could not extract URL from cURL command');
      }

      // Apply base URL if configured
      let url = parsed.url;
      if (config.curlDefault?.baseUrl && !url.startsWith('http')) {
        url = `${config.curlDefault.baseUrl}${url}`;
      }

      log('INFO', `Request URL: ${url}`);
      log('INFO', `Method: ${parsed.method}`);

      // Convert to fetch options
      const fetchOptions = curlToFetchOptions(parsed);

      // Add any default headers from config
      if (config.curlDefault?.defaultHeaders) {
        fetchOptions.headers = {
          ...config.curlDefault.defaultHeaders,
          ...fetchOptions.headers,
        };
      }

      // Add additional headers from options
      if (options?.additionalHeaders) {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          ...options.additionalHeaders,
        };
      }

      // Set timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options?.timeout ?? 30000
      );

      // Merge abort signals
      if (options?.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
      }

      fetchOptions.signal = controller.signal;

      // Execute the request
      log('INFO', 'Sending request...');
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      log('INFO', `Response status: ${response.status} ${response.statusText}`);

      // Parse response body
      let responseBody: unknown;
      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        responseBody = await response.json();
      } else if (contentType.includes('text/')) {
        responseBody = await response.text();
      } else {
        responseBody = await response.text();
      }

      if (response.ok) {
        log('SUCCESS', `Request completed successfully`);
        return this.createSuccessResult(response, responseBody, logs, startTime);
      } else {
        log('ERROR', `Request failed with status ${response.status}`);
        return {
          ...this.createSuccessResult(response, responseBody, logs, startTime),
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      if (message.includes('abort')) {
        log('WARNING', 'Request was cancelled or timed out');
      } else {
        log('ERROR', `Request failed: ${message}`);
      }

      return this.createErrorResult(message, logs, startTime);
    }
  }

  /**
   * Generate sample cURL command
   */
  generateSampleCurl(_config: AuthenticationConfig): string {
    return `curl -X GET "https://api.example.com/resource" \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \\
  -H "Content-Type: application/json"`;
  }

  /**
   * Test connection by making a HEAD request to base URL
   */
  async testConnection(config: AuthenticationConfig): Promise<{
    success: boolean;
    message: string;
    latencyMs?: number;
  }> {
    const baseUrl = config.curlDefault?.baseUrl;
    
    if (!baseUrl) {
      return {
        success: false,
        message: 'No base URL configured for connection test',
      };
    }

    const startTime = Date.now();

    try {
      const response = await fetch(baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - startTime;

      return {
        success: response.ok,
        message: response.ok 
          ? `Connected successfully (${response.status})`
          : `Server returned ${response.status}`,
        latencyMs,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        latencyMs: Date.now() - startTime,
      };
    }
  }
}

export default CurlDefaultHandler;
