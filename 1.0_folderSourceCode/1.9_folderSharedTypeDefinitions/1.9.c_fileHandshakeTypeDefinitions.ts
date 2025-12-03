// ============================================
// PROTOCOL OS - HANDSHAKE TYPE DEFINITIONS
// ============================================
// Address: 1.9.c
// Purpose: Define Handshake entity types (leaf node of hierarchy)
// ============================================

import type { Authentication } from './1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from './1.9.e_fileCurlRequestTypeDefinitions';
import type { SchemaModel } from './1.9.f_fileSchemaModelTypeDefinitions';
import type { PromotedAction } from './1.9.g_filePromotedActionTypeDefinitions';

/**
 * Handshake status indicates the current state of configuration/health
 */
export type HandshakeStatus = 
  | 'unconfigured'  // Initial state, needs setup
  | 'configured'    // Has valid configuration
  | 'healthy'       // Successfully executed recently
  | 'failed'        // Last execution failed
  | 'processing';   // Currently executing

/**
 * Handshake represents a specific API configuration with authentication.
 * This is where the actual protocol execution happens.
 * 
 * Serial Format: HS-XXXX
 * Full Chain: PLAT-XXXX-RES-XXXX-HS-XXXX
 */
export interface Handshake {
  /** Unique identifier (UUID format) */
  id: string;
  
  /** 
   * Contiguous serial number segment.
   * Format: HS-XXXX (combines with parent chain)
   */
  serial: string;
  
  /** Display name for this handshake endpoint */
  endpointName: string;
  
  /** Authentication configuration for this handshake */
  authentication: Authentication;
  
  /** 
   * cURL request templates for this handshake.
   * Mutually exclusive with schemaModels - use one or the other.
   */
  curlRequests: CurlRequest[];
  
  /** 
   * Schema model definitions for structured input.
   * Mutually exclusive with curlRequests - use one or the other.
   */
  schemaModels: SchemaModel[];
  
  /** Promoted/quick actions for this handshake */
  promotedActions: PromotedAction[];
  
  /** Current status of this handshake */
  status: HandshakeStatus;
}

/**
 * Partial Handshake for updates - all fields optional except id
 */
export type HandshakeUpdate = Partial<Omit<Handshake, 'id'>> & { id: string };

/**
 * Handshake creation payload - id and serial are auto-generated
 */
export type HandshakeCreate = Omit<
  Handshake, 
  'id' | 'serial' | 'curlRequests' | 'schemaModels' | 'promotedActions' | 'status'
>;

/**
 * Handshake with resolved full serial chain (for display)
 */
export interface HandshakeWithFullSerial extends Handshake {
  /** Full serial including all parent levels */
  fullSerial: string;
  
  /** Parent resource ID */
  parentResourceId: string;
  
  /** Grandparent platform ID */
  grandparentPlatformId: string;
}

/**
 * Default values for new Handshake creation
 */
export const DEFAULT_HANDSHAKE: Omit<Handshake, 'id' | 'serial'> = {
  endpointName: 'New API Handshake',
  authentication: { type: 'Select an authentication type...' },
  curlRequests: [],
  schemaModels: [],
  promotedActions: [],
  status: 'unconfigured',
};

/**
 * Handshake lookup result with full parent context
 */
export interface HandshakeLookupResult {
  handshake: Handshake;
  parentResourceId: string;
  parentResourceSerial: string;
  grandparentPlatformId: string;
  grandparentPlatformSerial: string;
  isArchived: boolean;
}

/**
 * EKG indicator state mapping for handshake status
 */
export const HANDSHAKE_STATUS_TO_EKG: Record<HandshakeStatus, string> = {
  unconfigured: 'ekg-unconfigured',
  configured: 'ekg-unconfigured', // Shows blue, needs first run
  healthy: 'ekg-healthy',
  failed: 'ekg-failed',
  processing: 'ekg-throbbing',
};
