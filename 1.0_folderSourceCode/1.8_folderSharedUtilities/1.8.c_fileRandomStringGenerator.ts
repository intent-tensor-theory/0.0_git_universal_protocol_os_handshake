// ============================================
// PROTOCOL OS - RANDOM STRING GENERATOR
// ============================================
// Address: 1.8.c
// Purpose: Generate cryptographically secure random strings
// ============================================

/**
 * Character sets for different random string purposes
 */
export const CHARACTER_SETS = {
  /** URL-safe characters for PKCE (RFC 7636) */
  PKCE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~',
  
  /** Alphanumeric only */
  ALPHANUMERIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  
  /** Uppercase alphanumeric (for serial numbers) */
  ALPHANUMERIC_UPPER: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  
  /** Lowercase alphanumeric */
  ALPHANUMERIC_LOWER: 'abcdefghijklmnopqrstuvwxyz0123456789',
  
  /** Hexadecimal characters */
  HEX: '0123456789abcdef',
  
  /** Uppercase hex */
  HEX_UPPER: '0123456789ABCDEF',
  
  /** Numeric only */
  NUMERIC: '0123456789',
  
  /** URL-safe base64 characters */
  BASE64_URL: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  
  /** Full ASCII printable (for strong passwords) */
  ASCII_PRINTABLE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

export type CharacterSetName = keyof typeof CHARACTER_SETS;

/**
 * Generate a cryptographically secure random string
 * 
 * @param length - Desired length of the string
 * @param charset - Character set to use (default: ALPHANUMERIC)
 * @returns Random string of specified length
 * 
 * @example
 * ```typescript
 * // Generate a random 32-character alphanumeric string
 * const token = generateRandomString(32);
 * 
 * // Generate a PKCE code verifier (128 chars recommended)
 * const verifier = generateRandomString(128, 'PKCE');
 * 
 * // Generate a 6-digit numeric code
 * const code = generateRandomString(6, 'NUMERIC');
 * ```
 */
export function generateRandomString(
  length: number,
  charset: CharacterSetName | string = 'ALPHANUMERIC'
): string {
  if (length <= 0) {
    throw new Error('Length must be a positive number');
  }

  // Get the character set
  const characters = typeof charset === 'string' && charset in CHARACTER_SETS
    ? CHARACTER_SETS[charset as CharacterSetName]
    : (typeof charset === 'string' ? charset : CHARACTER_SETS.ALPHANUMERIC);

  if (!characters || characters.length === 0) {
    throw new Error('Character set cannot be empty');
  }

  // Generate cryptographically secure random values
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);

  // Build the random string
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters[randomValues[i] % characters.length];
  }

  return result;
}

/**
 * Generate a PKCE code verifier
 * RFC 7636 specifies 43-128 characters from the unreserved character set
 * 
 * @param length - Length of verifier (default: 128, min: 43, max: 128)
 * @returns PKCE-compliant code verifier
 * 
 * @example
 * ```typescript
 * const verifier = generatePkceVerifier();
 * // Store this and use to generate challenge
 * ```
 */
export function generatePkceVerifier(length: number = 128): string {
  if (length < 43 || length > 128) {
    throw new Error('PKCE verifier must be between 43 and 128 characters');
  }
  
  return generateRandomString(length, 'PKCE');
}

/**
 * Generate a state parameter for OAuth flows
 * Used to prevent CSRF attacks
 * 
 * @param length - Length of state (default: 32)
 * @returns Random state string
 */
export function generateOAuthState(length: number = 32): string {
  return generateRandomString(length, 'BASE64_URL');
}

/**
 * Generate a nonce for security tokens
 * 
 * @param length - Length of nonce (default: 32)
 * @returns Random nonce string
 */
export function generateNonce(length: number = 32): string {
  return generateRandomString(length, 'BASE64_URL');
}

/**
 * Generate a serial number segment
 * Format: XXXX (4 uppercase alphanumeric characters)
 * 
 * @param length - Length of serial segment (default: 4)
 * @returns Random serial segment
 * 
 * @example
 * ```typescript
 * const segment = generateSerialSegment();
 * // Returns something like: '7X4F'
 * ```
 */
export function generateSerialSegment(length: number = 4): string {
  return generateRandomString(length, 'ALPHANUMERIC_UPPER');
}

/**
 * Generate a complete serial number with prefix
 * 
 * @param prefix - Prefix for the serial (e.g., 'PLAT', 'RES', 'HS')
 * @param segmentLength - Length of random segment (default: 4)
 * @returns Formatted serial number
 * 
 * @example
 * ```typescript
 * const serial = generateSerialNumber('PLAT-MASTER');
 * // Returns: 'PLAT-MASTER-7X4F'
 * 
 * const resSerial = generateSerialNumber('RES');
 * // Returns: 'RES-2B9K'
 * ```
 */
export function generateSerialNumber(prefix: string, segmentLength: number = 4): string {
  const segment = generateSerialSegment(segmentLength);
  return `${prefix}-${segment}`;
}

/**
 * Generate a unique serial number that doesn't exist in the given set
 * 
 * @param prefix - Prefix for the serial
 * @param existingSerials - Array of existing serials to avoid
 * @param maxAttempts - Maximum attempts before throwing (default: 100)
 * @returns Unique serial number
 */
export function generateUniqueSerialNumber(
  prefix: string,
  existingSerials: string[],
  maxAttempts: number = 100
): string {
  const existingSet = new Set(existingSerials);
  
  for (let i = 0; i < maxAttempts; i++) {
    const serial = generateSerialNumber(prefix);
    if (!existingSet.has(serial)) {
      return serial;
    }
  }
  
  throw new Error(`Failed to generate unique serial after ${maxAttempts} attempts`);
}

/**
 * Generate a random hex string
 * 
 * @param length - Length in characters (not bytes)
 * @returns Random hex string
 */
export function generateRandomHex(length: number): string {
  return generateRandomString(length, 'HEX');
}

/**
 * Generate random bytes and return as Uint8Array
 * 
 * @param length - Number of bytes
 * @returns Random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generate a random integer within a range
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer in range
 */
export function generateRandomInt(min: number, max: number): number {
  if (min >= max) {
    throw new Error('Min must be less than max');
  }
  
  const range = max - min + 1;
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  
  return min + (randomValues[0] % range);
}

/**
 * Generate a temporary token with expiration encoding
 * Format: {random}_{timestamp}
 * 
 * @param length - Length of random portion (default: 32)
 * @returns Token with embedded timestamp
 */
export function generateTemporaryToken(length: number = 32): string {
  const random = generateRandomString(length, 'BASE64_URL');
  const timestamp = Date.now().toString(36);
  return `${random}_${timestamp}`;
}

/**
 * Parse a temporary token to extract timestamp
 * 
 * @param token - The temporary token
 * @returns Timestamp in milliseconds, or null if invalid
 */
export function parseTemporaryToken(token: string): number | null {
  const parts = token.split('_');
  if (parts.length !== 2) return null;
  
  const timestamp = parseInt(parts[1], 36);
  return isNaN(timestamp) ? null : timestamp;
}

/**
 * Check if a temporary token has expired
 * 
 * @param token - The temporary token
 * @param maxAgeMs - Maximum age in milliseconds
 * @returns True if expired or invalid
 */
export function isTemporaryTokenExpired(token: string, maxAgeMs: number): boolean {
  const timestamp = parseTemporaryToken(token);
  if (timestamp === null) return true;
  
  return Date.now() - timestamp > maxAgeMs;
}
