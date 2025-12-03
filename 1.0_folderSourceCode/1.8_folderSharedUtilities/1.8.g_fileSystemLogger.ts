// ============================================
// PROTOCOL OS - SYSTEM LOGGER
// ============================================
// Address: 1.8.g
// Purpose: Instructional Commentary Logger with Error Catching
// ============================================
// 
// "Every log is a lesson, every error a teacher."
// — Intent Tensor Theory Institute
//
// This logger follows the Writables Doctrine:
// - Each log entry is self-documenting
// - Errors are caught, contextualized, and explained
// - The console becomes a learning environment
//
// ============================================

/**
 * Log Levels following ITT Δ hierarchy
 * 
 * Δ₁ DEBUG   → Deep system introspection (development only)
 * Δ₂ INFO    → Normal operation confirmations
 * Δ₃ WARN    → Potential issues, system continues
 * Δ₄ ERROR   → Operation failed, requires attention
 * Δ₅ FATAL   → System cannot continue
 * Δ₆ SUCCESS → Operation completed successfully
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'success';

/**
 * Log Entry Structure
 * 
 * Each entry contains:
 * - timestamp: When the event occurred
 * - level: Severity classification
 * - context: Where in the system (e.g., "Platform.Add")
 * - message: Human-readable description
 * - commentary: Instructional note explaining the log
 * - data: Optional payload for debugging
 * - error: Optional error object if applicable
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: string;
  message: string;
  commentary?: string;
  data?: unknown;
  error?: Error;
}

/**
 * Logger Configuration
 */
export interface LoggerConfig {
  /** Minimum level to display */
  minLevel: LogLevel;
  /** Enable console output */
  enableConsole: boolean;
  /** Enable instructional commentary */
  enableCommentary: boolean;
  /** Store logs in memory for retrieval */
  enableHistory: boolean;
  /** Maximum history entries */
  maxHistory: number;
  /** Show timestamps in console */
  showTimestamps: boolean;
  /** Custom prefix for all logs */
  prefix: string;
}

// ============================================
// LOG LEVEL HIERARCHY
// ============================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  success: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

// ============================================
// CONSOLE STYLING
// ============================================

const LOG_STYLES: Record<LogLevel, string> = {
  debug: 'color: #8b5cf6; font-weight: normal;',      // Purple
  info: 'color: #3b82f6; font-weight: normal;',       // Blue
  success: 'color: #22c55e; font-weight: bold;',      // Green
  warn: 'color: #f59e0b; font-weight: bold;',         // Orange
  error: 'color: #ef4444; font-weight: bold;',        // Red
  fatal: 'color: #ffffff; background: #ef4444; font-weight: bold; padding: 2px 6px;', // White on Red
};

const LOG_ICONS: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  success: '✅',
  warn: '⚠️',
  error: '❌',
  fatal: '💀',
};

const COMMENTARY_STYLE = 'color: #64748b; font-style: italic; font-size: 11px;';

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: 'debug',
  enableConsole: true,
  enableCommentary: true,
  enableHistory: true,
  maxHistory: 500,
  showTimestamps: true,
  prefix: '🤝 Protocol OS',
};

// ============================================
// LOGGER CLASS
// ============================================

/**
 * SystemLogger
 * 
 * The central logging facility for Protocol OS.
 * Implements instructional commentary logging where
 * each log entry teaches the developer about system behavior.
 * 
 * Usage:
 *   logger.info('Platform.Add', 'New platform created', {
 *     commentary: 'Platforms are Δ₁ level containers for resources',
 *     data: { platformId: 'plat-123' }
 *   });
 */
class SystemLogger {
  private config: LoggerConfig;
  private history: LogEntry[] = [];
  private sessionStartTime: Date;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionStartTime = new Date();
    this.logSessionStart();
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  /**
   * Update logger configuration
   */
  configure(updates: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...updates };
    this.debug('Logger.Configure', 'Configuration updated', {
      commentary: 'Logger settings can be adjusted at runtime',
      data: updates,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // ============================================
  // CORE LOGGING METHODS
  // ============================================

  /**
   * Δ₁ DEBUG - Deep system introspection
   * 
   * Use for detailed debugging information that helps
   * understand system internals. Typically disabled in production.
   */
  debug(context: string, message: string, options?: LogOptions): void {
    this.log('debug', context, message, options);
  }

  /**
   * Δ₂ INFO - Normal operation confirmation
   * 
   * Use for general operational messages that confirm
   * the system is working as expected.
   */
  info(context: string, message: string, options?: LogOptions): void {
    this.log('info', context, message, options);
  }

  /**
   * Δ₆ SUCCESS - Operation completed successfully
   * 
   * Use to celebrate successful completions of significant
   * operations. The green checkmark brings joy.
   */
  success(context: string, message: string, options?: LogOptions): void {
    this.log('success', context, message, options);
  }

  /**
   * Δ₃ WARN - Potential issue detected
   * 
   * Use when something unexpected happened but the system
   * can continue operating. Requires attention but not urgent.
   */
  warn(context: string, message: string, options?: LogOptions): void {
    this.log('warn', context, message, options);
  }

  /**
   * Δ₄ ERROR - Operation failed
   * 
   * Use when an operation could not complete. The system
   * continues but functionality is degraded.
   */
  error(context: string, message: string, options?: LogOptions): void {
    this.log('error', context, message, options);
  }

  /**
   * Δ₅ FATAL - System cannot continue
   * 
   * Use for catastrophic failures that prevent the system
   * from operating. Should be rare and investigated immediately.
   */
  fatal(context: string, message: string, options?: LogOptions): void {
    this.log('fatal', context, message, options);
  }

  // ============================================
  // ERROR CATCHING UTILITIES
  // ============================================

  /**
   * Catch and log errors from synchronous operations
   * 
   * Usage:
   *   const result = logger.catch('Platform.Add', () => {
   *     return riskyOperation();
   *   }, { commentary: 'Attempting to add platform' });
   */
  catch<T>(
    context: string,
    operation: () => T,
    options?: LogOptions
  ): T | undefined {
    try {
      const result = operation();
      this.debug(context, 'Operation completed', {
        ...options,
        commentary: options?.commentary || 'Synchronous operation succeeded',
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.error(context, error.message, {
        ...options,
        error,
        commentary: options?.commentary || 'Synchronous operation failed - see error details',
      });
      return undefined;
    }
  }

  /**
   * Catch and log errors from async operations
   * 
   * Usage:
   *   const result = await logger.catchAsync('API.Fetch', async () => {
   *     return await fetch(url);
   *   }, { commentary: 'Fetching data from API' });
   */
  async catchAsync<T>(
    context: string,
    operation: () => Promise<T>,
    options?: LogOptions
  ): Promise<T | undefined> {
    try {
      const result = await operation();
      this.debug(context, 'Async operation completed', {
        ...options,
        commentary: options?.commentary || 'Asynchronous operation succeeded',
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.error(context, error.message, {
        ...options,
        error,
        commentary: options?.commentary || 'Asynchronous operation failed - see error details',
      });
      return undefined;
    }
  }

  /**
   * Wrap a function with automatic error logging
   * 
   * Usage:
   *   const safeAdd = logger.wrap('Platform.Add', addPlatform);
   *   safeAdd(platformData); // Errors automatically logged
   */
  wrap<T extends (...args: unknown[]) => unknown>(
    context: string,
    fn: T,
    options?: LogOptions
  ): T {
    const self = this;
    return function (this: unknown, ...args: unknown[]) {
      try {
        const result = fn.apply(this, args);
        if (result instanceof Promise) {
          return result.catch((err: unknown) => {
            const error = err instanceof Error ? err : new Error(String(err));
            self.error(context, error.message, { ...options, error });
            throw error;
          });
        }
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        self.error(context, error.message, { ...options, error });
        throw error;
      }
    } as T;
  }

  // ============================================
  // HISTORY & RETRIEVAL
  // ============================================

  /**
   * Get all log entries
   */
  getHistory(): LogEntry[] {
    return [...this.history];
  }

  /**
   * Get logs filtered by level
   */
  getByLevel(level: LogLevel): LogEntry[] {
    return this.history.filter(entry => entry.level === level);
  }

  /**
   * Get logs filtered by context
   */
  getByContext(contextPattern: string): LogEntry[] {
    return this.history.filter(entry => 
      entry.context.toLowerCase().includes(contextPattern.toLowerCase())
    );
  }

  /**
   * Get error logs only
   */
  getErrors(): LogEntry[] {
    return this.history.filter(entry => 
      entry.level === 'error' || entry.level === 'fatal'
    );
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.history = [];
    this.info('Logger.Clear', 'Log history cleared', {
      commentary: 'All previous log entries have been removed from memory',
    });
  }

  /**
   * Export logs as JSON
   */
  exportJSON(): string {
    return JSON.stringify({
      exported: new Date().toISOString(),
      sessionStart: this.sessionStartTime.toISOString(),
      config: this.config,
      entries: this.history.map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
        } : undefined,
      })),
    }, null, 2);
  }

  // ============================================
  // GROUP LOGGING
  // ============================================

  /**
   * Start a collapsed console group
   */
  group(label: string): void {
    if (this.config.enableConsole) {
      console.groupCollapsed(`${this.config.prefix} │ ${label}`);
    }
  }

  /**
   * End current console group
   */
  groupEnd(): void {
    if (this.config.enableConsole) {
      console.groupEnd();
    }
  }

  /**
   * Log with automatic grouping
   */
  grouped<T>(label: string, operation: () => T): T {
    this.group(label);
    try {
      const result = operation();
      return result;
    } finally {
      this.groupEnd();
    }
  }

  // ============================================
  // TIMING UTILITIES
  // ============================================

  /**
   * Start a timer
   */
  time(label: string): () => number {
    const start = performance.now();
    this.debug('Timer.Start', `Started: ${label}`, {
      commentary: 'Performance timing initiated',
    });
    
    return () => {
      const duration = performance.now() - start;
      this.info('Timer.End', `${label}: ${duration.toFixed(2)}ms`, {
        commentary: 'Performance timing completed',
        data: { label, durationMs: duration },
      });
      return duration;
    };
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Core logging implementation
   */
  private log(
    level: LogLevel,
    context: string,
    message: string,
    options?: LogOptions
  ): void {
    // Check minimum level
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.minLevel]) {
      return;
    }

    // Create entry
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      context,
      message,
      commentary: options?.commentary,
      data: options?.data,
      error: options?.error,
    };

    // Store in history
    if (this.config.enableHistory) {
      this.history.push(entry);
      if (this.history.length > this.config.maxHistory) {
        this.history.shift();
      }
    }

    // Output to console
    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Format and output to console
   */
  private outputToConsole(entry: LogEntry): void {
    const icon = LOG_ICONS[entry.level];
    const style = LOG_STYLES[entry.level];
    const timestamp = this.config.showTimestamps 
      ? `[${entry.timestamp.toLocaleTimeString()}]`
      : '';
    
    // Main log line
    const prefix = `${this.config.prefix} │ ${icon} ${timestamp}`;
    const contextStr = `[${entry.context}]`;
    
    // Use appropriate console method
    const consoleMethod = entry.level === 'error' || entry.level === 'fatal'
      ? console.error
      : entry.level === 'warn'
      ? console.warn
      : console.log;

    consoleMethod(
      `%c${prefix} ${contextStr} ${entry.message}`,
      style
    );

    // Commentary (instructional note)
    if (this.config.enableCommentary && entry.commentary) {
      console.log(`%c   💡 ${entry.commentary}`, COMMENTARY_STYLE);
    }

    // Data payload
    if (entry.data !== undefined) {
      console.log('   📦 Data:', entry.data);
    }

    // Error details
    if (entry.error) {
      console.log('   🔴 Error:', entry.error);
      if (entry.error.stack) {
        console.log('%c   Stack trace:', 'color: #94a3b8; font-size: 10px;');
        console.log(entry.error.stack);
      }
    }
  }

  /**
   * Log session start banner
   */
  private logSessionStart(): void {
    if (!this.config.enableConsole) return;

    console.log(`
%c╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🤝 PROTOCOL OS - SYSTEM LOGGER INITIALIZED                 ║
║                                                              ║
║   "Every log is a lesson, every error a teacher."           ║
║                                                              ║
║   Session: ${this.sessionStartTime.toISOString().padEnd(36)}   ║
║   Level: ${this.config.minLevel.toUpperCase().padEnd(42)}   ║
║                                                              ║
║   Δ₁ DEBUG   Δ₂ INFO   Δ₃ WARN   Δ₄ ERROR   Δ₅ FATAL        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`, 'color: #8b5cf6; font-family: monospace;');
  }
}

// ============================================
// LOG OPTIONS TYPE
// ============================================

interface LogOptions {
  /** Instructional commentary explaining the log */
  commentary?: string;
  /** Additional data payload */
  data?: unknown;
  /** Error object if applicable */
  error?: Error;
}

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Global logger instance
 * 
 * Import and use throughout the application:
 *   import { logger } from './SystemLogger';
 *   logger.info('MyComponent', 'Something happened');
 */
export const logger = new SystemLogger();

// ============================================
// INSTRUCTIONAL COMMENTARY PRESETS
// ============================================

/**
 * Pre-written commentary for common scenarios
 * 
 * Usage:
 *   logger.info('Platform.Add', 'Platform created', {
 *     commentary: COMMENTARY.PLATFORM_CREATED,
 *   });
 */
export const COMMENTARY = {
  // Platform Operations
  PLATFORM_CREATED: 'Platforms (Δ₁) are top-level service containers. Each platform represents an external service like Google, Stripe, or GitHub.',
  PLATFORM_UPDATED: 'Platform configuration updated. Changes propagate to all child resources and handshakes.',
  PLATFORM_DELETED: 'Platform removed along with all associated resources and handshakes. This is a cascading delete.',
  
  // Resource Operations
  RESOURCE_CREATED: 'Resources (Δ₂) represent API endpoints within a platform. Each resource can have multiple handshakes.',
  RESOURCE_UPDATED: 'Resource configuration updated. Handshakes may need re-validation if endpoint changed.',
  RESOURCE_DELETED: 'Resource removed along with all associated handshakes.',
  
  // Handshake Operations
  HANDSHAKE_CREATED: 'Handshakes (Δ₃) are authentication/request configurations. They define how to communicate with a resource.',
  HANDSHAKE_UPDATED: 'Handshake configuration updated. A new version is created for history tracking.',
  HANDSHAKE_DELETED: 'Handshake removed. Historical executions are preserved for audit purposes.',
  HANDSHAKE_EXECUTED: 'Handshake executed through the Δ₄→Δ₆ collapse flow: Execute → Validate → Persist.',
  
  // State Operations
  STATE_SAVED: 'Application state persisted to storage. Can be restored on next session.',
  STATE_LOADED: 'Application state restored from storage. Resuming previous session.',
  STATE_CLEARED: 'Application state cleared. Starting fresh.',
  
  // Error Contexts
  ERROR_NETWORK: 'Network error detected. Check connectivity and endpoint availability.',
  ERROR_AUTH: 'Authentication failed. Verify credentials and token expiration.',
  ERROR_VALIDATION: 'Validation error. Input data does not match expected schema.',
  ERROR_PERMISSION: 'Permission denied. User lacks required access rights.',
  ERROR_TIMEOUT: 'Operation timed out. Consider increasing timeout or optimizing the operation.',
  ERROR_UNKNOWN: 'An unexpected error occurred. Check the error details for more information.',
  
  // System Events
  SYSTEM_INIT: 'System initialization complete. All modules loaded and ready.',
  SYSTEM_SHUTDOWN: 'System shutting down gracefully. Saving state and releasing resources.',
  SYSTEM_ERROR: 'System error detected. Attempting recovery...',
};

// ============================================
// UTILITY EXPORTS
// ============================================

export { SystemLogger, LoggerConfig };
export default logger;
