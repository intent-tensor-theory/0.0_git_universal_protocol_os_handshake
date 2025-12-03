// ============================================
// PROTOCOL OS - RESOURCE SERIAL NUMBER GENERATOR
// ============================================
// Address: 1.4.1.b
// Purpose: Generate Unique Resource Identifiers
// ============================================

import { PlatformSerialNumberGenerator } from './1.4.1.a_filePlatformSerialNumberGenerator';

/**
 * Resource Serial Number Generator
 * 
 * Generates unique serial numbers for resources (API connections,
 * protocol configurations, credential sets).
 * 
 * Serial Number Format:
 *   RES-{PLATFORM_SHORT}-{TYPE}-{SEQUENCE}-{RANDOM}-{CHECKSUM}
 * 
 * Example:
 *   RES-A7B3-OAUTH-0001-C9D1E2F3-A4
 * 
 * Hierarchy:
 *   Platform Serial → Resource Serial (this) → Handshake Serial
 */

/**
 * Resource types
 */
export type ResourceType =
  | 'oauth'       // OAuth authentication
  | 'apikey'      // API key authentication
  | 'graphql'     // GraphQL endpoint
  | 'rest'        // REST API endpoint
  | 'websocket'   // WebSocket connection
  | 'soap'        // SOAP service
  | 'github'      // GitHub integration
  | 'scraper'     // Web scraper
  | 'custom';     // Custom protocol

/**
 * Resource status
 */
export type ResourceStatus =
  | 'active'      // Currently in use
  | 'inactive'    // Configured but not active
  | 'expired'     // Credentials expired
  | 'revoked'     // Manually revoked
  | 'error';      // Configuration error

/**
 * Resource serial number structure
 */
export interface ResourceSerialNumber {
  /** Full serial number string */
  serial: string;
  
  /** Parsed components */
  components: {
    prefix: string;         // 'RES'
    platformShort: string;  // First 4 chars of platform serial random
    type: string;           // Resource type (uppercase)
    sequence: string;       // 4-digit sequence number
    random: string;         // 8 hex chars
    checksum: string;       // 2 hex chars
  };
  
  /** Metadata */
  metadata: {
    platformSerial: string;
    resourceType: ResourceType;
    name: string;
    description?: string;
    status: ResourceStatus;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt?: Date;
    expiresAt?: Date;
  };
  
  /** Parent reference */
  parentSerial: string;
  
  /** Validation status */
  isValid: boolean;
}

/**
 * Resource serial generation options
 */
export interface ResourceSerialOptions {
  /** Parent platform serial */
  platformSerial: string;
  
  /** Resource type */
  resourceType: ResourceType;
  
  /** Resource name */
  name: string;
  
  /** Resource description */
  description?: string;
  
  /** Sequence number (auto-generated if not provided) */
  sequence?: number;
  
  /** Expiration date */
  expiresAt?: Date;
}

/**
 * Resource serial validation result
 */
export interface ResourceValidationResult {
  isValid: boolean;
  error?: string;
  components?: ResourceSerialNumber['components'];
  parentValid?: boolean;
}

/**
 * Resource Serial Number Generator
 */
export class ResourceSerialNumberGenerator {
  private static readonly PREFIX = 'RES';
  private static readonly SERIAL_REGEX = /^RES-([A-F0-9]{4})-([A-Z]+)-(\d{4})-([A-F0-9]{8})-([A-F0-9]{2})$/;
  private static sequenceCounter: Map<string, number> = new Map();

  // ============================================
  // GENERATION
  // ============================================

  /**
   * Generate a new resource serial number
   */
  static generate(options: ResourceSerialOptions): ResourceSerialNumber {
    const now = new Date();

    // Validate parent platform serial
    const parentValidation = PlatformSerialNumberGenerator.validate(options.platformSerial);
    if (!parentValidation.isValid) {
      throw new Error(`Invalid platform serial: ${parentValidation.error}`);
    }

    // Extract platform short identifier
    const platformShort = parentValidation.components!.random.substring(0, 4);

    // Get resource type code
    const typeCode = this.getTypeCode(options.resourceType);

    // Get or generate sequence number
    const sequenceKey = `${options.platformSerial}-${typeCode}`;
    let sequence = options.sequence;
    if (sequence === undefined) {
      sequence = (this.sequenceCounter.get(sequenceKey) || 0) + 1;
      this.sequenceCounter.set(sequenceKey, sequence);
    }
    const sequenceStr = String(sequence).padStart(4, '0');

    // Generate random component
    const random = this.generateRandom(8);

    // Calculate checksum
    const checksumInput = `${this.PREFIX}-${platformShort}-${typeCode}-${sequenceStr}-${random}`;
    const checksum = this.calculateChecksum(checksumInput);

    // Assemble serial
    const serial = `${this.PREFIX}-${platformShort}-${typeCode}-${sequenceStr}-${random}-${checksum}`;

    return {
      serial,
      components: {
        prefix: this.PREFIX,
        platformShort,
        type: typeCode,
        sequence: sequenceStr,
        random,
        checksum,
      },
      metadata: {
        platformSerial: options.platformSerial,
        resourceType: options.resourceType,
        name: options.name,
        description: options.description,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        expiresAt: options.expiresAt,
      },
      parentSerial: options.platformSerial,
      isValid: true,
    };
  }

  /**
   * Generate resource serial for specific protocol type
   */
  static generateForProtocol(
    platformSerial: string,
    protocolType: string,
    name: string
  ): ResourceSerialNumber {
    const resourceType = this.protocolToResourceType(protocolType);
    return this.generate({
      platformSerial,
      resourceType,
      name,
    });
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validate a resource serial number string
   */
  static validate(serial: string, platformSerial?: string): ResourceValidationResult {
    // Check format
    const match = serial.match(this.SERIAL_REGEX);
    if (!match) {
      return {
        isValid: false,
        error: 'Invalid resource serial number format',
      };
    }

    const [, platformShort, type, sequence, random, checksum] = match;

    // Verify checksum
    const checksumInput = `${this.PREFIX}-${platformShort}-${type}-${sequence}-${random}`;
    const expectedChecksum = this.calculateChecksum(checksumInput);
    
    if (checksum !== expectedChecksum) {
      return {
        isValid: false,
        error: 'Invalid checksum',
      };
    }

    // Verify type is valid
    if (!this.isValidTypeCode(type)) {
      return {
        isValid: false,
        error: `Invalid resource type: ${type}`,
      };
    }

    // Validate parent if provided
    let parentValid: boolean | undefined;
    if (platformSerial) {
      const parentValidation = PlatformSerialNumberGenerator.validate(platformSerial);
      parentValid = parentValidation.isValid;
      
      if (parentValid) {
        const expectedPlatformShort = parentValidation.components!.random.substring(0, 4);
        if (platformShort !== expectedPlatformShort) {
          return {
            isValid: false,
            error: 'Resource serial does not match platform serial',
            parentValid: true,
          };
        }
      }
    }

    return {
      isValid: true,
      components: {
        prefix: this.PREFIX,
        platformShort,
        type,
        sequence,
        random,
        checksum,
      },
      parentValid,
    };
  }

  /**
   * Parse a resource serial number string
   */
  static parse(serial: string): Partial<ResourceSerialNumber> | null {
    const validation = this.validate(serial);
    if (!validation.isValid || !validation.components) {
      return null;
    }

    return {
      serial,
      components: validation.components,
      metadata: {
        platformSerial: '', // Cannot be determined from serial alone
        resourceType: this.typeCodeToResourceType(validation.components.type),
        name: '',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isValid: true,
    };
  }

  /**
   * Check if resource serial belongs to platform
   */
  static belongsToPlatform(resourceSerial: string, platformSerial: string): boolean {
    const validation = this.validate(resourceSerial, platformSerial);
    return validation.isValid && validation.parentValid === true;
  }

  // ============================================
  // TYPE MAPPING
  // ============================================

  /**
   * Get type code from resource type
   */
  private static getTypeCode(type: ResourceType): string {
    const typeCodes: Record<ResourceType, string> = {
      oauth: 'OAUTH',
      apikey: 'APIKEY',
      graphql: 'GRAPHQL',
      rest: 'REST',
      websocket: 'WEBSOCK',
      soap: 'SOAP',
      github: 'GITHUB',
      scraper: 'SCRAPER',
      custom: 'CUSTOM',
    };
    return typeCodes[type] || 'CUSTOM';
  }

  /**
   * Get resource type from type code
   */
  private static typeCodeToResourceType(code: string): ResourceType {
    const codeToType: Record<string, ResourceType> = {
      OAUTH: 'oauth',
      APIKEY: 'apikey',
      GRAPHQL: 'graphql',
      REST: 'rest',
      WEBSOCK: 'websocket',
      SOAP: 'soap',
      GITHUB: 'github',
      SCRAPER: 'scraper',
      CUSTOM: 'custom',
    };
    return codeToType[code] || 'custom';
  }

  /**
   * Check if type code is valid
   */
  private static isValidTypeCode(code: string): boolean {
    const validCodes = ['OAUTH', 'APIKEY', 'GRAPHQL', 'REST', 'WEBSOCK', 'SOAP', 'GITHUB', 'SCRAPER', 'CUSTOM'];
    return validCodes.includes(code);
  }

  /**
   * Map protocol type to resource type
   */
  private static protocolToResourceType(protocolType: string): ResourceType {
    const mapping: Record<string, ResourceType> = {
      'oauth-pkce': 'oauth',
      'oauth-authcode': 'oauth',
      'oauth-implicit': 'oauth',
      'oauth-client-credentials': 'oauth',
      'api-key': 'apikey',
      'graphql': 'graphql',
      'rest': 'rest',
      'websocket': 'websocket',
      'soap': 'soap',
      'github': 'github',
      'keyless-scraper': 'scraper',
      'curl': 'custom',
    };
    return mapping[protocolType.toLowerCase()] || 'custom';
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Generate random hex string
   */
  private static generateRandom(length: number): string {
    const array = new Uint8Array(length / 2);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  /**
   * Calculate checksum (2 hex chars)
   */
  private static calculateChecksum(input: string): string {
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      sum = (sum + input.charCodeAt(i) * (i + 1)) % 256;
    }
    return sum.toString(16).padStart(2, '0').toUpperCase();
  }

  // ============================================
  // SEQUENCE MANAGEMENT
  // ============================================

  /**
   * Get current sequence for platform/type combination
   */
  static getCurrentSequence(platformSerial: string, resourceType: ResourceType): number {
    const typeCode = this.getTypeCode(resourceType);
    const key = `${platformSerial}-${typeCode}`;
    return this.sequenceCounter.get(key) || 0;
  }

  /**
   * Set sequence counter (for initialization)
   */
  static setSequence(platformSerial: string, resourceType: ResourceType, sequence: number): void {
    const typeCode = this.getTypeCode(resourceType);
    const key = `${platformSerial}-${typeCode}`;
    this.sequenceCounter.set(key, sequence);
  }

  /**
   * Reset sequence counter
   */
  static resetSequence(platformSerial?: string, resourceType?: ResourceType): void {
    if (!platformSerial) {
      this.sequenceCounter.clear();
      return;
    }
    
    if (resourceType) {
      const typeCode = this.getTypeCode(resourceType);
      const key = `${platformSerial}-${typeCode}`;
      this.sequenceCounter.delete(key);
    } else {
      // Reset all types for this platform
      for (const [key] of this.sequenceCounter) {
        if (key.startsWith(platformSerial)) {
          this.sequenceCounter.delete(key);
        }
      }
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Generate multiple resource serial numbers
   */
  static generateBatch(
    platformSerial: string,
    resources: Array<{ resourceType: ResourceType; name: string; description?: string }>
  ): ResourceSerialNumber[] {
    return resources.map(resource =>
      this.generate({
        platformSerial,
        resourceType: resource.resourceType,
        name: resource.name,
        description: resource.description,
      })
    );
  }

  /**
   * Validate multiple resource serial numbers
   */
  static validateBatch(
    serials: string[],
    platformSerial?: string
  ): Map<string, ResourceValidationResult> {
    const results = new Map<string, ResourceValidationResult>();
    for (const serial of serials) {
      results.set(serial, this.validate(serial, platformSerial));
    }
    return results;
  }

  // ============================================
  // FORMATTING
  // ============================================

  /**
   * Format serial for display
   */
  static format(serial: string): string {
    return serial; // Already formatted with dashes
  }

  /**
   * Mask serial for display
   */
  static mask(serial: string): string {
    const parts = serial.split('-');
    if (parts.length < 6) return '***';
    return `${parts[0]}-${parts[1]}-${parts[2]}-****-${parts[5]}`;
  }

  /**
   * Get display name for resource type
   */
  static getTypeDisplayName(type: ResourceType): string {
    const displayNames: Record<ResourceType, string> = {
      oauth: 'OAuth Authentication',
      apikey: 'API Key',
      graphql: 'GraphQL Endpoint',
      rest: 'REST API',
      websocket: 'WebSocket Connection',
      soap: 'SOAP Service',
      github: 'GitHub Integration',
      scraper: 'Web Scraper',
      custom: 'Custom Protocol',
    };
    return displayNames[type] || type;
  }
}

/**
 * Resource type icons
 */
export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  oauth: 'key',
  apikey: 'lock',
  graphql: 'git-branch',
  rest: 'server',
  websocket: 'zap',
  soap: 'file-code',
  github: 'github',
  scraper: 'globe',
  custom: 'settings',
};

export default ResourceSerialNumberGenerator;
