// ============================================
// PROTOCOL OS - RESOURCE TYPE DEFINITIONS
// ============================================
// Address: 1.9.c
// Purpose: Types for API resources within platforms
// ============================================

import type { EntityId } from './1.9.a_fileCoreTypeDefinitions';
import type { Handshake } from './1.9.f_fileHandshakeTypeDefinitions';

/**
 * Resource environment configuration
 */
export interface ResourceEnvironment {
  name: string;
  baseUrl: string;
  variables?: Record<string, string>;
}

/**
 * Resource documentation
 */
export interface ResourceDocumentation {
  description?: string;
  examples?: string[];
  notes?: string;
  externalUrl?: string;
}

/**
 * Resource entity
 */
export interface Resource {
  /** Unique identifier */
  id: EntityId;
  
  /** Display name */
  name: string;
  
  /** Base name for saved handshakes (kebab-case identifier) */
  baseName: string;
  
  /** Brief description */
  description?: string;
  
  /** Resource path/endpoint pattern */
  path?: string;
  
  /** Supported HTTP methods */
  methods?: string[];
  
  /** Environment configurations */
  environments?: ResourceEnvironment[];
  
  /** Documentation */
  documentation?: ResourceDocumentation;
  
  /** Tags for filtering */
  tags?: string[];
  
  /** Child handshakes */
  handshakes?: Handshake[];
  
  /** Whether resource is enabled */
  enabled?: boolean;
  
  /** Sort order for display */
  sortOrder?: number;
  
  /** Parent platform ID (for reference) */
  platformId?: EntityId;
}

/**
 * Resource creation input
 */
export type ResourceCreateInput = Omit<Resource, 'id'>;

/**
 * Resource update input
 */
export type ResourceUpdateInput = Partial<Omit<Resource, 'id'>>;

/**
 * Resource summary (lightweight)
 */
export interface ResourceSummary {
  id: EntityId;
  name: string;
  baseName: string;
  description?: string;
  handshakeCount: number;
  platformId?: EntityId;
}

/**
 * Resource with computed data
 */
export interface ResourceWithStats extends Resource {
  stats: {
    totalHandshakes: number;
    totalRequests: number;
    lastExecution?: string;
    successRate?: number;
  };
}

/**
 * Resource filter options
 */
export interface ResourceFilterOptions {
  search?: string;
  platformId?: EntityId;
  tags?: string[];
  enabled?: boolean;
}

/**
 * Resource tree node (for hierarchical display)
 */
export interface ResourceTreeNode {
  resource: Resource;
  children: ResourceTreeNode[];
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
}
