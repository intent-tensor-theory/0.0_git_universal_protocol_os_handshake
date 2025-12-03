// ============================================
// PROTOCOL OS - LOCALSTORAGE PERSISTENCE PROVIDER
// ============================================
// Address: 1.2.1.a
// Purpose: Browser localStorage implementation of DatabaseProvider
// ============================================

import {
  BaseDatabaseProvider,
  type DatabaseProviderConfig,
  type QueryOptions,
  type QueryResult,
  type MutationResult,
} from '../1.2.b_fileDatabaseProviderInterface';
import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { ApiResource } from '@types/1.9.b_fileResourceTypeDefinitions';
import type { Handshake } from '@types/1.9.c_fileHandshakeTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { SchemaModel } from '@types/1.9.f_fileSchemaModelTypeDefinitions';
import type { PromotedAction } from '@types/1.9.g_filePromotedActionTypeDefinitions';
import type { HandshakeExecutionResult } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { COLLECTION_NAMES } from '../1.2.a_fileIndex';

/**
 * LocalStorage Persistence Provider
 * 
 * Default database provider using browser localStorage.
 * No setup required - works out of the box.
 * 
 * Limitations:
 * - ~5MB storage limit per domain
 * - No cross-tab sync
 * - Data lost if browser storage cleared
 * - No transactions
 * 
 * Best for:
 * - Development and prototyping
 * - Single-user local installations
 * - Demo/testing scenarios
 */
export class LocalStoragePersistenceProvider extends BaseDatabaseProvider {
  readonly providerType = 'localStorage' as const;
  private prefix = 'protocol-os';
  private debug = false;

  /**
   * Get the storage key for a collection
   */
  private getKey(collection: string): string {
    return `${this.prefix}:${collection}`;
  }

  /**
   * Read collection from localStorage
   */
  private readCollection<T>(collection: string): T[] {
    try {
      const data = localStorage.getItem(this.getKey(collection));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      this.log('error', `Failed to read ${collection}:`, error);
      return [];
    }
  }

  /**
   * Write collection to localStorage
   */
  private writeCollection<T>(collection: string, data: T[]): boolean {
    try {
      localStorage.setItem(this.getKey(collection), JSON.stringify(data));
      return true;
    } catch (error) {
      this.log('error', `Failed to write ${collection}:`, error);
      return false;
    }
  }

  /**
   * Debug logging
   */
  private log(level: 'info' | 'error', message: string, ...args: unknown[]): void {
    if (this.debug) {
      const fn = level === 'error' ? console.error : console.log;
      fn(`[LocalStorage] ${message}`, ...args);
    }
  }

  /**
   * Apply query options to an array
   */
  private applyQueryOptions<T extends Record<string, unknown>>(
    items: T[],
    options?: QueryOptions
  ): T[] {
    let result = [...items];

    // Apply where filter
    if (options?.where) {
      result = result.filter((item) =>
        Object.entries(options.where!).every(([key, value]) => item[key] === value)
      );
    }

    // Apply orderBy
    if (options?.orderBy && options.orderBy.length > 0) {
      result.sort((a, b) => {
        for (const { field, direction } of options.orderBy!) {
          const aVal = a[field];
          const bVal = b[field];
          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply offset
    if (options?.offset) {
      result = result.slice(options.offset);
    }

    // Apply limit
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================

  async initialize(config: DatabaseProviderConfig): Promise<MutationResult> {
    this.prefix = config.databaseName || 'protocol-os';
    this.debug = config.debug || false;
    this.connected = true;
    this.config = config;

    this.log('info', `Initialized with prefix: ${this.prefix}`);
    return { success: true };
  }

  async disconnect(): Promise<MutationResult> {
    this.connected = false;
    this.log('info', 'Disconnected');
    return { success: true };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; details?: string }> {
    const start = performance.now();
    try {
      const testKey = `${this.prefix}:health-check`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return {
        healthy: true,
        latencyMs: performance.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: performance.now() - start,
        details: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================
  // GENERIC CRUD HELPERS
  // ============================================

  private async createEntity<T extends { id: string }>(
    collection: string,
    entity: T
  ): Promise<MutationResult<T>> {
    const items = this.readCollection<T>(collection);
    
    // Check for duplicate
    if (items.some((item) => item.id === entity.id)) {
      return { success: false, error: `Entity with id ${entity.id} already exists` };
    }

    items.push(entity);
    const success = this.writeCollection(collection, items);

    return success
      ? { success: true, data: entity, affectedCount: 1 }
      : { success: false, error: 'Failed to write to localStorage' };
  }

  private async getEntity<T extends { id: string }>(
    collection: string,
    id: string
  ): Promise<QueryResult<T>> {
    const items = this.readCollection<T>(collection);
    const entity = items.find((item) => item.id === id);

    return entity
      ? { success: true, data: entity }
      : { success: false, data: null, error: 'Entity not found' };
  }

  private async updateEntity<T extends { id: string }>(
    collection: string,
    id: string,
    updates: Partial<T>
  ): Promise<MutationResult<T>> {
    const items = this.readCollection<T>(collection);
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return { success: false, error: 'Entity not found' };
    }

    const updated = { ...items[index], ...updates, updatedAt: new Date().toISOString() } as T;
    items[index] = updated;
    const success = this.writeCollection(collection, items);

    return success
      ? { success: true, data: updated, affectedCount: 1 }
      : { success: false, error: 'Failed to write to localStorage' };
  }

  private async deleteEntity<T extends { id: string }>(
    collection: string,
    id: string
  ): Promise<MutationResult> {
    const items = this.readCollection<T>(collection);
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return { success: false, error: 'Entity not found' };
    }

    items.splice(index, 1);
    const success = this.writeCollection(collection, items);

    return success
      ? { success: true, affectedCount: 1 }
      : { success: false, error: 'Failed to write to localStorage' };
  }

  private async getEntitiesByField<T extends Record<string, unknown>>(
    collection: string,
    field: string,
    value: unknown,
    options?: QueryOptions
  ): Promise<QueryResult<T[]>> {
    const items = this.readCollection<T>(collection);
    let filtered = items.filter((item) => item[field] === value);
    filtered = this.applyQueryOptions(filtered, options);

    return { success: true, data: filtered, totalCount: filtered.length };
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
    let items = this.readCollection<Platform>(COLLECTION_NAMES.PLATFORMS);
    items = this.applyQueryOptions(items, options);
    return { success: true, data: items, totalCount: items.length };
  }

  async updatePlatform(id: string, updates: Partial<Platform>): Promise<MutationResult<Platform>> {
    return this.updateEntity(COLLECTION_NAMES.PLATFORMS, id, updates);
  }

  async deletePlatform(id: string): Promise<MutationResult> {
    // Also delete child resources
    const resources = this.readCollection<ApiResource>(COLLECTION_NAMES.RESOURCES);
    const childResources = resources.filter((r) => r.platformId === id);
    for (const resource of childResources) {
      await this.deleteResource(resource.id);
    }
    return this.deleteEntity<Platform>(COLLECTION_NAMES.PLATFORMS, id);
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

  async getResourcesByPlatform(
    platformId: string,
    options?: QueryOptions
  ): Promise<QueryResult<ApiResource[]>> {
    return this.getEntitiesByField(COLLECTION_NAMES.RESOURCES, 'platformId', platformId, options);
  }

  async updateResource(id: string, updates: Partial<ApiResource>): Promise<MutationResult<ApiResource>> {
    return this.updateEntity(COLLECTION_NAMES.RESOURCES, id, updates);
  }

  async deleteResource(id: string): Promise<MutationResult> {
    // Also delete child handshakes
    const handshakes = this.readCollection<Handshake>(COLLECTION_NAMES.HANDSHAKES);
    const childHandshakes = handshakes.filter((h) => h.resourceId === id);
    for (const handshake of childHandshakes) {
      await this.deleteHandshake(handshake.id);
    }
    return this.deleteEntity<ApiResource>(COLLECTION_NAMES.RESOURCES, id);
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

  async getHandshakesByResource(
    resourceId: string,
    options?: QueryOptions
  ): Promise<QueryResult<Handshake[]>> {
    return this.getEntitiesByField(COLLECTION_NAMES.HANDSHAKES, 'resourceId', resourceId, options);
  }

  async updateHandshake(id: string, updates: Partial<Handshake>): Promise<MutationResult<Handshake>> {
    return this.updateEntity(COLLECTION_NAMES.HANDSHAKES, id, updates);
  }

  async deleteHandshake(id: string): Promise<MutationResult> {
    // Delete child curl requests, schemas, actions
    await Promise.all([
      this.deleteChildrenByHandshake(COLLECTION_NAMES.CURL_REQUESTS, id),
      this.deleteChildrenByHandshake(COLLECTION_NAMES.SCHEMA_MODELS, id),
      this.deleteChildrenByHandshake(COLLECTION_NAMES.PROMOTED_ACTIONS, id),
    ]);
    return this.deleteEntity<Handshake>(COLLECTION_NAMES.HANDSHAKES, id);
  }

  private async deleteChildrenByHandshake(collection: string, handshakeId: string): Promise<void> {
    const items = this.readCollection<{ id: string; handshakeId: string }>(collection);
    const remaining = items.filter((item) => item.handshakeId !== handshakeId);
    this.writeCollection(collection, remaining);
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
    return this.deleteEntity<CurlRequest>(COLLECTION_NAMES.CURL_REQUESTS, id);
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
    return this.deleteEntity<SchemaModel>(COLLECTION_NAMES.SCHEMA_MODELS, id);
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
    return this.deleteEntity<PromotedAction>(COLLECTION_NAMES.PROMOTED_ACTIONS, id);
  }

  // ============================================
  // EXECUTION LOG OPERATIONS
  // ============================================

  async logExecution(result: HandshakeExecutionResult): Promise<MutationResult<HandshakeExecutionResult>> {
    const logs = this.readCollection<HandshakeExecutionResult>(COLLECTION_NAMES.EXECUTION_LOGS);
    logs.push(result);
    
    // Keep only last 1000 logs to prevent storage overflow
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    const success = this.writeCollection(COLLECTION_NAMES.EXECUTION_LOGS, logs);
    return success
      ? { success: true, data: result }
      : { success: false, error: 'Failed to write execution log' };
  }

  async getExecutionLogs(
    handshakeId: string,
    options?: QueryOptions
  ): Promise<QueryResult<HandshakeExecutionResult[]>> {
    return this.getEntitiesByField(COLLECTION_NAMES.EXECUTION_LOGS, 'handshakeId', handshakeId, options);
  }

  async clearOldExecutionLogs(olderThan: Date): Promise<MutationResult> {
    const logs = this.readCollection<HandshakeExecutionResult>(COLLECTION_NAMES.EXECUTION_LOGS);
    const cutoff = olderThan.toISOString();
    const remaining = logs.filter((log) => log.timestamp > cutoff);
    const deleted = logs.length - remaining.length;

    const success = this.writeCollection(COLLECTION_NAMES.EXECUTION_LOGS, remaining);
    return success
      ? { success: true, affectedCount: deleted }
      : { success: false, error: 'Failed to clear logs' };
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  async exportAllData(): Promise<QueryResult<Record<string, unknown>>> {
    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      provider: this.providerType,
      version: '1.0.0',
    };

    for (const collection of Object.values(COLLECTION_NAMES)) {
      data[collection] = this.readCollection(collection);
    }

    return { success: true, data };
  }

  async importData(data: Record<string, unknown>): Promise<MutationResult> {
    try {
      for (const collection of Object.values(COLLECTION_NAMES)) {
        if (Array.isArray(data[collection])) {
          this.writeCollection(collection, data[collection] as unknown[]);
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
    try {
      for (const collection of Object.values(COLLECTION_NAMES)) {
        localStorage.removeItem(this.getKey(collection));
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
