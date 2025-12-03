// ============================================
// PROTOCOL OS - UUID GENERATOR
// ============================================
// Address: 1.8.d
// Purpose: Generate UUIDs for entity identification
// ============================================

/**
 * UUID version types
 */
export type UuidVersion = 'v4' | 'v7';

/**
 * Generate a UUID v4 (random)
 * Uses crypto.randomUUID when available, falls back to manual generation
 * 
 * @returns UUID v4 string (e.g., '550e8400-e29b-41d4-a716-446655440000')
 * 
 * @example
 * ```typescript
 * const id = generateUuidV4();
 * // Returns: '550e8400-e29b-41d4-a716-446655440000'
 * ```
 */
export function generateUuidV4(): string {
  // Use native crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback to manual generation
  return manualUuidV4();
}

/**
 * Manual UUID v4 generation for environments without crypto.randomUUID
 */
function manualUuidV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  // Set version (4) and variant (RFC 4122)
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC 4122
  
  // Convert to hex string with dashes
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Generate a UUID v7 (time-ordered)
 * Contains a timestamp for natural sorting
 * 
 * @returns UUID v7 string
 * 
 * @example
 * ```typescript
 * const id1 = generateUuidV7();
 * const id2 = generateUuidV7();
 * // id2 > id1 when compared as strings (time-ordered)
 * ```
 */
export function generateUuidV7(): string {
  const bytes = new Uint8Array(16);
  
  // Get current timestamp in milliseconds
  const timestamp = BigInt(Date.now());
  
  // Fill first 48 bits (6 bytes) with timestamp
  bytes[0] = Number((timestamp >> 40n) & 0xffn);
  bytes[1] = Number((timestamp >> 32n) & 0xffn);
  bytes[2] = Number((timestamp >> 24n) & 0xffn);
  bytes[3] = Number((timestamp >> 16n) & 0xffn);
  bytes[4] = Number((timestamp >> 8n) & 0xffn);
  bytes[5] = Number(timestamp & 0xffn);
  
  // Fill remaining 10 bytes with random data
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  bytes.set(randomBytes, 6);
  
  // Set version (7) and variant (RFC 4122)
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // Version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant RFC 4122
  
  // Convert to hex string with dashes
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Generate a UUID of specified version
 * 
 * @param version - UUID version ('v4' or 'v7')
 * @returns UUID string
 */
export function generateUuid(version: UuidVersion = 'v4'): string {
  switch (version) {
    case 'v4':
      return generateUuidV4();
    case 'v7':
      return generateUuidV7();
    default:
      return generateUuidV4();
  }
}

/**
 * Validate a UUID string
 * 
 * @param uuid - String to validate
 * @returns True if valid UUID format
 * 
 * @example
 * ```typescript
 * isValidUuid('550e8400-e29b-41d4-a716-446655440000'); // true
 * isValidUuid('not-a-uuid'); // false
 * ```
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Extract version from a UUID
 * 
 * @param uuid - UUID string
 * @returns Version number (1-7) or null if invalid
 */
export function getUuidVersion(uuid: string): number | null {
  if (!isValidUuid(uuid)) return null;
  
  // Version is in the first nibble of the 7th byte (13th character after removing dashes)
  const versionChar = uuid.charAt(14);
  const version = parseInt(versionChar, 16);
  
  return version >= 1 && version <= 7 ? version : null;
}

/**
 * Extract timestamp from UUID v7
 * 
 * @param uuid - UUID v7 string
 * @returns Date object or null if not a v7 UUID
 */
export function extractUuidV7Timestamp(uuid: string): Date | null {
  if (getUuidVersion(uuid) !== 7) return null;
  
  // Remove dashes and get first 12 hex chars (48 bits = 6 bytes)
  const hex = uuid.replace(/-/g, '').slice(0, 12);
  const timestamp = parseInt(hex, 16);
  
  return new Date(timestamp);
}

/**
 * Generate a short ID (first segment of UUID)
 * Useful for display purposes
 * 
 * @returns 8-character hex string
 */
export function generateShortId(): string {
  return generateUuidV4().split('-')[0];
}

/**
 * Generate a prefixed ID for specific entity types
 * 
 * @param prefix - Entity type prefix
 * @returns Prefixed UUID
 * 
 * @example
 * ```typescript
 * generatePrefixedId('platform'); // 'platform_550e8400-e29b-41d4-a716-446655440000'
 * generatePrefixedId('handshake'); // 'handshake_7c9e6679-7425-40de-944b-e07fc1f90ae7'
 * ```
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${generateUuidV4()}`;
}

/**
 * Parse a prefixed ID to extract prefix and UUID
 * 
 * @param prefixedId - Prefixed ID string
 * @returns Object with prefix and uuid, or null if invalid
 */
export function parsePrefixedId(prefixedId: string): { prefix: string; uuid: string } | null {
  const underscoreIndex = prefixedId.indexOf('_');
  if (underscoreIndex === -1) return null;
  
  const prefix = prefixedId.slice(0, underscoreIndex);
  const uuid = prefixedId.slice(underscoreIndex + 1);
  
  if (!isValidUuid(uuid)) return null;
  
  return { prefix, uuid };
}

/**
 * Generate entity-specific IDs used in Protocol OS
 */
export const EntityIdGenerator = {
  /** Generate a Platform ID */
  platform: () => generatePrefixedId('platform'),
  
  /** Generate a Resource ID */
  resource: () => generatePrefixedId('resource'),
  
  /** Generate a Handshake ID */
  handshake: () => generatePrefixedId('handshake'),
  
  /** Generate a CurlRequest ID */
  curlRequest: () => generatePrefixedId('curl'),
  
  /** Generate a SchemaModel ID */
  schemaModel: () => generatePrefixedId('model'),
  
  /** Generate a PromotedAction ID */
  promotedAction: () => generatePrefixedId('promo'),
  
  /** Generate a SavedHandshake ID */
  savedHandshake: () => generatePrefixedId('saved'),
};

/**
 * Compare two UUIDs (useful for sorting)
 * For v7 UUIDs, this provides chronological ordering
 * 
 * @param a - First UUID
 * @param b - Second UUID
 * @returns -1, 0, or 1 for sorting
 */
export function compareUuids(a: string, b: string): number {
  return a.localeCompare(b);
}

/**
 * Generate a batch of UUIDs
 * 
 * @param count - Number of UUIDs to generate
 * @param version - UUID version
 * @returns Array of UUIDs
 */
export function generateUuidBatch(count: number, version: UuidVersion = 'v4'): string[] {
  return Array.from({ length: count }, () => generateUuid(version));
}
