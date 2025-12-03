// ============================================
// PROTOCOL OS - SENSITIVE FIELD SANITIZER
// ============================================
// Address: 1.8.f
// Purpose: Sanitize sensitive fields before persistence/display
// ============================================

import { SENSITIVE_AUTHENTICATION_FIELDS } from '@types/1.9.d_fileAuthenticationTypeDefinitions';

/**
 * Default sensitive field names that should be sanitized
 */
export const DEFAULT_SENSITIVE_FIELDS: string[] = [
  // Authentication secrets
  'password',
  'secret',
  'clientSecret',
  'client_secret',
  'apiKey',
  'api_key',
  'apikey',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authToken',
  'auth_token',
  'bearer',
  'token',
  'jwt',
  
  // OAuth specific
  'codeVerifier',
  'code_verifier',
  'codeChallenge',
  'code_challenge',
  
  // Personal Access Tokens
  'personalAccessToken',
  'personal_access_token',
  'pat',
  'ghToken',
  'gh_token',
  
  // Database credentials
  'dbPassword',
  'db_password',
  'connectionString',
  'connection_string',
  
  // API credentials
  'privateKey',
  'private_key',
  'secretKey',
  'secret_key',
  'signingKey',
  'signing_key',
  'encryptionKey',
  'encryption_key',
  
  // SOAP/XML
  'wssePassword',
  'wsse_password',
  
  // Generic sensitive names
  'credential',
  'credentials',
  'auth',
  'authorization',
];

/**
 * Placeholder text for sanitized fields
 */
export const SANITIZED_PLACEHOLDER = '********';

/**
 * Options for sanitization
 */
export interface SanitizeOptions {
  /** Additional field names to treat as sensitive */
  additionalFields?: string[];
  
  /** Field names to exclude from sanitization */
  excludeFields?: string[];
  
  /** Custom placeholder text (default: '********') */
  placeholder?: string;
  
  /** Whether to do deep sanitization of nested objects */
  deep?: boolean;
  
  /** Maximum depth for deep sanitization (default: 10) */
  maxDepth?: number;
  
  /** Whether to sanitize array elements */
  sanitizeArrays?: boolean;
  
  /** Custom sanitization function for specific fields */
  customSanitizer?: (key: string, value: unknown) => unknown;
}

/**
 * Check if a field name is sensitive
 * 
 * @param fieldName - The field name to check
 * @param options - Sanitization options
 * @returns True if the field should be sanitized
 */
export function isSensitiveField(
  fieldName: string,
  options: SanitizeOptions = {}
): boolean {
  const { additionalFields = [], excludeFields = [] } = options;
  
  // Check exclusions first
  if (excludeFields.includes(fieldName)) {
    return false;
  }
  
  // Normalize field name for comparison
  const normalizedName = fieldName.toLowerCase();
  
  // Check against default sensitive fields
  const allSensitiveFields = [
    ...DEFAULT_SENSITIVE_FIELDS,
    ...SENSITIVE_AUTHENTICATION_FIELDS,
    ...additionalFields,
  ];
  
  for (const sensitiveField of allSensitiveFields) {
    const normalizedSensitive = sensitiveField.toLowerCase();
    
    // Exact match
    if (normalizedName === normalizedSensitive) {
      return true;
    }
    
    // Contains match (e.g., 'myApiKey' contains 'apikey')
    if (normalizedName.includes(normalizedSensitive)) {
      return true;
    }
    
    // Ends with match (e.g., 'userPassword' ends with 'password')
    if (normalizedName.endsWith(normalizedSensitive)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Sanitize a single value if its key is sensitive
 * 
 * @param key - The field name
 * @param value - The field value
 * @param options - Sanitization options
 * @returns Sanitized value or original value
 */
export function sanitizeValue(
  key: string,
  value: unknown,
  options: SanitizeOptions = {}
): unknown {
  const { placeholder = SANITIZED_PLACEHOLDER, customSanitizer } = options;
  
  // Use custom sanitizer if provided
  if (customSanitizer) {
    return customSanitizer(key, value);
  }
  
  // Only sanitize if field is sensitive and has a value
  if (isSensitiveField(key, options) && value !== undefined && value !== null && value !== '') {
    return placeholder;
  }
  
  return value;
}

/**
 * Sanitize an object by removing/masking sensitive fields
 * 
 * @param obj - The object to sanitize
 * @param options - Sanitization options
 * @returns New object with sensitive fields sanitized
 * 
 * @example
 * ```typescript
 * const config = {
 *   apiUrl: 'https://api.example.com',
 *   apiKey: 'secret123',
 *   clientSecret: 'supersecret',
 *   nested: {
 *     password: 'mypassword'
 *   }
 * };
 * 
 * const sanitized = sanitizeObject(config, { deep: true });
 * // Result:
 * // {
 * //   apiUrl: 'https://api.example.com',
 * //   apiKey: '********',
 * //   clientSecret: '********',
 * //   nested: {
 * //     password: '********'
 * //   }
 * // }
 * ```
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: SanitizeOptions = {}
): T {
  const {
    deep = true,
    maxDepth = 10,
    sanitizeArrays = true,
    placeholder = SANITIZED_PLACEHOLDER,
  } = options;
  
  return sanitizeObjectRecursive(obj, options, 0, maxDepth) as T;
}

function sanitizeObjectRecursive(
  obj: unknown,
  options: SanitizeOptions,
  currentDepth: number,
  maxDepth: number
): unknown {
  // Prevent infinite recursion
  if (currentDepth >= maxDepth) {
    return obj;
  }
  
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    if (options.sanitizeArrays !== false) {
      return obj.map(item => 
        sanitizeObjectRecursive(item, options, currentDepth + 1, maxDepth)
      );
    }
    return obj;
  }
  
  // Handle objects
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveField(key, options)) {
        // Sanitize sensitive field
        result[key] = value !== undefined && value !== null && value !== ''
          ? (options.placeholder || SANITIZED_PLACEHOLDER)
          : value;
      } else if (options.deep !== false && typeof value === 'object' && value !== null) {
        // Recurse into nested objects
        result[key] = sanitizeObjectRecursive(value, options, currentDepth + 1, maxDepth);
      } else {
        // Keep non-sensitive, non-object values
        result[key] = value;
      }
    }
    
    return result;
  }
  
  // Return primitives as-is
  return obj;
}

/**
 * Create a sanitizer function with preset options
 * 
 * @param defaultOptions - Default options to use
 * @returns Configured sanitizer function
 */
export function createSanitizer(
  defaultOptions: SanitizeOptions = {}
): <T extends Record<string, unknown>>(obj: T, overrideOptions?: SanitizeOptions) => T {
  return <T extends Record<string, unknown>>(
    obj: T,
    overrideOptions: SanitizeOptions = {}
  ): T => {
    return sanitizeObject(obj, { ...defaultOptions, ...overrideOptions });
  };
}

/**
 * Sanitize a string that might contain sensitive data patterns
 * (e.g., URLs with embedded credentials)
 * 
 * @param str - The string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(
  str: string,
  options: SanitizeOptions = {}
): string {
  const { placeholder = SANITIZED_PLACEHOLDER } = options;
  
  let result = str;
  
  // Sanitize Basic Auth in URLs (user:password@host)
  result = result.replace(
    /(https?:\/\/)([^:]+):([^@]+)@/gi,
    `$1$2:${placeholder}@`
  );
  
  // Sanitize Bearer tokens in Authorization headers
  result = result.replace(
    /(Authorization:\s*Bearer\s+)[^\s'"]+/gi,
    `$1${placeholder}`
  );
  
  // Sanitize API keys in common header patterns
  result = result.replace(
    /(X-API-Key:\s*)[^\s'"]+/gi,
    `$1${placeholder}`
  );
  
  // Sanitize API keys in query parameters
  result = result.replace(
    /([?&])(api_key|apikey|key|token|access_token)=([^&\s'"]+)/gi,
    `$1$2=${placeholder}`
  );
  
  return result;
}

/**
 * Check if an object contains any sensitive fields
 * 
 * @param obj - The object to check
 * @param options - Options with additional/excluded fields
 * @returns True if any sensitive fields are found
 */
export function containsSensitiveFields(
  obj: Record<string, unknown>,
  options: SanitizeOptions = {}
): boolean {
  const keys = Object.keys(obj);
  return keys.some(key => isSensitiveField(key, options));
}

/**
 * Get list of sensitive fields in an object
 * 
 * @param obj - The object to inspect
 * @param options - Options with additional/excluded fields
 * @returns Array of sensitive field names found
 */
export function getSensitiveFields(
  obj: Record<string, unknown>,
  options: SanitizeOptions = {}
): string[] {
  return Object.keys(obj).filter(key => isSensitiveField(key, options));
}

/**
 * Remove sensitive fields entirely (instead of masking)
 * 
 * @param obj - The object to process
 * @param options - Sanitization options
 * @returns New object with sensitive fields removed
 */
export function removeSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  options: SanitizeOptions = {}
): Partial<T> {
  const result: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (!isSensitiveField(key, options)) {
      if (options.deep !== false && typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key as keyof T] = removeSensitiveFields(
          value as Record<string, unknown>,
          options
        ) as T[keyof T];
      } else {
        result[key as keyof T] = value as T[keyof T];
      }
    }
  }
  
  return result;
}

/**
 * Sanitize for logging (removes sensitive data and formats for log output)
 * 
 * @param obj - The object to sanitize for logging
 * @returns Sanitized string representation
 */
export function sanitizeForLog(obj: unknown): string {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized = sanitizeObject(obj as Record<string, unknown>, { deep: true });
    return JSON.stringify(sanitized, null, 2);
  }
  
  return String(obj);
}
