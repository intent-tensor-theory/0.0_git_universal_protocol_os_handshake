// ============================================
// PROTOCOL OS - PROTOCOL HANDSHAKE MODULE INTERFACE
// ============================================
// Address: 1.3.b
// Purpose: Core contract that all protocol modules must implement
// ============================================

import type { AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';

/**
 * Protocol module status
 */
export type ProtocolModuleStatus = 
  | 'uninitialized'  // Module loaded but not configured
  | 'configured'     // Configuration provided, ready to execute
  | 'authenticated'  // Successfully authenticated
  | 'expired'        // Authentication expired, needs refresh
  | 'error'          // Error state
  | 'disabled';      // Manually disabled

/**
 * Protocol field types for dynamic form generation
 */
export type ProtocolFieldType =
  | 'text'           // Single-line text input
  | 'password'       // Password input (masked)
  | 'secret'         // Secret/API key (masked, sensitive)
  | 'url'            // URL input with validation
  | 'email'          // Email input with validation
  | 'number'         // Numeric input
  | 'select'         // Dropdown selection
  | 'multiselect'    // Multiple selection
  | 'checkbox'       // Boolean checkbox
  | 'textarea'       // Multi-line text
  | 'json'           // JSON editor
  | 'scopes'         // OAuth scopes selector
  | 'headers'        // Key-value headers editor
  | 'hidden';        // Hidden field (internal use)

/**
 * Protocol field definition for dynamic UI generation
 */
export interface ProtocolFieldDefinition {
  /** Unique field identifier */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Field type */
  type: ProtocolFieldType;
  
  /** Whether field is required */
  required: boolean;
  
  /** Help text/description */
  description?: string;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Default value */
  defaultValue?: unknown;
  
  /** Options for select/multiselect fields */
  options?: Array<{ value: string; label: string }>;
  
  /** Validation pattern (regex) */
  pattern?: string;
  
  /** Validation error message */
  patternError?: string;
  
  /** Minimum length/value */
  min?: number;
  
  /** Maximum length/value */
  max?: number;
  
  /** Whether this field contains sensitive data */
  sensitive?: boolean;
  
  /** Condition for showing this field */
  showWhen?: {
    field: string;
    value: unknown;
    operator?: 'equals' | 'notEquals' | 'contains' | 'exists';
  };
  
  /** Group this field belongs to */
  group?: string;
  
  /** Order within group */
  order?: number;
}

/**
 * Validation result from protocol module
 */
export interface ProtocolValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Field-specific errors */
  fieldErrors: Record<string, string>;
  
  /** General errors */
  generalErrors: string[];
  
  /** Warnings (non-blocking) */
  warnings: string[];
}

/**
 * Protocol capabilities flags
 */
export interface ProtocolCapabilities {
  /** Supports OAuth-style redirect flow */
  supportsRedirectFlow: boolean;
  
  /** Supports token refresh */
  supportsTokenRefresh: boolean;
  
  /** Supports token revocation */
  supportsTokenRevocation: boolean;
  
  /** Supports multiple scopes */
  supportsScopes: boolean;
  
  /** Supports incremental authorization */
  supportsIncrementalAuth: boolean;
  
  /** Supports offline access */
  supportsOfflineAccess: boolean;
  
  /** Supports PKCE */
  supportsPkce: boolean;
  
  /** Requires server-side component */
  requiresServerSide: boolean;
  
  /** Can be used in browser */
  browserCompatible: boolean;
  
  /** Supports request signing */
  supportsRequestSigning: boolean;
  
  /** Supports automatic token injection */
  supportsAutoInjection: boolean;
}

/**
 * Authentication flow step
 */
export interface ProtocolAuthenticationFlow {
  /** Current step number */
  step: number;
  
  /** Total steps */
  totalSteps: number;
  
  /** Step type */
  type: 'redirect' | 'input' | 'callback' | 'token-exchange' | 'complete' | 'error';
  
  /** Step title */
  title: string;
  
  /** Step description */
  description: string;
  
  /** URL for redirect (if type === 'redirect') */
  redirectUrl?: string;
  
  /** Required fields for this step (if type === 'input') */
  requiredFields?: ProtocolFieldDefinition[];
  
  /** Error message (if type === 'error') */
  error?: string;
  
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Context for protocol execution
 */
export interface ProtocolExecutionContext {
  /** Handshake ID */
  handshakeId: string;
  
  /** Platform ID */
  platformId: string;
  
  /** Resource ID */
  resourceId: string;
  
  /** Authentication credentials */
  credentials: AuthenticationCredentials;
  
  /** Request URL */
  url: string;
  
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  
  /** Request headers (before auth injection) */
  headers: Record<string, string>;
  
  /** Request body */
  body?: string | Record<string, unknown>;
  
  /** Query parameters */
  queryParams?: Record<string, string>;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Additional context data */
  metadata?: Record<string, unknown>;
}

/**
 * Result from protocol execution
 */
export interface ProtocolExecutionResult {
  /** Whether execution succeeded */
  success: boolean;
  
  /** HTTP status code */
  statusCode: number;
  
  /** Response headers */
  headers: Record<string, string>;
  
  /** Response body (parsed if JSON) */
  body: unknown;
  
  /** Raw response body */
  rawBody: string;
  
  /** Execution duration in ms */
  durationMs: number;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Error code */
  errorCode?: string;
  
  /** Whether credentials were refreshed during execution */
  credentialsRefreshed: boolean;
  
  /** Updated credentials (if refreshed) */
  updatedCredentials?: Partial<AuthenticationCredentials>;
  
  /** Retry information */
  retry?: {
    attempted: boolean;
    count: number;
    reason?: string;
  };
}

/**
 * Token refresh result
 */
export interface ProtocolTokenRefreshResult {
  /** Whether refresh succeeded */
  success: boolean;
  
  /** New access token */
  accessToken?: string;
  
  /** New refresh token (if rotated) */
  refreshToken?: string;
  
  /** Token expiration (Unix timestamp) */
  expiresAt?: number;
  
  /** Token type */
  tokenType?: string;
  
  /** New scopes (if changed) */
  scopes?: string[];
  
  /** Error message */
  error?: string;
  
  /** Whether to retry with user re-authentication */
  requiresReauth?: boolean;
}

/**
 * Health check result
 */
export interface ProtocolHealthCheckResult {
  /** Whether the protocol is healthy */
  healthy: boolean;
  
  /** Status message */
  message: string;
  
  /** Latency in ms */
  latencyMs: number;
  
  /** Token status */
  tokenStatus: 'valid' | 'expired' | 'missing' | 'invalid';
  
  /** Seconds until token expires (-1 if no expiration) */
  tokenExpiresIn: number;
  
  /** Whether refresh is available */
  canRefresh: boolean;
  
  /** Last successful request timestamp */
  lastSuccessfulRequest?: string;
  
  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Protocol module metadata
 */
export interface ProtocolModuleMetadata {
  /** Protocol type identifier */
  type: string;
  
  /** Display name */
  displayName: string;
  
  /** Short description */
  description: string;
  
  /** Module version */
  version: string;
  
  /** Module author */
  author: string;
  
  /** Documentation URL */
  documentationUrl?: string;
  
  /** Icon name (Lucide) */
  icon: string;
  
  /** Protocol capabilities */
  capabilities: ProtocolCapabilities;
  
  /** Common use cases */
  useCases: string[];
  
  /** Example platforms using this protocol */
  examplePlatforms: string[];
}

/**
 * Protocol Handshake Module Interface
 * 
 * This is the core contract that all protocol modules must implement.
 * Each protocol (OAuth2, API Key, etc.) has its own implementation
 * that handles the specifics of that authentication method.
 * 
 * @example
 * ```ts
 * class OAuth2ProtocolModule implements ProtocolHandshakeModule {
 *   getMetadata() {
 *     return {
 *       type: 'oauth2',
 *       displayName: 'OAuth 2.0',
 *       // ...
 *     };
 *   }
 *   
 *   async authenticate(credentials) {
 *     // Start OAuth flow
 *     return { step: 1, type: 'redirect', ... };
 *   }
 *   
 *   // ...
 * }
 * ```
 */
export interface ProtocolHandshakeModule {
  // ============================================
  // METADATA & CONFIGURATION
  // ============================================
  
  /**
   * Get module metadata
   */
  getMetadata(): ProtocolModuleMetadata;
  
  /**
   * Get module capabilities
   */
  getCapabilities(): ProtocolCapabilities;
  
  /**
   * Get current module status
   */
  getStatus(): ProtocolModuleStatus;
  
  /**
   * Get required configuration fields
   */
  getRequiredFields(): ProtocolFieldDefinition[];
  
  /**
   * Get optional configuration fields
   */
  getOptionalFields(): ProtocolFieldDefinition[];
  
  /**
   * Get all fields (required + optional)
   */
  getAllFields(): ProtocolFieldDefinition[];
  
  /**
   * Get field groups for UI organization
   */
  getFieldGroups(): Array<{
    id: string;
    label: string;
    description?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
  }>;

  // ============================================
  // VALIDATION
  // ============================================
  
  /**
   * Validate credentials configuration
   */
  validateCredentials(credentials: Partial<AuthenticationCredentials>): ProtocolValidationResult;
  
  /**
   * Validate a specific field value
   */
  validateField(fieldId: string, value: unknown): { valid: boolean; error?: string };
  
  /**
   * Check if credentials are complete for authentication
   */
  isConfigurationComplete(credentials: Partial<AuthenticationCredentials>): boolean;

  // ============================================
  // AUTHENTICATION FLOW
  // ============================================
  
  /**
   * Start or continue the authentication flow
   * 
   * For multi-step flows (like OAuth), this returns the next step.
   * For simple flows (like API Key), this completes immediately.
   */
  authenticate(
    credentials: Partial<AuthenticationCredentials>,
    currentStep?: number
  ): Promise<ProtocolAuthenticationFlow>;
  
  /**
   * Handle authentication callback (for redirect-based flows)
   */
  handleCallback(
    callbackParams: Record<string, string>,
    state?: string
  ): Promise<ProtocolAuthenticationFlow>;
  
  /**
   * Exchange authorization code for tokens (OAuth flows)
   */
  exchangeCodeForTokens?(
    code: string,
    codeVerifier?: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType?: string;
    scopes?: string[];
  }>;

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================
  
  /**
   * Refresh expired tokens
   */
  refreshTokens(credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult>;
  
  /**
   * Revoke tokens (logout)
   */
  revokeTokens(credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }>;
  
  /**
   * Check if tokens are expired
   */
  isTokenExpired(credentials: AuthenticationCredentials): boolean;
  
  /**
   * Get token expiration time
   */
  getTokenExpirationTime(credentials: AuthenticationCredentials): Date | null;

  // ============================================
  // REQUEST EXECUTION
  // ============================================
  
  /**
   * Inject authentication into request
   * 
   * Returns modified headers, query params, and body with auth injected.
   */
  injectAuthentication(
    context: ProtocolExecutionContext
  ): Promise<{
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body?: string | Record<string, unknown>;
  }>;
  
  /**
   * Execute an authenticated request
   */
  executeRequest(context: ProtocolExecutionContext): Promise<ProtocolExecutionResult>;
  
  /**
   * Handle request error (e.g., auto-refresh on 401)
   */
  handleRequestError(
    error: Error,
    context: ProtocolExecutionContext
  ): Promise<{
    retry: boolean;
    updatedContext?: ProtocolExecutionContext;
    error?: string;
  }>;

  // ============================================
  // HEALTH & MONITORING
  // ============================================
  
  /**
   * Perform health check
   */
  healthCheck(credentials: AuthenticationCredentials): Promise<ProtocolHealthCheckResult>;
  
  /**
   * Get diagnostic information
   */
  getDiagnostics(credentials: AuthenticationCredentials): Promise<Record<string, unknown>>;

  // ============================================
  // SERIALIZATION
  // ============================================
  
  /**
   * Serialize credentials for storage (with sensitive data handling)
   */
  serializeCredentials(credentials: AuthenticationCredentials): string;
  
  /**
   * Deserialize credentials from storage
   */
  deserializeCredentials(serialized: string): AuthenticationCredentials;
  
  /**
   * Get credentials for display (sensitive data masked)
   */
  getMaskedCredentials(credentials: AuthenticationCredentials): Record<string, unknown>;
}

// ============================================
// BASE PROTOCOL MODULE IMPLEMENTATION
// ============================================

/**
 * Base class for protocol modules
 * 
 * Provides default implementations for common functionality.
 * Protocol-specific modules should extend this class.
 */
export abstract class BaseProtocolModule implements ProtocolHandshakeModule {
  protected status: ProtocolModuleStatus = 'uninitialized';

  // Abstract methods that must be implemented
  abstract getMetadata(): ProtocolModuleMetadata;
  abstract getRequiredFields(): ProtocolFieldDefinition[];
  abstract authenticate(
    credentials: Partial<AuthenticationCredentials>,
    currentStep?: number
  ): Promise<ProtocolAuthenticationFlow>;
  abstract injectAuthentication(
    context: ProtocolExecutionContext
  ): Promise<{
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body?: string | Record<string, unknown>;
  }>;

  // Default implementations
  
  getCapabilities(): ProtocolCapabilities {
    return this.getMetadata().capabilities;
  }

  getStatus(): ProtocolModuleStatus {
    return this.status;
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [];
  }

  getAllFields(): ProtocolFieldDefinition[] {
    return [...this.getRequiredFields(), ...this.getOptionalFields()];
  }

  getFieldGroups(): Array<{
    id: string;
    label: string;
    description?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
  }> {
    return [
      {
        id: 'required',
        label: 'Required Settings',
        description: 'These fields must be configured for authentication to work.',
      },
      {
        id: 'optional',
        label: 'Optional Settings',
        collapsible: true,
        defaultCollapsed: true,
      },
    ];
  }

  validateCredentials(credentials: Partial<AuthenticationCredentials>): ProtocolValidationResult {
    const fieldErrors: Record<string, string> = {};
    const generalErrors: string[] = [];
    const warnings: string[] = [];

    for (const field of this.getRequiredFields()) {
      const value = (credentials as Record<string, unknown>)[field.id];
      
      if (field.required && (value === undefined || value === null || value === '')) {
        fieldErrors[field.id] = `${field.label} is required`;
        continue;
      }

      if (value && field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(String(value))) {
          fieldErrors[field.id] = field.patternError || `${field.label} is invalid`;
        }
      }

      if (value && field.min !== undefined) {
        if (typeof value === 'string' && value.length < field.min) {
          fieldErrors[field.id] = `${field.label} must be at least ${field.min} characters`;
        } else if (typeof value === 'number' && value < field.min) {
          fieldErrors[field.id] = `${field.label} must be at least ${field.min}`;
        }
      }

      if (value && field.max !== undefined) {
        if (typeof value === 'string' && value.length > field.max) {
          fieldErrors[field.id] = `${field.label} must be at most ${field.max} characters`;
        } else if (typeof value === 'number' && value > field.max) {
          fieldErrors[field.id] = `${field.label} must be at most ${field.max}`;
        }
      }
    }

    return {
      valid: Object.keys(fieldErrors).length === 0 && generalErrors.length === 0,
      fieldErrors,
      generalErrors,
      warnings,
    };
  }

  validateField(fieldId: string, value: unknown): { valid: boolean; error?: string } {
    const field = this.getAllFields().find((f) => f.id === fieldId);
    if (!field) {
      return { valid: true };
    }

    if (field.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `${field.label} is required` };
    }

    if (value && field.pattern) {
      const regex = new RegExp(field.pattern);
      if (!regex.test(String(value))) {
        return { valid: false, error: field.patternError || 'Invalid format' };
      }
    }

    return { valid: true };
  }

  isConfigurationComplete(credentials: Partial<AuthenticationCredentials>): boolean {
    const validation = this.validateCredentials(credentials);
    return validation.valid;
  }

  async handleCallback(
    _callbackParams: Record<string, string>,
    _state?: string
  ): Promise<ProtocolAuthenticationFlow> {
    // Default: no callback handling needed
    return {
      step: 1,
      totalSteps: 1,
      type: 'complete',
      title: 'Authentication Complete',
      description: 'No callback handling required for this protocol.',
    };
  }

  async refreshTokens(_credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    // Default: refresh not supported
    return {
      success: false,
      error: 'Token refresh not supported by this protocol',
    };
  }

  async revokeTokens(_credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }> {
    // Default: revocation not supported
    return {
      success: false,
      error: 'Token revocation not supported by this protocol',
    };
  }

  isTokenExpired(_credentials: AuthenticationCredentials): boolean {
    // Default: tokens don't expire
    return false;
  }

  getTokenExpirationTime(_credentials: AuthenticationCredentials): Date | null {
    // Default: no expiration
    return null;
  }

  async executeRequest(context: ProtocolExecutionContext): Promise<ProtocolExecutionResult> {
    const startTime = performance.now();

    try {
      // Inject authentication
      const authInjection = await this.injectAuthentication(context);
      
      // Merge headers
      const headers = {
        ...context.headers,
        ...authInjection.headers,
      };

      // Merge query params
      const queryParams = {
        ...context.queryParams,
        ...authInjection.queryParams,
      };

      // Build URL with query params
      const url = new URL(context.url);
      for (const [key, value] of Object.entries(queryParams)) {
        url.searchParams.set(key, value);
      }

      // Determine body
      const body = authInjection.body || context.body;
      const bodyString = typeof body === 'object' ? JSON.stringify(body) : body;

      // Execute request
      const response = await fetch(url.toString(), {
        method: context.method,
        headers,
        body: context.method !== 'GET' && context.method !== 'HEAD' ? bodyString : undefined,
        signal: context.timeout ? AbortSignal.timeout(context.timeout) : undefined,
      });

      const rawBody = await response.text();
      let parsedBody: unknown = rawBody;

      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        // Not JSON, keep as string
      }

      const durationMs = performance.now() - startTime;

      return {
        success: response.ok,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody,
        rawBody,
        durationMs,
        credentialsRefreshed: false,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      const durationMs = performance.now() - startTime;
      
      return {
        success: false,
        statusCode: 0,
        headers: {},
        body: null,
        rawBody: '',
        durationMs,
        credentialsRefreshed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: error instanceof Error ? error.name : 'UNKNOWN',
      };
    }
  }

  async handleRequestError(
    error: Error,
    _context: ProtocolExecutionContext
  ): Promise<{
    retry: boolean;
    updatedContext?: ProtocolExecutionContext;
    error?: string;
  }> {
    // Default: no retry
    return {
      retry: false,
      error: error.message,
    };
  }

  async healthCheck(credentials: AuthenticationCredentials): Promise<ProtocolHealthCheckResult> {
    const isExpired = this.isTokenExpired(credentials);
    const expirationTime = this.getTokenExpirationTime(credentials);
    const capabilities = this.getCapabilities();

    return {
      healthy: !isExpired,
      message: isExpired ? 'Token expired' : 'Credentials valid',
      latencyMs: 0,
      tokenStatus: isExpired ? 'expired' : 'valid',
      tokenExpiresIn: expirationTime 
        ? Math.floor((expirationTime.getTime() - Date.now()) / 1000)
        : -1,
      canRefresh: capabilities.supportsTokenRefresh,
    };
  }

  async getDiagnostics(credentials: AuthenticationCredentials): Promise<Record<string, unknown>> {
    const metadata = this.getMetadata();
    const healthCheck = await this.healthCheck(credentials);

    return {
      protocol: metadata.type,
      version: metadata.version,
      status: this.status,
      healthCheck,
      capabilities: this.getCapabilities(),
      configuredFields: Object.keys(credentials),
    };
  }

  serializeCredentials(credentials: AuthenticationCredentials): string {
    return JSON.stringify(credentials);
  }

  deserializeCredentials(serialized: string): AuthenticationCredentials {
    return JSON.parse(serialized);
  }

  getMaskedCredentials(credentials: AuthenticationCredentials): Record<string, unknown> {
    const masked: Record<string, unknown> = {};
    const sensitiveFields = this.getAllFields()
      .filter((f) => f.sensitive || f.type === 'password' || f.type === 'secret')
      .map((f) => f.id);

    for (const [key, value] of Object.entries(credentials)) {
      if (sensitiveFields.includes(key) && typeof value === 'string') {
        masked[key] = value.length > 8 
          ? `${value.substring(0, 4)}${'*'.repeat(value.length - 8)}${value.substring(value.length - 4)}`
          : '*'.repeat(value.length);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }
}
