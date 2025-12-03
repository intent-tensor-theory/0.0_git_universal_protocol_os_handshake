// ============================================
// PROTOCOL OS - EXECUTION LOGS PANEL
// ============================================
// Address: 1.6.c
// Purpose: Real-Time Execution Log Display
// ============================================

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { ExecutionLogEntry, ExecutionPhase } from './1.6.a_fileExecutionOutputContainer';

/**
 * Execution Logs Panel
 * 
 * Displays real-time execution logs with:
 * - Level filtering (debug, info, warn, error)
 * - Phase filtering
 * - Full-text search
 * - Auto-scroll with pause detection
 * - Log expansion for detailed data
 */

/**
 * Log level type
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Execution logs panel props
 */
export interface ExecutionLogsPanelProps {
  /** Log entries */
  logs: ExecutionLogEntry[];
  
  /** Selected log level filter */
  selectedLevel?: 'all' | LogLevel;
  
  /** Level change handler */
  onLevelChange?: (level: 'all' | LogLevel) => void;
  
  /** Log counts by level */
  logCounts?: Record<LogLevel, number>;
  
  /** Auto-scroll enabled */
  autoScroll?: boolean;
  
  /** Is currently executing */
  isExecuting?: boolean;
  
  /** Show timestamps */
  showTimestamps?: boolean;
  
  /** Show elapsed time */
  showElapsed?: boolean;
  
  /** Show phase badges */
  showPhases?: boolean;
  
  /** On log entry click */
  onLogClick?: (log: ExecutionLogEntry) => void;
  
  /** Custom class name */
  className?: string;
}

/**
 * Log level configuration
 */
const LOG_LEVEL_CONFIG: Record<LogLevel, {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
}> = {
  debug: {
    icon: '🔍',
    label: 'Debug',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.1)',
  },
  info: {
    icon: 'ℹ️',
    label: 'Info',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  warn: {
    icon: '⚠️',
    label: 'Warning',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  error: {
    icon: '❌',
    label: 'Error',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
  },
};

/**
 * Phase configuration with ITT operators
 */
const PHASE_CONFIG: Record<ExecutionPhase, {
  operator: string;
  color: string;
}> = {
  genesis: { operator: 'Δ₁', color: '#8b5cf6' },
  transform: { operator: 'Δ₂', color: '#06b6d4' },
  transmit: { operator: 'Δ₃', color: '#3b82f6' },
  collapse: { operator: 'Δ₄', color: '#f59e0b' },
  validate: { operator: 'Δ₅', color: '#22c55e' },
  complete: { operator: 'Δ₆', color: '#10b981' },
};

/**
 * Execution Logs Panel Component
 */
export const ExecutionLogsPanel: React.FC<ExecutionLogsPanelProps> = ({
  logs,
  selectedLevel = 'all',
  onLevelChange,
  logCounts = { debug: 0, info: 0, warn: 0, error: 0 },
  autoScroll = true,
  isExecuting = false,
  showTimestamps = true,
  showElapsed = true,
  showPhases = true,
  onLogClick,
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  // ============================================
  // EFFECTS
  // ============================================

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !isUserScrolling && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isUserScrolling]);

  // Reset user scrolling flag when execution completes
  useEffect(() => {
    if (!isExecuting) {
      setIsUserScrolling(false);
    }
  }, [isExecuting]);

  // ============================================
  // COMPUTED
  // ============================================

  const filteredLogs = useMemo(() => {
    let result = logs;
    
    // Filter by level
    if (selectedLevel !== 'all') {
      result = result.filter(log => log.level === selectedLevel);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.message.toLowerCase().includes(query) ||
        log.phase.toLowerCase().includes(query) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [logs, selectedLevel, searchQuery]);

  const totalCount = logs.length;
  const filteredCount = filteredLogs.length;

  // ============================================
  // HANDLERS
  // ============================================

  const handleScroll = useCallback(() => {
    if (!logsContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    // If user scrolled up, pause auto-scroll
    if (!isAtBottom && isExecuting) {
      setIsUserScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      
      // Resume auto-scroll after 5 seconds of no scrolling
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsUserScrolling(false);
      }, 5000);
    } else if (isAtBottom) {
      setIsUserScrolling(false);
    }
  }, [isExecuting]);

  const handleToggleExpand = useCallback((logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleScrollToBottom = useCallback(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
      setIsUserScrolling(false);
    }
  }, []);

  const handleCopyLog = useCallback(async (log: ExecutionLogEntry) => {
    const text = log.data 
      ? `[${log.level.toUpperCase()}] ${log.message}\n${JSON.stringify(log.data, null, 2)}`
      : `[${log.level.toUpperCase()}] ${log.message}`;
    
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy log:', err);
    }
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`execution-logs-panel ${className}`}>
      {/* Toolbar */}
      <div className="execution-logs-panel__toolbar">
        {/* Level Filters */}
        <div className="execution-logs-panel__filters">
          <button
            type="button"
            className={`execution-logs-panel__filter ${selectedLevel === 'all' ? 'execution-logs-panel__filter--active' : ''}`}
            onClick={() => onLevelChange?.('all')}
          >
            All
            <span className="execution-logs-panel__filter-count">
              {totalCount}
            </span>
          </button>
          
          {(Object.keys(LOG_LEVEL_CONFIG) as LogLevel[]).map(level => {
            const config = LOG_LEVEL_CONFIG[level];
            const count = logCounts[level] || 0;
            
            return (
              <button
                key={level}
                type="button"
                className={`execution-logs-panel__filter execution-logs-panel__filter--${level} ${
                  selectedLevel === level ? 'execution-logs-panel__filter--active' : ''
                }`}
                onClick={() => onLevelChange?.(level)}
                disabled={count === 0}
              >
                <span className="execution-logs-panel__filter-icon">
                  {config.icon}
                </span>
                <span className="execution-logs-panel__filter-label">
                  {config.label}
                </span>
                <span className="execution-logs-panel__filter-count">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="execution-logs-panel__search">
          <input
            type="text"
            className="execution-logs-panel__search-input"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="execution-logs-panel__search-clear"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="execution-logs-panel__actions">
          {isUserScrolling && (
            <button
              type="button"
              className="execution-logs-panel__scroll-btn"
              onClick={handleScrollToBottom}
            >
              ↓ Scroll to bottom
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      {filteredCount !== totalCount && (
        <div className="execution-logs-panel__status-bar">
          Showing {filteredCount} of {totalCount} logs
          {searchQuery && (
            <span className="execution-logs-panel__status-query">
              matching "{searchQuery}"
            </span>
          )}
        </div>
      )}

      {/* Logs Container */}
      <div 
        ref={logsContainerRef}
        className="execution-logs-panel__container"
        onScroll={handleScroll}
      >
        {filteredLogs.length > 0 ? (
          <div className="execution-logs-panel__list">
            {filteredLogs.map(log => (
              <LogEntry
                key={log.id}
                log={log}
                isExpanded={expandedLogs.has(log.id)}
                showTimestamp={showTimestamps}
                showElapsed={showElapsed}
                showPhase={showPhases}
                onToggleExpand={() => handleToggleExpand(log.id)}
                onCopy={() => handleCopyLog(log)}
                onClick={onLogClick ? () => onLogClick(log) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="execution-logs-panel__empty">
            {searchQuery ? (
              <>
                <div className="execution-logs-panel__empty-icon">🔍</div>
                <div className="execution-logs-panel__empty-text">
                  No logs matching "{searchQuery}"
                </div>
                <button
                  type="button"
                  className="execution-logs-panel__empty-action"
                  onClick={handleClearSearch}
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="execution-logs-panel__empty-icon">📋</div>
                <div className="execution-logs-panel__empty-text">
                  No logs yet
                </div>
                <div className="execution-logs-panel__empty-hint">
                  Logs will appear here during execution
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Executing Indicator */}
        {isExecuting && (
          <div className="execution-logs-panel__executing">
            <span className="execution-logs-panel__executing-spinner">⏳</span>
            <span className="execution-logs-panel__executing-text">
              Executing...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Log entry component
 */
interface LogEntryProps {
  log: ExecutionLogEntry;
  isExpanded: boolean;
  showTimestamp: boolean;
  showElapsed: boolean;
  showPhase: boolean;
  onToggleExpand: () => void;
  onCopy: () => void;
  onClick?: () => void;
}

const LogEntry: React.FC<LogEntryProps> = ({
  log,
  isExpanded,
  showTimestamp,
  showElapsed,
  showPhase,
  onToggleExpand,
  onCopy,
  onClick,
}) => {
  const config = LOG_LEVEL_CONFIG[log.level];
  const phaseConfig = PHASE_CONFIG[log.phase];
  const hasData = log.data !== undefined;
  
  return (
    <div 
      className={`log-entry log-entry--${log.level} ${hasData ? 'log-entry--expandable' : ''} ${isExpanded ? 'log-entry--expanded' : ''}`}
      onClick={onClick}
      style={{ '--log-color': config.color, '--log-bg': config.bgColor } as React.CSSProperties}
    >
      <div className="log-entry__main">
        {/* Expand Toggle */}
        {hasData && (
          <button
            type="button"
            className="log-entry__toggle"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <span className={`log-entry__toggle-icon ${isExpanded ? 'log-entry__toggle-icon--expanded' : ''}`}>
              ▶
            </span>
          </button>
        )}
        
        {/* Level Icon */}
        <span className="log-entry__level-icon" title={config.label}>
          {config.icon}
        </span>
        
        {/* Timestamp */}
        {showTimestamp && (
          <span className="log-entry__timestamp">
            {formatTimestamp(log.timestamp)}
          </span>
        )}
        
        {/* Elapsed */}
        {showElapsed && log.elapsed !== undefined && (
          <span className="log-entry__elapsed">
            +{log.elapsed}ms
          </span>
        )}
        
        {/* Phase Badge */}
        {showPhase && (
          <span 
            className="log-entry__phase"
            style={{ color: phaseConfig.color }}
            title={log.phase}
          >
            {phaseConfig.operator}
          </span>
        )}
        
        {/* Message */}
        <span className="log-entry__message">
          {log.message}
        </span>
        
        {/* Copy Button */}
        <button
          type="button"
          className="log-entry__copy"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          aria-label="Copy log entry"
          title="Copy to clipboard"
        >
          📋
        </button>
      </div>
      
      {/* Expanded Data */}
      {isExpanded && hasData && (
        <div className="log-entry__data">
          <pre className="log-entry__data-content">
            <code>{JSON.stringify(log.data, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

/**
 * Format timestamp
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + '.' + date.getMilliseconds().toString().padStart(3, '0');
}

/**
 * Log stream component for real-time log display
 */
export interface LogStreamProps {
  logs: ExecutionLogEntry[];
  maxVisible?: number;
  className?: string;
}

export const LogStream: React.FC<LogStreamProps> = ({
  logs,
  maxVisible = 5,
  className = '',
}) => {
  const visibleLogs = logs.slice(-maxVisible);
  
  return (
    <div className={`log-stream ${className}`}>
      {visibleLogs.map(log => {
        const config = LOG_LEVEL_CONFIG[log.level];
        return (
          <div 
            key={log.id}
            className={`log-stream__entry log-stream__entry--${log.level}`}
          >
            <span className="log-stream__icon">{config.icon}</span>
            <span className="log-stream__message">{log.message}</span>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Compact log summary
 */
export interface LogSummaryProps {
  logCounts: Record<LogLevel, number>;
  className?: string;
}

export const LogSummary: React.FC<LogSummaryProps> = ({
  logCounts,
  className = '',
}) => {
  const total = Object.values(logCounts).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className={`log-summary ${className}`}>
      <span className="log-summary__total">
        {total} logs
      </span>
      {logCounts.error > 0 && (
        <span className="log-summary__errors">
          {LOG_LEVEL_CONFIG.error.icon} {logCounts.error}
        </span>
      )}
      {logCounts.warn > 0 && (
        <span className="log-summary__warnings">
          {LOG_LEVEL_CONFIG.warn.icon} {logCounts.warn}
        </span>
      )}
    </div>
  );
};

export default ExecutionLogsPanel;
