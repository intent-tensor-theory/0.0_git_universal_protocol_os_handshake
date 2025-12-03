// ============================================
// PROTOCOL OS - ACTIVE DATABASE PROVIDER TOGGLE
// ============================================
// Address: 1.2.b
// Purpose: Single-point configuration for selecting the active database provider
// ============================================

import type { DatabaseProviderIdentifier } from './1.2.a_fileDatabaseProviderInterface';

/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║                    ACTIVE DATABASE PROVIDER                        ║
 * ╠════════════════════════════════════════════════════════════════════╣
 * ║  Change this ONE line to switch database providers.                ║
 * ║                                                                    ║
 * ║  Options:                                                          ║
 * ║    'localStorage'  - Browser storage (default, no config needed)  ║
 * ║    'supabase'      - Supabase cloud database                       ║
 * ║    'firebase'      - Firebase Firestore                            ║
 * ║    'postgresql'    - PostgreSQL (requires backend proxy)          ║
 * ║    'sqlite'        - SQLite (requires backend service)            ║
 * ║                                                                    ║
 * ║  After changing, ensure the corresponding environment variables   ║
 * ║  are configured in your .env file.                                 ║
 * ╚════════════════════════════════════════════════════════════════════╝
 */
export const ACTIVE_DATABASE_PROVIDER: DatabaseProviderIdentifier = 'localStorage';

/**
 * Provider display information for UI
 */
export const DATABASE_PROVIDER_INFO: Record<DatabaseProviderIdentifier, {
  displayName: string;
  description: string;
  requiresBackend: boolean;
  documentationUrl: string;
}> = {
  localStorage: {
    displayName: 'Browser Local Storage',
    description: 'Data persists in your browser. No external service needed. Data is lost if browser storage is cleared.',
    requiresBackend: false,
    documentationUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage',
  },
  supabase: {
    displayName: 'Supabase',
    description: 'Open-source Firebase alternative. Provides PostgreSQL database with realtime subscriptions.',
    requiresBackend: false,
    documentationUrl: 'https://supabase.com/docs',
  },
  firebase: {
    displayName: 'Firebase Firestore',
    description: 'Google\'s NoSQL cloud database. Provides realtime sync and offline support.',
    requiresBackend: false,
    documentationUrl: 'https://firebase.google.com/docs/firestore',
  },
  postgresql: {
    displayName: 'PostgreSQL',
    description: 'Powerful open-source relational database. Requires a backend proxy service for web apps.',
    requiresBackend: true,
    documentationUrl: 'https://www.postgresql.org/docs/',
  },
  sqlite: {
    displayName: 'SQLite',
    description: 'Lightweight file-based database. Requires a backend service for web apps.',
    requiresBackend: true,
    documentationUrl: 'https://www.sqlite.org/docs.html',
  },
};

/**
 * Check if the active provider can be read from environment variable
 * Falls back to the hardcoded value if not set
 */
export function getActiveProvider(): DatabaseProviderIdentifier {
  // Check for environment variable override
  const envProvider = import.meta.env?.VITE_ACTIVE_DATABASE_PROVIDER;
  
  if (envProvider && isValidProvider(envProvider)) {
    return envProvider as DatabaseProviderIdentifier;
  }
  
  return ACTIVE_DATABASE_PROVIDER;
}

/**
 * Validate if a string is a valid provider identifier
 */
export function isValidProvider(provider: string): boolean {
  return [
    'localStorage',
    'supabase',
    'firebase',
    'postgresql',
    'sqlite',
  ].includes(provider);
}

/**
 * Get info about the currently active provider
 */
export function getActiveProviderInfo() {
  const provider = getActiveProvider();
  return {
    identifier: provider,
    ...DATABASE_PROVIDER_INFO[provider],
  };
}

/**
 * Check if a provider is available (has required dependencies)
 */
export async function checkProviderAvailability(
  provider: DatabaseProviderIdentifier
): Promise<{ available: boolean; reason?: string }> {
  switch (provider) {
    case 'localStorage':
      // Check if localStorage is available
      try {
        const testKey = '__protocol_os_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return { available: true };
      } catch {
        return { available: false, reason: 'localStorage is not available in this browser' };
      }

    case 'supabase':
      // Check if Supabase environment variables are set
      if (!import.meta.env?.VITE_SUPABASE_PROJECT_URL || !import.meta.env?.VITE_SUPABASE_ANON_KEY) {
        return { available: false, reason: 'Supabase configuration not found in environment' };
      }
      return { available: true };

    case 'firebase':
      // Check if Firebase environment variables are set
      if (!import.meta.env?.VITE_FIREBASE_API_KEY || !import.meta.env?.VITE_FIREBASE_PROJECT_ID) {
        return { available: false, reason: 'Firebase configuration not found in environment' };
      }
      return { available: true };

    case 'postgresql':
      if (!import.meta.env?.VITE_POSTGRESQL_CONNECTION_STRING) {
        return { available: false, reason: 'PostgreSQL connection string not found in environment' };
      }
      return { available: true };

    case 'sqlite':
      if (!import.meta.env?.VITE_SQLITE_DATABASE_PATH) {
        return { available: false, reason: 'SQLite database path not found in environment' };
      }
      return { available: true };

    default:
      return { available: false, reason: `Unknown provider: ${provider}` };
  }
}
