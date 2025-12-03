// ============================================
// PROTOCOL OS - SUPABASE CLIENT CONFIGURATION
// ============================================
// Address: 1.2.2.b
// Purpose: Supabase client factory and configuration
// ============================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client instance type
 */
export type SupabaseClientInstance = SupabaseClient;

/**
 * Supabase client options
 */
export interface SupabaseClientOptions {
  /** Database schema (default: 'public') */
  schema?: string;
  
  /** Enable auto-refresh of session */
  autoRefreshToken?: boolean;
  
  /** Persist session to storage */
  persistSession?: boolean;
  
  /** Storage key for session */
  storageKey?: string;
  
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Create a configured Supabase client
 * 
 * @param url - Supabase project URL
 * @param apiKey - Supabase anonymous/service key
 * @param options - Client options
 * @returns Configured Supabase client
 * 
 * @example
 * ```ts
 * const client = createSupabaseClient(
 *   'https://xxx.supabase.co',
 *   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   { schema: 'protocol_os' }
 * );
 * ```
 */
export function createSupabaseClient(
  url: string,
  apiKey: string,
  options: SupabaseClientOptions = {}
): SupabaseClientInstance {
  const {
    schema = 'public',
    autoRefreshToken = true,
    persistSession = true,
    storageKey = 'protocol-os-auth',
    headers = {},
  } = options;

  return createClient(url, apiKey, {
    db: {
      schema,
    },
    auth: {
      autoRefreshToken,
      persistSession,
      storageKey,
    },
    global: {
      headers: {
        'x-application': 'protocol-os',
        ...headers,
      },
    },
  });
}

/**
 * Database table definitions for Supabase
 * 
 * Run this SQL in your Supabase SQL Editor to create the required tables:
 */
export const SUPABASE_SCHEMA_SQL = `
-- ============================================
-- PROTOCOL OS - SUPABASE SCHEMA
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

CREATE INDEX idx_platforms_serial ON platforms(serial);
CREATE INDEX idx_platforms_is_master ON platforms(is_master);

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resources_platform ON resources(platform_id);
CREATE INDEX idx_resources_serial ON resources(serial);

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_handshakes_resource ON handshakes(resource_id);
CREATE INDEX idx_handshakes_status ON handshakes(status);

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_curl_requests_handshake ON curl_requests(handshake_id);

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schema_models_handshake ON schema_models(handshake_id);

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promoted_actions_handshake ON promoted_actions(handshake_id);

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

CREATE INDEX idx_execution_logs_handshake ON execution_logs(handshake_id);
CREATE INDEX idx_execution_logs_timestamp ON execution_logs(timestamp);

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- ============================================
-- Uncomment to enable RLS

-- ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE handshakes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE curl_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE schema_models ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE promoted_actions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platforms_updated_at
  BEFORE UPDATE ON platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER handshakes_updated_at
  BEFORE UPDATE ON handshakes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER curl_requests_updated_at
  BEFORE UPDATE ON curl_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER schema_models_updated_at
  BEFORE UPDATE ON schema_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER promoted_actions_updated_at
  BEFORE UPDATE ON promoted_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

/**
 * Validate Supabase configuration
 */
export function validateSupabaseConfig(
  url?: string,
  apiKey?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!url) {
    errors.push('Supabase URL is required');
  } else if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    errors.push('Invalid Supabase URL format');
  }

  if (!apiKey) {
    errors.push('Supabase API key is required');
  } else if (!apiKey.startsWith('eyJ')) {
    errors.push('Invalid Supabase API key format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
