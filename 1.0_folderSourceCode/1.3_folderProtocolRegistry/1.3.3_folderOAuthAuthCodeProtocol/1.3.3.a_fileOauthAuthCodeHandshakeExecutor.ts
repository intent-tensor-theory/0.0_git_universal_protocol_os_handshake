// ============================================
// PROTOCOL OS - OAUTH AUTH CODE HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.3.a
// Purpose: OAuth 2.0 Authorization Code Flow for Confidential Clients
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
 * OAuth Auth Code configuration for confidential clients
 */
export interface OAuthAuthCodeConfiguration {
  /** OAuth authorization endpoint */
  authorizationUrl: string;
  
  /** OAuth token endpoint */
  tokenUrl: string;
  
  /** Client ID */
  clientId: string;
  
  /** Client Secret (confidential client) */
  clientSecret: string;
  
  /** Redirect URI for callback */
  redirectUri: string;
  
  /** Requested scopes */
  scopes: string[];
  
  /** Optional: User info endpoint */
  userInfoUrl?: string;
  
  /** Optional: Token revocation endpoint */
  revocationUrl?: string;
  
  /** Optional: Token introspection endpoint */
  introspectionUrl?: string;
  
  /** Client authentication method */
  clientAuthMethod: 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt';
  
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
 * Auth flow state (stored during auth flow)
 */
export interface AuthCodeFlowState {
  /** State parameter */
  state: string;
  
  /** Timestamp when flow started */
  startedAt: number;
  
  /** Redirect URI used */
  redirectUri: string;
  
  /** Requested scopes */
  scopes: string[];
  
  /** Nonce for OpenID Connect */
  nonce?: string;
}

/**
 * Client authentication methods
 */
export type ClientAuthMethod = 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt';

/**
 * OAuth Authorization Code Protocol Module (Confidential Client)
 * 
 * Implements the traditional OAuth 2.0 Authorization Code Flow for confidential
 * clients that can securely store a client_secret. This is the standard flow
 * for server-side web applications.
 * 
 * ⚠️ IMPORTANT: This flow requires a backend server to securely handle
 * the client_secret. Never expose client_secret in browser-side code.
 * 
 * Flow:
 * 1. Redirect user to authorization URL
 * 2. User authenticates and authorizes
 * 3. Receive authorization code via redirect
 * 4. Exchange code + client_secret for tokens (server-side)
 * 5. Use access_token for API requests
 * 6. Refresh tokens when expired
 * 
 * For SPAs/mobile apps, use OAuth PKCE instead (1.3.2).
 */
export class OAuthAuthCodeHandshakeExecutor extends BaseProtocolModule {
  private flowState: AuthCodeFlowState | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    super();
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'oauth2',
      displayName: 'OAuth 2.0 Authorization Code',
      description: 'Traditional OAuth 2.0 Authorization Code flow for confidential clients with client_secret. Requires server-side component.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/oauth-auth-code',
      icon: 'key-round',
      capabilities: this.getCapabilities(),
      useCases: [
        'Server-side web applications',
        'Backend API integrations',
        'Service-to-service authentication',
        'Traditional web app authentication',
        'Enterprise integrations',
      ],
      examplePlatforms: [
        'Salesforce',
        'HubSpot',
        'Stripe Connect',
        'QuickBooks',
        'Xero',
        'DocuSign',
        'Box',
        'Mailchimp',
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
      supportsPkce: false, // Use PKCE module for public clients
      requiresServerSide: true, // Client secret must be server-side
      browserCompatible: false, // Token exchange must be server-side
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
        id: 'clientSecret',
        label: 'Client Secret',
        type: 'secret',
        required: true,
        sensitive: true,
        description: '⚠️ Keep secret! Only use in server-side code.',
        placeholder: 'your-client-secret',
        group: 'credentials',
        order: 2,
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
        id: 'clientAuthMethod',
        label: 'Client Authentication Method',
        type: 'select',
        required: false,
        description: 'How to authenticate the client during token exchange.',
        defaultValue: 'client_secret_basic',
        options: [
          { value: 'client_secret_basic', label: 'Basic Auth (Header)' },
          { value: 'client_secret_post', label: 'POST Body' },
          { value: 'client_secret_jwt', label: 'JWT Assertion' },
        ],
        group: 'authentication',
        order: 1,
      },
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
        id: 'introspectionUrl',
        label: 'Introspection URL',
        type: 'url',
        required: false,
        description: 'Endpoint to introspect/validate tokens.',
        placeholder: 'https://provider.com/oauth/introspect',
        group: 'endpoints',
        order: 6,
      },
      {
        id: 'audience',
        label: 'Audience',
        type: 'text',
        required: false,
        description: 'Target API audience (required by some providers).',
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
        description: 'Your OAuth application credentials. ⚠️ Keep client_secret secure!',
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
        id: 'authentication',
        label: 'Client Authentication',
        description: 'How to authenticate during token exchange.',
        collapsible: true,
        defaultCollapsed: true,
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

    // Generate state parameter for CSRF protection
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
      description: 'Redirect the user to authorize with your OAuth provider.',
      redirectUrl: authUrl,
      data: {
        state,
        nonce,
        note: 'Token exchange must be performed server-side with client_secret',
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
      description: 'Complete the authorization in the browser window.',
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

    // Return success - token exchange must happen server-side
    return {
      step: 2,
      totalSteps: 3,
      type: 'token-exchange',
      title: 'Authorization Received',
      description: 'Exchange the code for tokens on your server.',
      data: {
        code,
        state,
        note: 'Token exchange must be performed server-side with client_secret',
      },
    };
  }

  /**
   * Exchange authorization code for tokens
   * 
   * ⚠️ This should only be called from server-side code!
   * Never expose client_secret in browser.
   */
  async performTokenExchange(
    credentials: Partial<AuthenticationCredentials>,
    code: string
  ): Promise<OAuthTokenResponse> {
    const tokenUrl = credentials.tokenUrl as string;
    const clientId = credentials.clientId as string;
    const clientSecret = credentials.clientSecret as string;
    const redirectUri = credentials.redirectUri as string;
    const clientAuthMethod = (credentials.clientAuthMethod as ClientAuthMethod) || 'client_secret_basic';
    const additionalParams = (credentials.additionalTokenParams as Record<string, string>) || {};

    // Build request based on client auth method
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    };

    const bodyParams: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      ...additionalParams,
    };

    // Apply client authentication
    switch (clientAuthMethod) {
      case 'client_secret_basic':
        // HTTP Basic Auth header
        const basicAuth = btoa(`${clientId}:${clientSecret}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        bodyParams['client_id'] = clientId;
        break;

      case 'client_secret_post':
        // Include in POST body
        bodyParams['client_id'] = clientId;
        bodyParams['client_secret'] = clientSecret;
        break;

      case 'client_secret_jwt':
        // JWT assertion (simplified - production would need proper JWT)
        bodyParams['client_id'] = clientId;
        bodyParams['client_assertion_type'] = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
        bodyParams['client_assertion'] = await this.generateClientAssertion(clientId, clientSecret, tokenUrl);
        break;
    }

    const body = new URLSearchParams(bodyParams);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers,
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
    const clientSecret = credentials.clientSecret as string;
    const clientAuthMethod = (credentials.clientAuthMethod as ClientAuthMethod) || 'client_secret_basic';

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      };

      const bodyParams: Record<string, string> = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      };

      // Apply client authentication
      switch (clientAuthMethod) {
        case 'client_secret_basic':
          const basicAuth = btoa(`${clientId}:${clientSecret}`);
          headers['Authorization'] = `Basic ${basicAuth}`;
          bodyParams['client_id'] = clientId;
          break;

        case 'client_secret_post':
          bodyParams['client_id'] = clientId;
          bodyParams['client_secret'] = clientSecret;
          break;

        case 'client_secret_jwt':
          bodyParams['client_id'] = clientId;
          bodyParams['client_assertion_type'] = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
          bodyParams['client_assertion'] = await this.generateClientAssertion(clientId, clientSecret, tokenUrl);
          break;
      }

      const body = new URLSearchParams(bodyParams);

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers,
        body: body.toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
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
    const clientSecret = credentials.clientSecret as string;
    const clientAuthMethod = (credentials.clientAuthMethod as ClientAuthMethod) || 'client_secret_basic';

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      const bodyParams: Record<string, string> = {
        token: accessToken,
        token_type_hint: 'access_token',
      };

      // Apply client authentication
      if (clientAuthMethod === 'client_secret_basic') {
        const basicAuth = btoa(`${clientId}:${clientSecret}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else {
        bodyParams['client_id'] = clientId;
        bodyParams['client_secret'] = clientSecret;
      }

      const body = new URLSearchParams(bodyParams);

      const response = await fetch(revocationUrl, {
        method: 'POST',
        headers,
        body: body.toString(),
      });

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

  /**
   * Introspect a token to check its validity
   */
  async introspectToken(credentials: AuthenticationCredentials): Promise<{
    active: boolean;
    scope?: string;
    clientId?: string;
    exp?: number;
    sub?: string;
    error?: string;
  }> {
    const introspectionUrl = credentials.introspectionUrl as string;
    
    if (!introspectionUrl) {
      return {
        active: false,
        error: 'No introspection endpoint configured',
      };
    }

    const accessToken = credentials.accessToken as string;
    const clientId = credentials.clientId as string;
    const clientSecret = credentials.clientSecret as string;

    try {
      const basicAuth = btoa(`${clientId}:${clientSecret}`);

      const response = await fetch(introspectionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          token: accessToken,
          token_type_hint: 'access_token',
        }).toString(),
      });

      if (!response.ok) {
        return {
          active: false,
          error: `Introspection failed: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        active: data.active === true,
        scope: data.scope,
        clientId: data.client_id,
        exp: data.exp,
        sub: data.sub,
      };
    } catch (error) {
      return {
        active: false,
        error: error instanceof Error ? error.message : 'Introspection failed',
      };
    }
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

    let tokenStatus: 'valid' | 'expired' | 'missing' | 'invalid' = 'missing';
    if (hasAccessToken) {
      tokenStatus = isExpired ? 'expired' : 'valid';
    }

    let tokenExpiresIn = -1;
    if (expirationTime) {
      tokenExpiresIn = Math.floor((expirationTime.getTime() - Date.now()) / 1000);
    }

    // If introspection endpoint available, use it
    const introspectionUrl = credentials.introspectionUrl as string;
    if (introspectionUrl && hasAccessToken && !isExpired) {
      const introspection = await this.introspectToken(credentials);
      
      if (introspection.active) {
        return {
          healthy: true,
          message: 'Token is valid (verified via introspection)',
          latencyMs: 0,
          tokenStatus: 'valid',
          tokenExpiresIn: introspection.exp 
            ? introspection.exp - Math.floor(Date.now() / 1000)
            : tokenExpiresIn,
          canRefresh: hasRefreshToken,
        };
      } else if (!introspection.error) {
        return {
          healthy: false,
          message: 'Token is inactive',
          latencyMs: 0,
          tokenStatus: 'invalid',
          tokenExpiresIn: 0,
          canRefresh: hasRefreshToken,
        };
      }
    }

    // Fallback: test with userInfoUrl
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
        // Network error
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
   * Build the authorization URL
   */
  private buildAuthorizationUrl(
    credentials: Partial<AuthenticationCredentials>,
    state: string,
    nonce?: string
  ): string {
    const authUrl = new URL(credentials.authorizationUrl as string);
    
    authUrl.searchParams.set('client_id', credentials.clientId as string);
    authUrl.searchParams.set('redirect_uri', credentials.redirectUri as string);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.parseScopes(credentials.scopes).join(' '));
    authUrl.searchParams.set('state', state);

    // Add nonce for OpenID Connect
    if (nonce && this.parseScopes(credentials.scopes).includes('openid')) {
      authUrl.searchParams.set('nonce', nonce);
    }

    // Add audience if provided
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
   * Generate state parameter for CSRF protection
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
   * Generate client assertion JWT for client_secret_jwt auth method
   * 
   * Note: This is a simplified implementation. Production use should
   * use a proper JWT library with RS256 signing.
   */
  private async generateClientAssertion(
    clientId: string,
    clientSecret: string,
    audience: string
  ): Promise<string> {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientId,
      sub: clientId,
      aud: audience,
      jti: this.generateState(),
      exp: now + 300, // 5 minutes
      iat: now,
    };

    const base64Header = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const base64Payload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const message = `${base64Header}.${base64Payload}`;

    // HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(clientSecret);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `${message}.${base64Signature}`;
  }

  /**
   * Get the current flow state
   */
  getFlowState(): AuthCodeFlowState | null {
    return this.flowState;
  }

  /**
   * Set flow state (for restoring after redirect)
   */
  setFlowState(state: AuthCodeFlowState): void {
    this.flowState = state;
  }
}

// Export default instance
export default OAuthAuthCodeHandshakeExecutor;
