// ============================================
// PROTOCOL OS - FIREBASE FIRESTORE RULES
// ============================================
// Address: 1.2.3.b
// Purpose: Security rules for Firebase Firestore collections
// ============================================

// Copy these rules to your Firebase Console:
// Firebase Console > Firestore > Rules

/*
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
    
    // Check if user owns the document (if applicable)
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Validate timestamp is recent (within 5 minutes)
    function isRecentTimestamp(timestamp) {
      return timestamp > request.time - duration.value(5, 'm');
    }
    
    // ============================================
    // PLATFORMS COLLECTION
    // ============================================
    
    match /protocol_os_platforms/{platformId} {
      // Allow read for anyone (change to isAuthenticated() for private apps)
      allow read: if true;
      
      // Allow create for authenticated users
      allow create: if isAuthenticated()
        && request.resource.data.name is string
        && request.resource.data.serial is string;
      
      // Allow update for authenticated users
      allow update: if isAuthenticated()
        && request.resource.data.name is string;
      
      // Allow delete for authenticated users
      allow delete: if isAuthenticated();
    }
    
    // ============================================
    // SAVED HANDSHAKES COLLECTION
    // ============================================
    
    match /protocol_os_saved_handshakes/{handshakeId} {
      // Allow read for anyone (change to isAuthenticated() for private apps)
      allow read: if true;
      
      // Allow create for authenticated users
      allow create: if isAuthenticated()
        && request.resource.data.baseName is string
        && request.resource.data.version is string;
      
      // Allow update for authenticated users
      allow update: if isAuthenticated();
      
      // Allow delete for authenticated users
      allow delete: if isAuthenticated();
    }
    
    // ============================================
    // DENY ALL OTHER ACCESS
    // ============================================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
*/

/**
 * Firestore Indexes
 * 
 * Add these composite indexes in Firebase Console:
 * Firebase Console > Firestore > Indexes
 * 
 * 1. protocol_os_platforms
 *    - Fields: isMaster (Ascending), name (Ascending)
 *    - Query scope: Collection
 * 
 * 2. protocol_os_saved_handshakes
 *    - Fields: baseName (Ascending), createdAt (Descending)
 *    - Query scope: Collection
 */

export const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /protocol_os_platforms/{platformId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    
    match /protocol_os_saved_handshakes/{handshakeId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

/**
 * Firestore index configuration
 */
export const FIRESTORE_INDEXES = {
  indexes: [
    {
      collectionGroup: 'protocol_os_platforms',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'isMaster', order: 'ASCENDING' },
        { fieldPath: 'name', order: 'ASCENDING' },
      ],
    },
    {
      collectionGroup: 'protocol_os_saved_handshakes',
      queryScope: 'COLLECTION',
      fields: [
        { fieldPath: 'baseName', order: 'ASCENDING' },
        { fieldPath: 'createdAt', order: 'DESCENDING' },
      ],
    },
  ],
  fieldOverrides: [],
};

export default FIRESTORE_RULES;
