// ============================================
// PROTOCOL OS - HANDSHAKE EXECUTION PANEL
// ============================================
// Address: 1.4.4.g
// Purpose: Panel for Executing Handshakes and Displaying Results
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import type { HandshakeConfiguration, HandshakeExecutionResult } from './1.4.4.a_fileHandshakeAccordionSection';

/**
 * Handshake Execution Panel
 * 
 * Provides interface for executing handshakes and viewing results:
 * - Execute button with loading state
 * - Response status and timing
 * - Response headers
 * - Response body with formatting
 * - Error display
 */

/**
 * Response format type
 */
export type ResponseFormat = 'auto' | 'json' | 'xml' | 'html' | 'raw';

/**
 * Handshake execution panel props
 */
export interface HandshakeExecutionPanelProps {
  /** Handshake configuration */
  handshake: HandshakeConfiguration;
  
  /** Execution result */
  result: HandshakeExecutionResult | null;
  
  /** Is currently executing */
  isExecuting: boolean;
  
  /** Execute handler */
  onExecute: () => void;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Handshake Execution Panel Component
 */
export const HandshakeExecutionPanel: React.FC<HandshakeExecutionPanelProps> = ({
  handshake,
  result,
  isExecuting,
  onExecute,
  disabled = false,
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'raw'>('body');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('auto');
  const [isCopied, setIsCopied] = useState(false);

  // ============================================
  // COMPUTED
  // ============================================

  const statusClass = useMemo(() => {
    if (!result) return '';
    if (result.success) return 'success';
    if (result.statusCode && result.statusCode >= 400 && result.statusCode < 500) return 'client-error';
    if (result.statusCode && result.statusCode >= 500) return 'server-error';
    return 'error';
  }, [result]);

  const formattedBody = useMemo(() => {
    if (!result?.body) return '';
    
    const body = result.body;
    const format = responseFormat === 'auto' ? detectFormat(body) : responseFormat;
    
    switch (format) {
      case 'json':
        try {
          return JSON.stringify(typeof body === 'string' ? JSON.parse(body) : body, null, 2);
        } catch {
          return String(body);
        }
      case 'xml':
      case 'html':
        return formatXml(String(body));
      default:
        return String(body);
    }
  }, [result?.body, responseFormat]);

  const headersCount = useMemo(() => {
    return result?.headers ? Object.keys(result.headers).length : 0;
  }, [result?.headers]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`handshake-execution-panel ${className}`}>
      {/* Execute Button */}
      <div className="handshake-execution-panel__execute-section">
        <button
          type="button"
          className={`handshake-execution-panel__execute-btn ${isExecuting ? 'handshake-execution-panel__execute-btn--executing' : ''}`}
          onClick={onExecute}
          disabled={disabled || isExecuting}
        >
          {isExecuting ? (
            <>
              <span className="handshake-execution-panel__spinner">⏳</span>
              Executing...
            </>
          ) : (
            <>
              <span className="handshake-execution-panel__play-icon">▶</span>
              Execute Handshake
            </>
          )}
        </button>

        {/* Request Summary */}
        <div className="handshake-execution-panel__request-summary">
          <span className={`handshake-execution-panel__method handshake-execution-panel__method--${(handshake.request?.method || 'GET').toLowerCase()}`}>
            {handshake.request?.method || 'GET'}
          </span>
          <span className="handshake-execution-panel__url">
            {handshake.request?.url || 'No URL configured'}
          </span>
        </div>
      </div>

      {/* Response Section */}
      {result && (
        <div className="handshake-execution-panel__response">
          {/* Status Bar */}
          <div className={`handshake-execution-panel__status-bar handshake-execution-panel__status-bar--${statusClass}`}>
            <div className="handshake-execution-panel__status-info">
              {/* Status Code */}
              {result.statusCode && (
                <span className="handshake-execution-panel__status-code">
                  {result.statusCode} {getStatusText(result.statusCode)}
                </span>
              )}
              
              {/* Outcome */}
              <span className={`handshake-execution-panel__outcome handshake-execution-panel__outcome--${result.outcome.toLowerCase()}`}>
                {result.outcome}
              </span>
            </div>

            <div className="handshake-execution-panel__status-meta">
              {/* Duration */}
              <span className="handshake-execution-panel__duration">
                ⏱ {result.durationMs}ms
              </span>
              
              {/* Timestamp */}
              <span className="handshake-execution-panel__timestamp">
                {result.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {result.error && (
            <div className="handshake-execution-panel__error">
              <span className="handshake-execution-panel__error-icon">⚠️</span>
              <span className="handshake-execution-panel__error-message">
                {result.error}
              </span>
            </div>
          )}

          {/* Response Tabs */}
          <div className="handshake-execution-panel__tabs">
            <button
              type="button"
              className={`handshake-execution-panel__tab ${activeTab === 'body' ? 'handshake-execution-panel__tab--active' : ''}`}
              onClick={() => setActiveTab('body')}
            >
              Body
            </button>
            <button
              type="button"
              className={`handshake-execution-panel__tab ${activeTab === 'headers' ? 'handshake-execution-panel__tab--active' : ''}`}
              onClick={() => setActiveTab('headers')}
            >
              Headers
              <span className="handshake-execution-panel__tab-count">
                ({headersCount})
              </span>
            </button>
            <button
              type="button"
              className={`handshake-execution-panel__tab ${activeTab === 'raw' ? 'handshake-execution-panel__tab--active' : ''}`}
              onClick={() => setActiveTab('raw')}
            >
              Raw
            </button>
          </div>

          {/* Body Tab */}
          {activeTab === 'body' && (
            <div className="handshake-execution-panel__body">
              {/* Format Selector */}
              <div className="handshake-execution-panel__format-bar">
                <div className="handshake-execution-panel__format-selector">
                  {(['auto', 'json', 'xml', 'html', 'raw'] as ResponseFormat[]).map(format => (
                    <button
                      key={format}
                      type="button"
                      className={`handshake-execution-panel__format-btn ${responseFormat === format ? 'handshake-execution-panel__format-btn--active' : ''}`}
                      onClick={() => setResponseFormat(format)}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                <button
                  type="button"
                  className="handshake-execution-panel__copy-btn"
                  onClick={() => handleCopy(formattedBody)}
                >
                  {isCopied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>

              {/* Body Content */}
              {result.body ? (
                <pre className={`handshake-execution-panel__body-content handshake-execution-panel__body-content--${responseFormat === 'auto' ? detectFormat(result.body) : responseFormat}`}>
                  <code>{formattedBody}</code>
                </pre>
              ) : (
                <div className="handshake-execution-panel__no-body">
                  No response body
                </div>
              )}
            </div>
          )}

          {/* Headers Tab */}
          {activeTab === 'headers' && (
            <div className="handshake-execution-panel__headers">
              {result.headers && Object.keys(result.headers).length > 0 ? (
                <table className="handshake-execution-panel__headers-table">
                  <thead>
                    <tr>
                      <th>Header</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.headers).map(([key, value]) => (
                      <tr key={key}>
                        <td className="handshake-execution-panel__header-key">{key}</td>
                        <td className="handshake-execution-panel__header-value">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="handshake-execution-panel__no-headers">
                  No response headers
                </div>
              )}
            </div>
          )}

          {/* Raw Tab */}
          {activeTab === 'raw' && (
            <div className="handshake-execution-panel__raw">
              <pre className="handshake-execution-panel__raw-content">
                <code>{JSON.stringify(result, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* No Result State */}
      {!result && !isExecuting && (
        <div className="handshake-execution-panel__no-result">
          <div className="handshake-execution-panel__no-result-icon">📡</div>
          <div className="handshake-execution-panel__no-result-text">
            Click "Execute Handshake" to send the request
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get HTTP status text
 */
function getStatusText(code: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    408: 'Request Timeout',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return statusTexts[code] || '';
}

/**
 * Detect response format
 */
function detectFormat(body: unknown): ResponseFormat {
  if (!body) return 'raw';
  
  const str = typeof body === 'string' ? body : JSON.stringify(body);
  
  // Try JSON
  try {
    JSON.parse(str);
    return 'json';
  } catch {
    // Not JSON
  }
  
  // Try XML/HTML
  if (str.trim().startsWith('<')) {
    if (str.toLowerCase().includes('<!doctype html') || str.toLowerCase().includes('<html')) {
      return 'html';
    }
    return 'xml';
  }
  
  return 'raw';
}

/**
 * Format XML/HTML with indentation
 */
function formatXml(xml: string): string {
  let formatted = '';
  let indent = '';
  
  xml.split(/>\s*</).forEach(node => {
    if (node.match(/^\/\w/)) {
      indent = indent.substring(2);
    }
    formatted += indent + '<' + node + '>\n';
    if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('input') && !node.startsWith('br')) {
      indent += '  ';
    }
  });
  
  return formatted.substring(1, formatted.length - 2);
}

/**
 * Execution result summary component
 */
export interface ExecutionResultSummaryProps {
  result: HandshakeExecutionResult;
  className?: string;
}

export const ExecutionResultSummary: React.FC<ExecutionResultSummaryProps> = ({
  result,
  className = '',
}) => {
  const statusClass = result.success ? 'success' : 'error';
  
  return (
    <div className={`execution-result-summary execution-result-summary--${statusClass} ${className}`}>
      <span className="execution-result-summary__icon">
        {result.success ? '✓' : '✗'}
      </span>
      <span className="execution-result-summary__outcome">
        {result.outcome}
      </span>
      {result.statusCode && (
        <span className="execution-result-summary__status">
          {result.statusCode}
        </span>
      )}
      <span className="execution-result-summary__duration">
        {result.durationMs}ms
      </span>
    </div>
  );
};

/**
 * Execution timing breakdown component
 */
export interface ExecutionTimingBreakdownProps {
  durationMs: number;
  breakdown?: {
    dns?: number;
    connect?: number;
    ssl?: number;
    send?: number;
    wait?: number;
    receive?: number;
  };
  className?: string;
}

export const ExecutionTimingBreakdown: React.FC<ExecutionTimingBreakdownProps> = ({
  durationMs,
  breakdown,
  className = '',
}) => {
  if (!breakdown) {
    return (
      <div className={`execution-timing execution-timing--simple ${className}`}>
        <span className="execution-timing__total">
          Total: {durationMs}ms
        </span>
      </div>
    );
  }

  return (
    <div className={`execution-timing ${className}`}>
      <div className="execution-timing__bar">
        {breakdown.dns && (
          <div 
            className="execution-timing__segment execution-timing__segment--dns"
            style={{ width: `${(breakdown.dns / durationMs) * 100}%` }}
            title={`DNS: ${breakdown.dns}ms`}
          />
        )}
        {breakdown.connect && (
          <div 
            className="execution-timing__segment execution-timing__segment--connect"
            style={{ width: `${(breakdown.connect / durationMs) * 100}%` }}
            title={`Connect: ${breakdown.connect}ms`}
          />
        )}
        {breakdown.ssl && (
          <div 
            className="execution-timing__segment execution-timing__segment--ssl"
            style={{ width: `${(breakdown.ssl / durationMs) * 100}%` }}
            title={`SSL: ${breakdown.ssl}ms`}
          />
        )}
        {breakdown.send && (
          <div 
            className="execution-timing__segment execution-timing__segment--send"
            style={{ width: `${(breakdown.send / durationMs) * 100}%` }}
            title={`Send: ${breakdown.send}ms`}
          />
        )}
        {breakdown.wait && (
          <div 
            className="execution-timing__segment execution-timing__segment--wait"
            style={{ width: `${(breakdown.wait / durationMs) * 100}%` }}
            title={`Wait: ${breakdown.wait}ms`}
          />
        )}
        {breakdown.receive && (
          <div 
            className="execution-timing__segment execution-timing__segment--receive"
            style={{ width: `${(breakdown.receive / durationMs) * 100}%` }}
            title={`Receive: ${breakdown.receive}ms`}
          />
        )}
      </div>
      <div className="execution-timing__legend">
        {breakdown.dns && <span className="execution-timing__legend-item execution-timing__legend-item--dns">DNS: {breakdown.dns}ms</span>}
        {breakdown.connect && <span className="execution-timing__legend-item execution-timing__legend-item--connect">Connect: {breakdown.connect}ms</span>}
        {breakdown.ssl && <span className="execution-timing__legend-item execution-timing__legend-item--ssl">SSL: {breakdown.ssl}ms</span>}
        {breakdown.wait && <span className="execution-timing__legend-item execution-timing__legend-item--wait">Wait: {breakdown.wait}ms</span>}
        <span className="execution-timing__legend-item execution-timing__legend-item--total">Total: {durationMs}ms</span>
      </div>
    </div>
  );
};

export default HandshakeExecutionPanel;
