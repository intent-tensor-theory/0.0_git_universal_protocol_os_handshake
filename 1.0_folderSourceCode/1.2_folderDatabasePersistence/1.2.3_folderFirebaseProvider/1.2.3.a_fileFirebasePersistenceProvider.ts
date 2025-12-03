// ============================================
// PROTOCOL OS - FIREBASE PERSISTENCE PROVIDER
// ============================================
// Address: 1.2.3.a
// Purpose: Firebase Firestore implementation of DatabaseProvider
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
import { createFirebaseApp, type FirebaseAppInstance } from './1.2.3.b_fileFirebaseClientConfiguration';
import { COLLECTION_NAMES } from '../1.2.a_fileIndex';

// Firebase Firestore types (dynamic import)
type Firestore = import('firebase/firestore').Firestore;
type DocumentData = import('firebase/firestore').DocumentData;
type Query = import('firebase/firestore').Query;

/**
 * Firebase Persistence Provider
 * 
 * Cloud-hosted NoSQL database via Firebase Firestore.
 * 
 * Features:
 * - Real-time listeners
 * - Offline persistence
 * - Automatic scaling
 * - Firebase Auth integration
 * 
 * Best for:
 * - Real-time applications
 * - Mobile + web apps
 * - Serverless architectures
 */
export class FirebasePersistenceProvider extends BaseDatabaseProvider {
  readonly providerType = 'firebase' as const;
  private app: FirebaseAppInstance | null = null;
  private db: Firestore | null = null;
  private debug = false;

  // Firebase modules (loaded dynamically)
  private firestoreModule: typeof import('firebase/firestore') | null = null;

  /**
   * Debug logging
   */
  private log(level: 'info' | 'error', message: string, ...args: unknown[]): void {
    if (this.debug) {
      const fn = level === 'error' ? console.error : console.log;
      fn(`[Firebase] ${message}`, ...args);
    }
  }

  /**
   * Get Firestore collection reference
   */
  private collection(name: string) {
    if (!this.db || !this.firestoreModule) {
      throw new Error('Firebase not initialized');
    }
    return this.firestoreModule.collection(this.db, name);
  }

  /**
   * Get document reference
   */
  private doc(collection: string, id: string) {
    if (!this.db || !this.firestoreModule) {
      throw new Error('Firebase not initialized');
    }
    return this.firestoreModule.doc(this.db, collection, id);
  }

  /**
   * Apply query options to a Firestore query
   */
  private applyQueryOptions(
    baseQuery: Query<DocumentData>,
    options?: QueryOptions
  ): Query<DocumentData> {
    if (!this.firestoreModule) {
      throw new Error('Firebase not initialized');
    }

    let q = baseQuery;
    const { where: whereFunc, orderBy, limit, startAfter } = this.firestoreModule;

    // Apply where filters
    if (options?.where) {
      for (const [key, value] of Object.entries(options.where)) {
        q = this.firestoreModule.query(q, whereFunc(key, '==', value));
      }
    }

    // Apply orderBy
    if (options?.orderBy) {
      for (const { field, direction } of options.orderBy) {
        q = this.firestoreModule.query(q, orderBy(field, direction));
      }
    }

    // Apply limit
    if (options?.limit) {
      q = this.firestoreModule.query(q, limit(options.limit));
    }

    return q;
  }

  // ============================================
  // LIFECYCLE METHODS
  // ============================================

  async initialize(config: DatabaseProviderConfig): Promise<MutationResult> {
    try {
      this.debug = config.debug || false;

      // Dynamically import Firebase modules
      this.firestoreModule = await import('firebase/firestore');
      const firebaseApp = await import('firebase/app');

      if (!config.apiKey || !config.projectId) {
        return {
          success: false,
          error: 'Firebase API key and project ID are required',
        };
      }

      this.app = createFirebaseApp({
        apiKey: config.apiKey,
        projectId: config.projectId,
        authDomain: config.options?.authDomain as string,
        storageBucket: config.options?.storageBucket as string,
        messagingSenderId: config.options?.messagingSenderId as string,
        appId: config.options?.appId as string,
      });

      this.db = this.firestoreModule.getFirestore(this.app);

      // Enable offline persistence
      try {
        await this.firestoreModule.enableIndexedDbPersistence(this.db);
      } catch (err) {
        // Persistence already enabled or not supported
        this.log('info', 'Offline persistence not enabled:', err);
      }

      this.connected = true;
      this.config = config;
      this.log('info', 'Connected to Firebase');

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
    this.db = null;
    this.app = null;
    this.connected = false;
    this.log('info', 'Disconnected');
    return { success: true };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; details?: string }> {
    const start = performance.now();
    try {
      if (!this.db || !this.firestoreModule) {
        return { healthy: false, latencyMs: 0, details: 'Not connected' };
      }

      // Try to read a document
      const testRef = this.doc(COLLECTION_NAMES.PLATFORMS, '__health_check__');
      await this.firestoreModule.getDoc(testRef);

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
    if (!this.db || !this.firestoreModule) {
      throw new Error('Firebase not initialized');
    }

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
        const batch = this.firestoreModule!.writeBatch(this.db!);

        for (const op of operations) {
          const ref = op.id
            ? this.doc(op.collection, op.id)
            : this.firestoreModule!.doc(this.collection(op.collection));

          if (op.type === 'create' && op.data) {
            batch.set(ref, op.data);
          } else if (op.type === 'update' && op.data) {
            batch.update(ref, op.data);
          } else if (op.type === 'delete') {
            batch.delete(ref);
          }
        }

        await batch.commit();
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
    collectionName: string,
    entity: T
  ): Promise<MutationResult<T>> {
    if (!this.firestoreModule) return { success: false, error: 'Not connected' };

    try {
      const ref = this.doc(collectionName, entity.id);
      await this.firestoreModule.setDoc(ref, entity as Record<string, unknown>);
      return { success: true, data: entity, affectedCount: 1 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Create failed',
      };
    }
  }

  private async getEntity<T>(
    collectionName: string,
    id: string
  ): Promise<QueryResult<T>> {
    if (!this.firestoreModule) return { success: false, data: null, error: 'Not connected' };

    try {
      const ref = this.doc(collectionName, id);
      const snap = await this.firestoreModule.getDoc(ref);

      if (!snap.exists()) {
        return { success: false, data: null, error: 'Entity not found' };
      }

      return { success: true, data: { id: snap.id, ...snap.data() } as T };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Get failed',
      };
    }
  }

  private async getAllEntities<T>(
    collectionName: string,
    options?: QueryOptions
  ): Promise<QueryResult<T[]>> {
    if (!this.firestoreModule) return { success: false, data: null, error: 'Not connected' };

    try {
      const colRef = this.collection(collectionName);
      const q = this.applyQueryOptions(colRef, options);
      const snap = await this.firestoreModule.getDocs(q);

      const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
      return { success: true, data: items, totalCount: snap.size };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Query failed',
      };
    }
  }

  private async updateEntity<T>(
    collectionName: string,
    id: string,
    updates: Partial<T>
  ): Promise<MutationResult<T>> {
    if (!this.firestoreModule) return { success: false, error: 'Not connected' };

    try {
      const ref = this.doc(collectionName, id);
      await this.firestoreModule.updateDoc(ref, {
        ...updates,
        updatedAt: new Date().toISOString(),
      } as Record<string, unknown>);

      const snap = await this.firestoreModule.getDoc(ref);
      return {
        success: true,
        data: { id: snap.id, ...snap.data() } as T,
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
    collectionName: string,
    id: string
  ): Promise<MutationResult> {
    if (!this.firestoreModule) return { success: false, error: 'Not connected' };

    try {
      const ref = this.doc(collectionName, id);
      await this.firestoreModule.deleteDoc(ref);
      return { success: true, affectedCount: 1 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  private async getEntitiesByField<T>(
    collectionName: string,
    field: string,
    value: unknown,
    options?: QueryOptions
  ): Promise<QueryResult<T[]>> {
    return this.getAllEntities(collectionName, {
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
    // Delete child resources first
    const { data: resources } = await this.getResourcesByPlatform(id);
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
    const childCollections = [
      COLLECTION_NAMES.CURL_REQUESTS,
      COLLECTION_NAMES.SCHEMA_MODELS,
      COLLECTION_NAMES.PROMOTED_ACTIONS,
    ];

    for (const col of childCollections) {
      const { data } = await this.getEntitiesByField<{ id: string }>(col, 'handshakeId', id);
      if (data) {
        for (const item of data) {
          await this.deleteEntity(col, item.id);
        }
      }
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
    if (!this.firestoreModule) return { success: false, error: 'Not connected' };

    try {
      const ref = this.firestoreModule.doc(this.collection(COLLECTION_NAMES.EXECUTION_LOGS));
      const withId = { ...result, id: ref.id };
      await this.firestoreModule.setDoc(ref, withId);
      return { success: true, data: withId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Log failed',
      };
    }
  }

  async getExecutionLogs(handshakeId: string, options?: QueryOptions): Promise<QueryResult<HandshakeExecutionResult[]>> {
    return this.getEntitiesByField(COLLECTION_NAMES.EXECUTION_LOGS, 'handshakeId', handshakeId, options);
  }

  async clearOldExecutionLogs(olderThan: Date): Promise<MutationResult> {
    if (!this.firestoreModule) return { success: false, error: 'Not connected' };

    try {
      const q = this.firestoreModule.query(
        this.collection(COLLECTION_NAMES.EXECUTION_LOGS),
        this.firestoreModule.where('timestamp', '<', olderThan.toISOString())
      );

      const snap = await this.firestoreModule.getDocs(q);
      const batch = this.firestoreModule.writeBatch(this.db!);

      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      return { success: true, affectedCount: snap.size };
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
    if (!this.firestoreModule) return { success: false, error: 'Not connected' };

    try {
      for (const collection of Object.values(COLLECTION_NAMES)) {
        if (Array.isArray(data[collection])) {
          for (const item of data[collection] as Array<{ id: string }>) {
            const ref = this.doc(collection, item.id);
            await this.firestoreModule.setDoc(ref, item);
          }
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
    if (!this.firestoreModule) return { success: false, error: 'Not connected' };

    try {
      for (const collection of Object.values(COLLECTION_NAMES)) {
        const snap = await this.firestoreModule.getDocs(this.collection(collection));
        const batch = this.firestoreModule.writeBatch(this.db!);
        snap.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
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
