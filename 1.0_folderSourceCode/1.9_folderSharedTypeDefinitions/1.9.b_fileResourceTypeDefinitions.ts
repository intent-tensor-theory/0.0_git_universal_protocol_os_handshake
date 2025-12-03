// ============================================
// PROTOCOL OS - RESOURCE TYPE DEFINITIONS
// ============================================
// Address: 1.9.b
// Purpose: Define ApiResource entity types (middle layer of hierarchy)
// ============================================

import type { Handshake } from './1.9.c_fileHandshakeTypeDefinitions';

/**
 * ApiResource represents a specific API or service within a Platform.
 * Examples: "Calendar API", "Gmail API", "S3 Bucket Operations"
 * 
 * Serial Format: RES-XXXX
 * Full Chain: PLAT-XXXX-RES-XXXX
 */
export interface ApiResource {
  /** Unique identifier (UUID format) */
  id: string;
  
  /** 
   * Contiguous serial number segment.
   * Format: RES-XXXX (combines with parent platform serial)
   */
  serial: string;
  
  /** Display title of the API resource */
  title: string;
  
  /** Endpoint URL for this specific resource */
  url: string;
  
  /** Description of what this resource provides */
  description: string;
  
  /** URL to the resource's specific documentation */
  doc_url: string;
  
  /** Additional notes about usage, rate limits, etc. */
  notes: string;
  
  /** Child handshakes (specific API configurations) for this resource */
  handshakes: Handshake[];
}

/**
 * Partial ApiResource for updates - all fields optional except id
 */
export type ApiResourceUpdate = Partial<Omit<ApiResource, 'id'>> & { id: string };

/**
 * ApiResource creation payload - id and serial are auto-generated
 */
export type ApiResourceCreate = Omit<ApiResource, 'id' | 'serial' | 'handshakes'>;

/**
 * ApiResource with resolved full serial chain (for display)
 */
export interface ApiResourceWithFullSerial extends ApiResource {
  /** Full serial including parent platform */
  fullSerial: string;
  
  /** Parent platform ID for chain resolution */
  parentPlatformId: string;
}

/**
 * Default values for new ApiResource creation
 */
export const DEFAULT_API_RESOURCE: Omit<ApiResource, 'id' | 'serial'> = {
  title: 'Untitled API Resource',
  url: '',
  description: '',
  doc_url: '',
  notes: '',
  handshakes: [],
};

/**
 * Resource lookup result with parent context
 */
export interface ApiResourceLookupResult {
  resource: ApiResource;
  parentPlatformId: string;
  parentPlatformSerial: string;
  isArchived: boolean;
}
