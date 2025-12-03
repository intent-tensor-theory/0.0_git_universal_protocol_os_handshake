// ============================================
// PROTOCOL OS - AUTHENTICATION TYPE DEFINITIONS
// ============================================
// Address: 1.9.d
// Purpose: Define authentication types for all 11 supported protocols
// ============================================

/**
 * All supported authentication/protocol types
 */
export type AuthenticationType =
  | 'Select an authentication type...'
  | 'curl-default'
  | 'oauth-pkce'
  | 'oauth-auth-code'
  | 'oauth-implicit'
  | 'client-credentials'
  | 'rest-api-key'
  | 'graphql'
  | 'websocket'
  | 'soap-xml'
  | 'github-repo-runner'
  | 'keyless-scraper';

/**
 * OAuth PKCE specific configuration
 */
export interface OAuthPkceConfig {
  authUrl: string;
  tokenUrl: string;
  apiUrl: string;
  clientId: string;
  scope: string;
  redirectUri: string;
  // Runtime values (not persisted)
  codeVerifier?: string;
  codeChallenge?: string;
  accessToken?: string;
}

/**
 * OAuth Authorization Code specific configuration
 */
export interface OAuthAuthCodeConfig {
  authUrl: string;
  tokenUrl: string;
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  redirectUri: string;
  // Runtime values
  accessToken?: string;
  refreshToken?: string;
}

/**
 * OAuth Implicit Grant specific configuration
 */
export interface OAuthImplicitConfig {
  authUrl: string;
  apiUrl: string;
  clientId: string;
  scope: string;
  redirectUri: string;
  // Runtime values
  accessToken?: string;
}

/**
 * Client Credentials (server-to-server) configuration
 */
export interface ClientCredentialsConfig {
  tokenUrl: string;
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  // Runtime values
  accessToken?: string;
}

/**
 * REST API Key configuration
 */
export interface RestApiKeyConfig {
  apiUrl: string;
  apiKey: string;
  headerName: string; // e.g., 'Authorization', 'X-API-Key'
}

/**
 * GraphQL specific configuration
 */
export interface GraphqlConfig {
  endpoint: string;
  authToken: string;
  headerName: string;
}

/**
 * WebSocket configuration
 */
export interface WebsocketConfig {
  wsUrl: string;
  authToken: string;
  reconnectAttempts: number;
  heartbeatInterval: number;
}

/**
 * SOAP/XML configuration
 */
export interface SoapXmlConfig {
  endpoint: string;
  soapAction: string;
  username: string;
  password: string;
  namespace: string;
}

/**
 * GitHub Repository Runner configuration
 */
export interface GithubRepoRunnerConfig {
  repoUrl: string;
  personalAccessToken: string;
  branch: string;
  entrypoint: string;
}

/**
 * Keyless Scraper configuration (minimal - no auth needed)
 */
export interface KeylessScraperConfig {
  corsProxyUrl?: string;
}

/**
 * Map of auth type keys to their config property names
 */
export const AUTH_TYPE_CONFIG_MAP: Record<AuthenticationType, string | null> = {
  'Select an authentication type...': null,
  'curl-default': null,  // No special config, uses raw cURL
  'oauth-pkce': 'oauthPkce',
  'oauth-auth-code': 'oauthAuthCode',
  'oauth-implicit': 'oauthImplicit',
  'client-credentials': 'clientCredentials',
  'rest-api-key': 'restApiKey',
  'graphql': 'graphql',
  'websocket': 'websocket',
  'soap-xml': 'soapXml',
  'github-repo-runner': 'githubRepoRunner',
  'keyless-scraper': 'keylessScraper',
};

/**
 * Complete Authentication object with all possible configs
 */
export interface Authentication {
  type: AuthenticationType;
  oauthPkce?: OAuthPkceConfig;
  oauthAuthCode?: OAuthAuthCodeConfig;
  oauthImplicit?: OAuthImplicitConfig;
  clientCredentials?: ClientCredentialsConfig;
  restApiKey?: RestApiKeyConfig;
  graphql?: GraphqlConfig;
  websocket?: WebsocketConfig;
  soapXml?: SoapXmlConfig;
  githubRepoRunner?: GithubRepoRunnerConfig;
  keylessScraper?: KeylessScraperConfig;
}

/**
 * Fields that should be sanitized before persistence
 */
export const SENSITIVE_AUTHENTICATION_FIELDS: string[] = [
  'clientSecret',
  'apiKey',
  'authToken',
  'accessToken',
  'refreshToken',
  'password',
  'personalAccessToken',
  'codeVerifier',
];

/**
 * Display names for each authentication type
 */
export const AUTH_TYPE_DISPLAY_NAMES: Record<AuthenticationType, string> = {
  'Select an authentication type...': 'Select Protocol...',
  'curl-default': 'cURL (Universal)',
  'oauth-pkce': 'OAuth 2.0 + PKCE',
  'oauth-auth-code': 'OAuth Authorization Code',
  'oauth-implicit': 'OAuth Implicit Grant',
  'client-credentials': 'Client Credentials',
  'rest-api-key': 'REST API Key',
  'graphql': 'GraphQL',
  'websocket': 'WebSocket',
  'soap-xml': 'SOAP/XML',
  'github-repo-runner': 'GitHub Repo Runner',
  'keyless-scraper': 'Keyless Scraper',
};

/**
 * Whether each auth type requires a callback URL
 */
export const AUTH_TYPE_REQUIRES_CALLBACK: Record<AuthenticationType, boolean> = {
  'Select an authentication type...': false,
  'curl-default': false,
  'oauth-pkce': true,
  'oauth-auth-code': true,
  'oauth-implicit': true,
  'client-credentials': false,
  'rest-api-key': false,
  'graphql': false,
  'websocket': false,
  'soap-xml': false,
  'github-repo-runner': false,
  'keyless-scraper': false,
};
