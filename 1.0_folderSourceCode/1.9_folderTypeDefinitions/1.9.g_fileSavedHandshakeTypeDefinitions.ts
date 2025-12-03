// ============================================
// PROTOCOL OS - SAVED HANDSHAKE TYPE DEFINITIONS
// ============================================
// Address: 1.9.g
// Purpose: Types for saved handshake snapshots
// ============================================

import type { EntityId } from './1.9.a_fileCoreTypeDefinitions';
import type { ProtocolType, AuthenticationConfig } from './1.9.f_fileHandshakeTypeDefinitions';
import type { CurlRequest } from './1.9.e_fileCurlRequestTypeDefinitions';

/**
 * Saved handshake snapshot
 */
export interface SavedHandshake {
  /** Unique identifier */
  id: EntityId;
  
  /** Base name identifier (kebab-case, from resource) */
  baseName: string;
  
  /** Version serial number */
  serial: number;
  
  /** Display title */
  title: string;
  
  /** Brief description */
  description?: string;
  
  /** Protocol type */
  protocolType: ProtocolType;
  
  /** Authentication configuration snapshot */
  authenticationConfig: AuthenticationConfig;
  
  /** cURL requests snapshot */
  curlRequests?: CurlRequest[];
  
  /** Whether this is the master version */
  isMaster?: boolean;
  
  /** Timestamp when saved */
  savedAt: string;
  
  /** User who saved (if tracked) */
  savedBy?: string;
  
  /** Tags for filtering */
  tags?: string[];
  
  /** Notes about this version */
  notes?: string;
  
  /** Source handshake ID (reference) */
  sourceHandshakeId?: EntityId;
  
  /** Source resource ID (reference) */
  sourceResourceId?: EntityId;
  
  /** Source platform ID (reference) */
  sourcePlatformId?: EntityId;
  
  /** Checksum for integrity */
  checksum?: string;
}

/**
 * Saved handshake creation input
 */
export type SavedHandshakeCreateInput = Omit<SavedHandshake, 'id' | 'savedAt' | 'serial'>;

/**
 * Saved handshake summary
 */
export interface SavedHandshakeSummary {
  id: EntityId;
  baseName: string;
  serial: number;
  title: string;
  protocolType: ProtocolType;
  savedAt: string;
  isMaster?: boolean;
  requestCount: number;
}

/**
 * Saved handshake version info
 */
export interface SavedHandshakeVersion {
  id: EntityId;
  serial: number;
  savedAt: string;
  savedBy?: string;
  notes?: string;
  isMaster: boolean;
}

/**
 * Saved handshake with version history
 */
export interface SavedHandshakeWithVersions extends SavedHandshake {
  versions: SavedHandshakeVersion[];
  latestSerial: number;
  masterSerial?: number;
}

/**
 * Comparison between two saved handshakes
 */
export interface SavedHandshakeComparison {
  baseId: EntityId;
  compareId: EntityId;
  differences: Array<{
    path: string;
    type: 'added' | 'removed' | 'modified';
    baseValue?: unknown;
    compareValue?: unknown;
  }>;
  identical: boolean;
}

/**
 * Saved handshake filter options
 */
export interface SavedHandshakeFilterOptions {
  search?: string;
  baseName?: string;
  protocolType?: ProtocolType;
  isMaster?: boolean;
  tags?: string[];
  savedAfter?: string;
  savedBefore?: string;
  savedBy?: string;
}

/**
 * Saved handshake sort options
 */
export interface SavedHandshakeSortOptions {
  field: 'savedAt' | 'serial' | 'title' | 'baseName';
  direction: 'asc' | 'desc';
}

/**
 * Saved handshake export format
 */
export interface SavedHandshakeExport {
  version: string;
  exportedAt: string;
  handshakes: SavedHandshake[];
  metadata?: {
    source?: string;
    count: number;
  };
}

/**
 * Saved handshake import result
 */
export interface SavedHandshakeImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
}
