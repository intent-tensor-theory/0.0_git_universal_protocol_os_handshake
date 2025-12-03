// ============================================
// PROTOCOL OS - CURL DEFAULT UTILITIES
// ============================================
// Address: 1.4.1.b
// Purpose: Utility functions for cURL default protocol
// ============================================

import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';

/**
 * Common HTTP methods
 */
export const HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;

export type HttpMethod = typeof HTTP_METHODS[number];

/**
 * Common content types
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
  XML: 'application/xml',
  TEXT: 'text/plain',
  HTML: 'text/html',
} as const;

/**
 * Create a basic cURL request template
 */
export function createCurlRequestTemplate(
  method: HttpMethod = 'GET',
  url: string = 'https://api.example.com',
  options?: {
    headers?: Record<string, string>;
    body?: string;
    title?: string;
  }
): Partial<CurlRequest> {
  let command = `curl -X ${method} "${url}"`;

  // Add headers
  if (options?.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      command += ` \\\n  -H "${key}: ${value}"`;
    });
  }

  // Add body
  if (options?.body) {
    command += ` \\\n  -d '${options.body}'`;
  }

  return {
    title: options?.title ?? `${method} Request`,
    command,
  };
}

/**
 * Create a GET request template
 */
export function createGetRequest(
  url: string,
  headers?: Record<string, string>
): Partial<CurlRequest> {
  return createCurlRequestTemplate('GET', url, { headers, title: 'GET Request' });
}

/**
 * Create a POST request template with JSON body
 */
export function createPostJsonRequest(
  url: string,
  body: Record<string, unknown>,
  headers?: Record<string, string>
): Partial<CurlRequest> {
  return createCurlRequestTemplate('POST', url, {
    headers: {
      'Content-Type': CONTENT_TYPES.JSON,
      ...headers,
    },
    body: JSON.stringify(body),
    title: 'POST JSON Request',
  });
}

/**
 * Create a POST request template with form data
 */
export function createPostFormRequest(
  url: string,
  formData: Record<string, string>,
  headers?: Record<string, string>
): Partial<CurlRequest> {
  const body = new URLSearchParams(formData).toString();
  
  return createCurlRequestTemplate('POST', url, {
    headers: {
      'Content-Type': CONTENT_TYPES.FORM,
      ...headers,
    },
    body,
    title: 'POST Form Request',
  });
}

/**
 * Extract URL from a cURL command string
 */
export function extractUrlFromCurl(curlCommand: string): string | null {
  // Try to find URL in quotes
  const quotedMatch = curlCommand.match(/curl\s+.*?["']([^"']+)["']/i);
  if (quotedMatch) return quotedMatch[1];

  // Try to find URL without quotes
  const unquotedMatch = curlCommand.match(/curl\s+.*?(https?:\/\/\S+)/i);
  if (unquotedMatch) return unquotedMatch[1];

  return null;
}

/**
 * Extract method from a cURL command string
 */
export function extractMethodFromCurl(curlCommand: string): HttpMethod {
  const methodMatch = curlCommand.match(/-X\s+(\w+)/i);
  if (methodMatch) {
    const method = methodMatch[1].toUpperCase();
    if (HTTP_METHODS.includes(method as HttpMethod)) {
      return method as HttpMethod;
    }
  }

  // Check for data flags which imply POST
  if (/-d\s+/.test(curlCommand) || /--data/.test(curlCommand)) {
    return 'POST';
  }

  return 'GET';
}

/**
 * Extract headers from a cURL command string
 */
export function extractHeadersFromCurl(curlCommand: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const headerMatches = curlCommand.matchAll(/-H\s+["']([^:]+):\s*([^"']+)["']/gi);

  for (const match of headerMatches) {
    headers[match[1].trim()] = match[2].trim();
  }

  return headers;
}

/**
 * Format a cURL command for display (with line breaks)
 */
export function formatCurlCommand(curlCommand: string): string {
  // Normalize whitespace
  let formatted = curlCommand.replace(/\s+/g, ' ').trim();

  // Add line breaks before options
  formatted = formatted.replace(/\s+(-[A-Za-z])/g, ' \\\n  $1');

  return formatted;
}

/**
 * Validate a cURL command string
 */
export function validateCurlCommand(curlCommand: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if it starts with curl
  if (!curlCommand.trim().toLowerCase().startsWith('curl')) {
    errors.push('Command must start with "curl"');
  }

  // Check for URL
  const url = extractUrlFromCurl(curlCommand);
  if (!url) {
    errors.push('No URL found in command');
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    warnings.push('URL should start with http:// or https://');
  }

  // Check for sensitive data in command
  const sensitivePatterns = [
    /password[=:]\s*\S+/i,
    /secret[=:]\s*\S+/i,
    /api[_-]?key[=:]\s*\S+/i,
  ];

  sensitivePatterns.forEach(pattern => {
    if (pattern.test(curlCommand)) {
      warnings.push('Command may contain sensitive data');
    }
  });

  // Check for unbalanced quotes
  const singleQuotes = (curlCommand.match(/'/g) || []).length;
  const doubleQuotes = (curlCommand.match(/"/g) || []).length;

  if (singleQuotes % 2 !== 0) {
    errors.push('Unbalanced single quotes');
  }
  if (doubleQuotes % 2 !== 0) {
    errors.push('Unbalanced double quotes');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Escape a value for use in a cURL command
 */
export function escapeCurlValue(value: string): string {
  // Escape single quotes by ending the string, adding escaped quote, and starting new string
  return value.replace(/'/g, "'\\''");
}

/**
 * Build authorization header for common auth types
 */
export function buildAuthHeader(
  type: 'bearer' | 'basic' | 'api-key',
  credentials: { token?: string; username?: string; password?: string; apiKey?: string }
): string {
  switch (type) {
    case 'bearer':
      return `Authorization: Bearer ${credentials.token}`;
    case 'basic':
      const encoded = btoa(`${credentials.username}:${credentials.password}`);
      return `Authorization: Basic ${encoded}`;
    case 'api-key':
      return `X-API-Key: ${credentials.apiKey}`;
    default:
      return '';
  }
}
