// ============================================
// PROTOCOL OS - APPLICATION ENVIRONMENT CONFIGURATION
// ============================================
// Address: 1.1.a
// Purpose: Centralized environment variable access with validation
// ============================================

/**
 * Environment modes
 */
export type EnvironmentMode = 'development' | 'staging' | 'production' | 'test';

/**
 * Database provider types (mirrors database layer)
 */
export type DatabaseProviderType = 'localStorage' | 'supabase' | 'firebase' | 'postgresql' | 'sqlite';

/**
 * Application environment configuration interface
 */
export interface ApplicationEnvironmentConfiguration {
  // ============================================
  // CORE APPLICATION
  // ============================================
  
  /** Current environment mode */
  mode: EnvironmentMode;
  
  /** Is development mode */
  isDevelopment: boolean;
  
  /** Is production mode */
  isProduction: boolean;
  
  /** Is test mode */
  isTest: boolean;
  
  /** Enable debug logging */
  debug: boolean;
  
  /** Application base URL */
  baseUrl: string;
  
  /** API base URL for backend calls */
  apiBaseUrl: string;

  // ============================================
  // DATABASE
  // ============================================
  
  /** Active database provider */
  databaseProvider: DatabaseProviderType;
  
  /** Database debug mode */
  databaseDebug: boolean;
  
  /** Database connection timeout (ms) */
  databaseTimeout: number;
  
  /** Database max retries */
  databaseMaxRetries: number;

  // ============================================
  // LOCALSTORAGE PROVIDER
  // ============================================
  
  /** LocalStorage key prefix */
  localStoragePrefix: string;

  // ============================================
  // SUPABASE PROVIDER
  // ============================================
  
  /** Supabase project URL */
  supabaseUrl: string | undefined;
  
  /** Supabase anonymous key */
  supabaseAnonKey: string | undefined;
  
  /** Supabase schema */
  supabaseSchema: string;

  // ============================================
  // FIREBASE PROVIDER
  // ============================================
  
  /** Firebase API key */
  firebaseApiKey: string | undefined;
  
  /** Firebase project ID */
  firebaseProjectId: string | undefined;
  
  /** Firebase auth domain */
  firebaseAuthDomain: string | undefined;
  
  /** Firebase storage bucket */
  firebaseStorageBucket: string | undefined;
  
  /** Firebase messaging sender ID */
  firebaseMessagingSenderId: string | undefined;
  
  /** Firebase app ID */
  firebaseAppId: string | undefined;

  // ============================================
  // POSTGRESQL PROVIDER
  // ============================================
  
  /** PostgreSQL connection URL */
  postgresqlUrl: string | undefined;
  
  /** PostgreSQL database name */
  postgresqlDatabase: string | undefined;
  
  /** PostgreSQL SSL enabled */
  postgresqlSsl: boolean;
  
  /** PostgreSQL pool min connections */
  postgresqlPoolMin: number;
  
  /** PostgreSQL pool max connections */
  postgresqlPoolMax: number;

  // ============================================
  // SQLITE PROVIDER
  // ============================================
  
  /** SQLite database path */
  sqlitePath: string;
  
  /** SQLite mode */
  sqliteMode: string;

  // ============================================
  // AUTHENTICATION
  // ============================================
  
  /** OAuth callback base URL */
  oauthCallbackBaseUrl: string;
  
  /** Session secret (for server-side) */
  sessionSecret: string | undefined;
  
  /** JWT secret (for token signing) */
  jwtSecret: string | undefined;
  
  /** Token expiration time */
  tokenExpirationSeconds: number;

  // ============================================
  // EXTERNAL SERVICES
  // ============================================
  
  /** Render.com deployment URL */
  renderExternalUrl: string | undefined;
  
  /** Enable analytics */
  analyticsEnabled: boolean;
  
  /** Sentry DSN for error tracking */
  sentryDsn: string | undefined;

  // ============================================
  // FEATURE FLAGS
  // ============================================
  
  /** Enable master badge system */
  featureMasterBadge: boolean;
  
  /** Enable promoted actions */
  featurePromotedActions: boolean;
  
  /** Enable execution logging */
  featureExecutionLogging: boolean;
  
  /** Enable schema validation */
  featureSchemaValidation: boolean;
  
  /** Enable real-time sync */
  featureRealtimeSync: boolean;
}

/**
 * Parse boolean from environment variable
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse number from environment variable
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get the current environment mode
 */
function getEnvironmentMode(): EnvironmentMode {
  const mode = import.meta.env.MODE || import.meta.env.VITE_APP_ENV || 'development';
  
  switch (mode.toLowerCase()) {
    case 'production':
    case 'prod':
      return 'production';
    case 'staging':
    case 'stage':
      return 'staging';
    case 'test':
    case 'testing':
      return 'test';
    default:
      return 'development';
  }
}

/**
 * Build the complete environment configuration
 */
function buildEnvironmentConfiguration(): ApplicationEnvironmentConfiguration {
  const mode = getEnvironmentMode();
  const isDevelopment = mode === 'development';
  const isProduction = mode === 'production';
  const isTest = mode === 'test';

  return {
    // Core Application
    mode,
    isDevelopment,
    isProduction,
    isTest,
    debug: parseBoolean(import.meta.env.VITE_DEBUG, isDevelopment),
    baseUrl: import.meta.env.VITE_BASE_URL || (isDevelopment ? 'http://localhost:5173' : ''),
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',

    // Database
    databaseProvider: (import.meta.env.VITE_DATABASE_PROVIDER as DatabaseProviderType) || 'localStorage',
    databaseDebug: parseBoolean(import.meta.env.VITE_DB_DEBUG, isDevelopment),
    databaseTimeout: parseNumber(import.meta.env.VITE_DB_TIMEOUT, 30000),
    databaseMaxRetries: parseNumber(import.meta.env.VITE_DB_MAX_RETRIES, 3),

    // LocalStorage
    localStoragePrefix: import.meta.env.VITE_LOCALSTORAGE_PREFIX || 'protocol-os',

    // Supabase
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseSchema: import.meta.env.VITE_SUPABASE_SCHEMA || 'public',

    // Firebase
    firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID,

    // PostgreSQL
    postgresqlUrl: import.meta.env.VITE_POSTGRESQL_URL,
    postgresqlDatabase: import.meta.env.VITE_POSTGRESQL_DATABASE,
    postgresqlSsl: parseBoolean(import.meta.env.VITE_POSTGRESQL_SSL, isProduction),
    postgresqlPoolMin: parseNumber(import.meta.env.VITE_POSTGRESQL_POOL_MIN, 2),
    postgresqlPoolMax: parseNumber(import.meta.env.VITE_POSTGRESQL_POOL_MAX, 10),

    // SQLite
    sqlitePath: import.meta.env.VITE_SQLITE_PATH || ':memory:',
    sqliteMode: import.meta.env.VITE_SQLITE_MODE || 'readwrite',

    // Authentication
    oauthCallbackBaseUrl: import.meta.env.VITE_OAUTH_CALLBACK_BASE_URL || 
      import.meta.env.VITE_BASE_URL || 
      (isDevelopment ? 'http://localhost:5173' : ''),
    sessionSecret: import.meta.env.VITE_SESSION_SECRET,
    jwtSecret: import.meta.env.VITE_JWT_SECRET,
    tokenExpirationSeconds: parseNumber(import.meta.env.VITE_TOKEN_EXPIRATION, 3600),

    // External Services
    renderExternalUrl: import.meta.env.RENDER_EXTERNAL_URL,
    analyticsEnabled: parseBoolean(import.meta.env.VITE_ANALYTICS_ENABLED, isProduction),
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,

    // Feature Flags
    featureMasterBadge: parseBoolean(import.meta.env.VITE_FEATURE_MASTER_BADGE, true),
    featurePromotedActions: parseBoolean(import.meta.env.VITE_FEATURE_PROMOTED_ACTIONS, true),
    featureExecutionLogging: parseBoolean(import.meta.env.VITE_FEATURE_EXECUTION_LOGGING, true),
    featureSchemaValidation: parseBoolean(import.meta.env.VITE_FEATURE_SCHEMA_VALIDATION, true),
    featureRealtimeSync: parseBoolean(import.meta.env.VITE_FEATURE_REALTIME_SYNC, false),
  };
}

/**
 * Singleton configuration instance
 */
let configInstance: ApplicationEnvironmentConfiguration | null = null;

/**
 * Get the application environment configuration
 * 
 * Returns a singleton instance of the configuration.
 * Values are read from environment variables on first access.
 * 
 * @example
 * ```ts
 * import { getEnvironmentConfiguration } from '@config';
 * 
 * const config = getEnvironmentConfiguration();
 * 
 * if (config.isDevelopment) {
 *   console.log('Running in development mode');
 * }
 * 
 * console.log(`Database: ${config.databaseProvider}`);
 * ```
 */
export function getEnvironmentConfiguration(): ApplicationEnvironmentConfiguration {
  if (!configInstance) {
    configInstance = buildEnvironmentConfiguration();
  }
  return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetEnvironmentConfiguration(): void {
  configInstance = null;
}

/**
 * Validate required configuration for a specific provider
 */
export function validateProviderConfiguration(provider: DatabaseProviderType): {
  valid: boolean;
  missingVariables: string[];
  warnings: string[];
} {
  const config = getEnvironmentConfiguration();
  const missingVariables: string[] = [];
  const warnings: string[] = [];

  switch (provider) {
    case 'localStorage':
      // No required variables
      break;

    case 'supabase':
      if (!config.supabaseUrl) missingVariables.push('VITE_SUPABASE_URL');
      if (!config.supabaseAnonKey) missingVariables.push('VITE_SUPABASE_ANON_KEY');
      break;

    case 'firebase':
      if (!config.firebaseApiKey) missingVariables.push('VITE_FIREBASE_API_KEY');
      if (!config.firebaseProjectId) missingVariables.push('VITE_FIREBASE_PROJECT_ID');
      if (!config.firebaseAuthDomain) warnings.push('VITE_FIREBASE_AUTH_DOMAIN not set (will use default)');
      break;

    case 'postgresql':
      if (!config.postgresqlUrl) missingVariables.push('VITE_POSTGRESQL_URL');
      if (!config.postgresqlSsl && config.isProduction) {
        warnings.push('SSL not enabled for production PostgreSQL');
      }
      break;

    case 'sqlite':
      if (config.sqlitePath === ':memory:' && config.isProduction) {
        warnings.push('Using in-memory SQLite in production (data will not persist)');
      }
      break;
  }

  return {
    valid: missingVariables.length === 0,
    missingVariables,
    warnings,
  };
}

/**
 * Log configuration summary (for debugging)
 */
export function logConfigurationSummary(): void {
  const config = getEnvironmentConfiguration();
  
  console.group('🔧 Protocol OS Configuration');
  console.log(`Mode: ${config.mode}`);
  console.log(`Debug: ${config.debug}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Database: ${config.databaseProvider}`);
  
  console.group('Feature Flags');
  console.log(`Master Badge: ${config.featureMasterBadge}`);
  console.log(`Promoted Actions: ${config.featurePromotedActions}`);
  console.log(`Execution Logging: ${config.featureExecutionLogging}`);
  console.log(`Schema Validation: ${config.featureSchemaValidation}`);
  console.log(`Realtime Sync: ${config.featureRealtimeSync}`);
  console.groupEnd();
  
  console.groupEnd();
}

/**
 * Export singleton for convenience
 */
export const ENV = getEnvironmentConfiguration();

/**
 * Type-safe environment variable getter with default
 */
export function getEnvVar<T extends string | number | boolean>(
  key: string,
  defaultValue: T
): T {
  const value = import.meta.env[key];
  
  if (value === undefined || value === '') {
    return defaultValue;
  }
  
  // Infer type from default value
  if (typeof defaultValue === 'boolean') {
    return parseBoolean(value, defaultValue as boolean) as T;
  }
  
  if (typeof defaultValue === 'number') {
    return parseNumber(value, defaultValue as number) as T;
  }
  
  return value as T;
}
