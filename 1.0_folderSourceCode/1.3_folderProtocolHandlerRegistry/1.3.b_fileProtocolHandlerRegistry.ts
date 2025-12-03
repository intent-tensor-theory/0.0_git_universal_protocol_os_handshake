// ============================================
// PROTOCOL OS - PROTOCOL HANDLER REGISTRY
// ============================================
// Address: 1.3.b
// Purpose: Central registry for all protocol handlers
// ============================================

import type { ProtocolType } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { ProtocolHandler } from './1.3.a_fileProtocolHandlerInterface';

// Import all protocol handlers
// These will be implemented in the 1.4_folderProtocolImplementations
import { CurlDefaultHandler } from '../1.4_folderProtocolImplementations/1.4.1_folderCurlDefaultProtocol/1.4.1.a_fileCurlDefaultHandler';
import { OAuthPkceHandler } from '../1.4_folderProtocolImplementations/1.4.2_folderOAuthPkceProtocol/1.4.2.a_fileOAuthPkceHandler';
import { OAuthAuthCodeHandler } from '../1.4_folderProtocolImplementations/1.4.3_folderOAuthAuthCodeProtocol/1.4.3.a_fileOAuthAuthCodeHandler';
import { OAuthImplicitHandler } from '../1.4_folderProtocolImplementations/1.4.4_folderOAuthImplicitProtocol/1.4.4.a_fileOAuthImplicitHandler';
import { ClientCredentialsHandler } from '../1.4_folderProtocolImplementations/1.4.5_folderClientCredentialsProtocol/1.4.5.a_fileClientCredentialsHandler';
import { RestApiKeyHandler } from '../1.4_folderProtocolImplementations/1.4.6_folderRestApiKeyProtocol/1.4.6.a_fileRestApiKeyHandler';
import { GraphqlHandler } from '../1.4_folderProtocolImplementations/1.4.7_folderGraphqlProtocol/1.4.7.a_fileGraphqlHandler';
import { WebsocketHandler } from '../1.4_folderProtocolImplementations/1.4.8_folderWebsocketProtocol/1.4.8.a_fileWebsocketHandler';
import { SoapXmlHandler } from '../1.4_folderProtocolImplementations/1.4.9_folderSoapXmlProtocol/1.4.9.a_fileSoapXmlHandler';
import { GithubRepoRunnerHandler } from '../1.4_folderProtocolImplementations/1.4.10_folderGithubRepoRunnerProtocol/1.4.10.a_fileGithubRepoRunnerHandler';
import { KeylessScraperHandler } from '../1.4_folderProtocolImplementations/1.4.11_folderKeylessScraperProtocol/1.4.11.a_fileKeylessScraperHandler';

/**
 * Protocol metadata for UI display and organization
 */
export interface ProtocolMetadata {
  type: ProtocolType;
  displayName: string;
  description: string;
  category: 'oauth' | 'api-key' | 'specialized' | 'no-auth';
  complexity: 'simple' | 'moderate' | 'complex';
  iconId: string;
  documentationUrl: string;
  tags: string[];
}

/**
 * Protocol metadata registry
 */
export const PROTOCOL_METADATA: Record<ProtocolType, ProtocolMetadata> = {
  'curl-default': {
    type: 'curl-default',
    displayName: 'cURL Default',
    description: 'Direct cURL command execution with manual authentication',
    category: 'no-auth',
    complexity: 'simple',
    iconId: 'terminal',
    documentationUrl: 'https://curl.se/docs/',
    tags: ['basic', 'manual', 'flexible'],
  },
  'oauth-pkce': {
    type: 'oauth-pkce',
    displayName: 'OAuth 2.0 PKCE',
    description: 'Secure OAuth flow for public clients (SPAs, mobile apps)',
    category: 'oauth',
    complexity: 'complex',
    iconId: 'shield-check',
    documentationUrl: 'https://oauth.net/2/pkce/',
    tags: ['secure', 'spa', 'mobile', 'no-secret'],
  },
  'oauth-auth-code': {
    type: 'oauth-auth-code',
    displayName: 'OAuth 2.0 Auth Code',
    description: 'Standard OAuth flow with client secret for server-side apps',
    category: 'oauth',
    complexity: 'complex',
    iconId: 'key',
    documentationUrl: 'https://oauth.net/2/grant-types/authorization-code/',
    tags: ['server-side', 'confidential', 'standard'],
  },
  'oauth-implicit': {
    type: 'oauth-implicit',
    displayName: 'OAuth 2.0 Implicit',
    description: 'Legacy OAuth flow (deprecated, use PKCE instead)',
    category: 'oauth',
    complexity: 'moderate',
    iconId: 'alert-triangle',
    documentationUrl: 'https://oauth.net/2/grant-types/implicit/',
    tags: ['legacy', 'deprecated', 'spa'],
  },
  'client-credentials': {
    type: 'client-credentials',
    displayName: 'Client Credentials',
    description: 'Machine-to-machine authentication without user context',
    category: 'oauth',
    complexity: 'moderate',
    iconId: 'server',
    documentationUrl: 'https://oauth.net/2/grant-types/client-credentials/',
    tags: ['m2m', 'backend', 'service-account'],
  },
  'rest-api-key': {
    type: 'rest-api-key',
    displayName: 'REST API Key',
    description: 'Simple API key authentication in header, query, or body',
    category: 'api-key',
    complexity: 'simple',
    iconId: 'key-round',
    documentationUrl: '',
    tags: ['simple', 'api-key', 'header'],
  },
  'graphql': {
    type: 'graphql',
    displayName: 'GraphQL',
    description: 'GraphQL API with query/mutation support',
    category: 'specialized',
    complexity: 'moderate',
    iconId: 'hexagon',
    documentationUrl: 'https://graphql.org/',
    tags: ['graphql', 'query', 'mutation'],
  },
  'websocket': {
    type: 'websocket',
    displayName: 'WebSocket',
    description: 'Real-time bidirectional communication',
    category: 'specialized',
    complexity: 'complex',
    iconId: 'radio',
    documentationUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSocket',
    tags: ['realtime', 'bidirectional', 'streaming'],
  },
  'soap-xml': {
    type: 'soap-xml',
    displayName: 'SOAP/XML',
    description: 'Enterprise SOAP web services with XML',
    category: 'specialized',
    complexity: 'complex',
    iconId: 'file-code',
    documentationUrl: 'https://www.w3.org/TR/soap/',
    tags: ['enterprise', 'legacy', 'xml', 'wsdl'],
  },
  'github-repo-runner': {
    type: 'github-repo-runner',
    displayName: 'GitHub Repo Runner',
    description: 'Clone and execute scripts from GitHub repositories',
    category: 'specialized',
    complexity: 'complex',
    iconId: 'github',
    documentationUrl: 'https://docs.github.com/en/rest',
    tags: ['github', 'automation', 'scripts'],
  },
  'keyless-scraper': {
    type: 'keyless-scraper',
    displayName: 'Keyless Scraper',
    description: 'Web scraping without authentication',
    category: 'no-auth',
    complexity: 'moderate',
    iconId: 'globe',
    documentationUrl: '',
    tags: ['scraping', 'public', 'no-auth'],
  },
};

/**
 * Protocol Handler Registry
 * 
 * Central registry that manages all protocol handler instances.
 * Provides factory methods for getting handlers by protocol type.
 */
class ProtocolHandlerRegistry {
  private handlers: Map<ProtocolType, ProtocolHandler> = new Map();
  private initialized = false;

  /**
   * Initialize the registry with all protocol handlers
   */
  initialize(): void {
    if (this.initialized) return;

    // Register all handlers
    this.register(new CurlDefaultHandler());
    this.register(new OAuthPkceHandler());
    this.register(new OAuthAuthCodeHandler());
    this.register(new OAuthImplicitHandler());
    this.register(new ClientCredentialsHandler());
    this.register(new RestApiKeyHandler());
    this.register(new GraphqlHandler());
    this.register(new WebsocketHandler());
    this.register(new SoapXmlHandler());
    this.register(new GithubRepoRunnerHandler());
    this.register(new KeylessScraperHandler());

    this.initialized = true;
    console.log(`[ProtocolRegistry] Initialized with ${this.handlers.size} handlers`);
  }

  /**
   * Register a protocol handler
   */
  register(handler: ProtocolHandler): void {
    if (this.handlers.has(handler.protocolType)) {
      console.warn(`[ProtocolRegistry] Overwriting handler for ${handler.protocolType}`);
    }
    this.handlers.set(handler.protocolType, handler);
  }

  /**
   * Get a handler by protocol type
   */
  getHandler(protocolType: ProtocolType): ProtocolHandler | undefined {
    if (!this.initialized) {
      this.initialize();
    }
    return this.handlers.get(protocolType);
  }

  /**
   * Get a handler by protocol type, throwing if not found
   */
  getHandlerOrThrow(protocolType: ProtocolType): ProtocolHandler {
    const handler = this.getHandler(protocolType);
    if (!handler) {
      throw new Error(`No handler registered for protocol: ${protocolType}`);
    }
    return handler;
  }

  /**
   * Check if a handler is registered for a protocol type
   */
  hasHandler(protocolType: ProtocolType): boolean {
    return this.handlers.has(protocolType);
  }

  /**
   * Get all registered protocol types
   */
  getRegisteredTypes(): ProtocolType[] {
    if (!this.initialized) {
      this.initialize();
    }
    return Array.from(this.handlers.keys());
  }

  /**
   * Get all registered handlers
   */
  getAllHandlers(): ProtocolHandler[] {
    if (!this.initialized) {
      this.initialize();
    }
    return Array.from(this.handlers.values());
  }

  /**
   * Get handlers filtered by category
   */
  getHandlersByCategory(category: ProtocolMetadata['category']): ProtocolHandler[] {
    return this.getAllHandlers().filter(
      handler => PROTOCOL_METADATA[handler.protocolType]?.category === category
    );
  }

  /**
   * Get handlers filtered by complexity
   */
  getHandlersByComplexity(complexity: ProtocolMetadata['complexity']): ProtocolHandler[] {
    return this.getAllHandlers().filter(
      handler => PROTOCOL_METADATA[handler.protocolType]?.complexity === complexity
    );
  }

  /**
   * Get metadata for a protocol type
   */
  getMetadata(protocolType: ProtocolType): ProtocolMetadata | undefined {
    return PROTOCOL_METADATA[protocolType];
  }

  /**
   * Search protocols by tag
   */
  searchByTag(tag: string): ProtocolType[] {
    const lowerTag = tag.toLowerCase();
    return Object.entries(PROTOCOL_METADATA)
      .filter(([_, meta]) => meta.tags.some(t => t.toLowerCase().includes(lowerTag)))
      .map(([type]) => type as ProtocolType);
  }

  /**
   * Get recommended protocol for a use case
   */
  recommendProtocol(useCase: {
    hasUserContext?: boolean;
    isPublicClient?: boolean;
    needsRealtime?: boolean;
    isLegacyEnterprise?: boolean;
    hasApiKey?: boolean;
  }): ProtocolType {
    if (useCase.needsRealtime) return 'websocket';
    if (useCase.isLegacyEnterprise) return 'soap-xml';
    if (useCase.hasApiKey) return 'rest-api-key';
    if (!useCase.hasUserContext) return 'client-credentials';
    if (useCase.isPublicClient) return 'oauth-pkce';
    return 'oauth-auth-code';
  }
}

// Singleton instance
export const protocolRegistry = new ProtocolHandlerRegistry();

/**
 * Helper function to get a protocol handler
 */
export function getProtocolHandler(protocolType: ProtocolType): ProtocolHandler | undefined {
  return protocolRegistry.getHandler(protocolType);
}

/**
 * Helper function to get a protocol handler or throw
 */
export function getProtocolHandlerOrThrow(protocolType: ProtocolType): ProtocolHandler {
  return protocolRegistry.getHandlerOrThrow(protocolType);
}

export default protocolRegistry;
