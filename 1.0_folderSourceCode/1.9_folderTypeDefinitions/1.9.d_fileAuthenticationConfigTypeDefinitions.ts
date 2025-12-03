// ============================================
// PROTOCOL OS - AUTHENTICATION CONFIG TYPE DEFINITIONS
// ============================================
// Address: 1.9.d
// Purpose: Types for authentication configurations
// ============================================

/**
 * OAuth Token
 */
export interface OAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  expiresAt?: string;
  refreshToken?: string;
  scope?: string;
  idToken?: string;
}

/**
 * OAuth PKCE Configuration
 */
export interface OAuthPkceConfig {
  clientId: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes?: string[];
  audience?: string;
  additionalParams?: Record<string, string>;
}

/**
 * OAuth Authorization Code Configuration
 */
export interface OAuthAuthCodeConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes?: string[];
  audience?: string;
}

/**
 * OAuth Implicit Configuration (Deprecated)
 */
export interface OAuthImplicitConfig {
  clientId: string;
  authorizationUrl: string;
  redirectUri: string;
  scopes?: string[];
  nonce?: string;
}

/**
 * Client Credentials Configuration
 */
export interface ClientCredentialsConfig {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scopes?: string[];
  audience?: string;
}

/**
 * API Key Configuration
 */
export interface ApiKeyConfig {
  apiKey: string;
  keyName: string;
  placement: 'header' | 'query' | 'body';
  prefix?: string;
}

/**
 * Basic Auth Configuration
 */
export interface BasicAuthConfig {
  username: string;
  password: string;
}

/**
 * Bearer Token Configuration
 */
export interface BearerTokenConfig {
  token: string;
}

/**
 * GraphQL Configuration
 */
export interface GraphqlConfig {
  endpoint: string;
  authHeader?: string;
  authValue?: string;
  defaultHeaders?: Record<string, string>;
}

/**
 * WebSocket Configuration
 */
export interface WebsocketConfig {
  url: string;
  protocols?: string[];
  authToken?: string;
  pingInterval?: number;
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

/**
 * SOAP/XML Configuration
 */
export interface SoapXmlConfig {
  endpoint: string;
  wsdlUrl?: string;
  soapAction?: string;
  soapVersion?: '1.1' | '1.2';
  username?: string;
  password?: string;
  wsseHeader?: boolean;
}

/**
 * GitHub Configuration
 */
export interface GithubConfig {
  owner: string;
  repo: string;
  token?: string;
  branch?: string;
  path?: string;
  workflowId?: string;
}

/**
 * Keyless/Scraper Configuration
 */
export interface KeylessScraperConfig {
  userAgent?: string;
  defaultHeaders?: Record<string, string>;
  rateLimit?: number;
  followRedirects?: boolean;
  timeout?: number;
}

/**
 * cURL Default Configuration
 */
export interface CurlDefaultConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
}

/**
 * Union type for all authentication configurations
 */
export type AuthenticationConfig =
  | { type: 'oauth-pkce'; config: OAuthPkceConfig }
  | { type: 'oauth-auth-code'; config: OAuthAuthCodeConfig }
  | { type: 'oauth-implicit'; config: OAuthImplicitConfig }
  | { type: 'client-credentials'; config: ClientCredentialsConfig }
  | { type: 'api-key'; config: ApiKeyConfig }
  | { type: 'basic'; config: BasicAuthConfig }
  | { type: 'bearer'; config: BearerTokenConfig }
  | { type: 'graphql'; config: GraphqlConfig }
  | { type: 'websocket'; config: WebsocketConfig }
  | { type: 'soap-xml'; config: SoapXmlConfig }
  | { type: 'github'; config: GithubConfig }
  | { type: 'keyless'; config: KeylessScraperConfig }
  | { type: 'curl-default'; config: CurlDefaultConfig }
  | { type: 'none'; config: Record<string, never> };

/**
 * Authentication state
 */
export interface AuthenticationState {
  isAuthenticated: boolean;
  token?: OAuthToken;
  expiresAt?: string;
  lastRefresh?: string;
  error?: string;
}

/**
 * Credential storage
 */
export interface StoredCredentials {
  id: string;
  type: AuthenticationConfig['type'];
  name: string;
  config: AuthenticationConfig['config'];
  createdAt: string;
  lastUsed?: string;
}
