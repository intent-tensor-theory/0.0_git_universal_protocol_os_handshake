// ============================================
// PROTOCOL OS - OAUTH PKCE CODE CHALLENGE GENERATOR
// ============================================
// Address: 1.3.2.d
// Purpose: Cryptographic utilities for PKCE code verifier and challenge generation
// ============================================

/**
 * PKCE Code Verifier requirements (RFC 7636):
 * - Length: 43-128 characters
 * - Characters: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
 * - Entropy: Minimum 256 bits (32 bytes)
 */

/**
 * Characters allowed in code verifier (RFC 7636)
 */
const CODE_VERIFIER_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/**
 * Default code verifier length (43 characters minimum per RFC 7636)
 */
const DEFAULT_VERIFIER_LENGTH = 43;

/**
 * Maximum code verifier length (128 characters per RFC 7636)
 */
const MAX_VERIFIER_LENGTH = 128;

/**
 * State parameter expiration time (10 minutes)
 */
const STATE_EXPIRATION_MS = 10 * 60 * 1000;

/**
 * Convert Uint8Array to Base64-URL encoded string
 * 
 * Base64-URL encoding is Base64 with:
 * - '+' replaced with '-'
 * - '/' replaced with '_'
 * - Padding ('=') removed
 * 
 * @param buffer - Byte array to encode
 * @returns Base64-URL encoded string
 */
export function base64UrlEncode(buffer: Uint8Array): string {
  // Convert bytes to string
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  
  // Base64 encode
  const base64 = btoa(binary);
  
  // Convert to URL-safe format
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decode Base64-URL encoded string to Uint8Array
 * 
 * @param str - Base64-URL encoded string
 * @returns Decoded byte array
 */
export function base64UrlDecode(str: string): Uint8Array {
  // Add padding if needed
  let padded = str;
  const padding = str.length % 4;
  if (padding) {
    padded += '='.repeat(4 - padding);
  }
  
  // Convert from URL-safe format
  const base64 = padded
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Decode
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return bytes;
}

/**
 * Generate cryptographically secure random bytes
 * 
 * @param length - Number of bytes to generate
 * @returns Uint8Array of random bytes
 */
export function getRandomBytes(length: number): Uint8Array {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return buffer;
}

/**
 * Generate a code verifier for PKCE
 * 
 * Creates a high-entropy random string that meets RFC 7636 requirements.
 * The verifier is used as the "secret" in the PKCE flow - it's kept
 * local to the client and sent during token exchange.
 * 
 * @param length - Length of verifier (43-128, default 43)
 * @returns Code verifier string
 * 
 * @example
 * ```ts
 * const verifier = generateCodeVerifier();
 * // => "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
 * ```
 */
export function generateCodeVerifier(length: number = DEFAULT_VERIFIER_LENGTH): string {
  // Validate length
  if (length < 43 || length > MAX_VERIFIER_LENGTH) {
    throw new Error(`Code verifier length must be between 43 and ${MAX_VERIFIER_LENGTH}`);
  }

  // Generate random bytes
  // We need more bytes than characters because of charset mapping
  const randomBytes = getRandomBytes(length);
  
  // Map bytes to charset
  let verifier = '';
  for (let i = 0; i < length; i++) {
    verifier += CODE_VERIFIER_CHARSET[randomBytes[i] % CODE_VERIFIER_CHARSET.length];
  }
  
  return verifier;
}

/**
 * Generate a code verifier using raw bytes (higher entropy)
 * 
 * This method generates 32 bytes (256 bits) of randomness and
 * Base64-URL encodes them, resulting in a 43-character verifier.
 * 
 * @returns Code verifier string (43 characters)
 */
export function generateCodeVerifierFromBytes(): string {
  const randomBytes = getRandomBytes(32); // 256 bits
  return base64UrlEncode(randomBytes);
}

/**
 * Generate a code challenge from a code verifier using S256 method
 * 
 * The code challenge is SHA-256(code_verifier), Base64-URL encoded.
 * This is sent to the authorization endpoint, while the verifier
 * is kept secret until token exchange.
 * 
 * @param verifier - The code verifier string
 * @returns Promise resolving to the code challenge string
 * 
 * @example
 * ```ts
 * const verifier = generateCodeVerifier();
 * const challenge = await generateCodeChallenge(verifier);
 * // => "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
 * ```
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  // Encode verifier to bytes
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  
  // SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Base64-URL encode
  return base64UrlEncode(new Uint8Array(hashBuffer));
}

/**
 * Generate a code challenge using plain method (NOT RECOMMENDED)
 * 
 * In plain method, the challenge equals the verifier.
 * This should only be used if the provider doesn't support S256.
 * 
 * @param verifier - The code verifier string
 * @returns The code challenge (same as verifier)
 */
export function generateCodeChallengePlain(verifier: string): string {
  return verifier;
}

/**
 * Generate both code verifier and challenge in one call
 * 
 * Convenience function that generates and returns both PKCE values.
 * 
 * @param length - Verifier length (default 43)
 * @returns Promise resolving to { verifier, challenge, method }
 * 
 * @example
 * ```ts
 * const pkce = await generatePkceValues();
 * console.log(pkce.verifier);  // Keep secret
 * console.log(pkce.challenge); // Send to /authorize
 * console.log(pkce.method);    // "S256"
 * ```
 */
export async function generatePkceValues(length: number = DEFAULT_VERIFIER_LENGTH): Promise<{
  verifier: string;
  challenge: string;
  method: 'S256';
}> {
  const verifier = generateCodeVerifier(length);
  const challenge = await generateCodeChallenge(verifier);
  
  return {
    verifier,
    challenge,
    method: 'S256',
  };
}

/**
 * Validate a code verifier format
 * 
 * Checks if a string meets RFC 7636 code verifier requirements.
 * 
 * @param verifier - String to validate
 * @returns Validation result with any error message
 */
export function validateCodeVerifier(verifier: string): {
  valid: boolean;
  error?: string;
} {
  if (!verifier) {
    return { valid: false, error: 'Code verifier is required' };
  }
  
  if (verifier.length < 43) {
    return { valid: false, error: 'Code verifier must be at least 43 characters' };
  }
  
  if (verifier.length > MAX_VERIFIER_LENGTH) {
    return { valid: false, error: `Code verifier must be at most ${MAX_VERIFIER_LENGTH} characters` };
  }
  
  // Check charset
  const validChars = /^[A-Za-z0-9\-._~]+$/;
  if (!validChars.test(verifier)) {
    return { valid: false, error: 'Code verifier contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Generate a state parameter for CSRF protection
 * 
 * The state parameter is used to prevent CSRF attacks during OAuth flow.
 * It contains:
 * - A random nonce
 * - A timestamp for expiration checking
 * - Optional custom data
 * 
 * @param customData - Optional data to include in state
 * @returns Base64-URL encoded state string
 * 
 * @example
 * ```ts
 * const state = generateState();
 * // Store state locally before redirect
 * sessionStorage.setItem('oauth_state', state);
 * 
 * // With custom data
 * const state = generateState({ returnTo: '/dashboard' });
 * ```
 */
export function generateState(customData?: Record<string, unknown>): string {
  const nonce = base64UrlEncode(getRandomBytes(16));
  
  const stateData = {
    nonce,
    ts: Date.now(),
    ...customData,
  };
  
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(stateData)));
}

/**
 * Parse a state parameter
 * 
 * @param state - Base64-URL encoded state string
 * @returns Parsed state data or null if invalid
 */
export function parseState(state: string): {
  nonce: string;
  ts: number;
  [key: string]: unknown;
} | null {
  try {
    const decoded = new TextDecoder().decode(base64UrlDecode(state));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Validate a state parameter
 * 
 * Checks if:
 * - The received state matches the stored state
 * - The state hasn't expired
 * 
 * @param received - State received in callback
 * @param stored - State stored before redirect
 * @param maxAgeMs - Maximum age in milliseconds (default 10 minutes)
 * @returns Validation result with any error and parsed data
 */
export function validateState(
  received: string,
  stored: string,
  maxAgeMs: number = STATE_EXPIRATION_MS
): {
  valid: boolean;
  error?: string;
  data?: Record<string, unknown>;
} {
  // Check if states match
  if (received !== stored) {
    return { 
      valid: false, 
      error: 'State mismatch - possible CSRF attack' 
    };
  }
  
  // Parse and check expiration
  const parsed = parseState(received);
  if (!parsed) {
    return { 
      valid: false, 
      error: 'Invalid state format' 
    };
  }
  
  const age = Date.now() - parsed.ts;
  if (age > maxAgeMs) {
    return { 
      valid: false, 
      error: 'State expired' 
    };
  }
  
  return { 
    valid: true, 
    data: parsed 
  };
}

/**
 * Generate a nonce for OpenID Connect
 * 
 * The nonce is used to prevent replay attacks with ID tokens.
 * It should be stored and verified in the ID token claims.
 * 
 * @returns Nonce string
 */
export function generateNonce(): string {
  return base64UrlEncode(getRandomBytes(16));
}

/**
 * Verify that a code challenge matches a code verifier
 * 
 * This is typically done server-side, but can be useful for testing.
 * 
 * @param verifier - The original code verifier
 * @param challenge - The challenge to verify
 * @param method - Challenge method ('S256' or 'plain')
 * @returns Promise resolving to true if valid
 */
export async function verifyCodeChallenge(
  verifier: string,
  challenge: string,
  method: 'S256' | 'plain' = 'S256'
): Promise<boolean> {
  if (method === 'plain') {
    return verifier === challenge;
  }
  
  const computed = await generateCodeChallenge(verifier);
  return computed === challenge;
}

/**
 * PKCE flow state manager
 * 
 * Manages PKCE values during the OAuth flow, including storage
 * and retrieval between redirect and callback.
 */
export class PkceStateManager {
  private storageKey: string;
  private storage: Storage;

  constructor(storageKey: string = 'protocol_os_pkce', useSessionStorage: boolean = true) {
    this.storageKey = storageKey;
    this.storage = useSessionStorage ? sessionStorage : localStorage;
  }

  /**
   * Initialize PKCE flow - generate and store values
   */
  async initializeFlow(customStateData?: Record<string, unknown>): Promise<{
    verifier: string;
    challenge: string;
    state: string;
  }> {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState(customStateData);

    // Store verifier and state
    this.storage.setItem(this.storageKey, JSON.stringify({
      verifier,
      state,
      ts: Date.now(),
    }));

    return { verifier, challenge, state };
  }

  /**
   * Complete PKCE flow - retrieve stored values and clear
   */
  completeFlow(receivedState: string): {
    success: boolean;
    verifier?: string;
    error?: string;
    customData?: Record<string, unknown>;
  } {
    const storedJson = this.storage.getItem(this.storageKey);
    
    if (!storedJson) {
      return { success: false, error: 'No PKCE flow in progress' };
    }

    try {
      const stored = JSON.parse(storedJson);
      
      // Validate state
      const stateValidation = validateState(receivedState, stored.state);
      if (!stateValidation.valid) {
        this.clearFlow();
        return { success: false, error: stateValidation.error };
      }

      // Clear stored data
      this.clearFlow();

      return {
        success: true,
        verifier: stored.verifier,
        customData: stateValidation.data,
      };
    } catch {
      this.clearFlow();
      return { success: false, error: 'Failed to parse stored PKCE data' };
    }
  }

  /**
   * Clear stored PKCE data
   */
  clearFlow(): void {
    this.storage.removeItem(this.storageKey);
  }

  /**
   * Check if a flow is in progress
   */
  hasActiveFlow(): boolean {
    return this.storage.getItem(this.storageKey) !== null;
  }
}

/**
 * Create a singleton PKCE state manager
 */
let defaultPkceManager: PkceStateManager | null = null;

export function getPkceStateManager(): PkceStateManager {
  if (!defaultPkceManager) {
    defaultPkceManager = new PkceStateManager();
  }
  return defaultPkceManager;
}

// Export default for convenience
export default {
  generateCodeVerifier,
  generateCodeVerifierFromBytes,
  generateCodeChallenge,
  generateCodeChallengePlain,
  generatePkceValues,
  validateCodeVerifier,
  generateState,
  parseState,
  validateState,
  generateNonce,
  verifyCodeChallenge,
  base64UrlEncode,
  base64UrlDecode,
  PkceStateManager,
  getPkceStateManager,
};
