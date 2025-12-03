-- ============================================
-- PROTOCOL OS - SUPABASE DATABASE SCHEMA
-- ============================================
-- Address: 1.2.2.b
-- Purpose: SQL schema for Supabase PostgreSQL tables
-- ============================================

-- Run this SQL in your Supabase SQL Editor to set up the required tables

-- ============================================
-- PLATFORMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS protocol_os_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  url TEXT,
  contributors JSONB DEFAULT '[]'::jsonb,
  is_master BOOLEAN DEFAULT false,
  resources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platforms_serial ON protocol_os_platforms(serial);
CREATE INDEX IF NOT EXISTS idx_platforms_is_master ON protocol_os_platforms(is_master);
CREATE INDEX IF NOT EXISTS idx_platforms_name ON protocol_os_platforms(name);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_platforms_updated_at ON protocol_os_platforms;
CREATE TRIGGER update_platforms_updated_at
  BEFORE UPDATE ON protocol_os_platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAVED HANDSHAKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS protocol_os_saved_handshakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_name TEXT NOT NULL,
  version TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for base_name + version combination
  UNIQUE(base_name, version)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_handshakes_base_name ON protocol_os_saved_handshakes(base_name);
CREATE INDEX IF NOT EXISTS idx_saved_handshakes_version ON protocol_os_saved_handshakes(version);
CREATE INDEX IF NOT EXISTS idx_saved_handshakes_created_at ON protocol_os_saved_handshakes(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE protocol_os_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_os_saved_handshakes ENABLE ROW LEVEL SECURITY;

-- For development: Allow all operations for authenticated users
-- You should customize these policies for production

-- Platforms policies
CREATE POLICY "Allow all for authenticated users" ON protocol_os_platforms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous read access (optional - remove if not needed)
CREATE POLICY "Allow anonymous read" ON protocol_os_platforms
  FOR SELECT
  TO anon
  USING (true);

-- Saved handshakes policies
CREATE POLICY "Allow all for authenticated users" ON protocol_os_saved_handshakes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous read access (optional - remove if not needed)
CREATE POLICY "Allow anonymous read" ON protocol_os_saved_handshakes
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for tables (optional but recommended)
ALTER PUBLICATION supabase_realtime ADD TABLE protocol_os_platforms;
ALTER PUBLICATION supabase_realtime ADD TABLE protocol_os_saved_handshakes;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get platform with its resources as nested JSON
CREATE OR REPLACE FUNCTION get_platform_with_resources(platform_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'serial', serial,
    'name', name,
    'url', url,
    'contributors', contributors,
    'isMaster', is_master,
    'resources', resources
  ) INTO result
  FROM protocol_os_platforms
  WHERE id = platform_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to search platforms by name
CREATE OR REPLACE FUNCTION search_platforms(search_term TEXT)
RETURNS SETOF protocol_os_platforms AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM protocol_os_platforms
  WHERE name ILIKE '%' || search_term || '%'
  ORDER BY name;
END;
$$ LANGUAGE plpgsql;

-- Function to get all versions of a saved handshake
CREATE OR REPLACE FUNCTION get_handshake_versions(handshake_base_name TEXT)
RETURNS TABLE (
  id UUID,
  version TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.id,
    sh.version,
    sh.created_at
  FROM protocol_os_saved_handshakes sh
  WHERE sh.base_name = handshake_base_name
  ORDER BY sh.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data for testing
/*
INSERT INTO protocol_os_platforms (serial, name, url, is_master, contributors, resources)
VALUES 
  (
    'PLAT-ABCD',
    'Demo Platform',
    'https://api.example.com',
    true,
    '["Developer One", "Developer Two"]'::jsonb,
    '[]'::jsonb
  );
*/

-- ============================================
-- CLEANUP (for development reset)
-- ============================================

-- Uncomment to drop all Protocol OS tables
/*
DROP TABLE IF EXISTS protocol_os_saved_handshakes CASCADE;
DROP TABLE IF EXISTS protocol_os_platforms CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS get_platform_with_resources CASCADE;
DROP FUNCTION IF EXISTS search_platforms CASCADE;
DROP FUNCTION IF EXISTS get_handshake_versions CASCADE;
*/
