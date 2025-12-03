// ============================================
// PROTOCOL OS - PLATFORM RESOURCE HANDSHAKE DATA SERIALIZER
// ============================================
// Address: 1.4.b
// Purpose: Serialization and Deserialization for Persistence
// ============================================

/**
 * Platform Resource Handshake Data Serializer
 * 
 * Handles serialization and deserialization of application state
 * for persistence and data exchange. Implements:
 * - JSON serialization with schema versioning
 * - Data migration between versions
 * - Compression for large datasets
 * - Encryption for sensitive data
 * - Import/export functionality
 * - Validation and sanitization
 */

import { 
  AppState, 
  Platform, 
  Resource, 
  Handshake,
  createInitialState 
} from './1.4.a_filePlatformResourceHandshakeStateManager';

// ============================================
// SCHEMA VERSIONING
// ============================================

/**
 * Current schema version
 */
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Schema version history
 */
export const SCHEMA_VERSIONS = [
  '1.0.0', // Initial version
] as const;

export type SchemaVersion = typeof SCHEMA_VERSIONS[number];

/**
 * Serialized data wrapper
 */
export interface SerializedData {
  /** Schema version */
  schemaVersion: SchemaVersion;
  
  /** Data format */
  format: 'json' | 'compressed' | 'encrypted';
  
  /** Serialization timestamp */
  serializedAt: string;
  
  /** Application version */
  appVersion?: string;
  
  /** Checksum for integrity */
  checksum?: string;
  
  /** Payload data */
  payload: unknown;
  
  /** Metadata */
  meta?: {
    platformCount?: number;
    resourceCount?: number;
    handshakeCount?: number;
    compressed?: boolean;
    encrypted?: boolean;
  };
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Include archived items */
  includeArchived?: boolean;
  
  /** Include version history */
  includeVersionHistory?: boolean;
  
  /** Include execution history */
  includeExecutionHistory?: boolean;
  
  /** Include UI state */
  includeUiState?: boolean;
  
  /** Compress output */
  compress?: boolean;
  
  /** Encrypt sensitive data */
  encrypt?: boolean;
  
  /** Encryption key (required if encrypt is true) */
  encryptionKey?: string;
  
  /** Pretty print JSON */
  prettyPrint?: boolean;
  
  /** Filter by platform IDs */
  platformIds?: string[];
  
  /** Filter by resource IDs */
  resourceIds?: string[];
  
  /** Filter by handshake IDs */
  handshakeIds?: string[];
}

/**
 * Import options
 */
export interface ImportOptions {
  /** Merge with existing data */
  merge?: boolean;
  
  /** Overwrite existing items with same ID */
  overwrite?: boolean;
  
  /** Generate new IDs for imported items */
  regenerateIds?: boolean;
  
  /** Decryption key (required if data is encrypted) */
  decryptionKey?: string;
  
  /** Validate data before import */
  validate?: boolean;
  
  /** Skip invalid items instead of failing */
  skipInvalid?: boolean;
}

/**
 * Import result
 */
export interface ImportResult {
  /** Success status */
  success: boolean;
  
  /** Imported state */
  state?: AppState;
  
  /** Statistics */
  stats: {
    platformsImported: number;
    resourcesImported: number;
    handshakesImported: number;
    itemsSkipped: number;
  };
  
  /** Errors */
  errors: Array<{
    type: 'platform' | 'resource' | 'handshake' | 'general';
    id?: string;
    message: string;
  }>;
  
  /** Warnings */
  warnings: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is valid */
  valid: boolean;
  
  /** Validation errors */
  errors: Array<{
    path: string;
    message: string;
    value?: unknown;
  }>;
  
  /** Validation warnings */
  warnings: string[];
}

// ============================================
// SERIALIZER CLASS
// ============================================

/**
 * Data Serializer
 */
export class DataSerializer {
  // ============================================
  // SERIALIZATION
  // ============================================

  /**
   * Serialize application state
   */
  static serialize(state: AppState, options: ExportOptions = {}): string {
    const {
      includeArchived = true,
      includeVersionHistory = true,
      includeExecutionHistory = false,
      includeUiState = false,
      compress = false,
      encrypt = false,
      encryptionKey,
      prettyPrint = false,
      platformIds,
      resourceIds,
      handshakeIds,
    } = options;

    // Filter and prepare data
    let filteredState = this.filterState(state, {
      includeArchived,
      includeVersionHistory,
      includeExecutionHistory,
      includeUiState,
      platformIds,
      resourceIds,
      handshakeIds,
    });

    // Convert to serializable format
    const serializableState = this.toSerializable(filteredState);

    // Create payload
    let payload: unknown = serializableState;

    // Compress if requested
    if (compress) {
      payload = this.compress(JSON.stringify(payload));
    }

    // Encrypt if requested
    if (encrypt && encryptionKey) {
      payload = this.encrypt(
        typeof payload === 'string' ? payload : JSON.stringify(payload),
        encryptionKey
      );
    }

    // Create wrapper
    const serialized: SerializedData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      format: encrypt ? 'encrypted' : compress ? 'compressed' : 'json',
      serializedAt: new Date().toISOString(),
      payload,
      meta: {
        platformCount: Object.keys(filteredState.platforms).length,
        resourceCount: Object.keys(filteredState.resources).length,
        handshakeCount: Object.keys(filteredState.handshakes).length,
        compressed: compress,
        encrypted: encrypt,
      },
    };

    // Calculate checksum
    serialized.checksum = this.calculateChecksum(serialized.payload);

    return prettyPrint 
      ? JSON.stringify(serialized, null, 2) 
      : JSON.stringify(serialized);
  }

  /**
   * Filter state based on options
   */
  private static filterState(
    state: AppState, 
    options: {
      includeArchived?: boolean;
      includeVersionHistory?: boolean;
      includeExecutionHistory?: boolean;
      includeUiState?: boolean;
      platformIds?: string[];
      resourceIds?: string[];
      handshakeIds?: string[];
    }
  ): AppState {
    let platforms = { ...state.platforms };
    let resources = { ...state.resources };
    let handshakes = { ...state.handshakes };
    let platformOrder = [...state.platformOrder];

    // Filter by specific IDs
    if (options.platformIds) {
      platforms = {};
      options.platformIds.forEach(id => {
        if (state.platforms[id]) {
          platforms[id] = state.platforms[id];
        }
      });
      platformOrder = platformOrder.filter(id => options.platformIds!.includes(id));
    }

    if (options.resourceIds) {
      resources = {};
      options.resourceIds.forEach(id => {
        if (state.resources[id]) {
          resources[id] = state.resources[id];
        }
      });
    }

    if (options.handshakeIds) {
      handshakes = {};
      options.handshakeIds.forEach(id => {
        if (state.handshakes[id]) {
          handshakes[id] = state.handshakes[id];
        }
      });
    }

    // Filter archived items
    if (!options.includeArchived) {
      handshakes = Object.fromEntries(
        Object.entries(handshakes).filter(([_, h]) => !h.isArchived)
      );
    }

    // Remove version history if not needed
    if (!options.includeVersionHistory) {
      handshakes = Object.fromEntries(
        Object.entries(handshakes).map(([id, h]) => [
          id,
          { ...h, versions: h.versions.filter(v => v.isCurrent) }
        ])
      );
    }

    // Remove execution history if not needed
    if (!options.includeExecutionHistory) {
      handshakes = Object.fromEntries(
        Object.entries(handshakes).map(([id, h]) => [
          id,
          { ...h, lastExecutionResult: undefined }
        ])
      );
    }

    // Create filtered state
    const filteredState: AppState = {
      ...state,
      platforms,
      resources,
      handshakes,
      platformOrder,
    };

    // Optionally exclude UI state
    if (!options.includeUiState) {
      filteredState.ui = createInitialState().ui;
    }

    return filteredState;
  }

  /**
   * Convert state to serializable format
   */
  private static toSerializable(state: AppState): Record<string, unknown> {
    return {
      platforms: Object.fromEntries(
        Object.entries(state.platforms).map(([id, platform]) => [
          id,
          this.platformToSerializable(platform)
        ])
      ),
      resources: Object.fromEntries(
        Object.entries(state.resources).map(([id, resource]) => [
          id,
          this.resourceToSerializable(resource)
        ])
      ),
      handshakes: Object.fromEntries(
        Object.entries(state.handshakes).map(([id, handshake]) => [
          id,
          this.handshakeToSerializable(handshake)
        ])
      ),
      platformOrder: state.platformOrder,
      selectedPlatformId: state.selectedPlatformId,
      selectedResourceId: state.selectedResourceId,
      selectedHandshakeId: state.selectedHandshakeId,
      ui: {
        ...state.ui,
        view: {
          expandedPlatforms: Array.from(state.ui.view.expandedPlatforms),
          expandedResources: Array.from(state.ui.view.expandedResources),
        },
      },
      meta: state.meta,
    };
  }

  /**
   * Convert platform to serializable format
   */
  private static platformToSerializable(platform: Platform): Record<string, unknown> {
    return {
      ...platform,
      createdAt: platform.createdAt.toISOString(),
      updatedAt: platform.updatedAt.toISOString(),
    };
  }

  /**
   * Convert resource to serializable format
   */
  private static resourceToSerializable(resource: Resource): Record<string, unknown> {
    return {
      ...resource,
      createdAt: resource.createdAt.toISOString(),
      updatedAt: resource.updatedAt.toISOString(),
      tokenExpiresAt: resource.tokenExpiresAt?.toISOString(),
      lastHealthCheck: resource.lastHealthCheck?.toISOString(),
    };
  }

  /**
   * Convert handshake to serializable format
   */
  private static handshakeToSerializable(handshake: Handshake): Record<string, unknown> {
    return {
      ...handshake,
      createdAt: handshake.createdAt.toISOString(),
      updatedAt: handshake.updatedAt.toISOString(),
      lastUsedAt: handshake.lastUsedAt?.toISOString(),
      lastExecutionResult: handshake.lastExecutionResult ? {
        ...handshake.lastExecutionResult,
        executedAt: handshake.lastExecutionResult.executedAt.toISOString(),
      } : undefined,
      versions: handshake.versions.map(v => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
      })),
    };
  }

  // ============================================
  // DESERIALIZATION
  // ============================================

  /**
   * Deserialize data to application state
   */
  static deserialize(data: string, options: ImportOptions = {}): ImportResult {
    const {
      merge = false,
      overwrite = false,
      regenerateIds = false,
      decryptionKey,
      validate = true,
      skipInvalid = false,
    } = options;

    const result: ImportResult = {
      success: false,
      stats: {
        platformsImported: 0,
        resourcesImported: 0,
        handshakesImported: 0,
        itemsSkipped: 0,
      },
      errors: [],
      warnings: [],
    };

    try {
      // Parse wrapper
      const serialized = JSON.parse(data) as SerializedData;

      // Check schema version
      if (!SCHEMA_VERSIONS.includes(serialized.schemaVersion as SchemaVersion)) {
        result.errors.push({
          type: 'general',
          message: `Unsupported schema version: ${serialized.schemaVersion}`,
        });
        return result;
      }

      // Verify checksum
      if (serialized.checksum) {
        const calculatedChecksum = this.calculateChecksum(serialized.payload);
        if (calculatedChecksum !== serialized.checksum) {
          result.warnings.push('Checksum mismatch - data may be corrupted');
        }
      }

      // Get payload
      let payload = serialized.payload;

      // Decrypt if needed
      if (serialized.format === 'encrypted') {
        if (!decryptionKey) {
          result.errors.push({
            type: 'general',
            message: 'Data is encrypted but no decryption key provided',
          });
          return result;
        }
        payload = JSON.parse(this.decrypt(payload as string, decryptionKey));
      }

      // Decompress if needed
      if (serialized.format === 'compressed') {
        payload = JSON.parse(this.decompress(payload as string));
      }

      // Validate if requested
      if (validate) {
        const validationResult = this.validate(payload as Record<string, unknown>);
        if (!validationResult.valid && !skipInvalid) {
          result.errors.push(...validationResult.errors.map(e => ({
            type: 'general' as const,
            message: `${e.path}: ${e.message}`,
          })));
          return result;
        }
        result.warnings.push(...validationResult.warnings);
      }

      // Migrate if needed
      const migratedPayload = this.migrate(
        payload as Record<string, unknown>, 
        serialized.schemaVersion
      );

      // Convert to state
      const importedState = this.fromSerializable(
        migratedPayload,
        regenerateIds
      );

      // Count imported items
      result.stats.platformsImported = Object.keys(importedState.platforms).length;
      result.stats.resourcesImported = Object.keys(importedState.resources).length;
      result.stats.handshakesImported = Object.keys(importedState.handshakes).length;

      result.success = true;
      result.state = importedState;

      return result;
    } catch (error) {
      result.errors.push({
        type: 'general',
        message: `Deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return result;
    }
  }

  /**
   * Convert serializable format to state
   */
  private static fromSerializable(
    data: Record<string, unknown>,
    regenerateIds: boolean
  ): AppState {
    const idMap = new Map<string, string>();

    const generateNewId = (oldId: string): string => {
      if (!regenerateIds) return oldId;
      
      if (!idMap.has(oldId)) {
        idMap.set(oldId, `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      }
      return idMap.get(oldId)!;
    };

    // Convert platforms
    const platforms: Record<string, Platform> = {};
    const platformsData = (data.platforms || {}) as Record<string, Record<string, unknown>>;
    
    for (const [oldId, platformData] of Object.entries(platformsData)) {
      const newId = generateNewId(oldId);
      platforms[newId] = this.platformFromSerializable(platformData, newId, idMap, regenerateIds);
    }

    // Convert resources
    const resources: Record<string, Resource> = {};
    const resourcesData = (data.resources || {}) as Record<string, Record<string, unknown>>;
    
    for (const [oldId, resourceData] of Object.entries(resourcesData)) {
      const newId = generateNewId(oldId);
      resources[newId] = this.resourceFromSerializable(resourceData, newId, idMap, regenerateIds);
    }

    // Convert handshakes
    const handshakes: Record<string, Handshake> = {};
    const handshakesData = (data.handshakes || {}) as Record<string, Record<string, unknown>>;
    
    for (const [oldId, handshakeData] of Object.entries(handshakesData)) {
      const newId = generateNewId(oldId);
      handshakes[newId] = this.handshakeFromSerializable(handshakeData, newId, idMap, regenerateIds);
    }

    // Convert platform order
    const platformOrder = ((data.platformOrder || []) as string[]).map(id => 
      regenerateIds ? (idMap.get(id) || id) : id
    );

    // Convert UI state
    const uiData = (data.ui || {}) as Record<string, unknown>;
    const viewData = (uiData.view || {}) as Record<string, unknown>;
    
    const ui: AppState['ui'] = {
      isLoading: false,
      error: null,
      activeModal: null,
      searchQuery: (uiData.searchQuery as string) || '',
      filters: (uiData.filters as AppState['ui']['filters']) || createInitialState().ui.filters,
      view: {
        expandedPlatforms: new Set(
          ((viewData.expandedPlatforms || []) as string[]).map(id => 
            regenerateIds ? (idMap.get(id) || id) : id
          )
        ),
        expandedResources: new Set(
          ((viewData.expandedResources || []) as string[]).map(id => 
            regenerateIds ? (idMap.get(id) || id) : id
          )
        ),
      },
    };

    // Convert meta
    const metaData = (data.meta || {}) as Record<string, unknown>;
    const meta: AppState['meta'] = {
      version: (metaData.version as string) || CURRENT_SCHEMA_VERSION,
      lastSavedAt: metaData.lastSavedAt ? new Date(metaData.lastSavedAt as string) : null,
      isDirty: false,
    };

    return {
      platforms,
      resources,
      handshakes,
      platformOrder,
      selectedPlatformId: null,
      selectedResourceId: null,
      selectedHandshakeId: null,
      ui,
      meta,
    };
  }

  /**
   * Convert serializable platform to Platform
   */
  private static platformFromSerializable(
    data: Record<string, unknown>,
    newId: string,
    idMap: Map<string, string>,
    regenerateIds: boolean
  ): Platform {
    return {
      id: newId,
      serial: data.serial as string,
      name: data.name as string,
      description: data.description as string | undefined,
      iconUrl: data.iconUrl as string | undefined,
      edition: data.edition as Platform['edition'],
      status: data.status as Platform['status'],
      baseUrl: data.baseUrl as string | undefined,
      docsUrl: data.docsUrl as string | undefined,
      resourceIds: ((data.resourceIds || []) as string[]).map(id => 
        regenerateIds ? (idMap.get(id) || id) : id
      ),
      metadata: data.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
      isExpanded: data.isExpanded as boolean | undefined,
    };
  }

  /**
   * Convert serializable resource to Resource
   */
  private static resourceFromSerializable(
    data: Record<string, unknown>,
    newId: string,
    idMap: Map<string, string>,
    regenerateIds: boolean
  ): Resource {
    const platformId = data.platformId as string;
    
    return {
      id: newId,
      serial: data.serial as string,
      platformId: regenerateIds ? (idMap.get(platformId) || platformId) : platformId,
      name: data.name as string,
      description: data.description as string | undefined,
      type: data.type as string,
      status: data.status as Resource['status'],
      endpoint: data.endpoint as string | undefined,
      handshakeIds: ((data.handshakeIds || []) as string[]).map(id => 
        regenerateIds ? (idMap.get(id) || id) : id
      ),
      metadata: data.metadata as Record<string, unknown> | undefined,
      tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt as string) : undefined,
      lastHealthCheck: data.lastHealthCheck ? new Date(data.lastHealthCheck as string) : undefined,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
      isExpanded: data.isExpanded as boolean | undefined,
    };
  }

  /**
   * Convert serializable handshake to Handshake
   */
  private static handshakeFromSerializable(
    data: Record<string, unknown>,
    newId: string,
    idMap: Map<string, string>,
    regenerateIds: boolean
  ): Handshake {
    const resourceId = data.resourceId as string;
    const lastExecutionResult = data.lastExecutionResult as Record<string, unknown> | undefined;
    const versions = (data.versions || []) as Array<Record<string, unknown>>;
    
    return {
      id: newId,
      serial: data.serial as string | undefined,
      resourceId: regenerateIds ? (idMap.get(resourceId) || resourceId) : resourceId,
      name: data.name as string,
      description: data.description as string | undefined,
      protocol: data.protocol as Handshake['protocol'],
      handshakeType: data.handshakeType as string,
      configuration: data.configuration as Handshake['configuration'],
      versions: versions.map(v => ({
        id: v.id as string,
        versionNumber: v.versionNumber as string,
        createdAt: new Date(v.createdAt as string),
        createdBy: v.createdBy as string | undefined,
        changeDescription: v.changeDescription as string | undefined,
        changeType: v.changeType as 'create' | 'update' | 'restore' | 'duplicate' | 'import',
        changes: v.changes as Array<{ field: string; oldValue?: unknown; newValue?: unknown; type: 'add' | 'modify' | 'remove' }> | undefined,
        configSnapshot: v.configSnapshot as Handshake['configuration'],
        protocolSnapshot: v.protocolSnapshot as Handshake['protocol'],
        previousVersionId: v.previousVersionId as string | undefined,
        isCurrent: v.isCurrent as boolean,
      })),
      category: data.category as string | undefined,
      tags: data.tags as string[] | undefined,
      notes: data.notes as string | undefined,
      isFavorite: data.isFavorite as boolean,
      isArchived: data.isArchived as boolean,
      usageCount: data.usageCount as number | undefined,
      successRate: data.successRate as number | undefined,
      lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt as string) : undefined,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
      createdBy: data.createdBy as string | undefined,
      status: data.status as Handshake['status'],
      lastExecutionResult: lastExecutionResult ? {
        success: lastExecutionResult.success as boolean,
        statusCode: lastExecutionResult.statusCode as number | undefined,
        duration: lastExecutionResult.duration as number | undefined,
        executedAt: new Date(lastExecutionResult.executedAt as string),
        error: lastExecutionResult.error as string | undefined,
      } : undefined,
    };
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validate serialized data
   */
  static validate(data: Record<string, unknown>): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Validate platforms
    const platforms = data.platforms as Record<string, unknown> | undefined;
    if (platforms) {
      for (const [id, platform] of Object.entries(platforms)) {
        const platformData = platform as Record<string, unknown>;
        
        if (!platformData.name) {
          result.errors.push({
            path: `platforms.${id}.name`,
            message: 'Platform name is required',
          });
          result.valid = false;
        }
        
        if (!platformData.edition) {
          result.warnings.push(`Platform ${id} has no edition, will default to 'free'`);
        }
      }
    }

    // Validate resources
    const resources = data.resources as Record<string, unknown> | undefined;
    if (resources) {
      for (const [id, resource] of Object.entries(resources)) {
        const resourceData = resource as Record<string, unknown>;
        
        if (!resourceData.name) {
          result.errors.push({
            path: `resources.${id}.name`,
            message: 'Resource name is required',
          });
          result.valid = false;
        }
        
        if (!resourceData.platformId) {
          result.errors.push({
            path: `resources.${id}.platformId`,
            message: 'Resource platformId is required',
          });
          result.valid = false;
        }
      }
    }

    // Validate handshakes
    const handshakes = data.handshakes as Record<string, unknown> | undefined;
    if (handshakes) {
      for (const [id, handshake] of Object.entries(handshakes)) {
        const handshakeData = handshake as Record<string, unknown>;
        
        if (!handshakeData.name) {
          result.errors.push({
            path: `handshakes.${id}.name`,
            message: 'Handshake name is required',
          });
          result.valid = false;
        }
        
        if (!handshakeData.resourceId) {
          result.errors.push({
            path: `handshakes.${id}.resourceId`,
            message: 'Handshake resourceId is required',
          });
          result.valid = false;
        }
        
        if (!handshakeData.protocol) {
          result.errors.push({
            path: `handshakes.${id}.protocol`,
            message: 'Handshake protocol is required',
          });
          result.valid = false;
        }
      }
    }

    return result;
  }

  // ============================================
  // MIGRATION
  // ============================================

  /**
   * Migrate data from older schema version
   */
  private static migrate(
    data: Record<string, unknown>, 
    fromVersion: string
  ): Record<string, unknown> {
    let migrated = { ...data };
    
    // Future migrations will be added here
    // Example:
    // if (fromVersion === '1.0.0') {
    //   migrated = this.migrateFrom1_0_0(migrated);
    // }
    
    return migrated;
  }

  // ============================================
  // COMPRESSION
  // ============================================

  /**
   * Compress string data
   */
  private static compress(data: string): string {
    // Simple LZ-based compression implementation
    // For production, use a proper compression library like pako
    return btoa(data); // Placeholder - just base64 encode
  }

  /**
   * Decompress string data
   */
  private static decompress(data: string): string {
    // Simple LZ-based decompression implementation
    return atob(data); // Placeholder - just base64 decode
  }

  // ============================================
  // ENCRYPTION
  // ============================================

  /**
   * Encrypt string data
   */
  private static encrypt(data: string, key: string): string {
    // Simple XOR encryption - for production use Web Crypto API
    const keyBytes = new TextEncoder().encode(key);
    const dataBytes = new TextEncoder().encode(data);
    const encrypted = new Uint8Array(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return btoa(String.fromCharCode(...encrypted));
  }

  /**
   * Decrypt string data
   */
  private static decrypt(data: string, key: string): string {
    // Simple XOR decryption
    const keyBytes = new TextEncoder().encode(key);
    const encryptedBytes = new Uint8Array(
      atob(data).split('').map(c => c.charCodeAt(0))
    );
    const decrypted = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(decrypted);
  }

  // ============================================
  // CHECKSUM
  // ============================================

  /**
   * Calculate checksum for data integrity
   */
  private static calculateChecksum(data: unknown): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  // ============================================
  // FILE OPERATIONS
  // ============================================

  /**
   * Export state to file
   */
  static async exportToFile(
    state: AppState, 
    filename: string,
    options: ExportOptions = {}
  ): Promise<void> {
    const serialized = this.serialize(state, { ...options, prettyPrint: true });
    const blob = new Blob([serialized], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Import state from file
   */
  static async importFromFile(
    file: File, 
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          const result = this.deserialize(data, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  // ============================================
  // MERGE OPERATIONS
  // ============================================

  /**
   * Merge imported state with existing state
   */
  static mergeStates(
    existing: AppState,
    imported: AppState,
    options: { overwrite?: boolean } = {}
  ): AppState {
    const { overwrite = false } = options;

    const merged: AppState = {
      ...existing,
      platforms: { ...existing.platforms },
      resources: { ...existing.resources },
      handshakes: { ...existing.handshakes },
      platformOrder: [...existing.platformOrder],
    };

    // Merge platforms
    for (const [id, platform] of Object.entries(imported.platforms)) {
      if (!merged.platforms[id] || overwrite) {
        merged.platforms[id] = platform;
        if (!merged.platformOrder.includes(id)) {
          merged.platformOrder.push(id);
        }
      }
    }

    // Merge resources
    for (const [id, resource] of Object.entries(imported.resources)) {
      if (!merged.resources[id] || overwrite) {
        merged.resources[id] = resource;
      }
    }

    // Merge handshakes
    for (const [id, handshake] of Object.entries(imported.handshakes)) {
      if (!merged.handshakes[id] || overwrite) {
        merged.handshakes[id] = handshake;
      }
    }

    // Update relationships
    merged.platforms = this.updatePlatformRelationships(merged);
    merged.resources = this.updateResourceRelationships(merged);

    return merged;
  }

  /**
   * Update platform resourceIds based on actual resources
   */
  private static updatePlatformRelationships(state: AppState): Record<string, Platform> {
    const updated = { ...state.platforms };
    
    for (const [platformId, platform] of Object.entries(updated)) {
      const resourceIds = Object.values(state.resources)
        .filter(r => r.platformId === platformId)
        .map(r => r.id);
      
      updated[platformId] = {
        ...platform,
        resourceIds,
      };
    }
    
    return updated;
  }

  /**
   * Update resource handshakeIds based on actual handshakes
   */
  private static updateResourceRelationships(state: AppState): Record<string, Resource> {
    const updated = { ...state.resources };
    
    for (const [resourceId, resource] of Object.entries(updated)) {
      const handshakeIds = Object.values(state.handshakes)
        .filter(h => h.resourceId === resourceId)
        .map(h => h.id);
      
      updated[resourceId] = {
        ...resource,
        handshakeIds,
      };
    }
    
    return updated;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Quick export helper
 */
export function exportState(state: AppState, options?: ExportOptions): string {
  return DataSerializer.serialize(state, options);
}

/**
 * Quick import helper
 */
export function importState(data: string, options?: ImportOptions): ImportResult {
  return DataSerializer.deserialize(data, options);
}

/**
 * Export to file helper
 */
export async function exportToFile(
  state: AppState, 
  filename: string = 'protocol-os-export',
  options?: ExportOptions
): Promise<void> {
  return DataSerializer.exportToFile(state, filename, options);
}

/**
 * Import from file helper
 */
export async function importFromFile(
  file: File, 
  options?: ImportOptions
): Promise<ImportResult> {
  return DataSerializer.importFromFile(file, options);
}

export default DataSerializer;
