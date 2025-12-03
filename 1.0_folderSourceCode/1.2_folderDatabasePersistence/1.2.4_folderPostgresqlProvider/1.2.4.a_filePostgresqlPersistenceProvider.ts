// ============================================
// PROTOCOL OS - POSTGRESQL PERSISTENCE PROVIDER
// ============================================
// Address: 1.2.4.a
// Purpose: Direct PostgreSQL implementation of DatabaseProvider
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
import { createPostgresqlPool, type PostgresqlPoolInstance } from './1.2.4.b_filePostgresqlClientConfiguration';
import { COLLECTION_NAMES } from '../1.2.a_fileIndex';

/**
 * PostgreSQL Persistence Provider
 * 
 * Direct PostgreSQL connection for maximum control and performance.
 * 
 * Features:
 * - Full SQL power
 * - ACID transactions
 * - Complex queries
 * - Stored procedures
 * 
 * Best for:
 * - Server-side applications
 * - Self-hosted deployments
 * - Complex data requirements
 * - Existing PostgreSQL infrastructure
 * 
 * Note: Requires server-side execution (Node.js) or a proxy API.
 * Cannot run directly in browser due to TCP socket requirements.
 */
export class PostgresqlPersistenceProvider extends BaseDatabaseProvider {
  readonly providerType = 'postgresql' as const;
  private pool: PostgresqlPoolInstance | null = null;
  private debug = false;

  /**
   * Debug logging
   */
  private log(level: 'info' | 'error', message: string, ...args: unknown[]): void {
    if (this.debug) {
      const fn = level === 'error' ? console.error : console.log;
      fn(`[PostgreSQL] ${message}`, ...args);
    }
  }

  /**
   * Execute a query
   */
  private async query<T>(
    sql: string,
    params: unknown[] = []
  ): Promise<{ rows: T[]; rowCount: number }> {
    if (!this.pool) {
      throw new Error('PostgreSQL not connected');
    }

    const start = performance.now();
    const result = await this.pool.query(sql, params);
    const duration = performance.now() - start;

    this.log('info', `Query executed in ${duration.toFixed(2)}ms: ${sql.substring(0, 100)}...`);

    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? 0,
    };
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
      result[this.toSnakeCase(key)] = value;
    }
    return result;
  }

  /**
   * Convert object keys from snake_case to camelCase
   */
  private toCamelCaseKeys<T>(obj: Record<string, unknown>): T {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[this.toCamelCase(key)] = value;
    }
    return result as T;
  }

  /**
   * Build WHERE clause from query options
   */
  private buildWhereClause(
    options?: QueryOptions,
    startParam = 1
  ): { clause: string; params: unknown[]; nextParam: number } {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = startParam;

    if (options?.where) {
      for (const [key, value] of Object.entries(options.where)) {
        conditions.push(`${this.toSnakeCase(key)} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    return {
      clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
      nextParam: paramIndex,
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

      if (!config.connectionString) {
        return {
          success: false,
          error: 'PostgreSQL connection string is required',
        };
      }

      this.pool = createPostgresqlPool(config.connectionString, {
        ssl: config.options?.ssl as boolean,
        min: config.options?.poolMin as number,
        max: config.options?.poolMax as number,
      });

      // Test connection
      await this.query('SELECT 1');

      this.connected = true;
      this.config = config;
      this.log('info', 'Connected to PostgreSQL');

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
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    this.connected = false;
    this.log('info', 'Disconnected');
    return { success: true };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; details?: string }> {
    const start = performance.now();
    try {
      await this.query('SELECT 1');
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
    if (!this.pool) {
      throw new Error('PostgreSQL not connected');
    }

    const client = await this.pool.connect();
    await client.query('BEGIN');

    const operations: TransactionOperation[] = [];
    const transactionId = `txn_${Date.now()}`;

    return {
      transactionId,
      addOperation: (op) => operations.push(op),
      commit: async () => {
        try {
          // Execute all operations
          for (const op of operations) {
            if (op.type === 'create' && op.data) {
              const snakeData = this.toSnakeCaseKeys(op.data);
              const keys = Object.keys(snakeData);
              const values = Object.values(snakeData);
              const placeholders = keys.map((_, i) => `$${i + 1}`);
              
              await client.query(
                `INSERT INTO ${op.collection} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})`,
                values
              );
            } else if (op.type === 'update' && op.id && op.data) {
              const snakeData = this.toSnakeCaseKeys(op.data);
              const sets = Object.keys(snakeData).map((k, i) => `${k} = $${i + 2}`);
              
              await client.query(
                `UPDATE ${op.collection} SET ${sets.join(', ')} WHERE id = $1`,
                [op.id, ...Object.values(snakeData)]
              );
            } else if (op.type === 'delete' && op.id) {
              await client.query(
                `DELETE FROM ${op.collection} WHERE id = $1`,
                [op.id]
              );
            }
          }

          await client.query('COMMIT');
          return { success: true, affectedCount: operations.length };
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      rollback: async () => {
        await client.query('ROLLBACK');
        client.release();
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
    try {
      const snakeEntity = this.toSnakeCaseKeys(entity as Record<string, unknown>);
      const keys = Object.keys(snakeEntity);
      const values = Object.values(snakeEntity);
      const placeholders = keys.map((_, i) => `$${i + 1}`);

      const { rows } = await this.query<Record<string, unknown>>(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
        values
      );

      return {
        success: true,
        data: this.toCamelCaseKeys<T>(rows[0]),
        affectedCount: 1,
      };
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
    try {
      const { rows } = await this.query<Record<string, unknown>>(
        `SELECT * FROM ${table} WHERE id = $1`,
        [id]
      );

      if (rows.length === 0) {
        return { success: false, data: null, error: 'Entity not found' };
      }

      return { success: true, data: this.toCamelCaseKeys<T>(rows[0]) };
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
    try {
      const { clause: whereClause, params } = this.buildWhereClause(options);
      const orderByClause = this.buildOrderByClause(options);
      const paginationClause = this.buildPaginationClause(options);

      const sql = `SELECT * FROM ${table} ${whereClause} ${orderByClause} ${paginationClause}`;
      const { rows } = await this.query<Record<string, unknown>>(sql, params);

      // Get total count
      const countSql = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
      const { rows: countRows } = await this.query<{ total: string }>(countSql, params);
      const totalCount = parseInt(countRows[0]?.total ?? '0', 10);

      return {
        success: true,
        data: rows.map((row) => this.toCamelCaseKeys<T>(row)),
        totalCount,
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
    try {
      const snakeUpdates = this.toSnakeCaseKeys({
        ...updates,
        updatedAt: new Date().toISOString(),
      } as Record<string, unknown>);

      const sets = Object.keys(snakeUpdates).map((k, i) => `${k} = $${i + 2}`);
      const values = [id, ...Object.values(snakeUpdates)];

      const { rows } = await this.query<Record<string, unknown>>(
        `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
        values
      );

      if (rows.length === 0) {
        return { success: false, error: 'Entity not found' };
      }

      return {
        success: true,
        data: this.toCamelCaseKeys<T>(rows[0]),
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
    try {
      const { rowCount } = await this.query(
        `DELETE FROM ${table} WHERE id = $1`,
        [id]
      );

      return { success: true, affectedCount: rowCount };
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
    // Cascade handled by foreign keys, but we can be explicit
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
    try {
      const { rowCount } = await this.query(
        `DELETE FROM ${COLLECTION_NAMES.EXECUTION_LOGS} WHERE timestamp < $1`,
        [olderThan.toISOString()]
      );

      return { success: true, affectedCount: rowCount };
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
        await this.query(`DELETE FROM ${table}`);
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
