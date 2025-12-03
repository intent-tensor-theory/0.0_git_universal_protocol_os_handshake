// ============================================
// PROTOCOL OS - SUPABASE PERSISTENCE PROVIDER
// ============================================
// Address: 1.2.2.a
// Purpose: Supabase PostgreSQL implementation of DatabaseProvider
// ============================================

import {
  BaseDatabaseProvider,
  type DatabaseProviderConfig,
  type QueryOptions,
  type QueryResult,
  type MutationResult,
  type TransactionContext,
} from '../1.2.b_fileDatabaseProviderInterface';
import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { ApiResource } from '@types/1.9.b_fileResourceTypeDefinitions';
import type { Handshake } from '@types/1.9.c_fileHandshakeTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { SchemaModel } from '@types/1.9.f_fileSchemaModelTypeDefinitions';
import type { PromotedAction } from '@types/1.9.g_filePromotedActionTypeDefinitions';
import type { HandshakeExecutionResult } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { createSupabaseClient, type SupabaseClientInstance } from './1.2.2.b_fileSupabaseClientConfiguration';
import { COLLECTION_NAMES } from '../1.2.a_fileIndex';

/**
 * Supabase Persistence Provider
 * 
 * Cloud-hosted PostgreSQL database via Supabase.
 * 
 * Features:
 * - Real-time subscriptions
 * - Row-level security
 * - Full PostgreSQL power
 * - Built-in auth integration
 * 
 * Best for:
 * - Production deployments
 * - Multi-user applications
 * - Real-time collaboration
 */
export class SupabasePersistenceProvider extends BaseDatabaseProvider {
  readonly providerType = 'supabase' as const;
  private client: SupabaseClientInstance | null = null;
  private debug = false;
  private schema = 'public';

  /**
   * Get table name with schema
   */
  private getTable(collection: string): string {
    return collection;
  }

  /**
   * Debug logging
   */
  private log(level: 'info' | 'error', message: string, ...args: unknown[]): void {
    if (this.debug) {
      const fn = level === 'error' ? console.error : console.log;
      fn(`[Supabase] ${message}`, ...args);
    }
  }

  /**
   * Convert query options to Supabase query modifiers
   */
  private applyQueryOptions<T>(
    query: ReturnType<SupabaseClientInstance['from']>['select'],
    options?: QueryOptions
  ) {
    let q = query;

    // Apply where filters
    if (options?.where) {
      for (const [key, value] of Object.entries(options.where)) {
        q = q.eq(key, value);
      }
    }

    // Apply orderBy
    if (options?.orderBy) {
      for (const { field, direction } of options.orderBy) {
        q = q.order(field, { ascending: direction === 'asc' });
      }
    }

    // Apply pagination
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const from = options.offset ?? 0;
      const to = from + (options.limit ?? 100) - 1;
      q = q.range(from, to);
    }

    return q;
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================

  async initialize(config: DatabaseProviderConfig): Promise<MutationResult> {
    try {
      this.debug = config.debug || false;
      this.schema = (config.options?.schema as string) || 'public';

      if (!config.connectionString || !config.apiKey) {
        return {
          success: false,
          error: 'Supabase URL and API key are required',
        };
      }

      this.client = createSupabaseClient(config.connectionString, config.apiKey, {
        schema: this.schema,
      });

      // Test connection
      const { error } = await this.client
        .from(COLLECTION_NAMES.PLATFORMS)
        .select('id')
        .limit(1);

      if (error && !error.message.includes('does not exist')) {
        throw error;
      }

      this.connected = true;
      this.config = config;
      this.log('info', 'Connected to Supabase');

      return { success: true };
    } catch (error) {
      this.log('error', 'Failed to initialize:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
      };
    }
  }

  async disconnect(): Promise<MutationResult> {
    this.client = null;
    this.connected = false;
    this.log('info', 'Disconnected');
    return { success: true };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; details?: string }> {
    const start = performance.now();
    try {
      if (!this.client) {
        return { healthy: false, latencyMs: 0, details: 'Not connected' };
      }

      const { error } = await this.client
        .from(COLLECTION_NAMES.PLATFORMS)
        .select('id')
        .limit(1);

      return {
        healthy: !error,
        latencyMs: performance.now() - start,
        details: error?.message,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: performance.now() - start,
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  supportsTransactions(): boolean {
    return true;
  }

  async beginTransaction(): Promise<TransactionContext> {
    // Supabase doesn't have explicit transaction API for client-side
    // We simulate with batch operations
    const operations: Array<{
      type: 'create' | 'update' | 'delete';
      collection: string;
      id?: string;
      data?: Record<string, unknown>;
    }> = [];

    const transactionId = `txn_${Date.now()}`;

    return {
      transactionId,
      addOperation: (op) => operations.push(op),
      commit: async () => {
        // Execute all operations
        for (const op of operations) {
          if (op.type === 'create' && op.data) {
            await this.client!.from(op.collection).insert(op.data);
          } else if (op.type === 'update' && op.id && op.data) {
            await this.client!.from(op.collection).update(op.data).eq('id', op.id);
          } else if (op.type === 'delete' && op.id) {
            await this.client!.from(op.collection).delete().eq('id', op.id);
          }
        }
        return { success: true, affectedCount: operations.length };
      },
      rollback: async () => {
        operations.length = 0;
        return { success: true };
      },
    };
  }

  // ============================================
  // GENERIC CRUD HELPERS
  // ============================================

  private async createEntity<T extends { id: string }>(
    collection: string,
    entity: T
  ): Promise<MutationResult<T>> {
    if (!this.client) return { success: false, error: 'Not connected' };

    const { data, error } = await this.client
      .from(this.getTable(collection))
      .insert(entity as Record<string, unknown>)
      .select()
      .single();

    if (error) {
      this.log('error', `Failed to create in ${collection}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as T, affectedCount: 1 };
  }

  private async getEntity<T>(
    collection: string,
    id: string
  ): Promise<QueryResult<T>> {
    if (!this.client) return { success: false, data: null, error: 'Not connected' };

    const { data, error } = await this.client
      .from(this.getTable(collection))
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data as T };
  }

  private async getAllEntities<T>(
    collection: string,
    options?: QueryOptions
  ): Promise<QueryResult<T[]>> {
    if (!this.client) return { success: false, data: null, error: 'Not connected' };

    let query = this.client.from(this.getTable(collection)).select('*', { count: 'exact' });
    query = this.applyQueryOptions(query, options);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data as T[], totalCount: count ?? undefined };
  }

  private async updateEntity<T>(
    collection: string,
    id: string,
    updates: Partial<T>
  ): Promise<MutationResult<T>> {
    if (!this.client) return { success: false, error: 'Not connected' };

    const { data, error } = await this.client
      .from(this.getTable(collection))
      .update({ ...updates, updatedAt: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as T, affectedCount: 1 };
  }

  private async deleteEntity(
    collection: string,
    id: string
  ): Promise<MutationResult> {
    if (!this.client) return { success: false, error: 'Not connected' };

    const { error } = await this.client
      .from(this.getTable(collection))
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, affectedCount: 1 };
  }

  private async getEntitiesByField<T>(
    collection: string,
    field: string,
    value: unknown,
    options?: QueryOptions
  ): Promise<QueryResult<T[]>> {
    if (!this.client) return { success: false, data: null, error: 'Not connected' };

    let query = this.client
      .from(this.getTable(collection))
      .select('*', { count: 'exact' })
      .eq(field, value);

    query = this.applyQueryOptions(query, options);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data as T[], totalCount: count ?? undefined };
  }

  // ============================================
  // PLATFORM OPERATIONS
  // ============================================

  async createPlatform(platform: Platform): Promise<MutationResult<Platform>> {
    return this.createEntity(COLLECTION_NAMES.PLATFORMS, platform);
  }

  async getPlatform(id: string): Promise<QueryResult<Platform>> {
    return this.getEntity(COLLECTION_NAMES.PLATFORMS, id);
  }

  async getAllPlatforms(options?: QueryOptions): Promise<QueryResult<Platform[]>> {
    return this.getAllEntities(COLLECTION_NAMES.PLATFORMS, options);
  }

  async updatePlatform(id: string, updates: Partial<Platform>): Promise<MutationResult<Platform>> {
    return this.updateEntity(COLLECTION_NAMES.PLATFORMS, id, updates);
  }

  async deletePlatform(id: string): Promise<MutationResult> {
    // Cascade delete via Supabase foreign keys or manual cleanup
    const { data: resources } = await this.getEntitiesByField<ApiResource>(
      COLLECTION_NAMES.RESOURCES,
      'platformId',
      id
    );

    if (resources) {
      for (const resource of resources) {
        await this.deleteResource(resource.id);
      }
    }

    return this.deleteEntity(COLLECTION_NAMES.PLATFORMS, id);
  }

  // ============================================
  // RESOURCE OPERATIONS
  // ============================================

  async createResource(resource: ApiResource): Promise<MutationResult<ApiResource>> {
    return this.createEntity(COLLECTION_NAMES.RESOURCES, resource);
  }

  async getResource(id: string): Promise<QueryResult<ApiResource>> {
    return this.getEntity(COLLECTION_NAMES.RESOURCES, id);
  }

  async getResourcesByPlatform(platformId: string, options?: QueryOptions): Promise<QueryResult<ApiResource[]>> {
    return this.getEntitiesByField(COLLECTION_NAMES.RESOURCES, 'platformId', platformId, options);
  }

  async updateResource(id: string, updates: Partial<ApiResource>): Promise<MutationResult<ApiResource>> {
    return this.updateEntity(COLLECTION_NAMES.RESOURCES, id, updates);
  }

  async deleteResource(id: string): Promise<MutationResult> {
    const { data: handshakes } = await this.getHandshakesByResource(id);
    if (handshakes) {
      for (const handshake of handshakes) {
        await this.deleteHandshake(handshake.id);
      }
    }
    return this.deleteEntity(COLLECTION_NAMES.RESOURCES, id);
  }

  // ============================================
  // HANDSHAKE OPERATIONS
  // ============================================

  async createHandshake(handshake: Handshake): Promise<MutationResult<Handshake>> {
    return this.createEntity(COLLECTION_NAMES.HANDSHAKES, handshake);
  }

  async getHandshake(id: string): Promise<QueryResult<Handshake>> {
    return this.getEntity(COLLECTION_NAMES.HANDSHAKES, id);
  }

  async getHandshakesByResource(resourceId: string, options?: QueryOptions): Promise<QueryResult<Handshake[]>> {
    return this.getEntitiesByField(COLLECTION_NAMES.HANDSHAKES, 'resourceId', resourceId, options);
  }

  async updateHandshake(id: string, updates: Partial<Handshake>): Promise<MutationResult<Handshake>> {
    return this.updateEntity(COLLECTION_NAMES.HANDSHAKES, id, updates);
  }

  async deleteHandshake(id: string): Promise<MutationResult> {
    // Delete children
    if (this.client) {
      await this.client.from(COLLECTION_NAMES.CURL_REQUESTS).delete().eq('handshakeId', id);
      await this.client.from(COLLECTION_NAMES.SCHEMA_MODELS).delete().eq('handshakeId', id);
      await this.client.from(COLLECTION_NAMES.PROMOTED_ACTIONS).delete().eq('handshakeId', id);
    }
    return this.deleteEntity(COLLECTION_NAMES.HANDSHAKES, id);
  }

  // ============================================
  // CURL REQUEST OPERATIONS
  // ============================================

  async createCurlRequest(curlRequest: CurlRequest): Promise<MutationResult<CurlRequest>> {
    return this.createEntity(COLLECTION_NAMES.CURL_REQUESTS, curlRequest);
  }

  async getCurlRequest(id: string): Promise<QueryResult<CurlRequest>> {
    return this.getEntity(COLLECTION_NAMES.CURL_REQUESTS, id);
  }

  async getCurlRequestsByHandshake(handshakeId: string): Promise<QueryResult<CurlRequest[]>> {
    return this.getEntitiesByField(COLLECTION_NAMES.CURL_REQUESTS, 'handshakeId', handshakeId);
  }

  async updateCurlRequest(id: string, updates: Partial<CurlRequest>): Promise<MutationResult<CurlRequest>> {
    return this.updateEntity(COLLECTION_NAMES.CURL_REQUESTS, id, updates);
  }

  async deleteCurlRequest(id: string): Promise<MutationResult> {
    return this.deleteEntity(COLLECTION_NAMES.CURL_REQUESTS, id);
  }

  // ============================================
  // SCHEMA MODEL OPERATIONS
  // ============================================

  async createSchemaModel(schemaModel: SchemaModel): Promise<MutationResult<SchemaModel>> {
    return this.createEntity(COLLECTION_NAMES.SCHEMA_MODELS, schemaModel);
  }

  async getSchemaModel(id: string): Promise<QueryResult<SchemaModel>> {
    return this.getEntity(COLLECTION_NAMES.SCHEMA_MODELS, id);
  }

  async getSchemaModelsByHandshake(handshakeId: string): Promise<QueryResult<SchemaModel[]>> {
    return this.getEntitiesByField(COLLECTION_NAMES.SCHEMA_MODELS, 'handshakeId', handshakeId);
  }

  async updateSchemaModel(id: string, updates: Partial<SchemaModel>): Promise<MutationResult<SchemaModel>> {
    return this.updateEntity(COLLECTION_NAMES.SCHEMA_MODELS, id, updates);
  }

  async deleteSchemaModel(id: string): Promise<MutationResult> {
    return this.deleteEntity(COLLECTION_NAMES.SCHEMA_MODELS, id);
  }

  // ============================================
  // PROMOTED ACTION OPERATIONS
  // ============================================

  async createPromotedAction(action: PromotedAction): Promise<MutationResult<PromotedAction>> {
    return this.createEntity(COLLECTION_NAMES.PROMOTED_ACTIONS, action);
  }

  async getPromotedAction(id: string): Promise<QueryResult<PromotedAction>> {
    return this.getEntity(COLLECTION_NAMES.PROMOTED_ACTIONS, id);
  }

  async getPromotedActionsByHandshake(handshakeId: string): Promise<QueryResult<PromotedAction[]>> {
    return this.getEntitiesByField(COLLECTION_NAMES.PROMOTED_ACTIONS, 'handshakeId', handshakeId);
  }

  async updatePromotedAction(id: string, updates: Partial<PromotedAction>): Promise<MutationResult<PromotedAction>> {
    return this.updateEntity(COLLECTION_NAMES.PROMOTED_ACTIONS, id, updates);
  }

  async deletePromotedAction(id: string): Promise<MutationResult> {
    return this.deleteEntity(COLLECTION_NAMES.PROMOTED_ACTIONS, id);
  }

  // ============================================
  // EXECUTION LOG OPERATIONS
  // ============================================

  async logExecution(result: HandshakeExecutionResult): Promise<MutationResult<HandshakeExecutionResult>> {
    return this.createEntity(COLLECTION_NAMES.EXECUTION_LOGS, result as HandshakeExecutionResult & { id: string });
  }

  async getExecutionLogs(handshakeId: string, options?: QueryOptions): Promise<QueryResult<HandshakeExecutionResult[]>> {
    return this.getEntitiesByField(COLLECTION_NAMES.EXECUTION_LOGS, 'handshakeId', handshakeId, options);
  }

  async clearOldExecutionLogs(olderThan: Date): Promise<MutationResult> {
    if (!this.client) return { success: false, error: 'Not connected' };

    const { error, count } = await this.client
      .from(COLLECTION_NAMES.EXECUTION_LOGS)
      .delete()
      .lt('timestamp', olderThan.toISOString());

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, affectedCount: count ?? 0 };
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  async exportAllData(): Promise<QueryResult<Record<string, unknown>>> {
    if (!this.client) return { success: false, data: null, error: 'Not connected' };

    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      provider: this.providerType,
      version: '1.0.0',
    };

    for (const collection of Object.values(COLLECTION_NAMES)) {
      const { data: items } = await this.client.from(collection).select('*');
      data[collection] = items ?? [];
    }

    return { success: true, data };
  }

  async importData(data: Record<string, unknown>): Promise<MutationResult> {
    if (!this.client) return { success: false, error: 'Not connected' };

    try {
      for (const collection of Object.values(COLLECTION_NAMES)) {
        if (Array.isArray(data[collection])) {
          await this.client.from(collection).upsert(data[collection] as Record<string, unknown>[]);
        }
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }

  async clearAllData(): Promise<MutationResult> {
    if (!this.client) return { success: false, error: 'Not connected' };

    try {
      // Delete in reverse order of dependencies
      const collections = [
        COLLECTION_NAMES.EXECUTION_LOGS,
        COLLECTION_NAMES.PROMOTED_ACTIONS,
        COLLECTION_NAMES.SCHEMA_MODELS,
        COLLECTION_NAMES.CURL_REQUESTS,
        COLLECTION_NAMES.HANDSHAKES,
        COLLECTION_NAMES.RESOURCES,
        COLLECTION_NAMES.PLATFORMS,
      ];

      for (const collection of collections) {
        await this.client.from(collection).delete().neq('id', '');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clear failed',
      };
    }
  }
}
