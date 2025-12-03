// ============================================
// PROTOCOL OS - FEATURE COMPONENTS INDEX
// ============================================
// Address: 1.6.a
// Purpose: Central export for all feature components
// ============================================

// ----------------------------------------
// Platform Accordion
// ----------------------------------------
export { 
  PlatformAccordion, 
  default as PlatformAccordionDefault 
} from './1.6.1_folderPlatformAccordion/1.6.1.a_filePlatformAccordionComponent';

// ----------------------------------------
// Resource Accordion
// ----------------------------------------
export { 
  ResourceAccordion, 
  default as ResourceAccordionDefault 
} from './1.6.2_folderResourceAccordion/1.6.2.a_fileResourceAccordionComponent';

// ----------------------------------------
// Handshake Accordion
// ----------------------------------------
export { 
  HandshakeAccordion, 
  default as HandshakeAccordionDefault 
} from './1.6.3_folderHandshakeAccordion/1.6.3.a_fileHandshakeAccordionComponent';

// ----------------------------------------
// Execution Panel
// ----------------------------------------
export { 
  ExecutionPanel, 
  default as ExecutionPanelDefault 
} from './1.6.4_folderExecutionPanel/1.6.4.a_fileExecutionPanelComponent';

// ----------------------------------------
// Re-export types for convenience
// ----------------------------------------
export type { Platform, Resource, Handshake, CurlRequest } from '@types/1.9.c_filePlatformTypeDefinitions';
