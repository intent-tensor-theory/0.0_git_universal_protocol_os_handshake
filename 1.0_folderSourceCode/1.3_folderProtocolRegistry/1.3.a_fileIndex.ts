// ============================================
// PROTOCOL OS - PROTOCOL REGISTRY INDEX
// ============================================
// Address: 1.3.a
// Purpose: Central export point for all protocol handshake modules
// ============================================

// Core interface
export type {
  ProtocolHandshakeModule,
  ProtocolModuleMetadata,
  ProtocolCapabilities,
  ProtocolAuthenticationFlow,
  ProtocolFieldDefinition,
  ProtocolFieldType,
  ProtocolValidationResult,
  ProtocolExecutionContext,
  ProtocolExecutionResult,
  ProtocolTokenRefreshResult,
  ProtocolHealthCheckResult,
  ProtocolModuleStatus,
} from './1.3.b_fileProtocolHandshakeModuleInterface';

// Re-export the base class
export { BaseProtocolModule } from './1.3.b_fileProtocolHandshakeModuleInterface';

/**
 * Supported protocol types
 * 
 * Each protocol type maps to a specific handshake module
 * that implements the ProtocolHandshakeModule interface.
 */
export type ProtocolType =
  | 'oauth2'           // OAuth 2.0 Authorization Code Flow
  | 'oauth2-pkce'      // OAuth 2.0 with PKCE (for SPAs)
  | 'oauth1'           // OAuth 1.0a (legacy, e.g., Twitter v1)
  | 'api-key'          // Simple API key authentication
  | 'api-key-header'   // API key in header
  | 'api-key-query'    // API key in query string
  | 'basic-auth'       // HTTP Basic Authentication
  | 'bearer-token'     // Bearer token (JWT or opaque)
  | 'digest-auth'      // HTTP Digest Authentication
  | 'hmac'             // HMAC signature authentication
  | 'aws-signature'    // AWS Signature v4
  | 'custom'           // Custom authentication flow
  | 'none';            // No authentication required

/**
 * Protocol type display names
 */
export const PROTOCOL_TYPE_DISPLAY_NAMES: Record<ProtocolType, string> = {
  'oauth2': 'OAuth 2.0',
  'oauth2-pkce': 'OAuth 2.0 with PKCE',
  'oauth1': 'OAuth 1.0a',
  'api-key': 'API Key',
  'api-key-header': 'API Key (Header)',
  'api-key-query': 'API Key (Query)',
  'basic-auth': 'Basic Authentication',
  'bearer-token': 'Bearer Token',
  'digest-auth': 'Digest Authentication',
  'hmac': 'HMAC Signature',
  'aws-signature': 'AWS Signature v4',
  'custom': 'Custom',
  'none': 'No Authentication',
};

/**
 * Protocol type descriptions
 */
export const PROTOCOL_TYPE_DESCRIPTIONS: Record<ProtocolType, string> = {
  'oauth2': 'Industry-standard authorization framework using authorization code flow with refresh tokens.',
  'oauth2-pkce': 'OAuth 2.0 with Proof Key for Code Exchange, recommended for single-page applications.',
  'oauth1': 'Legacy OAuth protocol using request tokens and signatures. Used by Twitter API v1.',
  'api-key': 'Simple authentication using a secret key passed with each request.',
  'api-key-header': 'API key sent in a custom HTTP header (e.g., X-API-Key).',
  'api-key-query': 'API key sent as a URL query parameter.',
  'basic-auth': 'HTTP Basic Authentication with username and password encoded in headers.',
  'bearer-token': 'Token-based authentication using the Authorization: Bearer header.',
  'digest-auth': 'HTTP Digest Authentication with challenge-response mechanism.',
  'hmac': 'Request signing using Hash-based Message Authentication Code.',
  'aws-signature': 'Amazon Web Services Signature Version 4 for AWS API requests.',
  'custom': 'Custom authentication implementation for non-standard APIs.',
  'none': 'No authentication required. For public APIs.',
};

/**
 * Protocol type icons (Lucide icon names)
 */
export const PROTOCOL_TYPE_ICONS: Record<ProtocolType, string> = {
  'oauth2': 'key-round',
  'oauth2-pkce': 'shield-check',
  'oauth1': 'key',
  'api-key': 'lock-keyhole',
  'api-key-header': 'lock',
  'api-key-query': 'lock-open',
  'basic-auth': 'user-check',
  'bearer-token': 'badge-check',
  'digest-auth': 'shield',
  'hmac': 'fingerprint',
  'aws-signature': 'cloud',
  'custom': 'settings',
  'none': 'unlock',
};

/**
 * Protocol complexity levels
 */
export type ProtocolComplexity = 'simple' | 'moderate' | 'complex';

export const PROTOCOL_TYPE_COMPLEXITY: Record<ProtocolType, ProtocolComplexity> = {
  'none': 'simple',
  'api-key': 'simple',
  'api-key-header': 'simple',
  'api-key-query': 'simple',
  'basic-auth': 'simple',
  'bearer-token': 'simple',
  'oauth2': 'moderate',
  'oauth2-pkce': 'moderate',
  'oauth1': 'complex',
  'digest-auth': 'complex',
  'hmac': 'complex',
  'aws-signature': 'complex',
  'custom': 'complex',
};

/**
 * Protocol registry for dynamic module loading
 * 
 * Maps protocol types to their module implementations.
 * Modules are lazily loaded to reduce initial bundle size.
 */
export const PROTOCOL_MODULE_REGISTRY: Record<ProtocolType, () => Promise<{ default: new () => import('./1.3.b_fileProtocolHandshakeModuleInterface').ProtocolHandshakeModule }>> = {
  'oauth2': () => import('./1.3.1_folderOAuth2Protocol/1.3.1.a_fileOAuth2ProtocolModule'),
  'oauth2-pkce': () => import('./1.3.2_folderOAuth2PkceProtocol/1.3.2.a_fileOAuth2PkceProtocolModule'),
  'oauth1': () => import('./1.3.3_folderOAuth1Protocol/1.3.3.a_fileOAuth1ProtocolModule'),
  'api-key': () => import('./1.3.4_folderApiKeyProtocol/1.3.4.a_fileApiKeyProtocolModule'),
  'api-key-header': () => import('./1.3.4_folderApiKeyProtocol/1.3.4.a_fileApiKeyProtocolModule'),
  'api-key-query': () => import('./1.3.4_folderApiKeyProtocol/1.3.4.a_fileApiKeyProtocolModule'),
  'basic-auth': () => import('./1.3.5_folderBasicAuthProtocol/1.3.5.a_fileBasicAuthProtocolModule'),
  'bearer-token': () => import('./1.3.6_folderBearerTokenProtocol/1.3.6.a_fileBearerTokenProtocolModule'),
  'digest-auth': () => import('./1.3.7_folderDigestAuthProtocol/1.3.7.a_fileDigestAuthProtocolModule'),
  'hmac': () => import('./1.3.8_folderHmacProtocol/1.3.8.a_fileHmacProtocolModule'),
  'aws-signature': () => import('./1.3.9_folderAwsSignatureProtocol/1.3.9.a_fileAwsSignatureProtocolModule'),
  'custom': () => import('./1.3.10_folderCustomProtocol/1.3.10.a_fileCustomProtocolModule'),
  'none': () => import('./1.3.11_folderNoAuthProtocol/1.3.11.a_fileNoAuthProtocolModule'),
};

/**
 * Module instance cache
 */
const moduleCache = new Map<ProtocolType, import('./1.3.b_fileProtocolHandshakeModuleInterface').ProtocolHandshakeModule>();

/**
 * Get a protocol module instance
 * 
 * Lazily loads and caches protocol module instances.
 * 
 * @example
 * ```ts
 * const oauth2Module = await getProtocolModule('oauth2');
 * const fields = oauth2Module.getRequiredFields();
 * ```
 */
export async function getProtocolModule(
  protocolType: ProtocolType
): Promise<import('./1.3.b_fileProtocolHandshakeModuleInterface').ProtocolHandshakeModule> {
  // Check cache first
  if (moduleCache.has(protocolType)) {
    return moduleCache.get(protocolType)!;
  }

  // Load module
  const loader = PROTOCOL_MODULE_REGISTRY[protocolType];
  if (!loader) {
    throw new Error(`Unknown protocol type: ${protocolType}`);
  }

  const { default: ModuleClass } = await loader();
  const instance = new ModuleClass();
  
  // Cache instance
  moduleCache.set(protocolType, instance);
  
  return instance;
}

/**
 * Clear the module cache
 * 
 * Useful for testing or when modules need to be reloaded.
 */
export function clearProtocolModuleCache(): void {
  moduleCache.clear();
}

/**
 * Get all available protocol types
 */
export function getAvailableProtocolTypes(): ProtocolType[] {
  return Object.keys(PROTOCOL_TYPE_DISPLAY_NAMES) as ProtocolType[];
}

/**
 * Get protocol types by complexity
 */
export function getProtocolTypesByComplexity(complexity: ProtocolComplexity): ProtocolType[] {
  return (Object.entries(PROTOCOL_TYPE_COMPLEXITY) as [ProtocolType, ProtocolComplexity][])
    .filter(([, c]) => c === complexity)
    .map(([type]) => type);
}

/**
 * Check if a protocol type requires OAuth flow
 */
export function isOAuthProtocol(protocolType: ProtocolType): boolean {
  return protocolType === 'oauth2' || 
         protocolType === 'oauth2-pkce' || 
         protocolType === 'oauth1';
}

/**
 * Check if a protocol type uses API keys
 */
export function isApiKeyProtocol(protocolType: ProtocolType): boolean {
  return protocolType === 'api-key' || 
         protocolType === 'api-key-header' || 
         protocolType === 'api-key-query';
}

/**
 * Check if a protocol supports token refresh
 */
export function supportsTokenRefresh(protocolType: ProtocolType): boolean {
  return protocolType === 'oauth2' || 
         protocolType === 'oauth2-pkce';
}

/**
 * Get recommended protocol for common use cases
 */
export function getRecommendedProtocol(useCase: 
  | 'spa-auth'           // Single-page app user auth
  | 'server-auth'        // Server-side user auth
  | 'service-to-service' // Backend API calls
  | 'simple-api'         // Simple API integration
  | 'aws'                // AWS services
  | 'legacy'             // Legacy systems
): ProtocolType {
  switch (useCase) {
    case 'spa-auth':
      return 'oauth2-pkce';
    case 'server-auth':
      return 'oauth2';
    case 'service-to-service':
      return 'bearer-token';
    case 'simple-api':
      return 'api-key-header';
    case 'aws':
      return 'aws-signature';
    case 'legacy':
      return 'basic-auth';
    default:
      return 'api-key';
  }
}

/**
 * Protocol selection helper
 */
export interface ProtocolSelectionOption {
  type: ProtocolType;
  displayName: string;
  description: string;
  icon: string;
  complexity: ProtocolComplexity;
  supportsRefresh: boolean;
  requiresRedirect: boolean;
}

/**
 * Get all protocol options for UI selection
 */
export function getProtocolSelectionOptions(): ProtocolSelectionOption[] {
  return getAvailableProtocolTypes().map((type) => ({
    type,
    displayName: PROTOCOL_TYPE_DISPLAY_NAMES[type],
    description: PROTOCOL_TYPE_DESCRIPTIONS[type],
    icon: PROTOCOL_TYPE_ICONS[type],
    complexity: PROTOCOL_TYPE_COMPLEXITY[type],
    supportsRefresh: supportsTokenRefresh(type),
    requiresRedirect: isOAuthProtocol(type),
  }));
}
