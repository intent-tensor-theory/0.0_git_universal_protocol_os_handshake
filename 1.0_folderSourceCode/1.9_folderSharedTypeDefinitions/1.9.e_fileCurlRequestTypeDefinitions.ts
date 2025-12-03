// ============================================
// PROTOCOL OS - CURL REQUEST TYPE DEFINITIONS
// ============================================
// Address: 1.9.e
// Purpose: Define CurlRequest types for cURL command storage
// ============================================

/**
 * Supported file types for input/output operations
 */
export type SupportedFileType =
  | 'text'
  | 'json'
  | 'xml'
  | 'csv'
  | 'binary'
  | 'image'
  | 'pdf'
  | 'html';

/**
 * Test data storage structure
 */
export interface TestData {
  /** Text input for testing */
  textInput?: string;
  
  /** File name if file was used */
  fileName?: string;
  
  /** File content (base64 for binary, text otherwise) */
  fileContent?: string;
  
  /** MIME type of the file */
  mimeType?: string;
  
  /** Last test timestamp */
  lastTestedAt?: string;
  
  /** Last test result status */
  lastTestStatus?: 'success' | 'failure';
}

/**
 * CurlRequest represents a stored cURL command template.
 * Used for quick re-execution with variable substitution.
 * 
 * Serial Format: CURL-XXXX
 */
export interface CurlRequest {
  /** Unique identifier (UUID format) */
  id: string;
  
  /** Serial number segment */
  serial: string;
  
  /** Display name for this cURL request */
  name: string;
  
  /** 
   * The cURL command template.
   * May contain {INPUT} placeholder for dynamic substitution.
   */
  command: string;
  
  /** File types this request can accept as input */
  supportedFileTypes: SupportedFileType[];
  
  /** Currently selected file type for testing */
  selectedTestFileType: SupportedFileType | null;
  
  /** Stored test data for this request */
  testData: TestData;
}

/**
 * Partial CurlRequest for updates
 */
export type CurlRequestUpdate = Partial<Omit<CurlRequest, 'id'>> & { id: string };

/**
 * CurlRequest creation payload
 */
export type CurlRequestCreate = Omit<CurlRequest, 'id' | 'serial'>;

/**
 * Default values for new CurlRequest
 */
export const DEFAULT_CURL_REQUEST: Omit<CurlRequest, 'id' | 'serial'> = {
  name: 'New Curl Request',
  command: 'curl -X GET "https://api.example.com/ping"',
  supportedFileTypes: [],
  selectedTestFileType: null,
  testData: {},
};

/**
 * Parsed cURL command structure
 */
export interface ParsedCurlCommand {
  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method: string;
  
  /** Target URL */
  url: string;
  
  /** Headers as key-value pairs */
  headers: Record<string, string>;
  
  /** Request body (if any) */
  body?: string;
  
  /** Basic auth credentials (if -u flag used) */
  basicAuth?: {
    username: string;
    password: string;
  };
  
  /** Whether to follow redirects (-L flag) */
  followRedirects: boolean;
  
  /** Whether verbose mode is enabled (-v flag) */
  verbose: boolean;
}

/**
 * CurlRequest with parent handshake context
 */
export interface CurlRequestWithContext extends CurlRequest {
  parentHandshakeId: string;
  parentHandshakeSerial: string;
}
