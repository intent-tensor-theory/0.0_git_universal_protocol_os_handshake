// ============================================
// PROTOCOL OS - OAUTH PKCE HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.2.a
// Purpose: OAuth 2.0 Authorization Code Flow with PKCE for SPAs
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
import { 
  generateCodeVerifier, 
  generateCodeChallenge,
  generateState,
  validateState,
} from './1.3.2.d_fileOauthPkceCodeChallengeGenerator';

/**
 * OAuth PKCE configuration
 */
export interface OAuthPkceConfiguration {
  /** OAuth authorization endpoint */
  authorizationUrl: string;
  
  /** OAuth token endpoint */
  tokenUrl: string;
  
  /** Client ID */
  clientId: string;
  
  /** Redirect URI for callback */
  redirectUri: string;
  
  /** Requested scopes */
  scopes: string[];
  
  /** Optional: User info endpoint */
  userInfoUrl?: string;
  
  /** Optional: Token revocation endpoint */
  revocationUrl?: string;
  
  /** Optional: Additional authorization params */
  additionalAuthParams?: Record<string, string>;
  
  /** Optional: Additional token params */
  additionalTokenParams?: Record<string, string>;
}

/**
 * OAuth token response
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

/**
 * PKCE flow state (stored during auth flow)
 */
export interface PkceFlowState {
  /** Code verifier (secret) */
  codeVerifier: string;
  
  /** State parameter */
  state: string;
  
  /** Timestamp when flow started */
  startedAt: number;
  
  /** Redirect URI used */
  redirectUri: string;
  
  /** Requested scopes */
  scopes: string[];
}

/**
 * OAuth PKCE Protocol Module
 * 
 * Implements OAuth 2.0 Authorization Code Flow with Proof Key for Code Exchange (PKCE).
 * This is the recommended flow for single-page applications (SPAs) and mobile apps
 * where the client secret cannot be securely stored.
 * 
 * Flow:
 * 1. Generate code_verifier (random string)
 * 2. Generate code_challenge (SHA-256 hash of verifier)
 * 3. Redirect user to authorization URL with code_challenge
 * 4. User authenticates and authorizes
 * 5. Receive authorization code via redirect
 * 6. Exchange code + code_verifier for tokens
 * 7. Use access_token for API requests
 * 8. Refresh tokens when expired (if refresh_token provided)
 */
export class OAuthPkceHandshakeExecutor extends BaseProtocolModule {
  private flowState: PkceFlowState | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    super();
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'oauth2-pkce',
      displayName: 'OAuth 2.0 with PKCE',
      description: 'Secure OAuth 2.0 Authorization Code flow with Proof Key for Code Exchange. Recommended for SPAs and mobile apps.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/oauth-pkce',
      icon: 'shield-check',
      capabilities: this.getCapabilities(),
      useCases: [
        'Single-page application authentication',
        'Mobile app authentication',
        'Public client OAuth',
        'User-authorized API access',
        'Third-party integrations',
      ],
      examplePlatforms: [
        'Google APIs',
        'Microsoft Graph',
        'GitHub',
        'Slack',
        'Spotify',
        'Dropbox',
        'Auth0',
        'Okta',
      ],
    };
  }

  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRedirectFlow: true,
      supportsTokenRefresh: true,
      supportsTokenRevocation: true,
      supportsScopes: true,
      supportsIncrementalAuth: true,
      supportsOfflineAccess: true,
      supportsPkce: true,
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
        description: 'OAuth application client ID from your provider.',
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
        id: 'tokenUrl',
        label: 'Token URL',
        type: 'url',
        required: true,
        description: 'OAuth token exchange endpoint URL.',
        placeholder: 'https://provider.com/oauth/token',
        group: 'endpoints',
        order: 2,
      },
      {
        id: 'redirectUri',
        label: 'Redirect URI',
        type: 'url',
        required: true,
        description: 'Callback URL registered with OAuth provider.',
        placeholder: 'https://yourapp.com/auth/callback',
        group: 'endpoints',
        order: 3,
      },
      {
        id: 'scopes',
        label: 'Scopes',
        type: 'scopes',
        required: true,
        description: 'OAuth scopes to request (space-separated or select from list).',
        placeholder: 'openid email profile',
        group: 'authorization',
        order: 1,
      },
    ];
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'userInfoUrl',
        label: 'User Info URL',
        type: 'url',
        required: false,
        description: 'Endpoint to fetch user profile information.',
        placeholder: 'https://provider.com/oauth/userinfo',
        group: 'endpoints',
        order: 4,
      },
      {
        id: 'revocationUrl',
        label: 'Revocation URL',
        type: 'url',
        required: false,
        description: 'Endpoint to revoke tokens.',
        placeholder: 'https://provider.com/oauth/revoke',
        group: 'endpoints',
        order: 5,
      },
      {
        id: 'audience',
        label: 'Audience',
        type: 'text',
        required: false,
        description: 'Target API audience (required by some providers like Auth0).',
        placeholder: 'https://api.yourapp.com',
        group: 'authorization',
        order: 2,
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
        id: 'additionalTokenParams',
        label: 'Additional Token Parameters',
        type: 'json',
        required: false,
        description: 'Extra parameters for token exchange.',
        placeholder: '{}',
        group: 'advanced',
        order: 2,
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
        id: 'refreshToken',
        label: 'Refresh Token',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'Refresh token for obtaining new access tokens.',
        group: 'tokens',
        order: 2,
      },
      {
        id: 'tokenExpiresAt',
        label: 'Token Expires At',
        type: 'hidden',
        required: false,
        description: 'Unix timestamp when access token expires.',
        group: 'tokens',
        order: 3,
      },
      {
        id: 'idToken',
        label: 'ID Token',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'OpenID Connect ID token.',
        group: 'tokens',
        order: 4,
      },
    ];
  }

  getFieldGroups() {
    return [
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
        description: 'Scopes and authorization parameters.',
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
   * Step 1: Generate PKCE values and authorization URL
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

    try {
      // Generate PKCE values
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateState();

      // Store flow state
      this.flowState = {
        codeVerifier,
        state,
        startedAt: Date.now(),
        redirectUri: credentials.redirectUri as string,
        scopes: this.parseScopes(credentials.scopes),
      };

      // Build authorization URL
      const authUrl = this.buildAuthorizationUrl(credentials, codeChallenge, state);

      this.status = 'configured';

      return {
        step: 1,
        totalSteps: 3,
        type: 'redirect',
        title: 'Authorize Application',
        description: 'Click the link below to authorize with your OAuth provider.',
        redirectUrl: authUrl,
        data: {
          state,
          codeChallenge,
          codeChallengeMethod: 'S256',
        },
      };
    } catch (error) {
      return {
        step: 1,
        totalSteps: 3,
        type: 'error',
        title: 'PKCE Generation Failed',
        description: 'Failed to generate PKCE challenge.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
      description: 'Complete the authorization in the popup window. This page will update automatically.',
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
      description: 'You are now authenticated.',
      data: {
        hasAccessToken: true,
        hasRefreshToken: !!credentials.refreshToken,
        scopes: this.parseScopes(credentials.scopes),
      },
    };
  }

  /**
   * Handle OAuth callback with authorization code
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

    // Check for authorization code
    const code = callbackParams.code;
    if (!code) {
      return {
        step: 2,
        totalSteps: 3,
        type: 'error',
        title: 'Missing Authorization Code',
        description: 'No authorization code received from provider.',
        error: 'Missing code parameter',
      };
    }

    // Return success - token exchange happens separately
    return {
      step: 2,
      totalSteps: 3,
      type: 'token-exchange',
      title: 'Authorization Received',
      description: 'Exchanging authorization code for tokens...',
      data: {
        code,
        state,
      },
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier?: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
    scopes?: string[];
    idToken?: string;
  }> {
    if (!this.flowState && !codeVerifier) {
      throw new Error('No code verifier available. Start authentication flow first.');
    }

    const verifier = codeVerifier || this.flowState!.codeVerifier;
    const redirectUri = this.flowState?.redirectUri;

    // This would need the credentials - typically called from a higher level
    throw new Error('exchangeCodeForTokens must be called with full credentials context');
  }

  /**
   * Perform token exchange request
   */
  async performTokenExchange(
    credentials: Partial<AuthenticationCredentials>,
    code: string,
    codeVerifier: string
  ): Promise<OAuthTokenResponse> {
    const tokenUrl = credentials.tokenUrl as string;
    const clientId = credentials.clientId as string;
    const redirectUri = credentials.redirectUri as string;
    const additionalParams = (credentials.additionalTokenParams as Record<string, string>) || {};

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      ...additionalParams,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error_description || 
        errorData.error || 
        `Token exchange failed: ${response.status}`
      );
    }

    const tokenData: OAuthTokenResponse = await response.json();

    // Store expiration time
    if (tokenData.expires_in) {
      this.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    }

    // Clear flow state
    this.flowState = null;
    this.status = 'authenticated';

    return tokenData;
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  async refreshTokens(credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    const refreshToken = credentials.refreshToken as string;
    
    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
        requiresReauth: true,
      };
    }

    const tokenUrl = credentials.tokenUrl as string;
    const clientId = credentials.clientId as string;

    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if refresh token is expired/revoked
        if (response.status === 400 || response.status === 401) {
          return {
            success: false,
            error: errorData.error_description || 'Refresh token expired',
            requiresReauth: true,
          };
        }

        return {
          success: false,
          error: errorData.error_description || `Refresh failed: ${response.status}`,
        };
      }

      const tokenData: OAuthTokenResponse = await response.json();

      // Update expiration
      const expiresAt = tokenData.expires_in 
        ? Math.floor(Date.now() / 1000) + tokenData.expires_in
        : undefined;

      if (tokenData.expires_in) {
        this.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      }

      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        tokenType: tokenData.token_type,
        scopes: tokenData.scope?.split(' '),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  async revokeTokens(credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }> {
    const revocationUrl = credentials.revocationUrl as string;
    
    if (!revocationUrl) {
      return {
        success: false,
        error: 'No revocation endpoint configured',
      };
    }

    const accessToken = credentials.accessToken as string;
    const clientId = credentials.clientId as string;

    try {
      const body = new URLSearchParams({
        token: accessToken,
        client_id: clientId,
        token_type_hint: 'access_token',
      });

      const response = await fetch(revocationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      // Revocation returns 200 even if token was already revoked
      if (response.ok || response.status === 200) {
        this.status = 'uninitialized';
        this.tokenExpiresAt = null;
        return { success: true };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error_description || 'Revocation failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Revocation failed',
      };
    }
  }

  isTokenExpired(credentials: AuthenticationCredentials): boolean {
    const expiresAt = credentials.tokenExpiresAt as number;
    
    if (!expiresAt) {
      return false; // No expiration info, assume valid
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
      // Try to refresh
      const refreshResult = await this.refreshTokens(context.credentials);
      
      if (!refreshResult.success) {
        return {
          success: false,
          statusCode: 401,
          headers: {},
          body: null,
          rawBody: '',
          durationMs: performance.now() - startTime,
          credentialsRefreshed: false,
          error: 'Token expired and refresh failed',
          errorCode: 'TOKEN_EXPIRED',
        };
      }

      // Update context with new token
      context.credentials.accessToken = refreshResult.accessToken;
      if (refreshResult.refreshToken) {
        context.credentials.refreshToken = refreshResult.refreshToken;
      }
      if (refreshResult.expiresAt) {
        context.credentials.tokenExpiresAt = refreshResult.expiresAt;
      }
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

      // Handle 401 - try refresh once
      if (response.status === 401 && context.credentials.refreshToken) {
        const refreshResult = await this.refreshTokens(context.credentials);
        
        if (refreshResult.success) {
          // Retry request with new token
          const retryHeaders = {
            ...headers,
            'Authorization': `Bearer ${refreshResult.accessToken}`,
          };

          const retryResponse = await fetch(context.url, {
            method: context.method,
            headers: retryHeaders,
            body: context.method !== 'GET' && context.method !== 'HEAD'
              ? (typeof context.body === 'string' ? context.body : JSON.stringify(context.body))
              : undefined,
          });

          const retryRawBody = await retryResponse.text();
          let retryParsedBody: unknown = retryRawBody;

          try {
            retryParsedBody = JSON.parse(retryRawBody);
          } catch {
            // Not JSON
          }

          return {
            success: retryResponse.ok,
            statusCode: retryResponse.status,
            headers: Object.fromEntries(retryResponse.headers.entries()),
            body: retryParsedBody,
            rawBody: retryRawBody,
            durationMs: performance.now() - startTime,
            credentialsRefreshed: true,
            updatedCredentials: {
              accessToken: refreshResult.accessToken,
              refreshToken: refreshResult.refreshToken,
              tokenExpiresAt: refreshResult.expiresAt,
            },
            error: retryResponse.ok ? undefined : `HTTP ${retryResponse.status}`,
          };
        }
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
    const hasRefreshToken = !!(credentials.refreshToken);
    const isExpired = this.isTokenExpired(credentials);
    const expirationTime = this.getTokenExpirationTime(credentials);

    // Determine token status
    let tokenStatus: 'valid' | 'expired' | 'missing' | 'invalid' = 'missing';
    if (hasAccessToken) {
      tokenStatus = isExpired ? 'expired' : 'valid';
    }

    // Calculate time until expiration
    let tokenExpiresIn = -1;
    if (expirationTime) {
      tokenExpiresIn = Math.floor((expirationTime.getTime() - Date.now()) / 1000);
    }

    // If we have userInfoUrl, test the token
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
            message: 'Token is valid and working',
            latencyMs,
            tokenStatus: 'valid',
            tokenExpiresIn,
            canRefresh: hasRefreshToken,
          };
        } else if (response.status === 401) {
          return {
            healthy: false,
            message: 'Token is invalid or expired',
            latencyMs,
            tokenStatus: 'invalid',
            tokenExpiresIn: 0,
            canRefresh: hasRefreshToken,
          };
        }
      } catch (error) {
        // Network error, can't determine token status
      }
    }

    return {
      healthy: tokenStatus === 'valid',
      message: tokenStatus === 'valid' 
        ? 'Token appears valid' 
        : tokenStatus === 'expired'
        ? 'Token is expired'
        : 'No valid token',
      latencyMs: 0,
      tokenStatus,
      tokenExpiresIn,
      canRefresh: hasRefreshToken,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Build the authorization URL with PKCE parameters
   */
  private buildAuthorizationUrl(
    credentials: Partial<AuthenticationCredentials>,
    codeChallenge: string,
    state: string
  ): string {
    const authUrl = new URL(credentials.authorizationUrl as string);
    
    authUrl.searchParams.set('client_id', credentials.clientId as string);
    authUrl.searchParams.set('redirect_uri', credentials.redirectUri as string);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.parseScopes(credentials.scopes).join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    // Add audience if provided (required by some providers)
    if (credentials.audience) {
      authUrl.searchParams.set('audience', credentials.audience as string);
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
   * Get the current flow state (for external access)
   */
  getFlowState(): PkceFlowState | null {
    return this.flowState;
  }

  /**
   * Set flow state (for restoring after redirect)
   */
  setFlowState(state: PkceFlowState): void {
    this.flowState = state;
  }
}

// Export default instance
export default OAuthPkceHandshakeExecutor;
