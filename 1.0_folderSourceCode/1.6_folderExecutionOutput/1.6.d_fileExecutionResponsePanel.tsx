// ============================================
// PROTOCOL OS - EXECUTION RESPONSE PANEL
// ============================================
// Address: 1.6.d
// Purpose: Request/Response Data Display
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import type { ExecutionRequest, ExecutionResponse } from './1.6.a_fileExecutionOutputContainer';

/**
 * Execution Response Panel
 * 
 * Displays comprehensive request/response data:
 * - Request details (method, URL, headers, body)
 * - Response headers and body
 * - Body formatting (JSON, XML, HTML, raw)
 * - Cookies display
 * - Error details
 */

/**
 * Body format type
 */
export type BodyFormat = 'auto' | 'json' | 'xml' | 'html' | 'text' | 'binary';

/**
 * Execution response panel props
 */
export interface ExecutionResponsePanelProps {
  /** Request data */
  request?: ExecutionRequest;
  
  /** Response data */
  response?: ExecutionResponse;
  
  /** Error message */
  error?: string;
  
  /** Error details */
  errorDetails?: {
    code?: string;
    stack?: string;
    cause?: string;
  };
  
  /** Copy handler */
  onCopy?: () => void;
  
  /** Download handler */
  onDownload?: () => void;
  
  /** Show request section */
  showRequest?: boolean;
  
  /** Default body format */
  defaultFormat?: BodyFormat;
  
  /** Custom class name */
  className?: string;
}

/**
 * Format detection helper
 */
function detectFormat(body: unknown, contentType?: string): BodyFormat {
  if (!body) return 'text';
  
  // Check content type first
  if (contentType) {
    if (contentType.includes('application/json')) return 'json';
    if (contentType.includes('text/xml') || contentType.includes('application/xml')) return 'xml';
    if (contentType.includes('text/html')) return 'html';
    if (contentType.includes('application/octet-stream')) return 'binary';
  }
  
  // Try to detect from content
  const str = typeof body === 'string' ? body : '';
  
  if (typeof body === 'object') return 'json';
  
  // Try JSON parse
  try {
    JSON.parse(str);
    return 'json';
  } catch {
    // Not JSON
  }
  
  // Check for XML/HTML
  const trimmed = str.trim();
  if (trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && trimmed.includes('>'))) {
    if (trimmed.toLowerCase().includes('<!doctype html') || trimmed.toLowerCase().includes('<html')) {
      return 'html';
    }
    return 'xml';
  }
  
  return 'text';
}

/**
 * Format body for display
 */
function formatBody(body: unknown, format: BodyFormat): string {
  if (body === null || body === undefined) return '';
  
  switch (format) {
    case 'json':
      try {
        if (typeof body === 'string') {
          return JSON.stringify(JSON.parse(body), null, 2);
        }
        return JSON.stringify(body, null, 2);
      } catch {
        return String(body);
      }
    
    case 'xml':
    case 'html':
      return formatXml(String(body));
    
    case 'binary':
      return '[Binary data]';
    
    default:
      return String(body);
  }
}

/**
 * Simple XML/HTML formatter
 */
function formatXml(xml: string): string {
  let formatted = '';
  let indent = '';
  const tab = '  ';
  
  xml.split(/>\s*</).forEach((node, index) => {
    if (node.match(/^\/\w/)) {
      indent = indent.substring(tab.length);
    }
    formatted += (index > 0 ? indent + '<' : '<') + node + '>\n';
    if (node.match(/^<?\w[^>]*[^\/]$/) && !node.match(/^(br|hr|img|input|meta|link)/)) {
      indent += tab;
    }
  });
  
  return formatted.trim();
}

/**
 * Execution Response Panel Component
 */
export const ExecutionResponsePanel: React.FC<ExecutionResponsePanelProps> = ({
  request,
  response,
  error,
  errorDetails,
  onCopy,
  onDownload,
  showRequest = true,
  defaultFormat = 'auto',
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [activeSection, setActiveSection] = useState<'response' | 'request' | 'headers' | 'cookies'>('response');
  const [bodyFormat, setBodyFormat] = useState<BodyFormat>(defaultFormat);
  const [isCopied, setIsCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['body']));

  // ============================================
  // COMPUTED
  // ============================================

  const detectedFormat = useMemo(() => {
    return detectFormat(response?.body, response?.contentType);
  }, [response?.body, response?.contentType]);

  const currentFormat = bodyFormat === 'auto' ? detectedFormat : bodyFormat;

  const formattedBody = useMemo(() => {
    if (!response?.body) return '';
    return formatBody(response.body, currentFormat);
  }, [response?.body, currentFormat]);

  const formattedRequestBody = useMemo(() => {
    if (!request?.body) return '';
    const format = detectFormat(request.body);
    return formatBody(request.body, format);
  }, [request?.body]);

  const statusClass = useMemo(() => {
    if (!response?.statusCode) return 'unknown';
    if (response.statusCode >= 200 && response.statusCode < 300) return 'success';
    if (response.statusCode >= 300 && response.statusCode < 400) return 'redirect';
    if (response.statusCode >= 400 && response.statusCode < 500) return 'client-error';
    if (response.statusCode >= 500) return 'server-error';
    return 'unknown';
  }, [response?.statusCode]);

  const headerCount = response?.headers ? Object.keys(response.headers).length : 0;
  const cookieCount = response?.cookies?.length || 0;

  // ============================================
  // HANDLERS
  // ============================================

  const handleCopy = useCallback(async () => {
    if (onCopy) {
      onCopy();
    } else {
      try {
        await navigator.clipboard.writeText(formattedBody);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, [formattedBody, onCopy]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // ============================================
  // RENDER
  // ============================================

  // Error State
  if (error && !response) {
    return (
      <div className={`execution-response-panel execution-response-panel--error ${className}`}>
        <div className="execution-response-panel__error">
          <div className="execution-response-panel__error-header">
            <span className="execution-response-panel__error-icon">❌</span>
            <h4 className="execution-response-panel__error-title">Execution Failed</h4>
          </div>
          
          <div className="execution-response-panel__error-message">
            {error}
          </div>
          
          {errorDetails && (
            <div className="execution-response-panel__error-details">
              {errorDetails.code && (
                <div className="execution-response-panel__error-row">
                  <span className="execution-response-panel__error-label">Error Code:</span>
                  <code className="execution-response-panel__error-value">{errorDetails.code}</code>
                </div>
              )}
              
              {errorDetails.cause && (
                <div className="execution-response-panel__error-row">
                  <span className="execution-response-panel__error-label">Cause:</span>
                  <span className="execution-response-panel__error-value">{errorDetails.cause}</span>
                </div>
              )}
              
              {errorDetails.stack && (
                <div className="execution-response-panel__error-stack">
                  <button
                    type="button"
                    className="execution-response-panel__error-stack-toggle"
                    onClick={() => toggleSection('stack')}
                  >
                    {expandedSections.has('stack') ? '▼' : '▶'} Stack Trace
                  </button>
                  {expandedSections.has('stack') && (
                    <pre className="execution-response-panel__error-stack-content">
                      <code>{errorDetails.stack}</code>
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // No Response State
  if (!response && !request) {
    return (
      <div className={`execution-response-panel execution-response-panel--empty ${className}`}>
        <div className="execution-response-panel__empty">
          <div className="execution-response-panel__empty-icon">📭</div>
          <div className="execution-response-panel__empty-text">
            No response data available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`execution-response-panel ${className}`}>
      {/* Section Tabs */}
      <div className="execution-response-panel__tabs">
        <button
          type="button"
          className={`execution-response-panel__tab ${activeSection === 'response' ? 'execution-response-panel__tab--active' : ''}`}
          onClick={() => setActiveSection('response')}
        >
          Response Body
        </button>
        
        {showRequest && request && (
          <button
            type="button"
            className={`execution-response-panel__tab ${activeSection === 'request' ? 'execution-response-panel__tab--active' : ''}`}
            onClick={() => setActiveSection('request')}
          >
            Request
          </button>
        )}
        
        <button
          type="button"
          className={`execution-response-panel__tab ${activeSection === 'headers' ? 'execution-response-panel__tab--active' : ''}`}
          onClick={() => setActiveSection('headers')}
        >
          Headers
          <span className="execution-response-panel__tab-count">
            ({headerCount})
          </span>
        </button>
        
        {cookieCount > 0 && (
          <button
            type="button"
            className={`execution-response-panel__tab ${activeSection === 'cookies' ? 'execution-response-panel__tab--active' : ''}`}
            onClick={() => setActiveSection('cookies')}
          >
            Cookies
            <span className="execution-response-panel__tab-count">
              ({cookieCount})
            </span>
          </button>
        )}
      </div>

      {/* Response Body Section */}
      {activeSection === 'response' && (
        <div className="execution-response-panel__section">
          {/* Status Bar */}
          {response && (
            <div className={`execution-response-panel__status execution-response-panel__status--${statusClass}`}>
              <span className="execution-response-panel__status-code">
                {response.statusCode}
              </span>
              <span className="execution-response-panel__status-text">
                {response.statusText}
              </span>
              {response.contentType && (
                <span className="execution-response-panel__content-type">
                  {response.contentType}
                </span>
              )}
              {response.bodySize !== undefined && (
                <span className="execution-response-panel__body-size">
                  {formatBytes(response.bodySize)}
                </span>
              )}
            </div>
          )}

          {/* Format Selector */}
          <div className="execution-response-panel__format-bar">
            <div className="execution-response-panel__format-selector">
              {(['auto', 'json', 'xml', 'html', 'text'] as BodyFormat[]).map(format => (
                <button
                  key={format}
                  type="button"
                  className={`execution-response-panel__format-btn ${bodyFormat === format ? 'execution-response-panel__format-btn--active' : ''}`}
                  onClick={() => setBodyFormat(format)}
                >
                  {format === 'auto' ? `Auto (${detectedFormat})` : format.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div className="execution-response-panel__format-actions">
              <button
                type="button"
                className="execution-response-panel__action-btn"
                onClick={handleCopy}
                disabled={!response?.body}
              >
                {isCopied ? '✓ Copied' : '📋 Copy'}
              </button>
              
              {onDownload && (
                <button
                  type="button"
                  className="execution-response-panel__action-btn"
                  onClick={onDownload}
                  disabled={!response?.body}
                >
                  💾 Download
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          {response?.body ? (
            <div className={`execution-response-panel__body execution-response-panel__body--${currentFormat}`}>
              <pre className="execution-response-panel__body-content">
                <code>{formattedBody}</code>
              </pre>
            </div>
          ) : (
            <div className="execution-response-panel__no-body">
              No response body
            </div>
          )}

          {/* Redirects */}
          {response?.redirects && response.redirects.length > 0 && (
            <div className="execution-response-panel__redirects">
              <h5 className="execution-response-panel__redirects-title">
                Redirect Chain ({response.redirects.length})
              </h5>
              <div className="execution-response-panel__redirects-list">
                {response.redirects.map((redirect, index) => (
                  <div key={index} className="execution-response-panel__redirect">
                    <span className="execution-response-panel__redirect-status">
                      {redirect.statusCode}
                    </span>
                    <span className="execution-response-panel__redirect-url">
                      {redirect.url}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request Section */}
      {activeSection === 'request' && request && (
        <div className="execution-response-panel__section">
          {/* Request Line */}
          <div className="execution-response-panel__request-line">
            <span className={`execution-response-panel__method execution-response-panel__method--${request.method.toLowerCase()}`}>
              {request.method}
            </span>
            <span className="execution-response-panel__url">
              {request.url}
            </span>
          </div>

          {/* Request Headers */}
          {Object.keys(request.headers).length > 0 && (
            <div className="execution-response-panel__subsection">
              <button
                type="button"
                className="execution-response-panel__subsection-header"
                onClick={() => toggleSection('request-headers')}
              >
                <span className={`execution-response-panel__subsection-toggle ${expandedSections.has('request-headers') ? 'execution-response-panel__subsection-toggle--expanded' : ''}`}>
                  ▶
                </span>
                Request Headers ({Object.keys(request.headers).length})
              </button>
              {expandedSections.has('request-headers') && (
                <HeadersTable headers={request.headers} />
              )}
            </div>
          )}

          {/* Request Body */}
          {request.body && (
            <div className="execution-response-panel__subsection">
              <button
                type="button"
                className="execution-response-panel__subsection-header"
                onClick={() => toggleSection('request-body')}
              >
                <span className={`execution-response-panel__subsection-toggle ${expandedSections.has('request-body') ? 'execution-response-panel__subsection-toggle--expanded' : ''}`}>
                  ▶
                </span>
                Request Body
                {request.bodySize !== undefined && (
                  <span className="execution-response-panel__subsection-size">
                    ({formatBytes(request.bodySize)})
                  </span>
                )}
              </button>
              {expandedSections.has('request-body') && (
                <div className="execution-response-panel__body">
                  <pre className="execution-response-panel__body-content">
                    <code>{formattedRequestBody}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Headers Section */}
      {activeSection === 'headers' && response && (
        <div className="execution-response-panel__section">
          {headerCount > 0 ? (
            <HeadersTable headers={response.headers} />
          ) : (
            <div className="execution-response-panel__no-headers">
              No response headers
            </div>
          )}
        </div>
      )}

      {/* Cookies Section */}
      {activeSection === 'cookies' && response?.cookies && (
        <div className="execution-response-panel__section">
          <div className="execution-response-panel__cookies">
            {response.cookies.map((cookie, index) => (
              <div key={index} className="execution-response-panel__cookie">
                <div className="execution-response-panel__cookie-header">
                  <span className="execution-response-panel__cookie-name">
                    {cookie.name}
                  </span>
                  <div className="execution-response-panel__cookie-flags">
                    {cookie.httpOnly && (
                      <span className="execution-response-panel__cookie-flag">HttpOnly</span>
                    )}
                    {cookie.secure && (
                      <span className="execution-response-panel__cookie-flag">Secure</span>
                    )}
                  </div>
                </div>
                <div className="execution-response-panel__cookie-value">
                  {cookie.value}
                </div>
                <div className="execution-response-panel__cookie-meta">
                  {cookie.domain && (
                    <span>Domain: {cookie.domain}</span>
                  )}
                  {cookie.path && (
                    <span>Path: {cookie.path}</span>
                  )}
                  {cookie.expires && (
                    <span>Expires: {cookie.expires.toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Headers table component
 */
interface HeadersTableProps {
  headers: Record<string, string>;
}

const HeadersTable: React.FC<HeadersTableProps> = ({ headers }) => {
  return (
    <table className="execution-response-panel__headers-table">
      <thead>
        <tr>
          <th>Header</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(headers).map(([key, value]) => (
          <tr key={key}>
            <td className="execution-response-panel__header-key">{key}</td>
            <td className="execution-response-panel__header-value">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
 * Compact response preview
 */
export interface ResponsePreviewProps {
  response?: ExecutionResponse;
  maxLength?: number;
  className?: string;
}

export const ResponsePreview: React.FC<ResponsePreviewProps> = ({
  response,
  maxLength = 200,
  className = '',
}) => {
  if (!response?.body) {
    return (
      <div className={`response-preview response-preview--empty ${className}`}>
        No response body
      </div>
    );
  }
  
  const bodyStr = typeof response.body === 'string' 
    ? response.body 
    : JSON.stringify(response.body);
  
  const preview = bodyStr.length > maxLength 
    ? bodyStr.substring(0, maxLength) + '...'
    : bodyStr;
  
  return (
    <div className={`response-preview ${className}`}>
      <div className="response-preview__status">
        <span className={`response-preview__code response-preview__code--${response.statusCode < 400 ? 'success' : 'error'}`}>
          {response.statusCode}
        </span>
        <span className="response-preview__text">{response.statusText}</span>
      </div>
      <pre className="response-preview__body">
        <code>{preview}</code>
      </pre>
    </div>
  );
};

export default ExecutionResponsePanel;
