// ============================================
// PROTOCOL OS - REST API KEY HANDLER
// ============================================
// Address: 1.4.6.a
// Purpose: Simple API key authentication handler
// ============================================

import {
  BaseProtocolHandler,
  type AuthenticationValidationResult,
  type HandshakeExecutionOptions,
} from '@registry/1.3.a_fileProtocolHandlerInterface';
import type { AuthenticationConfig, AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { substituteAllPlaceholders } from '@utils/1.8.e_fileInputPlaceholderSubstitution';

/**
 * API Key placement options
 */
export type ApiKeyPlacement = 'header' | 'query' | 'body';

/**
 * REST API Key Handler
 * 
 * Simple API key authentication in header, query params, or body.
 */
export class RestApiKeyHandler extends BaseProtocolHandler {
  readonly protocolType = 'rest-api-key' as const;
  readonly displayName = 'REST API Key';
  readonly description = 'Simple API key authentication in header, query, or body';
  readonly supportsTokenRefresh = false;
  readonly requiresUserInteraction = false;
  readonly iconId = 'key-round';

  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult {
    const missingFields: string[] = [];
    const apiKeyConfig = config.restApiKey;

    if (!apiKeyConfig) {
      return { isValid: false, missingFields: ['restApiKey configuration'], invalidFields: [], warnings: [] };
    }

    if (!apiKeyConfig.apiKey) missingFields.push('apiKey');
    if (!apiKeyConfig.keyName) missingFields.push('keyName');

    const warnings: string[] = [];
    if (apiKeyConfig.placement === 'query') {
      warnings.push('API keys in query params may be logged in server access logs');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      invalidFields: [],
      warnings,
    };
  }

  getRequiredFields(): string[] {
    return ['apiKey', 'keyName'];
  }

  getOptionalFields(): string[] {
    return ['placement', 'prefix'];
  }

  async authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    const apiKeyConfig = config.restApiKey;
    
    if (!apiKeyConfig?.apiKey) {
      return { success: false, error: 'API key not provided' };
    }

    return {
      success: true,
      credentials: {
        type: 'api-key',
        apiKey: apiKeyConfig.apiKey,
        keyName: apiKeyConfig.keyName,
        placement: apiKeyConfig.placement || 'header',
        prefix: apiKeyConfig.prefix,
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

    log('INFO', `Executing: ${curlRequest.title}`);

    try {
      // Substitute placeholders
      const substituted = substituteAllPlaceholders(
        curlRequest.command,
        options?.variables ?? {},
        { timestamp: true, uuid: true }
      );

      const urlMatch = substituted.result.match(/["']?(https?:\/\/[^"'\s]+)["']?/);
      if (!urlMatch) throw new Error('Could not extract URL');

      let url = new URL(urlMatch[1]);
      const methodMatch = substituted.result.match(/-X\s+(\w+)/i);
      const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.additionalHeaders,
      };

      // Apply API key based on placement
      const apiKeyConfig = config.restApiKey!;
      const keyValue = apiKeyConfig.prefix 
        ? `${apiKeyConfig.prefix}${credentials.apiKey}`
        : credentials.apiKey!;

      switch (apiKeyConfig.placement || 'header') {
        case 'header':
          headers[apiKeyConfig.keyName] = keyValue;
          break;
        case 'query':
          url.searchParams.set(apiKeyConfig.keyName, keyValue);
          break;
        case 'body':
          // Body handling would be more complex
          log('WARNING', 'Body placement requires manual configuration');
          break;
      }

      log('INFO', `${method} ${url.origin}${url.pathname}`);

      const response = await fetch(url.toString(), {
        method,
        headers,
        signal: options?.signal,
      });

      const responseBody = await response.json().catch(() => response.text());
      log(response.ok ? 'SUCCESS' : 'ERROR', `Status: ${response.status}`);
      return this.createSuccessResult(response, responseBody, logs, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log('ERROR', message);
      return this.createErrorResult(message, logs, startTime);
    }
  }

  generateSampleCurl(config: AuthenticationConfig): string {
    const apiKeyConfig = config.restApiKey;
    const keyName = apiKeyConfig?.keyName || 'X-API-Key';
    
    return `curl -X GET "https://api.example.com/resource" \\
  -H "${keyName}: {API_KEY}" \\
  -H "Content-Type: application/json"`;
  }

  async testConnection(config: AuthenticationConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const apiKeyConfig = config.restApiKey;
    if (!apiKeyConfig?.apiKey) {
      return { success: false, message: 'API key not configured' };
    }
    return { success: true, message: 'API key configured (no test endpoint available)' };
  }
}

export default RestApiKeyHandler;
