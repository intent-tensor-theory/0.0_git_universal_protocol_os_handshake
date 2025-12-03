// ============================================
// PROTOCOL OS - REST API KEY UTILITIES
// ============================================
// Address: 1.4.6.b
// Purpose: Utility functions for API key authentication
// ============================================

/**
 * Common API key header names
 */
export const COMMON_API_KEY_HEADERS = {
  X_API_KEY: 'X-API-Key',
  AUTHORIZATION: 'Authorization',
  API_KEY: 'Api-Key',
  X_AUTH_TOKEN: 'X-Auth-Token',
  ACCESS_TOKEN: 'Access-Token',
} as const;

/**
 * API key prefix patterns
 */
export const API_KEY_PREFIXES = {
  BEARER: 'Bearer ',
  TOKEN: 'Token ',
  API_KEY: 'ApiKey ',
  BASIC: 'Basic ',
} as const;

/**
 * Build API key header
 */
export function buildApiKeyHeader(
  keyName: string,
  apiKey: string,
  prefix?: string
): Record<string, string> {
  const value = prefix ? `${prefix}${apiKey}` : apiKey;
  return { [keyName]: value };
}

/**
 * Add API key to URL query params
 */
export function addApiKeyToQuery(url: string, keyName: string, apiKey: string): string {
  const urlObj = new URL(url);
  urlObj.searchParams.set(keyName, apiKey);
  return urlObj.toString();
}

/**
 * Mask API key for display
 */
export function maskApiKey(apiKey: string, visibleChars: number = 4): string {
  if (apiKey.length <= visibleChars * 2) {
    return '*'.repeat(apiKey.length);
  }
  
  const start = apiKey.substring(0, visibleChars);
  const end = apiKey.substring(apiKey.length - visibleChars);
  const masked = '*'.repeat(apiKey.length - visibleChars * 2);
  
  return `${start}${masked}${end}`;
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey: string, options?: {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}): { valid: boolean; reason?: string } {
  const { minLength = 8, maxLength = 256, pattern } = options || {};
  
  if (apiKey.length < minLength) {
    return { valid: false, reason: `API key must be at least ${minLength} characters` };
  }
  
  if (apiKey.length > maxLength) {
    return { valid: false, reason: `API key must not exceed ${maxLength} characters` };
  }
  
  if (pattern && !pattern.test(apiKey)) {
    return { valid: false, reason: 'API key format is invalid' };
  }
  
  return { valid: true };
}
