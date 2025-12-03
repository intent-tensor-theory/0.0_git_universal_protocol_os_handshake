// ============================================
// PROTOCOL OS - DATABASE PROVIDER INTERFACE
// ============================================
// Address: 1.2.b
// Purpose: Defines the contract for all database providers
// ============================================

import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { ApiResource } from '@types/1.9.b_fileResourceTypeDefinitions';
import type { Handshake } from '@types/1.9.c_fileHandshakeTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { SchemaModel } from '@types/1.9.f_fileSchemaModelTypeDefinitions';
import type { PromotedAction } from '@types/1.9.g_filePromotedActionTypeDefinitions';
import type { HandshakeExecutionResult } from '@types/1.9.h_fileExecutionResultTypeDefinitions';

/**
 * Supported database provider types
 */
export type DatabaseProviderType = 
  | 'localStorage'  // Browser localStorage (default, no setup required)
  | 'supabase'      // Supabase PostgreSQL backend
  | 'firebase'      // Firebase Firestore
  | 'postgresql'    // Direct PostgreSQL connection
  | 'sqlite';       // SQLite file database

/**
 * Configuration for database providers
 */
export interface DatabaseProviderConfig {
  /** Provider type identifier */
  type: DatabaseProviderType;
  
  /** Connection string or URL */
  connectionString?: string;
  
  /** API key for cloud providers */
  apiKey?: string;
  
  /** Project ID for cloud providers */
  projectId?: string;
  
  /** Database name */
  databaseName?: string;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Connection timeout in milliseconds */
  timeout?: number;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Provider-specific options */
  options?: Record<string, unknown>;
}

/**
 * Options for query operations
 */
export interface QueryOptions {
  /** Filter criteria */
  where?: Record<string, unknown>;
  
  /** Sort order */
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  
  /** Maximum results to return */
  limit?: number;
  
  /** Number of results to skip */
  offset?: number;
  
  /** Include related data */
  include?: string[];
}

/**
 * Result from query operations
 */
export interface QueryResult<T> {
  /** Success status */
  success: boolean;
  
  /** Returned data */
  data: T | null;
  
  /** Error message if failed */
  error?: string;
  
  /** Total count (for paginated queries) */
  totalCount?: number;
  
  /** Query execution time in ms */
  executionTimeMs?: number;
}

/**
 * Result from mutation operations (create, update, delete)
 */
export interface MutationResult<T = unknown> {
  /** Success status */
  success: boolean;
  
  /** Created/updated entity */
  data?: T;
  
  /** Error message if failed */
  error?: string;
  
  /** Number of affected records */
  affectedCount?: number;
}

/**
 * Transaction context for batch operations
 */
export interface TransactionContext {
  /** Unique transaction ID */
  transactionId: string;
  
  /** Commit all pending changes */
  commit: () => Promise<MutationResult>;
  
  /** Rollback all pending changes */
  rollback: () => Promise<MutationResult>;
  
  /** Add operation to transaction */
  addOperation: (operation: TransactionOperation) => void;
}

/**
 * Single operation within a transaction
 */
export interface TransactionOperation {
  /** Operation type */
  type: 'create' | 'update' | 'delete';
  
  /** Target collection */
  collection: string;
  
  /** Entity ID (for update/delete) */
  id?: string;
  
  /** Entity data (for create/update) */
  data?: Record<string, unknown>;
}

/**
 * Database Provider Interface
 * 
 * All database implementations must fulfill this contract.
 * This enables hot-swapping between providers with a single
 * configuration change.
 */
export interface DatabaseProvider {
  // ============================================
  // LIFECYCLE METHODS
  // ============================================
  
  /** Provider type identifier */
  readonly providerType: DatabaseProviderType;
  
  /** Initialize the database connection */
  initialize(config: DatabaseProviderConfig): Promise<MutationResult>;
  
  /** Check if provider is connected and ready */
  isConnected(): boolean;
  
  /** Close the database connection */
  disconnect(): Promise<MutationResult>;
  
  /** Health check */
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number; details?: string }>;

  // ============================================
  // PLATFORM OPERATIONS
  // ============================================
  
  /** Create a new platform */
  createPlatform(platform: Platform): Promise<MutationResult<Platform>>;
  
  /** Get platform by ID */
  getPlatform(id: string): Promise<QueryResult<Platform>>;
  
  /** Get all platforms */
  getAllPlatforms(options?: QueryOptions): Promise<QueryResult<Platform[]>>;
  
  /** Update a platform */
  updatePlatform(id: string, updates: Partial<Platform>): Promise<MutationResult<Platform>>;
  
  /** Delete a platform */
  deletePlatform(id: string): Promise<MutationResult>;

  // ============================================
  // RESOURCE OPERATIONS
  // ============================================
  
  /** Create a new resource */
  createResource(resource: ApiResource): Promise<MutationResult<ApiResource>>;
  
  /** Get resource by ID */
  getResource(id: string): Promise<QueryResult<ApiResource>>;
  
  /** Get all resources for a platform */
  getResourcesByPlatform(platformId: string, options?: QueryOptions): Promise<QueryResult<ApiResource[]>>;
  
  /** Update a resource */
  updateResource(id: string, updates: Partial<ApiResource>): Promise<MutationResult<ApiResource>>;
  
  /** Delete a resource */
  deleteResource(id: string): Promise<MutationResult>;

  // ============================================
  // HANDSHAKE OPERATIONS
  // ============================================
  
  /** Create a new handshake */
  createHandshake(handshake: Handshake): Promise<MutationResult<Handshake>>;
  
  /** Get handshake by ID */
  getHandshake(id: string): Promise<QueryResult<Handshake>>;
  
  /** Get all handshakes for a resource */
  getHandshakesByResource(resourceId: string, options?: QueryOptions): Promise<QueryResult<Handshake[]>>;
  
  /** Update a handshake */
  updateHandshake(id: string, updates: Partial<Handshake>): Promise<MutationResult<Handshake>>;
  
  /** Delete a handshake */
  deleteHandshake(id: string): Promise<MutationResult>;

  // ============================================
  // CURL REQUEST OPERATIONS
  // ============================================
  
  /** Create a new cURL request */
  createCurlRequest(curlRequest: CurlRequest): Promise<MutationResult<CurlRequest>>;
  
  /** Get cURL request by ID */
  getCurlRequest(id: string): Promise<QueryResult<CurlRequest>>;
  
  /** Get all cURL requests for a handshake */
  getCurlRequestsByHandshake(handshakeId: string): Promise<QueryResult<CurlRequest[]>>;
  
  /** Update a cURL request */
  updateCurlRequest(id: string, updates: Partial<CurlRequest>): Promise<MutationResult<CurlRequest>>;
  
  /** Delete a cURL request */
  deleteCurlRequest(id: string): Promise<MutationResult>;

  // ============================================
  // SCHEMA MODEL OPERATIONS
  // ============================================
  
  /** Create a new schema model */
  createSchemaModel(schemaModel: SchemaModel): Promise<MutationResult<SchemaModel>>;
  
  /** Get schema model by ID */
  getSchemaModel(id: string): Promise<QueryResult<SchemaModel>>;
  
  /** Get all schema models for a handshake */
  getSchemaModelsByHandshake(handshakeId: string): Promise<QueryResult<SchemaModel[]>>;
  
  /** Update a schema model */
  updateSchemaModel(id: string, updates: Partial<SchemaModel>): Promise<MutationResult<SchemaModel>>;
  
  /** Delete a schema model */
  deleteSchemaModel(id: string): Promise<MutationResult>;

  // ============================================
  // PROMOTED ACTION OPERATIONS
  // ============================================
  
  /** Create a new promoted action */
  createPromotedAction(action: PromotedAction): Promise<MutationResult<PromotedAction>>;
  
  /** Get promoted action by ID */
  getPromotedAction(id: string): Promise<QueryResult<PromotedAction>>;
  
  /** Get all promoted actions for a handshake */
  getPromotedActionsByHandshake(handshakeId: string): Promise<QueryResult<PromotedAction[]>>;
  
  /** Update a promoted action */
  updatePromotedAction(id: string, updates: Partial<PromotedAction>): Promise<MutationResult<PromotedAction>>;
  
  /** Delete a promoted action */
  deletePromotedAction(id: string): Promise<MutationResult>;

  // ============================================
  // EXECUTION LOG OPERATIONS
  // ============================================
  
  /** Log an execution result */
  logExecution(result: HandshakeExecutionResult): Promise<MutationResult<HandshakeExecutionResult>>;
  
  /** Get execution logs for a handshake */
  getExecutionLogs(handshakeId: string, options?: QueryOptions): Promise<QueryResult<HandshakeExecutionResult[]>>;
  
  /** Clear execution logs older than specified date */
  clearOldExecutionLogs(olderThan: Date): Promise<MutationResult>;

  // ============================================
  // TRANSACTION SUPPORT
  // ============================================
  
  /** Begin a transaction */
  beginTransaction(): Promise<TransactionContext>;
  
  /** Check if provider supports transactions */
  supportsTransactions(): boolean;

  // ============================================
  // BULK OPERATIONS
  // ============================================
  
  /** Export all data as JSON */
  exportAllData(): Promise<QueryResult<Record<string, unknown>>>;
  
  /** Import data from JSON */
  importData(data: Record<string, unknown>): Promise<MutationResult>;
  
  /** Clear all data (dangerous!) */
  clearAllData(): Promise<MutationResult>;
}

/**
 * Base class with common functionality for providers
 */
export abstract class BaseDatabaseProvider implements DatabaseProvider {
  abstract readonly providerType: DatabaseProviderType;
  protected config: DatabaseProviderConfig | null = null;
  protected connected = false;

  abstract initialize(config: DatabaseProviderConfig): Promise<MutationResult>;
  abstract disconnect(): Promise<MutationResult>;
  abstract healthCheck(): Promise<{ healthy: boolean; latencyMs: number; details?: string }>;

  isConnected(): boolean {
    return this.connected;
  }

  supportsTransactions(): boolean {
    // Override in providers that support transactions
    return false;
  }

  async beginTransaction(): Promise<TransactionContext> {
    throw new Error(`Transactions not supported by ${this.providerType} provider`);
  }

  // Default implementations that must be overridden
  abstract createPlatform(platform: Platform): Promise<MutationResult<Platform>>;
  abstract getPlatform(id: string): Promise<QueryResult<Platform>>;
  abstract getAllPlatforms(options?: QueryOptions): Promise<QueryResult<Platform[]>>;
  abstract updatePlatform(id: string, updates: Partial<Platform>): Promise<MutationResult<Platform>>;
  abstract deletePlatform(id: string): Promise<MutationResult>;

  abstract createResource(resource: ApiResource): Promise<MutationResult<ApiResource>>;
  abstract getResource(id: string): Promise<QueryResult<ApiResource>>;
  abstract getResourcesByPlatform(platformId: string, options?: QueryOptions): Promise<QueryResult<ApiResource[]>>;
  abstract updateResource(id: string, updates: Partial<ApiResource>): Promise<MutationResult<ApiResource>>;
  abstract deleteResource(id: string): Promise<MutationResult>;

  abstract createHandshake(handshake: Handshake): Promise<MutationResult<Handshake>>;
  abstract getHandshake(id: string): Promise<QueryResult<Handshake>>;
  abstract getHandshakesByResource(resourceId: string, options?: QueryOptions): Promise<QueryResult<Handshake[]>>;
  abstract updateHandshake(id: string, updates: Partial<Handshake>): Promise<MutationResult<Handshake>>;
  abstract deleteHandshake(id: string): Promise<MutationResult>;

  abstract createCurlRequest(curlRequest: CurlRequest): Promise<MutationResult<CurlRequest>>;
  abstract getCurlRequest(id: string): Promise<QueryResult<CurlRequest>>;
  abstract getCurlRequestsByHandshake(handshakeId: string): Promise<QueryResult<CurlRequest[]>>;
  abstract updateCurlRequest(id: string, updates: Partial<CurlRequest>): Promise<MutationResult<CurlRequest>>;
  abstract deleteCurlRequest(id: string): Promise<MutationResult>;

  abstract createSchemaModel(schemaModel: SchemaModel): Promise<MutationResult<SchemaModel>>;
  abstract getSchemaModel(id: string): Promise<QueryResult<SchemaModel>>;
  abstract getSchemaModelsByHandshake(handshakeId: string): Promise<QueryResult<SchemaModel[]>>;
  abstract updateSchemaModel(id: string, updates: Partial<SchemaModel>): Promise<MutationResult<SchemaModel>>;
  abstract deleteSchemaModel(id: string): Promise<MutationResult>;

  abstract createPromotedAction(action: PromotedAction): Promise<MutationResult<PromotedAction>>;
  abstract getPromotedAction(id: string): Promise<QueryResult<PromotedAction>>;
  abstract getPromotedActionsByHandshake(handshakeId: string): Promise<QueryResult<PromotedAction[]>>;
  abstract updatePromotedAction(id: string, updates: Partial<PromotedAction>): Promise<MutationResult<PromotedAction>>;
  abstract deletePromotedAction(id: string): Promise<MutationResult>;

  abstract logExecution(result: HandshakeExecutionResult): Promise<MutationResult<HandshakeExecutionResult>>;
  abstract getExecutionLogs(handshakeId: string, options?: QueryOptions): Promise<QueryResult<HandshakeExecutionResult[]>>;
  abstract clearOldExecutionLogs(olderThan: Date): Promise<MutationResult>;

  abstract exportAllData(): Promise<QueryResult<Record<string, unknown>>>;
  abstract importData(data: Record<string, unknown>): Promise<MutationResult>;
  abstract clearAllData(): Promise<MutationResult>;
}
