// ============================================
// PROTOCOL OS - OAUTH AUTHORIZATION CODE HANDLER
// ============================================
// Address: 1.4.3.a
// Purpose: OAuth 2.0 Authorization Code flow handler
// ============================================

import {
  BaseProtocolHandler,
  type AuthenticationValidationResult,
  type HandshakeExecutionOptions,
  type TokenRefreshResult,
} from '@registry/1.3.a_fileProtocolHandlerInterface';
import type { 
  AuthenticationConfig, 
  AuthenticationCredentials,
} from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { generateRandomString } from '@utils/1.8.c_fileRandomStringGenerator';

/**
 * OAuth 2.0 Authorization Code Handler
 * 
 * Standard OAuth flow for confidential clients (server-side apps).
 * Requires a client secret for token exchange.
 */
export class OAuthAuthCodeHandler extends BaseProtocolHandler {
  readonly protocolType = 'oauth-auth-code' as const;
  readonly displayName = 'OAuth 2.0 Authorization Code';
  readonly description = 'Standard OAuth flow with client secret for server-side apps';
  readonly supportsTokenRefresh = true;
  readonly requiresUserInteraction = true;
  readonly iconId = 'key';

  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult {
    const missingFields: string[] = [];
    const invalidFields: { field: string; reason: string }[] = [];
    const warnings: string[] = [];

    const authCodeConfig = config.oauthAuthCode;

    if (!authCodeConfig) {
      return {
        isValid: false,
        missingFields: ['oauthAuthCode configuration'],
        invalidFields: [],
        warnings: [],
      };
    }

    if (!authCodeConfig.clientId) missingFields.push('clientId');
    if (!authCodeConfig.clientSecret) missingFields.push('clientSecret');
    if (!authCodeConfig.authorizationUrl) missingFields.push('authorizationUrl');
    if (!authCodeConfig.tokenUrl) missingFields.push('tokenUrl');
    if (!authCodeConfig.redirectUri) missingFields.push('redirectUri');

    warnings.push('Client secret should be stored securely on server-side');

    return {
      isValid: missingFields.length === 0 && invalidFields.length === 0,
      missingFields,
      invalidFields,
      warnings,
    };
  }

  getRequiredFields(): string[] {
    return ['clientId', 'clientSecret', 'authorizationUrl', 'tokenUrl', 'redirectUri'];
  }

  getOptionalFields(): string[] {
    return ['scopes', 'audience', 'additionalParams'];
  }

  async authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    const authCodeConfig = config.oauthAuthCode;
    
    if (!authCodeConfig) {
      return { success: false, error: 'OAuth Auth Code configuration not provided' };
    }

    const state = generateRandomString(32);
    const url = new URL(authCodeConfig.authorizationUrl);
    
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', authCodeConfig.clientId);
    url.searchParams.set('redirect_uri', authCodeConfig.redirectUri);
    url.searchParams.set('state', state);

    if (authCodeConfig.scopes?.length) {
      url.searchParams.set('scope', authCodeConfig.scopes.join(' '));
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

  async refreshToken(
    config: AuthenticationConfig,
    currentCredentials: AuthenticationCredentials
  ): Promise<TokenRefreshResult> {
    const authCodeConfig = config.oauthAuthCode;
    
    if (!authCodeConfig || !currentCredentials.refreshToken) {
      return { success: false, error: 'Missing configuration or refresh token' };
    }

    try {
      const response = await fetch(authCodeConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${authCodeConfig.clientId}:${authCodeConfig.clientSecret}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: currentCredentials.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        return { success: false, error: `Token refresh failed: ${response.status}` };
      }

      const tokens = await response.json();

      return {
        success: true,
        newCredentials: {
          type: 'oauth',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || currentCredentials.refreshToken,
          tokenType: tokens.token_type || 'Bearer',
          expiresAt: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : undefined,
          obtainedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Token refresh failed' };
    }
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
    return `curl -X GET "https://api.example.com/resource" \\
  -H "Authorization: Bearer {ACCESS_TOKEN}"`;
  }

  async testConnection(config: AuthenticationConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const authCodeConfig = config.oauthAuthCode;
    if (!authCodeConfig?.tokenUrl) {
      return { success: false, message: 'Token URL not configured' };
    }

    const startTime = Date.now();
    try {
      const response = await fetch(authCodeConfig.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=test',
        signal: AbortSignal.timeout(5000),
      });
      return { success: true, message: `Endpoint reachable (${response.status})`, latencyMs: Date.now() - startTime };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
    }
  }
}

export default OAuthAuthCodeHandler;
