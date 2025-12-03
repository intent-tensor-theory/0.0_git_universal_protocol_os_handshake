// ============================================
// PROTOCOL OS - OAUTH PKCE UTILITIES
// ============================================
// Address: 1.4.2.b
// Purpose: Utility functions for OAuth PKCE flow
// ============================================

import { generateRandomString } from '@utils/1.8.c_fileRandomStringGenerator';
import { generateSha256Hash } from '@utils/1.8.b_fileSha256HashGenerator';

/**
 * PKCE Challenge Methods
 */
export const PKCE_CHALLENGE_METHODS = {
  S256: 'S256',
  PLAIN: 'plain', // Not recommended
} as const;

/**
 * Standard OAuth 2.0 scopes
 */
export const COMMON_OAUTH_SCOPES = {
  OPENID: 'openid',
  PROFILE: 'profile',
  EMAIL: 'email',
  OFFLINE_ACCESS: 'offline_access',
} as const;

/**
 * OAuth error codes
 */
export const OAUTH_ERROR_CODES = {
  INVALID_REQUEST: 'invalid_request',
  UNAUTHORIZED_CLIENT: 'unauthorized_client',
  ACCESS_DENIED: 'access_denied',
  UNSUPPORTED_RESPONSE_TYPE: 'unsupported_response_type',
  INVALID_SCOPE: 'invalid_scope',
  SERVER_ERROR: 'server_error',
  TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable',
  INVALID_GRANT: 'invalid_grant',
  INVALID_CLIENT: 'invalid_client',
} as const;

/**
 * Generate a PKCE code verifier
 * Must be 43-128 characters from [A-Z][a-z][0-9]-._~
 */
export function generateCodeVerifier(length: number = 128): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  return generateRandomString(Math.min(Math.max(length, 43), 128), charset);
}

/**
 * Generate a PKCE code challenge from a verifier
 */
export async function generateCodeChallenge(
  verifier: string,
  method: 'S256' | 'plain' = 'S256'
): Promise<string> {
  if (method === 'plain') {
    return verifier;
  }

  // S256: BASE64URL(SHA256(code_verifier))
  return generateSha256Hash(verifier);
}

/**
 * Parse OAuth callback URL parameters
 */
export function parseOAuthCallback(callbackUrl: string): {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
} {
  const url = new URL(callbackUrl);
  const params = url.searchParams;

  return {
    code: params.get('code') ?? undefined,
    state: params.get('state') ?? undefined,
    error: params.get('error') ?? undefined,
    errorDescription: params.get('error_description') ?? undefined,
  };
}

/**
 * Validate state parameter matches expected
 */
export function validateState(expected: string, received: string | null): boolean {
  if (!received) return false;
  
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== received.length) return false;
  
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiresAt: string | undefined, bufferSeconds: number = 60): boolean {
  if (!expiresAt) return false;
  
  const expiry = new Date(expiresAt);
  const now = new Date();
  const buffer = bufferSeconds * 1000;
  
  return expiry.getTime() - buffer <= now.getTime();
}

/**
 * Calculate token expiry from expires_in
 */
export function calculateTokenExpiry(expiresIn: number): string {
  return new Date(Date.now() + expiresIn * 1000).toISOString();
}

/**
 * Build token request body
 */
export function buildTokenRequestBody(params: {
  grantType: 'authorization_code' | 'refresh_token';
  clientId: string;
  code?: string;
  redirectUri?: string;
  codeVerifier?: string;
  refreshToken?: string;
}): URLSearchParams {
  const body = new URLSearchParams();
  body.set('grant_type', params.grantType);
  body.set('client_id', params.clientId);

  if (params.grantType === 'authorization_code') {
    if (params.code) body.set('code', params.code);
    if (params.redirectUri) body.set('redirect_uri', params.redirectUri);
    if (params.codeVerifier) body.set('code_verifier', params.codeVerifier);
  } else if (params.grantType === 'refresh_token') {
    if (params.refreshToken) body.set('refresh_token', params.refreshToken);
  }

  return body;
}

/**
 * Parse token response
 */
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  refreshToken?: string;
  scope?: string;
  idToken?: string;
}

export function parseTokenResponse(response: Record<string, unknown>): TokenResponse {
  return {
    accessToken: response.access_token as string,
    tokenType: (response.token_type as string) || 'Bearer',
    expiresIn: response.expires_in as number | undefined,
    refreshToken: response.refresh_token as string | undefined,
    scope: response.scope as string | undefined,
    idToken: response.id_token as string | undefined,
  };
}

/**
 * Parse and validate OAuth error response
 */
export function parseOAuthError(response: Record<string, unknown>): {
  error: string;
  description: string;
  uri?: string;
} {
  return {
    error: (response.error as string) || 'unknown_error',
    description: (response.error_description as string) || 'An unknown error occurred',
    uri: response.error_uri as string | undefined,
  };
}

/**
 * Decode a JWT token (without validation)
 */
export function decodeJwt(token: string): {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    return { header, payload, signature: parts[2] };
  } catch {
    return null;
  }
}

/**
 * Extract user info from ID token
 */
export function extractUserFromIdToken(idToken: string): {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
} | null {
  const decoded = decodeJwt(idToken);
  if (!decoded) return null;

  const { payload } = decoded;
  return {
    sub: payload.sub as string | undefined,
    email: payload.email as string | undefined,
    name: payload.name as string | undefined,
    picture: payload.picture as string | undefined,
  };
}

/**
 * Well-known OAuth provider configurations
 */
export const OAUTH_PROVIDER_CONFIGS = {
  google: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
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
  auth0: (domain: string) => ({
    authorizationUrl: `https://${domain}/authorize`,
    tokenUrl: `https://${domain}/oauth/token`,
    userInfoUrl: `https://${domain}/userinfo`,
    scopes: ['openid', 'profile', 'email'],
  }),
} as const;
