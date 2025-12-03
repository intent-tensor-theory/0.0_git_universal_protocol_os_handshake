// ============================================
// PROTOCOL OS - HANDSHAKE SERIAL NUMBER GENERATOR
// ============================================
// Address: 1.4.1.c
// Purpose: Generate Unique Handshake Event Identifiers
// ============================================

import { ResourceSerialNumberGenerator } from './1.4.1.b_fileResourceSerialNumberGenerator';

/**
 * Handshake Serial Number Generator
 * 
 * Generates unique serial numbers for individual handshake events
 * (authentication attempts, token refreshes, API calls).
 * 
 * Serial Number Format:
 *   HSK-{RESOURCE_SHORT}-{TIMESTAMP}-{OUTCOME}-{SEQUENCE}-{CHECKSUM}
 * 
 * Example:
 *   HSK-C9D1-1701619200-OK-0001-B7
 * 
 * Hierarchy:
 *   Platform Serial → Resource Serial → Handshake Serial (this)
 */

/**
 * Handshake outcome types
 */
export type HandshakeOutcome =
  | 'OK'        // Successful handshake
  | 'FAIL'      // Failed authentication
  | 'TIMEOUT'   // Request timed out
  | 'REFRESH'   // Token refresh
  | 'REVOKE'    // Token revocation
  | 'PARTIAL'   // Partial success (e.g., some scopes granted)
  | 'RETRY'     // Retry attempt
  | 'PENDING';  // Awaiting completion (e.g., OAuth redirect)

/**
 * Handshake type
 */
export type HandshakeType =
  | 'auth'      // Initial authentication
  | 'refresh'   // Token refresh
  | 'revoke'    // Token revocation
  | 'validate'  // Token validation
  | 'request'   // API request
  | 'health'    // Health check
  | 'webhook';  // Webhook event

/**
 * Handshake serial number structure
 */
export interface HandshakeSerialNumber {
  /** Full serial number string */
  serial: string;
  
  /** Parsed components */
  components: {
    prefix: string;         // 'HSK'
    resourceShort: string;  // First 4 chars of resource serial random
    timestamp: string;      // Unix timestamp (seconds)
    outcome: HandshakeOutcome;
    sequence: string;       // 4-digit sequence
    checksum: string;       // 2 hex chars
  };
  
  /** Metadata */
  metadata: {
    resourceSerial: string;
    handshakeType: HandshakeType;
    outcome: HandshakeOutcome;
    startedAt: Date;
    completedAt?: Date;
    durationMs?: number;
    statusCode?: number;
    errorMessage?: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  
  /** Parent reference */
  parentSerial: string;
  
  /** Validation status */
  isValid: boolean;
}

/**
 * Handshake serial generation options
 */
export interface HandshakeSerialOptions {
  /** Parent resource serial */
  resourceSerial: string;
  
  /** Handshake type */
  handshakeType: HandshakeType;
  
  /** Handshake outcome */
  outcome: HandshakeOutcome;
  
  /** Start timestamp */
  startedAt?: Date;
  
  /** Completion timestamp */
  completedAt?: Date;
  
  /** HTTP status code */
  statusCode?: number;
  
  /** Error message if failed */
  errorMessage?: string;
  
  /** External request ID */
  requestId?: string;
  
  /** Client IP address */
  ipAddress?: string;
  
  /** Client User-Agent */
  userAgent?: string;
  
  /** Sequence number (auto-generated if not provided) */
  sequence?: number;
}

/**
 * Handshake serial validation result
 */
export interface HandshakeValidationResult {
  isValid: boolean;
  error?: string;
  components?: HandshakeSerialNumber['components'];
  parentValid?: boolean;
}

/**
 * Handshake statistics
 */
export interface HandshakeStats {
  total: number;
  successful: number;
  failed: number;
  timeouts: number;
  refreshes: number;
  averageDurationMs: number;
  successRate: number;
}

/**
 * Handshake Serial Number Generator
 */
export class HandshakeSerialNumberGenerator {
  private static readonly PREFIX = 'HSK';
  private static readonly SERIAL_REGEX = /^HSK-([A-F0-9]{4})-(\d{10})-([A-Z]+)-(\d{4})-([A-F0-9]{2})$/;
  private static sequenceCounter: Map<string, number> = new Map();
  private static handshakeHistory: HandshakeSerialNumber[] = [];
  private static readonly MAX_HISTORY = 10000;

  // ============================================
  // GENERATION
  // ============================================

  /**
   * Generate a new handshake serial number
   */
  static generate(options: HandshakeSerialOptions): HandshakeSerialNumber {
    const now = new Date();
    const startedAt = options.startedAt || now;
    const completedAt = options.completedAt || now;

    // Validate parent resource serial
    const parentValidation = ResourceSerialNumberGenerator.validate(options.resourceSerial);
    if (!parentValidation.isValid) {
      throw new Error(`Invalid resource serial: ${parentValidation.error}`);
    }

    // Extract resource short identifier
    const resourceShort = parentValidation.components!.random.substring(0, 4);

    // Generate timestamp (Unix seconds)
    const timestamp = Math.floor(startedAt.getTime() / 1000).toString();

    // Get or generate sequence number
    const sequenceKey = `${options.resourceSerial}-${timestamp}`;
    let sequence = options.sequence;
    if (sequence === undefined) {
      sequence = (this.sequenceCounter.get(sequenceKey) || 0) + 1;
      this.sequenceCounter.set(sequenceKey, sequence);
    }
    const sequenceStr = String(sequence).padStart(4, '0');

    // Calculate checksum
    const checksumInput = `${this.PREFIX}-${resourceShort}-${timestamp}-${options.outcome}-${sequenceStr}`;
    const checksum = this.calculateChecksum(checksumInput);

    // Assemble serial
    const serial = `${this.PREFIX}-${resourceShort}-${timestamp}-${options.outcome}-${sequenceStr}-${checksum}`;

    // Calculate duration
    const durationMs = completedAt.getTime() - startedAt.getTime();

    const handshake: HandshakeSerialNumber = {
      serial,
      components: {
        prefix: this.PREFIX,
        resourceShort,
        timestamp,
        outcome: options.outcome,
        sequence: sequenceStr,
        checksum,
      },
      metadata: {
        resourceSerial: options.resourceSerial,
        handshakeType: options.handshakeType,
        outcome: options.outcome,
        startedAt,
        completedAt,
        durationMs,
        statusCode: options.statusCode,
        errorMessage: options.errorMessage,
        requestId: options.requestId,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
      parentSerial: options.resourceSerial,
      isValid: true,
    };

    // Add to history
    this.addToHistory(handshake);

    return handshake;
  }

  /**
   * Generate a successful handshake serial
   */
  static generateSuccess(
    resourceSerial: string,
    handshakeType: HandshakeType,
    statusCode = 200,
    durationMs?: number
  ): HandshakeSerialNumber {
    const startedAt = new Date();
    const completedAt = durationMs 
      ? new Date(startedAt.getTime() + durationMs)
      : startedAt;

    return this.generate({
      resourceSerial,
      handshakeType,
      outcome: 'OK',
      startedAt,
      completedAt,
      statusCode,
    });
  }

  /**
   * Generate a failed handshake serial
   */
  static generateFailure(
    resourceSerial: string,
    handshakeType: HandshakeType,
    errorMessage: string,
    statusCode?: number
  ): HandshakeSerialNumber {
    return this.generate({
      resourceSerial,
      handshakeType,
      outcome: 'FAIL',
      statusCode,
      errorMessage,
    });
  }

  /**
   * Generate a timeout handshake serial
   */
  static generateTimeout(
    resourceSerial: string,
    handshakeType: HandshakeType,
    timeoutMs: number
  ): HandshakeSerialNumber {
    const startedAt = new Date(Date.now() - timeoutMs);
    return this.generate({
      resourceSerial,
      handshakeType,
      outcome: 'TIMEOUT',
      startedAt,
      errorMessage: `Request timed out after ${timeoutMs}ms`,
    });
  }

  /**
   * Generate a token refresh handshake serial
   */
  static generateRefresh(
    resourceSerial: string,
    success: boolean,
    statusCode?: number
  ): HandshakeSerialNumber {
    return this.generate({
      resourceSerial,
      handshakeType: 'refresh',
      outcome: success ? 'REFRESH' : 'FAIL',
      statusCode,
    });
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validate a handshake serial number string
   */
  static validate(serial: string, resourceSerial?: string): HandshakeValidationResult {
    // Check format
    const match = serial.match(this.SERIAL_REGEX);
    if (!match) {
      return {
        isValid: false,
        error: 'Invalid handshake serial number format',
      };
    }

    const [, resourceShort, timestamp, outcome, sequence, checksum] = match;

    // Verify checksum
    const checksumInput = `${this.PREFIX}-${resourceShort}-${timestamp}-${outcome}-${sequence}`;
    const expectedChecksum = this.calculateChecksum(checksumInput);
    
    if (checksum !== expectedChecksum) {
      return {
        isValid: false,
        error: 'Invalid checksum',
      };
    }

    // Verify outcome is valid
    if (!this.isValidOutcome(outcome)) {
      return {
        isValid: false,
        error: `Invalid outcome: ${outcome}`,
      };
    }

    // Verify timestamp is reasonable
    const ts = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (ts > now + 86400 || ts < 1577836800) { // Future or before 2020
      return {
        isValid: false,
        error: 'Invalid timestamp',
      };
    }

    // Validate parent if provided
    let parentValid: boolean | undefined;
    if (resourceSerial) {
      const parentValidation = ResourceSerialNumberGenerator.validate(resourceSerial);
      parentValid = parentValidation.isValid;
      
      if (parentValid) {
        const expectedResourceShort = parentValidation.components!.random.substring(0, 4);
        if (resourceShort !== expectedResourceShort) {
          return {
            isValid: false,
            error: 'Handshake serial does not match resource serial',
            parentValid: true,
          };
        }
      }
    }

    return {
      isValid: true,
      components: {
        prefix: this.PREFIX,
        resourceShort,
        timestamp,
        outcome: outcome as HandshakeOutcome,
        sequence,
        checksum,
      },
      parentValid,
    };
  }

  /**
   * Parse a handshake serial number string
   */
  static parse(serial: string): Partial<HandshakeSerialNumber> | null {
    const validation = this.validate(serial);
    if (!validation.isValid || !validation.components) {
      return null;
    }

    const timestamp = parseInt(validation.components.timestamp, 10);

    return {
      serial,
      components: validation.components,
      metadata: {
        resourceSerial: '',
        handshakeType: 'request',
        outcome: validation.components.outcome,
        startedAt: new Date(timestamp * 1000),
      },
      isValid: true,
    };
  }

  /**
   * Check if handshake serial belongs to resource
   */
  static belongsToResource(handshakeSerial: string, resourceSerial: string): boolean {
    const validation = this.validate(handshakeSerial, resourceSerial);
    return validation.isValid && validation.parentValid === true;
  }

  /**
   * Check if outcome is valid
   */
  private static isValidOutcome(outcome: string): outcome is HandshakeOutcome {
    const validOutcomes = ['OK', 'FAIL', 'TIMEOUT', 'REFRESH', 'REVOKE', 'PARTIAL', 'RETRY', 'PENDING'];
    return validOutcomes.includes(outcome);
  }

  // ============================================
  // HISTORY & STATISTICS
  // ============================================

  /**
   * Add handshake to history
   */
  private static addToHistory(handshake: HandshakeSerialNumber): void {
    this.handshakeHistory.push(handshake);
    
    // Trim history if too large
    if (this.handshakeHistory.length > this.MAX_HISTORY) {
      this.handshakeHistory = this.handshakeHistory.slice(-this.MAX_HISTORY);
    }
  }

  /**
   * Get handshakes for resource
   */
  static getHandshakesForResource(resourceSerial: string): HandshakeSerialNumber[] {
    return this.handshakeHistory.filter(h => h.parentSerial === resourceSerial);
  }

  /**
   * Get recent handshakes
   */
  static getRecentHandshakes(limit = 100): HandshakeSerialNumber[] {
    return this.handshakeHistory.slice(-limit).reverse();
  }

  /**
   * Get handshake statistics
   */
  static getStats(resourceSerial?: string): HandshakeStats {
    let handshakes = this.handshakeHistory;
    
    if (resourceSerial) {
      handshakes = handshakes.filter(h => h.parentSerial === resourceSerial);
    }

    const total = handshakes.length;
    const successful = handshakes.filter(h => h.metadata.outcome === 'OK' || h.metadata.outcome === 'REFRESH').length;
    const failed = handshakes.filter(h => h.metadata.outcome === 'FAIL').length;
    const timeouts = handshakes.filter(h => h.metadata.outcome === 'TIMEOUT').length;
    const refreshes = handshakes.filter(h => h.metadata.outcome === 'REFRESH').length;

    const durations = handshakes
      .filter(h => h.metadata.durationMs !== undefined)
      .map(h => h.metadata.durationMs!);
    
    const averageDurationMs = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return {
      total,
      successful,
      failed,
      timeouts,
      refreshes,
      averageDurationMs: Math.round(averageDurationMs),
      successRate: total > 0 ? (successful / total) * 100 : 0,
    };
  }

  /**
   * Clear history
   */
  static clearHistory(resourceSerial?: string): void {
    if (resourceSerial) {
      this.handshakeHistory = this.handshakeHistory.filter(
        h => h.parentSerial !== resourceSerial
      );
    } else {
      this.handshakeHistory = [];
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

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
   * Get timestamp from serial
   */
  static getTimestamp(serial: string): Date | null {
    const parsed = this.parse(serial);
    return parsed?.metadata?.startedAt || null;
  }

  /**
   * Get outcome from serial
   */
  static getOutcome(serial: string): HandshakeOutcome | null {
    const parsed = this.parse(serial);
    return parsed?.components?.outcome || null;
  }

  // ============================================
  // SEQUENCE MANAGEMENT
  // ============================================

  /**
   * Reset sequence counter
   */
  static resetSequence(resourceSerial?: string): void {
    if (!resourceSerial) {
      this.sequenceCounter.clear();
      return;
    }
    
    for (const [key] of this.sequenceCounter) {
      if (key.startsWith(resourceSerial)) {
        this.sequenceCounter.delete(key);
      }
    }
  }

  // ============================================
  // FORMATTING
  // ============================================

  /**
   * Format serial for display
   */
  static format(serial: string): string {
    return serial;
  }

  /**
   * Mask serial for display
   */
  static mask(serial: string): string {
    const parts = serial.split('-');
    if (parts.length < 6) return '***';
    return `${parts[0]}-****-${parts[2]}-${parts[3]}-${parts[5]}`;
  }

  /**
   * Get display name for outcome
   */
  static getOutcomeDisplayName(outcome: HandshakeOutcome): string {
    const displayNames: Record<HandshakeOutcome, string> = {
      OK: 'Success',
      FAIL: 'Failed',
      TIMEOUT: 'Timed Out',
      REFRESH: 'Token Refreshed',
      REVOKE: 'Token Revoked',
      PARTIAL: 'Partial Success',
      RETRY: 'Retry Attempt',
      PENDING: 'Pending',
    };
    return displayNames[outcome];
  }

  /**
   * Get color for outcome
   */
  static getOutcomeColor(outcome: HandshakeOutcome): string {
    const colors: Record<HandshakeOutcome, string> = {
      OK: 'green',
      FAIL: 'red',
      TIMEOUT: 'orange',
      REFRESH: 'blue',
      REVOKE: 'gray',
      PARTIAL: 'yellow',
      RETRY: 'purple',
      PENDING: 'cyan',
    };
    return colors[outcome];
  }

  /**
   * Get icon for outcome
   */
  static getOutcomeIcon(outcome: HandshakeOutcome): string {
    const icons: Record<HandshakeOutcome, string> = {
      OK: '✓',
      FAIL: '✗',
      TIMEOUT: '⏱',
      REFRESH: '↻',
      REVOKE: '⊘',
      PARTIAL: '◐',
      RETRY: '↺',
      PENDING: '⋯',
    };
    return icons[outcome];
  }
}

export default HandshakeSerialNumberGenerator;
