// ============================================
// PROTOCOL OS - OAUTH PKCE HANDLER
// ============================================
// Address: 1.4.2.a
// Purpose: OAuth 2.0 PKCE flow handler for public clients
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
  OAuthPkceConfig,
} from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { generatePkceVerifier, generateRandomString } from '@utils/1.8.c_fileRandomStringGenerator';
import { generatePkceCodeChallenge } from '@utils/1.8.b_fileSha256HashGenerator';

/**
 * OAuth 2.0 PKCE Handler
 * 
 * Implements the Proof Key for Code Exchange (PKCE) extension to OAuth 2.0.
 * Designed for public clients (SPAs, mobile apps) that cannot securely store
 * client secrets.
 * 
 * Flow:
 * 1. Generate code_verifier and code_challenge
 * 2. Redirect user to authorization URL with code_challenge
 * 3. User authenticates and authorizes
 * 4. Receive authorization code via redirect
 * 5. Exchange code + code_verifier for tokens
 * 6. Use access_token for API requests
 * 7. Refresh tokens when expired
 */
export class OAuthPkceHandler extends BaseProtocolHandler {
  readonly protocolType = 'oauth-pkce' as const;
  readonly displayName = 'OAuth 2.0 PKCE';
  readonly description = 'Secure OAuth flow for public clients (SPAs, mobile apps)';
  readonly supportsTokenRefresh = true;
  readonly requiresUserInteraction = true;
  readonly iconId = 'shield-check';

  // Store PKCE state during authorization flow
  private pkceState: Map<string, { verifier: string; state: string }> = new Map();

  /**
   * Validate OAuth PKCE configuration
   */
  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult {
    const missingFields: string[] = [];
    const invalidFields: { field: string; reason: string }[] = [];
    const warnings: string[] = [];

    const pkceConfig = config.oauthPkce;

    if (!pkceConfig) {
      return {
        isValid: false,
        missingFields: ['oauthPkce configuration'],
        invalidFields: [],
        warnings: [],
      };
    }

    // Required fields
    if (!pkceConfig.clientId) missingFields.push('clientId');
    if (!pkceConfig.authorizationUrl) missingFields.push('authorizationUrl');
    if (!pkceConfig.tokenUrl) missingFields.push('tokenUrl');
    if (!pkceConfig.redirectUri) missingFields.push('redirectUri');

    // Validate URLs
    if (pkceConfig.authorizationUrl && !this.isValidUrl(pkceConfig.authorizationUrl)) {
      invalidFields.push({ field: 'authorizationUrl', reason: 'Invalid URL format' });
    }
    if (pkceConfig.tokenUrl && !this.isValidUrl(pkceConfig.tokenUrl)) {
      invalidFields.push({ field: 'tokenUrl', reason: 'Invalid URL format' });
    }
    if (pkceConfig.redirectUri && !this.isValidUrl(pkceConfig.redirectUri)) {
      invalidFields.push({ field: 'redirectUri', reason: 'Invalid URL format' });
    }

    // Warnings
    if (!pkceConfig.scopes || pkceConfig.scopes.length === 0) {
      warnings.push('No scopes specified - some APIs require specific scopes');
    }

    return {
      isValid: missingFields.length === 0 && invalidFields.length === 0,
      missingFields,
      invalidFields,
      warnings,
    };
  }

  /**
   * Required fields for OAuth PKCE
   */
  getRequiredFields(): string[] {
    return ['clientId', 'authorizationUrl', 'tokenUrl', 'redirectUri'];
  }

  /**
   * Optional fields for OAuth PKCE
   */
  getOptionalFields(): string[] {
    return ['scopes', 'audience', 'additionalParams'];
  }

  /**
   * Build the authorization URL for PKCE flow
   */
  buildAuthorizationUrl(config: OAuthPkceConfig): {
    url: string;
    state: string;
    codeVerifier: string;
  } {
    // Generate PKCE values
    const codeVerifier = generatePkceVerifier();
    const codeChallenge = generatePkceCodeChallenge(codeVerifier);
    const state = generateRandomString(32);

    // Build URL
    const url = new URL(config.authorizationUrl);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);

    if (config.scopes && config.scopes.length > 0) {
      url.searchParams.set('scope', config.scopes.join(' '));
    }

    if (config.audience) {
      url.searchParams.set('audience', config.audience);
    }

    // Add any additional params
    if (config.additionalParams) {
      Object.entries(config.additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    // Store state for verification
    this.pkceState.set(state, { verifier: codeVerifier, state });

    return {
      url: url.toString(),
      state,
      codeVerifier,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    config: OAuthPkceConfig,
    code: string,
    state: string
  ): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    // Verify state and get verifier
    const pkceData = this.pkceState.get(state);
    if (!pkceData) {
      return { success: false, error: 'Invalid or expired state parameter' };
    }

    // Clean up state
    this.pkceState.delete(state);

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: config.clientId,
          code,
          redirect_uri: config.redirectUri,
          code_verifier: pkceData.verifier,
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Token exchange failed: ${error}` };
      }

      const tokens = await response.json();

      return {
        success: true,
        credentials: {
          type: 'oauth',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenType: tokens.token_type || 'Bearer',
          expiresAt: tokens.expires_in 
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : undefined,
          scopes: tokens.scope?.split(' '),
          obtainedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange failed',
      };
    }
  }

  /**
   * Authenticate - initiates the PKCE flow
   */
  async authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    const pkceConfig = config.oauthPkce;
    
    if (!pkceConfig) {
      return { success: false, error: 'OAuth PKCE configuration not provided' };
    }

    // Build authorization URL
    const { url, state, codeVerifier } = this.buildAuthorizationUrl(pkceConfig);

    // In a real implementation, this would:
    // 1. Open a popup or redirect to the authorization URL
    // 2. Wait for the callback with the authorization code
    // 3. Exchange the code for tokens
    
    // For now, return the URL for the UI to handle
    return {
      success: false,
      error: `Authorization required. Please visit: ${url}`,
      credentials: {
        type: 'oauth-pending',
        authorizationUrl: url,
        state,
        codeVerifier,
        obtainedAt: new Date().toISOString(),
      } as AuthenticationCredentials,
    };
  }

  /**
   * Refresh expired tokens
   */
  async refreshToken(
    config: AuthenticationConfig,
    currentCredentials: AuthenticationCredentials
  ): Promise<TokenRefreshResult> {
    const pkceConfig = config.oauthPkce;
    
    if (!pkceConfig) {
      return { success: false, error: 'OAuth PKCE configuration not provided' };
    }

    if (!currentCredentials.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    try {
      const response = await fetch(pkceConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: pkceConfig.clientId,
          refresh_token: currentCredentials.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Token refresh failed: ${error}` };
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
          scopes: tokens.scope?.split(' ') || currentCredentials.scopes,
          obtainedAt: new Date().toISOString(),
        },
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  /**
   * Execute a request with OAuth authentication
   */
  async executeRequest(
    curlRequest: CurlRequest,
    config: AuthenticationConfig,
    credentials: AuthenticationCredentials,
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

    // Check if token is expired
    if (credentials.expiresAt) {
      const expiresAt = new Date(credentials.expiresAt);
      if (expiresAt <= new Date()) {
        log('WARNING', 'Access token has expired');
        
        // Try to refresh
        if (credentials.refreshToken) {
          log('INFO', 'Attempting token refresh...');
          const refreshResult = await this.refreshToken(config, credentials);
          
          if (refreshResult.success && refreshResult.newCredentials) {
            credentials = refreshResult.newCredentials;
            log('SUCCESS', 'Token refreshed successfully');
          } else {
            return this.createErrorResult(
              `Token refresh failed: ${refreshResult.error}`,
              logs,
              startTime
            );
          }
        } else {
          return this.createErrorResult('Token expired and no refresh token available', logs, startTime);
        }
      }
    }

    log('INFO', `Executing request: ${curlRequest.title}`);

    try {
      // Parse URL from curl command (simplified)
      const urlMatch = curlRequest.command.match(/["']?(https?:\/\/[^"'\s]+)["']?/);
      if (!urlMatch) {
        throw new Error('Could not extract URL from cURL command');
      }

      const url = urlMatch[1];
      const methodMatch = curlRequest.command.match(/-X\s+(\w+)/i);
      const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

      log('INFO', `${method} ${url}`);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `${credentials.tokenType || 'Bearer'} ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          ...options?.additionalHeaders,
        },
        signal: options?.signal,
      });

      const responseBody = await response.json().catch(() => response.text());

      if (response.ok) {
        log('SUCCESS', `Request completed: ${response.status}`);
        return this.createSuccessResult(response, responseBody, logs, startTime);
      } else {
        log('ERROR', `Request failed: ${response.status}`);
        return {
          ...this.createSuccessResult(response, responseBody, logs, startTime),
          success: false,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log('ERROR', message);
      return this.createErrorResult(message, logs, startTime);
    }
  }

  /**
   * Generate sample cURL for OAuth PKCE
   */
  generateSampleCurl(config: AuthenticationConfig): string {
    return `curl -X GET "https://api.example.com/resource" \\
  -H "Authorization: Bearer {ACCESS_TOKEN}" \\
  -H "Content-Type: application/json"`;
  }

  /**
   * Test connection to token endpoint
   */
  async testConnection(config: AuthenticationConfig): Promise<{
    success: boolean;
    message: string;
    latencyMs?: number;
  }> {
    const pkceConfig = config.oauthPkce;
    
    if (!pkceConfig?.tokenUrl) {
      return { success: false, message: 'Token URL not configured' };
    }

    const startTime = Date.now();

    try {
      // Just check if the endpoint is reachable
      const response = await fetch(pkceConfig.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=test', // Will fail but shows endpoint is reachable
        signal: AbortSignal.timeout(5000),
      });

      const latencyMs = Date.now() - startTime;

      // Even a 400 error means the endpoint is reachable
      return {
        success: true,
        message: `Token endpoint reachable (${response.status})`,
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

  /**
   * Helper to validate URL format
   */
  private isValidUrl(urlString: string): boolean {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  }
}

export default OAuthPkceHandler;
