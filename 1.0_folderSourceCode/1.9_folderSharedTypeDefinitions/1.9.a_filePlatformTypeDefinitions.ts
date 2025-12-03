// ============================================
// PROTOCOL OS - PLATFORM TYPE DEFINITIONS
// ============================================
// Address: 1.9.a
// Purpose: Define Platform entity types for the hierarchy root
// ============================================

import type { ApiResource } from './1.9.b_fileResourceTypeDefinitions';

/**
 * Platform represents the top-level container in the hierarchy.
 * Examples: "Google APIs", "AWS Services", "Stripe"
 * 
 * Serial Format: PLAT-MASTER-XXXX or PLAT-XXXX
 */
export interface Platform {
  /** Unique identifier (UUID format) */
  id: string;
  
  /** 
   * Contiguous serial number segment.
   * Format: PLAT-MASTER-XXXX for master platforms, PLAT-XXXX for regular
   */
  serial: string;
  
  /** Display name of the platform */
  name: string;
  
  /** Base URL for the platform (e.g., https://api.google.com) */
  url: string;
  
  /** Description of the platform and its purpose */
  description: string;
  
  /** URL to the platform's official documentation */
  doc_url: string;
  
  /** Notes about authentication requirements or special considerations */
  auth_notes: string;
  
  /** Child API resources belonging to this platform */
  contributors: ApiResource[];
  
  /** 
   * Whether this is a master (primary) platform.
   * Master platforms are shown with green glow indicators.
   */
  isMaster: boolean;
}

/**
 * Partial Platform for updates - all fields optional except id
 */
export type PlatformUpdate = Partial<Omit<Platform, 'id'>> & { id: string };

/**
 * Platform creation payload - id and serial are auto-generated
 */
export type PlatformCreate = Omit<Platform, 'id' | 'serial' | 'contributors'>;

/**
 * Platform with resolved full serial chain (for display)
 */
export interface PlatformWithFullSerial extends Platform {
  fullSerial: string;
}

/**
 * Default values for new Platform creation
 */
export const DEFAULT_PLATFORM: Omit<Platform, 'id' | 'serial'> = {
  name: 'Untitled Platform',
  url: '',
  description: '',
  doc_url: '',
  auth_notes: '',
  contributors: [],
  isMaster: false,
};

/**
 * Default values for new Master Platform (archived section)
 */
export const DEFAULT_MASTER_PLATFORM: Omit<Platform, 'id' | 'serial'> = {
  name: 'Untitled Archived Master',
  url: '',
  description: '',
  doc_url: '',
  auth_notes: '',
  contributors: [],
  isMaster: true,
};
