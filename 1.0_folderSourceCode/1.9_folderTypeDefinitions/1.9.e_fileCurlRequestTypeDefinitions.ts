// ============================================
// PROTOCOL OS - CURL REQUEST TYPE DEFINITIONS
// ============================================
// Address: 1.9.e
// Purpose: Types for cURL request configurations
// ============================================

import type { EntityId, HttpMethod, HttpHeaders } from './1.9.a_fileCoreTypeDefinitions';

/**
 * Placeholder definition
 */
export interface Placeholder {
  key: string;
  description?: string;
  defaultValue?: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'secret';
}

/**
 * Request assertion for validation
 */
export interface RequestAssertion {
  type: 'status' | 'header' | 'body' | 'jsonPath' | 'responseTime';
  operator: 'equals' | 'contains' | 'matches' | 'lessThan' | 'greaterThan' | 'exists';
  expected: string | number | boolean;
  path?: string; // For jsonPath assertions
}

/**
 * Request transformation
 */
export interface RequestTransformation {
  type: 'extractJson' | 'extractHeader' | 'extractRegex' | 'setValue';
  source: string;
  target: string;
  expression?: string;
}

/**
 * cURL Request entity
 */
export interface CurlRequest {
  /** Unique identifier */
  id: EntityId;
  
  /** Execution order within handshake */
  serial: number;
  
  /** Display title */
  title: string;
  
  /** Brief description */
  description?: string;
  
  /** Full cURL command string */
  command: string;
  
  /** Test data for execution */
  testData?: string;
  
  /** Expected response for validation */
  expectedResponse?: string;
  
  /** Placeholders in the command */
  placeholders?: Placeholder[];
  
  /** Assertions to validate response */
  assertions?: RequestAssertion[];
  
  /** Transformations to apply */
  transformations?: RequestTransformation[];
  
  /** Whether to skip this request */
  skip?: boolean;
  
  /** Continue on failure */
  continueOnError?: boolean;
  
  /** Delay before execution (ms) */
  delay?: number;
  
  /** Timeout for this request (ms) */
  timeout?: number;
  
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    delay: number;
    backoffMultiplier?: number;
  };
  
  /** Tags for filtering */
  tags?: string[];
}

/**
 * Parsed cURL command structure
 */
export interface ParsedCurlCommand {
  url: string;
  method: HttpMethod;
  headers: HttpHeaders;
  body?: string;
  contentType?: string;
  followRedirects?: boolean;
  insecure?: boolean;
  timeout?: number;
  auth?: {
    type: 'basic' | 'bearer' | 'digest';
    credentials: string;
  };
  queryParams?: Record<string, string>;
  formData?: Record<string, string>;
  cookies?: Record<string, string>;
  proxy?: string;
  userAgent?: string;
}

/**
 * cURL execution options
 */
export interface CurlExecutionOptions {
  /** Variable substitutions */
  variables?: Record<string, string>;
  
  /** Override timeout */
  timeout?: number;
  
  /** Abort signal */
  signal?: AbortSignal;
  
  /** Verbose logging */
  verbose?: boolean;
  
  /** Dry run (don't execute) */
  dryRun?: boolean;
}

/**
 * cURL request creation input
 */
export type CurlRequestCreateInput = Omit<CurlRequest, 'id' | 'serial'>;

/**
 * cURL request update input
 */
export type CurlRequestUpdateInput = Partial<Omit<CurlRequest, 'id'>>;

/**
 * cURL request with execution state
 */
export interface CurlRequestWithState extends CurlRequest {
  state: {
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    startTime?: string;
    endTime?: string;
    duration?: number;
    response?: unknown;
    error?: string;
  };
}
