// ============================================
// PROTOCOL OS - CURL DEFAULT HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.1.a
// Purpose: Core execution engine for cURL command templates
// ============================================

import {
  BaseProtocolModule,
  type ProtocolModuleMetadata,
  type ProtocolCapabilities,
  type ProtocolFieldDefinition,
  type ProtocolAuthenticationFlow,
  type ProtocolExecutionContext,
  type ProtocolExecutionResult,
  type ProtocolHealthCheckResult,
} from '../1.3.b_fileProtocolHandshakeModuleInterface';
import type { AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import { parseCurlCommand, type ParsedCurlCommand } from '@utilities/1.4.a_fileCurlCommandParser';
import { substitutePlaceholders } from '@utilities/1.4.e_fileInputPlaceholderSubstitution';
import { sanitizeSensitiveFields } from '@utilities/1.4.f_fileSensitiveFieldSanitizer';

/**
 * cURL execution options
 */
export interface CurlExecutionOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Follow redirects */
  followRedirects?: boolean;
  
  /** Maximum redirects to follow */
  maxRedirects?: number;
  
  /** Retry on failure */
  retryOnFailure?: boolean;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Retry delay in milliseconds */
  retryDelay?: number;
  
  /** Validate SSL certificates */
  validateSsl?: boolean;
  
  /** Custom CA certificate */
  caCertificate?: string;
  
  /** Client certificate */
  clientCertificate?: string;
  
  /** Client key */
  clientKey?: string;
  
  /** Proxy URL */
  proxyUrl?: string;
  
  /** User agent override */
  userAgent?: string;
  
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * cURL execution result with detailed metrics
 */
export interface CurlExecutionMetrics {
  /** DNS lookup time in ms */
  dnsLookupMs: number;
  
  /** TCP connection time in ms */
  tcpConnectMs: number;
  
  /** TLS handshake time in ms */
  tlsHandshakeMs: number;
  
  /** Time to first byte in ms */
  timeToFirstByteMs: number;
  
  /** Total transfer time in ms */
  totalTimeMs: number;
  
  /** Response size in bytes */
  responseSizeBytes: number;
  
  /** Request size in bytes */
  requestSizeBytes: number;
  
  /** Number of redirects followed */
  redirectCount: number;
  
  /** Final URL (after redirects) */
  finalUrl: string;
  
  /** IP address connected to */
  remoteIp?: string;
  
  /** HTTP version used */
  httpVersion: string;
}

/**
 * cURL Default Protocol Module
 * 
 * The foundational protocol for executing raw cURL commands.
 * Supports all standard cURL options and provides a flexible
 * template system for dynamic value injection.
 * 
 * This is the "universal adapter" - any API can be accessed
 * by providing its cURL command template.
 */
export class CurlDefaultHandshakeExecutor extends BaseProtocolModule {
  private options: CurlExecutionOptions = {};
  private lastParsedCommand: ParsedCurlCommand | null = null;

  constructor(options: CurlExecutionOptions = {}) {
    super();
    this.options = {
      timeout: 30000,
      followRedirects: true,
      maxRedirects: 5,
      retryOnFailure: true,
      maxRetries: 3,
      retryDelay: 1000,
      validateSsl: true,
      verbose: false,
      ...options,
    };
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'curl-default',
      displayName: 'cURL Command',
      description: 'Execute any API request using a cURL command template with dynamic placeholder substitution.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/curl-default',
      icon: 'terminal',
      capabilities: this.getCapabilities(),
      useCases: [
        'Universal API access',
        'Quick API testing',
        'Legacy API integration',
        'Custom authentication schemes',
        'Webhook endpoints',
      ],
      examplePlatforms: [
        'Any REST API',
        'GraphQL endpoints',
        'SOAP services',
        'Custom internal APIs',
      ],
    };
  }

  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRedirectFlow: false,
      supportsTokenRefresh: false,
      supportsTokenRevocation: false,
      supportsScopes: false,
      supportsIncrementalAuth: false,
      supportsOfflineAccess: false,
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
        id: 'curlCommand',
        label: 'cURL Command Template',
        type: 'textarea',
        required: true,
        description: 'Paste your cURL command here. Use {{placeholder}} syntax for dynamic values.',
        placeholder: `curl -X POST 'https://api.example.com/v1/endpoint' \\
  -H 'Authorization: Bearer {{access_token}}' \\
  -H 'Content-Type: application/json' \\
  -d '{"key": "{{value}}"}'`,
        group: 'command',
        order: 1,
      },
    ];
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'baseUrl',
        label: 'Base URL Override',
        type: 'url',
        required: false,
        description: 'Override the URL in the cURL command. Useful for environment switching.',
        placeholder: 'https://api.example.com',
        group: 'overrides',
        order: 1,
      },
      {
        id: 'defaultHeaders',
        label: 'Default Headers',
        type: 'headers',
        required: false,
        description: 'Headers to include with every request (merged with command headers).',
        group: 'overrides',
        order: 2,
      },
      {
        id: 'placeholderValues',
        label: 'Placeholder Values',
        type: 'json',
        required: false,
        description: 'JSON object with values for {{placeholders}} in the command template.',
        placeholder: '{\n  "access_token": "your-token-here",\n  "value": "example"\n}',
        group: 'placeholders',
        order: 1,
      },
      {
        id: 'timeout',
        label: 'Timeout (ms)',
        type: 'number',
        required: false,
        description: 'Request timeout in milliseconds.',
        defaultValue: 30000,
        min: 1000,
        max: 300000,
        group: 'advanced',
        order: 1,
      },
      {
        id: 'followRedirects',
        label: 'Follow Redirects',
        type: 'checkbox',
        required: false,
        description: 'Automatically follow HTTP redirects.',
        defaultValue: true,
        group: 'advanced',
        order: 2,
      },
      {
        id: 'maxRedirects',
        label: 'Max Redirects',
        type: 'number',
        required: false,
        description: 'Maximum number of redirects to follow.',
        defaultValue: 5,
        min: 0,
        max: 20,
        showWhen: { field: 'followRedirects', value: true },
        group: 'advanced',
        order: 3,
      },
      {
        id: 'validateSsl',
        label: 'Validate SSL',
        type: 'checkbox',
        required: false,
        description: 'Validate SSL certificates. Disable for self-signed certs (not recommended for production).',
        defaultValue: true,
        group: 'advanced',
        order: 4,
      },
      {
        id: 'retryOnFailure',
        label: 'Retry on Failure',
        type: 'checkbox',
        required: false,
        description: 'Automatically retry failed requests.',
        defaultValue: true,
        group: 'retry',
        order: 1,
      },
      {
        id: 'maxRetries',
        label: 'Max Retries',
        type: 'number',
        required: false,
        description: 'Maximum retry attempts.',
        defaultValue: 3,
        min: 0,
        max: 10,
        showWhen: { field: 'retryOnFailure', value: true },
        group: 'retry',
        order: 2,
      },
      {
        id: 'retryDelay',
        label: 'Retry Delay (ms)',
        type: 'number',
        required: false,
        description: 'Delay between retry attempts in milliseconds.',
        defaultValue: 1000,
        min: 100,
        max: 30000,
        showWhen: { field: 'retryOnFailure', value: true },
        group: 'retry',
        order: 3,
      },
      {
        id: 'proxyUrl',
        label: 'Proxy URL',
        type: 'url',
        required: false,
        description: 'HTTP/HTTPS proxy URL.',
        placeholder: 'http://proxy.example.com:8080',
        group: 'proxy',
        order: 1,
      },
      {
        id: 'userAgent',
        label: 'User Agent',
        type: 'text',
        required: false,
        description: 'Custom User-Agent header.',
        placeholder: 'Protocol-OS/1.0',
        group: 'advanced',
        order: 5,
      },
    ];
  }

  getFieldGroups() {
    return [
      {
        id: 'command',
        label: 'cURL Command',
        description: 'The cURL command template to execute.',
      },
      {
        id: 'placeholders',
        label: 'Placeholder Values',
        description: 'Values to substitute into {{placeholders}} in the command.',
        collapsible: true,
        defaultCollapsed: false,
      },
      {
        id: 'overrides',
        label: 'Overrides',
        description: 'Override specific parts of the cURL command.',
        collapsible: true,
        defaultCollapsed: true,
      },
      {
        id: 'advanced',
        label: 'Advanced Options',
        description: 'Fine-tune request behavior.',
        collapsible: true,
        defaultCollapsed: true,
      },
      {
        id: 'retry',
        label: 'Retry Configuration',
        description: 'Configure automatic retry behavior.',
        collapsible: true,
        defaultCollapsed: true,
      },
      {
        id: 'proxy',
        label: 'Proxy Settings',
        description: 'Configure HTTP proxy.',
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
    // cURL default protocol doesn't have a multi-step auth flow
    // It's configured by providing the command template
    
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

    // Parse the cURL command to validate it
    try {
      const curlCommand = credentials.curlCommand as string;
      const parsed = parseCurlCommand(curlCommand);
      this.lastParsedCommand = parsed;
      this.status = 'configured';

      return {
        step: 1,
        totalSteps: 1,
        type: 'complete',
        title: 'Configuration Complete',
        description: `cURL command configured for ${parsed.method} ${parsed.url}`,
        data: {
          method: parsed.method,
          url: parsed.url,
          headerCount: Object.keys(parsed.headers).length,
          hasBody: !!parsed.body,
        },
      };
    } catch (error) {
      return {
        step: 1,
        totalSteps: 1,
        type: 'error',
        title: 'Invalid cURL Command',
        description: 'Failed to parse the cURL command.',
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  // ============================================
  // EXECUTION
  // ============================================

  async injectAuthentication(
    context: ProtocolExecutionContext
  ): Promise<{
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body?: string | Record<string, unknown>;
  }> {
    // For cURL default, the authentication is embedded in the command template
    // We substitute placeholders and return the result
    
    const credentials = context.credentials;
    const placeholderValues = (credentials.placeholderValues as Record<string, string>) || {};
    const defaultHeaders = (credentials.defaultHeaders as Record<string, string>) || {};

    // Merge default headers
    const headers: Record<string, string> = {
      ...defaultHeaders,
    };

    // Add user agent if specified
    if (credentials.userAgent) {
      headers['User-Agent'] = credentials.userAgent as string;
    }

    return {
      headers,
      queryParams: {},
    };
  }

  async executeRequest(context: ProtocolExecutionContext): Promise<ProtocolExecutionResult> {
    const startTime = performance.now();
    const credentials = context.credentials;
    
    // Get the cURL command
    const curlCommand = credentials.curlCommand as string;
    if (!curlCommand) {
      return {
        success: false,
        statusCode: 0,
        headers: {},
        body: null,
        rawBody: '',
        durationMs: performance.now() - startTime,
        credentialsRefreshed: false,
        error: 'No cURL command configured',
        errorCode: 'NO_COMMAND',
      };
    }

    // Parse the command
    let parsed: ParsedCurlCommand;
    try {
      parsed = parseCurlCommand(curlCommand);
    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        headers: {},
        body: null,
        rawBody: '',
        durationMs: performance.now() - startTime,
        credentialsRefreshed: false,
        error: `Failed to parse cURL command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errorCode: 'PARSE_ERROR',
      };
    }

    // Substitute placeholders
    const placeholderValues = (credentials.placeholderValues as Record<string, string>) || {};
    
    // Substitute in URL
    let url = substitutePlaceholders(parsed.url, placeholderValues);
    
    // Apply base URL override if provided
    if (credentials.baseUrl) {
      try {
        const baseUrl = new URL(credentials.baseUrl as string);
        const originalUrl = new URL(url);
        url = new URL(originalUrl.pathname + originalUrl.search, baseUrl).toString();
      } catch {
        // Keep original URL if override fails
      }
    }

    // Substitute in headers
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.headers)) {
      headers[substitutePlaceholders(key, placeholderValues)] = 
        substitutePlaceholders(value, placeholderValues);
    }

    // Merge with default headers
    const defaultHeaders = (credentials.defaultHeaders as Record<string, string>) || {};
    for (const [key, value] of Object.entries(defaultHeaders)) {
      if (!headers[key]) {
        headers[key] = substitutePlaceholders(value, placeholderValues);
      }
    }

    // Add user agent if not present
    if (!headers['User-Agent'] && credentials.userAgent) {
      headers['User-Agent'] = credentials.userAgent as string;
    }

    // Substitute in body
    let body: string | undefined;
    if (parsed.body) {
      body = substitutePlaceholders(parsed.body, placeholderValues);
    }

    // Get timeout
    const timeout = (credentials.timeout as number) || this.options.timeout || 30000;

    // Execute with retry logic
    const maxRetries = credentials.retryOnFailure !== false 
      ? ((credentials.maxRetries as number) || this.options.maxRetries || 3)
      : 0;
    const retryDelay = (credentials.retryDelay as number) || this.options.retryDelay || 1000;

    let lastError: Error | null = null;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: parsed.method,
          headers,
          body: parsed.method !== 'GET' && parsed.method !== 'HEAD' ? body : undefined,
          signal: controller.signal,
          redirect: credentials.followRedirects !== false ? 'follow' : 'manual',
        });

        clearTimeout(timeoutId);

        const rawBody = await response.text();
        let parsedBody: unknown = rawBody;

        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          // Not JSON
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
          retry: retryCount > 0 ? { attempted: true, count: retryCount } : undefined,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if we should retry
        if (retryCount < maxRetries) {
          const isRetryable = 
            lastError.name === 'AbortError' ||
            lastError.message.includes('network') ||
            lastError.message.includes('timeout') ||
            lastError.message.includes('ECONNREFUSED');

          if (isRetryable) {
            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, retryDelay * retryCount));
            continue;
          }
        }
        break;
      }
    }

    return {
      success: false,
      statusCode: 0,
      headers: {},
      body: null,
      rawBody: '',
      durationMs: performance.now() - startTime,
      credentialsRefreshed: false,
      error: lastError?.message || 'Request failed',
      errorCode: lastError?.name || 'UNKNOWN',
      retry: retryCount > 0 ? { attempted: true, count: retryCount, reason: lastError?.message } : undefined,
    };
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(credentials: AuthenticationCredentials): Promise<ProtocolHealthCheckResult> {
    const curlCommand = credentials.curlCommand as string;
    
    if (!curlCommand) {
      return {
        healthy: false,
        message: 'No cURL command configured',
        latencyMs: 0,
        tokenStatus: 'missing',
        tokenExpiresIn: -1,
        canRefresh: false,
      };
    }

    // Try to parse the command
    try {
      const parsed = parseCurlCommand(curlCommand);
      
      return {
        healthy: true,
        message: `Command configured for ${parsed.method} ${parsed.url}`,
        latencyMs: 0,
        tokenStatus: 'valid',
        tokenExpiresIn: -1,
        canRefresh: false,
        details: {
          method: parsed.method,
          url: parsed.url,
          headerCount: Object.keys(parsed.headers).length,
          hasBody: !!parsed.body,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Invalid cURL command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latencyMs: 0,
        tokenStatus: 'invalid',
        tokenExpiresIn: -1,
        canRefresh: false,
      };
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Extract placeholders from a cURL command
   */
  extractPlaceholders(curlCommand: string): string[] {
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders: string[] = [];
    let match;

    while ((match = placeholderRegex.exec(curlCommand)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }

    return placeholders;
  }

  /**
   * Generate a preview of the command with placeholders highlighted
   */
  generateCommandPreview(
    curlCommand: string,
    placeholderValues: Record<string, string>
  ): {
    preview: string;
    missingPlaceholders: string[];
    substitutedPlaceholders: string[];
  } {
    const allPlaceholders = this.extractPlaceholders(curlCommand);
    const missingPlaceholders: string[] = [];
    const substitutedPlaceholders: string[] = [];

    let preview = curlCommand;

    for (const placeholder of allPlaceholders) {
      if (placeholderValues[placeholder] !== undefined) {
        substitutedPlaceholders.push(placeholder);
        preview = preview.replace(
          new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'),
          placeholderValues[placeholder]
        );
      } else {
        missingPlaceholders.push(placeholder);
      }
    }

    return {
      preview,
      missingPlaceholders,
      substitutedPlaceholders,
    };
  }

  /**
   * Sanitize credentials for logging (mask sensitive values)
   */
  getSanitizedCredentials(credentials: AuthenticationCredentials): Record<string, unknown> {
    const sanitized = { ...credentials };
    
    // Mask placeholder values that look sensitive
    if (sanitized.placeholderValues) {
      sanitized.placeholderValues = sanitizeSensitiveFields(
        sanitized.placeholderValues as Record<string, unknown>
      );
    }

    // Mask the cURL command (may contain secrets)
    if (sanitized.curlCommand) {
      const cmd = sanitized.curlCommand as string;
      // Mask anything that looks like a token or key
      sanitized.curlCommand = cmd
        .replace(/(Bearer\s+)[^\s'"]+/gi, '$1***MASKED***')
        .replace(/(Authorization:\s*)[^\s'"]+/gi, '$1***MASKED***')
        .replace(/(['"]\s*[A-Za-z0-9_-]*(?:key|token|secret|password|auth)[A-Za-z0-9_-]*\s*['"]\s*:\s*['"]).+?(['"])/gi, '$1***MASKED***$2');
    }

    return sanitized;
  }
}

// Export default instance
export default CurlDefaultHandshakeExecutor;
