// ============================================
// PROTOCOL OS - FIREBASE PROVIDER IMPLEMENTATION
// ============================================
// Address: 1.2.3.a
// Purpose: Firebase Firestore persistence provider
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
 * Firebase app and Firestore types (lazy loaded)
 */
type FirebaseApp = unknown;
type Firestore = unknown;

/**
 * Firebase Provider
 * 
 * Cloud-based persistence using Firebase Firestore.
 * Provides realtime sync and offline support.
 * 
 * Configuration required:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 * 
 * Features:
 * - Realtime synchronization
 * - Offline persistence
 * - Automatic scaling
 * - Cross-platform support
 */
export class FirebaseProvider implements DatabaseProvider {
  readonly identifier = 'firebase' as const;
  readonly displayName = 'Firebase Firestore';
  readonly requiresConfiguration = true;

  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private isInitialized = false;

  // Collection names
  private readonly COLLECTIONS = {
    PLATFORMS: 'protocol_os_platforms',
    SAVED_HANDSHAKES: 'protocol_os_saved_handshakes',
  } as const;

  // ============================================
  // INITIALIZATION
  // ============================================

  async checkConfiguration(): Promise<ProviderConfigurationStatus> {
    const missingFields: string[] = [];
    
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!import.meta.env?.[envVar]) {
        missingFields.push(envVar);
      }
    }
    
    if (missingFields.length > 0) {
      return {
        isConfigured: false,
        isConnected: false,
        missingFields,
        errorMessage: 'Missing required environment variables',
      };
    }
    
    return {
      isConfigured: true,
      isConnected: true, // Firebase connects on first operation
      missingFields: [],
    };
  }

  async initialize(): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const config = this.getFirebaseConfig();
      
      // Dynamic import to avoid bundling Firebase when not used
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, enableIndexedDbPersistence } = await import('firebase/firestore');
      
      // Initialize only if no app exists
      const existingApps = getApps();
      this.app = existingApps.length > 0 
        ? existingApps[0] 
        : initializeApp(config);
      
      this.db = getFirestore(this.app as never);
      
      // Enable offline persistence (may fail in some environments)
      try {
        await enableIndexedDbPersistence(this.db as never);
        console.log('[Firebase] Offline persistence enabled');
      } catch (err) {
        console.warn('[Firebase] Offline persistence not available:', err);
      }
      
      this.isInitialized = true;
      console.log('[Firebase] Provider initialized');
    }, 'initialize');
  }

  async disconnect(): Promise<DatabaseOperationResult> {
    this.app = null;
    this.db = null;
    this.isInitialized = false;
    return createSuccessResult();
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  private getFirebaseConfig() {
    return {
      apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env?.VITE_FIREBASE_APP_ID,
    };
  }

  // ============================================
  // PLATFORM OPERATIONS
  // ============================================

  async getAllPlatforms(): Promise<DatabaseOperationResult<Platform[]>> {
    return wrapDatabaseOperation(async () => {
      const { collection, getDocs } = await import('firebase/firestore');
      
      const querySnapshot = await getDocs(
        collection(this.db as never, this.COLLECTIONS.PLATFORMS)
      );
      
      const platforms: Platform[] = [];
      querySnapshot.forEach((doc) => {
        platforms.push({ id: doc.id, ...doc.data() } as Platform);
      });
      
      return platforms;
    }, 'getAllPlatforms');
  }

  async getPlatformById(id: string): Promise<DatabaseOperationResult<Platform | null>> {
    return wrapDatabaseOperation(async () => {
      const { doc, getDoc } = await import('firebase/firestore');
      
      const docRef = doc(this.db as never, this.COLLECTIONS.PLATFORMS, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Platform;
      }
      
      return null;
    }, 'getPlatformById');
  }

  async createPlatform(platform: Platform): Promise<DatabaseOperationResult<Platform>> {
    return wrapDatabaseOperation(async () => {
      const { doc, setDoc } = await import('firebase/firestore');
      
      const docRef = doc(this.db as never, this.COLLECTIONS.PLATFORMS, platform.id);
      await setDoc(docRef, {
        ...platform,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`[Firebase] Created platform: ${platform.name}`);
      return platform;
    }, 'createPlatform');
  }

  async updatePlatform(id: string, updates: Partial<Platform>): Promise<DatabaseOperationResult<Platform>> {
    return wrapDatabaseOperation(async () => {
      const { doc, updateDoc, getDoc } = await import('firebase/firestore');
      
      const docRef = doc(this.db as never, this.COLLECTIONS.PLATFORMS, id);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      
      const updatedDoc = await getDoc(docRef);
      
      if (!updatedDoc.exists()) {
        throw new Error('Platform not found after update');
      }
      
      console.log(`[Firebase] Updated platform: ${id}`);
      return { id: updatedDoc.id, ...updatedDoc.data() } as Platform;
    }, 'updatePlatform');
  }

  async deletePlatform(id: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const { doc, deleteDoc } = await import('firebase/firestore');
      
      const docRef = doc(this.db as never, this.COLLECTIONS.PLATFORMS, id);
      await deleteDoc(docRef);
      
      console.log(`[Firebase] Deleted platform: ${id}`);
    }, 'deletePlatform');
  }

  // ============================================
  // SAVED HANDSHAKES OPERATIONS
  // ============================================

  async getAllSavedHandshakes(): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>> {
    return wrapDatabaseOperation(async () => {
      const { collection, getDocs } = await import('firebase/firestore');
      
      const querySnapshot = await getDocs(
        collection(this.db as never, this.COLLECTIONS.SAVED_HANDSHAKES)
      );
      
      const snapshots: SavedHandshakeSnapshot[] = [];
      querySnapshot.forEach((doc) => {
        snapshots.push({ id: doc.id, ...doc.data() } as SavedHandshakeSnapshot);
      });
      
      return snapshots;
    }, 'getAllSavedHandshakes');
  }

  async getSavedHandshakesByBaseName(baseName: string): Promise<DatabaseOperationResult<SavedHandshakeSnapshot[]>> {
    return wrapDatabaseOperation(async () => {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const q = query(
        collection(this.db as never, this.COLLECTIONS.SAVED_HANDSHAKES),
        where('baseName', '==', baseName)
      );
      
      const querySnapshot = await getDocs(q);
      
      const snapshots: SavedHandshakeSnapshot[] = [];
      querySnapshot.forEach((doc) => {
        snapshots.push({ id: doc.id, ...doc.data() } as SavedHandshakeSnapshot);
      });
      
      return snapshots;
    }, 'getSavedHandshakesByBaseName');
  }

  async saveHandshakeSnapshot(snapshot: SavedHandshakeSnapshot): Promise<DatabaseOperationResult<SavedHandshakeSnapshot>> {
    return wrapDatabaseOperation(async () => {
      const { doc, setDoc } = await import('firebase/firestore');
      
      const docRef = doc(this.db as never, this.COLLECTIONS.SAVED_HANDSHAKES, snapshot.id);
      await setDoc(docRef, snapshot, { merge: true });
      
      console.log(`[Firebase] Saved handshake snapshot: ${snapshot.baseName}`);
      return snapshot;
    }, 'saveHandshakeSnapshot');
  }

  async deleteSavedHandshake(id: string): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const { doc, deleteDoc } = await import('firebase/firestore');
      
      const docRef = doc(this.db as never, this.COLLECTIONS.SAVED_HANDSHAKES, id);
      await deleteDoc(docRef);
      
      console.log(`[Firebase] Deleted saved handshake: ${id}`);
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
      
      // Import platforms
      for (const platform of platforms) {
        await this.createPlatform(platform);
      }
      
      // Import saved handshakes
      for (const snapshot of savedHandshakes) {
        await this.saveHandshakeSnapshot(snapshot);
      }
      
      console.log(`[Firebase] Imported ${platforms.length} platforms, ${savedHandshakes.length} saved handshakes`);
    }, 'importAllData');
  }

  async clearAllData(): Promise<DatabaseOperationResult> {
    return wrapDatabaseOperation(async () => {
      const { collection, getDocs, deleteDoc, doc } = await import('firebase/firestore');
      
      // Delete all platforms
      const platformsSnapshot = await getDocs(
        collection(this.db as never, this.COLLECTIONS.PLATFORMS)
      );
      for (const docSnap of platformsSnapshot.docs) {
        await deleteDoc(doc(this.db as never, this.COLLECTIONS.PLATFORMS, docSnap.id));
      }
      
      // Delete all saved handshakes
      const handshakesSnapshot = await getDocs(
        collection(this.db as never, this.COLLECTIONS.SAVED_HANDSHAKES)
      );
      for (const docSnap of handshakesSnapshot.docs) {
        await deleteDoc(doc(this.db as never, this.COLLECTIONS.SAVED_HANDSHAKES, docSnap.id));
      }
      
      console.log('[Firebase] All data cleared');
    }, 'clearAllData');
  }
}

export default FirebaseProvider;
