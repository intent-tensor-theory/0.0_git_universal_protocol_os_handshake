// ============================================
// PROTOCOL OS - PLATFORM SERIAL NUMBER GENERATOR
// ============================================
// Address: 1.4.1.a
// Purpose: Generate Unique Platform Installation Identifiers
// ============================================

/**
 * Platform Serial Number Generator
 * 
 * Generates unique serial numbers for Protocol OS platform installations.
 * These serve as the root of the serial number hierarchy.
 * 
 * Serial Number Format:
 *   POS-{VERSION}-{TIMESTAMP}-{RANDOM}-{CHECKSUM}
 * 
 * Example:
 *   POS-1.0.0-20241203-A7B3C9D1-F2
 * 
 * Hierarchy:
 *   Platform Serial (this) → Resource Serial → Handshake Serial
 */

/**
 * Platform edition types
 */
export type PlatformEdition = 
  | 'community'   // Free/open source
  | 'professional' // Paid individual
  | 'enterprise'   // Organization license
  | 'developer';   // Development/testing

/**
 * Platform installation type
 */
export type InstallationType = 
  | 'standalone'   // Single machine
  | 'cloud'        // Cloud-hosted
  | 'embedded'     // Embedded in another app
  | 'container';   // Docker/K8s

/**
 * Platform serial number structure
 */
export interface PlatformSerialNumber {
  /** Full serial number string */
  serial: string;
  
  /** Parsed components */
  components: {
    prefix: string;      // 'POS'
    version: string;     // e.g., '1.0.0'
    timestamp: string;   // YYYYMMDD
    random: string;      // 8 hex chars
    checksum: string;    // 2 hex chars
  };
  
  /** Metadata */
  metadata: {
    edition: PlatformEdition;
    installationType: InstallationType;
    generatedAt: Date;
    expiresAt?: Date;
    machineFingerprint?: string;
  };
  
  /** Validation status */
  isValid: boolean;
}

/**
 * Platform serial generation options
 */
export interface PlatformSerialOptions {
  /** Platform version */
  version?: string;
  
  /** Platform edition */
  edition?: PlatformEdition;
  
  /** Installation type */
  installationType?: InstallationType;
  
  /** Expiration date (for trial/time-limited) */
  expiresAt?: Date;
  
  /** Machine fingerprint for binding */
  machineFingerprint?: string;
  
  /** Custom prefix (default: 'POS') */
  prefix?: string;
}

/**
 * Serial number validation result
 */
export interface SerialValidationResult {
  isValid: boolean;
  error?: string;
  components?: PlatformSerialNumber['components'];
}

/**
 * Platform Serial Number Generator
 */
export class PlatformSerialNumberGenerator {
  private static readonly DEFAULT_PREFIX = 'POS';
  private static readonly DEFAULT_VERSION = '1.0.0';
  private static readonly SERIAL_REGEX = /^([A-Z]{2,4})-(\d+\.\d+\.\d+)-(\d{8})-([A-F0-9]{8})-([A-F0-9]{2})$/;

  // ============================================
  // GENERATION
  // ============================================

  /**
   * Generate a new platform serial number
   */
  static generate(options: PlatformSerialOptions = {}): PlatformSerialNumber {
    const prefix = options.prefix || this.DEFAULT_PREFIX;
    const version = options.version || this.DEFAULT_VERSION;
    const edition = options.edition || 'community';
    const installationType = options.installationType || 'standalone';
    const now = new Date();

    // Generate timestamp (YYYYMMDD)
    const timestamp = this.formatDate(now);

    // Generate random component (8 hex chars)
    const random = this.generateRandom(8);

    // Generate checksum
    const checksumInput = `${prefix}-${version}-${timestamp}-${random}`;
    const checksum = this.calculateChecksum(checksumInput);

    // Assemble serial
    const serial = `${prefix}-${version}-${timestamp}-${random}-${checksum}`;

    return {
      serial,
      components: {
        prefix,
        version,
        timestamp,
        random,
        checksum,
      },
      metadata: {
        edition,
        installationType,
        generatedAt: now,
        expiresAt: options.expiresAt,
        machineFingerprint: options.machineFingerprint,
      },
      isValid: true,
    };
  }

  /**
   * Generate a trial serial (expires in 30 days)
   */
  static generateTrial(options: Omit<PlatformSerialOptions, 'expiresAt'> = {}): PlatformSerialNumber {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    return this.generate({
      ...options,
      edition: 'community',
      expiresAt,
    });
  }

  /**
   * Generate a machine-bound serial
   */
  static generateMachineBound(
    fingerprint: string,
    options: Omit<PlatformSerialOptions, 'machineFingerprint'> = {}
  ): PlatformSerialNumber {
    return this.generate({
      ...options,
      machineFingerprint: fingerprint,
    });
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validate a serial number string
   */
  static validate(serial: string): SerialValidationResult {
    // Check format
    const match = serial.match(this.SERIAL_REGEX);
    if (!match) {
      return {
        isValid: false,
        error: 'Invalid serial number format',
      };
    }

    const [, prefix, version, timestamp, random, checksum] = match;

    // Verify checksum
    const checksumInput = `${prefix}-${version}-${timestamp}-${random}`;
    const expectedChecksum = this.calculateChecksum(checksumInput);
    
    if (checksum !== expectedChecksum) {
      return {
        isValid: false,
        error: 'Invalid checksum',
      };
    }

    // Validate timestamp
    if (!this.isValidDate(timestamp)) {
      return {
        isValid: false,
        error: 'Invalid timestamp',
      };
    }

    return {
      isValid: true,
      components: {
        prefix,
        version,
        timestamp,
        random,
        checksum,
      },
    };
  }

  /**
   * Parse a serial number string
   */
  static parse(serial: string): PlatformSerialNumber | null {
    const validation = this.validate(serial);
    if (!validation.isValid || !validation.components) {
      return null;
    }

    return {
      serial,
      components: validation.components,
      metadata: {
        edition: 'community', // Cannot be determined from serial alone
        installationType: 'standalone',
        generatedAt: this.parseDate(validation.components.timestamp),
      },
      isValid: true,
    };
  }

  /**
   * Check if serial is expired
   */
  static isExpired(serialOrExpiry: string | Date): boolean {
    if (serialOrExpiry instanceof Date) {
      return serialOrExpiry.getTime() < Date.now();
    }
    
    // Cannot determine expiry from serial string alone
    // Would need to look up in database
    return false;
  }

  /**
   * Check if serial matches machine fingerprint
   */
  static matchesFingerprint(
    serial: PlatformSerialNumber,
    fingerprint: string
  ): boolean {
    return serial.metadata.machineFingerprint === fingerprint;
  }

  // ============================================
  // FINGERPRINTING
  // ============================================

  /**
   * Generate machine fingerprint
   * Uses available system information to create a unique identifier
   */
  static async generateMachineFingerprint(): Promise<string> {
    const components: string[] = [];

    // Browser fingerprint (client-side)
    if (typeof navigator !== 'undefined') {
      components.push(navigator.userAgent);
      components.push(navigator.language);
      components.push(String(navigator.hardwareConcurrency || 0));
      components.push(String(screen?.width || 0));
      components.push(String(screen?.height || 0));
      components.push(String(screen?.colorDepth || 0));
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }

    // Node.js fingerprint (server-side)
    if (typeof process !== 'undefined' && process.platform) {
      components.push(process.platform);
      components.push(process.arch);
      // Note: In real implementation, would include MAC address, disk serial, etc.
    }

    // Hash the components
    const data = components.join('|');
    const hash = await this.sha256(data);
    
    return hash.substring(0, 32).toUpperCase();
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Format date as YYYYMMDD
   */
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Parse YYYYMMDD to Date
   */
  private static parseDate(dateStr: string): Date {
    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);
    return new Date(year, month, day);
  }

  /**
   * Validate YYYYMMDD format
   */
  private static isValidDate(dateStr: string): boolean {
    if (!/^\d{8}$/.test(dateStr)) return false;
    const date = this.parseDate(dateStr);
    return !isNaN(date.getTime());
  }

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

  /**
   * SHA-256 hash
   */
  private static async sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ============================================
  // FORMATTING
  // ============================================

  /**
   * Format serial for display (with dashes)
   */
  static format(serial: string): string {
    // Already formatted
    if (serial.includes('-')) return serial;
    
    // Parse unformatted serial
    const parts = [
      serial.substring(0, 3),  // POS
      serial.substring(3, 8),  // Version
      serial.substring(8, 16), // Date
      serial.substring(16, 24), // Random
      serial.substring(24, 26), // Checksum
    ];
    
    return parts.join('-');
  }

  /**
   * Remove formatting from serial
   */
  static unformat(serial: string): string {
    return serial.replace(/-/g, '');
  }

  /**
   * Mask serial for display (show first and last parts)
   */
  static mask(serial: string): string {
    const parts = serial.split('-');
    if (parts.length < 5) return '***';
    return `${parts[0]}-***-***-${parts[4]}`;
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Generate multiple serial numbers
   */
  static generateBatch(
    count: number,
    options: PlatformSerialOptions = {}
  ): PlatformSerialNumber[] {
    const serials: PlatformSerialNumber[] = [];
    for (let i = 0; i < count; i++) {
      serials.push(this.generate(options));
    }
    return serials;
  }

  /**
   * Validate multiple serial numbers
   */
  static validateBatch(serials: string[]): Map<string, SerialValidationResult> {
    const results = new Map<string, SerialValidationResult>();
    for (const serial of serials) {
      results.set(serial, this.validate(serial));
    }
    return results;
  }
}

/**
 * Edition capabilities
 */
export const EDITION_CAPABILITIES: Record<PlatformEdition, {
  maxResources: number;
  maxHandshakes: number;
  features: string[];
}> = {
  community: {
    maxResources: 10,
    maxHandshakes: 100,
    features: ['basic-protocols', 'local-storage'],
  },
  professional: {
    maxResources: 100,
    maxHandshakes: 10000,
    features: ['basic-protocols', 'advanced-protocols', 'cloud-sync', 'export'],
  },
  enterprise: {
    maxResources: -1, // Unlimited
    maxHandshakes: -1,
    features: ['all-protocols', 'cloud-sync', 'export', 'sso', 'audit-log', 'support'],
  },
  developer: {
    maxResources: 50,
    maxHandshakes: 5000,
    features: ['all-protocols', 'debug-mode', 'api-access'],
  },
};

export default PlatformSerialNumberGenerator;
