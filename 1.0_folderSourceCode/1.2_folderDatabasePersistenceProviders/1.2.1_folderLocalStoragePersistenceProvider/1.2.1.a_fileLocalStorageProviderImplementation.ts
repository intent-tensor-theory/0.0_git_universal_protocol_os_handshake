// ============================================
// PROTOCOL OS - LOCALSTORAGE PROVIDER IMPLEMENTATION
// ============================================
// Address: 1.2.1.a
// Purpose: Browser localStorage-based persistence provider
// ============================================

import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { SavedHandshakeSnapshot } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import {
  type DatabaseProvider,
  type DatabaseOperationResult,
  type ProviderConfigurationStatus,
  STORAGE_KEYS,
  DATA_SCHEMA_VERSION,
  createSuccessResult,
  createErrorResult,
  wrapDatabaseOperation,
} from '../1.2.a_fileDatabaseProviderInterface';

/**
 * LocalStorage Provider
 * 
 * Default persistence provider that uses browser localStorage.
 * No external configuration required - works out of the box.
 * 
 * Limitations:
 * - Data is browser-specific (not synced across devices)
 * - Storage limit ~5-10MB depending on browser
 * - Data can be cleared by user or browser
 * 
 * Best for:
 * - Development and testing
 * - Single-user local usage
 * - Quick prototyping
 */
export class LocalStorageProvider implements DatabaseProvider {
  readonly identifier = 'localStorage' as const;
  readonly displayName = 'Browser Local Storage';
  readonly requiresConfiguration = false;

  private isInitialized = false;

  // ============================================
  // INITIALIZATION
  // ============================================

  async checkConfiguration(): Promise<ProviderConfigurationStatus> {
    try {
      const testKey = '__protocol_os_config_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      return {
        isConfigured: true,
        isConnected: true,
        missingFields: [],
      };
    } catch (error) {
      return {
        isConfigured: false,
        isConnected: false,
        missingFields: [],
        errorMessage: 'localStorage is not available in this browser',
      };
    }
  }

  async initialize(): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      // Check if we need to migrate data from older versions
      const storedVersion = localStorage.getItem(STORAGE_KEYS.VERSION);
      
      if (!storedVersion) {
        // First run - initialize with version
        localStorage.setItem(STORAGE_KEYS.VERSION, DATA_SCHEMA_VERSION);
      } else if (storedVersion !== DATA_SCHEMA_VERSION) {
        // Version mismatch - migration needed
        await this.migrateData(storedVersion, DATA_SCHEMA_VERSION);
      }
      
      // Initialize empty arrays if not present
      if (!localStorage.getItem(STORAGE_KEYS.PLATFORMS)) {
        localStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify([]));
      }
      
      if (!localStorage.getItem(STORAGE_KEYS.SAVED_HANDSHAKES)) {
        localStorage.setItem(STORAGE_KEYS.SAVED_HANDSHAKES, JSON.stringify([]));
      }
      
      this.isInitialized = true;
      console.log('[LocalStorage] Provider initialized');
    }, 'initialize');
  }

  async disconnect(): Promise<DatabaseOperationResult> {
    this.isInitialized = false;
    return createSuccessResult();
  }

  // ============================================
  // PLATFORM OPERATIONS
  // ============================================

  async getAllPlatforms(): Promise<DatabaseOperationResult<Platform[]>> {
    return wrapDatabaseOperation(async () => {
      const data = localStorage.getItem(STORAGE_KEYS.PLATFORMS);
      return data ? JSON.parse(data) : [];
    }, 'getAllPlatforms');
  }

  async getPlatformById(id: string): Promise<DatabaseOperationResult<Platform | null>> {
    return wrapDatabaseOperation(async () => {
      const platforms = await this.getPlatformsArray();
      return platforms.find(p => p.id === id) ?? null;
    }, 'getPlatformById');
  }

  async createPlatform(platform: Platform): Promise<DatabaseOperationResult<Platform>> {
    return wrapDatabaseOperation(async () => {
      const platforms = await this.getPlatformsArray();
      
      // Check for duplicate ID
      if (platforms.some(p => p.id === platform.id)) {
        throw new Error(`Platform with ID ${platform.id} already exists`);
      }
      
      platforms.push(platform);
      this.savePlatforms(platforms);
      
      console.log(`[LocalStorage] Created platform: ${platform.name} (${platform.serial})`);
      return platform;
    }, 'createPlatform');
  }

  async updatePlatform(id: string, updates: Partial<Platform>): Promise<DatabaseOperationResult<Platform>> {
    return wrapDatabaseOperation(async () => {
      const platforms = await this.getPlatformsArray();
      const index = platforms.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error(`Platform with ID ${id} not found`);
      }
      
      const updatedPlatform = { ...platforms[index], ...updates };
      platforms[index] = updatedPlatform;
      this.savePlatforms(platforms);
      
      console.log(`[LocalStorage] Updated platform: ${updatedPlatform.name}`);
      return updatedPlatform;
    }, 'updatePlatform');
  }

  async deletePlatform(id: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const platforms = await this.getPlatformsArray();
      const index = platforms.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error(`Platform with ID ${id} not found`);
      }
      
      const deleted = platforms.splice(index, 1)[0];
      this.savePlatforms(platforms);
      
      console.log(`[LocalStorage] Deleted platform: ${deleted.name}`);
    }, 'deletePlatform');
  }

  // ============================================
  // SAVED HANDSHAKES OPERATIONS
  // ============================================

  async getAllSavedHandshakes(): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>> {
    return wrapDatabaseOperation(async () => {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_HANDSHAKES);
      return data ? JSON.parse(data) : [];
    }, 'getAllSavedHandshakes');
  }

  async getSavedHandshakesByBaseName(baseName: string): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>> {
    return wrapDatabaseOperation(async () => {
      const allSnapshots = await this.getSavedHandshakesArray();
      return allSnapshots.filter(s => s.baseName === baseName);
    }, 'getSavedHandshakesByBaseName');
  }

  async saveHandshakeSnapshot(snapshot: SavedHandshakeSnapshot): Promise<DatabaseOperationResult<SavedHandshakeSnapshot>> {
    return wrapDatabaseOperation(async () => {
      const snapshots = await this.getSavedHandshakesArray();
      
      // Check for duplicate ID
      const existingIndex = snapshots.findIndex(s => s.id === snapshot.id);
      
      if (existingIndex !== -1) {
        // Update existing
        snapshots[existingIndex] = snapshot;
      } else {
        // Add new
        snapshots.push(snapshot);
      }
      
      this.saveSavedHandshakes(snapshots);
      
      console.log(`[LocalStorage] Saved handshake snapshot: ${snapshot.baseName} ${snapshot.version}`);
      return snapshot;
    }, 'saveHandshakeSnapshot');
  }

  async deleteSavedHandshake(id: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const snapshots = await this.getSavedHandshakesArray();
      const index = snapshots.findIndex(s => s.id === id);
      
      if (index === -1) {
        throw new Error(`Saved handshake with ID ${id} not found`);
      }
      
      const deleted = snapshots.splice(index, 1)[0];
      this.saveSavedHandshakes(snapshots);
      
      console.log(`[LocalStorage] Deleted saved handshake: ${deleted.baseName}`);
    }, 'deleteSavedHandshake');
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  async exportAllData(): Promise<DatabaseOperationResult<string>> {
    return wrapDatabaseOperation(async () => {
      const platforms = await this.getPlatformsArray();
      const savedHandshakes = await this.getSavedHandshakesArray();
      
      const exportData = {
        version: DATA_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        provider: this.identifier,
        data: {
          platforms,
          savedHandshakes,
        },
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
      
      const { platforms = [], savedHandshakes = [] } = parsed.data;
      
      this.savePlatforms(platforms);
      this.saveSavedHandshakes(savedHandshakes);
      localStorage.setItem(STORAGE_KEYS.VERSION, DATA_SCHEMA_VERSION);
      
      console.log(`[LocalStorage] Imported ${platforms.length} platforms, ${savedHandshakes.length} saved handshakes`);
    }, 'importAllData');
  }

  async clearAllData(): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      localStorage.removeItem(STORAGE_KEYS.PLATFORMS);
      localStorage.removeItem(STORAGE_KEYS.SAVED_HANDSHAKES);
      localStorage.removeItem(STORAGE_KEYS.APP_STATE);
      // Keep version to track schema
      
      console.log('[LocalStorage] All data cleared');
    }, 'clearAllData');
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async getPlatformsArray(): Promise<Platform[]> {
    const data = localStorage.getItem(STORAGE_KEYS.PLATFORMS);
    return data ? JSON.parse(data) : [];
  }

  private savePlatforms(platforms: Platform[]): void {
    localStorage.setItem(STORAGE_KEYS.PLATFORMS, JSON.stringify(platforms));
  }

  private async getSavedHandshakesArray(): Promise<SavedHandshakeSnapshot[]> {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_HANDSHAKES);
    return data ? JSON.parse(data) : [];
  }

  private saveSavedHandshakes(snapshots: SavedHandshakeSnapshot[]): void {
    localStorage.setItem(STORAGE_KEYS.SAVED_HANDSHAKES, JSON.stringify(snapshots));
  }

  private async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`[LocalStorage] Migrating data from v${fromVersion} to v${toVersion}`);
    
    // Add migration logic here as schema evolves
    // For now, just update the version
    localStorage.setItem(STORAGE_KEYS.VERSION, toVersion);
  }
}

export default LocalStorageProvider;
