// ============================================
// PROTOCOL OS - FIREBASE CLIENT CONFIGURATION
// ============================================
// Address: 1.2.3.b
// Purpose: Firebase app factory and configuration
// ============================================

import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';

/**
 * Firebase app instance type
 */
export type FirebaseAppInstance = FirebaseApp;

/**
 * Firebase configuration options
 */
export interface FirebaseConfig extends FirebaseOptions {
  apiKey: string;
  projectId: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

/**
 * Create a configured Firebase app
 * 
 * @param config - Firebase configuration
 * @returns Configured Firebase app instance
 * 
 * @example
 * ```ts
 * const app = createFirebaseApp({
 *   apiKey: 'AIza...',
 *   projectId: 'my-project',
 *   authDomain: 'my-project.firebaseapp.com',
 * });
 * ```
 */
export function createFirebaseApp(config: FirebaseConfig): FirebaseAppInstance {
  return initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain ?? `${config.projectId}.firebaseapp.com`,
    projectId: config.projectId,
    storageBucket: config.storageBucket ?? `${config.projectId}.appspot.com`,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
    measurementId: config.measurementId,
  });
}

/**
 * Firestore Security Rules for Protocol OS
 * 
 * Copy these rules to your Firebase Console → Firestore → Rules
 */
export const FIRESTORE_SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Validate timestamp fields
    function hasValidTimestamps() {
      return request.resource.data.createdAt is timestamp
        && request.resource.data.updatedAt is timestamp;
    }
    
    // ============================================
    // PLATFORMS COLLECTION
    // ============================================
    match /platforms/{platformId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && request.resource.data.keys().hasAll(['serial', 'name']);
      allow update: if isAuthenticated()
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['name', 'url', 'contributors', 'isArchived', 'updatedAt']);
      allow delete: if isAuthenticated();
    }
    
    // ============================================
    // RESOURCES COLLECTION
    // ============================================
    match /resources/{resourceId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && request.resource.data.keys().hasAll(['serial', 'platformId', 'title']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // ============================================
    // HANDSHAKES COLLECTION
    // ============================================
    match /handshakes/{handshakeId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && request.resource.data.keys().hasAll(['serial', 'resourceId', 'title', 'protocolType']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // ============================================
    // CURL REQUESTS COLLECTION
    // ============================================
    match /curlRequests/{requestId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && request.resource.data.keys().hasAll(['serial', 'handshakeId', 'title', 'commandTemplate']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // ============================================
    // SCHEMA MODELS COLLECTION
    // ============================================
    match /schemaModels/{modelId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && request.resource.data.keys().hasAll(['serial', 'handshakeId', 'title', 'jsonSchema']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // ============================================
    // PROMOTED ACTIONS COLLECTION
    // ============================================
    match /promotedActions/{actionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && request.resource.data.keys().hasAll(['serial', 'handshakeId', 'title', 'triggerType']);
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // ============================================
    // EXECUTION LOGS COLLECTION
    // ============================================
    match /executionLogs/{logId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated()
        && request.resource.data.keys().hasAll(['handshakeId', 'success']);
      allow delete: if isAuthenticated();
      // Logs should not be updated
      allow update: if false;
    }
    
    // ============================================
    // USER SETTINGS COLLECTION
    // ============================================
    match /userSettings/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
  }
}
`;

/**
 * Firestore Indexes for Protocol OS
 * 
 * Create these indexes in Firebase Console or via firebase.json
 */
export const FIRESTORE_INDEXES = {
  indexes: [
    {
      collectionGroup: 'resources',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'platformId', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
    {
      collectionGroup: 'handshakes',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'resourceId', order: 'ASCENDING' },
        { fieldPath: 'status', order: 'ASCENDING' },
      ],
    },
    {
      collectionGroup: 'executionLogs',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'handshakeId', order: 'ASCENDING' },
        { fieldPath: 'timestamp', order: 'DESCENDING' },
      ],
    },
  ],
};

/**
 * Validate Firebase configuration
 */
export function validateFirebaseConfig(config: Partial<FirebaseConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('Firebase API key is required');
  } else if (!config.apiKey.startsWith('AIza')) {
    errors.push('Invalid Firebase API key format');
  }

  if (!config.projectId) {
    errors.push('Firebase project ID is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get Firebase Emulator configuration for local development
 */
export function getEmulatorConfig(): {
  host: string;
  firestorePort: number;
  authPort: number;
} {
  return {
    host: 'localhost',
    firestorePort: 8080,
    authPort: 9099,
  };
}
