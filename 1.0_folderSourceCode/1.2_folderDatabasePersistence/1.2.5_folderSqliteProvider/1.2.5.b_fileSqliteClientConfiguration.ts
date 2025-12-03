// ============================================
// PROTOCOL OS - SQLITE CLIENT CONFIGURATION
// ============================================
// Address: 1.2.5.b
// Purpose: SQLite connection factory and configuration
// ============================================

import Database from 'better-sqlite3';

/**
 * SQLite connection instance type
 */
export type SqliteConnectionInstance = Database.Database;

/**
 * SQLite connection options
 */
export interface SqliteConnectionOptions {
  /** Database open mode */
  mode?: 'readonly' | 'readwrite' | 'create';
  
  /** Enable verbose logging */
  verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void;
  
  /** File must exist (don't create) */
  fileMustExist?: boolean;
  
  /** Timeout for busy database (ms) */
  timeout?: number;
  
  /** Enable WAL mode for better concurrency */
  walMode?: boolean;
}

/**
 * Create a configured SQLite connection
 * 
 * @param dbPath - Path to database file or ':memory:' for in-memory
 * @param options - Connection options
 * @returns Configured Database instance
 * 
 * @example
 * ```ts
 * // File-based database
 * const db = createSqliteConnection('./protocol-os.db');
 * 
 * // In-memory database
 * const memDb = createSqliteConnection(':memory:');
 * 
 * // Read-only access
 * const readOnlyDb = createSqliteConnection('./data.db', { mode: 'readonly' });
 * ```
 */
export async function createSqliteConnection(
  dbPath: string,
  options: SqliteConnectionOptions = {}
): Promise<SqliteConnectionInstance> {
  const {
    mode = 'readwrite',
    verbose,
    fileMustExist = false,
    timeout = 5000,
    walMode = true,
  } = options;

  // Determine SQLite open flags
  const dbOptions: Database.Options = {
    verbose,
    fileMustExist,
    timeout,
  };

  // Set readonly mode if specified
  if (mode === 'readonly') {
    dbOptions.readonly = true;
  }

  const db = new Database(dbPath, dbOptions);

  // Enable WAL mode for better concurrent read/write
  if (walMode && mode !== 'readonly') {
    db.pragma('journal_mode = WAL');
  }

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Optimize for performance
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000'); // 64MB cache
  db.pragma('temp_store = MEMORY');

  return db;
}

/**
 * Database schema SQL for Protocol OS
 * 
 * This schema is automatically applied when initializing the provider.
 */
export const SQLITE_SCHEMA_SQL = `
-- ============================================
-- PROTOCOL OS - SQLITE SCHEMA
-- ============================================

-- ============================================
-- PLATFORMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  serial TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  url TEXT,
  contributors TEXT DEFAULT '[]',
  is_master INTEGER DEFAULT 0,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_platforms_serial ON platforms(serial);
CREATE INDEX IF NOT EXISTS idx_platforms_is_master ON platforms(is_master) WHERE is_master = 1;

-- ============================================
-- RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  serial TEXT NOT NULL,
  platform_id TEXT NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_archived INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE(platform_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_resources_platform_id ON resources(platform_id);
CREATE INDEX IF NOT EXISTS idx_resources_serial ON resources(serial);

-- ============================================
-- HANDSHAKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS handshakes (
  id TEXT PRIMARY KEY,
  serial TEXT NOT NULL,
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  protocol_type TEXT NOT NULL,
  authentication TEXT,
  status TEXT DEFAULT 'unconfigured',
  is_archived INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE(resource_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_handshakes_resource_id ON handshakes(resource_id);
CREATE INDEX IF NOT EXISTS idx_handshakes_status ON handshakes(status);
CREATE INDEX IF NOT EXISTS idx_handshakes_protocol_type ON handshakes(protocol_type);

-- ============================================
-- CURL REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS curl_requests (
  id TEXT PRIMARY KEY,
  serial TEXT NOT NULL,
  handshake_id TEXT NOT NULL REFERENCES handshakes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  command_template TEXT NOT NULL,
  supported_file_types TEXT DEFAULT '[]',
  test_data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE(handshake_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_curl_requests_handshake_id ON curl_requests(handshake_id);

-- ============================================
-- SCHEMA MODELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS schema_models (
  id TEXT PRIMARY KEY,
  serial TEXT NOT NULL,
  handshake_id TEXT NOT NULL REFERENCES handshakes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  json_schema TEXT NOT NULL,
  fields TEXT DEFAULT '[]',
  output_format TEXT DEFAULT 'json',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE(handshake_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_schema_models_handshake_id ON schema_models(handshake_id);

-- ============================================
-- PROMOTED ACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS promoted_actions (
  id TEXT PRIMARY KEY,
  serial TEXT NOT NULL,
  handshake_id TEXT NOT NULL REFERENCES handshakes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  execution_ref TEXT,
  chain_config TEXT,
  schedule_config TEXT,
  is_enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  
  UNIQUE(handshake_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_promoted_actions_handshake_id ON promoted_actions(handshake_id);
CREATE INDEX IF NOT EXISTS idx_promoted_actions_is_enabled ON promoted_actions(is_enabled) WHERE is_enabled = 1;

-- ============================================
-- EXECUTION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS execution_logs (
  id TEXT PRIMARY KEY,
  handshake_id TEXT NOT NULL REFERENCES handshakes(id) ON DELETE CASCADE,
  timestamp TEXT DEFAULT (datetime('now')),
  success INTEGER NOT NULL,
  metrics TEXT,
  response_headers TEXT,
  response_body TEXT,
  logs TEXT DEFAULT '[]',
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_handshake_id ON execution_logs(handshake_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_timestamp ON execution_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_execution_logs_success ON execution_logs(success);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  settings TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER IF NOT EXISTS platforms_updated_at
  AFTER UPDATE ON platforms
  FOR EACH ROW
  BEGIN
    UPDATE platforms SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

CREATE TRIGGER IF NOT EXISTS resources_updated_at
  AFTER UPDATE ON resources
  FOR EACH ROW
  BEGIN
    UPDATE resources SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

CREATE TRIGGER IF NOT EXISTS handshakes_updated_at
  AFTER UPDATE ON handshakes
  FOR EACH ROW
  BEGIN
    UPDATE handshakes SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

CREATE TRIGGER IF NOT EXISTS curl_requests_updated_at
  AFTER UPDATE ON curl_requests
  FOR EACH ROW
  BEGIN
    UPDATE curl_requests SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

CREATE TRIGGER IF NOT EXISTS schema_models_updated_at
  AFTER UPDATE ON schema_models
  FOR EACH ROW
  BEGIN
    UPDATE schema_models SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

CREATE TRIGGER IF NOT EXISTS promoted_actions_updated_at
  AFTER UPDATE ON promoted_actions
  FOR EACH ROW
  BEGIN
    UPDATE promoted_actions SET updated_at = datetime('now') WHERE id = OLD.id;
  END;

CREATE TRIGGER IF NOT EXISTS user_settings_updated_at
  AFTER UPDATE ON user_settings
  FOR EACH ROW
  BEGIN
    UPDATE user_settings SET updated_at = datetime('now') WHERE id = OLD.id;
  END;
`;

/**
 * Validate SQLite path
 */
export function validateSqlitePath(path?: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!path) {
    // Empty path defaults to :memory:, which is valid
    return { valid: true, errors: [] };
  }

  if (path === ':memory:') {
    return { valid: true, errors: [] };
  }

  // Check for invalid characters (basic check)
  if (path.includes('\0')) {
    errors.push('Path contains invalid characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get database file size (if file-based)
 */
export function getDatabaseSize(db: SqliteConnectionInstance): {
  pageSize: number;
  pageCount: number;
  totalBytes: number;
} {
  const pageSize = db.pragma('page_size', { simple: true }) as number;
  const pageCount = db.pragma('page_count', { simple: true }) as number;

  return {
    pageSize,
    pageCount,
    totalBytes: pageSize * pageCount,
  };
}

/**
 * Optimize database (vacuum and reindex)
 */
export function optimizeDatabase(db: SqliteConnectionInstance): void {
  db.exec('VACUUM');
  db.exec('REINDEX');
  db.pragma('optimize');
}

/**
 * Create database backup
 */
export function backupDatabase(
  db: SqliteConnectionInstance,
  destinationPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.backup(destinationPath)
      .then(() => resolve())
      .catch((err) => reject(err));
  });
}

/**
 * Check database integrity
 */
export function checkDatabaseIntegrity(db: SqliteConnectionInstance): {
  ok: boolean;
  result: string;
} {
  const result = db.pragma('integrity_check', { simple: true }) as string;
  return {
    ok: result === 'ok',
    result,
  };
}
