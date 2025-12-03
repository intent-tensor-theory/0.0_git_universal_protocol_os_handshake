// ============================================
// PROTOCOL OS - SQLITE PERSISTENCE PROVIDER
// ============================================
// Address: 1.2.5.a
// Purpose: SQLite implementation of DatabaseProvider
// ============================================

import {
  BaseDatabaseProvider,
  type DatabaseProviderConfig,
  type QueryOptions,
  type QueryResult,
  type MutationResult,
  type TransactionContext,
  type TransactionOperation,
} from '../1.2.b_fileDatabaseProviderInterface';
import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { ApiResource } from '@types/1.9.b_fileResourceTypeDefinitions';
import type { Handshake } from '@types/1.9.c_fileHandshakeTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { SchemaModel } from '@types/1.9.f_fileSchemaModelTypeDefinitions';
import type { PromotedAction } from '@types/1.9.g_filePromotedActionTypeDefinitions';
import type { HandshakeExecutionResult } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { createSqliteConnection, type SqliteConnectionInstance, SQLITE_SCHEMA_SQL } from './1.2.5.b_fileSqliteClientConfiguration';
import { COLLECTION_NAMES } from '../1.2.a_fileIndex';

/**
 * SQLite Persistence Provider
 * 
 * File-based SQL database for portable, embedded deployments.
 * 
 * Features:
 * - Zero configuration
 * - Single file storage
 * - Full SQL support
 * - ACID transactions
 * - Portable database
 * 
 * Best for:
 * - Desktop applications
 * - Offline-first apps
 * - Edge/embedded deployments
 * - Development and testing
 * 
 * Note: Uses better-sqlite3 (synchronous) or sql.js (WASM for browser).
 */
export class SqlitePersistenceProvider extends BaseDatabaseProvider {
  readonly providerType = 'sqlite' as const;
  private db: SqliteConnectionInstance | null = null;
  private debug = false;
  private dbPath = ':memory:';

  /**
   * Debug logging
   */
  private log(level: 'info' | 'error', message: string, ...args: unknown[]): void {
    if (this.debug) {
      const fn = level === 'error' ? console.error : console.log;
      fn(`[SQLite] ${message}`, ...args);
    }
  }

  /**
   * Convert camelCase to snake_case
   */
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Convert snake_case to camelCase
   */
  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * Convert object keys from camelCase to snake_case
   */
  private toSnakeCaseKeys(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = this.toSnakeCase(key);
      // Serialize objects/arrays to JSON for SQLite
      if (value !== null && typeof value === 'object') {
        result[snakeKey] = JSON.stringify(value);
      } else {
        result[snakeKey] = value;
      }
    }
    return result;
  }

  /**
   * Convert object keys from snake_case to camelCase
   */
  private toCamelCaseKeys<T>(obj: Record<string, unknown>): T {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = this.toCamelCase(key);
      // Parse JSON strings back to objects
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
          result[camelKey] = JSON.parse(value);
        } catch {
          result[camelKey] = value;
        }
      } else {
        result[camelKey] = value;
      }
    }
    return result as T;
  }

  /**
   * Build WHERE clause from query options
   */
  private buildWhereClause(
    options?: QueryOptions,
    startParam = 1
  ): { clause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options?.where) {
      for (const [key, value] of Object.entries(options.where)) {
        conditions.push(`${this.toSnakeCase(key)} = ?`);
        params.push(value);
      }
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  /**
   * Build ORDER BY clause from query options
   */
  private buildOrderByClause(options?: QueryOptions): string {
    if (!options?.orderBy || options.orderBy.length === 0) {
      return '';
    }

    const orders = options.orderBy.map(
      ({ field, direction }) => `${this.toSnakeCase(field)} ${direction.toUpperCase()}`
    );

    return `ORDER BY ${orders.join(', ')}`;
  }

  /**
   * Build LIMIT/OFFSET clause from query options
   */
  private buildPaginationClause(options?: QueryOptions): string {
    const parts: string[] = [];
    if (options?.limit) parts.push(`LIMIT ${options.limit}`);
    if (options?.offset) parts.push(`OFFSET ${options.offset}`);
    return parts.join(' ');
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================

  async initialize(config: DatabaseProviderConfig): Promise<MutationResult> {
    try {
      this.debug = config.debug || false;
      this.dbPath = config.connectionString || ':memory:';

      this.db = await createSqliteConnection(this.dbPath, {
        mode: config.options?.mode as string,
      });

      // Create schema
      this.db.exec(SQLITE_SCHEMA_SQL);

      this.connected = true;
      this.config = config;
      this.log('info', `Connected to SQLite: ${this.dbPath}`);

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
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.connected = false;
    this.log('info', 'Disconnected');
    return { success: true };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; details?: string }> {
    const start = performance.now();
    try {
      if (!this.db) {
        return { healthy: false, latencyMs: 0, details: 'Not connected' };
      }

      this.db.prepare('SELECT 1').get();
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

  supportsTransactions(): boolean {
    return true;
  }

  async beginTransaction(): Promise<TransactionContext> {
    if (!this.db) {
      throw new Error('SQLite not connected');
    }

    const operations: TransactionOperation[] = [];
    const transactionId = `txn_${Date.now()}`;
    const db = this.db;

    return {
      transactionId,
      addOperation: (op) => operations.push(op),
      commit: async () => {
        db.exec('BEGIN TRANSACTION');
        try {
          for (const op of operations) {
            if (op.type === 'create' && op.data) {
              const snakeData = this.toSnakeCaseKeys(op.data);
              const keys = Object.keys(snakeData);
              const placeholders = keys.map(() => '?').join(', ');
              
              db.prepare(
                `INSERT INTO ${op.collection} (${keys.join(', ')}) VALUES (${placeholders})`
              ).run(...Object.values(snakeData));
            } else if (op.type === 'update' && op.id && op.data) {
              const snakeData = this.toSnakeCaseKeys(op.data);
              const sets = Object.keys(snakeData).map((k) => `${k} = ?`).join(', ');
              
              db.prepare(
                `UPDATE ${op.collection} SET ${sets} WHERE id = ?`
              ).run(...Object.values(snakeData), op.id);
            } else if (op.type === 'delete' && op.id) {
              db.prepare(`DELETE FROM ${op.collection} WHERE id = ?`).run(op.id);
            }
          }
          db.exec('COMMIT');
          return { success: true, affectedCount: operations.length };
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
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
    table: string,
    entity: T
  ): Promise<MutationResult<T>> {
    if (!this.db) return { success: false, error: 'Not connected' };

    try {
      const snakeEntity = this.toSnakeCaseKeys(entity as Record<string, unknown>);
      const keys = Object.keys(snakeEntity);
      const placeholders = keys.map(() => '?').join(', ');

      this.db.prepare(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
      ).run(...Object.values(snakeEntity));

      return { success: true, data: entity, affectedCount: 1 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Create failed',
      };
    }
  }

  private async getEntity<T>(
    table: string,
    id: string
  ): Promise<QueryResult<T>> {
    if (!this.db) return { success: false, data: null, error: 'Not connected' };

    try {
      const row = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as Record<string, unknown> | undefined;

      if (!row) {
        return { success: false, data: null, error: 'Entity not found' };
      }

      return { success: true, data: this.toCamelCaseKeys<T>(row) };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Get failed',
      };
    }
  }

  private async getAllEntities<T>(
    table: string,
    options?: QueryOptions
  ): Promise<QueryResult<T[]>> {
    if (!this.db) return { success: false, data: null, error: 'Not connected' };

    try {
      const { clause: whereClause, params } = this.buildWhereClause(options);
      const orderByClause = this.buildOrderByClause(options);
      const paginationClause = this.buildPaginationClause(options);

      const sql = `SELECT * FROM ${table} ${whereClause} ${orderByClause} ${paginationClause}`;
      const rows = this.db.prepare(sql).all(...params) as Record<string, unknown>[];

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
      const countResult = this.db.prepare(countSql).get(...params) as { total: number };

      return {
        success: true,
        data: rows.map((row) => this.toCamelCaseKeys<T>(row)),
        totalCount: countResult.total,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Query failed',
      };
    }
  }

  private async updateEntity<T>(
    table: string,
    id: string,
    updates: Partial<T>
  ): Promise<MutationResult<T>> {
    if (!this.db) return { success: false, error: 'Not connected' };

    try {
      const snakeUpdates = this.toSnakeCaseKeys({
        ...updates,
        updatedAt: new Date().toISOString(),
      } as Record<string, unknown>);

      const sets = Object.keys(snakeUpdates).map((k) => `${k} = ?`).join(', ');

      const result = this.db.prepare(
        `UPDATE ${table} SET ${sets} WHERE id = ?`
      ).run(...Object.values(snakeUpdates), id);

      if (result.changes === 0) {
        return { success: false, error: 'Entity not found' };
      }

      const updated = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as Record<string, unknown>;

      return {
        success: true,
        data: this.toCamelCaseKeys<T>(updated),
        affectedCount: 1,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  private async deleteEntity(
    table: string,
    id: string
  ): Promise<MutationResult> {
    if (!this.db) return { success: false, error: 'Not connected' };

    try {
      const result = this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      return { success: true, affectedCount: result.changes };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  private async getEntitiesByField<T>(
    table: string,
    field: string,
    value: unknown,
    options?: QueryOptions
  ): Promise<QueryResult<T[]>> {
    return this.getAllEntities(table, {
      ...options,
      where: { ...options?.where, [field]: value },
    });
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
    // SQLite CASCADE handles children
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
    if (!this.db) return { success: false, error: 'Not connected' };

    try {
      const result = this.db.prepare(
        `DELETE FROM ${COLLECTION_NAMES.EXECUTION_LOGS} WHERE timestamp < ?`
      ).run(olderThan.toISOString());

      return { success: true, affectedCount: result.changes };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clear failed',
      };
    }
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
      const { data: items } = await this.getAllEntities(collection);
      data[collection] = items ?? [];
    }

    return { success: true, data };
  }

  async importData(data: Record<string, unknown>): Promise<MutationResult> {
    const txn = await this.beginTransaction();

    try {
      for (const collection of Object.values(COLLECTION_NAMES)) {
        if (Array.isArray(data[collection])) {
          for (const item of data[collection] as Array<{ id: string }>) {
            txn.addOperation({
              type: 'create',
              collection,
              data: item,
            });
          }
        }
      }

      return await txn.commit();
    } catch (error) {
      await txn.rollback();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }

  async clearAllData(): Promise<MutationResult> {
    if (!this.db) return { success: false, error: 'Not connected' };

    try {
      // Delete in reverse dependency order
      const tables = [
        COLLECTION_NAMES.EXECUTION_LOGS,
        COLLECTION_NAMES.PROMOTED_ACTIONS,
        COLLECTION_NAMES.SCHEMA_MODELS,
        COLLECTION_NAMES.CURL_REQUESTS,
        COLLECTION_NAMES.HANDSHAKES,
        COLLECTION_NAMES.RESOURCES,
        COLLECTION_NAMES.PLATFORMS,
      ];

      for (const table of tables) {
        this.db.prepare(`DELETE FROM ${table}`).run();
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
