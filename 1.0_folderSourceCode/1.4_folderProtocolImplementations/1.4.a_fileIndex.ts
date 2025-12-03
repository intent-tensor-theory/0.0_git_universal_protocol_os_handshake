// ============================================
// PROTOCOL OS - PROTOCOL IMPLEMENTATIONS INDEX
// ============================================
// Address: 1.4.a
// Purpose: Central export for all protocol handlers
// ============================================

// ----------------------------------------
// cURL Default Protocol
// ----------------------------------------
export { CurlDefaultHandler, default as CurlDefaultHandlerDefault } from './1.4.1_folderCurlDefaultProtocol/1.4.1.a_fileCurlDefaultHandler';
export * from './1.4.1_folderCurlDefaultProtocol/1.4.1.b_fileCurlDefaultUtilities';

// ----------------------------------------
// OAuth PKCE Protocol
// ----------------------------------------
export { OAuthPkceHandler, default as OAuthPkceHandlerDefault } from './1.4.2_folderOAuthPkceProtocol/1.4.2.a_fileOAuthPkceHandler';
export * from './1.4.2_folderOAuthPkceProtocol/1.4.2.b_fileOAuthPkceUtilities';

// ----------------------------------------
// OAuth Authorization Code Protocol
// ----------------------------------------
export { OAuthAuthCodeHandler, default as OAuthAuthCodeHandlerDefault } from './1.4.3_folderOAuthAuthCodeProtocol/1.4.3.a_fileOAuthAuthCodeHandler';
export * from './1.4.3_folderOAuthAuthCodeProtocol/1.4.3.b_fileOAuthAuthCodeUtilities';

// ----------------------------------------
// OAuth Implicit Protocol (Deprecated)
// ----------------------------------------
export { OAuthImplicitHandler, default as OAuthImplicitHandlerDefault } from './1.4.4_folderOAuthImplicitProtocol/1.4.4.a_fileOAuthImplicitHandler';
export * from './1.4.4_folderOAuthImplicitProtocol/1.4.4.b_fileOAuthImplicitUtilities';

// ----------------------------------------
// Client Credentials Protocol
// ----------------------------------------
export { ClientCredentialsHandler, default as ClientCredentialsHandlerDefault } from './1.4.5_folderClientCredentialsProtocol/1.4.5.a_fileClientCredentialsHandler';
export * from './1.4.5_folderClientCredentialsProtocol/1.4.5.b_fileClientCredentialsUtilities';

// ----------------------------------------
// REST API Key Protocol
// ----------------------------------------
export { RestApiKeyHandler, default as RestApiKeyHandlerDefault } from './1.4.6_folderRestApiKeyProtocol/1.4.6.a_fileRestApiKeyHandler';
export * from './1.4.6_folderRestApiKeyProtocol/1.4.6.b_fileRestApiKeyUtilities';

// ----------------------------------------
// GraphQL Protocol
// ----------------------------------------
export { GraphqlHandler, default as GraphqlHandlerDefault } from './1.4.7_folderGraphqlProtocol/1.4.7.a_fileGraphqlHandler';
export * from './1.4.7_folderGraphqlProtocol/1.4.7.b_fileGraphqlUtilities';

// ----------------------------------------
// WebSocket Protocol
// ----------------------------------------
export { WebsocketHandler, default as WebsocketHandlerDefault } from './1.4.8_folderWebsocketProtocol/1.4.8.a_fileWebsocketHandler';
export * from './1.4.8_folderWebsocketProtocol/1.4.8.b_fileWebsocketUtilities';

// ----------------------------------------
// SOAP/XML Protocol
// ----------------------------------------
export { SoapXmlHandler, default as SoapXmlHandlerDefault } from './1.4.9_folderSoapXmlProtocol/1.4.9.a_fileSoapXmlHandler';
export * from './1.4.9_folderSoapXmlProtocol/1.4.9.b_fileSoapXmlUtilities';

// ----------------------------------------
// GitHub Repo Runner Protocol
// ----------------------------------------
export { GithubRepoRunnerHandler, default as GithubRepoRunnerHandlerDefault } from './1.4.10_folderGithubRepoRunnerProtocol/1.4.10.a_fileGithubRepoRunnerHandler';
export * from './1.4.10_folderGithubRepoRunnerProtocol/1.4.10.b_fileGithubRepoRunnerUtilities';

// ----------------------------------------
// Keyless Scraper Protocol
// ----------------------------------------
export { KeylessScraperHandler, default as KeylessScraperHandlerDefault } from './1.4.11_folderKeylessScraperProtocol/1.4.11.a_fileKeylessScraperHandler';
export * from './1.4.11_folderKeylessScraperProtocol/1.4.11.b_fileKeylessScraperUtilities';

// ----------------------------------------
// Handler Map for Dynamic Loading
// ----------------------------------------
import { CurlDefaultHandler } from './1.4.1_folderCurlDefaultProtocol/1.4.1.a_fileCurlDefaultHandler';
import { OAuthPkceHandler } from './1.4.2_folderOAuthPkceProtocol/1.4.2.a_fileOAuthPkceHandler';
import { OAuthAuthCodeHandler } from './1.4.3_folderOAuthAuthCodeProtocol/1.4.3.a_fileOAuthAuthCodeHandler';
import { OAuthImplicitHandler } from './1.4.4_folderOAuthImplicitProtocol/1.4.4.a_fileOAuthImplicitHandler';
import { ClientCredentialsHandler } from './1.4.5_folderClientCredentialsProtocol/1.4.5.a_fileClientCredentialsHandler';
import { RestApiKeyHandler } from './1.4.6_folderRestApiKeyProtocol/1.4.6.a_fileRestApiKeyHandler';
import { GraphqlHandler } from './1.4.7_folderGraphqlProtocol/1.4.7.a_fileGraphqlHandler';
import { WebsocketHandler } from './1.4.8_folderWebsocketProtocol/1.4.8.a_fileWebsocketHandler';
import { SoapXmlHandler } from './1.4.9_folderSoapXmlProtocol/1.4.9.a_fileSoapXmlHandler';
import { GithubRepoRunnerHandler } from './1.4.10_folderGithubRepoRunnerProtocol/1.4.10.a_fileGithubRepoRunnerHandler';
import { KeylessScraperHandler } from './1.4.11_folderKeylessScraperProtocol/1.4.11.a_fileKeylessScraperHandler';
import type { ProtocolType } from '@types/1.9.c_filePlatformTypeDefinitions';

/**
 * Map of protocol types to their handler classes
 */
export const PROTOCOL_HANDLER_MAP = {
  'curl-default': CurlDefaultHandler,
  'oauth-pkce': OAuthPkceHandler,
  'oauth-auth-code': OAuthAuthCodeHandler,
  'oauth-implicit': OAuthImplicitHandler,
  'client-credentials': ClientCredentialsHandler,
  'rest-api-key': RestApiKeyHandler,
  'graphql': GraphqlHandler,
  'websocket': WebsocketHandler,
  'soap-xml': SoapXmlHandler,
  'github-repo-runner': GithubRepoRunnerHandler,
  'keyless-scraper': KeylessScraperHandler,
} as const;

/**
 * Create a new handler instance by protocol type
 */
export function createProtocolHandler(protocolType: ProtocolType) {
  const HandlerClass = PROTOCOL_HANDLER_MAP[protocolType];
  if (!HandlerClass) {
    throw new Error(`Unknown protocol type: ${protocolType}`);
  }
  return new HandlerClass();
}

/**
 * Get all available protocol types
 */
export function getAvailableProtocolTypes(): ProtocolType[] {
  return Object.keys(PROTOCOL_HANDLER_MAP) as ProtocolType[];
}
