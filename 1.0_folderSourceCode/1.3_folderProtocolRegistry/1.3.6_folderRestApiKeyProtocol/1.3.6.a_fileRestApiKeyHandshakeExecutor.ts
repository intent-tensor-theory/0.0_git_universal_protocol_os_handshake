// ============================================
// PROTOCOL OS - REST API KEY HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.6.a
// Purpose: REST API Key Authentication (Header, Query, Body)
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
 * REST API Key Authentication
 * 
 * The simplest and most common form of API authentication. An API key is
 * a static secret token that is included with each request to identify
 * and authenticate the caller.
 * 
 * Key Placement Options:
 * - Header: X-API-Key, Authorization: Bearer, Authorization: ApiKey, custom
 * - Query Parameter: ?api_key=xxx, ?key=xxx, custom
 * - Request Body: For POST requests
 * 
 * Characteristics:
 * - No expiration (unless rotated by provider)
 * - No refresh flow
 * - Simple to implement
 * - Widely supported
 */

/**
 * Where to place the API key in the request
 */
export type ApiKeyPlacement = 'header' | 'query' | 'body';

/**
 * Common header formats for API keys
 */
export type ApiKeyHeaderFormat = 
  | 'x-api-key'           // X-API-Key: {key}
  | 'authorization-bearer' // Authorization: Bearer {key}
  | 'authorization-apikey' // Authorization: ApiKey {key}
  | 'authorization-basic'  // Authorization: Basic base64({key}:) or base64(:{key})
  | 'authorization-token'  // Authorization: Token {key}
  | 'custom';              // Custom header name

/**
 * REST API Key configuration
 */
export interface RestApiKeyConfiguration {
  /** The API key value */
  apiKey: string;
  
  /** Where to place the key (header, query, body) */
  placement: ApiKeyPlacement;
  
  /** Header format (if placement is 'header') */
  headerFormat?: ApiKeyHeaderFormat;
  
  /** Custom header name (if headerFormat is 'custom') */
  customHeaderName?: string;
  
  /** Custom header prefix (e.g., 'Bearer ', 'Token ') */
  customHeaderPrefix?: string;
  
  /** Query parameter name (if placement is 'query') */
  queryParamName?: string;
  
  /** Body field name (if placement is 'body') */
  bodyFieldName?: string;
  
  /** Optional: Secondary API key (some APIs use key pairs) */
  secondaryApiKey?: string;
  
  /** Secondary key placement */
  secondaryPlacement?: ApiKeyPlacement;
  
  /** Secondary header/param name */
  secondaryKeyName?: string;
  
  /** Base URL for the API (for health checks) */
  baseUrl?: string;
  
  /** Health check endpoint path */
  healthCheckPath?: string;
}

/**
 * REST API Key Protocol Module
 * 
 * Implements simple API key authentication with flexible placement options.
 * This is the most straightforward authentication method - just include
 * a secret key with each request.
 * 
 * Common Use Cases:
 * - Third-party API integrations (Stripe, SendGrid, Twilio, etc.)
 * - Internal microservices
 * - Rate-limited public APIs
 * - Simple webhook authentication
 */
export class RestApiKeyHandshakeExecutor extends BaseProtocolModule {
  constructor() {
    super();
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'api-key',
      displayName: 'REST API Key',
      description: 'Simple API key authentication via headers, query parameters, or request body.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/api-key',
      icon: 'key',
      capabilities: this.getCapabilities(),
      useCases: [
        'Third-party API integrations',
        'Payment APIs (Stripe, Square)',
        'Email APIs (SendGrid, Mailgun)',
        'AI APIs (OpenAI, Anthropic)',
        'Communication APIs (Twilio, Vonage)',
        'Internal microservices',
        'Webhook authentication',
        'Rate-limited public APIs',
      ],
      examplePlatforms: [
        'Stripe',
        'SendGrid',
        'OpenAI',
        'Anthropic',
        'Twilio',
        'Mailchimp',
        'Airtable',
        'Notion',
        'GitHub',
        'Cloudflare',
      ],
    };
  }

  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRedirectFlow: false,
      supportsTokenRefresh: false, // API keys don't expire (unless rotated)
      supportsTokenRevocation: false, // Managed in provider dashboard
      supportsScopes: false, // Permissions set at key creation
      supportsIncrementalAuth: false,
      supportsOfflineAccess: true, // Always works
      supportsPkce: false,
      requiresServerSide: true, // Keys should not be in client-side code
      browserCompatible: false, // Don't expose keys in browser
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
        id: 'apiKey',
        label: 'API Key',
        type: 'secret',
        required: true,
        sensitive: true,
        description: 'Your API key from the provider.',
        placeholder: 'sk_live_xxxxxxxxxxxxxxxxxxxxx',
        group: 'credentials',
        order: 1,
        warning: '⚠️ Keep this key secure. Never expose in client-side code or logs.',
      },
      {
        id: 'placement',
        label: 'Key Placement',
        type: 'select',
        required: true,
        description: 'Where to include the API key in requests.',
        defaultValue: 'header',
        options: [
          { value: 'header', label: 'HTTP Header (Most Common)' },
          { value: 'query', label: 'Query Parameter' },
          { value: 'body', label: 'Request Body' },
        ],
        group: 'configuration',
        order: 1,
      },
    ];
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'headerFormat',
        label: 'Header Format',
        type: 'select',
        required: false,
        description: 'Format for the Authorization/API key header.',
        defaultValue: 'x-api-key',
        options: [
          { value: 'x-api-key', label: 'X-API-Key: {key}' },
          { value: 'authorization-bearer', label: 'Authorization: Bearer {key}' },
          { value: 'authorization-apikey', label: 'Authorization: ApiKey {key}' },
          { value: 'authorization-basic', label: 'Authorization: Basic (key as password)' },
          { value: 'authorization-token', label: 'Authorization: Token {key}' },
          { value: 'custom', label: 'Custom Header' },
        ],
        group: 'configuration',
        order: 2,
        visibleWhen: { field: 'placement', value: 'header' },
      },
      {
        id: 'customHeaderName',
        label: 'Custom Header Name',
        type: 'text',
        required: false,
        description: 'Name of the custom header.',
        placeholder: 'X-Custom-API-Key',
        group: 'configuration',
        order: 3,
        visibleWhen: { field: 'headerFormat', value: 'custom' },
      },
      {
        id: 'customHeaderPrefix',
        label: 'Header Value Prefix',
        type: 'text',
        required: false,
        description: 'Prefix before the key value (e.g., "Bearer ").',
        placeholder: 'Bearer ',
        group: 'configuration',
        order: 4,
        visibleWhen: { field: 'headerFormat', value: 'custom' },
      },
      {
        id: 'queryParamName',
        label: 'Query Parameter Name',
        type: 'text',
        required: false,
        description: 'Name of the query parameter for the API key.',
        defaultValue: 'api_key',
        placeholder: 'api_key',
        group: 'configuration',
        order: 5,
        visibleWhen: { field: 'placement', value: 'query' },
      },
      {
        id: 'bodyFieldName',
        label: 'Body Field Name',
        type: 'text',
        required: false,
        description: 'JSON field name for the API key in request body.',
        defaultValue: 'api_key',
        placeholder: 'api_key',
        group: 'configuration',
        order: 6,
        visibleWhen: { field: 'placement', value: 'body' },
      },
      {
        id: 'secondaryApiKey',
        label: 'Secondary API Key',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'Some APIs require a key pair (e.g., public + secret key).',
        placeholder: 'pk_live_xxxxxxxxxxxxxxxxxxxxx',
        group: 'credentials',
        order: 2,
      },
      {
        id: 'secondaryPlacement',
        label: 'Secondary Key Placement',
        type: 'select',
        required: false,
        description: 'Where to include the secondary key.',
        options: [
          { value: 'header', label: 'HTTP Header' },
          { value: 'query', label: 'Query Parameter' },
        ],
        group: 'configuration',
        order: 7,
        visibleWhen: { field: 'secondaryApiKey', notEmpty: true },
      },
      {
        id: 'secondaryKeyName',
        label: 'Secondary Key Name',
        type: 'text',
        required: false,
        description: 'Header or query param name for secondary key.',
        placeholder: 'X-Public-Key',
        group: 'configuration',
        order: 8,
        visibleWhen: { field: 'secondaryApiKey', notEmpty: true },
      },
      {
        id: 'baseUrl',
        label: 'Base URL',
        type: 'url',
        required: false,
        description: 'Base URL for the API (for health checks).',
        placeholder: 'https://api.example.com',
        group: 'endpoints',
        order: 1,
      },
      {
        id: 'healthCheckPath',
        label: 'Health Check Path',
        type: 'text',
        required: false,
        description: 'Endpoint path to test API key validity.',
        placeholder: '/v1/me',
        group: 'endpoints',
        order: 2,
      },
    ];
  }

  getFieldGroups() {
    return [
      {
        id: 'credentials',
        label: 'API Credentials',
        description: 'Your API key(s) from the provider.',
        warning: '⚠️ API keys grant direct access. Protect them like passwords.',
      },
      {
        id: 'configuration',
        label: 'Key Configuration',
        description: 'How to include the key in requests.',
      },
      {
        id: 'endpoints',
        label: 'API Endpoints',
        description: 'For testing and validation.',
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

    // API key auth is immediate - no flow needed
    this.status = 'authenticated';

    // Optionally test the key
    const baseUrl = credentials.baseUrl as string;
    const healthCheckPath = credentials.healthCheckPath as string;

    if (baseUrl && healthCheckPath) {
      try {
        const testResult = await this.executeRequest({
          credentials: credentials as AuthenticationCredentials,
          url: `${baseUrl}${healthCheckPath}`,
          method: 'GET',
          headers: {},
        });

        if (!testResult.success) {
          return {
            step: 1,
            totalSteps: 1,
            type: 'error',
            title: 'API Key Invalid',
            description: 'The API key was rejected by the server.',
            error: testResult.error || `HTTP ${testResult.statusCode}`,
          };
        }
      } catch (error) {
        // Network error - key might still be valid
        console.warn('Health check failed:', error);
      }
    }

    return {
      step: 1,
      totalSteps: 1,
      type: 'complete',
      title: 'API Key Configured',
      description: 'Your API key is ready to use.',
      data: {
        placement: credentials.placement,
        headerFormat: credentials.headerFormat,
        hasSecondaryKey: !!credentials.secondaryApiKey,
      },
    };
  }

  // ============================================
  // TOKEN MANAGEMENT (N/A for API Keys)
  // ============================================

  async refreshTokens(_credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    // API keys don't expire/refresh
    return {
      success: true,
      accessToken: undefined, // No change
    };
  }

  async revokeTokens(_credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'API keys are revoked in the provider dashboard, not programmatically.',
    };
  }

  isTokenExpired(_credentials: AuthenticationCredentials): boolean {
    // API keys don't expire
    return false;
  }

  getTokenExpirationTime(_credentials: AuthenticationCredentials): Date | null {
    // API keys don't expire
    return null;
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
    const credentials = context.credentials;
    const apiKey = credentials.apiKey as string;
    const placement = (credentials.placement as ApiKeyPlacement) || 'header';
    
    const headers: Record<string, string> = {};
    const queryParams: Record<string, string> = {};
    let body: Record<string, unknown> | undefined;

    // Primary key injection
    switch (placement) {
      case 'header':
        const headerFormat = (credentials.headerFormat as ApiKeyHeaderFormat) || 'x-api-key';
        this.injectHeaderKey(headers, apiKey, headerFormat, credentials);
        break;
        
      case 'query':
        const queryParamName = (credentials.queryParamName as string) || 'api_key';
        queryParams[queryParamName] = apiKey;
        break;
        
      case 'body':
        const bodyFieldName = (credentials.bodyFieldName as string) || 'api_key';
        body = { [bodyFieldName]: apiKey };
        break;
    }

    // Secondary key injection (if configured)
    const secondaryKey = credentials.secondaryApiKey as string;
    if (secondaryKey) {
      const secondaryPlacement = (credentials.secondaryPlacement as ApiKeyPlacement) || 'header';
      const secondaryKeyName = (credentials.secondaryKeyName as string) || 'X-Public-Key';

      if (secondaryPlacement === 'header') {
        headers[secondaryKeyName] = secondaryKey;
      } else if (secondaryPlacement === 'query') {
        queryParams[secondaryKeyName.toLowerCase().replace(/-/g, '_')] = secondaryKey;
      }
    }

    return { headers, queryParams, body };
  }

  /**
   * Inject API key into header based on format
   */
  private injectHeaderKey(
    headers: Record<string, string>,
    apiKey: string,
    format: ApiKeyHeaderFormat,
    credentials: Partial<AuthenticationCredentials>
  ): void {
    switch (format) {
      case 'x-api-key':
        headers['X-API-Key'] = apiKey;
        break;
        
      case 'authorization-bearer':
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
        
      case 'authorization-apikey':
        headers['Authorization'] = `ApiKey ${apiKey}`;
        break;
        
      case 'authorization-basic':
        // API key as password with empty username
        const basicAuth = btoa(`:${apiKey}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        break;
        
      case 'authorization-token':
        headers['Authorization'] = `Token ${apiKey}`;
        break;
        
      case 'custom':
        const customName = (credentials.customHeaderName as string) || 'X-API-Key';
        const customPrefix = (credentials.customHeaderPrefix as string) || '';
        headers[customName] = `${customPrefix}${apiKey}`;
        break;
    }
  }

  async executeRequest(context: ProtocolExecutionContext): Promise<ProtocolExecutionResult> {
    const startTime = performance.now();

    // Inject authentication
    const authInjection = await this.injectAuthentication(context);
    
    // Merge headers
    const headers = {
      ...context.headers,
      ...authInjection.headers,
    };

    // Build URL with query params
    let url = context.url;
    if (Object.keys(authInjection.queryParams).length > 0) {
      const urlObj = new URL(url);
      for (const [key, value] of Object.entries(authInjection.queryParams)) {
        urlObj.searchParams.set(key, value);
      }
      url = urlObj.toString();
    }

    // Merge body if needed
    let requestBody = context.body;
    if (authInjection.body) {
      if (typeof context.body === 'object' && context.body !== null) {
        requestBody = { ...context.body, ...authInjection.body };
      } else if (!context.body) {
        requestBody = authInjection.body;
      }
    }

    try {
      const response = await fetch(url, {
        method: context.method,
        headers,
        body: context.method !== 'GET' && context.method !== 'HEAD' && requestBody
          ? (typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody))
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

      return {
        success: response.ok,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody,
        rawBody,
        durationMs: performance.now() - startTime,
        credentialsRefreshed: false,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        errorCode: response.ok ? undefined : this.mapHttpErrorCode(response.status),
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

  /**
   * Map HTTP status codes to error codes
   */
  private mapHttpErrorCode(status: number): string {
    switch (status) {
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 429:
        return 'RATE_LIMITED';
      case 500:
      case 502:
      case 503:
        return 'SERVER_ERROR';
      default:
        return `HTTP_${status}`;
    }
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(credentials: AuthenticationCredentials): Promise<ProtocolHealthCheckResult> {
    const hasApiKey = !!(credentials.apiKey);
    const baseUrl = credentials.baseUrl as string;
    const healthCheckPath = credentials.healthCheckPath as string;

    if (!hasApiKey) {
      return {
        healthy: false,
        message: 'No API key configured',
        latencyMs: 0,
        tokenStatus: 'missing',
        tokenExpiresIn: -1,
        canRefresh: false,
      };
    }

    // If we have a health check endpoint, test it
    if (baseUrl && healthCheckPath) {
      const startTime = performance.now();
      
      try {
        const result = await this.executeRequest({
          credentials,
          url: `${baseUrl}${healthCheckPath}`,
          method: 'GET',
          headers: {},
        });

        const latencyMs = performance.now() - startTime;

        if (result.success) {
          return {
            healthy: true,
            message: 'API key is valid',
            latencyMs,
            tokenStatus: 'valid',
            tokenExpiresIn: -1, // API keys don't expire
            canRefresh: false,
          };
        } else if (result.statusCode === 401 || result.statusCode === 403) {
          return {
            healthy: false,
            message: 'API key is invalid or revoked',
            latencyMs,
            tokenStatus: 'invalid',
            tokenExpiresIn: 0,
            canRefresh: false,
          };
        } else if (result.statusCode === 429) {
          return {
            healthy: true, // Key is valid, just rate limited
            message: 'API key is valid but rate limited',
            latencyMs,
            tokenStatus: 'valid',
            tokenExpiresIn: -1,
            canRefresh: false,
            details: {
              rateLimited: true,
            },
          };
        } else {
          return {
            healthy: false,
            message: `Health check failed: ${result.error}`,
            latencyMs,
            tokenStatus: 'invalid',
            tokenExpiresIn: 0,
            canRefresh: false,
          };
        }
      } catch (error) {
        return {
          healthy: false,
          message: `Health check error: ${error instanceof Error ? error.message : 'Unknown'}`,
          latencyMs: performance.now() - startTime,
          tokenStatus: 'invalid',
          tokenExpiresIn: 0,
          canRefresh: false,
        };
      }
    }

    // No health check endpoint configured
    return {
      healthy: true,
      message: 'API key configured (not validated)',
      latencyMs: 0,
      tokenStatus: 'valid',
      tokenExpiresIn: -1,
      canRefresh: false,
      details: {
        validated: false,
      },
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Mask an API key for display
   */
  static maskApiKey(key: string, showChars: number = 4): string {
    if (!key || key.length <= showChars * 2) {
      return '••••••••';
    }
    
    const prefix = key.substring(0, showChars);
    const suffix = key.substring(key.length - showChars);
    const maskedLength = key.length - (showChars * 2);
    
    return `${prefix}${'•'.repeat(Math.min(maskedLength, 20))}${suffix}`;
  }

  /**
   * Detect API key format from the key itself
   */
  static detectKeyFormat(key: string): {
    provider?: string;
    type?: string;
    environment?: 'live' | 'test' | 'unknown';
  } {
    // Stripe
    if (key.startsWith('sk_live_')) {
      return { provider: 'Stripe', type: 'Secret Key', environment: 'live' };
    }
    if (key.startsWith('sk_test_')) {
      return { provider: 'Stripe', type: 'Secret Key', environment: 'test' };
    }
    if (key.startsWith('pk_live_')) {
      return { provider: 'Stripe', type: 'Publishable Key', environment: 'live' };
    }
    if (key.startsWith('pk_test_')) {
      return { provider: 'Stripe', type: 'Publishable Key', environment: 'test' };
    }

    // OpenAI
    if (key.startsWith('sk-') && key.length > 40) {
      return { provider: 'OpenAI', type: 'API Key', environment: 'unknown' };
    }

    // SendGrid
    if (key.startsWith('SG.')) {
      return { provider: 'SendGrid', type: 'API Key', environment: 'unknown' };
    }

    // Twilio
    if (key.startsWith('SK')) {
      return { provider: 'Twilio', type: 'API Key', environment: 'unknown' };
    }

    // Anthropic
    if (key.startsWith('sk-ant-')) {
      return { provider: 'Anthropic', type: 'API Key', environment: 'unknown' };
    }

    return { environment: 'unknown' };
  }

  /**
   * Validate API key format (basic validation)
   */
  static validateKeyFormat(key: string): { valid: boolean; error?: string } {
    if (!key || key.trim().length === 0) {
      return { valid: false, error: 'API key is required' };
    }

    if (key.length < 10) {
      return { valid: false, error: 'API key seems too short' };
    }

    if (key.includes(' ')) {
      return { valid: false, error: 'API key should not contain spaces' };
    }

    // Check for common copy-paste errors
    if (key.startsWith('"') || key.endsWith('"')) {
      return { valid: false, error: 'Remove quotes from API key' };
    }

    if (key.includes('\n') || key.includes('\r')) {
      return { valid: false, error: 'API key should not contain line breaks' };
    }

    return { valid: true };
  }
}

// Export default instance
export default RestApiKeyHandshakeExecutor;
