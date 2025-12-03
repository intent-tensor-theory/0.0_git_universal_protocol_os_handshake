// ============================================
// PROTOCOL OS - ACTIVE DATABASE PROVIDER TOGGLE
// ============================================
// Address: 1.2.c
// Purpose: Single-line toggle to switch between database providers
// ============================================
//
// ╔══════════════════════════════════════════════════════════════╗
// ║  TO SWITCH DATABASE PROVIDERS:                               ║
// ║  Change the ACTIVE_PROVIDER constant below to one of:        ║
// ║                                                              ║
// ║    'localStorage'  - Browser storage (default, no setup)    ║
// ║    'supabase'      - Supabase PostgreSQL                    ║
// ║    'firebase'      - Firebase Firestore                     ║
// ║    'postgresql'    - Direct PostgreSQL                      ║
// ║    'sqlite'        - SQLite file database                   ║
// ║                                                              ║
// ║  Then configure the corresponding .env variables.            ║
// ╚══════════════════════════════════════════════════════════════╝

import type {
  DatabaseProvider,
  DatabaseProviderConfig,
  DatabaseProviderType,
  MutationResult,
} from './1.2.b_fileDatabaseProviderInterface';

// ============================================
// ⚡ CHANGE THIS LINE TO SWITCH PROVIDERS ⚡
// ============================================
const ACTIVE_PROVIDER: DatabaseProviderType = 'localStorage';
// ============================================

/**
 * Provider instance cache
 */
let activeProviderInstance: DatabaseProvider | null = null;
let isInitialized = false;

/**
 * Get configuration from environment variables
 */
function getProviderConfig(providerType: DatabaseProviderType): DatabaseProviderConfig {
  // Base configuration
  const baseConfig: DatabaseProviderConfig = {
    type: providerType,
    debug: import.meta.env.DEV || import.meta.env.VITE_DB_DEBUG === 'true',
    timeout: Number(import.meta.env.VITE_DB_TIMEOUT) || 30000,
    maxRetries: Number(import.meta.env.VITE_DB_MAX_RETRIES) || 3,
  };

  switch (providerType) {
    case 'localStorage':
      return {
        ...baseConfig,
        databaseName: import.meta.env.VITE_LOCALSTORAGE_PREFIX || 'protocol-os',
      };

    case 'supabase':
      return {
        ...baseConfig,
        connectionString: import.meta.env.VITE_SUPABASE_URL,
        apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        options: {
          schema: import.meta.env.VITE_SUPABASE_SCHEMA || 'public',
        },
      };

    case 'firebase':
      return {
        ...baseConfig,
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        options: {
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        },
      };

    case 'postgresql':
      return {
        ...baseConfig,
        connectionString: import.meta.env.VITE_POSTGRESQL_URL,
        databaseName: import.meta.env.VITE_POSTGRESQL_DATABASE,
        options: {
          ssl: import.meta.env.VITE_POSTGRESQL_SSL === 'true',
          poolMin: Number(import.meta.env.VITE_POSTGRESQL_POOL_MIN) || 2,
          poolMax: Number(import.meta.env.VITE_POSTGRESQL_POOL_MAX) || 10,
        },
      };

    case 'sqlite':
      return {
        ...baseConfig,
        connectionString: import.meta.env.VITE_SQLITE_PATH || ':memory:',
        options: {
          mode: import.meta.env.VITE_SQLITE_MODE || 'readwrite',
        },
      };

    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }
}

/**
 * Dynamically load the provider implementation
 */
async function loadProvider(providerType: DatabaseProviderType): Promise<DatabaseProvider> {
  switch (providerType) {
    case 'localStorage': {
      const { LocalStoragePersistenceProvider } = await import(
        './1.2.1_folderLocalStorageProvider/1.2.1.a_fileLocalStoragePersistenceProvider'
      );
      return new LocalStoragePersistenceProvider();
    }

    case 'supabase': {
      const { SupabasePersistenceProvider } = await import(
        './1.2.2_folderSupabaseProvider/1.2.2.a_fileSupabasePersistenceProvider'
      );
      return new SupabasePersistenceProvider();
    }

    case 'firebase': {
      const { FirebasePersistenceProvider } = await import(
        './1.2.3_folderFirebaseProvider/1.2.3.a_fileFirebasePersistenceProvider'
      );
      return new FirebasePersistenceProvider();
    }

    case 'postgresql': {
      const { PostgresqlPersistenceProvider } = await import(
        './1.2.4_folderPostgresqlProvider/1.2.4.a_filePostgresqlPersistenceProvider'
      );
      return new PostgresqlPersistenceProvider();
    }

    case 'sqlite': {
      const { SqlitePersistenceProvider } = await import(
        './1.2.5_folderSqliteProvider/1.2.5.a_fileSqlitePersistenceProvider'
      );
      return new SqlitePersistenceProvider();
    }

    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }
}

/**
 * Get the currently active database provider
 * 
 * Returns the singleton instance of the configured provider.
 * Throws if database hasn't been initialized.
 * 
 * @example
 * ```ts
 * const db = getActiveProvider();
 * const platforms = await db.getAllPlatforms();
 * ```
 */
export function getActiveProvider(): DatabaseProvider {
  if (!activeProviderInstance) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() first.'
    );
  }
  return activeProviderInstance;
}

/**
 * Set a different active provider at runtime
 * 
 * Useful for testing or dynamic provider switching.
 * Will disconnect existing provider if connected.
 * 
 * @param providerType - The provider type to switch to
 */
export async function setActiveProvider(
  providerType: DatabaseProviderType
): Promise<MutationResult> {
  // Disconnect existing provider
  if (activeProviderInstance && activeProviderInstance.isConnected()) {
    await activeProviderInstance.disconnect();
  }

  try {
    const provider = await loadProvider(providerType);
    const config = getProviderConfig(providerType);
    const result = await provider.initialize(config);

    if (result.success) {
      activeProviderInstance = provider;
      isInitialized = true;
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set provider',
    };
  }
}

/**
 * Initialize the database with the configured provider
 * 
 * Should be called once at application startup.
 * Uses the ACTIVE_PROVIDER constant defined above.
 * 
 * @example
 * ```ts
 * // In your app's entry point
 * await initializeDatabase();
 * ```
 */
export async function initializeDatabase(): Promise<MutationResult> {
  if (isInitialized && activeProviderInstance) {
    return { success: true };
  }

  try {
    const provider = await loadProvider(ACTIVE_PROVIDER);
    const config = getProviderConfig(ACTIVE_PROVIDER);
    
    if (config.debug) {
      console.log(`[Database] Initializing ${ACTIVE_PROVIDER} provider...`);
    }

    const result = await provider.initialize(config);

    if (result.success) {
      activeProviderInstance = provider;
      isInitialized = true;

      if (config.debug) {
        console.log(`[Database] ${ACTIVE_PROVIDER} provider initialized successfully`);
      }
    } else {
      console.error(`[Database] Failed to initialize: ${result.error}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Database] Initialization failed:`, error);
    return {
      success: false,
      error: `Failed to initialize ${ACTIVE_PROVIDER} provider: ${errorMessage}`,
    };
  }
}

/**
 * Check if the database has been initialized
 */
export function isDatabaseInitialized(): boolean {
  return isInitialized && activeProviderInstance !== null;
}

/**
 * Reset the database connection
 * 
 * Disconnects the current provider and clears the instance.
 * Useful for testing or error recovery.
 */
export async function resetDatabase(): Promise<MutationResult> {
  if (activeProviderInstance) {
    if (activeProviderInstance.isConnected()) {
      await activeProviderInstance.disconnect();
    }
    activeProviderInstance = null;
  }
  isInitialized = false;
  return { success: true };
}

/**
 * Get the currently configured provider type
 */
export function getActiveProviderType(): DatabaseProviderType {
  return activeProviderInstance?.providerType ?? ACTIVE_PROVIDER;
}

/**
 * Validate provider configuration
 * 
 * Checks if required environment variables are set for the provider.
 */
export function validateProviderConfig(providerType: DatabaseProviderType): {
  valid: boolean;
  missingVars: string[];
} {
  const missingVars: string[] = [];

  switch (providerType) {
    case 'localStorage':
      // No required vars
      break;

    case 'supabase':
      if (!import.meta.env.VITE_SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
      if (!import.meta.env.VITE_SUPABASE_ANON_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY');
      break;

    case 'firebase':
      if (!import.meta.env.VITE_FIREBASE_API_KEY) missingVars.push('VITE_FIREBASE_API_KEY');
      if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) missingVars.push('VITE_FIREBASE_PROJECT_ID');
      break;

    case 'postgresql':
      if (!import.meta.env.VITE_POSTGRESQL_URL) missingVars.push('VITE_POSTGRESQL_URL');
      break;

    case 'sqlite':
      // Optional path, defaults to :memory:
      break;
  }

  return {
    valid: missingVars.length === 0,
    missingVars,
  };
}
