// ============================================
// PROTOCOL OS - OAUTH AUTH CODE UTILITIES
// ============================================
// Address: 1.4.3.b
// Purpose: Utility functions for OAuth Authorization Code flow
// ============================================

/**
 * Build Basic Authorization header
 */
export function buildBasicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

/**
 * Build authorization URL for Auth Code flow
 */
export function buildAuthorizationUrl(params: {
  authorizationUrl: string;
  clientId: string;
  redirectUri: string;
  state: string;
  scopes?: string[];
  responseType?: string;
  additionalParams?: Record<string, string>;
}): string {
  const url = new URL(params.authorizationUrl);
  
  url.searchParams.set('response_type', params.responseType || 'code');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('state', params.state);
  
  if (params.scopes?.length) {
    url.searchParams.set('scope', params.scopes.join(' '));
  }
  
  if (params.additionalParams) {
    Object.entries(params.additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  return url.toString();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeAuthorizationCode(params: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
}> {
  const response = await fetch(params.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': buildBasicAuthHeader(params.clientId, params.clientSecret),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokens = await response.json();
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenType: tokens.token_type || 'Bearer',
    expiresIn: tokens.expires_in,
  };
}

/**
 * Client authentication methods
 */
export const CLIENT_AUTH_METHODS = {
  BASIC: 'client_secret_basic',
  POST: 'client_secret_post',
  JWT: 'client_secret_jwt',
  PRIVATE_KEY: 'private_key_jwt',
} as const;

export type ClientAuthMethod = typeof CLIENT_AUTH_METHODS[keyof typeof CLIENT_AUTH_METHODS];
