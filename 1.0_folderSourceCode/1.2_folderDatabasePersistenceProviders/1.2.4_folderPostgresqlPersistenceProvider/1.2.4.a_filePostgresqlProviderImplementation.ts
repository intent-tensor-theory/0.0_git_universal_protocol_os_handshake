// ============================================
// PROTOCOL OS - POSTGRESQL PROVIDER IMPLEMENTATION
// ============================================
// Address: 1.2.4.a
// Purpose: PostgreSQL persistence provider via backend API proxy
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
 * PostgreSQL Provider
 * 
 * Server-side PostgreSQL persistence accessed through a backend API proxy.
 * Requires a backend service to handle database connections.
 * 
 * Configuration required:
 * - VITE_POSTGRESQL_API_URL (backend API endpoint)
 * - VITE_POSTGRESQL_API_KEY (optional, for authentication)
 * 
 * Features:
 * - Full SQL capabilities
 * - ACID compliance
 * - Complex queries and joins
 * - Scalable for large datasets
 * 
 * Note: This provider communicates with a backend API that handles
 * the actual PostgreSQL connection. Direct browser-to-database
 * connections are not supported for security reasons.
 */
export class PostgreSQLProvider implements DatabaseProvider {
  readonly identifier = 'postgresql' as const;
  readonly displayName = 'PostgreSQL';
  readonly requiresConfiguration = true;

  private apiUrl: string = '';
  private apiKey: string = '';
  private isInitialized = false;

  // API endpoints
  private readonly ENDPOINTS = {
    PLATFORMS: '/api/platforms',
    SAVED_HANDSHAKES: '/api/saved-handshakes',
    HEALTH: '/api/health',
    EXPORT: '/api/export',
    IMPORT: '/api/import',
    CLEAR: '/api/clear',
  } as const;

  // ============================================
  // INITIALIZATION
  // ============================================

  async checkConfiguration(): Promise<ProviderConfigurationStatus> {
    const missingFields: string[] = [];
    
    const apiUrl = import.meta.env?.VITE_POSTGRESQL_API_URL;
    
    if (!apiUrl) {
      missingFields.push('VITE_POSTGRESQL_API_URL');
    }
    
    if (missingFields.length > 0) {
      return {
        isConfigured: false,
        isConnected: false,
        missingFields,
        errorMessage: 'PostgreSQL API URL not configured',
      };
    }
    
    // Test connection
    try {
      const response = await fetch(`${apiUrl}${this.ENDPOINTS.HEALTH}`);
      
      if (!response.ok) {
        return {
          isConfigured: true,
          isConnected: false,
          missingFields: [],
          errorMessage: `Backend API returned status ${response.status}`,
        };
      }
      
      return {
        isConfigured: true,
        isConnected: true,
        missingFields: [],
      };
    } catch (error) {
      return {
        isConfigured: true,
        isConnected: false,
        missingFields: [],
        errorMessage: `Cannot connect to backend API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async initialize(): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      this.apiUrl = import.meta.env?.VITE_POSTGRESQL_API_URL || '';
      this.apiKey = import.meta.env?.VITE_POSTGRESQL_API_KEY || '';
      
      if (!this.apiUrl) {
        throw new Error('PostgreSQL API URL not configured');
      }
      
      // Verify connection
      const status = await this.checkConfiguration();
      
      if (!status.isConnected) {
        throw new Error(status.errorMessage || 'Failed to connect to backend');
      }
      
      this.isInitialized = true;
      console.log('[PostgreSQL] Provider initialized');
    }, 'initialize');
  }

  async disconnect(): Promise<DatabaseOperationResult> {
    this.isInitialized = false;
    return createSuccessResult();
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
      return this.apiRequest<Platform[]>(this.ENDPOINTS.PLATFORMS);
    }, 'getAllPlatforms');
  }

  async getPlatformById(id: string): Promise<DatabaseOperationResult<Platform | null>> {
    return wrapDatabaseOperation(async () => {
      try {
        return await this.apiRequest<Platform>(`${this.ENDPOINTS.PLATFORMS}/${id}`);
      } catch {
        return null;
      }
    }, 'getPlatformById');
  }

  async createPlatform(platform: Platform): Promise<DatabaseOperationResult<Platform>> {
    return wrapDatabaseOperation(async () => {
      const result = await this.apiRequest<Platform>(
        this.ENDPOINTS.PLATFORMS,
        'POST',
        platform
      );
      
      console.log(`[PostgreSQL] Created platform: ${platform.name}`);
      return result;
    }, 'createPlatform');
  }

  async updatePlatform(id: string, updates: Partial<Platform>): Promise<DatabaseOperationResult<Platform>> {
    return wrapDatabaseOperation(async () => {
      const result = await this.apiRequest<Platform>(
        `${this.ENDPOINTS.PLATFORMS}/${id}`,
        'PUT',
        updates
      );
      
      console.log(`[PostgreSQL] Updated platform: ${id}`);
      return result;
    }, 'updatePlatform');
  }

  async deletePlatform(id: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      await this.apiRequest(
        `${this.ENDPOINTS.PLATFORMS}/${id}`,
        'DELETE'
      );
      
      console.log(`[PostgreSQL] Deleted platform: ${id}`);
    }, 'deletePlatform');
  }

  // ============================================
  // SAVED HANDSHAKES OPERATIONS
  // ============================================

  async getAllSavedHandshakes(): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>> {
    return wrapDatabaseOperation(async () => {
      return this.apiRequest<SavedHandshakeSnapshot[]>(this.ENDPOINTS.SAVED_HANDSHAKES);
    }, 'getAllSavedHandshakes');
  }

  async getSavedHandshakesByBaseName(baseName: string): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>> {
    return wrapDatabaseOperation(async () => {
      return this.apiRequest<SavedHandshakeSnapshot[]>(
        `${this.ENDPOINTS.SAVED_HANDSHAKES}?baseName=${encodeURIComponent(baseName)}`
      );
    }, 'getSavedHandshakesByBaseName');
  }

  async saveHandshakeSnapshot(snapshot: SavedHandshakeSnapshot): Promise<DatabaseOperationResult<SavedHandshakeSnapshot>> {
    return wrapDatabaseOperation(async () => {
      const result = await this.apiRequest<SavedHandshakeSnapshot>(
        this.ENDPOINTS.SAVED_HANDSHAKES,
        'POST',
        snapshot
      );
      
      console.log(`[PostgreSQL] Saved handshake snapshot: ${snapshot.baseName}`);
      return result;
    }, 'saveHandshakeSnapshot');
  }

  async deleteSavedHandshake(id: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      await this.apiRequest(
        `${this.ENDPOINTS.SAVED_HANDSHAKES}/${id}`,
        'DELETE'
      );
      
      console.log(`[PostgreSQL] Deleted saved handshake: ${id}`);
    }, 'deleteSavedHandshake');
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  async exportAllData(): Promise<DatabaseOperationResult<string>> {
    return wrapDatabaseOperation(async () => {
      const data = await this.apiRequest<{
        platforms: Platform[];
        savedHandshakes: SavedHandshakeSnapshot[];
      }>(this.ENDPOINTS.EXPORT);
      
      const exportData = {
        version: DATA_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        provider: this.identifier,
        data,
      };
      
      return JSON.stringify(exportData, null, 2);
    }, 'exportAllData');
  }

  async importAllData(jsonData: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const parsed = JSON.parse(jsonData);
      
      if (!parsed.data) {
        throw new Error('Invalid import data format');
      }
      
      await this.apiRequest(
        this.ENDPOINTS.IMPORT,
        'POST',
        parsed.data
      );
      
      console.log('[PostgreSQL] Data imported successfully');
    }, 'importAllData');
  }

  async clearAllData(): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      await this.apiRequest(
        this.ENDPOINTS.CLEAR,
        'DELETE'
      );
      
      console.log('[PostgreSQL] All data cleared');
    }, 'clearAllData');
  }
}

export default PostgreSQLProvider;
