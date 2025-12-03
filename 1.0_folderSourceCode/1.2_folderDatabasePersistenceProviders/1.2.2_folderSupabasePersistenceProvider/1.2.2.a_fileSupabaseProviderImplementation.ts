// ============================================
// PROTOCOL OS - SUPABASE PROVIDER IMPLEMENTATION
// ============================================
// Address: 1.2.2.a
// Purpose: Supabase cloud database persistence provider
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
 * Supabase client type (lazy loaded)
 */
type SupabaseClient = {
  from: (table: string) => {
    select: (columns?: string) => Promise<{ data: unknown[]; error: Error | null }>;
    insert: (data: unknown) => { select: () => Promise<{ data: unknown[]; error: Error | null }> };
    update: (data: unknown) => { eq: (col: string, val: string) => { select: () => Promise<{ data: unknown[]; error: Error | null }> } };
    delete: () => { eq: (col: string, val: string) => Promise<{ error: Error | null }> };
    upsert: (data: unknown) => { select: () => Promise<{ data: unknown[]; error: Error | null }> };
  };
};

/**
 * Supabase Provider
 * 
 * Cloud-based persistence using Supabase's PostgreSQL database.
 * Provides cross-device sync and real-time subscriptions.
 * 
 * Configuration required:
 * - VITE_SUPABASE_PROJECT_URL
 * - VITE_SUPABASE_ANON_KEY
 * 
 * Features:
 * - Real-time subscriptions
 * - Row-level security
 * - Cross-device sync
 * - Automatic backups
 */
export class SupabaseProvider implements DatabaseProvider {
  readonly identifier = 'supabase' as const;
  readonly displayName = 'Supabase';
  readonly requiresConfiguration = true;

  private client: SupabaseClient | null = null;
  private isInitialized = false;

  // Table names
  private readonly TABLES = {
    PLATFORMS: 'protocol_os_platforms',
    SAVED_HANDSHAKES: 'protocol_os_saved_handshakes',
  } as const;

  // ============================================
  // INITIALIZATION
  // ============================================

  async checkConfiguration(): Promise<ProviderConfigurationStatus> {
    const missingFields: string[] = [];
    
    const projectUrl = import.meta.env?.VITE_SUPABASE_PROJECT_URL;
    const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    
    if (!projectUrl) missingFields.push('VITE_SUPABASE_PROJECT_URL');
    if (!anonKey) missingFields.push('VITE_SUPABASE_ANON_KEY');
    
    if (missingFields.length > 0) {
      return {
        isConfigured: false,
        isConnected: false,
        missingFields,
        errorMessage: 'Missing required environment variables',
      };
    }
    
    // Try to connect
    try {
      await this.getClient();
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
        errorMessage: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  async initialize(): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      await this.getClient();
      this.isInitialized = true;
      console.log('[Supabase] Provider initialized');
    }, 'initialize');
  }

  async disconnect(): Promise<DatabaseOperationResult> {
    this.client = null;
    this.isInitialized = false;
    return createSuccessResult();
  }

  // ============================================
  // CLIENT MANAGEMENT
  // ============================================

  private async getClient(): Promise<SupabaseClient> {
    if (this.client) return this.client;

    const projectUrl = import.meta.env?.VITE_SUPABASE_PROJECT_URL;
    const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

    if (!projectUrl || !anonKey) {
      throw new Error('Supabase configuration not found');
    }

    // Dynamic import to avoid bundling Supabase when not used
    const { createClient } = await import('@supabase/supabase-js');
    this.client = createClient(projectUrl, anonKey) as unknown as SupabaseClient;
    
    return this.client;
  }

  // ============================================
  // PLATFORM OPERATIONS
  // ============================================

  async getAllPlatforms(): Promise<DatabaseOperationResult<Platform[]>> {
    return wrapDatabaseOperation(async () => {
      const client = await this.getClient();
      const { data, error } = await client.from(this.TABLES.PLATFORMS).select('*');
      
      if (error) throw error;
      return (data as Platform[]) ?? [];
    }, 'getAllPlatforms');
  }

  async getPlatformById(id: string): Promise<DatabaseOperationResult<Platform | null>> {
    return wrapDatabaseOperation(async () => {
      const client = await this.getClient();
      const { data, error } = await client.from(this.TABLES.PLATFORMS).select('*');
      
      if (error) throw error;
      const platforms = data as Platform[];
      return platforms.find(p => p.id === id) ?? null;
    }, 'getPlatformById');
  }

  async createPlatform(platform: Platform): Promise<DatabaseOperationResult<Platform>> {
    return wrapDatabaseOperation(async () => {
      const client = await this.getClient();
      
      const { data, error } = await client
        .from(this.TABLES.PLATFORMS)
        .insert(this.serializePlatform(platform))
        .select();
      
      if (error) throw error;
      
      console.log(`[Supabase] Created platform: ${platform.name}`);
      return this.deserializePlatform((data as unknown[])[0]);
    }, 'createPlatform');
  }

  async updatePlatform(id: string, updates: Partial<Platform>): Promise<DatabaseOperationResult<Platform>> {
    return wrapDatabaseOperation(async () => {
      const client = await this.getClient();
      
      const { data, error } = await client
        .from(this.TABLES.PLATFORMS)
        .update(this.serializePartialPlatform(updates))
        .eq('id', id)
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Platform not found');
      
      console.log(`[Supabase] Updated platform: ${id}`);
      return this.deserializePlatform((data as unknown[])[0]);
    }, 'updatePlatform');
  }

  async deletePlatform(id: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const client = await this.getClient();
      
      const { error } = await client
        .from(this.TABLES.PLATFORMS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log(`[Supabase] Deleted platform: ${id}`);
    }, 'deletePlatform');
  }

  // ============================================
  // SAVED HANDSHAKES OPERATIONS
  // ============================================

  async getAllSavedHandshakes(): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>> {
    return wrapDatabaseOperation(async () => {
      const client = await this.getClient();
      const { data, error } = await client.from(this.TABLES.SAVED_HANDSHAKES).select('*');
      
      if (error) throw error;
      return ((data as unknown[]) ?? []).map(this.deserializeSnapshot);
    }, 'getAllSavedHandshakes');
  }

  async getSavedHandshakesByBaseName(baseName: string): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>> {
    return wrapDatabaseOperation(async () => {
      const client = await this.getClient();
      const { data, error } = await client.from(this.TABLES.SAVED_HANDSHAKES).select('*');
      
      if (error) throw error;
      const allSnapshots = ((data as unknown[]) ?? []).map(this.deserializeSnapshot);
      return allSnapshots.filter(s => s.baseName === baseName);
    }, 'getSavedHandshakesByBaseName');
  }

  async saveHandshakeSnapshot(snapshot: SavedHandshakeSnapshot): Promise<DatabaseOperationResult<SavedHandshakeSnapshot>> {
    return wrapDatabaseOperation(async () => {
      const client = await this.getClient();
      
      const { data, error } = await client
        .from(this.TABLES.SAVED_HANDSHAKES)
        .upsert(this.serializeSnapshot(snapshot))
        .select();
      
      if (error) throw error;
      
      console.log(`[Supabase] Saved handshake snapshot: ${snapshot.baseName}`);
      return this.deserializeSnapshot((data as unknown[])[0]);
    }, 'saveHandshakeSnapshot');
  }

  async deleteSavedHandshake(id: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const client = await this.getClient();
      
      const { error } = await client
        .from(this.TABLES.SAVED_HANDSHAKES)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log(`[Supabase] Deleted saved handshake: ${id}`);
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
      
      const exportData = {
        version: DATA_SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        provider: this.identifier,
        data: {
          platforms: platformsResult.data ?? [],
          savedHandshakes: handshakesResult.data ?? [],
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
      const client = await this.getClient();
      
      // Import platforms
      for (const platform of platforms) {
        await client
          .from(this.TABLES.PLATFORMS)
          .upsert(this.serializePlatform(platform));
      }
      
      // Import saved handshakes
      for (const snapshot of savedHandshakes) {
        await client
          .from(this.TABLES.SAVED_HANDSHAKES)
          .upsert(this.serializeSnapshot(snapshot));
      }
      
      console.log(`[Supabase] Imported ${platforms.length} platforms, ${savedHandshakes.length} saved handshakes`);
    }, 'importAllData');
  }

  async clearAllData(): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const client = await this.getClient();
      
      // Delete all records (use with caution)
      await client.from(this.TABLES.SAVED_HANDSHAKES).delete();
      await client.from(this.TABLES.PLATFORMS).delete();
      
      console.log('[Supabase] All data cleared');
    }, 'clearAllData');
  }

  // ============================================
  // SERIALIZATION HELPERS
  // ============================================

  private serializePlatform(platform: Platform): Record<string, unknown> {
    return {
      id: platform.id,
      serial: platform.serial,
      name: platform.name,
      url: platform.url,
      contributors: JSON.stringify(platform.contributors),
      is_master: platform.isMaster,
      resources: JSON.stringify(platform.resources),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private serializePartialPlatform(updates: Partial<Platform>): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.name !== undefined) serialized.name = updates.name;
    if (updates.url !== undefined) serialized.url = updates.url;
    if (updates.contributors !== undefined) serialized.contributors = JSON.stringify(updates.contributors);
    if (updates.isMaster !== undefined) serialized.is_master = updates.isMaster;
    if (updates.resources !== undefined) serialized.resources = JSON.stringify(updates.resources);
    
    return serialized;
  }

  private deserializePlatform(row: unknown): Platform {
    const data = row as Record<string, unknown>;
    return {
      id: data.id as string,
      serial: data.serial as string,
      name: data.name as string,
      url: data.url as string,
      contributors: typeof data.contributors === 'string' 
        ? JSON.parse(data.contributors) 
        : data.contributors,
      isMaster: data.is_master as boolean,
      resources: typeof data.resources === 'string'
        ? JSON.parse(data.resources)
        : data.resources ?? [],
    } as Platform;
  }

  private serializeSnapshot(snapshot: SavedHandshakeSnapshot): Record<string, unknown> {
    return {
      id: snapshot.id,
      base_name: snapshot.baseName,
      version: snapshot.version,
      snapshot_data: JSON.stringify(snapshot),
      created_at: snapshot.createdAt,
    };
  }

  private deserializeSnapshot(row: unknown): SavedHandshakeSnapshot {
    const data = row as Record<string, unknown>;
    return typeof data.snapshot_data === 'string'
      ? JSON.parse(data.snapshot_data)
      : data.snapshot_data as SavedHandshakeSnapshot;
  }
}

export default SupabaseProvider;
