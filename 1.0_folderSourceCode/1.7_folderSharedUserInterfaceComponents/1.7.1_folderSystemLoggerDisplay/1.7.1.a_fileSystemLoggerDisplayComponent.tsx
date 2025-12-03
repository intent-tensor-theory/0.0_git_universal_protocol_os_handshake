// ============================================
// PROTOCOL OS - SYSTEM LOGGER DISPLAY COMPONENT
// ============================================
// Address: 1.7.1.a
// Purpose: Display system log messages with level-based styling
// ============================================

import React, { useRef, useEffect } from 'react';
import type { ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import './1.7.1.c_fileSystemLoggerDisplayStyles.css';

/**
 * Props for SystemLoggerDisplay component
 */
export interface SystemLoggerDisplayProps {
  /** Array of log entries to display */
  logs: ExecutionLogEntry[];
  
  /** Maximum height before scrolling (default: 300px) */
  maxHeight?: number;
  
  /** Whether to auto-scroll to bottom on new logs */
  autoScroll?: boolean;
  
  /** Whether to show timestamps */
  showTimestamps?: boolean;
  
  /** Optional CSS class name */
  className?: string;
  
  /** Optional title for the log panel */
  title?: string;
  
  /** Whether the panel is collapsed */
  collapsed?: boolean;
  
  /** Callback when collapse toggle is clicked */
  onToggleCollapse?: () => void;
}

/**
 * Map log levels to CSS class suffixes
 */
const LOG_LEVEL_CLASS_MAP: Record<ExecutionLogEntry['level'], string> = {
  SYSTEM: 'system',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

/**
 * Map log levels to prefix symbols
 */
const LOG_LEVEL_PREFIX_MAP: Record<ExecutionLogEntry['level'], string> = {
  SYSTEM: '⚙',
  INFO: 'ℹ',
  SUCCESS: '✓',
  WARNING: '⚠',
  ERROR: '✕',
};

/**
 * Format timestamp for display
 */
function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '--:--:--';
  }
}

/**
 * SystemLoggerDisplay Component
 * 
 * Renders a scrollable log panel with color-coded entries based on log level.
 * Supports auto-scrolling, timestamps, and collapsible panels.
 * 
 * @example
 * ```tsx
 * <SystemLoggerDisplay
 *   logs={executionResult.logs}
 *   title="Execution Log"
 *   autoScroll={true}
 *   showTimestamps={true}
 * />
 * ```
 */
export const SystemLoggerDisplay: React.FC<SystemLoggerDisplayProps> = ({
  logs,
  maxHeight = 300,
  autoScroll = true,
  showTimestamps = true,
  className = '',
  title = 'System Log',
  collapsed = false,
  onToggleCollapse,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousLogCountRef = useRef<number>(0);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current && logs.length > previousLogCountRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    previousLogCountRef.current = logs.length;
  }, [logs, autoScroll]);

  return (
    <div className={`system-logger-display ${className}`}>
      {/* Header */}
      <div 
        className="system-logger-display__header"
        onClick={onToggleCollapse}
        role={onToggleCollapse ? 'button' : undefined}
        tabIndex={onToggleCollapse ? 0 : undefined}
        onKeyDown={(e) => {
          if (onToggleCollapse && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onToggleCollapse();
          }
        }}
      >
        <span className="system-logger-display__title">{title}</span>
        <span className="system-logger-display__count">
          {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
        </span>
        {onToggleCollapse && (
          <span className={`system-logger-display__chevron ${collapsed ? 'collapsed' : ''}`}>
            ▼
          </span>
        )}
      </div>

      {/* Log Content */}
      {!collapsed && (
        <div
          ref={scrollContainerRef}
          className="system-logger-display__content"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          {logs.length === 0 ? (
            <div className="system-logger-display__empty">
              No log entries yet...
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className={`system-logger-display__entry system-logger-display__entry--${LOG_LEVEL_CLASS_MAP[log.level]}`}
              >
                {showTimestamps && (
                  <span className="system-logger-display__timestamp">
                    [{formatTimestamp(log.timestamp)}]
                  </span>
                )}
                <span className="system-logger-display__prefix">
                  {LOG_LEVEL_PREFIX_MAP[log.level]}
                </span>
                <span className="system-logger-display__level">
                  {log.level}
                </span>
                <span className="system-logger-display__message">
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SystemLoggerDisplay;
