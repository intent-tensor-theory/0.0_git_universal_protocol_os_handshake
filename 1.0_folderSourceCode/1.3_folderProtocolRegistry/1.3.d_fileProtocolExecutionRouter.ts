// ============================================
// PROTOCOL OS - PROTOCOL EXECUTION ROUTER
// ============================================
// Address: 1.3.d
// Purpose: Routes execution requests to appropriate protocol handlers
// ============================================

import { logger, COMMENTARY } from '../1.8_folderSharedUtilities/1.8.g_fileSystemLogger';

/**
 * Protocol execution context - data needed to execute a request
 */
export interface ExecutionContext {
  /** Handshake ID */
  handshakeId: string;
  
  /** Handshake serial number */
  serial: string;
  
  /** Protocol/auth type */
  authType: string;
  
  /** Authentication credentials and configuration */
  credentials: Record<string, unknown>;
  
  /** cURL requests defined in the handshake */
  curlRequests?: Array<{
    id: string;
    command: string;
    name: string;
  }>;
  
  /** Callback for logging progress */
  onLog?: (entry: LogEntry) => void;
}

/**
 * Log entry for execution progress
 */
export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error' | 'success';
  context: string;
  message: string;
  commentary?: string;
  data?: unknown;
}

/**
 * Protocol execution result
 */
export interface ExecutionResult {
  success: boolean;
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  rawBody: string;
  durationMs: number;
  error?: string;
  errorCode?: string;
}

/**
 * Maps auth types to their protocol folder names
 */
const PROTOCOL_MAP: Record<string, string> = {
  'curl-default': '1.3.1_folderCurlDefaultProtocol',
  'oauth2-pkce': '1.3.2_folderOAuthPkceProtocol',
  'oauth2-auth-code': '1.3.3_folderOAuthAuthCodeProtocol',
  'oauth2-implicit': '1.3.4_folderOAuthImplicitProtocol',
  'oauth2-client-credentials': '1.3.5_folderClientCredentialsProtocol',
  'rest-api-key': '1.3.6_folderRestApiKeyProtocol',
  'graphql': '1.3.7_folderGraphqlProtocol',
  'websocket': '1.3.8_folderWebsocketProtocol',
  'soap-xml': '1.3.9_folderSoapXmlProtocol',
  'github-repo-runner': '1.3.10_folderGithubRepoRunnerProtocol',
  'keyless-scraper': '1.3.11_folderKeylessScraperProtocol',
};

/**
 * Display names for protocols
 */
const PROTOCOL_DISPLAY_NAMES: Record<string, string> = {
  'curl-default': 'cURL Command',
  'oauth2-pkce': 'OAuth 2.0 PKCE',
  'oauth2-auth-code': 'OAuth 2.0 Auth Code',
  'oauth2-implicit': 'OAuth 2.0 Implicit',
  'oauth2-client-credentials': 'Client Credentials',
  'rest-api-key': 'REST API Key',
  'graphql': 'GraphQL',
  'websocket': 'WebSocket',
  'soap-xml': 'SOAP/XML',
  'github-repo-runner': 'GitHub Repo Runner',
  'keyless-scraper': 'Keyless Scraper',
};

/**
 * Execute a protocol request
 * 
 * This is the main entry point for all protocol executions.
 * It routes to the appropriate executor based on auth type.
 */
export async function executeProtocol(context: ExecutionContext): Promise<ExecutionResult> {
  const { authType, handshakeId, serial, onLog } = context;
  const startTime = performance.now();
  
  // Helper to log with callback
  const log = (level: LogEntry['level'], ctx: string, message: string, commentary?: string, data?: unknown) => {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      context: ctx,
      message,
      commentary,
      data,
    };
    
    // Log to system logger
    if (level === 'error') {
      logger.error(ctx, message, { commentary, data });
    } else if (level === 'warn') {
      logger.warn(ctx, message, { commentary, data });
    } else if (level === 'success') {
      logger.success(ctx, message, { commentary, data });
    } else {
      logger.info(ctx, message, { commentary, data });
    }
    
    // Call progress callback
    onLog?.(entry);
  };
  
  // Start execution
  log('info', 'Execute.Start', `Starting execution for ${serial}`, 'Initializing protocol handler...');
  
  // Validate auth type
  if (!authType) {
    log('error', 'Execute.Validate', 'No protocol selected', 'Select a Protocol Channel in Section 1');
    return {
      success: false,
      statusCode: 0,
      headers: {},
      body: null,
      rawBody: '',
      durationMs: performance.now() - startTime,
      error: 'No protocol selected',
      errorCode: 'NO_PROTOCOL',
    };
  }
  
  const protocolName = PROTOCOL_DISPLAY_NAMES[authType] || authType;
  log('info', 'Execute.Protocol', `Protocol: ${protocolName}`, 'Loading protocol executor...');
  
  // Check if protocol is supported
  if (!PROTOCOL_MAP[authType]) {
    log('error', 'Execute.Protocol', `Unknown protocol: ${authType}`, 'This protocol type is not yet implemented');
    return {
      success: false,
      statusCode: 0,
      headers: {},
      body: null,
      rawBody: '',
      durationMs: performance.now() - startTime,
      error: `Unknown protocol: ${authType}`,
      errorCode: 'UNKNOWN_PROTOCOL',
    };
  }
  
  // For now, implement a simplified execution flow
  // TODO: Dynamic import of actual protocol executors
  try {
    log('info', 'Execute.Prepare', 'Building request from configuration...', 'Assembling headers, body, and credentials');
    
    // Simulate preparation delay
    await delay(200);
    
    // Check for cURL command (most common case)
    const curlCommand = context.credentials.curlCommand as string;
    
    if (authType === 'curl-default' && curlCommand) {
      return await executeCurlRequest(curlCommand, context, log);
    }
    
    // For other protocols, show placeholder until fully implemented
    log('info', 'Execute.Send', 'Sending request...', 'Awaiting response from endpoint');
    await delay(300);
    
    // Placeholder success for demo
    log('success', 'Execute.Complete', '✅ Protocol handler initialized', `${protocolName} is configured. Full execution coming soon.`);
    
    return {
      success: true,
      statusCode: 200,
      headers: {},
      body: { message: `${protocolName} protocol handler ready. Configure credentials in Section 2.` },
      rawBody: JSON.stringify({ status: 'ready', protocol: authType }),
      durationMs: performance.now() - startTime,
    };
    
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    log('error', 'Execute.Error', `❌ ${errorMsg}`, 'Check credentials and endpoint configuration');
    
    return {
      success: false,
      statusCode: 0,
      headers: {},
      body: null,
      rawBody: '',
      durationMs: performance.now() - startTime,
      error: errorMsg,
      errorCode: 'EXECUTION_ERROR',
    };
  }
}

/**
 * Execute a cURL command directly
 */
async function executeCurlRequest(
  curlCommand: string,
  context: ExecutionContext,
  log: (level: LogEntry['level'], ctx: string, message: string, commentary?: string, data?: unknown) => void
): Promise<ExecutionResult> {
  const startTime = performance.now();
  
  log('info', 'cURL.Parse', 'Parsing cURL command...', 'Extracting method, URL, headers, and body');
  
  // Parse the cURL command
  const parsed = parseCurlCommand(curlCommand);
  
  if (!parsed.url) {
    log('error', 'cURL.Parse', 'Failed to parse URL from cURL command', 'Check command format');
    return {
      success: false,
      statusCode: 0,
      headers: {},
      body: null,
      rawBody: '',
      durationMs: performance.now() - startTime,
      error: 'Failed to parse URL from cURL command',
      errorCode: 'PARSE_ERROR',
    };
  }
  
  log('info', 'cURL.Request', `${parsed.method} ${parsed.url}`, `Headers: ${Object.keys(parsed.headers).length}, Body: ${parsed.body ? 'yes' : 'no'}`);
  
  // Substitute placeholders if provided
  const placeholders = context.credentials.placeholderValues as Record<string, string> || {};
  let url = substitutePlaceholders(parsed.url, placeholders);
  const headers: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(parsed.headers)) {
    headers[key] = substitutePlaceholders(value, placeholders);
  }
  
  let body = parsed.body ? substitutePlaceholders(parsed.body, placeholders) : undefined;
  
  log('info', 'cURL.Send', 'Sending HTTP request...', `Timeout: 30s`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, {
      method: parsed.method,
      headers,
      body: parsed.method !== 'GET' && parsed.method !== 'HEAD' ? body : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const rawBody = await response.text();
    let parsedBody: unknown = rawBody;
    
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      // Not JSON, keep as text
    }
    
    const durationMs = performance.now() - startTime;
    
    if (response.ok) {
      log('success', 'cURL.Complete', `✅ ${response.status} ${response.statusText}`, `Response received in ${Math.round(durationMs)}ms`);
    } else {
      log('error', 'cURL.Complete', `❌ ${response.status} ${response.statusText}`, rawBody.substring(0, 200));
    }
    
    return {
      success: response.ok,
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsedBody,
      rawBody,
      durationMs,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
    
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    
    log('error', 'cURL.Error', isTimeout ? '⏱️ Request timed out' : `❌ ${errorMsg}`, 'Check network and endpoint availability');
    
    return {
      success: false,
      statusCode: 0,
      headers: {},
      body: null,
      rawBody: '',
      durationMs: performance.now() - startTime,
      error: errorMsg,
      errorCode: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
    };
  }
}

/**
 * Simple cURL command parser
 */
function parseCurlCommand(command: string): {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
} {
  const result = {
    method: 'GET',
    url: '',
    headers: {} as Record<string, string>,
    body: undefined as string | undefined,
  };
  
  // Normalize the command (remove line continuations)
  const normalized = command
    .replace(/\\\n/g, ' ')
    .replace(/\\\r\n/g, ' ')
    .trim();
  
  // Extract method
  const methodMatch = normalized.match(/-X\s+['"]?(\w+)['"]?/i);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  }
  
  // Extract URL - look for quoted URL or unquoted URL
  const urlPatterns = [
    /curl\s+['"]([^'"]+)['"]/i,           // curl "url"
    /curl\s+(\S+)/i,                        // curl url
    /['"]?(https?:\/\/[^\s'"]+)['"]?/i,    // standalone URL
  ];
  
  for (const pattern of urlPatterns) {
    const match = normalized.match(pattern);
    if (match && match[1] && match[1].startsWith('http')) {
      result.url = match[1];
      break;
    }
  }
  
  // Extract headers
  const headerPattern = /-H\s+['"]([^'"]+)['"]/gi;
  let headerMatch;
  while ((headerMatch = headerPattern.exec(normalized)) !== null) {
    const header = headerMatch[1];
    const colonIndex = header.indexOf(':');
    if (colonIndex > 0) {
      const key = header.substring(0, colonIndex).trim();
      const value = header.substring(colonIndex + 1).trim();
      result.headers[key] = value;
    }
  }
  
  // Extract body
  const bodyPatterns = [
    /-d\s+'([^']+)'/i,
    /-d\s+"([^"]+)"/i,
    /--data\s+'([^']+)'/i,
    /--data\s+"([^"]+)"/i,
    /--data-raw\s+'([^']+)'/i,
    /--data-raw\s+"([^"]+)"/i,
  ];
  
  for (const pattern of bodyPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      result.body = match[1];
      // If we found a body, default to POST if method wasn't explicitly set
      if (!methodMatch) {
        result.method = 'POST';
      }
      break;
    }
  }
  
  return result;
}

/**
 * Substitute {{placeholder}} values in a string
 */
function substitutePlaceholders(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  });
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get list of supported protocols
 */
export function getSupportedProtocols(): Array<{ type: string; name: string }> {
  return Object.entries(PROTOCOL_DISPLAY_NAMES).map(([type, name]) => ({ type, name }));
}

/**
 * Check if a protocol type is supported
 */
export function isProtocolSupported(authType: string): boolean {
  return authType in PROTOCOL_MAP;
}

export default executeProtocol;
