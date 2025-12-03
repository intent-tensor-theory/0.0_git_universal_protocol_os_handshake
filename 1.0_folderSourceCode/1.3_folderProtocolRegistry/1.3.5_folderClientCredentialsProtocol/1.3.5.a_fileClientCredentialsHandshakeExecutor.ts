// ============================================
// PROTOCOL OS - CLIENT CREDENTIALS HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.5.a
// Purpose: OAuth 2.0 Client Credentials Grant (Machine-to-Machine)
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
 * Client Credentials Grant
 * 
 * The OAuth 2.0 Client Credentials Grant is designed for machine-to-machine
 * (M2M) authentication where no user is involved. The client authenticates
 * directly with its own credentials to obtain an access token.
 * 
 * Use Cases:
 * - Backend service-to-service communication
 * - Microservices authentication
 * - Scheduled jobs and cron tasks
 * - CLI tools and scripts
 * - Server-side API integrations
 * 
 * Key Characteristics:
 * - No user interaction required
 * - Client acts on its own behalf (not a user's behalf)
 * - Simple POST request to token endpoint
 * - No authorization code or redirect flow
 * - No refresh tokens (just request new token when expired)
 */

/**
 * Client Credentials configuration
 */
export interface ClientCredentialsConfiguration {
  /** OAuth token endpoint */
  tokenUrl: string;
  
  /** Client ID */
  clientId: string;
  
  /** Client Secret (REQUIRED - this is a confidential client) */
  clientSecret: string;
  
  /** Requested scopes */
  scopes?: string[];
  
  /** Client authentication method */
  clientAuthMethod: ClientAuthMethod;
  
  /** Optional: Audience for the token */
  audience?: string;
  
  /** Optional: Resource indicator (RFC 8707) */
  resource?: string;
  
  /** Optional: Additional token parameters */
  additionalTokenParams?: Record<string, string>;
  
  /** Optional: Token introspection endpoint */
  introspectionUrl?: string;
  
  /** Optional: Token revocation endpoint */
  revocationUrl?: string;
}

/**
 * Client authentication method
 */
export type ClientAuthMethod = 
  | 'client_secret_basic'   // Authorization: Basic base64(client_id:client_secret)
  | 'client_secret_post'    // client_id & client_secret in POST body
  | 'client_secret_jwt'     // Signed JWT assertion
  | 'private_key_jwt';      // JWT signed with private key

/**
 * Token response from the OAuth server
 */
export interface ClientCredentialsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
  // Some providers return additional metadata
  issued_token_type?: string;
  refresh_token?: string; // Rare but some providers support this
}

/**
 * Client Credentials Protocol Module
 * 
 * Implements OAuth 2.0 Client Credentials Grant (RFC 6749 Section 4.4)
 * for machine-to-machine authentication.
 * 
 * Flow:
 * 1. Client sends client_id + client_secret to token endpoint
 * 2. Authorization server validates credentials
 * 3. Access token returned directly
 * 4. Use token for API requests
 * 5. When expired, request a new token (no refresh flow)
 */
export class ClientCredentialsHandshakeExecutor extends BaseProtocolModule {
  private tokenExpiresAt: Date | null = null;
  private tokenRequestInProgress: Promise<ProtocolTokenRefreshResult> | null = null;

  constructor() {
    super();
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'oauth2-client-credentials',
      displayName: 'OAuth 2.0 Client Credentials',
      description: 'Machine-to-machine authentication for backend services, microservices, and server-side applications.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/client-credentials',
      icon: 'server',
      capabilities: this.getCapabilities(),
      useCases: [
        'Backend service-to-service communication',
        'Microservices authentication',
        'Scheduled jobs and cron tasks',
        'CLI tools and automation scripts',
        'Server-side API integrations',
        'Daemon processes',
        'Batch processing jobs',
      ],
      examplePlatforms: [
        'Auth0 M2M',
        'Okta Service Apps',
        'Azure AD App-Only',
        'Google Service Accounts',
        'AWS Cognito M2M',
        'Salesforce Server-to-Server',
        'Twilio API',
        'SendGrid API',
        'Stripe API',
      ],
    };
  }

  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRedirectFlow: false, // No user interaction
      supportsTokenRefresh: false, // Just request new token
      supportsTokenRevocation: true,
      supportsScopes: true,
      supportsIncrementalAuth: false,
      supportsOfflineAccess: true, // Always "offline" - no user
      supportsPkce: false, // Not applicable
      requiresServerSide: true, // client_secret must be secure
      browserCompatible: false, // NEVER use in browser
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
        id: 'tokenUrl',
        label: 'Token URL',
        type: 'url',
        required: true,
        description: 'OAuth token endpoint for obtaining access tokens.',
        placeholder: 'https://auth.provider.com/oauth/token',
        group: 'endpoints',
        order: 1,
      },
      {
        id: 'clientId',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'OAuth application client ID.',
        placeholder: 'your-service-client-id',
        group: 'credentials',
        order: 1,
      },
      {
        id: 'clientSecret',
        label: 'Client Secret',
        type: 'secret',
        required: true,
        sensitive: true,
        description: 'OAuth client secret. Keep this secure - never expose in logs or client-side code.',
        placeholder: '••••••••••••••••',
        group: 'credentials',
        order: 2,
        warning: '⚠️ This secret must be kept secure. Store in environment variables or secrets manager.',
      },
    ];
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'scopes',
        label: 'Scopes',
        type: 'scopes',
        required: false,
        description: 'OAuth scopes to request (space-separated). Leave empty for default scopes.',
        placeholder: 'read:data write:data',
        group: 'authorization',
        order: 1,
      },
      {
        id: 'clientAuthMethod',
        label: 'Client Authentication Method',
        type: 'select',
        required: false,
        description: 'How to authenticate the client with the token endpoint.',
        defaultValue: 'client_secret_basic',
        options: [
          { value: 'client_secret_basic', label: 'Basic Auth Header (Most Common)' },
          { value: 'client_secret_post', label: 'POST Body' },
          { value: 'client_secret_jwt', label: 'JWT Assertion (HS256)' },
          { value: 'private_key_jwt', label: 'JWT with Private Key (RS256)' },
        ],
        group: 'authentication',
        order: 1,
      },
      {
        id: 'audience',
        label: 'Audience',
        type: 'text',
        required: false,
        description: 'Target API audience (required by some providers like Auth0).',
        placeholder: 'https://api.yourservice.com',
        group: 'authorization',
        order: 2,
      },
      {
        id: 'resource',
        label: 'Resource',
        type: 'text',
        required: false,
        description: 'Resource indicator per RFC 8707 (used by some providers).',
        placeholder: 'https://api.example.com',
        group: 'authorization',
        order: 3,
      },
      {
        id: 'introspectionUrl',
        label: 'Token Introspection URL',
        type: 'url',
        required: false,
        description: 'Endpoint to validate tokens (RFC 7662).',
        placeholder: 'https://auth.provider.com/oauth/introspect',
        group: 'endpoints',
        order: 2,
      },
      {
        id: 'revocationUrl',
        label: 'Token Revocation URL',
        type: 'url',
        required: false,
        description: 'Endpoint to revoke tokens (RFC 7009).',
        placeholder: 'https://auth.provider.com/oauth/revoke',
        group: 'endpoints',
        order: 3,
      },
      {
        id: 'additionalTokenParams',
        label: 'Additional Token Parameters',
        type: 'json',
        required: false,
        description: 'Extra parameters for token request.',
        placeholder: '{"custom_param": "value"}',
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
        id: 'privateKey',
        label: 'Private Key (for private_key_jwt)',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'RSA/EC private key in PEM format for JWT authentication.',
        placeholder: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
        group: 'authentication',
        order: 2,
      },
      {
        id: 'keyId',
        label: 'Key ID (kid)',
        type: 'text',
        required: false,
        description: 'Key ID for JWT header (required by some providers).',
        placeholder: 'your-key-id',
        group: 'authentication',
        order: 3,
      },
    ];
  }

  getFieldGroups() {
    return [
      {
        id: 'credentials',
        label: 'Client Credentials',
        description: 'Your service account credentials.',
        warning: '⚠️ These credentials grant direct API access. Protect them carefully.',
      },
      {
        id: 'endpoints',
        label: 'OAuth Endpoints',
        description: 'Provider endpoint URLs.',
      },
      {
        id: 'authentication',
        label: 'Authentication Method',
        description: 'How to authenticate with the token endpoint.',
      },
      {
        id: 'authorization',
        label: 'Authorization Settings',
        description: 'Scopes and audience configuration.',
      },
      {
        id: 'tokens',
        label: 'Tokens',
        description: 'Current access token status.',
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
    _currentStep?: number
  ): Promise<ProtocolAuthenticationFlow> {
    // Validate required fields
    const validation = this.validateCredentials(credentials);
    if (!validation.valid) {
      return {
        step: 1,
        totalSteps: 1,
        type: 'error',
        title: 'Configuration Error',
        description: 'Please fix the configuration errors.',
        error: Object.values(validation.fieldErrors).join(', '),
      };
    }

    // Client Credentials is a single-step flow
    try {
      const tokenResponse = await this.requestToken(credentials);

      // Calculate expiration
      let expiresAt: number | undefined;
      if (tokenResponse.expires_in) {
        expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;
        this.tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      }

      this.status = 'authenticated';

      return {
        step: 1,
        totalSteps: 1,
        type: 'complete',
        title: 'Authentication Successful',
        description: 'Access token obtained via Client Credentials Grant.',
        data: {
          accessToken: tokenResponse.access_token,
          tokenType: tokenResponse.token_type,
          expiresIn: tokenResponse.expires_in,
          expiresAt,
          scope: tokenResponse.scope,
          hasRefreshToken: !!tokenResponse.refresh_token, // Rare
        },
      };
    } catch (error) {
      this.status = 'error';
      
      return {
        step: 1,
        totalSteps: 1,
        type: 'error',
        title: 'Authentication Failed',
        description: 'Failed to obtain access token.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Request a new access token from the token endpoint
   */
  async requestToken(
    credentials: Partial<AuthenticationCredentials>
  ): Promise<ClientCredentialsTokenResponse> {
    const tokenUrl = credentials.tokenUrl as string;
    const clientId = credentials.clientId as string;
    const clientSecret = credentials.clientSecret as string;
    const scopes = this.parseScopes(credentials.scopes);
    const audience = credentials.audience as string | undefined;
    const resource = credentials.resource as string | undefined;
    const clientAuthMethod = (credentials.clientAuthMethod as ClientAuthMethod) || 'client_secret_basic';
    const additionalParams = (credentials.additionalTokenParams as Record<string, string>) || {};

    // Build request body
    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');
    
    if (scopes.length > 0) {
      body.append('scope', scopes.join(' '));
    }
    
    if (audience) {
      body.append('audience', audience);
    }
    
    if (resource) {
      body.append('resource', resource);
    }

    // Add additional parameters
    for (const [key, value] of Object.entries(additionalParams)) {
      body.append(key, value);
    }

    // Build headers based on auth method
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    switch (clientAuthMethod) {
      case 'client_secret_basic':
        // Authorization: Basic base64(client_id:client_secret)
        const basicAuth = btoa(`${clientId}:${clientSecret}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        break;
        
      case 'client_secret_post':
        // client_id and client_secret in POST body
        body.append('client_id', clientId);
        body.append('client_secret', clientSecret);
        break;
        
      case 'client_secret_jwt':
        // JWT signed with client_secret (HS256)
        const hsJwt = await this.generateClientAssertionHs256(
          clientId,
          clientSecret,
          tokenUrl
        );
        body.append('client_id', clientId);
        body.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
        body.append('client_assertion', hsJwt);
        break;
        
      case 'private_key_jwt':
        // JWT signed with private key (RS256/ES256)
        const privateKey = credentials.privateKey as string;
        const keyId = credentials.keyId as string | undefined;
        
        if (!privateKey) {
          throw new Error('Private key required for private_key_jwt authentication');
        }
        
        const rsJwt = await this.generateClientAssertionRs256(
          clientId,
          privateKey,
          tokenUrl,
          keyId
        );
        body.append('client_id', clientId);
        body.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
        body.append('client_assertion', rsJwt);
        break;
    }

    // Make the token request
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers,
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMessage = `Token request failed: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = errorJson.error_description || errorJson.error || errorMessage;
      } catch {
        // Not JSON
      }
      
      throw new Error(errorMessage);
    }

    const tokenResponse: ClientCredentialsTokenResponse = await response.json();
    
    return tokenResponse;
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  /**
   * For Client Credentials, "refresh" means requesting a new token
   * since refresh_tokens are not typically provided
   */
  async refreshTokens(credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    // Prevent concurrent token requests
    if (this.tokenRequestInProgress) {
      return this.tokenRequestInProgress;
    }

    this.tokenRequestInProgress = this.doRefreshTokens(credentials);
    
    try {
      return await this.tokenRequestInProgress;
    } finally {
      this.tokenRequestInProgress = null;
    }
  }

  private async doRefreshTokens(credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    try {
      // Simply request a new token
      const tokenResponse = await this.requestToken(credentials);

      let expiresAt: number | undefined;
      if (tokenResponse.expires_in) {
        expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;
        this.tokenExpiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      }

      return {
        success: true,
        accessToken: tokenResponse.access_token,
        expiresAt,
        tokenType: tokenResponse.token_type,
        scopes: tokenResponse.scope?.split(' '),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token request failed',
        requiresReauth: false, // Can retry with same credentials
      };
    }
  }

  /**
   * Revoke the current access token
   */
  async revokeTokens(credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }> {
    const revocationUrl = credentials.revocationUrl as string;
    const accessToken = credentials.accessToken as string;
    
    if (!revocationUrl) {
      return {
        success: false,
        error: 'Token revocation URL not configured.',
      };
    }

    if (!accessToken) {
      return {
        success: true, // Nothing to revoke
      };
    }

    try {
      const clientId = credentials.clientId as string;
      const clientSecret = credentials.clientSecret as string;
      const basicAuth = btoa(`${clientId}:${clientSecret}`);

      const response = await fetch(revocationUrl, {
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

      // RFC 7009: Server should return 200 even if token was invalid
      return { success: response.ok || response.status === 200 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Revocation failed',
      };
    }
  }

  /**
   * Introspect a token to check if it's valid
   */
  async introspectToken(
    credentials: AuthenticationCredentials,
    token?: string
  ): Promise<{
    active: boolean;
    scope?: string;
    clientId?: string;
    exp?: number;
    sub?: string;
    error?: string;
  }> {
    const introspectionUrl = credentials.introspectionUrl as string;
    const tokenToCheck = token || (credentials.accessToken as string);
    
    if (!introspectionUrl) {
      return {
        active: false,
        error: 'Token introspection URL not configured.',
      };
    }

    if (!tokenToCheck) {
      return {
        active: false,
        error: 'No token to introspect.',
      };
    }

    try {
      const clientId = credentials.clientId as string;
      const clientSecret = credentials.clientSecret as string;
      const basicAuth = btoa(`${clientId}:${clientSecret}`);

      const response = await fetch(introspectionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          token: tokenToCheck,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Introspection failed: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        active: result.active === true,
        scope: result.scope,
        clientId: result.client_id,
        exp: result.exp,
        sub: result.sub,
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
      return false; // Assume valid if no expiration
    }

    // Add 60 second buffer for network latency
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
    
    // Check if token is expired and refresh if needed
    if (this.isTokenExpired(context.credentials)) {
      const refreshResult = await this.refreshTokens(context.credentials as AuthenticationCredentials);
      
      if (!refreshResult.success) {
        return {
          success: false,
          statusCode: 401,
          headers: {},
          body: null,
          rawBody: '',
          durationMs: performance.now() - startTime,
          credentialsRefreshed: false,
          error: refreshResult.error || 'Failed to refresh token',
          errorCode: 'TOKEN_REFRESH_FAILED',
        };
      }

      // Update credentials with new token
      context.credentials.accessToken = refreshResult.accessToken;
      context.credentials.tokenExpiresAt = refreshResult.expiresAt;
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

      // Handle 401 - try to refresh and retry
      if (response.status === 401) {
        const refreshResult = await this.refreshTokens(context.credentials as AuthenticationCredentials);
        
        if (refreshResult.success) {
          // Retry with new token
          const retryHeaders = {
            ...context.headers,
            'Authorization': `Bearer ${refreshResult.accessToken}`,
          };

          const retryResponse = await fetch(context.url, {
            method: context.method,
            headers: retryHeaders,
            body: context.method !== 'GET' && context.method !== 'HEAD' 
              ? (typeof context.body === 'string' ? context.body : JSON.stringify(context.body))
              : undefined,
            signal: context.timeout ? AbortSignal.timeout(context.timeout) : undefined,
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

    // Try introspection if available
    const introspectionUrl = credentials.introspectionUrl as string;
    if (introspectionUrl && hasAccessToken) {
      const startTime = performance.now();
      const introspection = await this.introspectToken(credentials);
      const latencyMs = performance.now() - startTime;

      if (introspection.error) {
        // Introspection failed, fall back to expiration check
      } else {
        return {
          healthy: introspection.active,
          message: introspection.active 
            ? 'Token is active (verified via introspection)' 
            : 'Token is not active',
          latencyMs,
          tokenStatus: introspection.active ? 'valid' : 'invalid',
          tokenExpiresIn: introspection.exp 
            ? introspection.exp - Math.floor(Date.now() / 1000)
            : tokenExpiresIn,
          canRefresh: true, // Client Credentials can always request new token
          details: {
            scope: introspection.scope,
            clientId: introspection.clientId,
          },
        };
      }
    }

    // Test by requesting a new token
    if (!hasAccessToken || isExpired) {
      const startTime = performance.now();
      const authResult = await this.authenticate(credentials);
      const latencyMs = performance.now() - startTime;

      if (authResult.type === 'complete') {
        return {
          healthy: true,
          message: 'Successfully obtained new access token',
          latencyMs,
          tokenStatus: 'valid',
          tokenExpiresIn: (authResult.data as { expiresIn?: number }).expiresIn || -1,
          canRefresh: true,
        };
      } else {
        return {
          healthy: false,
          message: authResult.error || 'Failed to obtain access token',
          latencyMs,
          tokenStatus: 'invalid',
          tokenExpiresIn: 0,
          canRefresh: false,
        };
      }
    }

    return {
      healthy: tokenStatus === 'valid',
      message: tokenStatus === 'valid' 
        ? 'Token appears valid' 
        : 'Token status unknown',
      latencyMs: 0,
      tokenStatus,
      tokenExpiresIn,
      canRefresh: true, // Can always request new token
    };
  }

  // ============================================
  // JWT GENERATION HELPERS
  // ============================================

  /**
   * Generate client assertion JWT signed with client_secret (HS256)
   */
  private async generateClientAssertionHs256(
    clientId: string,
    clientSecret: string,
    audience: string
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };
    
    const payload = {
      iss: clientId,
      sub: clientId,
      aud: audience,
      jti: crypto.randomUUID(),
      exp: now + 300, // 5 minutes
      iat: now,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    // Sign with HMAC-SHA256
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(clientSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(signingInput)
    );

    const encodedSignature = this.base64UrlEncode(
      String.fromCharCode(...new Uint8Array(signature))
    );

    return `${signingInput}.${encodedSignature}`;
  }

  /**
   * Generate client assertion JWT signed with private key (RS256)
   * 
   * Note: This is a simplified implementation. In production, consider
   * using a proper JWT library for key parsing and signing.
   */
  private async generateClientAssertionRs256(
    clientId: string,
    privateKeyPem: string,
    audience: string,
    keyId?: string
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    
    const header: Record<string, string> = {
      alg: 'RS256',
      typ: 'JWT',
    };
    
    if (keyId) {
      header.kid = keyId;
    }
    
    const payload = {
      iss: clientId,
      sub: clientId,
      aud: audience,
      jti: crypto.randomUUID(),
      exp: now + 300, // 5 minutes
      iat: now,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    // Import the private key
    const pemContents = privateKeyPem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace('-----BEGIN RSA PRIVATE KEY-----', '')
      .replace('-----END RSA PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    const key = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(signingInput)
    );

    const encodedSignature = this.base64UrlEncode(
      String.fromCharCode(...new Uint8Array(signature))
    );

    return `${signingInput}.${encodedSignature}`;
  }

  /**
   * Base64-URL encode a string
   */
  private base64UrlEncode(str: string): string {
    const base64 = btoa(str);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
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
}

// Export default instance
export default ClientCredentialsHandshakeExecutor;
