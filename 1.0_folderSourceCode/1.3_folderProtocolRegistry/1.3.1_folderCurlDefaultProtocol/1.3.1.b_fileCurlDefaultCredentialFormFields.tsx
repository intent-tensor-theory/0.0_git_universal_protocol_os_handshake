// ============================================
// PROTOCOL OS - CURL DEFAULT CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.1.b
// Purpose: React component for cURL command configuration UI
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { CurlDefaultHandshakeExecutor } from './1.3.1.a_fileCurlDefaultHandshakeExecutor';

/**
 * Props for the credential form
 */
export interface CurlDefaultCredentialFormFieldsProps {
  /** Current credential values */
  values: Record<string, unknown>;
  
  /** Callback when values change */
  onChange: (values: Record<string, unknown>) => void;
  
  /** Callback when form is submitted */
  onSubmit?: () => void;
  
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  
  /** Whether the form is disabled */
  disabled?: boolean;
  
  /** Validation errors from parent */
  errors?: Record<string, string>;
  
  /** Show advanced options by default */
  showAdvanced?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Placeholder detection result
 */
interface PlaceholderInfo {
  name: string;
  hasValue: boolean;
  value?: string;
}

/**
 * cURL Default Credential Form Fields Component
 * 
 * Provides a comprehensive UI for configuring cURL command templates
 * with dynamic placeholder detection and value injection.
 */
export const CurlDefaultCredentialFormFields: React.FC<CurlDefaultCredentialFormFieldsProps> = ({
  values,
  onChange,
  onSubmit,
  isLoading = false,
  disabled = false,
  errors = {},
  showAdvanced = false,
  className = '',
}) => {
  // State for collapsible sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    command: true,
    placeholders: true,
    overrides: showAdvanced,
    advanced: showAdvanced,
    retry: showAdvanced,
    proxy: showAdvanced,
  });

  // State for command preview
  const [showPreview, setShowPreview] = useState(false);

  // Get executor instance for utilities
  const executor = useMemo(() => new CurlDefaultHandshakeExecutor(), []);

  // Extract placeholders from command
  const placeholders = useMemo<PlaceholderInfo[]>(() => {
    const command = values.curlCommand as string || '';
    const names = executor.extractPlaceholders(command);
    const placeholderValues = (values.placeholderValues as Record<string, string>) || {};
    
    return names.map((name) => ({
      name,
      hasValue: placeholderValues[name] !== undefined && placeholderValues[name] !== '',
      value: placeholderValues[name],
    }));
  }, [values.curlCommand, values.placeholderValues, executor]);

  // Generate command preview
  const commandPreview = useMemo(() => {
    const command = values.curlCommand as string || '';
    const placeholderValues = (values.placeholderValues as Record<string, string>) || {};
    return executor.generateCommandPreview(command, placeholderValues);
  }, [values.curlCommand, values.placeholderValues, executor]);

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    onChange({
      ...values,
      [fieldId]: value,
    });
  }, [values, onChange]);

  // Handle placeholder value change
  const handlePlaceholderChange = useCallback((name: string, value: string) => {
    const current = (values.placeholderValues as Record<string, string>) || {};
    onChange({
      ...values,
      placeholderValues: {
        ...current,
        [name]: value,
      },
    });
  }, [values, onChange]);

  // Handle header change
  const handleHeaderChange = useCallback((headers: Record<string, string>) => {
    onChange({
      ...values,
      defaultHeaders: headers,
    });
  }, [values, onChange]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  }, [onSubmit]);

  // Render a collapsible group header
  const renderGroupHeader = (
    groupId: string,
    label: string,
    description?: string,
    badge?: React.ReactNode
  ) => (
    <button
      type="button"
      className="curl-form__group-header"
      onClick={() => toggleGroup(groupId)}
      aria-expanded={expandedGroups[groupId]}
    >
      <span className="curl-form__group-icon">
        {expandedGroups[groupId] ? '▼' : '▶'}
      </span>
      <span className="curl-form__group-label">{label}</span>
      {badge}
      {description && (
        <span className="curl-form__group-description">{description}</span>
      )}
    </button>
  );

  // Render the cURL command textarea
  const renderCommandField = () => (
    <div className="curl-form__field curl-form__field--command">
      <label htmlFor="curlCommand" className="curl-form__label">
        cURL Command Template
        <span className="curl-form__required">*</span>
      </label>
      <div className="curl-form__command-wrapper">
        <textarea
          id="curlCommand"
          className={`curl-form__textarea ${errors.curlCommand ? 'curl-form__textarea--error' : ''}`}
          value={(values.curlCommand as string) || ''}
          onChange={(e) => handleFieldChange('curlCommand', e.target.value)}
          placeholder={`curl -X POST 'https://api.example.com/v1/endpoint' \\
  -H 'Authorization: Bearer {{access_token}}' \\
  -H 'Content-Type: application/json' \\
  -d '{"key": "{{value}}"}'`}
          rows={8}
          disabled={disabled || isLoading}
          spellCheck={false}
        />
        <div className="curl-form__command-actions">
          <button
            type="button"
            className="curl-form__action-button"
            onClick={() => setShowPreview(!showPreview)}
            disabled={!values.curlCommand}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            type="button"
            className="curl-form__action-button"
            onClick={() => navigator.clipboard.writeText(commandPreview.preview)}
            disabled={!values.curlCommand}
          >
            Copy Resolved
          </button>
        </div>
      </div>
      {errors.curlCommand && (
        <span className="curl-form__error">{errors.curlCommand}</span>
      )}
      <span className="curl-form__hint">
        Use <code>{'{{placeholder}}'}</code> syntax for dynamic values.
        Placeholders will be detected automatically.
      </span>
    </div>
  );

  // Render command preview
  const renderCommandPreview = () => {
    if (!showPreview || !values.curlCommand) return null;

    return (
      <div className="curl-form__preview">
        <h4 className="curl-form__preview-title">Resolved Command Preview</h4>
        {commandPreview.missingPlaceholders.length > 0 && (
          <div className="curl-form__preview-warning">
            Missing placeholders: {commandPreview.missingPlaceholders.join(', ')}
          </div>
        )}
        <pre className="curl-form__preview-code">
          {commandPreview.preview}
        </pre>
      </div>
    );
  };

  // Render placeholder fields
  const renderPlaceholderFields = () => {
    if (placeholders.length === 0) {
      return (
        <div className="curl-form__placeholder-empty">
          No placeholders detected. Add <code>{'{{placeholder}}'}</code> to your command to create dynamic fields.
        </div>
      );
    }

    return (
      <div className="curl-form__placeholders">
        {placeholders.map((placeholder) => (
          <div key={placeholder.name} className="curl-form__field">
            <label 
              htmlFor={`placeholder-${placeholder.name}`}
              className="curl-form__label"
            >
              {placeholder.name}
              {!placeholder.hasValue && (
                <span className="curl-form__badge curl-form__badge--warning">
                  Missing
                </span>
              )}
            </label>
            <input
              id={`placeholder-${placeholder.name}`}
              type={isSensitivePlaceholder(placeholder.name) ? 'password' : 'text'}
              className="curl-form__input"
              value={placeholder.value || ''}
              onChange={(e) => handlePlaceholderChange(placeholder.name, e.target.value)}
              placeholder={`Enter value for {{${placeholder.name}}}`}
              disabled={disabled || isLoading}
            />
          </div>
        ))}
      </div>
    );
  };

  // Render headers editor
  const renderHeadersEditor = () => {
    const headers = (values.defaultHeaders as Record<string, string>) || {};
    const headerEntries = Object.entries(headers);

    return (
      <div className="curl-form__headers">
        {headerEntries.map(([key, value], index) => (
          <div key={index} className="curl-form__header-row">
            <input
              type="text"
              className="curl-form__input curl-form__input--header-key"
              value={key}
              onChange={(e) => {
                const newHeaders = { ...headers };
                delete newHeaders[key];
                newHeaders[e.target.value] = value;
                handleHeaderChange(newHeaders);
              }}
              placeholder="Header name"
              disabled={disabled || isLoading}
            />
            <input
              type="text"
              className="curl-form__input curl-form__input--header-value"
              value={value}
              onChange={(e) => {
                handleHeaderChange({ ...headers, [key]: e.target.value });
              }}
              placeholder="Header value"
              disabled={disabled || isLoading}
            />
            <button
              type="button"
              className="curl-form__remove-button"
              onClick={() => {
                const newHeaders = { ...headers };
                delete newHeaders[key];
                handleHeaderChange(newHeaders);
              }}
              disabled={disabled || isLoading}
              aria-label="Remove header"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="curl-form__add-button"
          onClick={() => handleHeaderChange({ ...headers, '': '' })}
          disabled={disabled || isLoading}
        >
          + Add Header
        </button>
      </div>
    );
  };

  // Render advanced options
  const renderAdvancedOptions = () => (
    <div className="curl-form__advanced">
      <div className="curl-form__field">
        <label htmlFor="baseUrl" className="curl-form__label">
          Base URL Override
        </label>
        <input
          id="baseUrl"
          type="url"
          className="curl-form__input"
          value={(values.baseUrl as string) || ''}
          onChange={(e) => handleFieldChange('baseUrl', e.target.value)}
          placeholder="https://api.example.com"
          disabled={disabled || isLoading}
        />
        <span className="curl-form__hint">
          Override the URL in the cURL command (useful for environment switching)
        </span>
      </div>

      <div className="curl-form__field">
        <label htmlFor="timeout" className="curl-form__label">
          Timeout (ms)
        </label>
        <input
          id="timeout"
          type="number"
          className="curl-form__input"
          value={(values.timeout as number) || 30000}
          onChange={(e) => handleFieldChange('timeout', parseInt(e.target.value, 10))}
          min={1000}
          max={300000}
          disabled={disabled || isLoading}
        />
      </div>

      <div className="curl-form__field curl-form__field--checkbox">
        <label className="curl-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.followRedirects as boolean) !== false}
            onChange={(e) => handleFieldChange('followRedirects', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Follow Redirects
        </label>
      </div>

      <div className="curl-form__field curl-form__field--checkbox">
        <label className="curl-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.validateSsl as boolean) !== false}
            onChange={(e) => handleFieldChange('validateSsl', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Validate SSL Certificates
        </label>
      </div>

      <div className="curl-form__field">
        <label htmlFor="userAgent" className="curl-form__label">
          User Agent
        </label>
        <input
          id="userAgent"
          type="text"
          className="curl-form__input"
          value={(values.userAgent as string) || ''}
          onChange={(e) => handleFieldChange('userAgent', e.target.value)}
          placeholder="Protocol-OS/1.0"
          disabled={disabled || isLoading}
        />
      </div>
    </div>
  );

  // Render retry options
  const renderRetryOptions = () => (
    <div className="curl-form__retry">
      <div className="curl-form__field curl-form__field--checkbox">
        <label className="curl-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.retryOnFailure as boolean) !== false}
            onChange={(e) => handleFieldChange('retryOnFailure', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Retry on Failure
        </label>
      </div>

      {values.retryOnFailure !== false && (
        <>
          <div className="curl-form__field">
            <label htmlFor="maxRetries" className="curl-form__label">
              Max Retries
            </label>
            <input
              id="maxRetries"
              type="number"
              className="curl-form__input"
              value={(values.maxRetries as number) || 3}
              onChange={(e) => handleFieldChange('maxRetries', parseInt(e.target.value, 10))}
              min={0}
              max={10}
              disabled={disabled || isLoading}
            />
          </div>

          <div className="curl-form__field">
            <label htmlFor="retryDelay" className="curl-form__label">
              Retry Delay (ms)
            </label>
            <input
              id="retryDelay"
              type="number"
              className="curl-form__input"
              value={(values.retryDelay as number) || 1000}
              onChange={(e) => handleFieldChange('retryDelay', parseInt(e.target.value, 10))}
              min={100}
              max={30000}
              disabled={disabled || isLoading}
            />
          </div>
        </>
      )}
    </div>
  );

  // Render proxy options
  const renderProxyOptions = () => (
    <div className="curl-form__proxy">
      <div className="curl-form__field">
        <label htmlFor="proxyUrl" className="curl-form__label">
          Proxy URL
        </label>
        <input
          id="proxyUrl"
          type="url"
          className="curl-form__input"
          value={(values.proxyUrl as string) || ''}
          onChange={(e) => handleFieldChange('proxyUrl', e.target.value)}
          placeholder="http://proxy.example.com:8080"
          disabled={disabled || isLoading}
        />
      </div>
    </div>
  );

  return (
    <form 
      className={`curl-form ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Command Section */}
      <div className="curl-form__group">
        {renderGroupHeader('command', 'cURL Command')}
        {expandedGroups.command && (
          <div className="curl-form__group-content">
            {renderCommandField()}
            {renderCommandPreview()}
          </div>
        )}
      </div>

      {/* Placeholders Section */}
      <div className="curl-form__group">
        {renderGroupHeader(
          'placeholders',
          'Placeholder Values',
          undefined,
          placeholders.length > 0 && (
            <span className="curl-form__badge">
              {placeholders.filter((p) => p.hasValue).length}/{placeholders.length}
            </span>
          )
        )}
        {expandedGroups.placeholders && (
          <div className="curl-form__group-content">
            {renderPlaceholderFields()}
          </div>
        )}
      </div>

      {/* Default Headers Section */}
      <div className="curl-form__group">
        {renderGroupHeader('overrides', 'Default Headers', 'Headers merged with every request')}
        {expandedGroups.overrides && (
          <div className="curl-form__group-content">
            {renderHeadersEditor()}
          </div>
        )}
      </div>

      {/* Advanced Options Section */}
      <div className="curl-form__group">
        {renderGroupHeader('advanced', 'Advanced Options')}
        {expandedGroups.advanced && (
          <div className="curl-form__group-content">
            {renderAdvancedOptions()}
          </div>
        )}
      </div>

      {/* Retry Section */}
      <div className="curl-form__group">
        {renderGroupHeader('retry', 'Retry Configuration')}
        {expandedGroups.retry && (
          <div className="curl-form__group-content">
            {renderRetryOptions()}
          </div>
        )}
      </div>

      {/* Proxy Section */}
      <div className="curl-form__group">
        {renderGroupHeader('proxy', 'Proxy Settings')}
        {expandedGroups.proxy && (
          <div className="curl-form__group-content">
            {renderProxyOptions()}
          </div>
        )}
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="curl-form__actions">
          <button
            type="submit"
            className="curl-form__submit"
            disabled={disabled || isLoading || !values.curlCommand}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </form>
  );
};

/**
 * Check if a placeholder name suggests sensitive data
 */
function isSensitivePlaceholder(name: string): boolean {
  const sensitivePatterns = [
    /token/i,
    /key/i,
    /secret/i,
    /password/i,
    /auth/i,
    /credential/i,
    /api_key/i,
    /apikey/i,
    /access/i,
    /private/i,
  ];
  
  return sensitivePatterns.some((pattern) => pattern.test(name));
}

/**
 * Hook for managing cURL credential form state
 */
export function useCurlCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const executor = useMemo(() => new CurlDefaultHandshakeExecutor(), []);

  const handleChange = useCallback((newValues: Record<string, unknown>) => {
    setValues(newValues);
    setIsDirty(true);
    
    // Clear errors for changed fields
    const changedFields = Object.keys(newValues).filter(
      (key) => newValues[key] !== values[key]
    );
    if (changedFields.length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        changedFields.forEach((field) => delete next[field]);
        return next;
      });
    }
  }, [values]);

  const validate = useCallback(() => {
    const result = executor.validateCredentials(values);
    setErrors(result.fieldErrors);
    return result.valid;
  }, [values, executor]);

  const reset = useCallback((newValues: Record<string, unknown> = {}) => {
    setValues(newValues);
    setErrors({});
    setIsDirty(false);
  }, []);

  return {
    values,
    errors,
    isDirty,
    handleChange,
    validate,
    reset,
    setErrors,
  };
}

export default CurlDefaultCredentialFormFields;
