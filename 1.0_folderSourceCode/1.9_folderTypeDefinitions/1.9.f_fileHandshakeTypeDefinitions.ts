// ============================================
// PROTOCOL OS - HANDSHAKE TYPE DEFINITIONS
// ============================================
// Address: 1.9.f
// Purpose: Types for handshake configurations
// ============================================

import type { EntityId } from './1.9.a_fileCoreTypeDefinitions';
import type { CurlRequest } from './1.9.e_fileCurlRequestTypeDefinitions';

/**
 * Supported protocol types
 */
export type ProtocolType =
  | 'curl-default'
  | 'oauth-pkce'
  | 'oauth-auth-code'
  | 'oauth-implicit'
  | 'client-credentials'
  | 'rest-api-key'
  | 'graphql'
  | 'websocket'
  | 'soap-xml'
  | 'github-repo-runner'
  | 'keyless-scraper';

/**
 * Protocol category
 */
export type ProtocolCategory = 'no-auth' | 'oauth' | 'api-key' | 'specialized';

/**
 * Protocol complexity level
 */
export type ProtocolComplexity = 'simple' | 'moderate' | 'complex';

/**
 * Handshake execution mode
 */
export type ExecutionMode = 'sequential' | 'parallel' | 'conditional';

/**
 * Handshake status
 */
export type HandshakeStatus = 'draft' | 'active' | 'archived' | 'deprecated';

/**
 * Authentication configuration (generic)
 */
export interface AuthenticationConfig {
  [key: string]: unknown;
}

/**
 * Handshake entity
 */
export interface Handshake {
  /** Unique identifier */
  id: EntityId;
  
  /** Display title */
  title: string;
  
  /** Brief description */
  description?: string;
  
  /** Protocol type */
  protocolType: ProtocolType;
  
  /** Authentication configuration */
  authenticationConfig: AuthenticationConfig;
  
  /** cURL requests in this handshake */
  curlRequests?: CurlRequest[];
  
  /** Whether this is the master/default version */
  isMaster?: boolean;
  
  /** Status */
  status?: HandshakeStatus;
  
  /** Execution mode */
  executionMode?: ExecutionMode;
  
  /** Tags for filtering */
  tags?: string[];
  
  /** Global variables for all requests */
  variables?: Record<string, string>;
  
  /** Global placeholders */
  placeholders?: Array<{
    key: string;
    description?: string;
    defaultValue?: string;
    required?: boolean;
  }>;
  
  /** Pre-execution hooks */
  preHooks?: Array<{
    type: 'script' | 'delay' | 'condition';
    value: string;
  }>;
  
  /** Post-execution hooks */
  postHooks?: Array<{
    type: 'script' | 'notification' | 'webhook';
    value: string;
  }>;
  
  /** Notes/documentation */
  notes?: string;
  
  /** Parent resource ID (for reference) */
  resourceId?: EntityId;
  
  /** Parent platform ID (for reference) */
  platformId?: EntityId;
}

/**
 * Handshake creation input
 */
export type HandshakeCreateInput = Omit<Handshake, 'id'>;

/**
 * Handshake update input
 */
export type HandshakeUpdateInput = Partial<Omit<Handshake, 'id'>>;

/**
 * Handshake summary (lightweight)
 */
export interface HandshakeSummary {
  id: EntityId;
  title: string;
  description?: string;
  protocolType: ProtocolType;
  requestCount: number;
  isMaster?: boolean;
  status?: HandshakeStatus;
}

/**
 * Handshake with execution history
 */
export interface HandshakeWithHistory extends Handshake {
  history: Array<{
    executionId: string;
    timestamp: string;
    success: boolean;
    duration: number;
  }>;
}

/**
 * Handshake filter options
 */
export interface HandshakeFilterOptions {
  search?: string;
  resourceId?: EntityId;
  platformId?: EntityId;
  protocolType?: ProtocolType;
  status?: HandshakeStatus;
  isMaster?: boolean;
  tags?: string[];
}

/**
 * Handshake validation result
 */
export interface HandshakeValidation {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];
}

/**
 * Protocol field definition
 */
export interface ProtocolField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'password' | 'url' | 'select' | 'textarea';
  required: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Protocol metadata
 */
export interface ProtocolMetadata {
  type: ProtocolType;
  displayName: string;
  description: string;
  category: ProtocolCategory;
  complexity: ProtocolComplexity;
  iconId: string;
  documentationUrl?: string;
  tags: string[];
  requiredFields: ProtocolField[];
  optionalFields: ProtocolField[];
  deprecated?: boolean;
  deprecationMessage?: string;
}
