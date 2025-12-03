// ============================================
// PROTOCOL OS - PROTOCOL REGISTRY HOOK
// ============================================
// Address: 1.3.c
// Purpose: React hook for accessing protocol handlers
// ============================================

import { useMemo, useCallback } from 'react';
import type { ProtocolType } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { Handshake } from '@types/1.9.c_fileHandshakeTypeDefinitions';
import type { ProtocolHandler, HandshakeExecutionOptions } from './1.3.a_fileProtocolHandlerInterface';
import {
  protocolRegistry,
  PROTOCOL_METADATA,
  type ProtocolMetadata,
} from './1.3.b_fileProtocolHandlerRegistry';

/**
 * Return type for useProtocolRegistry hook
 */
export interface UseProtocolRegistryReturn {
  /**
   * Get a handler by protocol type
   */
  getHandler: (protocolType: ProtocolType) => ProtocolHandler | undefined;

  /**
   * Get all available protocol types
   */
  availableProtocols: ProtocolType[];

  /**
   * Get all protocol metadata
   */
  protocolMetadata: Record<ProtocolType, ProtocolMetadata>;

  /**
   * Get protocols by category
   */
  getProtocolsByCategory: (category: ProtocolMetadata['category']) => ProtocolType[];

  /**
   * Get recommended protocol based on use case
   */
  recommendProtocol: (useCase: {
    hasUserContext?: boolean;
    isPublicClient?: boolean;
    needsRealtime?: boolean;
    isLegacyEnterprise?: boolean;
    hasApiKey?: boolean;
  }) => ProtocolType;

  /**
   * Search protocols by tag
   */
  searchByTag: (tag: string) => ProtocolType[];

  /**
   * Execute a handshake using the appropriate handler
   */
  executeHandshake: (
    handshake: Handshake,
    options?: HandshakeExecutionOptions
  ) => Promise<ReturnType<ProtocolHandler['executeHandshake']>>;

  /**
   * Validate handshake configuration
   */
  validateHandshake: (handshake: Handshake) => ReturnType<ProtocolHandler['validateConfiguration']>;

  /**
   * Test connection for a handshake
   */
  testConnection: (handshake: Handshake) => Promise<ReturnType<ProtocolHandler['testConnection']>>;
}

/**
 * React hook for accessing the protocol handler registry
 * 
 * Provides convenient access to protocol handlers, metadata,
 * and common operations like execution and validation.
 * 
 * @example
 * ```tsx
 * function HandshakeExecutor({ handshake }) {
 *   const {
 *     executeHandshake,
 *     validateHandshake,
 *     protocolMetadata,
 *   } = useProtocolRegistry();
 * 
 *   const metadata = protocolMetadata[handshake.authentication.type];
 *   const validation = validateHandshake(handshake);
 * 
 *   const handleExecute = async () => {
 *     const result = await executeHandshake(handshake, {
 *       onProgress: (stage, percent) => console.log(stage, percent),
 *     });
 *     console.log(result);
 *   };
 * 
 *   return (
 *     <div>
 *       <p>Protocol: {metadata.displayName}</p>
 *       <p>Valid: {validation.isValid ? 'Yes' : 'No'}</p>
 *       <button onClick={handleExecute}>Execute</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useProtocolRegistry(): UseProtocolRegistryReturn {
  // Memoize available protocols
  const availableProtocols = useMemo(() => {
    return protocolRegistry.getRegisteredTypes();
  }, []);

  // Get handler by type
  const getHandler = useCallback((protocolType: ProtocolType) => {
    return protocolRegistry.getHandler(protocolType);
  }, []);

  // Get protocols by category
  const getProtocolsByCategory = useCallback((category: ProtocolMetadata['category']) => {
    return Object.entries(PROTOCOL_METADATA)
      .filter(([_, meta]) => meta.category === category)
      .map(([type]) => type as ProtocolType);
  }, []);

  // Recommend protocol
  const recommendProtocol = useCallback((useCase: {
    hasUserContext?: boolean;
    isPublicClient?: boolean;
    needsRealtime?: boolean;
    isLegacyEnterprise?: boolean;
    hasApiKey?: boolean;
  }) => {
    return protocolRegistry.recommendProtocol(useCase);
  }, []);

  // Search by tag
  const searchByTag = useCallback((tag: string) => {
    return protocolRegistry.searchByTag(tag);
  }, []);

  // Execute handshake
  const executeHandshake = useCallback(async (
    handshake: Handshake,
    options?: HandshakeExecutionOptions
  ) => {
    const handler = protocolRegistry.getHandler(handshake.authentication.type);
    
    if (!handler) {
      throw new Error(`No handler for protocol: ${handshake.authentication.type}`);
    }

    return handler.executeHandshake(handshake, options);
  }, []);

  // Validate handshake
  const validateHandshake = useCallback((handshake: Handshake) => {
    const handler = protocolRegistry.getHandler(handshake.authentication.type);
    
    if (!handler) {
      return {
        isValid: false,
        missingFields: ['protocol handler'],
        invalidFields: [],
        warnings: [`Unknown protocol type: ${handshake.authentication.type}`],
      };
    }

    return handler.validateConfiguration(handshake.authentication);
  }, []);

  // Test connection
  const testConnection = useCallback(async (handshake: Handshake) => {
    const handler = protocolRegistry.getHandler(handshake.authentication.type);
    
    if (!handler) {
      return {
        success: false,
        message: `No handler for protocol: ${handshake.authentication.type}`,
      };
    }

    return handler.testConnection(handshake.authentication);
  }, []);

  return {
    getHandler,
    availableProtocols,
    protocolMetadata: PROTOCOL_METADATA,
    getProtocolsByCategory,
    recommendProtocol,
    searchByTag,
    executeHandshake,
    validateHandshake,
    testConnection,
  };
}

/**
 * Hook to get a specific protocol handler
 */
export function useProtocolHandler(protocolType: ProtocolType): {
  handler: ProtocolHandler | undefined;
  metadata: ProtocolMetadata | undefined;
  isAvailable: boolean;
} {
  const handler = useMemo(() => {
    return protocolRegistry.getHandler(protocolType);
  }, [protocolType]);

  const metadata = useMemo(() => {
    return PROTOCOL_METADATA[protocolType];
  }, [protocolType]);

  return {
    handler,
    metadata,
    isAvailable: !!handler,
  };
}

/**
 * Hook to get protocol options for a select/dropdown
 */
export function useProtocolOptions(): Array<{
  value: ProtocolType;
  label: string;
  description: string;
  category: ProtocolMetadata['category'];
  disabled?: boolean;
}> {
  return useMemo(() => {
    return Object.entries(PROTOCOL_METADATA).map(([type, meta]) => ({
      value: type as ProtocolType,
      label: meta.displayName,
      description: meta.description,
      category: meta.category,
      disabled: type === 'oauth-implicit', // Deprecated
    }));
  }, []);
}

/**
 * Hook for protocol selection with grouping
 */
export function useGroupedProtocolOptions(): Record<ProtocolMetadata['category'], Array<{
  value: ProtocolType;
  label: string;
  description: string;
}>> {
  return useMemo(() => {
    const grouped: Record<ProtocolMetadata['category'], Array<{
      value: ProtocolType;
      label: string;
      description: string;
    }>> = {
      oauth: [],
      'api-key': [],
      specialized: [],
      'no-auth': [],
    };

    Object.entries(PROTOCOL_METADATA).forEach(([type, meta]) => {
      grouped[meta.category].push({
        value: type as ProtocolType,
        label: meta.displayName,
        description: meta.description,
      });
    });

    return grouped;
  }, []);
}

export default useProtocolRegistry;
