// ============================================
// PROTOCOL OS - CURL COMMAND PARSER
// ============================================
// Address: 1.8.a
// Purpose: Parse cURL command strings into structured request objects
// ============================================

import type { ParsedCurlCommand } from '@types/1.9.e_fileCurlRequestTypeDefinitions';

/**
 * Token types for cURL parsing
 */
type TokenType = 'flag' | 'value' | 'url';

interface Token {
  type: TokenType;
  value: string;
}

/**
 * Known cURL flags and their aliases
 */
const CURL_FLAGS: Record<string, string> = {
  '-X': 'method',
  '--request': 'method',
  '-H': 'header',
  '--header': 'header',
  '-d': 'data',
  '--data': 'data',
  '--data-raw': 'data',
  '--data-binary': 'data',
  '-u': 'user',
  '--user': 'user',
  '-L': 'location',
  '--location': 'location',
  '-v': 'verbose',
  '--verbose': 'verbose',
  '-k': 'insecure',
  '--insecure': 'insecure',
  '-o': 'output',
  '--output': 'output',
  '-A': 'user-agent',
  '--user-agent': 'user-agent',
  '-b': 'cookie',
  '--cookie': 'cookie',
  '-c': 'cookie-jar',
  '--cookie-jar': 'cookie-jar',
  '-e': 'referer',
  '--referer': 'referer',
  '-F': 'form',
  '--form': 'form',
  '-T': 'upload-file',
  '--upload-file': 'upload-file',
  '-I': 'head',
  '--head': 'head',
  '-s': 'silent',
  '--silent': 'silent',
  '-S': 'show-error',
  '--show-error': 'show-error',
  '--compressed': 'compressed',
  '--connect-timeout': 'connect-timeout',
  '-m': 'max-time',
  '--max-time': 'max-time',
};

/**
 * Flags that don't take a value (boolean flags)
 */
const BOOLEAN_FLAGS = new Set([
  'location', 'verbose', 'insecure', 'head', 'silent', 
  'show-error', 'compressed'
]);

/**
 * Tokenize a cURL command string
 */
function tokenize(command: string): Token[] {
  const tokens: Token[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let i = 0;

  // Remove 'curl' prefix if present
  const trimmed = command.trim();
  const curlMatch = trimmed.match(/^curl\s+/i);
  const startIndex = curlMatch ? curlMatch[0].length : 0;
  const input = trimmed.slice(startIndex);

  while (i < input.length) {
    const char = input[i];

    // Handle escape sequences
    if (char === '\\' && i + 1 < input.length) {
      current += input[i + 1];
      i += 2;
      continue;
    }

    // Handle quotes
    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
      i++;
      continue;
    }

    if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
      i++;
      continue;
    }

    // Handle whitespace outside quotes
    if (!inQuotes && /\s/.test(char)) {
      if (current) {
        tokens.push(categorizeToken(current));
        current = '';
      }
      i++;
      continue;
    }

    current += char;
    i++;
  }

  // Push final token
  if (current) {
    tokens.push(categorizeToken(current));
  }

  return tokens;
}

/**
 * Categorize a token as flag, value, or URL
 */
function categorizeToken(value: string): Token {
  if (value.startsWith('-')) {
    return { type: 'flag', value };
  }
  
  if (value.match(/^https?:\/\//i) || value.match(/^wss?:\/\//i)) {
    return { type: 'url', value };
  }
  
  return { type: 'value', value };
}

/**
 * Parse a cURL command string into a structured object
 * 
 * @param command - The cURL command string to parse
 * @returns Parsed command structure
 * 
 * @example
 * ```typescript
 * const parsed = parseCurlCommand(`
 *   curl -X POST https://api.example.com/users \
 *     -H 'Content-Type: application/json' \
 *     -H 'Authorization: Bearer token123' \
 *     -d '{"name": "John"}'
 * `);
 * 
 * // Result:
 * // {
 * //   method: 'POST',
 * //   url: 'https://api.example.com/users',
 * //   headers: {
 * //     'Content-Type': 'application/json',
 * //     'Authorization': 'Bearer token123'
 * //   },
 * //   body: '{"name": "John"}',
 * //   followRedirects: false,
 * //   verbose: false
 * // }
 * ```
 */
export function parseCurlCommand(command: string): ParsedCurlCommand {
  const tokens = tokenize(command);
  
  const result: ParsedCurlCommand = {
    method: 'GET',
    url: '',
    headers: {},
    followRedirects: false,
    verbose: false,
  };

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'url') {
      result.url = token.value;
      i++;
      continue;
    }

    if (token.type === 'flag') {
      const flagName = CURL_FLAGS[token.value];
      
      if (!flagName) {
        // Unknown flag, skip
        i++;
        continue;
      }

      // Boolean flags don't consume next token
      if (BOOLEAN_FLAGS.has(flagName)) {
        if (flagName === 'location') result.followRedirects = true;
        if (flagName === 'verbose') result.verbose = true;
        if (flagName === 'head') result.method = 'HEAD';
        i++;
        continue;
      }

      // Get the next token as the value
      const nextToken = tokens[i + 1];
      if (!nextToken || nextToken.type === 'flag') {
        i++;
        continue;
      }

      const flagValue = nextToken.value;

      switch (flagName) {
        case 'method':
          result.method = flagValue.toUpperCase();
          break;
        
        case 'header':
          const colonIndex = flagValue.indexOf(':');
          if (colonIndex > 0) {
            const headerName = flagValue.slice(0, colonIndex).trim();
            const headerValue = flagValue.slice(colonIndex + 1).trim();
            result.headers[headerName] = headerValue;
          }
          break;
        
        case 'data':
          result.body = flagValue;
          // If method hasn't been explicitly set, default to POST for data
          if (result.method === 'GET') {
            result.method = 'POST';
          }
          break;
        
        case 'user':
          const [username, password] = flagValue.split(':');
          result.basicAuth = { username, password: password || '' };
          break;
        
        case 'user-agent':
          result.headers['User-Agent'] = flagValue;
          break;
        
        case 'cookie':
          result.headers['Cookie'] = flagValue;
          break;
        
        case 'referer':
          result.headers['Referer'] = flagValue;
          break;
      }

      i += 2;
      continue;
    }

    // If it's a value without a preceding flag, it might be the URL
    if (token.type === 'value' && !result.url) {
      // Check if it looks like a URL
      if (token.value.includes('.') || token.value.startsWith('localhost')) {
        result.url = token.value.startsWith('http') ? token.value : `https://${token.value}`;
      }
    }

    i++;
  }

  return result;
}

/**
 * Convert a parsed cURL command back to a cURL string
 * 
 * @param parsed - The parsed command structure
 * @returns Formatted cURL command string
 */
export function stringifyCurlCommand(parsed: ParsedCurlCommand): string {
  const parts: string[] = ['curl'];

  // Method (only if not GET)
  if (parsed.method !== 'GET') {
    parts.push(`-X ${parsed.method}`);
  }

  // URL
  if (parsed.url) {
    parts.push(`"${parsed.url}"`);
  }

  // Headers
  for (const [name, value] of Object.entries(parsed.headers)) {
    parts.push(`-H '${name}: ${value}'`);
  }

  // Basic auth
  if (parsed.basicAuth) {
    parts.push(`-u '${parsed.basicAuth.username}:${parsed.basicAuth.password}'`);
  }

  // Data/body
  if (parsed.body) {
    parts.push(`-d '${parsed.body}'`);
  }

  // Flags
  if (parsed.followRedirects) {
    parts.push('-L');
  }
  if (parsed.verbose) {
    parts.push('-v');
  }

  return parts.join(' \\\n  ');
}

/**
 * Convert parsed cURL to fetch options
 * 
 * @param parsed - The parsed command structure
 * @returns Fetch API compatible options
 */
export function curlToFetchOptions(parsed: ParsedCurlCommand): RequestInit {
  const options: RequestInit = {
    method: parsed.method,
    headers: { ...parsed.headers },
  };

  if (parsed.body) {
    options.body = parsed.body;
  }

  if (parsed.basicAuth) {
    const credentials = btoa(`${parsed.basicAuth.username}:${parsed.basicAuth.password}`);
    (options.headers as Record<string, string>)['Authorization'] = `Basic ${credentials}`;
  }

  if (parsed.followRedirects) {
    options.redirect = 'follow';
  }

  return options;
}

/**
 * Validate a cURL command string
 * 
 * @param command - The cURL command to validate
 * @returns Validation result with any errors
 */
export function validateCurlCommand(command: string): {
  valid: boolean;
  errors: string[];
  parsed?: ParsedCurlCommand;
} {
  const errors: string[] = [];

  if (!command || !command.trim()) {
    return { valid: false, errors: ['Command is empty'] };
  }

  try {
    const parsed = parseCurlCommand(command);

    if (!parsed.url) {
      errors.push('No URL found in command');
    } else if (!parsed.url.match(/^https?:\/\//i) && !parsed.url.match(/^wss?:\/\//i)) {
      errors.push('URL must start with http://, https://, ws://, or wss://');
    }

    if (parsed.method && !['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(parsed.method)) {
      errors.push(`Unknown HTTP method: ${parsed.method}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      parsed: errors.length === 0 ? parsed : undefined,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}
