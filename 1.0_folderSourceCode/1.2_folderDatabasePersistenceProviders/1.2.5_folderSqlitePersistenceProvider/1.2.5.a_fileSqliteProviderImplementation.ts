// ============================================
// PROTOCOL OS - SQLITE PROVIDER IMPLEMENTATION
// ============================================
// Address: 1.2.5.a
// Purpose: SQLite persistence provider via backend API or WASM
// ============================================

import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { SavedHandshakeSnapshot } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import {
  type DatabaseProvider,
  type DatabaseOperationResult,
  type ProviderConfigurationStatus,
  DATA_SCHEMA_VERSION,
  createSuccessResult,
  createErrorResult,
  wrapDatabaseOperation,
} from '../1.2.a_fileDatabaseProviderInterface';

/**
 * SQLite Provider
 * 
 * Lightweight file-based SQLite persistence.
 * Can operate in two modes:
 * 1. Backend API mode (default) - Requires a backend service
 * 2. WASM mode - Uses sql.js for in-browser SQLite (experimental)
 * 
 * Configuration required:
 * - VITE_SQLITE_API_URL (for backend mode)
 * - VITE_SQLITE_MODE ('api' or 'wasm', defaults to 'api')
 * 
 * Features:
 * - Zero configuration database
 * - Single file storage
 * - Full SQL support
 * - Portable and lightweight
 */
export class SQLiteProvider implements DatabaseProvider {
  readonly identifier = 'sqlite' as const;
  readonly displayName = 'SQLite';
  readonly requiresConfiguration = true;

  private apiUrl: string = '';
  private apiKey: string = '';
  private mode: 'api' | 'wasm' = 'api';
  private wasmDb: unknown = null;
  private isInitialized = false;

  // API endpoints (for API mode)
  private readonly ENDPOINTS = {
    PLATFORMS: '/api/sqlite/platforms',
    SAVED_HANDSHAKES: '/api/sqlite/saved-handshakes',
    HEALTH: '/api/sqlite/health',
    EXPORT: '/api/sqlite/export',
    IMPORT: '/api/sqlite/import',
    CLEAR: '/api/sqlite/clear',
  } as const;

  // ============================================
  // INITIALIZATION
  // ============================================

  async checkConfiguration(): Promise<ProviderConfigurationStatus> {
    const missingFields: string[] = [];
    
    this.mode = (import.meta.env?.VITE_SQLITE_MODE as 'api' | 'wasm') || 'api';
    
    if (this.mode === 'api') {
      const apiUrl = import.meta.env?.VITE_SQLITE_API_URL;
      
      if (!apiUrl) {
        missingFields.push('VITE_SQLITE_API_URL');
      }
    }
    
    if (missingFields.length > 0) {
      return {
        isConfigured: false,
        isConnected: false,
        missingFields,
        errorMessage: 'SQLite configuration missing',
      };
    }
    
    return {
      isConfigured: true,
      isConnected: true, // Will verify on initialize
      missingFields: [],
    };
  }

  async initialize(): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      this.mode = (import.meta.env?.VITE_SQLITE_MODE as 'api' | 'wasm') || 'api';
      
      if (this.mode === 'wasm') {
        await this.initializeWasm();
      } else {
        await this.initializeApi();
      }
      
      this.isInitialized = true;
      console.log(`[SQLite] Provider initialized in ${this.mode} mode`);
    }, 'initialize');
  }

  private async initializeApi(): Promise<void> {
    this.apiUrl = import.meta.env?.VITE_SQLITE_API_URL || '';
    this.apiKey = import.meta.env?.VITE_SQLITE_API_KEY || '';
    
    if (!this.apiUrl) {
      throw new Error('SQLite API URL not configured');
    }
    
    // Verify connection
    const response = await fetch(`${this.apiUrl}${this.ENDPOINTS.HEALTH}`);
    
    if (!response.ok) {
      throw new Error(`Backend API returned status ${response.status}`);
    }
  }

  private async initializeWasm(): Promise<void> {
    // Dynamic import of sql.js for WASM mode
    const initSqlJs = (await import('sql.js')).default;
    
    const SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
    
    // Try to load existing database from IndexedDB
    const savedDb = await this.loadDatabaseFromStorage();
    
    if (savedDb) {
      this.wasmDb = new SQL.Database(savedDb);
    } else {
      this.wasmDb = new SQL.Database();
      await this.initializeWasmSchema();
    }
  }

  private async initializeWasmSchema(): Promise<void> {
    const db = this.wasmDb as { run: (sql: string) => void };
    
    db.run(`
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
      
      CREATE TABLE IF NOT EXISTS saved_handshakes (
        id TEXT PRIMARY KEY,
        base_name TEXT NOT NULL,
        version TEXT NOT NULL,
        snapshot_data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(base_name, version)
      );
      
      CREATE INDEX IF NOT EXISTS idx_platforms_serial ON platforms(serial);
      CREATE INDEX IF NOT EXISTS idx_saved_handshakes_base_name ON saved_handshakes(base_name);
    `);
    
    await this.saveDatabaseToStorage();
  }

  async disconnect(): Promise<DatabaseOperationResult> {
    if (this.mode === 'wasm' && this.wasmDb) {
      await this.saveDatabaseToStorage();
      (this.wasmDb as { close: () => void }).close();
      this.wasmDb = null;
    }
    
    this.isInitialized = false;
    return createSuccessResult();
  }

  // ============================================
  // STORAGE HELPERS (for WASM mode)
  // ============================================

  private async loadDatabaseFromStorage(): Promise<Uint8Array | null> {
    try {
      const request = indexedDB.open('ProtocolOS_SQLite', 1);
      
      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('database', 'readonly');
          const store = tx.objectStore('database');
          const getRequest = store.get('main');
          
          getRequest.onsuccess = () => {
            resolve(getRequest.result?.data || null);
          };
          
          getRequest.onerror = () => resolve(null);
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          db.createObjectStore('database', { keyPath: 'id' });
        };
      });
    } catch {
      return null;
    }
  }

  private async saveDatabaseToStorage(): Promise<void> {
    if (!this.wasmDb) return;
    
    const data = (this.wasmDb as { export: () => Uint8Array }).export();
    
    const request = indexedDB.open('ProtocolOS_SQLite', 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('database', 'readwrite');
        const store = tx.objectStore('database');
        store.put({ id: 'main', data });
        
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
  }

  // ============================================
  // API HELPERS
  // ============================================

  private async apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    return response.json();
  }

  // ============================================
  // PLATFORM OPERATIONS
  // ============================================

  async getAllPlatforms(): Promise<DatabaseOperationResult<Platform[]>> {
    return wrapDatabaseOperation(async () => {
      if (this.mode === 'wasm') {
        return this.wasmGetAllPlatforms();
      }
      return this.apiRequest<Platform[]>(this.ENDPOINTS.PLATFORMS);
    }, 'getAllPlatforms');
  }

  private wasmGetAllPlatforms(): Platform[] {
    const db = this.wasmDb as { exec: (sql: string) => Array<{ values: unknown[][] }> };
    const result = db.exec('SELECT * FROM platforms');
    
    if (result.length === 0) return [];
    
    return result[0].values.map((row) => ({
      id: row[0] as string,
      serial: row[1] as string,
      name: row[2] as string,
      url: row[3] as string,
      contributors: JSON.parse(row[4] as string),
      isMaster: Boolean(row[5]),
      resources: JSON.parse(row[6] as string),
    })) as Platform[];
  }

  async getPlatformById(id: string): Promise<DatabaseOperationResult<Platform | null>> {
    return wrapDatabaseOperation(async () => {
      if (this.mode === 'wasm') {
        const all = this.wasmGetAllPlatforms();
        return all.find(p => p.id === id) ?? null;
      }
      
      try {
        return await this.apiRequest<Platform>(`${this.ENDPOINTS.PLATFORMS}/${id}`);
      } catch {
        return null;
      }
    }, 'getPlatformById');
  }

  async createPlatform(platform: Platform): Promise<DatabaseOperationResult<Platform>> {
    return wrapDatabaseOperation(async () => {
      if (this.mode === 'wasm') {
        return this.wasmCreatePlatform(platform);
      }
      
      return this.apiRequest<Platform>(this.ENDPOINTS.PLATFORMS, 'POST', platform);
    }, 'createPlatform');
  }

  private async wasmCreatePlatform(platform: Platform): Promise<Platform> {
    const db = this.wasmDb as { run: (sql: string, params: unknown[]) => void };
    
    db.run(
      `INSERT INTO platforms (id, serial, name, url, contributors, is_master, resources)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        platform.id,
        platform.serial,
        platform.name,
        platform.url || '',
        JSON.stringify(platform.contributors),
        platform.isMaster ? 1 : 0,
        JSON.stringify(platform.resources || []),
      ]
    );
    
    await this.saveDatabaseToStorage();
    console.log(`[SQLite WASM] Created platform: ${platform.name}`);
    return platform;
  }

  async updatePlatform(id: string, updates: Partial<Platform>): Promise<DatabaseOperationResult<Platform>> {
    return wrapDatabaseOperation(async () => {
      if (this.mode === 'wasm') {
        return this.wasmUpdatePlatform(id, updates);
      }
      
      return this.apiRequest<Platform>(`${this.ENDPOINTS.PLATFORMS}/${id}`, 'PUT', updates);
    }, 'updatePlatform');
  }

  private async wasmUpdatePlatform(id: string, updates: Partial<Platform>): Promise<Platform> {
    const existing = this.wasmGetAllPlatforms().find(p => p.id === id);
    if (!existing) throw new Error('Platform not found');
    
    const updated = { ...existing, ...updates };
    const db = this.wasmDb as { run: (sql: string, params: unknown[]) => void };
    
    db.run(
      `UPDATE platforms SET name=?, url=?, contributors=?, is_master=?, resources=?, updated_at=datetime('now')
       WHERE id=?`,
      [
        updated.name,
        updated.url || '',
        JSON.stringify(updated.contributors),
        updated.isMaster ? 1 : 0,
        JSON.stringify(updated.resources || []),
        id,
      ]
    );
    
    await this.saveDatabaseToStorage();
    return updated;
  }

  async deletePlatform(id: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      if (this.mode === 'wasm') {
        const db = this.wasmDb as { run: (sql: string, params: unknown[]) => void };
        db.run('DELETE FROM platforms WHERE id=?', [id]);
        await this.saveDatabaseToStorage();
        return;
      }
      
      await this.apiRequest(`${this.ENDPOINTS.PLATFORMS}/${id}`, 'DELETE');
    }, 'deletePlatform');
  }

  // ============================================
  // SAVED HANDSHAKES (simplified for brevity)
  // ============================================

  async getAllSavedHandshakes(): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>> {
    return wrapDatabaseOperation(async () => {
      if (this.mode === 'wasm') {
        const db = this.wasmDb as { exec: (sql: string) => Array<{ values: unknown[][] }> };
        const result = db.exec('SELECT * FROM saved_handshakes');
        
        if (result.length === 0) return [];
        
        return result[0].values.map((row) => 
          JSON.parse(row[3] as string)
        );
      }
      
      return this.apiRequest<SavedHandshakeSnapshot[]>(this.ENDPOINTS.SAVED_HANDSHAKES);
    }, 'getAllSavedHandshakes');
  }

  async getSavedHandshakesByBaseName(baseName: string): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>> {
    const result = await this.getAllSavedHandshakes();
    if (result.success && result.data) {
      return {
        ...result,
        data: result.data.filter(s => s.baseName === baseName),
      };
    }
    return result;
  }

  async saveHandshakeSnapshot(snapshot: SavedHandshakeSnapshot): Promise<DatabaseOperationResult<SavedHandshakeSnapshot>> {
    return wrapDatabaseOperation(async () => {
      if (this.mode === 'wasm') {
        const db = this.wasmDb as { run: (sql: string, params: unknown[]) => void };
        
        db.run(
          `INSERT OR REPLACE INTO saved_handshakes (id, base_name, version, snapshot_data)
           VALUES (?, ?, ?, ?)`,
          [snapshot.id, snapshot.baseName, snapshot.version, JSON.stringify(snapshot)]
        );
        
        await this.saveDatabaseToStorage();
        return snapshot;
      }
      
      return this.apiRequest<SavedHandshakeSnapshot>(
        this.ENDPOINTS.SAVED_HANDSHAKES,
        'POST',
        snapshot
      );
    }, 'saveHandshakeSnapshot');
  }

  async deleteSavedHandshake(id: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      if (this.mode === 'wasm') {
        const db = this.wasmDb as { run: (sql: string, params: unknown[]) => void };
        db.run('DELETE FROM saved_handshakes WHERE id=?', [id]);
        await this.saveDatabaseToStorage();
        return;
      }
      
      await this.apiRequest(`${this.ENDPOINTS.SAVED_HANDSHAKES}/${id}`, 'DELETE');
    }, 'deleteSavedHandshake');
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  async exportAllData(): Promise<DatabaseOperationResult<string>> {
    return wrapDatabaseOperation(async () => {
      const [platformsResult, handshakesResult] = await Promise.all([
        this.getAllPlatforms(),
        this.getAllSavedHandshakes(),
      ]);
      
      return JSON.stringify({
        version: DATA_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        provider: this.identifier,
        data: {
          platforms: platformsResult.data ?? [],
          savedHandshakes: handshakesResult.data ?? [],
        },
      }, null, 2);
    }, 'exportAllData');
  }

  async importAllData(jsonData: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const parsed = JSON.parse(jsonData);
      
      if (!parsed.data) {
        throw new Error('Invalid import data format');
      }
      
      const { platforms = [], savedHandshakes = [] } = parsed.data;
      
      for (const platform of platforms) {
        await this.createPlatform(platform);
      }
      
      for (const snapshot of savedHandshakes) {
        await this.saveHandshakeSnapshot(snapshot);
      }
    }, 'importAllData');
  }

  async clearAllData(): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      if (this.mode === 'wasm') {
        const db = this.wasmDb as { run: (sql: string) => void };
        db.run('DELETE FROM platforms');
        db.run('DELETE FROM saved_handshakes');
        await this.saveDatabaseToStorage();
        return;
      }
      
      await this.apiRequest(this.ENDPOINTS.CLEAR, 'DELETE');
    }, 'clearAllData');
  }
}

export default SQLiteProvider;
