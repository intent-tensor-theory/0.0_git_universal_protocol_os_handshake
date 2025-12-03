// ============================================
// PROTOCOL OS - PROTOCOL HANDLER REGISTRY INDEX
// ============================================
// Address: 1.3.d
// Purpose: Clean exports for protocol handler registry
// ============================================

// Core interface and base class
export {
  type ProtocolHandler,
  type HandshakeExecutionOptions,
  type AuthenticationValidationResult,
  type TokenRefreshResult,
  BaseProtocolHandler,
} from './1.3.a_fileProtocolHandlerInterface';

// Registry and metadata
export {
  protocolRegistry,
  PROTOCOL_METADATA,
  type ProtocolMetadata,
  getProtocolHandler,
  getProtocolHandlerOrThrow,
} from './1.3.b_fileProtocolHandlerRegistry';

// React hooks
export {
  useProtocolRegistry,
  useProtocolHandler,
  useProtocolOptions,
  useGroupedProtocolOptions,
  type UseProtocolRegistryReturn,
} from './1.3.c_fileProtocolRegistryHook';

/**
 * Protocol category display names for UI
 */
export const PROTOCOL_CATEGORY_LABELS = {
  oauth: 'OAuth 2.0',
  'api-key': 'API Key',
  specialized: 'Specialized',
  'no-auth': 'No Authentication',
} as const;

/**
 * Protocol complexity display names for UI
 */
export const PROTOCOL_COMPLEXITY_LABELS = {
  simple: 'Simple',
  moderate: 'Moderate',
  complex: 'Complex',
} as const;

/**
 * Protocol icons (Lucide icon names)
 */
export const PROTOCOL_ICONS = {
  'curl-default': 'Terminal',
  'oauth-pkce': 'ShieldCheck',
  'oauth-auth-code': 'Key',
  'oauth-implicit': 'AlertTriangle',
  'client-credentials': 'Server',
  'rest-api-key': 'KeyRound',
  'graphql': 'Hexagon',
  'websocket': 'Radio',
  'soap-xml': 'FileCode',
  'github-repo-runner': 'Github',
  'keyless-scraper': 'Globe',
} as const;

/**
 * Quick reference: Which protocols support which features
 */
export const PROTOCOL_FEATURE_MATRIX = {
  tokenRefresh: [
    'oauth-pkce',
    'oauth-auth-code',
    'client-credentials',
  ],
  userInteraction: [
    'oauth-pkce',
    'oauth-auth-code',
    'oauth-implicit',
  ],
  realtime: [
    'websocket',
  ],
  noAuthentication: [
    'curl-default',
    'keyless-scraper',
  ],
  deprecated: [
    'oauth-implicit',
  ],
} as const;

/**
 * Initialize the protocol registry on module load
 * This ensures handlers are registered before first use
 */
import { protocolRegistry as registry } from './1.3.b_fileProtocolHandlerRegistry';
registry.initialize();
