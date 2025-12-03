// ============================================
// PROTOCOL OS - GRAPHQL HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.7.a
// Purpose: GraphQL API Authentication and Query Execution
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
 * GraphQL Protocol
 * 
 * GraphQL is a query language for APIs that provides:
 * - Single endpoint for all operations
 * - Strongly typed schema
 * - Client-specified data requirements
 * - Introspection capabilities
 * 
 * Authentication is typically done via:
 * - Bearer tokens (most common)
 * - API keys
 * - Custom headers
 * - Cookies (session-based)
 */

/**
 * GraphQL authentication method
 */
export type GraphQLAuthMethod = 
  | 'bearer'           // Authorization: Bearer {token}
  | 'api-key'          // X-API-Key or custom header
  | 'basic'            // Authorization: Basic
  | 'custom-header'    // Custom authentication header
  | 'none';            // No authentication (public API)

/**
 * GraphQL operation type
 */
export type GraphQLOperationType = 'query' | 'mutation' | 'subscription';

/**
 * GraphQL request payload
 */
export interface GraphQLRequest {
  query: string;
  operationName?: string;
  variables?: Record<string, unknown>;
}

/**
 * GraphQL response structure
 */
export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: Record<string, unknown>;
}

/**
 * GraphQL error structure
 */
export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

/**
 * GraphQL configuration
 */
export interface GraphQLConfiguration {
  /** GraphQL endpoint URL */
  endpoint: string;
  
  /** Authentication method */
  authMethod: GraphQLAuthMethod;
  
  /** Bearer token or API key */
  authToken?: string;
  
  /** Custom header name for auth */
  authHeaderName?: string;
  
  /** Custom header value prefix */
  authHeaderPrefix?: string;
  
  /** Additional headers */
  additionalHeaders?: Record<string, string>;
  
  /** Default operation timeout (ms) */
  timeout?: number;
  
  /** Enable introspection queries */
  enableIntrospection?: boolean;
  
  /** WebSocket endpoint for subscriptions */
  subscriptionEndpoint?: string;
}

/**
 * GraphQL Protocol Module
 * 
 * Implements GraphQL query execution with flexible authentication.
 * Supports queries, mutations, and provides introspection capabilities.
 */
export class GraphQLHandshakeExecutor extends BaseProtocolModule {
  private schemaCache: unknown = null;

  constructor() {
    super();
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'graphql',
      displayName: 'GraphQL',
      description: 'GraphQL API protocol with query, mutation, and introspection support.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/graphql',
      icon: 'hexagon',
      capabilities: this.getCapabilities(),
      useCases: [
        'Modern API integrations',
        'Content management systems',
        'E-commerce platforms',
        'Social media APIs',
        'Real-time applications',
        'Mobile app backends',
        'Headless CMS',
      ],
      examplePlatforms: [
        'GitHub GraphQL API',
        'Shopify Storefront API',
        'Contentful',
        'Hasura',
        'Apollo Server',
        'Strapi',
        'Hygraph (GraphCMS)',
        'Fauna',
      ],
    };
  }

  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRedirectFlow: false,
      supportsTokenRefresh: false, // Depends on underlying auth
      supportsTokenRevocation: false,
      supportsScopes: false,
      supportsIncrementalAuth: false,
      supportsOfflineAccess: true,
      supportsPkce: false,
      requiresServerSide: false, // Can be used client-side with proper CORS
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
        id: 'endpoint',
        label: 'GraphQL Endpoint',
        type: 'url',
        required: true,
        description: 'The GraphQL API endpoint URL.',
        placeholder: 'https://api.example.com/graphql',
        group: 'endpoint',
        order: 1,
      },
      {
        id: 'authMethod',
        label: 'Authentication Method',
        type: 'select',
        required: true,
        description: 'How to authenticate requests.',
        defaultValue: 'bearer',
        options: [
          { value: 'bearer', label: 'Bearer Token (Most Common)' },
          { value: 'api-key', label: 'API Key Header' },
          { value: 'basic', label: 'Basic Authentication' },
          { value: 'custom-header', label: 'Custom Header' },
          { value: 'none', label: 'No Authentication (Public)' },
        ],
        group: 'authentication',
        order: 1,
      },
    ];
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'authToken',
        label: 'Auth Token / API Key',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'Bearer token or API key for authentication.',
        placeholder: 'your-auth-token',
        group: 'authentication',
        order: 2,
        visibleWhen: { field: 'authMethod', notValue: 'none' },
      },
      {
        id: 'authHeaderName',
        label: 'Header Name',
        type: 'text',
        required: false,
        description: 'Custom authentication header name.',
        defaultValue: 'X-API-Key',
        placeholder: 'X-API-Key',
        group: 'authentication',
        order: 3,
        visibleWhen: { field: 'authMethod', value: ['api-key', 'custom-header'] },
      },
      {
        id: 'authHeaderPrefix',
        label: 'Header Value Prefix',
        type: 'text',
        required: false,
        description: 'Prefix before the token value.',
        placeholder: 'Bearer ',
        group: 'authentication',
        order: 4,
        visibleWhen: { field: 'authMethod', value: 'custom-header' },
      },
      {
        id: 'additionalHeaders',
        label: 'Additional Headers',
        type: 'json',
        required: false,
        description: 'Extra headers to include in requests (JSON object).',
        placeholder: '{"X-Custom-Header": "value"}',
        group: 'advanced',
        order: 1,
      },
      {
        id: 'timeout',
        label: 'Request Timeout (ms)',
        type: 'number',
        required: false,
        description: 'Maximum time to wait for response.',
        defaultValue: 30000,
        placeholder: '30000',
        group: 'advanced',
        order: 2,
      },
      {
        id: 'enableIntrospection',
        label: 'Enable Introspection',
        type: 'checkbox',
        required: false,
        description: 'Allow schema introspection queries.',
        defaultValue: true,
        group: 'advanced',
        order: 3,
      },
      {
        id: 'subscriptionEndpoint',
        label: 'Subscription Endpoint',
        type: 'url',
        required: false,
        description: 'WebSocket endpoint for GraphQL subscriptions.',
        placeholder: 'wss://api.example.com/graphql',
        group: 'advanced',
        order: 4,
      },
    ];
  }

  getFieldGroups() {
    return [
      {
        id: 'endpoint',
        label: 'GraphQL Endpoint',
        description: 'Your GraphQL API URL.',
      },
      {
        id: 'authentication',
        label: 'Authentication',
        description: 'How to authenticate with the GraphQL API.',
      },
      {
        id: 'advanced',
        label: 'Advanced Settings',
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

    // GraphQL auth is immediate - test with introspection if enabled
    const authMethod = credentials.authMethod as GraphQLAuthMethod;
    
    if (authMethod !== 'none' && !credentials.authToken) {
      return {
        step: 1,
        totalSteps: 1,
        type: 'error',
        title: 'Missing Credentials',
        description: 'Authentication token is required.',
        error: 'Auth token is required for non-public APIs',
      };
    }

    // Test the connection with a simple introspection query
    const enableIntrospection = credentials.enableIntrospection !== false;
    if (enableIntrospection) {
      try {
        const testResult = await this.executeGraphQL(
          credentials as AuthenticationCredentials,
          {
            query: `
              query IntrospectionTest {
                __schema {
                  queryType {
                    name
                  }
                }
              }
            `,
          }
        );

        if (testResult.errors && testResult.errors.length > 0) {
          // Check if it's just introspection disabled
          const isIntrospectionError = testResult.errors.some(
            (e) => e.message.toLowerCase().includes('introspection')
          );
          
          if (!isIntrospectionError) {
            return {
              step: 1,
              totalSteps: 1,
              type: 'error',
              title: 'Connection Failed',
              description: 'Failed to connect to GraphQL endpoint.',
              error: testResult.errors[0].message,
            };
          }
        }
      } catch (error) {
        return {
          step: 1,
          totalSteps: 1,
          type: 'error',
          title: 'Connection Failed',
          description: 'Could not reach the GraphQL endpoint.',
          error: error instanceof Error ? error.message : 'Network error',
        };
      }
    }

    this.status = 'authenticated';

    return {
      step: 1,
      totalSteps: 1,
      type: 'complete',
      title: 'GraphQL Configured',
      description: 'Your GraphQL endpoint is ready to use.',
      data: {
        endpoint: credentials.endpoint,
        authMethod,
        hasSubscriptions: !!credentials.subscriptionEndpoint,
      },
    };
  }

  // ============================================
  // GRAPHQL EXECUTION
  // ============================================

  /**
   * Execute a GraphQL operation
   */
  async executeGraphQL<T = unknown>(
    credentials: AuthenticationCredentials,
    request: GraphQLRequest
  ): Promise<GraphQLResponse<T>> {
    const endpoint = credentials.endpoint as string;
    const timeout = (credentials.timeout as number) || 30000;
    
    // Build headers
    const headers = this.buildHeaders(credentials);
    headers['Content-Type'] = 'application/json';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: request.query,
          operationName: request.operationName,
          variables: request.variables,
        }),
        signal: AbortSignal.timeout(timeout),
      });

      const result = await response.json() as GraphQLResponse<T>;

      // GraphQL always returns 200 for valid responses, check for errors in body
      return result;
    } catch (error) {
      return {
        errors: [{
          message: error instanceof Error ? error.message : 'Request failed',
          extensions: {
            code: 'NETWORK_ERROR',
          },
        }],
      };
    }
  }

  /**
   * Execute a GraphQL query
   */
  async query<T = unknown>(
    credentials: AuthenticationCredentials,
    queryString: string,
    variables?: Record<string, unknown>,
    operationName?: string
  ): Promise<GraphQLResponse<T>> {
    return this.executeGraphQL<T>(credentials, {
      query: queryString,
      variables,
      operationName,
    });
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<T = unknown>(
    credentials: AuthenticationCredentials,
    mutation: string,
    variables?: Record<string, unknown>,
    operationName?: string
  ): Promise<GraphQLResponse<T>> {
    return this.executeGraphQL<T>(credentials, {
      query: mutation,
      variables,
      operationName,
    });
  }

  /**
   * Build authentication headers
   */
  private buildHeaders(credentials: AuthenticationCredentials): Record<string, string> {
    const headers: Record<string, string> = {};
    const authMethod = credentials.authMethod as GraphQLAuthMethod;
    const authToken = credentials.authToken as string;

    switch (authMethod) {
      case 'bearer':
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        break;
        
      case 'api-key':
        if (authToken) {
          const headerName = (credentials.authHeaderName as string) || 'X-API-Key';
          headers[headerName] = authToken;
        }
        break;
        
      case 'basic':
        if (authToken) {
          headers['Authorization'] = `Basic ${authToken}`;
        }
        break;
        
      case 'custom-header':
        if (authToken) {
          const headerName = (credentials.authHeaderName as string) || 'Authorization';
          const prefix = (credentials.authHeaderPrefix as string) || '';
          headers[headerName] = `${prefix}${authToken}`;
        }
        break;
        
      case 'none':
        // No authentication
        break;
    }

    // Add additional headers
    const additionalHeaders = credentials.additionalHeaders as Record<string, string>;
    if (additionalHeaders && typeof additionalHeaders === 'object') {
      Object.assign(headers, additionalHeaders);
    }

    return headers;
  }

  // ============================================
  // INTROSPECTION
  // ============================================

  /**
   * Fetch the GraphQL schema via introspection
   */
  async introspect(credentials: AuthenticationCredentials): Promise<{
    success: boolean;
    schema?: unknown;
    error?: string;
  }> {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          subscriptionType { name }
          types {
            ...FullType
          }
          directives {
            name
            description
            locations
            args {
              ...InputValue
            }
          }
        }
      }

      fragment FullType on __Type {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args {
            ...InputValue
          }
          type {
            ...TypeRef
          }
          isDeprecated
          deprecationReason
        }
        inputFields {
          ...InputValue
        }
        interfaces {
          ...TypeRef
        }
        enumValues(includeDeprecated: true) {
          name
          description
          isDeprecated
          deprecationReason
        }
        possibleTypes {
          ...TypeRef
        }
      }

      fragment InputValue on __InputValue {
        name
        description
        type {
          ...TypeRef
        }
        defaultValue
      }

      fragment TypeRef on __Type {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.executeGraphQL(credentials, { query: introspectionQuery });

    if (result.errors && result.errors.length > 0) {
      return {
        success: false,
        error: result.errors[0].message,
      };
    }

    this.schemaCache = result.data;

    return {
      success: true,
      schema: result.data,
    };
  }

  /**
   * Get available query types from cached schema
   */
  getAvailableQueries(): string[] {
    if (!this.schemaCache) return [];
    
    // Parse schema cache for query type
    // This is a simplified implementation
    try {
      const schema = this.schemaCache as { __schema?: { queryType?: { name: string } } };
      const queryTypeName = schema.__schema?.queryType?.name || 'Query';
      // Return placeholder - full implementation would parse types
      return [queryTypeName];
    } catch {
      return [];
    }
  }

  // ============================================
  // TOKEN MANAGEMENT (N/A for GraphQL)
  // ============================================

  async refreshTokens(_credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    // GraphQL doesn't have built-in token refresh
    // Token refresh is handled by the underlying auth mechanism
    return {
      success: true,
      accessToken: undefined,
    };
  }

  async revokeTokens(_credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Token revocation is handled by the identity provider, not GraphQL.',
    };
  }

  isTokenExpired(_credentials: AuthenticationCredentials): boolean {
    return false; // GraphQL doesn't track token expiration
  }

  getTokenExpirationTime(_credentials: AuthenticationCredentials): Date | null {
    return null;
  }

  // ============================================
  // REQUEST EXECUTION (Protocol Interface)
  // ============================================

  async injectAuthentication(
    context: ProtocolExecutionContext
  ): Promise<{
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body?: string | Record<string, unknown>;
  }> {
    const headers = this.buildHeaders(context.credentials);
    return { headers, queryParams: {} };
  }

  async executeRequest(context: ProtocolExecutionContext): Promise<ProtocolExecutionResult> {
    const startTime = performance.now();

    // For GraphQL, we expect the body to contain the query
    const body = context.body as GraphQLRequest | string;
    let graphqlRequest: GraphQLRequest;

    if (typeof body === 'string') {
      // Assume it's a query string
      graphqlRequest = { query: body };
    } else if (body && typeof body === 'object' && 'query' in body) {
      graphqlRequest = body as GraphQLRequest;
    } else {
      return {
        success: false,
        statusCode: 400,
        headers: {},
        body: null,
        rawBody: '',
        durationMs: performance.now() - startTime,
        credentialsRefreshed: false,
        error: 'Invalid GraphQL request: must include query field',
        errorCode: 'INVALID_REQUEST',
      };
    }

    const result = await this.executeGraphQL(
      context.credentials as AuthenticationCredentials,
      graphqlRequest
    );

    const durationMs = performance.now() - startTime;

    // GraphQL has unique error handling - can have both data and errors
    const hasErrors = result.errors && result.errors.length > 0;
    const hasData = result.data !== undefined && result.data !== null;

    // Consider success if we have data, even with errors (partial success)
    const success = hasData || !hasErrors;

    return {
      success,
      statusCode: 200, // GraphQL typically returns 200
      headers: {},
      body: result,
      rawBody: JSON.stringify(result),
      durationMs,
      credentialsRefreshed: false,
      error: hasErrors ? result.errors![0].message : undefined,
      errorCode: hasErrors ? (result.errors![0].extensions?.code as string) : undefined,
    };
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(credentials: AuthenticationCredentials): Promise<ProtocolHealthCheckResult> {
    const startTime = performance.now();

    // Simple query to test connectivity
    const testQuery = `
      query HealthCheck {
        __typename
      }
    `;

    try {
      const result = await this.executeGraphQL(credentials, { query: testQuery });
      const latencyMs = performance.now() - startTime;

      if (result.errors && result.errors.length > 0) {
        // Check error type
        const error = result.errors[0];
        const isAuthError = error.message.toLowerCase().includes('unauthorized') ||
                           error.message.toLowerCase().includes('authentication') ||
                           error.extensions?.code === 'UNAUTHENTICATED';

        return {
          healthy: false,
          message: isAuthError ? 'Authentication failed' : error.message,
          latencyMs,
          tokenStatus: isAuthError ? 'invalid' : 'valid',
          tokenExpiresIn: -1,
          canRefresh: false,
          details: {
            error: error.message,
            code: error.extensions?.code,
          },
        };
      }

      return {
        healthy: true,
        message: 'GraphQL endpoint is responding',
        latencyMs,
        tokenStatus: 'valid',
        tokenExpiresIn: -1,
        canRefresh: false,
        details: {
          typename: (result.data as { __typename?: string })?.__typename,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Connection failed',
        latencyMs: performance.now() - startTime,
        tokenStatus: 'invalid',
        tokenExpiresIn: 0,
        canRefresh: false,
      };
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Parse a GraphQL operation string to extract operation type and name
   */
  static parseOperation(query: string): {
    type: GraphQLOperationType;
    name?: string;
  } {
    const trimmed = query.trim();
    
    // Check for explicit operation type
    const queryMatch = trimmed.match(/^query\s+(\w+)?/i);
    if (queryMatch) {
      return { type: 'query', name: queryMatch[1] };
    }
    
    const mutationMatch = trimmed.match(/^mutation\s+(\w+)?/i);
    if (mutationMatch) {
      return { type: 'mutation', name: mutationMatch[1] };
    }
    
    const subscriptionMatch = trimmed.match(/^subscription\s+(\w+)?/i);
    if (subscriptionMatch) {
      return { type: 'subscription', name: subscriptionMatch[1] };
    }
    
    // Default to query if starts with { (anonymous query)
    if (trimmed.startsWith('{')) {
      return { type: 'query' };
    }
    
    return { type: 'query' };
  }

  /**
   * Format GraphQL errors for display
   */
  static formatErrors(errors: GraphQLError[]): string {
    return errors
      .map((e, i) => {
        let msg = `${i + 1}. ${e.message}`;
        if (e.path) {
          msg += ` (at ${e.path.join('.')})`;
        }
        if (e.locations && e.locations.length > 0) {
          const loc = e.locations[0];
          msg += ` [line ${loc.line}, col ${loc.column}]`;
        }
        return msg;
      })
      .join('\n');
  }

  /**
   * Build a simple query from field selection
   */
  static buildQuery(
    typeName: string,
    fields: string[],
    args?: Record<string, unknown>
  ): string {
    const argsString = args
      ? `(${Object.entries(args)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(', ')})`
      : '';
    
    return `
      query {
        ${typeName}${argsString} {
          ${fields.join('\n          ')}
        }
      }
    `.trim();
  }
}

// Export default instance
export default GraphQLHandshakeExecutor;
