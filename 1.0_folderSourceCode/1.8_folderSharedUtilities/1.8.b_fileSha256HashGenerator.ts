// ============================================
// PROTOCOL OS - SHA256 HASH GENERATOR
// ============================================
// Address: 1.8.b
// Purpose: Generate SHA256 hashes for PKCE and other crypto operations
// ============================================

/**
 * Generate a SHA256 hash of the input string
 * Returns the hash as a base64url encoded string (required for PKCE)
 * 
 * @param input - The string to hash
 * @returns Base64url encoded SHA256 hash
 * 
 * @example
 * ```typescript
 * const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
 * const challenge = await generateSha256Hash(verifier);
 * // Returns: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
 * ```
 */
export async function generateSha256Hash(input: string): Promise<string> {
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Generate SHA256 hash using Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url encoding (required for PKCE)
  return arrayBufferToBase64Url(hashBuffer);
}

/**
 * Generate a SHA256 hash and return as hex string
 * 
 * @param input - The string to hash
 * @returns Hex encoded SHA256 hash
 * 
 * @example
 * ```typescript
 * const hash = await generateSha256HashHex('hello');
 * // Returns: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
 * ```
 */
export async function generateSha256HashHex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  return arrayBufferToHex(hashBuffer);
}

/**
 * Generate a SHA256 hash and return as base64 (standard, not URL-safe)
 * 
 * @param input - The string to hash
 * @returns Standard base64 encoded SHA256 hash
 */
export async function generateSha256HashBase64(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Generate PKCE code challenge from code verifier
 * This is a convenience wrapper specifically for OAuth PKCE flow
 * 
 * @param codeVerifier - The code verifier string (43-128 characters)
 * @returns Base64url encoded code challenge
 * 
 * @example
 * ```typescript
 * const verifier = generateRandomString(128);
 * const challenge = await generatePkceCodeChallenge(verifier);
 * 
 * // Use in OAuth authorization URL:
 * // ?code_challenge=${challenge}&code_challenge_method=S256
 * ```
 */
export async function generatePkceCodeChallenge(codeVerifier: string): Promise<string> {
  // Validate code verifier length (RFC 7636 requirement)
  if (codeVerifier.length < 43 || codeVerifier.length > 128) {
    throw new Error('Code verifier must be between 43 and 128 characters');
  }
  
  return generateSha256Hash(codeVerifier);
}

/**
 * Generate HMAC-SHA256 signature
 * 
 * @param message - The message to sign
 * @param secret - The secret key
 * @returns Base64 encoded HMAC-SHA256 signature
 */
export async function generateHmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  // Import the secret as a crypto key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Generate the signature
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  
  return arrayBufferToBase64(signature);
}

/**
 * Verify HMAC-SHA256 signature
 * 
 * @param message - The original message
 * @param signature - The signature to verify (base64 encoded)
 * @param secret - The secret key
 * @returns True if signature is valid
 */
export async function verifyHmacSha256(
  message: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await generateHmacSha256(message, secret);
  return constantTimeCompare(signature, expectedSignature);
}

/**
 * Convert ArrayBuffer to base64url string (URL-safe base64)
 * Required for PKCE code challenge
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  // Convert to base64
  const base64 = btoa(binary);
  
  // Convert to base64url (replace + with -, / with _, remove =)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Convert ArrayBuffer to standard base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Hash a password with a salt using SHA256
 * Note: For production, use bcrypt or Argon2 instead
 * 
 * @param password - The password to hash
 * @param salt - The salt to use
 * @returns Hex encoded salted hash
 */
export async function hashPasswordSha256(password: string, salt: string): Promise<string> {
  const saltedPassword = `${salt}${password}`;
  return generateSha256HashHex(saltedPassword);
}

/**
 * Generate a hash suitable for integrity checking
 * 
 * @param content - The content to hash
 * @returns SRI-compatible hash string
 */
export async function generateIntegrityHash(content: string): Promise<string> {
  const hash = await generateSha256HashBase64(content);
  return `sha256-${hash}`;
}
