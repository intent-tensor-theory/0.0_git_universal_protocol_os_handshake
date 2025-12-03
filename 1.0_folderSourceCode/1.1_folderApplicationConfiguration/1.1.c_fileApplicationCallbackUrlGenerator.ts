// ============================================
// PROTOCOL OS - APPLICATION CALLBACK URL GENERATOR
// ============================================
// Address: 1.1.c
// Purpose: Generate OAuth and authentication callback URLs
// ============================================

import { getEnvironmentConfiguration } from './1.1.a_fileApplicationEnvironmentConfiguration';

/**
 * Supported OAuth providers
 */
export type OAuthProvider = 
  | 'google'
  | 'github'
  | 'microsoft'
  | 'slack'
  | 'discord'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'salesforce'
  | 'hubspot'
  | 'stripe'
  | 'shopify'
  | 'zoom'
  | 'dropbox'
  | 'notion'
  | 'airtable'
  | 'custom';

/**
 * Callback URL types
 */
export type CallbackType = 
  | 'oauth'           // Standard OAuth callback
  | 'oauth-success'   // Post-auth success redirect
  | 'oauth-error'     // Post-auth error redirect
  | 'webhook'         // Incoming webhook endpoint
  | 'api'             // API endpoint callback
  | 'connect'         // Platform connection callback
  | 'disconnect';     // Platform disconnection callback

/**
 * Callback URL configuration
 */
export interface CallbackUrlConfig {
  /** OAuth provider */
  provider?: OAuthProvider;
  
  /** Callback type */
  type: CallbackType;
  
  /** Platform ID (for platform-specific callbacks) */
  platformId?: string;
  
  /** Handshake ID (for handshake-specific callbacks) */
  handshakeId?: string;
  
  /** Additional path segments */
  pathSegments?: string[];
  
  /** Query parameters */
  queryParams?: Record<string, string>;
  
  /** State parameter for OAuth */
  state?: string;
  
  /** Use HTTPS (default: based on environment) */
  forceHttps?: boolean;
}

/**
 * Generated callback URL result
 */
export interface CallbackUrlResult {
  /** Full URL */
  url: string;
  
  /** URL path only */
  path: string;
  
  /** Base URL used */
  baseUrl: string;
  
  /** Provider (if applicable) */
  provider?: OAuthProvider;
  
  /** Type */
  type: CallbackType;
}

// ============================================
// CALLBACK PATH TEMPLATES
// ============================================

/**
 * Callback path templates by type
 */
const CALLBACK_PATH_TEMPLATES: Record<CallbackType, string> = {
  'oauth': '/auth/callback/{provider}',
  'oauth-success': '/auth/success',
  'oauth-error': '/auth/error',
  'webhook': '/webhooks/{provider}',
  'api': '/api/callback/{provider}',
  'connect': '/connect/{platformId}/callback',
  'disconnect': '/disconnect/{platformId}/callback',
};

/**
 * Provider-specific OAuth paths (if different from default)
 */
const PROVIDER_OAUTH_PATHS: Partial<Record<OAuthProvider, string>> = {
  'salesforce': '/auth/callback/salesforce/oauth2',
  'hubspot': '/auth/callback/hubspot/oauth',
  'shopify': '/auth/callback/shopify/install',
};

// ============================================
// URL GENERATION FUNCTIONS
// ============================================

/**
 * Get the base URL for callbacks
 */
export function getCallbackBaseUrl(forceHttps?: boolean): string {
  const config = getEnvironmentConfiguration();
  
  // Priority: explicit config > Render URL > base URL
  let baseUrl = config.oauthCallbackBaseUrl || 
                config.renderExternalUrl || 
                config.baseUrl;
  
  // Ensure no trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  // Force HTTPS in production or if explicitly requested
  if (forceHttps || config.isProduction) {
    baseUrl = baseUrl.replace(/^http:/, 'https:');
  }
  
  return baseUrl;
}

/**
 * Build a path from template and parameters
 */
function buildPath(
  template: string,
  params: Record<string, string | undefined>
): string {
  let path = template;
  
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      path = path.replace(`{${key}}`, encodeURIComponent(value));
    }
  }
  
  // Remove any remaining unreplaced placeholders
  path = path.replace(/\{[^}]+\}/g, '');
  
  // Clean up double slashes
  path = path.replace(/\/+/g, '/');
  
  // Remove trailing slash
  path = path.replace(/\/$/, '');
  
  return path;
}

/**
 * Generate a callback URL
 * 
 * @example
 * ```ts
 * // OAuth callback for Google
 * const { url } = generateCallbackUrl({
 *   type: 'oauth',
 *   provider: 'google',
 * });
 * // => https://myapp.com/auth/callback/google
 * 
 * // Platform connection callback
 * const { url } = generateCallbackUrl({
 *   type: 'connect',
 *   platformId: 'plat_abc123',
 *   queryParams: { redirect: '/dashboard' },
 * });
 * // => https://myapp.com/connect/plat_abc123/callback?redirect=%2Fdashboard
 * 
 * // Webhook endpoint
 * const { url } = generateCallbackUrl({
 *   type: 'webhook',
 *   provider: 'stripe',
 *   handshakeId: 'hs_xyz789',
 * });
 * // => https://myapp.com/webhooks/stripe?handshakeId=hs_xyz789
 * ```
 */
export function generateCallbackUrl(config: CallbackUrlConfig): CallbackUrlResult {
  const baseUrl = getCallbackBaseUrl(config.forceHttps);
  
  // Get path template
  let pathTemplate = CALLBACK_PATH_TEMPLATES[config.type];
  
  // Use provider-specific path if available
  if (config.provider && PROVIDER_OAUTH_PATHS[config.provider]) {
    pathTemplate = PROVIDER_OAUTH_PATHS[config.provider]!;
  }
  
  // Build path with parameters
  let path = buildPath(pathTemplate, {
    provider: config.provider,
    platformId: config.platformId,
  });
  
  // Add additional path segments
  if (config.pathSegments && config.pathSegments.length > 0) {
    path += '/' + config.pathSegments.map(encodeURIComponent).join('/');
  }
  
  // Build query string
  const queryParams = new URLSearchParams();
  
  if (config.queryParams) {
    for (const [key, value] of Object.entries(config.queryParams)) {
      queryParams.set(key, value);
    }
  }
  
  if (config.state) {
    queryParams.set('state', config.state);
  }
  
  if (config.handshakeId) {
    queryParams.set('handshakeId', config.handshakeId);
  }
  
  const queryString = queryParams.toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;
  const url = `${baseUrl}${fullPath}`;
  
  return {
    url,
    path: fullPath,
    baseUrl,
    provider: config.provider,
    type: config.type,
  };
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Generate OAuth callback URL for a provider
 */
export function generateOAuthCallbackUrl(
  provider: OAuthProvider,
  state?: string
): string {
  return generateCallbackUrl({
    type: 'oauth',
    provider,
    state,
  }).url;
}

/**
 * Generate OAuth success redirect URL
 */
export function generateOAuthSuccessUrl(
  provider: OAuthProvider,
  platformId?: string
): string {
  return generateCallbackUrl({
    type: 'oauth-success',
    provider,
    queryParams: {
      provider,
      ...(platformId && { platformId }),
    },
  }).url;
}

/**
 * Generate OAuth error redirect URL
 */
export function generateOAuthErrorUrl(
  provider: OAuthProvider,
  error: string,
  errorDescription?: string
): string {
  return generateCallbackUrl({
    type: 'oauth-error',
    provider,
    queryParams: {
      provider,
      error,
      ...(errorDescription && { error_description: errorDescription }),
    },
  }).url;
}

/**
 * Generate webhook URL for a provider
 */
export function generateWebhookUrl(
  provider: OAuthProvider,
  handshakeId: string,
  secret?: string
): string {
  return generateCallbackUrl({
    type: 'webhook',
    provider,
    handshakeId,
    queryParams: secret ? { secret } : undefined,
  }).url;
}

/**
 * Generate platform connection callback URL
 */
export function generateConnectCallbackUrl(
  platformId: string,
  redirectPath?: string
): string {
  return generateCallbackUrl({
    type: 'connect',
    platformId,
    queryParams: redirectPath ? { redirect: redirectPath } : undefined,
  }).url;
}

// ============================================
// URL PARSING & VALIDATION
// ============================================

/**
 * Parse a callback URL to extract its components
 */
export function parseCallbackUrl(url: string): {
  type: CallbackType | null;
  provider: OAuthProvider | null;
  platformId: string | null;
  handshakeId: string | null;
  queryParams: Record<string, string>;
} {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const queryParams: Record<string, string> = {};
    
    parsed.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // Match against known patterns
    let type: CallbackType | null = null;
    let provider: OAuthProvider | null = null;
    let platformId: string | null = null;
    
    // OAuth callback: /auth/callback/{provider}
    const oauthMatch = path.match(/^\/auth\/callback\/([^/]+)/);
    if (oauthMatch) {
      type = 'oauth';
      provider = oauthMatch[1] as OAuthProvider;
    }
    
    // OAuth success: /auth/success
    if (path.startsWith('/auth/success')) {
      type = 'oauth-success';
      provider = queryParams.provider as OAuthProvider || null;
    }
    
    // OAuth error: /auth/error
    if (path.startsWith('/auth/error')) {
      type = 'oauth-error';
      provider = queryParams.provider as OAuthProvider || null;
    }
    
    // Webhook: /webhooks/{provider}
    const webhookMatch = path.match(/^\/webhooks\/([^/]+)/);
    if (webhookMatch) {
      type = 'webhook';
      provider = webhookMatch[1] as OAuthProvider;
    }
    
    // Connect: /connect/{platformId}/callback
    const connectMatch = path.match(/^\/connect\/([^/]+)\/callback/);
    if (connectMatch) {
      type = 'connect';
      platformId = connectMatch[1];
    }
    
    // Disconnect: /disconnect/{platformId}/callback
    const disconnectMatch = path.match(/^\/disconnect\/([^/]+)\/callback/);
    if (disconnectMatch) {
      type = 'disconnect';
      platformId = disconnectMatch[1];
    }
    
    return {
      type,
      provider,
      platformId,
      handshakeId: queryParams.handshakeId || null,
      queryParams,
    };
  } catch {
    return {
      type: null,
      provider: null,
      platformId: null,
      handshakeId: null,
      queryParams: {},
    };
  }
}

/**
 * Validate that a URL is a valid callback URL for this application
 */
export function isValidCallbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const baseUrl = getCallbackBaseUrl();
    const expectedOrigin = new URL(baseUrl).origin;
    
    return parsed.origin === expectedOrigin;
  } catch {
    return false;
  }
}

/**
 * Generate a secure state parameter for OAuth
 */
export function generateOAuthState(data?: Record<string, string>): string {
  const stateData = {
    ts: Date.now(),
    nonce: Math.random().toString(36).substring(2, 15),
    ...data,
  };
  
  // Base64 encode the state
  return btoa(JSON.stringify(stateData));
}

/**
 * Parse an OAuth state parameter
 */
export function parseOAuthState(state: string): {
  valid: boolean;
  data: Record<string, unknown>;
  expired: boolean;
} {
  try {
    const decoded = JSON.parse(atob(state));
    const ts = decoded.ts as number;
    
    // State expires after 10 minutes
    const expired = Date.now() - ts > 10 * 60 * 1000;
    
    return {
      valid: true,
      data: decoded,
      expired,
    };
  } catch {
    return {
      valid: false,
      data: {},
      expired: true,
    };
  }
}

// ============================================
// PROVIDER CONFIGURATION
// ============================================

/**
 * Get OAuth configuration URLs for a provider
 */
export function getProviderOAuthConfig(provider: OAuthProvider): {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
} {
  const configs: Record<OAuthProvider, ReturnType<typeof getProviderOAuthConfig>> = {
    google: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scopes: ['openid', 'email', 'profile'],
    },
    github: {
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scopes: ['read:user', 'user:email'],
    },
    microsoft: {
      authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      scopes: ['openid', 'email', 'profile', 'User.Read'],
    },
    slack: {
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      userInfoUrl: 'https://slack.com/api/users.identity',
      scopes: ['openid', 'email', 'profile'],
    },
    discord: {
      authorizationUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      userInfoUrl: 'https://discord.com/api/users/@me',
      scopes: ['identify', 'email'],
    },
    twitter: {
      authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      userInfoUrl: 'https://api.twitter.com/2/users/me',
      scopes: ['tweet.read', 'users.read'],
    },
    facebook: {
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      userInfoUrl: 'https://graph.facebook.com/me',
      scopes: ['email', 'public_profile'],
    },
    linkedin: {
      authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoUrl: 'https://api.linkedin.com/v2/userinfo',
      scopes: ['openid', 'email', 'profile'],
    },
    salesforce: {
      authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
      userInfoUrl: 'https://login.salesforce.com/services/oauth2/userinfo',
      scopes: ['openid', 'api', 'refresh_token'],
    },
    hubspot: {
      authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      userInfoUrl: 'https://api.hubapi.com/oauth/v1/access-tokens',
      scopes: ['contacts', 'crm.objects.contacts.read'],
    },
    stripe: {
      authorizationUrl: 'https://connect.stripe.com/oauth/authorize',
      tokenUrl: 'https://connect.stripe.com/oauth/token',
      userInfoUrl: 'https://api.stripe.com/v1/account',
      scopes: ['read_write'],
    },
    shopify: {
      authorizationUrl: 'https://{shop}.myshopify.com/admin/oauth/authorize',
      tokenUrl: 'https://{shop}.myshopify.com/admin/oauth/access_token',
      userInfoUrl: 'https://{shop}.myshopify.com/admin/api/2024-01/shop.json',
      scopes: ['read_products', 'read_orders'],
    },
    zoom: {
      authorizationUrl: 'https://zoom.us/oauth/authorize',
      tokenUrl: 'https://zoom.us/oauth/token',
      userInfoUrl: 'https://api.zoom.us/v2/users/me',
      scopes: ['user:read', 'meeting:read'],
    },
    dropbox: {
      authorizationUrl: 'https://www.dropbox.com/oauth2/authorize',
      tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
      userInfoUrl: 'https://api.dropboxapi.com/2/users/get_current_account',
      scopes: ['account_info.read', 'files.metadata.read'],
    },
    notion: {
      authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      userInfoUrl: 'https://api.notion.com/v1/users/me',
      scopes: [],
    },
    airtable: {
      authorizationUrl: 'https://airtable.com/oauth2/v1/authorize',
      tokenUrl: 'https://airtable.com/oauth2/v1/token',
      userInfoUrl: 'https://api.airtable.com/v0/meta/whoami',
      scopes: ['data.records:read', 'schema.bases:read'],
    },
    custom: {
      authorizationUrl: '',
      tokenUrl: '',
      userInfoUrl: '',
      scopes: [],
    },
  };
  
  return configs[provider];
}
