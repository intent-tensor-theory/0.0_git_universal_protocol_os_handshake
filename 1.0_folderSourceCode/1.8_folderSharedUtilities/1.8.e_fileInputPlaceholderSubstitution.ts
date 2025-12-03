// ============================================
// PROTOCOL OS - INPUT PLACEHOLDER SUBSTITUTION
// ============================================
// Address: 1.8.e
// Purpose: Handle {INPUT} and other placeholder substitutions in templates
// ============================================

/**
 * Standard placeholder patterns used in Protocol OS
 */
export const PLACEHOLDER_PATTERNS = {
  /** Primary input placeholder */
  INPUT: /\{INPUT\}/g,
  
  /** Timestamp placeholder (ISO format) */
  TIMESTAMP: /\{TIMESTAMP\}/g,
  
  /** Unix timestamp placeholder */
  UNIX_TIMESTAMP: /\{UNIX_TIMESTAMP\}/g,
  
  /** Date placeholder (YYYY-MM-DD) */
  DATE: /\{DATE\}/g,
  
  /** Time placeholder (HH:MM:SS) */
  TIME: /\{TIME\}/g,
  
  /** Random UUID placeholder */
  UUID: /\{UUID\}/g,
  
  /** Random string placeholder (32 chars) */
  RANDOM: /\{RANDOM\}/g,
  
  /** Environment variable placeholder */
  ENV: /\{ENV:([^}]+)\}/g,
  
  /** Custom variable placeholder */
  VAR: /\{VAR:([^}]+)\}/g,
  
  /** Base64 encode placeholder */
  BASE64: /\{BASE64:([^}]+)\}/g,
  
  /** URL encode placeholder */
  URL_ENCODE: /\{URL_ENCODE:([^}]+)\}/g,
  
  /** JSON stringify placeholder */
  JSON: /\{JSON:([^}]+)\}/g,
} as const;

/**
 * Context object for variable substitution
 */
export interface SubstitutionContext {
  /** Primary input value */
  input?: string;
  
  /** Custom variables */
  variables?: Record<string, string>;
  
  /** Environment-like values (from .env or runtime) */
  environment?: Record<string, string>;
  
  /** Whether to throw on missing variables (default: false) */
  strictMode?: boolean;
  
  /** Fallback value for missing variables */
  fallbackValue?: string;
}

/**
 * Result of a substitution operation
 */
export interface SubstitutionResult {
  /** The substituted string */
  output: string;
  
  /** Placeholders that were found and replaced */
  replacedPlaceholders: string[];
  
  /** Placeholders that were found but not replaced (missing values) */
  unresolvedPlaceholders: string[];
  
  /** Whether all placeholders were resolved */
  complete: boolean;
}

/**
 * Substitute {INPUT} placeholder with the provided value
 * 
 * @param template - The template string containing {INPUT}
 * @param inputValue - The value to substitute
 * @returns String with {INPUT} replaced
 * 
 * @example
 * ```typescript
 * const template = 'Hello, {INPUT}!';
 * const result = substituteInput(template, 'World');
 * // Returns: 'Hello, World!'
 * ```
 */
export function substituteInput(template: string, inputValue: string): string {
  return template.replace(PLACEHOLDER_PATTERNS.INPUT, inputValue);
}

/**
 * Check if a string contains the {INPUT} placeholder
 * 
 * @param template - The string to check
 * @returns True if {INPUT} is found
 */
export function hasInputPlaceholder(template: string): boolean {
  return PLACEHOLDER_PATTERNS.INPUT.test(template);
}

/**
 * Count occurrences of {INPUT} placeholder
 * 
 * @param template - The string to check
 * @returns Number of {INPUT} occurrences
 */
export function countInputPlaceholders(template: string): number {
  const matches = template.match(PLACEHOLDER_PATTERNS.INPUT);
  return matches ? matches.length : 0;
}

/**
 * Perform comprehensive placeholder substitution
 * 
 * @param template - The template string
 * @param context - Substitution context with values
 * @returns Substitution result with details
 * 
 * @example
 * ```typescript
 * const template = `
 *   curl -X POST https://api.example.com/users \\
 *     -H 'Content-Type: application/json' \\
 *     -H 'X-Request-ID: {UUID}' \\
 *     -d '{"name": "{INPUT}", "created": "{TIMESTAMP}"}'
 * `;
 * 
 * const result = substituteAllPlaceholders(template, {
 *   input: 'John Doe',
 * });
 * 
 * // result.output contains the substituted string
 * // result.complete === true (all placeholders resolved)
 * ```
 */
export function substituteAllPlaceholders(
  template: string,
  context: SubstitutionContext = {}
): SubstitutionResult {
  const { 
    input = '', 
    variables = {}, 
    environment = {},
    strictMode = false,
    fallbackValue = ''
  } = context;
  
  let output = template;
  const replacedPlaceholders: string[] = [];
  const unresolvedPlaceholders: string[] = [];
  
  // Generate dynamic values
  const now = new Date();
  const dynamicValues: Record<string, string> = {
    TIMESTAMP: now.toISOString(),
    UNIX_TIMESTAMP: Math.floor(now.getTime() / 1000).toString(),
    DATE: now.toISOString().split('T')[0],
    TIME: now.toTimeString().split(' ')[0],
    UUID: crypto.randomUUID ? crypto.randomUUID() : generateFallbackUuid(),
    RANDOM: generateRandomAlphanumeric(32),
  };
  
  // Substitute {INPUT}
  if (PLACEHOLDER_PATTERNS.INPUT.test(output)) {
    if (input) {
      output = output.replace(PLACEHOLDER_PATTERNS.INPUT, input);
      replacedPlaceholders.push('INPUT');
    } else if (strictMode) {
      throw new Error('Missing required input value for {INPUT} placeholder');
    } else {
      unresolvedPlaceholders.push('INPUT');
      output = output.replace(PLACEHOLDER_PATTERNS.INPUT, fallbackValue);
    }
  }
  
  // Substitute dynamic placeholders
  for (const [name, pattern] of Object.entries(PLACEHOLDER_PATTERNS)) {
    if (name === 'INPUT' || name === 'ENV' || name === 'VAR' || 
        name === 'BASE64' || name === 'URL_ENCODE' || name === 'JSON') {
      continue;
    }
    
    if (pattern.test(output) && dynamicValues[name]) {
      output = output.replace(pattern, dynamicValues[name]);
      replacedPlaceholders.push(name);
    }
  }
  
  // Substitute {ENV:name} placeholders
  output = output.replace(PLACEHOLDER_PATTERNS.ENV, (match, envName) => {
    const value = environment[envName] || import.meta?.env?.[envName];
    if (value) {
      replacedPlaceholders.push(`ENV:${envName}`);
      return value;
    }
    unresolvedPlaceholders.push(`ENV:${envName}`);
    if (strictMode) {
      throw new Error(`Missing environment variable: ${envName}`);
    }
    return fallbackValue;
  });
  
  // Substitute {VAR:name} placeholders
  output = output.replace(PLACEHOLDER_PATTERNS.VAR, (match, varName) => {
    const value = variables[varName];
    if (value !== undefined) {
      replacedPlaceholders.push(`VAR:${varName}`);
      return value;
    }
    unresolvedPlaceholders.push(`VAR:${varName}`);
    if (strictMode) {
      throw new Error(`Missing variable: ${varName}`);
    }
    return fallbackValue;
  });
  
  // Substitute {BASE64:value} placeholders
  output = output.replace(PLACEHOLDER_PATTERNS.BASE64, (match, value) => {
    try {
      replacedPlaceholders.push('BASE64');
      return btoa(value);
    } catch {
      unresolvedPlaceholders.push('BASE64');
      return match;
    }
  });
  
  // Substitute {URL_ENCODE:value} placeholders
  output = output.replace(PLACEHOLDER_PATTERNS.URL_ENCODE, (match, value) => {
    replacedPlaceholders.push('URL_ENCODE');
    return encodeURIComponent(value);
  });
  
  // Substitute {JSON:value} placeholders
  output = output.replace(PLACEHOLDER_PATTERNS.JSON, (match, value) => {
    try {
      replacedPlaceholders.push('JSON');
      return JSON.stringify(value);
    } catch {
      unresolvedPlaceholders.push('JSON');
      return match;
    }
  });
  
  return {
    output,
    replacedPlaceholders,
    unresolvedPlaceholders,
    complete: unresolvedPlaceholders.length === 0,
  };
}

/**
 * Extract all placeholders from a template
 * 
 * @param template - The template string
 * @returns Array of placeholder names found
 */
export function extractPlaceholders(template: string): string[] {
  const placeholders: string[] = [];
  
  // Check standard placeholders
  for (const [name, pattern] of Object.entries(PLACEHOLDER_PATTERNS)) {
    // Reset regex state
    pattern.lastIndex = 0;
    
    if (name === 'ENV' || name === 'VAR' || name === 'BASE64' || 
        name === 'URL_ENCODE' || name === 'JSON') {
      // These have capture groups
      let match;
      while ((match = pattern.exec(template)) !== null) {
        placeholders.push(`${name}:${match[1]}`);
      }
    } else if (pattern.test(template)) {
      placeholders.push(name);
    }
  }
  
  return placeholders;
}

/**
 * Validate that all required placeholders can be resolved
 * 
 * @param template - The template string
 * @param context - Available substitution context
 * @returns Validation result
 */
export function validatePlaceholders(
  template: string,
  context: SubstitutionContext
): { valid: boolean; missingPlaceholders: string[] } {
  const result = substituteAllPlaceholders(template, {
    ...context,
    strictMode: false,
  });
  
  return {
    valid: result.complete,
    missingPlaceholders: result.unresolvedPlaceholders,
  };
}

/**
 * Create a reusable template function
 * 
 * @param template - The template string
 * @returns Function that accepts input and returns substituted string
 */
export function createTemplateFunction(
  template: string
): (input: string, variables?: Record<string, string>) => string {
  return (input: string, variables?: Record<string, string>) => {
    const result = substituteAllPlaceholders(template, { input, variables });
    return result.output;
  };
}

/**
 * Escape special characters in a string for use in placeholders
 * 
 * @param value - The value to escape
 * @returns Escaped string
 */
export function escapeForPlaceholder(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// Helper functions

function generateFallbackUuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generateRandomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values).map(v => chars[v % chars.length]).join('');
}
