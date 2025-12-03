-- ============================================
-- PROTOCOL OS - SQLITE DATABASE SCHEMA
-- ============================================
-- Address: 1.2.5.b
-- Purpose: SQL schema for SQLite database tables
-- ============================================

-- This schema is used both for backend SQLite databases
-- and for the WASM in-browser SQLite mode

-- ============================================
-- PLATFORMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  serial TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  contributors TEXT DEFAULT '[]',
  is_master INTEGER DEFAULT 0,
  resources TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_platforms_serial ON platforms(serial);
CREATE INDEX IF NOT EXISTS idx_platforms_is_master ON platforms(is_master);
CREATE INDEX IF NOT EXISTS idx_platforms_name ON platforms(name);
CREATE INDEX IF NOT EXISTS idx_platforms_created_at ON platforms(created_at DESC);

-- ============================================
-- SAVED HANDSHAKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS saved_handshakes (
  id TEXT PRIMARY KEY,
  base_name TEXT NOT NULL,
  version TEXT NOT NULL,
  snapshot_data TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  
  -- Unique constraint for base_name + version combination
  UNIQUE(base_name, version)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_handshakes_base_name ON saved_handshakes(base_name);
CREATE INDEX IF NOT EXISTS idx_saved_handshakes_version ON saved_handshakes(version);
CREATE INDEX IF NOT EXISTS idx_saved_handshakes_created_at ON saved_handshakes(created_at DESC);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================

CREATE TRIGGER IF NOT EXISTS update_platforms_timestamp 
AFTER UPDATE ON platforms
BEGIN
  UPDATE platforms 
  SET updated_at = datetime('now') 
  WHERE id = NEW.id;
END;

-- ============================================
-- VIEWS
-- ============================================

-- View: Master platforms only
CREATE VIEW IF NOT EXISTS v_master_platforms AS
SELECT * FROM platforms WHERE is_master = 1;

-- View: Active platforms (non-master)
CREATE VIEW IF NOT EXISTS v_active_platforms AS
SELECT * FROM platforms WHERE is_master = 0;

-- View: Latest handshake versions (one per base_name)
CREATE VIEW IF NOT EXISTS v_latest_handshake_versions AS
SELECT * FROM saved_handshakes
WHERE (base_name, created_at) IN (
  SELECT base_name, MAX(created_at)
  FROM saved_handshakes
  GROUP BY base_name
);

-- ============================================
-- HELPER QUERIES (for reference)
-- ============================================

-- Get platform with resource count (use in application code):
-- SELECT 
--   id, serial, name, url, is_master,
--   json_array_length(resources) as resource_count,
--   created_at, updated_at
-- FROM platforms
-- WHERE id = ?;

-- Search platforms by name:
-- SELECT * FROM platforms
-- WHERE name LIKE '%' || ? || '%'
-- ORDER BY name;

-- Get all versions of a saved handshake:
-- SELECT id, version, created_at
-- FROM saved_handshakes
-- WHERE base_name = ?
-- ORDER BY created_at DESC;

-- Count total resources across all platforms:
-- SELECT COALESCE(SUM(json_array_length(resources)), 0) as total
-- FROM platforms;

-- ============================================
-- UTILITY OPERATIONS
-- ============================================

-- Upsert platform (use INSERT OR REPLACE in SQLite):
-- INSERT OR REPLACE INTO platforms 
--   (id, serial, name, url, contributors, is_master, resources)
-- VALUES (?, ?, ?, ?, ?, ?, ?);

-- Cleanup old handshake versions (keep last N per base_name):
-- DELETE FROM saved_handshakes
-- WHERE id NOT IN (
--   SELECT id FROM (
--     SELECT id, 
--            ROW_NUMBER() OVER (PARTITION BY base_name ORDER BY created_at DESC) as rn
--     FROM saved_handshakes
--   )
--   WHERE rn <= 5
-- );

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data
/*
INSERT INTO platforms (id, serial, name, url, is_master, contributors, resources)
VALUES (
  'test-platform-001',
  'PLAT-TEST',
  'Test Platform',
  'https://api.test.com',
  1,
  '["Test User"]',
  '[]'
);
*/

-- ============================================
-- CLEANUP (for development reset)
-- ============================================

-- Uncomment to drop all Protocol OS tables
/*
DROP VIEW IF EXISTS v_master_platforms;
DROP VIEW IF EXISTS v_active_platforms;
DROP VIEW IF EXISTS v_latest_handshake_versions;
DROP TRIGGER IF EXISTS update_platforms_timestamp;
DROP TABLE IF EXISTS saved_handshakes;
DROP TABLE IF EXISTS platforms;
*/

-- ============================================
-- DATABASE PRAGMAS (for performance)
-- ============================================

-- These should be run when opening the database connection:
-- PRAGMA journal_mode=WAL;           -- Write-Ahead Logging for better concurrency
-- PRAGMA synchronous=NORMAL;         -- Balance between safety and speed
-- PRAGMA foreign_keys=ON;            -- Enable foreign key constraints
-- PRAGMA busy_timeout=5000;          -- Wait up to 5 seconds if database is locked
-- PRAGMA cache_size=-64000;          -- Use 64MB of cache
