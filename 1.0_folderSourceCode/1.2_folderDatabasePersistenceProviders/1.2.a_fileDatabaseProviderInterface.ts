// ============================================
// PROTOCOL OS - DATABASE PROVIDER INTERFACE
// ============================================
// Address: 1.2.a
// Purpose: Define the contract for all database persistence providers
// ============================================

import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { SavedHandshakeSnapshot } from '@types/1.9.h_fileExecutionResultTypeDefinitions';

/**
 * Database provider identifiers
 */
export type DatabaseProviderIdentifier =
  | 'localStorage'
  | 'supabase'
  | 'firebase'
  | 'postgresql'
  | 'sqlite';

/**
 * Result of a database operation
 */
export interface DatabaseOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Configuration status for a provider
 */
export interface ProviderConfigurationStatus {
  isConfigured: boolean;
  isConnected: boolean;
  missingFields: string[];
  errorMessage?: string;
}

/**
 * Database Provider Interface
 * 
 * All persistence providers must implement this interface.
 * This enables switching between providers with a single toggle change.
 */
export interface DatabaseProvider {
  /**
   * Unique identifier for this provider
   */
  readonly identifier: DatabaseProviderIdentifier;

  /**
   * Human-readable name for display
   */
  readonly displayName: string;

  /**
   * Whether this provider requires external configuration
   * (e.g., API keys, connection strings)
   */
  readonly requiresConfiguration: boolean;

  /**
   * Check if the provider is properly configured and ready to use
   */
  checkConfiguration(): Promise<ProviderConfigurationStatus>;

  /**
   * Initialize the provider (create tables, connect to service, etc.)
   */
  initialize(): Promise<DatabaseOperationResult>;

  /**
   * Close connections and clean up resources
   */
  disconnect(): Promise<DatabaseOperationResult>;

  // ============================================
  // PLATFORM OPERATIONS
  // ============================================

  /**
   * Get all platforms (both active and archived/master)
   */
  getAllPlatforms(): Promise<DatabaseOperationResult<Platform[]>>;

  /**
   * Get a single platform by ID
   */
  getPlatformById(id: string): Promise<DatabaseOperationResult<Platform | null>>;

  /**
   * Create a new platform
   */
  createPlatform(platform: Platform): Promise<DatabaseOperationResult<Platform>>;

  /**
   * Update an existing platform
   */
  updatePlatform(id: string, updates: Partial<Platform>): Promise<DatabaseOperationResult<Platform>>;

  /**
   * Delete a platform and all its children (resources, handshakes)
   */
  deletePlatform(id: string): Promise<DatabaseOperationResult>;

  // ============================================
  // SAVED HANDSHAKES OPERATIONS
  // ============================================

  /**
   * Get all saved handshake snapshots
   */
  getAllSavedHandshakes(): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>>;

  /**
   * Get saved handshakes by base name (for versioning)
   */
  getSavedHandshakesByBaseName(baseName: string): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>>;

  /**
   * Save a handshake snapshot
   */
  saveHandshakeSnapshot(snapshot: SavedHandshakeSnapshot): Promise<DatabaseOperationResult<SavedHandshakeSnapshot>>;

  /**
   * Delete a saved handshake snapshot
   */
  deleteSavedHandshake(id: string): Promise<DatabaseOperationResult>;

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Export all data as a JSON string (for backup)
   */
  exportAllData(): Promise<DatabaseOperationResult<string>>;

  /**
   * Import data from a JSON string (restore from backup)
   */
  importAllData(jsonData: string): Promise<DatabaseOperationResult>;

  /**
   * Clear all data (dangerous - use with confirmation)
   */
  clearAllData(): Promise<DatabaseOperationResult>;
}

/**
 * Storage keys used for localStorage and similar key-value stores
 */
export const STORAGE_KEYS = {
  PLATFORMS: 'protocol-os-platforms',
  SAVED_HANDSHAKES: 'protocol-os-saved-handshakes',
  APP_STATE: 'protocol-os-app-state',
  VERSION: 'protocol-os-data-version',
} as const;

/**
 * Current data schema version for migrations
 */
export const DATA_SCHEMA_VERSION = '1.0.0';

/**
 * Helper to create a successful operation result
 */
export function createSuccessResult<T>(data?: T): DatabaseOperationResult<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper to create a failed operation result
 */
export function createErrorResult(error: string): DatabaseOperationResult<never> {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper to wrap async operations with error handling
 */
export async function wrapDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<DatabaseOperationResult<T>> {
  try {
    const data = await operation();
    return createSuccessResult(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DatabaseProvider] ${operationName} failed:`, message);
    return createErrorResult(`${operationName} failed: ${message}`);
  }
}
