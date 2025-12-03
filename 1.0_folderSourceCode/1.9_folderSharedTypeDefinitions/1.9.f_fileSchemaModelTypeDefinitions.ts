// ============================================
// PROTOCOL OS - SCHEMA MODEL TYPE DEFINITIONS
// ============================================
// Address: 1.9.f
// Purpose: Define SchemaModel types for structured request templates
// ============================================

import type { SupportedFileType, TestData } from './1.9.e_fileCurlRequestTypeDefinitions';

/**
 * Schema field types for form generation
 */
export type SchemaFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'file'
  | 'select'
  | 'multiselect'
  | 'textarea'
  | 'password'
  | 'email'
  | 'url'
  | 'date'
  | 'datetime';

/**
 * Individual field definition within a schema
 */
export interface SchemaField {
  /** Field name (used as key in output) */
  name: string;
  
  /** Display label for the field */
  label: string;
  
  /** Field data type */
  type: SchemaFieldType;
  
  /** Whether this field is required */
  required: boolean;
  
  /** Default value for the field */
  defaultValue?: string | number | boolean;
  
  /** Placeholder text for input */
  placeholder?: string;
  
  /** Help text / description */
  description?: string;
  
  /** Options for select/multiselect types */
  options?: Array<{ label: string; value: string }>;
  
  /** Validation pattern (regex) */
  pattern?: string;
  
  /** Minimum value (for numbers) or length (for strings) */
  min?: number;
  
  /** Maximum value (for numbers) or length (for strings) */
  max?: number;
  
  /** Nested fields (for object type) */
  children?: SchemaField[];
}

/**
 * SchemaModel represents a structured input template.
 * Used for form-based request building instead of raw cURL.
 * 
 * Serial Format: MOD-XXXX
 */
export interface SchemaModel {
  /** Unique identifier (UUID format) */
  id: string;
  
  /** Serial number segment */
  serial: string;
  
  /** Display name for this schema model */
  name: string;
  
  /** 
   * JSON schema definition string.
   * Can be a JSON Schema object or a custom template format.
   */
  schema: string;
  
  /** Parsed fields for form generation */
  fields?: SchemaField[];
  
  /** File types this model can accept as input */
  supportedFileTypes?: SupportedFileType[];
  
  /** Currently selected file type for testing */
  selectedTestFileType: SupportedFileType | null;
  
  /** Stored test data for this model */
  testData: TestData;
  
  /** Output format (how to serialize the filled form) */
  outputFormat?: 'json' | 'xml' | 'form-data' | 'query-string';
  
  /** Base URL for the request (if different from handshake) */
  endpointOverride?: string;
  
  /** HTTP method override */
  methodOverride?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

/**
 * Partial SchemaModel for updates
 */
export type SchemaModelUpdate = Partial<Omit<SchemaModel, 'id'>> & { id: string };

/**
 * SchemaModel creation payload
 */
export type SchemaModelCreate = Omit<SchemaModel, 'id' | 'serial'>;

/**
 * Default values for new SchemaModel
 */
export const DEFAULT_SCHEMA_MODEL: Omit<SchemaModel, 'id' | 'serial'> = {
  name: 'New Schema Model',
  schema: JSON.stringify({
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Your input value' }
    }
  }, null, 2),
  selectedTestFileType: null,
  testData: {},
  outputFormat: 'json',
};

/**
 * SchemaModel with parent handshake context
 */
export interface SchemaModelWithContext extends SchemaModel {
  parentHandshakeId: string;
  parentHandshakeSerial: string;
}

/**
 * Filled schema result (after user fills the form)
 */
export interface FilledSchemaResult {
  /** The schema model that was filled */
  schemaModelId: string;
  
  /** Filled values keyed by field name */
  values: Record<string, unknown>;
  
  /** Serialized output ready for request */
  serializedOutput: string;
  
  /** Timestamp of when the form was filled */
  filledAt: string;
}
