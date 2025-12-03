// ============================================
// PROTOCOL OS - CLIENT CREDENTIALS UTILITIES
// ============================================
// Address: 1.4.5.b
// Purpose: Utility functions for Client Credentials flow
// ============================================

/**
 * Build client credentials token request body
 */
export function buildClientCredentialsRequest(params: {
  clientId: string;
  clientSecret: string;
  scopes?: string[];
  audience?: string;
}): URLSearchParams {
  const body = new URLSearchParams();
  body.set('grant_type', 'client_credentials');
  body.set('client_id', params.clientId);
  body.set('client_secret', params.clientSecret);
  
  if (params.scopes?.length) {
    body.set('scope', params.scopes.join(' '));
  }
  
  if (params.audience) {
    body.set('audience', params.audience);
  }
  
  return body;
}

/**
 * Common M2M scopes by provider
 */
export const M2M_SCOPES = {
  auth0: ['read:users', 'update:users', 'delete:users', 'create:users'],
  azure: ['https://graph.microsoft.com/.default'],
  okta: ['okta.users.read', 'okta.users.manage'],
} as const;

/**
 * Token caching helper
 */
export class TokenCache {
  private token: { accessToken: string; expiresAt: Date } | null = null;

  set(accessToken: string, expiresIn: number): void {
    // Cache with 5 minute buffer before expiry
    const bufferMs = 5 * 60 * 1000;
    this.token = {
      accessToken,
      expiresAt: new Date(Date.now() + (expiresIn * 1000) - bufferMs),
    };
  }

  get(): string | null {
    if (!this.token) return null;
    if (new Date() >= this.token.expiresAt) {
      this.token = null;
      return null;
    }
    return this.token.accessToken;
  }

  clear(): void {
    this.token = null;
  }
}
