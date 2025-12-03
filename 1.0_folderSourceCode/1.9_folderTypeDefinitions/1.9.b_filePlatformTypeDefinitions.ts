// ============================================
// PROTOCOL OS - PLATFORM TYPE DEFINITIONS
// ============================================
// Address: 1.9.b
// Purpose: Types for API platforms
// ============================================

import type { BaseEntity, EntityId } from './1.9.a_fileCoreTypeDefinitions';
import type { Resource } from './1.9.c_fileResourceTypeDefinitions';

/**
 * Platform configuration for base URLs
 */
export interface PlatformBaseUrls {
  production?: string;
  staging?: string;
  development?: string;
  custom?: string;
}

/**
 * Platform authentication defaults
 */
export interface PlatformAuthDefaults {
  tokenUrl?: string;
  authorizationUrl?: string;
  redirectUri?: string;
  scopes?: string[];
}

/**
 * Platform rate limiting configuration
 */
export interface PlatformRateLimits {
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number;
}

/**
 * Platform metadata
 */
export interface PlatformMetadata {
  documentationUrl?: string;
  supportUrl?: string;
  statusPageUrl?: string;
  apiVersion?: string;
  lastHealthCheck?: string;
  healthStatus?: 'healthy' | 'degraded' | 'down' | 'unknown';
}

/**
 * Platform entity
 */
export interface Platform extends BaseEntity {
  /** Display name for the platform */
  name: string;
  
  /** Brief description */
  description?: string;
  
  /** Icon URL or identifier */
  icon?: string;
  
  /** Platform category/type */
  category?: string;
  
  /** Tags for filtering/search */
  tags?: string[];
  
  /** Base URLs for different environments */
  baseUrls?: PlatformBaseUrls;
  
  /** Default authentication settings */
  authDefaults?: PlatformAuthDefaults;
  
  /** Rate limiting configuration */
  rateLimits?: PlatformRateLimits;
  
  /** Additional metadata */
  metadata?: PlatformMetadata;
  
  /** Default headers to include in all requests */
  defaultHeaders?: Record<string, string>;
  
  /** Child resources */
  resources?: Resource[];
  
  /** Whether platform is enabled */
  enabled?: boolean;
  
  /** Sort order for display */
  sortOrder?: number;
}

/**
 * Platform creation input (without auto-generated fields)
 */
export type PlatformCreateInput = Omit<Platform, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Platform update input (partial)
 */
export type PlatformUpdateInput = Partial<Omit<Platform, 'id' | 'createdAt'>>;

/**
 * Platform summary (lightweight for lists)
 */
export interface PlatformSummary {
  id: EntityId;
  name: string;
  description?: string;
  icon?: string;
  resourceCount: number;
  handshakeCount: number;
  lastUpdated: string;
  healthStatus?: Platform['metadata']['healthStatus'];
}

/**
 * Platform with computed stats
 */
export interface PlatformWithStats extends Platform {
  stats: {
    totalResources: number;
    totalHandshakes: number;
    totalRequests: number;
    lastExecution?: string;
    successRate?: number;
  };
}

/**
 * Platform filter options
 */
export interface PlatformFilterOptions {
  search?: string;
  category?: string;
  tags?: string[];
  enabled?: boolean;
  healthStatus?: Platform['metadata']['healthStatus'];
}

/**
 * Platform sort options
 */
export interface PlatformSortOptions {
  field: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder';
  direction: 'asc' | 'desc';
}
