// ============================================
// PROTOCOL OS - HANDSHAKE DYNAMIC INPUT SECTION
// ============================================
// Address: 1.4.4.f
// Purpose: Dynamic Form Fields for Request Configuration
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import type { HandshakeConfiguration } from './1.4.4.a_fileHandshakeAccordionSection';
import type { ResourceType } from '../1.4.1.b_fileResourceSerialNumberGenerator';

/**
 * Handshake Dynamic Input Section
 * 
 * Provides dynamic input fields for configuring API requests:
 * - HTTP method selection
 * - URL with variable substitution
 * - Headers (key-value pairs)
 * - Query parameters
 * - Request body (JSON, form, raw)
 */

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Body type
 */
export type BodyType = 'none' | 'json' | 'form' | 'raw' | 'graphql';

/**
 * Key-value pair
 */
export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

/**
 * Request configuration
 */
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  bodyType: BodyType;
  body: string | Record<string, unknown>;
}

/**
 * Protocol-specific defaults
 */
const PROTOCOL_DEFAULTS: Record<ResourceType, Partial<RequestConfig>> = {
  oauth: {
    method: 'POST',
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/x-www-form-urlencoded', enabled: true },
    ],
    bodyType: 'form',
  },
  apikey: {
    method: 'GET',
    headers: [],
    bodyType: 'none',
  },
  graphql: {
    method: 'POST',
    headers: [
      { id: '1', key: 'Content-Type', value: 'application/json', enabled: true },
    ],
    bodyType: 'graphql',
    body: '{\n  "query": "",\n  "variables": {}\n}',
  },
  rest: {
    method: 'GET',
    headers: [
      { id: '1', key: 'Accept', value: 'application/json', enabled: true },
    ],
    bodyType: 'json',
  },
  websocket: {
    method: 'GET',
    headers: [],
    bodyType: 'json',
  },
  soap: {
    method: 'POST',
    headers: [
      { id: '1', key: 'Content-Type', value: 'text/xml; charset=utf-8', enabled: true },
      { id: '2', key: 'SOAPAction', value: '', enabled: true },
    ],
    bodyType: 'raw',
  },
  github: {
    method: 'GET',
    headers: [
      { id: '1', key: 'Accept', value: 'application/vnd.github+json', enabled: true },
      { id: '2', key: 'X-GitHub-Api-Version', value: '2022-11-28', enabled: true },
    ],
    bodyType: 'json',
  },
  scraper: {
    method: 'GET',
    headers: [
      { id: '1', key: 'Accept', value: 'text/html', enabled: true },
    ],
    bodyType: 'none',
  },
  custom: {
    method: 'GET',
    headers: [],
    bodyType: 'none',
  },
};

/**
 * HTTP method colors
 */
const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  PATCH: 'purple',
  DELETE: 'red',
  HEAD: 'gray',
  OPTIONS: 'gray',
};

/**
 * Handshake dynamic input section props
 */
export interface HandshakeDynamicInputSectionProps {
  /** Request configuration */
  request: HandshakeConfiguration['request'] | undefined;
  
  /** Protocol type */
  protocolType: ResourceType;
  
  /** Change handler */
  onChange: (request: HandshakeConfiguration['request']) => void;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Is in edit mode */
  isEditing?: boolean;
  
  /** Show advanced options */
  showAdvanced?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Handshake Dynamic Input Section Component
 */
export const HandshakeDynamicInputSection: React.FC<HandshakeDynamicInputSectionProps> = ({
  request,
  protocolType,
  onChange,
  disabled = false,
  isEditing = false,
  showAdvanced = true,
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [activeTab, setActiveTab] = useState<'headers' | 'params' | 'body'>('headers');
  const [bodyType, setBodyType] = useState<BodyType>(
    detectBodyType(request?.body, request?.headers)
  );

  // ============================================
  // COMPUTED
  // ============================================

  const defaults = useMemo(() => {
    return PROTOCOL_DEFAULTS[protocolType] || PROTOCOL_DEFAULTS.custom;
  }, [protocolType]);

  const currentRequest = useMemo((): RequestConfig => {
    return {
      method: (request?.method as HttpMethod) || defaults.method || 'GET',
      url: request?.url || '',
      headers: parseKeyValuePairs(request?.headers) || defaults.headers || [],
      params: parseKeyValuePairs(request?.params) || [],
      bodyType: bodyType,
      body: request?.body as string || defaults.body || '',
    };
  }, [request, defaults, bodyType]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleMethodChange = useCallback((method: HttpMethod) => {
    onChange({
      ...request,
      method,
    });
  }, [request, onChange]);

  const handleUrlChange = useCallback((url: string) => {
    onChange({
      ...request,
      url,
    });
  }, [request, onChange]);

  const handleHeadersChange = useCallback((headers: KeyValuePair[]) => {
    onChange({
      ...request,
      headers: keyValuePairsToRecord(headers),
    });
  }, [request, onChange]);

  const handleParamsChange = useCallback((params: KeyValuePair[]) => {
    onChange({
      ...request,
      params: keyValuePairsToRecord(params),
    });
  }, [request, onChange]);

  const handleBodyChange = useCallback((body: string | Record<string, unknown>) => {
    onChange({
      ...request,
      body,
    });
  }, [request, onChange]);

  const handleBodyTypeChange = useCallback((type: BodyType) => {
    setBodyType(type);
    
    // Update content-type header based on body type
    const contentTypeMap: Record<BodyType, string | null> = {
      none: null,
      json: 'application/json',
      form: 'application/x-www-form-urlencoded',
      raw: 'text/plain',
      graphql: 'application/json',
    };
    
    const newContentType = contentTypeMap[type];
    if (newContentType) {
      const headers = [...currentRequest.headers];
      const contentTypeIndex = headers.findIndex(h => h.key.toLowerCase() === 'content-type');
      
      if (contentTypeIndex >= 0) {
        headers[contentTypeIndex] = { ...headers[contentTypeIndex], value: newContentType };
      } else {
        headers.unshift({
          id: generateId(),
          key: 'Content-Type',
          value: newContentType,
          enabled: true,
        });
      }
      
      handleHeadersChange(headers);
    }
  }, [currentRequest.headers, handleHeadersChange]);

  // ============================================
  // RENDER
  // ============================================

  // Read-only mode
  if (!isEditing) {
    return (
      <div className={`handshake-dynamic-input handshake-dynamic-input--readonly ${className}`}>
        <div className="handshake-dynamic-input__request-line">
          <span className={`handshake-dynamic-input__method handshake-dynamic-input__method--${METHOD_COLORS[currentRequest.method]}`}>
            {currentRequest.method}
          </span>
          <span className="handshake-dynamic-input__url">
            {currentRequest.url || 'No URL configured'}
          </span>
        </div>
        
        {currentRequest.headers.length > 0 && (
          <div className="handshake-dynamic-input__readonly-section">
            <span className="handshake-dynamic-input__readonly-label">Headers:</span>
            <span className="handshake-dynamic-input__readonly-value">
              {currentRequest.headers.filter(h => h.enabled).length} configured
            </span>
          </div>
        )}
        
        {currentRequest.body && bodyType !== 'none' && (
          <div className="handshake-dynamic-input__readonly-section">
            <span className="handshake-dynamic-input__readonly-label">Body:</span>
            <span className="handshake-dynamic-input__readonly-value">
              {bodyType.toUpperCase()} format
            </span>
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className={`handshake-dynamic-input handshake-dynamic-input--editing ${className}`}>
      {/* Request Line */}
      <div className="handshake-dynamic-input__request-line">
        {/* Method Selector */}
        <select
          className={`handshake-dynamic-input__method-select handshake-dynamic-input__method-select--${METHOD_COLORS[currentRequest.method]}`}
          value={currentRequest.method}
          onChange={(e) => handleMethodChange(e.target.value as HttpMethod)}
          disabled={disabled}
        >
          {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as HttpMethod[]).map(method => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>

        {/* URL Input */}
        <input
          type="text"
          className="handshake-dynamic-input__url-input"
          value={currentRequest.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          disabled={disabled}
        />
      </div>

      {/* URL Variables Hint */}
      <div className="handshake-dynamic-input__url-hint">
        Use <code>{'{{variable}}'}</code> for dynamic values
      </div>

      {/* Tab Navigation */}
      <div className="handshake-dynamic-input__tabs">
        <button
          type="button"
          className={`handshake-dynamic-input__tab ${activeTab === 'headers' ? 'handshake-dynamic-input__tab--active' : ''}`}
          onClick={() => setActiveTab('headers')}
        >
          Headers
          <span className="handshake-dynamic-input__tab-count">
            ({currentRequest.headers.filter(h => h.enabled).length})
          </span>
        </button>
        <button
          type="button"
          className={`handshake-dynamic-input__tab ${activeTab === 'params' ? 'handshake-dynamic-input__tab--active' : ''}`}
          onClick={() => setActiveTab('params')}
        >
          Query Params
          <span className="handshake-dynamic-input__tab-count">
            ({currentRequest.params.filter(p => p.enabled).length})
          </span>
        </button>
        <button
          type="button"
          className={`handshake-dynamic-input__tab ${activeTab === 'body' ? 'handshake-dynamic-input__tab--active' : ''}`}
          onClick={() => setActiveTab('body')}
        >
          Body
        </button>
      </div>

      {/* Headers Tab */}
      {activeTab === 'headers' && (
        <KeyValueEditor
          pairs={currentRequest.headers}
          onChange={handleHeadersChange}
          keyPlaceholder="Header name"
          valuePlaceholder="Header value"
          disabled={disabled}
        />
      )}

      {/* Params Tab */}
      {activeTab === 'params' && (
        <KeyValueEditor
          pairs={currentRequest.params}
          onChange={handleParamsChange}
          keyPlaceholder="Parameter name"
          valuePlaceholder="Parameter value"
          disabled={disabled}
        />
      )}

      {/* Body Tab */}
      {activeTab === 'body' && (
        <div className="handshake-dynamic-input__body-section">
          {/* Body Type Selector */}
          <div className="handshake-dynamic-input__body-type">
            {(['none', 'json', 'form', 'raw', 'graphql'] as BodyType[]).map(type => (
              <button
                key={type}
                type="button"
                className={`handshake-dynamic-input__body-type-btn ${bodyType === type ? 'handshake-dynamic-input__body-type-btn--active' : ''}`}
                onClick={() => handleBodyTypeChange(type)}
                disabled={disabled}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Body Editor */}
          {bodyType === 'none' ? (
            <div className="handshake-dynamic-input__no-body">
              This request does not have a body
            </div>
          ) : bodyType === 'json' || bodyType === 'graphql' || bodyType === 'raw' ? (
            <textarea
              className="handshake-dynamic-input__body-textarea"
              value={typeof currentRequest.body === 'string' ? currentRequest.body : JSON.stringify(currentRequest.body, null, 2)}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : bodyType === 'graphql' ? '{\n  "query": "query { ... }",\n  "variables": {}\n}' : 'Raw body content'}
              disabled={disabled}
              rows={10}
            />
          ) : (
            // Form body
            <KeyValueEditor
              pairs={parseFormBody(currentRequest.body)}
              onChange={(pairs) => handleBodyChange(keyValuePairsToFormString(pairs))}
              keyPlaceholder="Field name"
              valuePlaceholder="Field value"
              disabled={disabled}
            />
          )}

          {/* JSON Validation */}
          {(bodyType === 'json' || bodyType === 'graphql') && typeof currentRequest.body === 'string' && currentRequest.body && (
            <div className="handshake-dynamic-input__json-status">
              {isValidJson(currentRequest.body) ? (
                <span className="handshake-dynamic-input__json-valid">✓ Valid JSON</span>
              ) : (
                <span className="handshake-dynamic-input__json-invalid">✗ Invalid JSON</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Key-Value Editor Component
 */
interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  disabled = false,
}) => {
  const handleAddPair = useCallback(() => {
    onChange([
      ...pairs,
      { id: generateId(), key: '', value: '', enabled: true },
    ]);
  }, [pairs, onChange]);

  const handleRemovePair = useCallback((id: string) => {
    onChange(pairs.filter(p => p.id !== id));
  }, [pairs, onChange]);

  const handleUpdatePair = useCallback((id: string, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    onChange(pairs.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  }, [pairs, onChange]);

  return (
    <div className="key-value-editor">
      {pairs.length > 0 ? (
        <div className="key-value-editor__list">
          {pairs.map(pair => (
            <div key={pair.id} className="key-value-editor__row">
              <input
                type="checkbox"
                className="key-value-editor__checkbox"
                checked={pair.enabled}
                onChange={(e) => handleUpdatePair(pair.id, 'enabled', e.target.checked)}
                disabled={disabled}
              />
              <input
                type="text"
                className="key-value-editor__key"
                value={pair.key}
                onChange={(e) => handleUpdatePair(pair.id, 'key', e.target.value)}
                placeholder={keyPlaceholder}
                disabled={disabled || !pair.enabled}
              />
              <input
                type="text"
                className="key-value-editor__value"
                value={pair.value}
                onChange={(e) => handleUpdatePair(pair.id, 'value', e.target.value)}
                placeholder={valuePlaceholder}
                disabled={disabled || !pair.enabled}
              />
              <button
                type="button"
                className="key-value-editor__remove"
                onClick={() => handleRemovePair(pair.id)}
                disabled={disabled}
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="key-value-editor__empty">
          No items configured
        </div>
      )}
      
      <button
        type="button"
        className="key-value-editor__add"
        onClick={handleAddPair}
        disabled={disabled}
      >
        + Add Item
      </button>
    </div>
  );
};

/**
 * Helper functions
 */

function generateId(): string {
  return `kv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function parseKeyValuePairs(record: Record<string, string> | undefined): KeyValuePair[] {
  if (!record) return [];
  return Object.entries(record).map(([key, value], index) => ({
    id: `kv-${index}`,
    key,
    value,
    enabled: true,
  }));
}

function keyValuePairsToRecord(pairs: KeyValuePair[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const pair of pairs) {
    if (pair.enabled && pair.key) {
      record[pair.key] = pair.value;
    }
  }
  return record;
}

function detectBodyType(body: unknown, headers?: Record<string, string>): BodyType {
  if (!body) return 'none';
  
  const contentType = headers?.['Content-Type'] || headers?.['content-type'] || '';
  
  if (contentType.includes('application/json')) return 'json';
  if (contentType.includes('application/x-www-form-urlencoded')) return 'form';
  if (contentType.includes('text/')) return 'raw';
  
  if (typeof body === 'string') {
    try {
      JSON.parse(body);
      return 'json';
    } catch {
      return 'raw';
    }
  }
  
  return 'json';
}

function parseFormBody(body: string | Record<string, unknown>): KeyValuePair[] {
  if (typeof body !== 'string') return [];
  
  return body.split('&').map((pair, index) => {
    const [key, value] = pair.split('=').map(decodeURIComponent);
    return {
      id: `form-${index}`,
      key: key || '',
      value: value || '',
      enabled: true,
    };
  });
}

function keyValuePairsToFormString(pairs: KeyValuePair[]): string {
  return pairs
    .filter(p => p.enabled && p.key)
    .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&');
}

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export default HandshakeDynamicInputSection;
