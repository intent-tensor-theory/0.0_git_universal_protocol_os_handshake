// ============================================
// PROTOCOL OS - CLIENT CREDENTIALS HANDLER
// ============================================
// Address: 1.4.5.a
// Purpose: OAuth 2.0 Client Credentials flow for M2M auth
// ============================================

import {
  BaseProtocolHandler,
  type AuthenticationValidationResult,
  type HandshakeExecutionOptions,
  type TokenRefreshResult,
} from '@registry/1.3.a_fileProtocolHandlerInterface';
import type { AuthenticationConfig, AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';

/**
 * OAuth 2.0 Client Credentials Handler
 * 
 * Machine-to-machine authentication without user context.
 * Uses client_id and client_secret to obtain access tokens.
 */
export class ClientCredentialsHandler extends BaseProtocolHandler {
  readonly protocolType = 'client-credentials' as const;
  readonly displayName = 'Client Credentials';
  readonly description = 'Machine-to-machine authentication without user context';
  readonly supportsTokenRefresh = true;
  readonly requiresUserInteraction = false;
  readonly iconId = 'server';

  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult {
    const missingFields: string[] = [];
    const ccConfig = config.clientCredentials;

    if (!ccConfig) {
      return { isValid: false, missingFields: ['clientCredentials configuration'], invalidFields: [], warnings: [] };
    }

    if (!ccConfig.clientId) missingFields.push('clientId');
    if (!ccConfig.clientSecret) missingFields.push('clientSecret');
    if (!ccConfig.tokenUrl) missingFields.push('tokenUrl');

    return {
      isValid: missingFields.length === 0,
      missingFields,
      invalidFields: [],
      warnings: ['Ensure client secret is stored securely'],
    };
  }

  getRequiredFields(): string[] {
    return ['clientId', 'clientSecret', 'tokenUrl'];
  }

  getOptionalFields(): string[] {
    return ['scopes', 'audience'];
  }

  async authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    const ccConfig = config.clientCredentials;
    
    if (!ccConfig) {
      return { success: false, error: 'Client Credentials configuration not provided' };
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: ccConfig.clientId,
        client_secret: ccConfig.clientSecret,
      });

      if (ccConfig.scopes?.length) {
        body.set('scope', ccConfig.scopes.join(' '));
      }

      if (ccConfig.audience) {
        body.set('audience', ccConfig.audience);
      }

      const response = await fetch(ccConfig.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Token request failed: ${error}` };
      }

      const tokens = await response.json();

      return {
        success: true,
        credentials: {
          type: 'oauth',
          accessToken: tokens.access_token,
          tokenType: tokens.token_type || 'Bearer',
          expiresAt: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : undefined,
          scopes: tokens.scope?.split(' '),
          obtainedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
    }
  }

  async refreshToken(
    config: AuthenticationConfig,
    _currentCredentials: AuthenticationCredentials
  ): Promise<TokenRefreshResult> {
    // Client credentials just gets a new token
    const result = await this.authenticate(config);
    
    if (result.success && result.credentials) {
      return { success: true, newCredentials: result.credentials };
    }
    
    return { success: false, error: result.error };
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

    // Check token expiry
    if (credentials.expiresAt && new Date(credentials.expiresAt) <= new Date()) {
      log('INFO', 'Token expired, refreshing...');
      const refreshResult = await this.refreshToken(config, credentials);
      if (refreshResult.success && refreshResult.newCredentials) {
        credentials = refreshResult.newCredentials;
        log('SUCCESS', 'Token refreshed');
      } else {
        return this.createErrorResult(refreshResult.error || 'Token refresh failed', logs, startTime);
      }
    }

    log('INFO', `Executing: ${curlRequest.title}`);

    try {
      const urlMatch = curlRequest.command.match(/["']?(https?:\/\/[^"'\s]+)["']?/);
      if (!urlMatch) throw new Error('Could not extract URL');

      const response = await fetch(urlMatch[1], {
        method: 'GET',
        headers: {
          'Authorization': `${credentials.tokenType || 'Bearer'} ${credentials.accessToken}`,
          ...options?.additionalHeaders,
        },
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

  generateSampleCurl(_config: AuthenticationConfig): string {
    return `# First, obtain a token:
curl -X POST "{TOKEN_URL}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id={CLIENT_ID}" \\
  -d "client_secret={CLIENT_SECRET}"

# Then use the token:
curl -X GET "https://api.example.com/resource" \\
  -H "Authorization: Bearer {ACCESS_TOKEN}"`;
  }

  async testConnection(config: AuthenticationConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const startTime = Date.now();
    const result = await this.authenticate(config);
    return {
      success: result.success,
      message: result.success ? 'Successfully obtained access token' : (result.error || 'Authentication failed'),
      latencyMs: Date.now() - startTime,
    };
  }
}

export default ClientCredentialsHandler;
