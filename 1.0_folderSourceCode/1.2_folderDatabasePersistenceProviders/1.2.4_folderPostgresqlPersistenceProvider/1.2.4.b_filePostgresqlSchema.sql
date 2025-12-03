-- ============================================
-- PROTOCOL OS - POSTGRESQL DATABASE SCHEMA
-- ============================================
-- Address: 1.2.4.b
-- Purpose: SQL schema for PostgreSQL database tables
-- ============================================

-- Run this SQL to set up the required tables in your PostgreSQL database

-- ============================================
-- EXTENSIONS
-- ============================================

-- Enable UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PLATFORMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS protocol_os_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serial VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  url TEXT,
  contributors JSONB DEFAULT '[]'::jsonb,
  is_master BOOLEAN DEFAULT false,
  resources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_platforms_serial ON protocol_os_platforms(serial);
CREATE INDEX IF NOT EXISTS idx_platforms_is_master ON protocol_os_platforms(is_master);
CREATE INDEX IF NOT EXISTS idx_platforms_name ON protocol_os_platforms(name);
CREATE INDEX IF NOT EXISTS idx_platforms_created_at ON protocol_os_platforms(created_at DESC);

-- Full-text search index on name
CREATE INDEX IF NOT EXISTS idx_platforms_name_search ON protocol_os_platforms USING gin(to_tsvector('english', name));

-- ============================================
-- SAVED HANDSHAKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS protocol_os_saved_handshakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for base_name + version combination
  CONSTRAINT unique_handshake_version UNIQUE(base_name, version)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_handshakes_base_name ON protocol_os_saved_handshakes(base_name);
CREATE INDEX IF NOT EXISTS idx_saved_handshakes_version ON protocol_os_saved_handshakes(version);
CREATE INDEX IF NOT EXISTS idx_saved_handshakes_created_at ON protocol_os_saved_handshakes(created_at DESC);

-- GIN index for JSONB queries on snapshot_data
CREATE INDEX IF NOT EXISTS idx_saved_handshakes_snapshot ON protocol_os_saved_handshakes USING gin(snapshot_data);

-- ============================================
-- UPDATED TIMESTAMP TRIGGER
-- ============================================

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for platforms table
DROP TRIGGER IF EXISTS update_platforms_updated_at ON protocol_os_platforms;
CREATE TRIGGER update_platforms_updated_at
  BEFORE UPDATE ON protocol_os_platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View: Master platforms only
CREATE OR REPLACE VIEW v_master_platforms AS
SELECT * FROM protocol_os_platforms WHERE is_master = true;

-- View: Active platforms (non-master)
CREATE OR REPLACE VIEW v_active_platforms AS
SELECT * FROM protocol_os_platforms WHERE is_master = false;

-- View: Latest handshake versions
CREATE OR REPLACE VIEW v_latest_handshake_versions AS
SELECT DISTINCT ON (base_name) *
FROM protocol_os_saved_handshakes
ORDER BY base_name, created_at DESC;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Get platform with resource count
CREATE OR REPLACE FUNCTION get_platform_with_stats(platform_id UUID)
RETURNS TABLE (
  id UUID,
  serial VARCHAR,
  name VARCHAR,
  url TEXT,
  is_master BOOLEAN,
  resource_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.serial,
    p.name,
    p.url,
    p.is_master,
    jsonb_array_length(p.resources) as resource_count,
    p.created_at,
    p.updated_at
  FROM protocol_os_platforms p
  WHERE p.id = platform_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Search platforms by name (full-text)
CREATE OR REPLACE FUNCTION search_platforms_fulltext(search_query TEXT)
RETURNS SETOF protocol_os_platforms AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM protocol_os_platforms
  WHERE to_tsvector('english', name) @@ plainto_tsquery('english', search_query)
  ORDER BY ts_rank(to_tsvector('english', name), plainto_tsquery('english', search_query)) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get all versions of a saved handshake
CREATE OR REPLACE FUNCTION get_handshake_versions(handshake_base_name VARCHAR)
RETURNS TABLE (
  id UUID,
  version VARCHAR,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT sh.id, sh.version, sh.created_at
  FROM protocol_os_saved_handshakes sh
  WHERE sh.base_name = handshake_base_name
  ORDER BY sh.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Count resources across all platforms
CREATE OR REPLACE FUNCTION get_total_resource_count()
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(jsonb_array_length(resources)), 0)
  INTO total
  FROM protocol_os_platforms;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURES FOR API OPERATIONS
-- ============================================

-- Procedure: Upsert platform
CREATE OR REPLACE PROCEDURE upsert_platform(
  p_id UUID,
  p_serial VARCHAR,
  p_name VARCHAR,
  p_url TEXT,
  p_contributors JSONB,
  p_is_master BOOLEAN,
  p_resources JSONB
)
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO protocol_os_platforms (id, serial, name, url, contributors, is_master, resources)
  VALUES (p_id, p_serial, p_name, p_url, p_contributors, p_is_master, p_resources)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    url = EXCLUDED.url,
    contributors = EXCLUDED.contributors,
    is_master = EXCLUDED.is_master,
    resources = EXCLUDED.resources,
    updated_at = NOW();
END;
$$;

-- Procedure: Clean up old handshake versions (keep last N)
CREATE OR REPLACE PROCEDURE cleanup_old_handshake_versions(keep_count INTEGER DEFAULT 5)
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM protocol_os_saved_handshakes
  WHERE id NOT IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY base_name ORDER BY created_at DESC) as rn
      FROM protocol_os_saved_handshakes
    ) ranked
    WHERE rn <= keep_count
  );
END;
$$;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data
/*
INSERT INTO protocol_os_platforms (serial, name, url, is_master, contributors, resources)
VALUES 
  (
    'PLAT-TEST',
    'Test Platform',
    'https://api.test.com',
    true,
    '["Test User"]'::jsonb,
    '[]'::jsonb
  );
*/

-- ============================================
-- CLEANUP (for development reset)
-- ============================================

-- Uncomment to drop all Protocol OS objects
/*
DROP VIEW IF EXISTS v_master_platforms CASCADE;
DROP VIEW IF EXISTS v_active_platforms CASCADE;
DROP VIEW IF EXISTS v_latest_handshake_versions CASCADE;
DROP FUNCTION IF EXISTS get_platform_with_stats CASCADE;
DROP FUNCTION IF EXISTS search_platforms_fulltext CASCADE;
DROP FUNCTION IF EXISTS get_handshake_versions CASCADE;
DROP FUNCTION IF EXISTS get_total_resource_count CASCADE;
DROP PROCEDURE IF EXISTS upsert_platform CASCADE;
DROP PROCEDURE IF EXISTS cleanup_old_handshake_versions CASCADE;
DROP TABLE IF EXISTS protocol_os_saved_handshakes CASCADE;
DROP TABLE IF EXISTS protocol_os_platforms CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
*/
