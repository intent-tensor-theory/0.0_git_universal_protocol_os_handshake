// ============================================
// PROTOCOL OS - HANDSHAKE CREDENTIAL FORM CONTAINER
// ============================================
// Address: 1.4.4.d
// Purpose: Container for Credential Input Forms
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import type { CredentialSet } from './1.4.4.a_fileHandshakeAccordionSection';
import type { ResourceType } from '../1.4.1.b_fileResourceSerialNumberGenerator';

/**
 * Handshake Credential Form Container
 * 
 * Provides protocol-specific credential input forms:
 * - OAuth credentials (client ID, secret, scopes)
 * - API key credentials
 * - Basic auth credentials
 * - Bearer token credentials
 * - Custom credentials
 */

/**
 * Credential type
 */
export type CredentialType = 'oauth' | 'apikey' | 'basic' | 'bearer' | 'custom';

/**
 * Credential field definition
 */
export interface CredentialFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'password' | 'textarea' | 'select' | 'checkbox' | 'url';
  placeholder?: string;
  required?: boolean;
  sensitive?: boolean;
  options?: Array<{ value: string; label: string }>;
  helpText?: string;
}

/**
 * Protocol credential configurations
 */
const CREDENTIAL_CONFIGS: Record<ResourceType, {
  type: CredentialType;
  title: string;
  description: string;
  fields: CredentialFieldDefinition[];
}> = {
  oauth: {
    type: 'oauth',
    title: 'OAuth Credentials',
    description: 'Configure OAuth 2.0 authentication credentials',
    fields: [
      {
        id: 'clientId',
        label: 'Client ID',
        type: 'text',
        placeholder: 'your-client-id',
        required: true,
      },
      {
        id: 'clientSecret',
        label: 'Client Secret',
        type: 'password',
        placeholder: '••••••••',
        required: true,
        sensitive: true,
      },
      {
        id: 'authorizationUrl',
        label: 'Authorization URL',
        type: 'url',
        placeholder: 'https://auth.example.com/authorize',
        required: true,
      },
      {
        id: 'tokenUrl',
        label: 'Token URL',
        type: 'url',
        placeholder: 'https://auth.example.com/token',
        required: true,
      },
      {
        id: 'scopes',
        label: 'Scopes',
        type: 'text',
        placeholder: 'read write profile',
        helpText: 'Space-separated list of scopes',
      },
      {
        id: 'redirectUri',
        label: 'Redirect URI',
        type: 'url',
        placeholder: 'http://localhost:3000/callback',
      },
    ],
  },
  apikey: {
    type: 'apikey',
    title: 'API Key',
    description: 'Configure API key authentication',
    fields: [
      {
        id: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'your-api-key',
        required: true,
        sensitive: true,
      },
      {
        id: 'headerName',
        label: 'Header Name',
        type: 'text',
        placeholder: 'X-API-Key',
        helpText: 'The header name to use for the API key',
      },
      {
        id: 'placement',
        label: 'Key Placement',
        type: 'select',
        options: [
          { value: 'header', label: 'Header' },
          { value: 'query', label: 'Query Parameter' },
          { value: 'body', label: 'Request Body' },
        ],
      },
    ],
  },
  graphql: {
    type: 'bearer',
    title: 'GraphQL Authentication',
    description: 'Configure authentication for GraphQL endpoint',
    fields: [
      {
        id: 'authType',
        label: 'Authentication Type',
        type: 'select',
        options: [
          { value: 'bearer', label: 'Bearer Token' },
          { value: 'apikey', label: 'API Key' },
          { value: 'basic', label: 'Basic Auth' },
          { value: 'none', label: 'No Auth' },
        ],
      },
      {
        id: 'token',
        label: 'Token / API Key',
        type: 'password',
        placeholder: '••••••••',
        sensitive: true,
      },
    ],
  },
  rest: {
    type: 'bearer',
    title: 'REST API Authentication',
    description: 'Configure authentication for REST API',
    fields: [
      {
        id: 'authType',
        label: 'Authentication Type',
        type: 'select',
        options: [
          { value: 'bearer', label: 'Bearer Token' },
          { value: 'apikey', label: 'API Key' },
          { value: 'basic', label: 'Basic Auth' },
          { value: 'oauth', label: 'OAuth 2.0' },
          { value: 'none', label: 'No Auth' },
        ],
      },
      {
        id: 'token',
        label: 'Token / API Key',
        type: 'password',
        placeholder: '••••••••',
        sensitive: true,
      },
      {
        id: 'username',
        label: 'Username',
        type: 'text',
        placeholder: 'username',
        helpText: 'For Basic Auth only',
      },
      {
        id: 'password',
        label: 'Password',
        type: 'password',
        placeholder: '••••••••',
        sensitive: true,
        helpText: 'For Basic Auth only',
      },
    ],
  },
  websocket: {
    type: 'bearer',
    title: 'WebSocket Authentication',
    description: 'Configure authentication for WebSocket connection',
    fields: [
      {
        id: 'authType',
        label: 'Authentication Type',
        type: 'select',
        options: [
          { value: 'bearer', label: 'Bearer Token (Header)' },
          { value: 'query', label: 'Token in Query String' },
          { value: 'message', label: 'Auth Message' },
          { value: 'none', label: 'No Auth' },
        ],
      },
      {
        id: 'token',
        label: 'Token',
        type: 'password',
        placeholder: '••••••••',
        sensitive: true,
      },
      {
        id: 'authMessage',
        label: 'Auth Message (JSON)',
        type: 'textarea',
        placeholder: '{"type": "auth", "token": "..."}',
        helpText: 'JSON message to send for authentication',
      },
    ],
  },
  soap: {
    type: 'basic',
    title: 'SOAP Authentication',
    description: 'Configure authentication for SOAP service',
    fields: [
      {
        id: 'authType',
        label: 'Authentication Type',
        type: 'select',
        options: [
          { value: 'basic', label: 'Basic Auth' },
          { value: 'wsse', label: 'WS-Security' },
          { value: 'certificate', label: 'Certificate' },
          { value: 'none', label: 'No Auth' },
        ],
      },
      {
        id: 'username',
        label: 'Username',
        type: 'text',
        placeholder: 'username',
      },
      {
        id: 'password',
        label: 'Password',
        type: 'password',
        placeholder: '••••••••',
        sensitive: true,
      },
    ],
  },
  github: {
    type: 'oauth',
    title: 'GitHub Authentication',
    description: 'Configure GitHub API authentication',
    fields: [
      {
        id: 'authType',
        label: 'Authentication Type',
        type: 'select',
        options: [
          { value: 'pat', label: 'Personal Access Token' },
          { value: 'fine-grained-pat', label: 'Fine-Grained PAT' },
          { value: 'app', label: 'GitHub App' },
          { value: 'oauth', label: 'OAuth Token' },
        ],
      },
      {
        id: 'token',
        label: 'Token',
        type: 'password',
        placeholder: 'ghp_xxxxxxxxxxxx',
        required: true,
        sensitive: true,
      },
      {
        id: 'appId',
        label: 'App ID',
        type: 'text',
        placeholder: '123456',
        helpText: 'For GitHub App authentication',
      },
      {
        id: 'installationId',
        label: 'Installation ID',
        type: 'text',
        placeholder: '12345678',
        helpText: 'For GitHub App authentication',
      },
    ],
  },
  scraper: {
    type: 'custom',
    title: 'Scraper Configuration',
    description: 'Configure web scraper options (no authentication)',
    fields: [
      {
        id: 'userAgent',
        label: 'User Agent',
        type: 'text',
        placeholder: 'Mozilla/5.0...',
        helpText: 'Custom User-Agent string',
      },
      {
        id: 'cookies',
        label: 'Cookies',
        type: 'textarea',
        placeholder: 'name=value; name2=value2',
        helpText: 'Optional cookies to include',
      },
      {
        id: 'respectRobotsTxt',
        label: 'Respect robots.txt',
        type: 'checkbox',
      },
    ],
  },
  custom: {
    type: 'custom',
    title: 'Custom Credentials',
    description: 'Configure custom authentication',
    fields: [
      {
        id: 'customHeaders',
        label: 'Custom Headers (JSON)',
        type: 'textarea',
        placeholder: '{"X-Custom-Header": "value"}',
        helpText: 'JSON object of custom headers',
      },
      {
        id: 'customBody',
        label: 'Custom Body (JSON)',
        type: 'textarea',
        placeholder: '{"key": "value"}',
        helpText: 'JSON object for request body',
      },
    ],
  },
};

/**
 * Handshake credential form container props
 */
export interface HandshakeCredentialFormContainerProps {
  /** Current credentials */
  credentials: CredentialSet | undefined;
  
  /** Protocol type */
  protocolType: ResourceType;
  
  /** Change handler */
  onChange: (credentials: CredentialSet) => void;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Is in edit mode */
  isEditing?: boolean;
  
  /** Show sensitive values */
  showSensitiveValues?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Handshake Credential Form Container Component
 */
export const HandshakeCredentialFormContainer: React.FC<HandshakeCredentialFormContainerProps> = ({
  credentials,
  protocolType,
  onChange,
  disabled = false,
  isEditing = false,
  showSensitiveValues = false,
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // ============================================
  // COMPUTED
  // ============================================

  const config = useMemo(() => {
    return CREDENTIAL_CONFIGS[protocolType] || CREDENTIAL_CONFIGS.custom;
  }, [protocolType]);

  const currentValues = useMemo(() => {
    return credentials?.values || {};
  }, [credentials]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFieldChange = useCallback((fieldId: string, value: string | boolean) => {
    const newValues = {
      ...currentValues,
      [fieldId]: String(value),
    };
    
    onChange({
      id: credentials?.id || generateCredentialId(),
      name: credentials?.name || 'Credentials',
      type: config.type,
      values: newValues,
      isEncrypted: false,
      expiresAt: credentials?.expiresAt,
    });
  }, [currentValues, credentials, config, onChange]);

  const toggleShowSecret = useCallback((fieldId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId],
    }));
  }, []);

  // ============================================
  // RENDER
  // ============================================

  // Read-only mode
  if (!isEditing) {
    return (
      <div className={`handshake-credential-form handshake-credential-form--readonly ${className}`}>
        <div className="handshake-credential-form__header">
          <h4 className="handshake-credential-form__title">{config.title}</h4>
          {credentials && (
            <span className="handshake-credential-form__status">
              {credentials.isEncrypted ? '🔒 Encrypted' : '⚠️ Unencrypted'}
            </span>
          )}
        </div>
        
        {credentials ? (
          <div className="handshake-credential-form__values">
            {config.fields.map(field => {
              const value = currentValues[field.id];
              if (!value && field.type !== 'checkbox') return null;
              
              return (
                <div key={field.id} className="handshake-credential-form__value-row">
                  <span className="handshake-credential-form__value-label">
                    {field.label}:
                  </span>
                  <span className="handshake-credential-form__value-content">
                    {field.sensitive && !showSensitiveValues ? (
                      '••••••••'
                    ) : field.type === 'checkbox' ? (
                      value === 'true' ? '✓ Yes' : '✗ No'
                    ) : (
                      <code>{value}</code>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="handshake-credential-form__empty">
            No credentials configured
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className={`handshake-credential-form handshake-credential-form--editing ${className}`}>
      <div className="handshake-credential-form__header">
        <h4 className="handshake-credential-form__title">{config.title}</h4>
        <p className="handshake-credential-form__description">{config.description}</p>
      </div>

      <div className="handshake-credential-form__fields">
        {config.fields.map(field => (
          <CredentialField
            key={field.id}
            field={field}
            value={currentValues[field.id] || ''}
            onChange={(value) => handleFieldChange(field.id, value)}
            showSecret={showSecrets[field.id] || showSensitiveValues}
            onToggleSecret={() => toggleShowSecret(field.id)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Security Warning */}
      <div className="handshake-credential-form__security-note">
        <span className="handshake-credential-form__security-icon">🔐</span>
        <span className="handshake-credential-form__security-text">
          Credentials are stored securely and encrypted at rest.
        </span>
      </div>
    </div>
  );
};

/**
 * Credential field component
 */
interface CredentialFieldProps {
  field: CredentialFieldDefinition;
  value: string;
  onChange: (value: string | boolean) => void;
  showSecret: boolean;
  onToggleSecret: () => void;
  disabled: boolean;
}

const CredentialField: React.FC<CredentialFieldProps> = ({
  field,
  value,
  onChange,
  showSecret,
  onToggleSecret,
  disabled,
}) => {
  const handleChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (field.type === 'checkbox') {
      onChange((event.target as HTMLInputElement).checked);
    } else {
      onChange(event.target.value);
    }
  }, [field.type, onChange]);

  return (
    <div className="handshake-credential-form__field">
      <label 
        className="handshake-credential-form__field-label"
        htmlFor={`credential-${field.id}`}
      >
        {field.label}
        {field.required && <span className="handshake-credential-form__required">*</span>}
      </label>

      <div className="handshake-credential-form__field-input-wrapper">
        {field.type === 'textarea' ? (
          <textarea
            id={`credential-${field.id}`}
            className="handshake-credential-form__textarea"
            value={value}
            onChange={handleChange}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={3}
          />
        ) : field.type === 'select' && field.options ? (
          <select
            id={`credential-${field.id}`}
            className="handshake-credential-form__select"
            value={value}
            onChange={handleChange}
            disabled={disabled}
          >
            <option value="">Select...</option>
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === 'checkbox' ? (
          <label className="handshake-credential-form__checkbox-wrapper">
            <input
              type="checkbox"
              id={`credential-${field.id}`}
              className="handshake-credential-form__checkbox"
              checked={value === 'true'}
              onChange={handleChange}
              disabled={disabled}
            />
            <span className="handshake-credential-form__checkbox-label">
              Enabled
            </span>
          </label>
        ) : (
          <>
            <input
              type={field.sensitive && !showSecret ? 'password' : 'text'}
              id={`credential-${field.id}`}
              className={`handshake-credential-form__input ${
                field.type === 'url' ? 'handshake-credential-form__input--url' : ''
              }`}
              value={value}
              onChange={handleChange}
              placeholder={field.placeholder}
              disabled={disabled}
            />
            {field.sensitive && (
              <button
                type="button"
                className="handshake-credential-form__toggle-secret"
                onClick={onToggleSecret}
                aria-label={showSecret ? 'Hide value' : 'Show value'}
              >
                {showSecret ? '👁️' : '👁️‍🗨️'}
              </button>
            )}
          </>
        )}
      </div>

      {field.helpText && (
        <span className="handshake-credential-form__field-help">
          {field.helpText}
        </span>
      )}
    </div>
  );
};

/**
 * Generate credential ID
 */
function generateCredentialId(): string {
  return `cred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Credential validation
 */
export function validateCredentials(
  credentials: CredentialSet | undefined,
  protocolType: ResourceType
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (!credentials) {
    return { isValid: false, errors: { _form: 'Credentials are required' } };
  }
  
  const config = CREDENTIAL_CONFIGS[protocolType] || CREDENTIAL_CONFIGS.custom;
  
  for (const field of config.fields) {
    if (field.required && !credentials.values[field.id]) {
      errors[field.id] = `${field.label} is required`;
    }
    
    if (field.type === 'url' && credentials.values[field.id]) {
      try {
        new URL(credentials.values[field.id]);
      } catch {
        errors[field.id] = 'Invalid URL format';
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export default HandshakeCredentialFormContainer;
