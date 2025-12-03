// ============================================
// PROTOCOL OS - OAUTH IMPLICIT HANDLER
// ============================================
// Address: 1.4.4.a
// Purpose: OAuth 2.0 Implicit flow handler (DEPRECATED)
// ============================================

import {
  BaseProtocolHandler,
  type AuthenticationValidationResult,
  type HandshakeExecutionOptions,
} from '@registry/1.3.a_fileProtocolHandlerInterface';
import type { AuthenticationConfig, AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { generateRandomString } from '@utils/1.8.c_fileRandomStringGenerator';

/**
 * OAuth 2.0 Implicit Handler
 * 
 * ⚠️ DEPRECATED: This flow is no longer recommended.
 * Use OAuth PKCE instead for public clients.
 * 
 * The implicit flow returns the access token directly in the URL fragment,
 * which exposes it to potential interception via browser history and referrer headers.
 */
export class OAuthImplicitHandler extends BaseProtocolHandler {
  readonly protocolType = 'oauth-implicit' as const;
  readonly displayName = 'OAuth 2.0 Implicit (Deprecated)';
  readonly description = 'Legacy OAuth flow - use PKCE instead';
  readonly supportsTokenRefresh = false;
  readonly requiresUserInteraction = true;
  readonly iconId = 'alert-triangle';

  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult {
    const missingFields: string[] = [];
    const warnings: string[] = [
      '⚠️ The Implicit flow is DEPRECATED and insecure',
      '⚠️ Consider using OAuth PKCE instead',
      '⚠️ Tokens cannot be refreshed with this flow',
    ];

    const implicitConfig = config.oauthImplicit;

    if (!implicitConfig) {
      return { isValid: false, missingFields: ['oauthImplicit configuration'], invalidFields: [], warnings };
    }

    if (!implicitConfig.clientId) missingFields.push('clientId');
    if (!implicitConfig.authorizationUrl) missingFields.push('authorizationUrl');
    if (!implicitConfig.redirectUri) missingFields.push('redirectUri');

    return {
      isValid: missingFields.length === 0,
      missingFields,
      invalidFields: [],
      warnings,
    };
  }

  getRequiredFields(): string[] {
    return ['clientId', 'authorizationUrl', 'redirectUri'];
  }

  getOptionalFields(): string[] {
    return ['scopes'];
  }

  async authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    const implicitConfig = config.oauthImplicit;
    
    if (!implicitConfig) {
      return { success: false, error: 'OAuth Implicit configuration not provided' };
    }

    const state = generateRandomString(32);
    const nonce = generateRandomString(32);
    const url = new URL(implicitConfig.authorizationUrl);
    
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('client_id', implicitConfig.clientId);
    url.searchParams.set('redirect_uri', implicitConfig.redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('nonce', nonce);

    if (implicitConfig.scopes?.length) {
      url.searchParams.set('scope', implicitConfig.scopes.join(' '));
    }

    return {
      success: false,
      error: `Authorization required. Please visit: ${url.toString()}`,
      credentials: {
        type: 'oauth-pending',
        authorizationUrl: url.toString(),
        state,
        obtainedAt: new Date().toISOString(),
      } as AuthenticationCredentials,
    };
  }

  async executeRequest(
    curlRequest: CurlRequest,
    _config: AuthenticationConfig,
    credentials: AuthenticationCredentials,
    options?: HandshakeExecutionOptions
  ): Promise<HandshakeExecutionResult> {
    const startTime = Date.now();
    const logs: ExecutionLogEntry[] = [];

    const log = (level: ExecutionLogEntry['level'], message: string) => {
      logs.push({ timestamp: new Date().toISOString(), level, message });
      options?.onLog?.({ timestamp: new Date().toISOString(), level, message });
    };

    log('WARNING', 'Using deprecated OAuth Implicit flow');
    log('INFO', `Executing: ${curlRequest.title}`);

    try {
      const urlMatch = curlRequest.command.match(/["']?(https?:\/\/[^"'\s]+)["']?/);
      if (!urlMatch) throw new Error('Could not extract URL');

      const response = await fetch(urlMatch[1], {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
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
    return `# ⚠️ DEPRECATED: Use OAuth PKCE instead
curl -X GET "https://api.example.com/resource" \\
  -H "Authorization: Bearer {ACCESS_TOKEN}"`;
  }

  async testConnection(config: AuthenticationConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    return { success: true, message: '⚠️ Implicit flow is deprecated - consider using PKCE' };
  }
}

export default OAuthImplicitHandler;
