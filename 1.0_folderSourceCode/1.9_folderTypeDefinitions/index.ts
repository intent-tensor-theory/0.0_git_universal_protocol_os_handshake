// ============================================
// PROTOCOL OS - TYPE DEFINITIONS INDEX
// ============================================
// Address: 1.9
// Purpose: Export all type definitions
// ============================================

// Core Types
export * from './1.9.a_fileCoreTypeDefinitions';

// Platform Types
export * from './1.9.b_filePlatformTypeDefinitions';

// Resource Types
export * from './1.9.c_fileResourceTypeDefinitions';

// Authentication Config Types
export * from './1.9.d_fileAuthenticationConfigTypeDefinitions';

// cURL Request Types
export * from './1.9.e_fileCurlRequestTypeDefinitions';

// Handshake Types
export * from './1.9.f_fileHandshakeTypeDefinitions';

// Saved Handshake Types
export * from './1.9.g_fileSavedHandshakeTypeDefinitions';

// Execution Result Types
export * from './1.9.h_fileExecutionResultTypeDefinitions';

/**
 * Re-export commonly used types for convenience
 */
export type {
  // Core
  EntityId,
  HttpMethod,
  HttpHeaders,
  JsonValue,
  ApiResponse,
  Result,
  ValidationResult,
  
  // Platform
  Platform,
  PlatformCreateInput,
  PlatformUpdateInput,
  PlatformSummary,
  
  // Resource
  Resource,
  ResourceCreateInput,
  ResourceSummary,
  
  // Handshake
  Handshake,
  HandshakeCreateInput,
  HandshakeSummary,
  ProtocolType,
  ProtocolCategory,
  ProtocolMetadata,
  
  // cURL
  CurlRequest,
  ParsedCurlCommand,
  
  // Saved Handshake
  SavedHandshake,
  SavedHandshakeSummary,
  
  // Execution
  ExecutionLogEntry,
  LogLevel,
  HandshakeExecutionResult,
  RequestExecutionResult,
  ExecutionMetrics,
  ConfigurationValidationResult,
  ConnectionTestResult,
  AuthenticationResult,
} from './1.9.h_fileExecutionResultTypeDefinitions';
