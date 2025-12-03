// ============================================
// PROTOCOL OS - POSTGRESQL CLIENT CONFIGURATION
// ============================================
// Address: 1.2.4.b
// Purpose: PostgreSQL connection pool factory and configuration
// ============================================

import { Pool, type PoolConfig, type PoolClient } from 'pg';

/**
 * PostgreSQL pool instance type
 */
export type PostgresqlPoolInstance = Pool;

/**
 * PostgreSQL pool client type (for transactions)
 */
export type PostgresqlClientInstance = PoolClient;

/**
 * PostgreSQL connection options
 */
export interface PostgresqlConnectionOptions {
  /** Enable SSL connection */
  ssl?: boolean | { rejectUnauthorized: boolean };
  
  /** Minimum pool connections */
  min?: number;
  
  /** Maximum pool connections */
  max?: number;
  
  /** Connection timeout in milliseconds */
  connectionTimeoutMillis?: number;
  
  /** Idle timeout in milliseconds */
  idleTimeoutMillis?: number;
  
  /** Statement timeout in milliseconds */
  statement_timeout?: number;
  
  /** Application name for monitoring */
  application_name?: string;
}

/**
 * Create a configured PostgreSQL connection pool
 * 
 * @param connectionString - PostgreSQL connection URL
 * @param options - Pool configuration options
 * @returns Configured Pool instance
 * 
 * @example
 * ```ts
 * const pool = createPostgresqlPool(
 *   'postgresql://user:pass@localhost:5432/protocol_os',
 *   { ssl: true, max: 20 }
 * );
 * ```
 */
export function createPostgresqlPool(
  connectionString: string,
  options: PostgresqlConnectionOptions = {}
): PostgresqlPoolInstance {
  const {
    ssl = false,
    min = 2,
    max = 10,
    connectionTimeoutMillis = 30000,
    idleTimeoutMillis = 30000,
    statement_timeout = 60000,
    application_name = 'protocol-os',
  } = options;

  const poolConfig: PoolConfig = {
    connectionString,
    min,
    max,
    connectionTimeoutMillis,
    idleTimeoutMillis,
    application_name,
    statement_timeout,
  };

  // Configure SSL
  if (ssl === true) {
    poolConfig.ssl = { rejectUnauthorized: false };
  } else if (typeof ssl === 'object') {
    poolConfig.ssl = ssl;
  }

  return new Pool(poolConfig);
}

/**
 * Database schema SQL for Protocol OS
 * 
 * Run this SQL to create the required tables in PostgreSQL.
 */
export const POSTGRESQL_SCHEMA_SQL = `
-- ============================================
-- PROTOCOL OS - POSTGRESQL SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PLATFORMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500),
  contributors JSONB DEFAULT '[]',
  is_master BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platforms_serial ON platforms(serial);
CREATE INDEX IF NOT EXISTS idx_platforms_is_master ON platforms(is_master) WHERE is_master = true;
CREATE INDEX IF NOT EXISTS idx_platforms_is_archived ON platforms(is_archived) WHERE is_archived = false;

-- ============================================
-- RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial VARCHAR(50) NOT NULL,
  platform_id UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(platform_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_resources_platform ON resources(platform_id);
CREATE INDEX IF NOT EXISTS idx_resources_serial ON resources(serial);

-- ============================================
-- HANDSHAKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS handshakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  protocol_type VARCHAR(50) NOT NULL,
  authentication JSONB,
  status VARCHAR(20) DEFAULT 'unconfigured',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(resource_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_handshakes_resource ON handshakes(resource_id);
CREATE INDEX IF NOT EXISTS idx_handshakes_status ON handshakes(status);
CREATE INDEX IF NOT EXISTS idx_handshakes_protocol ON handshakes(protocol_type);

-- ============================================
-- CURL REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS curl_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial VARCHAR(50) NOT NULL,
  handshake_id UUID NOT NULL REFERENCES handshakes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  command_template TEXT NOT NULL,
  supported_file_types JSONB DEFAULT '[]',
  test_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(handshake_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_curl_requests_handshake ON curl_requests(handshake_id);

-- ============================================
-- SCHEMA MODELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS schema_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial VARCHAR(50) NOT NULL,
  handshake_id UUID NOT NULL REFERENCES handshakes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  json_schema JSONB NOT NULL,
  fields JSONB DEFAULT '[]',
  output_format VARCHAR(20) DEFAULT 'json',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(handshake_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_schema_models_handshake ON schema_models(handshake_id);

-- ============================================
-- PROMOTED ACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS promoted_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial VARCHAR(50) NOT NULL,
  handshake_id UUID NOT NULL REFERENCES handshakes(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL,
  execution_ref VARCHAR(255),
  chain_config JSONB,
  schedule_config JSONB,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(handshake_id, serial)
);

CREATE INDEX IF NOT EXISTS idx_promoted_actions_handshake ON promoted_actions(handshake_id);
CREATE INDEX IF NOT EXISTS idx_promoted_actions_enabled ON promoted_actions(is_enabled) WHERE is_enabled = true;

-- ============================================
-- EXECUTION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handshake_id UUID NOT NULL REFERENCES handshakes(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  metrics JSONB,
  response_headers JSONB,
  response_body TEXT,
  logs JSONB DEFAULT '[]',
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_execution_logs_handshake ON execution_logs(handshake_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_timestamp ON execution_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_execution_logs_success ON execution_logs(success);

-- Partition by month for large deployments (optional)
-- CREATE TABLE execution_logs_y2024m01 PARTITION OF execution_logs
--   FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
      AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get full handshake tree (platform -> resources -> handshakes)
CREATE OR REPLACE FUNCTION get_platform_tree(platform_uuid UUID)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'platform', row_to_json(p),
    'resources', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'resource', row_to_json(r),
          'handshakes', (
            SELECT jsonb_agg(row_to_json(h))
            FROM handshakes h
            WHERE h.resource_id = r.id
          )
        )
      )
      FROM resources r
      WHERE r.platform_id = p.id
    )
  )
  FROM platforms p
  WHERE p.id = platform_uuid;
$$ LANGUAGE sql STABLE;

-- Cleanup old execution logs
CREATE OR REPLACE FUNCTION cleanup_old_execution_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM execution_logs
  WHERE timestamp < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
`;

/**
 * Validate PostgreSQL connection string
 */
export function validatePostgresqlConnectionString(connectionString?: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!connectionString) {
    errors.push('PostgreSQL connection string is required');
    return { valid: false, errors };
  }

  // Check URL format
  try {
    const url = new URL(connectionString);
    
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      errors.push('Connection string must start with postgresql:// or postgres://');
    }
    
    if (!url.hostname) {
      errors.push('Connection string must include hostname');
    }
    
    if (!url.pathname || url.pathname === '/') {
      errors.push('Connection string must include database name');
    }
  } catch {
    errors.push('Invalid connection string format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse connection string into components
 */
export function parseConnectionString(connectionString: string): {
  host: string;
  port: number;
  database: string;
  user?: string;
  password?: string;
} | null {
  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      database: url.pathname.slice(1),
      user: url.username || undefined,
      password: url.password || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Build connection string from components
 */
export function buildConnectionString(options: {
  host: string;
  port?: number;
  database: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}): string {
  const { host, port = 5432, database, user, password, ssl } = options;
  
  let auth = '';
  if (user) {
    auth = password ? `${user}:${password}@` : `${user}@`;
  }
  
  let query = '';
  if (ssl) {
    query = '?sslmode=require';
  }
  
  return `postgresql://${auth}${host}:${port}/${database}${query}`;
}
