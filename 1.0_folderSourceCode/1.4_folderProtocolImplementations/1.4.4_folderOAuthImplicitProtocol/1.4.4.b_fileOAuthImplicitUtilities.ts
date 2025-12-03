// ============================================
// PROTOCOL OS - OAUTH IMPLICIT UTILITIES
// ============================================
// Address: 1.4.4.b
// Purpose: Utility functions for OAuth Implicit flow (DEPRECATED)
// ============================================

/**
 * ⚠️ DEPRECATED: The Implicit flow is no longer recommended.
 * These utilities exist only for legacy system support.
 * Use OAuth PKCE for new implementations.
 */

/**
 * Parse token from URL fragment (hash)
 */
export function parseImplicitCallback(url: string): {
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  state?: string;
  error?: string;
  errorDescription?: string;
} {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return {};

  const fragment = url.substring(hashIndex + 1);
  const params = new URLSearchParams(fragment);

  return {
    accessToken: params.get('access_token') ?? undefined,
    tokenType: params.get('token_type') ?? undefined,
    expiresIn: params.get('expires_in') ? parseInt(params.get('expires_in')!, 10) : undefined,
    state: params.get('state') ?? undefined,
    error: params.get('error') ?? undefined,
    errorDescription: params.get('error_description') ?? undefined,
  };
}

/**
 * Build implicit flow authorization URL
 */
export function buildImplicitAuthUrl(params: {
  authorizationUrl: string;
  clientId: string;
  redirectUri: string;
  state: string;
  nonce?: string;
  scopes?: string[];
}): string {
  const url = new URL(params.authorizationUrl);
  
  url.searchParams.set('response_type', 'token');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('state', params.state);
  
  if (params.nonce) {
    url.searchParams.set('nonce', params.nonce);
  }
  
  if (params.scopes?.length) {
    url.searchParams.set('scope', params.scopes.join(' '));
  }
  
  return url.toString();
}

/**
 * Security warnings for implicit flow
 */
export const IMPLICIT_FLOW_WARNINGS = [
  'Access tokens are exposed in the URL fragment',
  'Tokens may leak through browser history',
  'Tokens may leak through referrer headers',
  'No refresh tokens are issued',
  'Token replay attacks are possible',
  'Use OAuth 2.0 PKCE for secure public client authentication',
] as const;
