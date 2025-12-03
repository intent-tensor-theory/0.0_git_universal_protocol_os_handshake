// ============================================
// PROTOCOL OS - CORE TYPE DEFINITIONS
// ============================================
// Address: 1.9.a
// Purpose: Shared types used across the application
// ============================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    requestId?: string;
    duration?: number;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Generic ID type
 */
export type EntityId = string;

/**
 * Timestamp fields
 */
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

/**
 * Base entity with ID and timestamps
 */
export interface BaseEntity extends Timestamps {
  id: EntityId;
}

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * HTTP Headers
 */
export type HttpHeaders = Record<string, string>;

/**
 * Query Parameters
 */
export type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * JSON Value types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/**
 * Deep partial type utility
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Omit by value type
 */
export type OmitByType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};

/**
 * Extract keys of specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Nullable type
 */
export type Nullable<T> = T | null;

/**
 * Optional type
 */
export type Optional<T> = T | undefined;

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Event handler type
 */
export type EventHandler<T = void> = (event: T) => void;

/**
 * Async event handler type
 */
export type AsyncEventHandler<T = void> = (event: T) => Promise<void>;

/**
 * Callback function type
 */
export type Callback<T = void, R = void> = (value: T) => R;

/**
 * Async callback function type
 */
export type AsyncCallback<T = void, R = void> = (value: T) => Promise<R>;

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Filter operator
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn';

/**
 * Filter condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Size variant
 */
export type SizeVariant = 'small' | 'medium' | 'large';

/**
 * Status variant
 */
export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'pending';
