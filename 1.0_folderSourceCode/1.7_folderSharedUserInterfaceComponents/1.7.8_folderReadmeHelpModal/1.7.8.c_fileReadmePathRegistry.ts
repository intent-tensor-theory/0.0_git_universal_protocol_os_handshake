// ============================================
// PROTOCOL OS - README PATH REGISTRY
// ============================================
// Address: 1.7.8.c
// Purpose: Maps UI help sections to their README locations across departments
// 
// This is NOT a central repository of READMEs - it is an ORCHESTRATOR
// that knows where to fetch each README from its respective department.
// Each README lives in its proper folder structure.
// ============================================

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/intent-tensor-theory/0.0_git_universal_protocol_os_handshake/main/1.0_folderSourceCode';

/**
 * Section 1: Protocol Channel Selection Guide
 * Source Department: 1.3_folderProtocolRegistry (protocol index level)
 * Contains: Overview of all protocols, platform cheat sheet, decision flowchart
 */
export const PROTOCOL_CHANNEL_GUIDE_PATH = `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.c_fileProtocolChannelSelectionGuideReadme.md`;

/**
 * Section 2: Channel Configuration READMEs (DYNAMIC)
 * Source Department: Each protocol's own folder in 1.3_folderProtocolRegistry
 * Contains: Protocol-specific configuration instructions
 * 
 * The authType value from the UI dropdown determines which README to fetch.
 */
export const CHANNEL_CONFIGURATION_PATHS: Record<string, string> = {
  // Universal Mode
  'curl-default': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.1_folderCurlDefaultProtocol/1.3.1.1.a_fileCurlDefaultProtocolReadme.md`,
  
  // OAuth 2.0 Flows
  'oauth-pkce': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.2_folderOAuthPkceProtocol/1.3.2.1.a_fileOauthPkceProtocolReadme.md`,
  'oauth-auth-code': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.3_folderOAuthAuthCodeProtocol/1.3.3.1.a_fileOauthAuthCodeProtocolReadme.md`,
  'oauth-implicit': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.4_folderOAuthImplicitProtocol/1.3.4.1.a_fileOauthImplicitProtocolReadme.md`,
  
  // Direct Token Auth
  'client-credentials': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.5_folderClientCredentialsProtocol/1.3.5.1.a_fileClientCredentialsProtocolReadme.md`,
  'rest-api-key': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.6_folderRestApiKeyProtocol/1.3.6.1.a_fileRestApiKeyProtocolReadme.md`,
  'basic-auth': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.6_folderRestApiKeyProtocol/1.3.6.1.a_fileRestApiKeyProtocolReadme.md`, // Falls back to REST API Key readme
  
  // Structured Protocols
  'graphql': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.7_folderGraphqlProtocol/1.3.7.1.a_fileGraphqlProtocolReadme.md`,
  'soap-xml': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.9_folderSoapXmlProtocol/1.3.9.1.a_fileSoapXmlProtocolReadme.md`,
  'grpc-web': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.9_folderSoapXmlProtocol/1.3.9.1.a_fileSoapXmlProtocolReadme.md`, // Placeholder
  
  // Real-time Protocols
  'websocket': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.8_folderWebsocketProtocol/1.3.8.1.a_fileWebsocketProtocolReadme.md`,
  'sse': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.8_folderWebsocketProtocol/1.3.8.1.a_fileWebsocketProtocolReadme.md`, // Falls back to WebSocket readme
  
  // Custom Protocols
  'github-direct': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.10_folderGithubRepoRunnerProtocol/1.3.10.1.a_fileGithubRepoRunnerProtocolReadme.md`,
  'keyless-scraper': `${GITHUB_RAW_BASE}/1.3_folderProtocolRegistry/1.3.11_folderKeylessScraperProtocol/1.3.11.1.a_fileKeylessScraperProtocolReadme.md`,
};

/**
 * Section 3: Request Input Guide
 * Source Department: 1.8_folderSharedUtilities (curl/input handling department)
 * Contains: cURL syntax, JSON payloads, placeholder system, file uploads
 */
export const REQUEST_INPUT_GUIDE_PATH = `${GITHUB_RAW_BASE}/1.8_folderSharedUtilities/1.8.h_fileRequestInputGuideReadme.md`;

/**
 * Section 4: Execution & Output Guide
 * Source Department: 1.6_folderExecutionOutput (execution department)
 * Contains: HTTP status codes, response parsing, troubleshooting
 */
export const EXECUTION_OUTPUT_GUIDE_PATH = `${GITHUB_RAW_BASE}/1.6_folderExecutionOutput/1.6.f_fileExecutionOutputGuideReadme.md`;

/**
 * Get the README path for a given section
 * 
 * @param section - The section identifier (1, 2, 3, or 4)
 * @param authType - For section 2, the current auth type selection
 */
export function getReadmePath(section: 1 | 2 | 3 | 4, authType?: string): string | null {
  switch (section) {
    case 1:
      return PROTOCOL_CHANNEL_GUIDE_PATH;
    case 2:
      if (!authType) return null;
      return CHANNEL_CONFIGURATION_PATHS[authType] || null;
    case 3:
      return REQUEST_INPUT_GUIDE_PATH;
    case 4:
      return EXECUTION_OUTPUT_GUIDE_PATH;
    default:
      return null;
  }
}

/**
 * Section display names for the modal title
 */
export const SECTION_TITLES: Record<number, string> = {
  1: 'Protocol Channel Selection Guide',
  2: 'Channel Configuration Guide',
  3: 'Request Input Guide',
  4: 'Execution & Output Guide',
};
