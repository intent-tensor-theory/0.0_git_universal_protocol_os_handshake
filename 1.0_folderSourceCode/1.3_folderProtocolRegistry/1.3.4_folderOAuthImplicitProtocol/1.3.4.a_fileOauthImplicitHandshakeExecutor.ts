// ============================================
// PROTOCOL OS - OAUTH IMPLICIT HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.4.a
// Purpose: OAuth 2.0 Implicit Grant Flow (Legacy - Deprecated)
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
 * ⚠️ DEPRECATION NOTICE
 * 
 * The OAuth 2.0 Implicit Grant is DEPRECATED as of OAuth 2.0 Security Best
 * Current Practice (RFC 9700) and OAuth 2.1. It is included in Protocol OS
 * for legacy system compatibility only.
 * 
 * For new implementations, use:
 * - OAuth 2.0 with PKCE (1.3.2) for SPAs and mobile apps
 * - OAuth 2.0 Authorization Code (1.3.3) for server-side apps
 * 
 * Security concerns with Implicit Grant:
 * - Access token exposed in URL fragment
 * - Token may leak via browser history
 * - Token may leak via Referer header
 * - No refresh tokens
 * - Vulnerable to token injection attacks
 */

/**
 * OAuth Implicit configuration
 */
export interface OAuthImplicitConfiguration {
  /** OAuth authorization endpoint */
  authorizationUrl: string;
  
  /** Client ID */
  clientId: string;
  
  /** Redirect URI for callback */
  redirectUri: string;
  
  /** Requested scopes */
  scopes: string[];
  
  /** Optional: User info endpoint */
  userInfoUrl?: string;
  
  /** Response type (token or token id_token) */
  responseType: 'token' | 'token id_token';
  
  /** Optional: Additional authorization params */
  additionalAuthParams?: Record<string, string>;
}

/**
 * Implicit flow state
 */
export interface ImplicitFlowState {
  /** State parameter */
  state: string;
  
  /** Nonce for OpenID Connect */
  nonce?: string;
  
  /** Timestamp when flow started */
  startedAt: number;
  
  /** Redirect URI used */
  redirectUri: string;
  
  /** Requested scopes */
  scopes: string[];
}

/**
 * Parsed token from URL fragment
 */
export interface ImplicitTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  scope?: string;
  state?: string;
  idToken?: string;
  error?: string;
  errorDescription?: string;
}

/**
 * OAuth Implicit Protocol Module (DEPRECATED)
 * 
 * ⚠️ WARNING: This flow is deprecated and has known security vulnerabilities.
 * Use OAuth PKCE (1.3.2) for new implementations.
 * 
 * The Implicit Grant was designed for browser-based applications before PKCE
 * existed. It returns the access_token directly in the URL fragment, which
 * poses security risks.
 * 
 * Flow:
 * 1. Redirect user to authorization URL with response_type=token
 * 2. User authenticates and authorizes
 * 3. Access token returned directly in URL fragment (#access_token=...)
 * 4. Client extracts token from fragment
 * 5. Use access_token for API requests
 * 
 * Limitations:
 * - No refresh tokens (must re-authenticate when token expires)
 * - Token exposed in browser history and logs
 * - Vulnerable to token leakage attacks
 */
export class OAuthImplicitHandshakeExecutor extends BaseProtocolModule {
  private flowState: ImplicitFlowState | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    super();
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'oauth2-implicit',
      displayName: 'OAuth 2.0 Implicit (Deprecated)',
      description: '⚠️ DEPRECATED: Legacy OAuth flow that returns tokens in URL. Use PKCE instead for new projects.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/oauth-implicit',
      icon: 'alert-triangle',
      capabilities: this.getCapabilities(),
      useCases: [
        'Legacy SPA integrations',
        'Older OAuth providers',
        'Simple demo applications',
        'Read-only API access',
        'Short-lived sessions',
      ],
      examplePlatforms: [
        'Legacy OAuth 1.0/2.0 providers',
        'Older enterprise systems',
        'Custom OAuth implementations',
      ],
    };
  }

  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRedirectFlow: true,
      supportsTokenRefresh: false, // Implicit grant does NOT support refresh
      supportsTokenRevocation: false, // Typically not available
      supportsScopes: true,
      supportsIncrementalAuth: false,
      supportsOfflineAccess: false, // No refresh tokens
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
        id: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'OAuth application client ID.',
        placeholder: 'your-client-id',
        group: 'credentials',
        order: 1,
      },
      {
        id: 'authorizationUrl',
        label: 'Authorization URL',
        type: 'url',
        required: true,
        description: 'OAuth authorization endpoint URL.',
        placeholder: 'https://provider.com/oauth/authorize',
        group: 'endpoints',
        order: 1,
      },
      {
        id: 'redirectUri',
        label: 'Redirect URI',
        type: 'url',
        required: true,
        description: 'Callback URL to receive the access token.',
        placeholder: 'https://yourapp.com/auth/callback',
        group: 'endpoints',
        order: 2,
      },
      {
        id: 'scopes',
        label: 'Scopes',
        type: 'scopes',
        required: true,
        description: 'OAuth scopes to request (space-separated).',
        placeholder: 'openid email profile',
        group: 'authorization',
        order: 1,
      },
    ];
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'responseType',
        label: 'Response Type',
        type: 'select',
        required: false,
        description: 'Type of token to request.',
        defaultValue: 'token',
        options: [
          { value: 'token', label: 'Access Token Only' },
          { value: 'token id_token', label: 'Access Token + ID Token (OpenID)' },
        ],
        group: 'authorization',
        order: 2,
      },
      {
        id: 'userInfoUrl',
        label: 'User Info URL',
        type: 'url',
        required: false,
        description: 'Endpoint to fetch user profile information.',
        placeholder: 'https://provider.com/oauth/userinfo',
        group: 'endpoints',
        order: 3,
      },
      {
        id: 'additionalAuthParams',
        label: 'Additional Auth Parameters',
        type: 'json',
        required: false,
        description: 'Extra parameters for authorization request.',
        placeholder: '{"prompt": "consent"}',
        group: 'advanced',
        order: 1,
      },
      {
        id: 'accessToken',
        label: 'Access Token',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'Current access token (populated after authentication).',
        group: 'tokens',
        order: 1,
      },
      {
        id: 'tokenExpiresAt',
        label: 'Token Expires At',
        type: 'hidden',
        required: false,
        description: 'Unix timestamp when access token expires.',
        group: 'tokens',
        order: 2,
      },
      {
        id: 'idToken',
        label: 'ID Token',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'OpenID Connect ID token (if requested).',
        group: 'tokens',
        order: 3,
      },
    ];
  }

  getFieldGroups() {
    return [
      {
        id: 'deprecation',
        label: '⚠️ Deprecation Warning',
        description: 'This OAuth flow is deprecated. Consider using PKCE instead.',
      },
      {
        id: 'credentials',
        label: 'OAuth Credentials',
        description: 'Your OAuth application credentials.',
      },
      {
        id: 'endpoints',
        label: 'OAuth Endpoints',
        description: 'Provider OAuth endpoint URLs.',
      },
      {
        id: 'authorization',
        label: 'Authorization Settings',
        description: 'Scopes and response type.',
      },
      {
        id: 'tokens',
        label: 'Tokens',
        description: 'Current authentication tokens.',
        collapsible: true,
        defaultCollapsed: true,
      },
      {
        id: 'advanced',
        label: 'Advanced',
        description: 'Additional configuration options.',
        collapsible: true,
        defaultCollapsed: true,
      },
    ];
  }

  // ============================================
  // AUTHENTICATION FLOW
  // ============================================

  async authenticate(
    credentials: Partial<AuthenticationCredentials>,
    currentStep?: number
  ): Promise<ProtocolAuthenticationFlow> {
    const step = currentStep || 1;

    switch (step) {
      case 1:
        return this.startAuthorizationFlow(credentials);
      case 2:
        return this.awaitingCallback();
      case 3:
        return this.completeAuthentication(credentials);
      default:
        return {
          step: 1,
          totalSteps: 3,
          type: 'error',
          title: 'Invalid Step',
          description: 'Unknown authentication step.',
          error: `Invalid step: ${step}`,
        };
    }
  }

  /**
   * Step 1: Generate authorization URL
   */
  private async startAuthorizationFlow(
    credentials: Partial<AuthenticationCredentials>
  ): Promise<ProtocolAuthenticationFlow> {
    // Validate required fields
    const validation = this.validateCredentials(credentials);
    if (!validation.valid) {
      return {
        step: 1,
        totalSteps: 3,
        type: 'error',
        title: 'Configuration Error',
        description: 'Please fix the configuration errors.',
        error: Object.values(validation.fieldErrors).join(', '),
      };
    }

    // Generate state and nonce
    const state = this.generateState();
    const nonce = this.generateNonce();

    // Store flow state
    this.flowState = {
      state,
      nonce,
      startedAt: Date.now(),
      redirectUri: credentials.redirectUri as string,
      scopes: this.parseScopes(credentials.scopes),
    };

    // Build authorization URL
    const authUrl = this.buildAuthorizationUrl(credentials, state, nonce);

    this.status = 'configured';

    return {
      step: 1,
      totalSteps: 3,
      type: 'redirect',
      title: 'Authorize Application',
      description: '⚠️ Warning: Using deprecated Implicit flow. Token will be in URL.',
      redirectUrl: authUrl,
      data: {
        state,
        nonce,
        warning: 'Implicit flow is deprecated. Consider using PKCE.',
      },
    };
  }

  /**
   * Step 2: Waiting for OAuth callback
   */
  private awaitingCallback(): ProtocolAuthenticationFlow {
    return {
      step: 2,
      totalSteps: 3,
      type: 'callback',
      title: 'Awaiting Authorization',
      description: 'Complete the authorization. Token will be returned in URL fragment.',
    };
  }

  /**
   * Step 3: Authentication complete
   */
  private completeAuthentication(
    credentials: Partial<AuthenticationCredentials>
  ): ProtocolAuthenticationFlow {
    if (!credentials.accessToken) {
      return {
        step: 3,
        totalSteps: 3,
        type: 'error',
        title: 'Authentication Failed',
        description: 'No access token received.',
        error: 'Missing access token',
      };
    }

    this.status = 'authenticated';

    return {
      step: 3,
      totalSteps: 3,
      type: 'complete',
      title: 'Authentication Successful',
      description: 'You are now authenticated. Note: No refresh token available with Implicit flow.',
      data: {
        hasAccessToken: true,
        hasRefreshToken: false, // Implicit flow never has refresh tokens
        hasIdToken: !!credentials.idToken,
        scopes: this.parseScopes(credentials.scopes),
        warning: 'Token cannot be refreshed. Must re-authenticate when expired.',
      },
    };
  }

  /**
   * Handle OAuth callback - parse token from URL fragment
   * 
   * In Implicit flow, the token comes in the URL fragment:
   * https://yourapp.com/callback#access_token=...&token_type=Bearer&expires_in=3600&state=...
   */
  async handleCallback(
    callbackParams: Record<string, string>,
    expectedState?: string
  ): Promise<ProtocolAuthenticationFlow> {
    // Check for error response
    if (callbackParams.error) {
      return {
        step: 2,
        totalSteps: 3,
        type: 'error',
        title: 'Authorization Denied',
        description: callbackParams.error_description || 'The user denied authorization.',
        error: `${callbackParams.error}: ${callbackParams.error_description || 'No description'}`,
      };
    }

    // Validate state parameter
    const state = callbackParams.state;
    if (!state || (expectedState && state !== expectedState)) {
      return {
        step: 2,
        totalSteps: 3,
        type: 'error',
        title: 'Invalid State',
        description: 'State parameter mismatch. This could indicate a CSRF attack.',
        error: 'State validation failed',
      };
    }

    // Check for access token
    const accessToken = callbackParams.access_token;
    if (!accessToken) {
      return {
        step: 2,
        totalSteps: 3,
        type: 'error',
        title: 'Missing Access Token',
        description: 'No access token received from provider.',
        error: 'Missing access_token in fragment',
      };
    }

    // Parse token response
    const tokenResponse = this.parseFragmentResponse(callbackParams);

    // Calculate expiration
    let expiresAt: number | undefined;
    if (tokenResponse.expiresIn) {
      expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expiresIn;
      this.tokenExpiresAt = new Date(Date.now() + tokenResponse.expiresIn * 1000);
    }

    // Clear flow state
    this.flowState = null;
    this.status = 'authenticated';

    return {
      step: 2,
      totalSteps: 3,
      type: 'complete',
      title: 'Authentication Successful',
      description: 'Access token received from URL fragment.',
      data: {
        accessToken: tokenResponse.accessToken,
        tokenType: tokenResponse.tokenType,
        expiresIn: tokenResponse.expiresIn,
        expiresAt,
        scope: tokenResponse.scope,
        idToken: tokenResponse.idToken,
        warning: 'Clear URL fragment to prevent token leakage!',
      },
    };
  }

  /**
   * Parse URL fragment parameters into token response
   */
  parseFragmentResponse(params: Record<string, string>): ImplicitTokenResponse {
    return {
      accessToken: params.access_token || '',
      tokenType: params.token_type || 'Bearer',
      expiresIn: params.expires_in ? parseInt(params.expires_in, 10) : undefined,
      scope: params.scope,
      state: params.state,
      idToken: params.id_token,
      error: params.error,
      errorDescription: params.error_description,
    };
  }

  /**
   * Parse URL fragment string into parameters
   * 
   * @example
   * parseUrlFragment('#access_token=abc&token_type=Bearer&expires_in=3600')
   * // => { access_token: 'abc', token_type: 'Bearer', expires_in: '3600' }
   */
  static parseUrlFragment(fragment: string): Record<string, string> {
    const params: Record<string, string> = {};
    
    // Remove leading # if present
    const queryString = fragment.startsWith('#') ? fragment.slice(1) : fragment;
    
    // Parse parameters
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  /**
   * Implicit flow does NOT support token refresh
   */
  async refreshTokens(credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    return {
      success: false,
      error: 'Implicit flow does not support token refresh. User must re-authenticate.',
      requiresReauth: true,
    };
  }

  /**
   * Implicit flow typically does not support token revocation
   */
  async revokeTokens(credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Token revocation not available in Implicit flow.',
    };
  }

  isTokenExpired(credentials: AuthenticationCredentials): boolean {
    const expiresAt = credentials.tokenExpiresAt as number;
    
    if (!expiresAt) {
      return false;
    }

    // Add 60 second buffer
    return Date.now() > (expiresAt * 1000) - 60000;
  }

  getTokenExpirationTime(credentials: AuthenticationCredentials): Date | null {
    const expiresAt = credentials.tokenExpiresAt as number;
    
    if (!expiresAt) {
      return null;
    }

    return new Date(expiresAt * 1000);
  }

  // ============================================
  // REQUEST EXECUTION
  // ============================================

  async injectAuthentication(
    context: ProtocolExecutionContext
  ): Promise<{
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body?: string | Record<string, unknown>;
  }> {
    const accessToken = context.credentials.accessToken as string;
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    return {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      queryParams: {},
    };
  }

  async executeRequest(context: ProtocolExecutionContext): Promise<ProtocolExecutionResult> {
    const startTime = performance.now();
    
    // Check if token is expired
    if (this.isTokenExpired(context.credentials)) {
      return {
        success: false,
        statusCode: 401,
        headers: {},
        body: null,
        rawBody: '',
        durationMs: performance.now() - startTime,
        credentialsRefreshed: false,
        error: 'Token expired. Implicit flow does not support refresh - user must re-authenticate.',
        errorCode: 'TOKEN_EXPIRED',
      };
    }

    // Inject authentication
    const authInjection = await this.injectAuthentication(context);
    
    const headers = {
      ...context.headers,
      ...authInjection.headers,
    };

    try {
      const response = await fetch(context.url, {
        method: context.method,
        headers,
        body: context.method !== 'GET' && context.method !== 'HEAD' 
          ? (typeof context.body === 'string' ? context.body : JSON.stringify(context.body))
          : undefined,
        signal: context.timeout ? AbortSignal.timeout(context.timeout) : undefined,
      });

      const rawBody = await response.text();
      let parsedBody: unknown = rawBody;

      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        // Not JSON
      }

      // Cannot retry on 401 - no refresh token available
      if (response.status === 401) {
        return {
          success: false,
          statusCode: 401,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedBody,
          rawBody,
          durationMs: performance.now() - startTime,
          credentialsRefreshed: false,
          error: 'Unauthorized. Token may be expired - user must re-authenticate (no refresh available).',
          errorCode: 'UNAUTHORIZED',
        };
      }

      return {
        success: response.ok,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody,
        rawBody,
        durationMs: performance.now() - startTime,
        credentialsRefreshed: false,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        headers: {},
        body: null,
        rawBody: '',
        durationMs: performance.now() - startTime,
        credentialsRefreshed: false,
        error: error instanceof Error ? error.message : 'Request failed',
        errorCode: error instanceof Error ? error.name : 'UNKNOWN',
      };
    }
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(credentials: AuthenticationCredentials): Promise<ProtocolHealthCheckResult> {
    const hasAccessToken = !!(credentials.accessToken);
    const isExpired = this.isTokenExpired(credentials);
    const expirationTime = this.getTokenExpirationTime(credentials);

    let tokenStatus: 'valid' | 'expired' | 'missing' | 'invalid' = 'missing';
    if (hasAccessToken) {
      tokenStatus = isExpired ? 'expired' : 'valid';
    }

    let tokenExpiresIn = -1;
    if (expirationTime) {
      tokenExpiresIn = Math.floor((expirationTime.getTime() - Date.now()) / 1000);
    }

    // Test with userInfoUrl if available
    const userInfoUrl = credentials.userInfoUrl as string;
    if (userInfoUrl && hasAccessToken && !isExpired) {
      const startTime = performance.now();
      
      try {
        const response = await fetch(userInfoUrl, {
          headers: {
            'Authorization': `Bearer ${credentials.accessToken}`,
          },
        });

        const latencyMs = performance.now() - startTime;

        if (response.ok) {
          return {
            healthy: true,
            message: 'Token is valid (no refresh available)',
            latencyMs,
            tokenStatus: 'valid',
            tokenExpiresIn,
            canRefresh: false,
            details: {
              warning: 'Implicit flow - token cannot be refreshed',
            },
          };
        } else if (response.status === 401) {
          return {
            healthy: false,
            message: 'Token is invalid or expired (must re-authenticate)',
            latencyMs,
            tokenStatus: 'invalid',
            tokenExpiresIn: 0,
            canRefresh: false,
          };
        }
      } catch (error) {
        // Network error
      }
    }

    return {
      healthy: tokenStatus === 'valid',
      message: tokenStatus === 'valid' 
        ? 'Token appears valid (no refresh available)' 
        : tokenStatus === 'expired'
        ? 'Token is expired (must re-authenticate)'
        : 'No valid token',
      latencyMs: 0,
      tokenStatus,
      tokenExpiresIn,
      canRefresh: false, // Always false for implicit flow
      details: {
        warning: 'Implicit flow does not support token refresh',
      },
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Build the authorization URL
   */
  private buildAuthorizationUrl(
    credentials: Partial<AuthenticationCredentials>,
    state: string,
    nonce?: string
  ): string {
    const authUrl = new URL(credentials.authorizationUrl as string);
    const responseType = (credentials.responseType as string) || 'token';
    
    authUrl.searchParams.set('client_id', credentials.clientId as string);
    authUrl.searchParams.set('redirect_uri', credentials.redirectUri as string);
    authUrl.searchParams.set('response_type', responseType);
    authUrl.searchParams.set('scope', this.parseScopes(credentials.scopes).join(' '));
    authUrl.searchParams.set('state', state);

    // Add nonce for OpenID Connect (required when requesting id_token)
    if (nonce && (responseType.includes('id_token') || this.parseScopes(credentials.scopes).includes('openid'))) {
      authUrl.searchParams.set('nonce', nonce);
    }

    // Add additional params
    const additionalParams = (credentials.additionalAuthParams as Record<string, string>) || {};
    for (const [key, value] of Object.entries(additionalParams)) {
      authUrl.searchParams.set(key, value);
    }

    return authUrl.toString();
  }

  /**
   * Parse scopes from various formats
   */
  private parseScopes(scopes: unknown): string[] {
    if (!scopes) return [];
    
    if (Array.isArray(scopes)) {
      return scopes.filter(Boolean).map(String);
    }
    
    if (typeof scopes === 'string') {
      return scopes.split(/[\s,]+/).filter(Boolean);
    }
    
    return [];
  }

  /**
   * Generate state parameter
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate nonce for OpenID Connect
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get the current flow state
   */
  getFlowState(): ImplicitFlowState | null {
    return this.flowState;
  }

  /**
   * Set flow state
   */
  setFlowState(state: ImplicitFlowState): void {
    this.flowState = state;
  }

  /**
   * Security helper: Clear URL fragment after extracting token
   * 
   * Call this after parsing the token to prevent leakage.
   */
  static clearUrlFragment(): void {
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  /**
   * Check if we should recommend migration to PKCE
   */
  static shouldMigrateToPkce(): { recommend: boolean; reasons: string[] } {
    return {
      recommend: true,
      reasons: [
        'Implicit flow is deprecated in OAuth 2.1',
        'Tokens are exposed in URL (browser history, logs, Referer headers)',
        'No refresh tokens - users must re-authenticate frequently',
        'Vulnerable to token injection attacks',
        'PKCE provides equivalent functionality with better security',
      ],
    };
  }
}

// Export default instance
export default OAuthImplicitHandshakeExecutor;
