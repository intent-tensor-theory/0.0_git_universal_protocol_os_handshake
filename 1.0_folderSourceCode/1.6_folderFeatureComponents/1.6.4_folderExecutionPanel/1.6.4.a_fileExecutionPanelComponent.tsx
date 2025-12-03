// ============================================
// PROTOCOL OS - EXECUTION PANEL COMPONENT
// ============================================
// Address: 1.6.4.a
// Purpose: Panel displaying execution status and results
// ============================================

import React, { useEffect, useRef } from 'react';
import {
  useCurrentExecution,
  useExecutionProgress,
  useExecutionLogs,
  useExecutionResult,
  useExecutionTiming,
  useExecutionOperations,
} from '@state/1.5.a_fileIndex';

// ----------------------------------------
// Types
// ----------------------------------------

interface ExecutionPanelProps {
  className?: string;
  showLogs?: boolean;
  showResult?: boolean;
  autoScroll?: boolean;
}

// ----------------------------------------
// Status Indicator
// ----------------------------------------

function StatusIndicator({ status }: { status: string }) {
  const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
    idle: { color: 'var(--color-gray-500)', icon: '○', label: 'Idle' },
    preparing: { color: 'var(--color-blue-500)', icon: '◐', label: 'Preparing' },
    running: { color: 'var(--color-teal-500)', icon: '◉', label: 'Running' },
    success: { color: 'var(--color-green-500)', icon: '✓', label: 'Success' },
    failed: { color: 'var(--color-red-500)', icon: '✗', label: 'Failed' },
    cancelled: { color: 'var(--color-orange-500)', icon: '⊘', label: 'Cancelled' },
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: config.color,
      }}
    >
      <span
        style={{
          fontSize: '16px',
          animation: status === 'running' || status === 'preparing' 
            ? 'pulse 1s infinite' 
            : 'none',
        }}
      >
        {config.icon}
      </span>
      <span style={{ fontWeight: 500 }}>{config.label}</span>
    </div>
  );
}

// ----------------------------------------
// Progress Bar
// ----------------------------------------

function ProgressBar({ percentage, message }: { percentage: number; message: string }) {
  return (
    <div style={{ marginTop: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          marginBottom: '4px',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>{message}</span>
        <span>{percentage}%</span>
      </div>
      <div
        style={{
          height: '4px',
          backgroundColor: 'var(--color-surface)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: 'var(--color-teal-500)',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

// ----------------------------------------
// Log Viewer
// ----------------------------------------

function LogViewer({ 
  logs, 
  autoScroll = true 
}: { 
  logs: Array<{ timestamp: string; level: string; message: string }>; 
  autoScroll?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const levelColors: Record<string, string> = {
    SYSTEM: 'var(--color-purple-400)',
    INFO: 'var(--color-cyan-400)',
    SUCCESS: 'var(--color-green-400)',
    WARNING: 'var(--color-orange-400)',
    ERROR: 'var(--color-red-400)',
  };

  if (logs.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          color: 'var(--color-text-tertiary)',
          fontSize: '13px',
        }}
      >
        No logs yet
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        maxHeight: '200px',
        overflowY: 'auto',
        backgroundColor: 'var(--color-surface-inset)',
        borderRadius: '6px',
        padding: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
      }}
    >
      {logs.map((log, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            gap: '8px',
            padding: '2px 0',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span style={{ color: 'var(--color-text-tertiary)', minWidth: '70px' }}>
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
          <span
            style={{
              color: levelColors[log.level] || 'var(--color-text-secondary)',
              minWidth: '60px',
              fontWeight: 500,
            }}
          >
            [{log.level}]
          </span>
          <span style={{ color: 'var(--color-text-primary)', flex: 1 }}>
            {log.message}
          </span>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------
// Result Viewer
// ----------------------------------------

function ResultViewer({ result }: { result: unknown }) {
  const formatted = typeof result === 'string' 
    ? result 
    : JSON.stringify(result, null, 2);

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-inset)',
        borderRadius: '6px',
        padding: '12px',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxHeight: '300px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color: 'var(--color-text-primary)',
      }}
    >
      {formatted}
    </div>
  );
}

// ----------------------------------------
// Execution Panel
// ----------------------------------------

export function ExecutionPanel({
  className = '',
  showLogs = true,
  showResult = true,
  autoScroll = true,
}: ExecutionPanelProps) {
  const currentRun = useCurrentExecution();
  const { percentage, message } = useExecutionProgress();
  const { logs } = useExecutionLogs();
  const { result, isSuccess, isFailed, statusCode } = useExecutionResult();
  const { formatted: elapsedTime } = useExecutionTiming();
  const { cancel } = useExecutionOperations();

  if (!currentRun) {
    return (
      <div
        className={`execution-panel empty ${className}`}
        style={{
          padding: '32px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚀</div>
        <div>Select a handshake and click Run to execute</div>
      </div>
    );
  }

  return (
    <div
      className={`execution-panel ${className}`}
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        backgroundColor: 'var(--color-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-elevated)',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {currentRun.handshakeTitle}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
            {elapsedTime}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StatusIndicator status={currentRun.status} />
          
          {(currentRun.status === 'running' || currentRun.status === 'preparing') && (
            <button
              onClick={cancel}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--color-red-600)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {currentRun.status === 'running' && currentRun.progress && (
        <div style={{ padding: '0 16px 12px' }}>
          <ProgressBar percentage={percentage} message={message} />
        </div>
      )}

      {/* Metrics */}
      {result && (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            fontSize: '12px',
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-tertiary)' }}>Status: </span>
            <span
              style={{
                color: isSuccess ? 'var(--color-green-500)' : 'var(--color-red-500)',
                fontWeight: 500,
              }}
            >
              {statusCode || (isSuccess ? 'OK' : 'Failed')}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-tertiary)' }}>Duration: </span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {result.metrics?.totalDurationMs}ms
            </span>
          </div>
          {result.metrics?.responseSize && (
            <div>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Size: </span>
              <span style={{ color: 'var(--color-text-primary)' }}>
                {result.metrics.responseSize} bytes
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Logs */}
        {showLogs && (
          <div style={{ marginBottom: result ? '16px' : 0 }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '8px',
              }}
            >
              Execution Log
            </div>
            <LogViewer logs={logs} autoScroll={autoScroll} />
          </div>
        )}

        {/* Result */}
        {showResult && result?.responseBody && (
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: '8px',
              }}
            >
              Response
            </div>
            <ResultViewer result={result.responseBody} />
          </div>
        )}
      </div>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default ExecutionPanel;
