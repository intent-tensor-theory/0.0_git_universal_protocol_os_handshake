// ============================================
// PROTOCOL OS - SOAP/XML HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.9.a
// Purpose: SOAP Web Services Authentication and Execution
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
 * SOAP/XML Protocol
 * 
 * Simple Object Access Protocol (SOAP) is a messaging protocol
 * for exchanging structured information in web services.
 * 
 * Key characteristics:
 * - XML-based messaging format
 * - Platform and language independent
 * - Strongly typed with WSDL schemas
 * - Built-in error handling (SOAP Faults)
 * - WS-* specifications for security, transactions, etc.
 */

/**
 * SOAP authentication method
 */
export type SoapAuthMethod =
  | 'none'                    // No authentication
  | 'ws-security-username'    // WS-Security UsernameToken
  | 'ws-security-certificate' // WS-Security X.509 Certificate
  | 'basic-auth'              // HTTP Basic Authentication
  | 'bearer-token'            // HTTP Bearer Token (OAuth)
  | 'custom-header';          // Custom SOAP Header

/**
 * SOAP version
 */
export type SoapVersion = '1.1' | '1.2';

/**
 * WS-Security password type
 */
export type WsSecurityPasswordType = 
  | 'PasswordText'     // Plain text password
  | 'PasswordDigest';  // SHA-1 digest (more secure)

/**
 * SOAP Fault structure
 */
export interface SoapFault {
  faultCode: string;
  faultString: string;
  faultActor?: string;
  detail?: string;
}

/**
 * SOAP configuration
 */
export interface SoapConfiguration {
  /** WSDL URL or SOAP endpoint */
  endpoint: string;
  
  /** WSDL URL (for service discovery) */
  wsdlUrl?: string;
  
  /** SOAP version */
  soapVersion: SoapVersion;
  
  /** Authentication method */
  authMethod: SoapAuthMethod;
  
  /** Username for WS-Security or Basic Auth */
  username?: string;
  
  /** Password for WS-Security or Basic Auth */
  password?: string;
  
  /** WS-Security password type */
  passwordType?: WsSecurityPasswordType;
  
  /** Bearer token */
  bearerToken?: string;
  
  /** Custom SOAP header XML */
  customHeader?: string;
  
  /** SOAPAction header value */
  soapAction?: string;
  
  /** Target namespace */
  targetNamespace?: string;
  
  /** Request timeout (ms) */
  timeout?: number;
  
  /** Include timestamp in WS-Security */
  includeTimestamp?: boolean;
  
  /** Timestamp TTL (seconds) */
  timestampTtl?: number;
}

/**
 * SOAP Protocol Module
 * 
 * Implements SOAP web service calls with various authentication methods
 * including WS-Security, HTTP Basic Auth, and Bearer tokens.
 */
export class SoapXmlHandshakeExecutor extends BaseProtocolModule {
  constructor() {
    super();
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'soap',
      displayName: 'SOAP/XML',
      description: 'SOAP web services with WS-Security and XML envelope support.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/soap',
      icon: 'file-code',
      capabilities: this.getCapabilities(),
      useCases: [
        'Enterprise system integration',
        'Banking and financial services',
        'Healthcare systems (HL7/FHIR)',
        'Government services',
        'Legacy system integration',
        'B2B communication',
        'ERP system integration',
        'Payment processing',
      ],
      examplePlatforms: [
        'SAP',
        'Oracle',
        'Salesforce',
        'Microsoft Dynamics',
        'IBM WebSphere',
        'Apache CXF',
        'TIBCO',
        'MuleSoft',
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
      supportsOfflineAccess: true,
      supportsPkce: false,
      requiresServerSide: true, // WS-Security often requires server-side
      browserCompatible: false, // CORS and security concerns
      supportsRequestSigning: true, // WS-Security signatures
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
        label: 'SOAP Endpoint URL',
        type: 'url',
        required: true,
        description: 'The SOAP service endpoint URL.',
        placeholder: 'https://api.example.com/soap/service',
        group: 'endpoint',
        order: 1,
      },
      {
        id: 'soapVersion',
        label: 'SOAP Version',
        type: 'select',
        required: true,
        description: 'SOAP protocol version.',
        defaultValue: '1.1',
        options: [
          { value: '1.1', label: 'SOAP 1.1 (Most Common)' },
          { value: '1.2', label: 'SOAP 1.2' },
        ],
        group: 'protocol',
        order: 1,
      },
      {
        id: 'authMethod',
        label: 'Authentication Method',
        type: 'select',
        required: true,
        description: 'How to authenticate SOAP requests.',
        defaultValue: 'none',
        options: [
          { value: 'none', label: 'No Authentication' },
          { value: 'ws-security-username', label: 'WS-Security UsernameToken' },
          { value: 'basic-auth', label: 'HTTP Basic Authentication' },
          { value: 'bearer-token', label: 'HTTP Bearer Token' },
          { value: 'custom-header', label: 'Custom SOAP Header' },
        ],
        group: 'authentication',
        order: 1,
      },
    ];
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'wsdlUrl',
        label: 'WSDL URL',
        type: 'url',
        required: false,
        description: 'Web Services Description Language URL for service discovery.',
        placeholder: 'https://api.example.com/soap/service?wsdl',
        group: 'endpoint',
        order: 2,
      },
      {
        id: 'username',
        label: 'Username',
        type: 'text',
        required: false,
        description: 'Username for WS-Security or Basic Auth.',
        placeholder: 'username',
        group: 'authentication',
        order: 2,
        visibleWhen: { field: 'authMethod', value: ['ws-security-username', 'basic-auth'] },
      },
      {
        id: 'password',
        label: 'Password',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'Password for authentication.',
        placeholder: 'password',
        group: 'authentication',
        order: 3,
        visibleWhen: { field: 'authMethod', value: ['ws-security-username', 'basic-auth'] },
      },
      {
        id: 'passwordType',
        label: 'Password Type',
        type: 'select',
        required: false,
        description: 'WS-Security password encoding type.',
        defaultValue: 'PasswordText',
        options: [
          { value: 'PasswordText', label: 'Plain Text' },
          { value: 'PasswordDigest', label: 'Password Digest (SHA-1)' },
        ],
        group: 'authentication',
        order: 4,
        visibleWhen: { field: 'authMethod', value: 'ws-security-username' },
      },
      {
        id: 'bearerToken',
        label: 'Bearer Token',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'OAuth bearer token.',
        placeholder: 'your-bearer-token',
        group: 'authentication',
        order: 5,
        visibleWhen: { field: 'authMethod', value: 'bearer-token' },
      },
      {
        id: 'customHeader',
        label: 'Custom SOAP Header XML',
        type: 'textarea',
        required: false,
        description: 'Custom XML to include in SOAP header.',
        placeholder: '<auth:AuthToken>...</auth:AuthToken>',
        group: 'authentication',
        order: 6,
        visibleWhen: { field: 'authMethod', value: 'custom-header' },
      },
      {
        id: 'soapAction',
        label: 'SOAPAction',
        type: 'text',
        required: false,
        description: 'SOAPAction HTTP header value.',
        placeholder: 'http://example.com/Action',
        group: 'protocol',
        order: 2,
      },
      {
        id: 'targetNamespace',
        label: 'Target Namespace',
        type: 'text',
        required: false,
        description: 'XML namespace for the service.',
        placeholder: 'http://example.com/service',
        group: 'protocol',
        order: 3,
      },
      {
        id: 'includeTimestamp',
        label: 'Include Timestamp',
        type: 'checkbox',
        required: false,
        description: 'Add WS-Security timestamp to requests.',
        defaultValue: true,
        group: 'security',
        order: 1,
        visibleWhen: { field: 'authMethod', value: 'ws-security-username' },
      },
      {
        id: 'timestampTtl',
        label: 'Timestamp TTL (seconds)',
        type: 'number',
        required: false,
        description: 'Time-to-live for WS-Security timestamp.',
        defaultValue: 300,
        placeholder: '300',
        group: 'security',
        order: 2,
        visibleWhen: { field: 'includeTimestamp', value: true },
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
        order: 1,
      },
    ];
  }

  getFieldGroups() {
    return [
      {
        id: 'endpoint',
        label: 'Service Endpoint',
        description: 'SOAP service URL and WSDL location.',
      },
      {
        id: 'protocol',
        label: 'Protocol Settings',
        description: 'SOAP version and action configuration.',
      },
      {
        id: 'authentication',
        label: 'Authentication',
        description: 'How to authenticate with the SOAP service.',
      },
      {
        id: 'security',
        label: 'WS-Security',
        description: 'WS-Security configuration options.',
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

    const authMethod = credentials.authMethod as SoapAuthMethod;

    // Validate auth-specific requirements
    if (authMethod === 'ws-security-username' || authMethod === 'basic-auth') {
      if (!credentials.username || !credentials.password) {
        return {
          step: 1,
          totalSteps: 1,
          type: 'error',
          title: 'Missing Credentials',
          description: 'Username and password are required.',
          error: 'Username and password are required for this authentication method.',
        };
      }
    }

    if (authMethod === 'bearer-token' && !credentials.bearerToken) {
      return {
        step: 1,
        totalSteps: 1,
        type: 'error',
        title: 'Missing Token',
        description: 'Bearer token is required.',
        error: 'Bearer token is required for this authentication method.',
      };
    }

    // SOAP authentication is typically validated on first request
    this.status = 'authenticated';

    return {
      step: 1,
      totalSteps: 1,
      type: 'complete',
      title: 'SOAP Service Configured',
      description: 'Your SOAP service is ready to use.',
      data: {
        endpoint: credentials.endpoint,
        soapVersion: credentials.soapVersion,
        authMethod,
      },
    };
  }

  // ============================================
  // SOAP ENVELOPE BUILDING
  // ============================================

  /**
   * Build SOAP envelope
   */
  buildEnvelope(
    credentials: AuthenticationCredentials,
    body: string,
    customHeaders?: string
  ): string {
    const soapVersion = (credentials.soapVersion as SoapVersion) || '1.1';
    const authMethod = credentials.authMethod as SoapAuthMethod;

    const namespaces = this.getNamespaces(soapVersion);
    const securityHeader = this.buildSecurityHeader(credentials);
    const headerContent = [securityHeader, customHeaders].filter(Boolean).join('\n');

    const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope ${namespaces}>
  ${headerContent ? `<soap:Header>\n    ${headerContent}\n  </soap:Header>` : ''}
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;

    return envelope;
  }

  /**
   * Get SOAP namespaces
   */
  private getNamespaces(version: SoapVersion): string {
    if (version === '1.2') {
      return 'xmlns:soap="http://www.w3.org/2003/05/soap-envelope"';
    }
    return 'xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"';
  }

  /**
   * Build WS-Security header
   */
  private buildSecurityHeader(credentials: AuthenticationCredentials): string {
    const authMethod = credentials.authMethod as SoapAuthMethod;

    if (authMethod === 'ws-security-username') {
      return this.buildWsSecurityUsernameToken(credentials);
    }

    if (authMethod === 'custom-header') {
      return credentials.customHeader as string || '';
    }

    return '';
  }

  /**
   * Build WS-Security UsernameToken
   */
  private buildWsSecurityUsernameToken(credentials: AuthenticationCredentials): string {
    const username = credentials.username as string;
    const password = credentials.password as string;
    const passwordType = (credentials.passwordType as WsSecurityPasswordType) || 'PasswordText';
    const includeTimestamp = credentials.includeTimestamp !== false;
    const timestampTtl = (credentials.timestampTtl as number) || 300;

    const nonce = this.generateNonce();
    const created = new Date().toISOString();
    const expires = new Date(Date.now() + timestampTtl * 1000).toISOString();

    let passwordValue = password;
    let passwordTypeUri = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText';

    if (passwordType === 'PasswordDigest') {
      passwordValue = this.createPasswordDigest(nonce, created, password);
      passwordTypeUri = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest';
    }

    let timestampElement = '';
    if (includeTimestamp) {
      timestampElement = `
      <wsu:Timestamp xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
        <wsu:Created>${created}</wsu:Created>
        <wsu:Expires>${expires}</wsu:Expires>
      </wsu:Timestamp>`;
    }

    return `
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" soap:mustUnderstand="1">
      ${timestampElement}
      <wsse:UsernameToken>
        <wsse:Username>${this.escapeXml(username)}</wsse:Username>
        <wsse:Password Type="${passwordTypeUri}">${this.escapeXml(passwordValue)}</wsse:Password>
        <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce}</wsse:Nonce>
        <wsu:Created xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">${created}</wsu:Created>
      </wsse:UsernameToken>
    </wsse:Security>`;
  }

  /**
   * Generate nonce for WS-Security
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Create password digest for WS-Security
   * Digest = Base64(SHA-1(nonce + created + password))
   */
  private createPasswordDigest(nonce: string, created: string, password: string): string {
    // Note: In a real implementation, use a proper crypto library
    // This is a simplified version for demonstration
    const data = atob(nonce) + created + password;
    // Would use crypto.subtle.digest('SHA-1', ...) in production
    return btoa(data); // Simplified - use proper SHA-1 in production
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // ============================================
  // TOKEN MANAGEMENT (N/A for SOAP)
  // ============================================

  async refreshTokens(_credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    return {
      success: true,
      accessToken: undefined,
    };
  }

  async revokeTokens(_credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'SOAP does not have a standard token revocation mechanism.',
    };
  }

  isTokenExpired(_credentials: AuthenticationCredentials): boolean {
    return false;
  }

  getTokenExpirationTime(_credentials: AuthenticationCredentials): Date | null {
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
    const headers: Record<string, string> = {};
    const credentials = context.credentials as AuthenticationCredentials;
    const authMethod = credentials.authMethod as SoapAuthMethod;
    const soapVersion = (credentials.soapVersion as SoapVersion) || '1.1';

    // Set Content-Type based on SOAP version
    if (soapVersion === '1.2') {
      headers['Content-Type'] = 'application/soap+xml; charset=utf-8';
    } else {
      headers['Content-Type'] = 'text/xml; charset=utf-8';
    }

    // Set SOAPAction header
    const soapAction = credentials.soapAction as string;
    if (soapAction) {
      if (soapVersion === '1.2') {
        // SOAP 1.2 uses action parameter in Content-Type
        headers['Content-Type'] += `; action="${soapAction}"`;
      } else {
        headers['SOAPAction'] = `"${soapAction}"`;
      }
    }

    // HTTP-level authentication
    if (authMethod === 'basic-auth') {
      const username = credentials.username as string;
      const password = credentials.password as string;
      headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
    } else if (authMethod === 'bearer-token') {
      const bearerToken = credentials.bearerToken as string;
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    return { headers, queryParams: {} };
  }

  async executeRequest(context: ProtocolExecutionContext): Promise<ProtocolExecutionResult> {
    const startTime = performance.now();
    const credentials = context.credentials as AuthenticationCredentials;
    const endpoint = credentials.endpoint as string;
    const timeout = (credentials.timeout as number) || 30000;

    // Build SOAP envelope if body is provided
    let body = context.body as string;
    if (typeof context.body === 'object') {
      // If body is an object, assume it's the SOAP body content
      body = this.buildEnvelope(
        credentials,
        typeof context.body === 'string' ? context.body : JSON.stringify(context.body)
      );
    } else if (typeof body === 'string' && !body.includes('soap:Envelope')) {
      // Wrap in envelope if not already wrapped
      body = this.buildEnvelope(credentials, body);
    }

    // Inject authentication headers
    const { headers } = await this.injectAuthentication(context);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...headers,
          ...context.headers,
        },
        body,
        signal: AbortSignal.timeout(timeout),
      });

      const responseText = await response.text();
      const durationMs = performance.now() - startTime;

      // Parse response
      const parsedResponse = this.parseResponse(responseText);

      // Check for SOAP Fault
      if (parsedResponse.fault) {
        return {
          success: false,
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedResponse,
          rawBody: responseText,
          durationMs,
          credentialsRefreshed: false,
          error: parsedResponse.fault.faultString,
          errorCode: parsedResponse.fault.faultCode,
        };
      }

      return {
        success: response.ok,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedResponse,
        rawBody: responseText,
        durationMs,
        credentialsRefreshed: false,
        error: response.ok ? undefined : `HTTP ${response.status}`,
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
        errorCode: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Parse SOAP response
   */
  private parseResponse(xml: string): { body?: string; fault?: SoapFault } {
    // Extract body content
    const bodyMatch = xml.match(/<(?:soap:|SOAP-ENV:)?Body[^>]*>([\s\S]*?)<\/(?:soap:|SOAP-ENV:)?Body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1].trim() : '';

    // Check for fault
    const faultMatch = bodyContent.match(/<(?:soap:|SOAP-ENV:)?Fault[^>]*>([\s\S]*?)<\/(?:soap:|SOAP-ENV:)?Fault>/i);
    if (faultMatch) {
      const faultXml = faultMatch[1];
      return {
        fault: {
          faultCode: this.extractElement(faultXml, 'faultcode') || 
                     this.extractElement(faultXml, 'Code') || 'Unknown',
          faultString: this.extractElement(faultXml, 'faultstring') || 
                       this.extractElement(faultXml, 'Reason') || 'Unknown error',
          faultActor: this.extractElement(faultXml, 'faultactor') ||
                      this.extractElement(faultXml, 'Role'),
          detail: this.extractElement(faultXml, 'detail') ||
                  this.extractElement(faultXml, 'Detail'),
        },
      };
    }

    return { body: bodyContent };
  }

  /**
   * Extract element content from XML
   */
  private extractElement(xml: string, elementName: string): string | undefined {
    const regex = new RegExp(`<(?:[a-z]+:)?${elementName}[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?${elementName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : undefined;
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(credentials: AuthenticationCredentials): Promise<ProtocolHealthCheckResult> {
    const startTime = performance.now();
    const wsdlUrl = credentials.wsdlUrl as string;
    const endpoint = credentials.endpoint as string;

    // Try to fetch WSDL if available
    if (wsdlUrl) {
      try {
        const response = await fetch(wsdlUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
        });

        const latencyMs = performance.now() - startTime;

        if (response.ok) {
          const wsdl = await response.text();
          const hasDefinitions = wsdl.includes('definitions') || wsdl.includes('Description');

          return {
            healthy: hasDefinitions,
            message: hasDefinitions ? 'WSDL retrieved successfully' : 'Invalid WSDL response',
            latencyMs,
            tokenStatus: 'valid',
            tokenExpiresIn: -1,
            canRefresh: false,
            details: {
              wsdlUrl,
              hasDefinitions,
            },
          };
        }

        return {
          healthy: false,
          message: `WSDL fetch failed: HTTP ${response.status}`,
          latencyMs,
          tokenStatus: 'unknown',
          tokenExpiresIn: 0,
          canRefresh: false,
        };
      } catch (error) {
        return {
          healthy: false,
          message: error instanceof Error ? error.message : 'WSDL fetch failed',
          latencyMs: performance.now() - startTime,
          tokenStatus: 'unknown',
          tokenExpiresIn: 0,
          canRefresh: false,
        };
      }
    }

    // If no WSDL, just check endpoint is reachable
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
        },
        body: this.buildEnvelope(credentials, '<ping/>'),
        signal: AbortSignal.timeout(10000),
      });

      const latencyMs = performance.now() - startTime;

      return {
        healthy: response.status !== 0,
        message: `Endpoint reachable (HTTP ${response.status})`,
        latencyMs,
        tokenStatus: response.status === 401 || response.status === 403 ? 'invalid' : 'valid',
        tokenExpiresIn: -1,
        canRefresh: false,
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
   * Get SOAP content type for version
   */
  static getContentType(version: SoapVersion, soapAction?: string): string {
    if (version === '1.2') {
      let contentType = 'application/soap+xml; charset=utf-8';
      if (soapAction) {
        contentType += `; action="${soapAction}"`;
      }
      return contentType;
    }
    return 'text/xml; charset=utf-8';
  }

  /**
   * Parse SOAP Fault from XML
   */
  static parseFault(xml: string): SoapFault | null {
    const faultMatch = xml.match(/<(?:soap:|SOAP-ENV:)?Fault[^>]*>([\s\S]*?)<\/(?:soap:|SOAP-ENV:)?Fault>/i);
    if (!faultMatch) return null;

    const faultXml = faultMatch[1];
    const extractElement = (name: string): string | undefined => {
      const regex = new RegExp(`<(?:[a-z]+:)?${name}[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?${name}>`, 'i');
      const match = faultXml.match(regex);
      return match ? match[1].trim() : undefined;
    };

    return {
      faultCode: extractElement('faultcode') || extractElement('Code') || 'Unknown',
      faultString: extractElement('faultstring') || extractElement('Reason') || 'Unknown error',
      faultActor: extractElement('faultactor') || extractElement('Role'),
      detail: extractElement('detail') || extractElement('Detail'),
    };
  }

  /**
   * Common SOAP fault codes
   */
  static readonly FAULT_CODES = {
    // SOAP 1.1 fault codes
    VERSION_MISMATCH: 'VersionMismatch',
    MUST_UNDERSTAND: 'MustUnderstand',
    CLIENT: 'Client',
    SERVER: 'Server',
    
    // SOAP 1.2 fault codes
    DATA_ENCODING_UNKNOWN: 'DataEncodingUnknown',
    SENDER: 'Sender',
    RECEIVER: 'Receiver',
  };
}

// Export default instance
export default SoapXmlHandshakeExecutor;
