// ============================================
// PROTOCOL OS - SOURCE CODE INDEX
// ============================================
// Address: 1.0
// Purpose: Central export hub for all source code modules
// ============================================

// ============================================
// THEME & STYLING (1.1)
// ============================================
export * from './1.1_folderThemeAndStyling';

// ============================================
// DATABASE PROVIDERS (1.2)
// ============================================
export * from './1.2_folderDatabaseProviders';

// ============================================
// PROTOCOL REGISTRY (1.3)
// ============================================
export * from './1.3_folderProtocolRegistry';

// ============================================
// PROTOCOL IMPLEMENTATIONS (1.4)
// ============================================
export * from './1.4_folderProtocolImplementations';

// ============================================
// CONTEXT STATE MANAGEMENT (1.5)
// ============================================
export * from './1.5_folderContextStateManagement';

// ============================================
// APPLICATION PAGES (1.6)
// ============================================
export * from './1.6_folderApplicationPages';

// ============================================
// UI COMPONENTS (1.7)
// ============================================
export * from './1.7_folderUiComponents';

// ============================================
// UTILITY FUNCTIONS (1.8)
// ============================================
export * from './1.8_folderUtilityFunctions';

// ============================================
// TYPE DEFINITIONS (1.9)
// ============================================
export * from './1.9_folderTypeDefinitions';

// ============================================
// MAIN APP COMPONENT
// ============================================
export { App, default } from './1.0.a_fileApp';

/**
 * Application version
 */
export const VERSION = '1.0.0';

/**
 * Build timestamp
 */
export const BUILD_TIME = new Date().toISOString();

/**
 * Application metadata
 */
export const APP_METADATA = {
  name: 'Protocol OS',
  version: VERSION,
  description: 'Universal API Handshake System',
  author: 'Intent Tensor Theory Institute',
  repository: 'https://github.com/intent-tensor-theory/0.0_git_universal_protocol_os_handshake',
} as const;
