// ============================================
// PROTOCOL OS - DATABASE PERSISTENCE INDEX
// ============================================
// Address: 1.2.a
// Purpose: Central export point for all database providers
// ============================================

// Core interfaces and types
export type {
  DatabaseProvider,
  DatabaseProviderConfig,
  QueryOptions,
  QueryResult,
  MutationResult,
  TransactionContext,
  DatabaseProviderType,
} from './1.2.b_fileDatabaseProviderInterface';

// Active provider toggle
export {
  getActiveProvider,
  setActiveProvider,
  initializeDatabase,
  isDatabaseInitialized,
  resetDatabase,
} from './1.2.c_fileActiveDatabaseProviderToggle';

// Provider implementations
export { LocalStoragePersistenceProvider } from './1.2.1_folderLocalStorageProvider/1.2.1.a_fileLocalStoragePersistenceProvider';
export { SupabasePersistenceProvider } from './1.2.2_folderSupabaseProvider/1.2.2.a_fileSupabasePersistenceProvider';
export { FirebasePersistenceProvider } from './1.2.3_folderFirebaseProvider/1.2.3.a_fileFirebasePersistenceProvider';
export { PostgresqlPersistenceProvider } from './1.2.4_folderPostgresqlProvider/1.2.4.a_filePostgresqlPersistenceProvider';
export { SqlitePersistenceProvider } from './1.2.5_folderSqliteProvider/1.2.5.a_fileSqlitePersistenceProvider';

// Provider configurations
export { createSupabaseClient } from './1.2.2_folderSupabaseProvider/1.2.2.b_fileSupabaseClientConfiguration';
export { createFirebaseApp } from './1.2.3_folderFirebaseProvider/1.2.3.b_fileFirebaseClientConfiguration';
export { createPostgresqlPool } from './1.2.4_folderPostgresqlProvider/1.2.4.b_filePostgresqlClientConfiguration';
export { createSqliteConnection } from './1.2.5_folderSqliteProvider/1.2.5.b_fileSqliteClientConfiguration';

/**
 * Database Provider Registry
 * 
 * Maps provider type strings to their implementation classes.
 * Used by the active provider toggle for dynamic instantiation.
 */
export const DATABASE_PROVIDER_REGISTRY = {
  localStorage: () => import('./1.2.1_folderLocalStorageProvider/1.2.1.a_fileLocalStoragePersistenceProvider'),
  supabase: () => import('./1.2.2_folderSupabaseProvider/1.2.2.a_fileSupabasePersistenceProvider'),
  firebase: () => import('./1.2.3_folderFirebaseProvider/1.2.3.a_fileFirebasePersistenceProvider'),
  postgresql: () => import('./1.2.4_folderPostgresqlProvider/1.2.4.a_filePostgresqlPersistenceProvider'),
  sqlite: () => import('./1.2.5_folderSqliteProvider/1.2.5.a_fileSqlitePersistenceProvider'),
} as const;

/**
 * Collection names used across all providers
 * Ensures consistency in data organization
 */
export const COLLECTION_NAMES = {
  PLATFORMS: 'platforms',
  RESOURCES: 'resources',
  HANDSHAKES: 'handshakes',
  CURL_REQUESTS: 'curlRequests',
  SCHEMA_MODELS: 'schemaModels',
  PROMOTED_ACTIONS: 'promotedActions',
  EXECUTION_LOGS: 'executionLogs',
  USER_SETTINGS: 'userSettings',
} as const;

export type CollectionName = typeof COLLECTION_NAMES[keyof typeof COLLECTION_NAMES];
