// ============================================
// PROTOCOL OS - EXECUTION METRICS PANEL
// ============================================
// Address: 1.6.b
// Purpose: Performance Metrics and Timing Visualization
// ============================================

import React, { useMemo } from 'react';
import type { 
  ExecutionTiming, 
  ExecutionRequest, 
  ExecutionResponse,
  ExecutionStatus,
  ExecutionPhase 
} from './1.6.a_fileExecutionOutputContainer';

/**
 * Execution Metrics Panel
 * 
 * Displays comprehensive performance metrics:
 * - Timing waterfall visualization
 * - Request/response size analysis
 * - ITT phase progression
 * - Performance indicators
 */

/**
 * Execution metrics panel props
 */
export interface ExecutionMetricsPanelProps {
  /** Timing breakdown */
  timing?: ExecutionTiming;
  
  /** Request data */
  request?: ExecutionRequest;
  
  /** Response data */
  response?: ExecutionResponse;
  
  /** Execution status */
  status?: ExecutionStatus;
  
  /** Current phase */
  phase?: ExecutionPhase;
  
  /** Show detailed breakdown */
  showDetailedBreakdown?: boolean;
  
  /** Show phase progression */
  showPhaseProgression?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Timing segment definition
 */
interface TimingSegment {
  id: string;
  label: string;
  value: number;
  color: string;
  percentage: number;
}

/**
 * Performance threshold
 */
interface PerformanceThreshold {
  good: number;
  warning: number;
}

/**
 * Performance thresholds in ms
 */
const PERFORMANCE_THRESHOLDS: Record<string, PerformanceThreshold> = {
  dns: { good: 50, warning: 100 },
  connect: { good: 100, warning: 200 },
  ssl: { good: 150, warning: 300 },
  send: { good: 50, warning: 100 },
  wait: { good: 500, warning: 1000 },
  receive: { good: 200, warning: 500 },
  total: { good: 1000, warning: 3000 },
};

/**
 * Segment colors
 */
const SEGMENT_COLORS: Record<string, string> = {
  dns: '#8b5cf6',
  connect: '#06b6d4',
  ssl: '#f59e0b',
  send: '#3b82f6',
  wait: '#22c55e',
  receive: '#10b981',
};

/**
 * Phase definitions with ITT operators
 */
const PHASE_DEFINITIONS: Record<ExecutionPhase, {
  operator: string;
  label: string;
  description: string;
  color: string;
}> = {
  genesis: {
    operator: 'Δ₁',
    label: 'Genesis',
    description: 'Request initialization and preparation',
    color: '#8b5cf6',
  },
  transform: {
    operator: 'Δ₂',
    label: 'Transform',
    description: 'Request transformation and encoding',
    color: '#06b6d4',
  },
  transmit: {
    operator: 'Δ₃',
    label: 'Transmit',
    description: 'Network transmission',
    color: '#3b82f6',
  },
  collapse: {
    operator: 'Δ₄',
    label: 'Collapse',
    description: 'Response reception and parsing',
    color: '#f59e0b',
  },
  validate: {
    operator: 'Δ₅',
    label: 'Validate',
    description: 'Response validation',
    color: '#22c55e',
  },
  complete: {
    operator: 'Δ₆',
    label: 'Complete',
    description: 'Execution finalized',
    color: '#10b981',
  },
};

/**
 * Execution Metrics Panel Component
 */
export const ExecutionMetricsPanel: React.FC<ExecutionMetricsPanelProps> = ({
  timing,
  request,
  response,
  status,
  phase,
  showDetailedBreakdown = true,
  showPhaseProgression = true,
  className = '',
}) => {
  // ============================================
  // COMPUTED
  // ============================================

  const timingSegments = useMemo((): TimingSegment[] => {
    if (!timing) return [];
    
    const segments: TimingSegment[] = [];
    const total = timing.total || 1;
    
    if (timing.dns !== undefined) {
      segments.push({
        id: 'dns',
        label: 'DNS Lookup',
        value: timing.dns,
        color: SEGMENT_COLORS.dns,
        percentage: (timing.dns / total) * 100,
      });
    }
    
    if (timing.connect !== undefined) {
      segments.push({
        id: 'connect',
        label: 'TCP Connect',
        value: timing.connect,
        color: SEGMENT_COLORS.connect,
        percentage: (timing.connect / total) * 100,
      });
    }
    
    if (timing.ssl !== undefined) {
      segments.push({
        id: 'ssl',
        label: 'TLS Handshake',
        value: timing.ssl,
        color: SEGMENT_COLORS.ssl,
        percentage: (timing.ssl / total) * 100,
      });
    }
    
    if (timing.send !== undefined) {
      segments.push({
        id: 'send',
        label: 'Send Request',
        value: timing.send,
        color: SEGMENT_COLORS.send,
        percentage: (timing.send / total) * 100,
      });
    }
    
    if (timing.wait !== undefined) {
      segments.push({
        id: 'wait',
        label: 'Wait (TTFB)',
        value: timing.wait,
        color: SEGMENT_COLORS.wait,
        percentage: (timing.wait / total) * 100,
      });
    }
    
    if (timing.receive !== undefined) {
      segments.push({
        id: 'receive',
        label: 'Receive Response',
        value: timing.receive,
        color: SEGMENT_COLORS.receive,
        percentage: (timing.receive / total) * 100,
      });
    }
    
    return segments;
  }, [timing]);

  const sizeMetrics = useMemo(() => {
    return {
      requestSize: request?.bodySize || 0,
      responseSize: response?.bodySize || 0,
      headerSize: response?.headers 
        ? Object.entries(response.headers).reduce((sum, [k, v]) => sum + k.length + v.length + 4, 0)
        : 0,
    };
  }, [request?.bodySize, response?.bodySize, response?.headers]);

  const performanceGrade = useMemo(() => {
    if (!timing?.total) return null;
    
    const total = timing.total;
    const threshold = PERFORMANCE_THRESHOLDS.total;
    
    if (total <= threshold.good) return { grade: 'A', label: 'Excellent', color: 'success' };
    if (total <= threshold.warning) return { grade: 'B', label: 'Good', color: 'warning' };
    return { grade: 'C', label: 'Needs Improvement', color: 'error' };
  }, [timing?.total]);

  const phaseProgression = useMemo(() => {
    const phases: ExecutionPhase[] = ['genesis', 'transform', 'transmit', 'collapse', 'validate', 'complete'];
    const currentIndex = phase ? phases.indexOf(phase) : -1;
    
    return phases.map((p, index) => ({
      ...PHASE_DEFINITIONS[p],
      phase: p,
      isComplete: index < currentIndex,
      isCurrent: index === currentIndex,
      isPending: index > currentIndex,
    }));
  }, [phase]);

  // ============================================
  // RENDER
  // ============================================

  if (!timing && !request && !response) {
    return (
      <div className={`execution-metrics-panel execution-metrics-panel--empty ${className}`}>
        <div className="execution-metrics-panel__empty-message">
          No metrics available
        </div>
      </div>
    );
  }

  return (
    <div className={`execution-metrics-panel ${className}`}>
      {/* Performance Overview */}
      <div className="execution-metrics-panel__overview">
        <div className="execution-metrics-panel__overview-header">
          <h4 className="execution-metrics-panel__section-title">Performance Overview</h4>
          {performanceGrade && (
            <div className={`execution-metrics-panel__grade execution-metrics-panel__grade--${performanceGrade.color}`}>
              <span className="execution-metrics-panel__grade-letter">{performanceGrade.grade}</span>
              <span className="execution-metrics-panel__grade-label">{performanceGrade.label}</span>
            </div>
          )}
        </div>
        
        <div className="execution-metrics-panel__overview-stats">
          {/* Total Time */}
          <div className="execution-metrics-panel__stat">
            <span className="execution-metrics-panel__stat-icon">⏱</span>
            <div className="execution-metrics-panel__stat-info">
              <span className="execution-metrics-panel__stat-value">{timing?.total || 0}ms</span>
              <span className="execution-metrics-panel__stat-label">Total Time</span>
            </div>
          </div>
          
          {/* Status */}
          <div className="execution-metrics-panel__stat">
            <span className="execution-metrics-panel__stat-icon">
              {response?.statusCode && response.statusCode < 400 ? '✓' : '⚠'}
            </span>
            <div className="execution-metrics-panel__stat-info">
              <span className="execution-metrics-panel__stat-value">
                {response?.statusCode || '—'}
              </span>
              <span className="execution-metrics-panel__stat-label">Status Code</span>
            </div>
          </div>
          
          {/* Request Size */}
          <div className="execution-metrics-panel__stat">
            <span className="execution-metrics-panel__stat-icon">📤</span>
            <div className="execution-metrics-panel__stat-info">
              <span className="execution-metrics-panel__stat-value">
                {formatBytes(sizeMetrics.requestSize)}
              </span>
              <span className="execution-metrics-panel__stat-label">Request Size</span>
            </div>
          </div>
          
          {/* Response Size */}
          <div className="execution-metrics-panel__stat">
            <span className="execution-metrics-panel__stat-icon">📥</span>
            <div className="execution-metrics-panel__stat-info">
              <span className="execution-metrics-panel__stat-value">
                {formatBytes(sizeMetrics.responseSize)}
              </span>
              <span className="execution-metrics-panel__stat-label">Response Size</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timing Waterfall */}
      {showDetailedBreakdown && timingSegments.length > 0 && (
        <div className="execution-metrics-panel__timing">
          <h4 className="execution-metrics-panel__section-title">Timing Breakdown</h4>
          
          {/* Waterfall Bar */}
          <div className="execution-metrics-panel__waterfall">
            <div className="execution-metrics-panel__waterfall-bar">
              {timingSegments.map(segment => (
                <div
                  key={segment.id}
                  className="execution-metrics-panel__waterfall-segment"
                  style={{
                    width: `${segment.percentage}%`,
                    backgroundColor: segment.color,
                  }}
                  title={`${segment.label}: ${segment.value}ms`}
                />
              ))}
            </div>
            <div className="execution-metrics-panel__waterfall-scale">
              <span>0ms</span>
              <span>{timing?.total}ms</span>
            </div>
          </div>
          
          {/* Timing Details */}
          <div className="execution-metrics-panel__timing-details">
            {timingSegments.map(segment => {
              const threshold = PERFORMANCE_THRESHOLDS[segment.id];
              const performance = threshold
                ? segment.value <= threshold.good ? 'good'
                : segment.value <= threshold.warning ? 'warning'
                : 'poor'
                : 'good';
              
              return (
                <div key={segment.id} className="execution-metrics-panel__timing-row">
                  <div className="execution-metrics-panel__timing-indicator">
                    <span 
                      className="execution-metrics-panel__timing-color"
                      style={{ backgroundColor: segment.color }}
                    />
                  </div>
                  <span className="execution-metrics-panel__timing-label">
                    {segment.label}
                  </span>
                  <span className={`execution-metrics-panel__timing-value execution-metrics-panel__timing-value--${performance}`}>
                    {segment.value}ms
                  </span>
                  <span className="execution-metrics-panel__timing-percentage">
                    {segment.percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
            
            <div className="execution-metrics-panel__timing-row execution-metrics-panel__timing-row--total">
              <div className="execution-metrics-panel__timing-indicator" />
              <span className="execution-metrics-panel__timing-label">Total</span>
              <span className="execution-metrics-panel__timing-value">
                {timing?.total}ms
              </span>
              <span className="execution-metrics-panel__timing-percentage">
                100%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ITT Phase Progression */}
      {showPhaseProgression && phase && (
        <div className="execution-metrics-panel__phases">
          <h4 className="execution-metrics-panel__section-title">
            ITT Phase Progression
          </h4>
          
          <div className="execution-metrics-panel__phase-timeline">
            {phaseProgression.map((p, index) => (
              <React.Fragment key={p.phase}>
                <div 
                  className={`execution-metrics-panel__phase-item ${
                    p.isComplete ? 'execution-metrics-panel__phase-item--complete' :
                    p.isCurrent ? 'execution-metrics-panel__phase-item--current' :
                    'execution-metrics-panel__phase-item--pending'
                  }`}
                >
                  <div 
                    className="execution-metrics-panel__phase-node"
                    style={{ borderColor: p.isComplete || p.isCurrent ? p.color : undefined }}
                  >
                    {p.isComplete ? '✓' : p.operator}
                  </div>
                  <div className="execution-metrics-panel__phase-info">
                    <span className="execution-metrics-panel__phase-label">
                      {p.label}
                    </span>
                    <span className="execution-metrics-panel__phase-desc">
                      {p.description}
                    </span>
                  </div>
                </div>
                {index < phaseProgression.length - 1 && (
                  <div 
                    className={`execution-metrics-panel__phase-connector ${
                      p.isComplete ? 'execution-metrics-panel__phase-connector--complete' : ''
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Size Analysis */}
      <div className="execution-metrics-panel__size">
        <h4 className="execution-metrics-panel__section-title">Size Analysis</h4>
        
        <div className="execution-metrics-panel__size-chart">
          {/* Request */}
          <div className="execution-metrics-panel__size-item">
            <div className="execution-metrics-panel__size-header">
              <span className="execution-metrics-panel__size-icon">📤</span>
              <span className="execution-metrics-panel__size-label">Request</span>
            </div>
            <div className="execution-metrics-panel__size-bar-container">
              <div 
                className="execution-metrics-panel__size-bar execution-metrics-panel__size-bar--request"
                style={{ 
                  width: `${Math.min(100, (sizeMetrics.requestSize / Math.max(sizeMetrics.requestSize, sizeMetrics.responseSize, 1)) * 100)}%` 
                }}
              />
            </div>
            <span className="execution-metrics-panel__size-value">
              {formatBytes(sizeMetrics.requestSize)}
            </span>
          </div>
          
          {/* Response */}
          <div className="execution-metrics-panel__size-item">
            <div className="execution-metrics-panel__size-header">
              <span className="execution-metrics-panel__size-icon">📥</span>
              <span className="execution-metrics-panel__size-label">Response</span>
            </div>
            <div className="execution-metrics-panel__size-bar-container">
              <div 
                className="execution-metrics-panel__size-bar execution-metrics-panel__size-bar--response"
                style={{ 
                  width: `${Math.min(100, (sizeMetrics.responseSize / Math.max(sizeMetrics.requestSize, sizeMetrics.responseSize, 1)) * 100)}%` 
                }}
              />
            </div>
            <span className="execution-metrics-panel__size-value">
              {formatBytes(sizeMetrics.responseSize)}
            </span>
          </div>
          
          {/* Headers */}
          <div className="execution-metrics-panel__size-item">
            <div className="execution-metrics-panel__size-header">
              <span className="execution-metrics-panel__size-icon">📋</span>
              <span className="execution-metrics-panel__size-label">Headers</span>
            </div>
            <div className="execution-metrics-panel__size-bar-container">
              <div 
                className="execution-metrics-panel__size-bar execution-metrics-panel__size-bar--headers"
                style={{ 
                  width: `${Math.min(100, (sizeMetrics.headerSize / Math.max(sizeMetrics.requestSize, sizeMetrics.responseSize, sizeMetrics.headerSize, 1)) * 100)}%` 
                }}
              />
            </div>
            <span className="execution-metrics-panel__size-value">
              {formatBytes(sizeMetrics.headerSize)}
            </span>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      {timing && (
        <div className="execution-metrics-panel__timestamps">
          <h4 className="execution-metrics-panel__section-title">Timestamps</h4>
          
          <div className="execution-metrics-panel__timestamp-list">
            <div className="execution-metrics-panel__timestamp-row">
              <span className="execution-metrics-panel__timestamp-label">Started</span>
              <span className="execution-metrics-panel__timestamp-value">
                {timing.startedAt.toISOString()}
              </span>
            </div>
            {timing.completedAt && (
              <div className="execution-metrics-panel__timestamp-row">
                <span className="execution-metrics-panel__timestamp-label">Completed</span>
                <span className="execution-metrics-panel__timestamp-value">
                  {timing.completedAt.toISOString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Compact metrics display
 */
export interface CompactMetricsProps {
  timing?: ExecutionTiming;
  response?: ExecutionResponse;
  className?: string;
}

export const CompactMetrics: React.FC<CompactMetricsProps> = ({
  timing,
  response,
  className = '',
}) => {
  return (
    <div className={`compact-metrics ${className}`}>
      <span className="compact-metrics__item">
        <span className="compact-metrics__icon">⏱</span>
        <span className="compact-metrics__value">{timing?.total || 0}ms</span>
      </span>
      {response?.statusCode && (
        <span className={`compact-metrics__item compact-metrics__item--${response.statusCode < 400 ? 'success' : 'error'}`}>
          <span className="compact-metrics__value">{response.statusCode}</span>
        </span>
      )}
      {response?.bodySize && (
        <span className="compact-metrics__item">
          <span className="compact-metrics__icon">📦</span>
          <span className="compact-metrics__value">{formatBytes(response.bodySize)}</span>
        </span>
      )}
    </div>
  );
};

export default ExecutionMetricsPanel;
