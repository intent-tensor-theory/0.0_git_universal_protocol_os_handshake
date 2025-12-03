// ============================================
// PROTOCOL OS - DATABASE PROVIDER INDEX
// ============================================
// Address: 1.2.c
// Purpose: Export the active database provider instance
// ============================================

import type { DatabaseProvider, DatabaseProviderIdentifier } from './1.2.a_fileDatabaseProviderInterface';
import { getActiveProvider, DATABASE_PROVIDER_INFO } from './1.2.b_fileActiveDatabaseProviderToggle';

// Import all provider implementations
import { LocalStorageProvider } from './1.2.1_folderLocalStoragePersistenceProvider/1.2.1.a_fileLocalStorageProviderImplementation';
import { SupabaseProvider } from './1.2.2_folderSupabasePersistenceProvider/1.2.2.a_fileSupabaseProviderImplementation';
import { FirebaseProvider } from './1.2.3_folderFirebasePersistenceProvider/1.2.3.a_fileFirebaseProviderImplementation';
import { PostgreSQLProvider } from './1.2.4_folderPostgresqlPersistenceProvider/1.2.4.a_filePostgresqlProviderImplementation';
import { SQLiteProvider } from './1.2.5_folderSqlitePersistenceProvider/1.2.5.a_fileSqliteProviderImplementation';

/**
 * Map of provider identifiers to their implementations
 */
const PROVIDER_IMPLEMENTATIONS: Record<DatabaseProviderIdentifier, () => DatabaseProvider> = {
  localStorage: () => new LocalStorageProvider(),
  supabase: () => new SupabaseProvider(),
  firebase: () => new FirebaseProvider(),
  postgresql: () => new PostgreSQLProvider(),
  sqlite: () => new SQLiteProvider(),
};

/**
 * Singleton instance of the active database provider
 */
let activeProviderInstance: DatabaseProvider | null = null;

/**
 * Get the active database provider instance
 * 
 * This returns a singleton instance of the currently configured provider.
 * The provider is determined by the ACTIVE_DATABASE_PROVIDER toggle.
 * 
 * @example
 * ```typescript
 * const db = getDatabaseProvider();
 * 
 * // Initialize on app start
 * await db.initialize();
 * 
 * // Use for operations
 * const result = await db.getAllPlatforms();
 * ```
 */
export function getDatabaseProvider(): DatabaseProvider {
  if (!activeProviderInstance) {
    const providerType = getActiveProvider();
    const createProvider = PROVIDER_IMPLEMENTATIONS[providerType];
    
    if (!createProvider) {
      console.error(`[Database] Unknown provider: ${providerType}. Falling back to localStorage.`);
      activeProviderInstance = new LocalStorageProvider();
    } else {
      activeProviderInstance = createProvider();
      console.log(`[Database] Initialized ${DATABASE_PROVIDER_INFO[providerType].displayName} provider`);
    }
  }
  
  return activeProviderInstance;
}

/**
 * Reset the provider instance (useful for testing or switching providers)
 */
export function resetDatabaseProvider(): void {
  if (activeProviderInstance) {
    activeProviderInstance.disconnect().catch(console.error);
    activeProviderInstance = null;
  }
}

/**
 * Get a specific provider instance by identifier
 * Useful for migration or backup operations between providers
 */
export function getProviderByIdentifier(identifier: DatabaseProviderIdentifier): DatabaseProvider {
  const createProvider = PROVIDER_IMPLEMENTATIONS[identifier];
  
  if (!createProvider) {
    throw new Error(`Unknown provider: ${identifier}`);
  }
  
  return createProvider();
}

/**
 * List all available provider identifiers
 */
export function getAvailableProviders(): DatabaseProviderIdentifier[] {
  return Object.keys(PROVIDER_IMPLEMENTATIONS) as DatabaseProviderIdentifier[];
}

/**
 * Migrate data from one provider to another
 */
export async function migrateData(
  fromProvider: DatabaseProviderIdentifier,
  toProvider: DatabaseProviderIdentifier
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Database] Starting migration from ${fromProvider} to ${toProvider}`);
    
    const source = getProviderByIdentifier(fromProvider);
    const target = getProviderByIdentifier(toProvider);
    
    // Initialize both providers
    await source.initialize();
    await target.initialize();
    
    // Export from source
    const exportResult = await source.exportAllData();
    if (!exportResult.success || !exportResult.data) {
      return { success: false, error: exportResult.error || 'Export failed' };
    }
    
    // Import to target
    const importResult = await target.importAllData(exportResult.data);
    if (!importResult.success) {
      return { success: false, error: importResult.error || 'Import failed' };
    }
    
    // Disconnect
    await source.disconnect();
    await target.disconnect();
    
    console.log(`[Database] Migration complete: ${fromProvider} → ${toProvider}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Database] Migration failed:', message);
    return { success: false, error: message };
  }
}

// Re-export types and utilities
export type { DatabaseProvider, DatabaseProviderIdentifier } from './1.2.a_fileDatabaseProviderInterface';
export { STORAGE_KEYS, DATA_SCHEMA_VERSION } from './1.2.a_fileDatabaseProviderInterface';
export { getActiveProvider, DATABASE_PROVIDER_INFO } from './1.2.b_fileActiveDatabaseProviderToggle';
