// ============================================
// PROTOCOL OS - REST API KEY CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.6.b
// Purpose: React component for REST API Key configuration UI
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { 
  RestApiKeyHandshakeExecutor, 
  type ApiKeyPlacement, 
  type ApiKeyHeaderFormat 
} from './1.3.6.a_fileRestApiKeyHandshakeExecutor';

/**
 * API provider preset configuration
 */
export interface ApiKeyProviderPreset {
  id: string;
  name: string;
  icon: string;
  baseUrl: string;
  healthCheckPath?: string;
  placement: ApiKeyPlacement;
  headerFormat?: ApiKeyHeaderFormat;
  customHeaderName?: string;
  keyPrefix?: string;
  keyPattern?: RegExp;
  documentationUrl: string;
  notes?: string;
  usesKeyPair?: boolean;
  secondaryKeyName?: string;
}

/**
 * Provider presets for common API services
 */
export const API_KEY_PROVIDER_PRESETS: ApiKeyProviderPreset[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    icon: 'stripe',
    baseUrl: 'https://api.stripe.com',
    healthCheckPath: '/v1/balance',
    placement: 'header',
    headerFormat: 'authorization-bearer',
    keyPrefix: 'sk_',
    keyPattern: /^sk_(live|test)_[a-zA-Z0-9]+$/,
    documentationUrl: 'https://stripe.com/docs/api/authentication',
    notes: 'Use your secret key (sk_live_... or sk_test_...)',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: 'openai',
    baseUrl: 'https://api.openai.com',
    healthCheckPath: '/v1/models',
    placement: 'header',
    headerFormat: 'authorization-bearer',
    keyPrefix: 'sk-',
    keyPattern: /^sk-[a-zA-Z0-9-_]+$/,
    documentationUrl: 'https://platform.openai.com/docs/api-reference/authentication',
    notes: 'Keys start with sk-',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    healthCheckPath: '/v1/messages',
    placement: 'header',
    headerFormat: 'custom',
    customHeaderName: 'x-api-key',
    keyPrefix: 'sk-ant-',
    keyPattern: /^sk-ant-[a-zA-Z0-9-_]+$/,
    documentationUrl: 'https://docs.anthropic.com/en/api/getting-started',
    notes: 'Keys start with sk-ant-. Also requires anthropic-version header.',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    icon: 'sendgrid',
    baseUrl: 'https://api.sendgrid.com',
    healthCheckPath: '/v3/user/profile',
    placement: 'header',
    headerFormat: 'authorization-bearer',
    keyPrefix: 'SG.',
    keyPattern: /^SG\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
    documentationUrl: 'https://docs.sendgrid.com/for-developers/sending-email/authentication',
    notes: 'Keys start with SG.',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    icon: 'twilio',
    baseUrl: 'https://api.twilio.com',
    healthCheckPath: '/2010-04-01/Accounts',
    placement: 'header',
    headerFormat: 'authorization-basic',
    documentationUrl: 'https://www.twilio.com/docs/usage/api',
    notes: 'Uses Account SID as username, Auth Token as password (Basic auth).',
    usesKeyPair: true,
    secondaryKeyName: 'Account SID',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    icon: 'mailchimp',
    baseUrl: 'https://{dc}.api.mailchimp.com',
    healthCheckPath: '/3.0/ping',
    placement: 'header',
    headerFormat: 'authorization-basic',
    documentationUrl: 'https://mailchimp.com/developer/marketing/guides/quick-start/',
    notes: 'API key format: key-dc (e.g., abc123-us21). The dc part is your datacenter.',
  },
  {
    id: 'airtable',
    name: 'Airtable',
    icon: 'airtable',
    baseUrl: 'https://api.airtable.com',
    healthCheckPath: '/v0/meta/whoami',
    placement: 'header',
    headerFormat: 'authorization-bearer',
    documentationUrl: 'https://airtable.com/developers/web/api/authentication',
    notes: 'Personal access token or OAuth token.',
  },
  {
    id: 'notion',
    name: 'Notion',
    icon: 'notion',
    baseUrl: 'https://api.notion.com',
    healthCheckPath: '/v1/users/me',
    placement: 'header',
    headerFormat: 'authorization-bearer',
    keyPrefix: 'secret_',
    documentationUrl: 'https://developers.notion.com/docs/authorization',
    notes: 'Integration token starts with secret_. Requires Notion-Version header.',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    baseUrl: 'https://api.github.com',
    healthCheckPath: '/user',
    placement: 'header',
    headerFormat: 'authorization-bearer',
    keyPrefix: 'ghp_',
    keyPattern: /^(ghp_|github_pat_)[a-zA-Z0-9_]+$/,
    documentationUrl: 'https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api',
    notes: 'Personal access token (ghp_...) or fine-grained token (github_pat_...).',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    icon: 'cloudflare',
    baseUrl: 'https://api.cloudflare.com',
    healthCheckPath: '/client/v4/user/tokens/verify',
    placement: 'header',
    headerFormat: 'authorization-bearer',
    documentationUrl: 'https://developers.cloudflare.com/fundamentals/api/get-started/create-token/',
    notes: 'API Token (recommended) or Global API Key + Email.',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'slack',
    baseUrl: 'https://slack.com/api',
    healthCheckPath: '/auth.test',
    placement: 'header',
    headerFormat: 'authorization-bearer',
    keyPrefix: 'xoxb-',
    keyPattern: /^xox[bap]-[0-9]+-[0-9A-Za-z-]+$/,
    documentationUrl: 'https://api.slack.com/authentication/token-types',
    notes: 'Bot token (xoxb-...), App token (xapp-...), or User token (xoxp-...).',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'discord',
    baseUrl: 'https://discord.com/api',
    healthCheckPath: '/v10/users/@me',
    placement: 'header',
    headerFormat: 'custom',
    customHeaderName: 'Authorization',
    documentationUrl: 'https://discord.com/developers/docs/reference#authentication',
    notes: 'Bot token format: "Bot {token}". User tokens require OAuth.',
  },
  {
    id: 'custom',
    name: 'Custom API',
    icon: 'settings',
    baseUrl: '',
    placement: 'header',
    headerFormat: 'x-api-key',
    documentationUrl: '',
  },
];

/**
 * Props for the credential form
 */
export interface RestApiKeyCredentialFormFieldsProps {
  /** Current credential values */
  values: Record<string, unknown>;
  
  /** Callback when values change */
  onChange: (values: Record<string, unknown>) => void;
  
  /** Callback to test the API key */
  onTestKey?: () => void;
  
  /** Callback when form is submitted */
  onSubmit?: () => void;
  
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  
  /** Whether the form is disabled */
  disabled?: boolean;
  
  /** Validation errors from parent */
  errors?: Record<string, string>;
  
  /** Current key status */
  keyStatus?: 'none' | 'testing' | 'valid' | 'invalid' | 'error';
  
  /** Custom class name */
  className?: string;
}

/**
 * REST API Key Credential Form Fields Component
 */
export const RestApiKeyCredentialFormFields: React.FC<RestApiKeyCredentialFormFieldsProps> = ({
  values,
  onChange,
  onTestKey,
  onSubmit,
  isLoading = false,
  disabled = false,
  errors = {},
  keyStatus = 'none',
  className = '',
}) => {
  // State for selected provider preset
  const [selectedProvider, setSelectedProvider] = useState<string>('custom');
  
  // State for collapsible sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    provider: true,
    credentials: true,
    configuration: true,
    endpoints: false,
  });

  // State for showing/hiding keys
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecondaryKey, setShowSecondaryKey] = useState(false);

  // Get executor for utilities
  const executor = useMemo(() => new RestApiKeyHandshakeExecutor(), []);

  // Detect provider from API key format
  useEffect(() => {
    const apiKey = values.apiKey as string;
    if (!apiKey) return;

    const detected = RestApiKeyHandshakeExecutor.detectKeyFormat(apiKey);
    if (detected.provider) {
      const preset = API_KEY_PROVIDER_PRESETS.find(
        p => p.name.toLowerCase() === detected.provider?.toLowerCase()
      );
      if (preset) {
        setSelectedProvider(preset.id);
      }
    }
  }, [values.apiKey]);

  // Handle provider selection
  const handleProviderSelect = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    
    const preset = API_KEY_PROVIDER_PRESETS.find((p) => p.id === providerId);
    if (preset && preset.id !== 'custom') {
      const newValues: Record<string, unknown> = {
        ...values,
        placement: preset.placement,
        headerFormat: preset.headerFormat || 'x-api-key',
        baseUrl: preset.baseUrl,
        healthCheckPath: preset.healthCheckPath || '',
      };
      
      if (preset.customHeaderName) {
        newValues.customHeaderName = preset.customHeaderName;
      }
      
      onChange(newValues);
    }
  }, [values, onChange]);

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    onChange({
      ...values,
      [fieldId]: value,
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

  // Get current provider preset
  const currentPreset = useMemo(() => 
    API_KEY_PROVIDER_PRESETS.find((p) => p.id === selectedProvider),
    [selectedProvider]
  );

  // Get detected key info
  const keyInfo = useMemo(() => {
    const apiKey = values.apiKey as string;
    if (!apiKey) return null;
    return RestApiKeyHandshakeExecutor.detectKeyFormat(apiKey);
  }, [values.apiKey]);

  // Validate key format
  const keyValidation = useMemo(() => {
    const apiKey = values.apiKey as string;
    return RestApiKeyHandshakeExecutor.validateKeyFormat(apiKey);
  }, [values.apiKey]);

  // Masked API key for display
  const maskedApiKey = useMemo(() => {
    const apiKey = values.apiKey as string;
    return apiKey ? RestApiKeyHandshakeExecutor.maskApiKey(apiKey) : '';
  }, [values.apiKey]);

  // Render group header
  const renderGroupHeader = (
    groupId: string,
    label: string,
    description?: string,
    badge?: React.ReactNode
  ) => (
    <button
      type="button"
      className="apikey-form__group-header"
      onClick={() => toggleGroup(groupId)}
      aria-expanded={expandedGroups[groupId]}
    >
      <span className="apikey-form__group-icon">
        {expandedGroups[groupId] ? '▼' : '▶'}
      </span>
      <span className="apikey-form__group-label">{label}</span>
      {badge}
      {description && (
        <span className="apikey-form__group-description">{description}</span>
      )}
    </button>
  );

  // Render provider selector
  const renderProviderSelector = () => (
    <div className="apikey-form__providers">
      <label className="apikey-form__label">API Provider</label>
      <div className="apikey-form__provider-grid">
        {API_KEY_PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`apikey-form__provider-button ${
              selectedProvider === preset.id ? 'apikey-form__provider-button--selected' : ''
            }`}
            onClick={() => handleProviderSelect(preset.id)}
            disabled={disabled || isLoading}
            title={preset.name}
          >
            <span className="apikey-form__provider-icon">{preset.icon}</span>
            <span className="apikey-form__provider-name">{preset.name}</span>
          </button>
        ))}
      </div>
      {currentPreset?.documentationUrl && (
        <a
          href={currentPreset.documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="apikey-form__docs-link"
        >
          View {currentPreset.name} API Docs →
        </a>
      )}
      {currentPreset?.notes && (
        <div className="apikey-form__provider-notes">
          ℹ️ {currentPreset.notes}
        </div>
      )}
    </div>
  );

  // Render credentials fields
  const renderCredentialsFields = () => (
    <div className="apikey-form__credentials">
      <div className="apikey-form__security-warning">
        <span className="apikey-form__warning-icon">🔑</span>
        <div className="apikey-form__warning-content">
          <strong>API Key Security</strong>
          <p>
            API keys grant direct access to your account. Never expose them in
            client-side code, version control, or logs.
          </p>
        </div>
      </div>

      <div className="apikey-form__field">
        <label htmlFor="apiKey" className="apikey-form__label">
          API Key
          <span className="apikey-form__required">*</span>
        </label>
        <div className="apikey-form__secret-input">
          <input
            id="apiKey"
            type={showApiKey ? 'text' : 'password'}
            className={`apikey-form__input ${errors.apiKey || !keyValidation.valid ? 'apikey-form__input--error' : ''}`}
            value={(values.apiKey as string) || ''}
            onChange={(e) => handleFieldChange('apiKey', e.target.value)}
            placeholder={currentPreset?.keyPrefix ? `${currentPreset.keyPrefix}...` : 'Enter your API key'}
            disabled={disabled || isLoading}
          />
          <button
            type="button"
            className="apikey-form__secret-toggle"
            onClick={() => setShowApiKey(!showApiKey)}
            aria-label={showApiKey ? 'Hide key' : 'Show key'}
          >
            {showApiKey ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.apiKey && (
          <span className="apikey-form__error">{errors.apiKey}</span>
        )}
        {!keyValidation.valid && values.apiKey && (
          <span className="apikey-form__error">{keyValidation.error}</span>
        )}
        
        {/* Key detection info */}
        {keyInfo?.provider && (
          <div className="apikey-form__key-info">
            <span className="apikey-form__key-detected">
              ✓ Detected: {keyInfo.provider} {keyInfo.type}
              {keyInfo.environment && keyInfo.environment !== 'unknown' && (
                <span className={`apikey-form__env-badge apikey-form__env-badge--${keyInfo.environment}`}>
                  {keyInfo.environment}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Masked key display */}
        {values.apiKey && !showApiKey && (
          <span className="apikey-form__hint">
            Key: {maskedApiKey}
          </span>
        )}
      </div>

      {/* Secondary key (for APIs that use key pairs) */}
      {currentPreset?.usesKeyPair && (
        <div className="apikey-form__field">
          <label htmlFor="secondaryApiKey" className="apikey-form__label">
            {currentPreset.secondaryKeyName || 'Secondary Key'}
            <span className="apikey-form__required">*</span>
          </label>
          <div className="apikey-form__secret-input">
            <input
              id="secondaryApiKey"
              type={showSecondaryKey ? 'text' : 'password'}
              className={`apikey-form__input ${errors.secondaryApiKey ? 'apikey-form__input--error' : ''}`}
              value={(values.secondaryApiKey as string) || ''}
              onChange={(e) => handleFieldChange('secondaryApiKey', e.target.value)}
              placeholder={`Enter your ${currentPreset.secondaryKeyName || 'secondary key'}`}
              disabled={disabled || isLoading}
            />
            <button
              type="button"
              className="apikey-form__secret-toggle"
              onClick={() => setShowSecondaryKey(!showSecondaryKey)}
              aria-label={showSecondaryKey ? 'Hide key' : 'Show key'}
            >
              {showSecondaryKey ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.secondaryApiKey && (
            <span className="apikey-form__error">{errors.secondaryApiKey}</span>
          )}
        </div>
      )}
    </div>
  );

  // Render configuration fields
  const renderConfigurationFields = () => (
    <div className="apikey-form__configuration">
      <div className="apikey-form__field">
        <label htmlFor="placement" className="apikey-form__label">
          Key Placement
        </label>
        <select
          id="placement"
          className="apikey-form__select"
          value={(values.placement as string) || 'header'}
          onChange={(e) => handleFieldChange('placement', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="header">HTTP Header (Most Common)</option>
          <option value="query">Query Parameter</option>
          <option value="body">Request Body</option>
        </select>
      </div>

      {/* Header format options */}
      {values.placement === 'header' && (
        <>
          <div className="apikey-form__field">
            <label htmlFor="headerFormat" className="apikey-form__label">
              Header Format
            </label>
            <select
              id="headerFormat"
              className="apikey-form__select"
              value={(values.headerFormat as string) || 'x-api-key'}
              onChange={(e) => handleFieldChange('headerFormat', e.target.value)}
              disabled={disabled || isLoading}
            >
              <option value="x-api-key">X-API-Key: {'{key}'}</option>
              <option value="authorization-bearer">Authorization: Bearer {'{key}'}</option>
              <option value="authorization-apikey">Authorization: ApiKey {'{key}'}</option>
              <option value="authorization-basic">Authorization: Basic (key as password)</option>
              <option value="authorization-token">Authorization: Token {'{key}'}</option>
              <option value="custom">Custom Header</option>
            </select>
          </div>

          {/* Custom header options */}
          {values.headerFormat === 'custom' && (
            <>
              <div className="apikey-form__field">
                <label htmlFor="customHeaderName" className="apikey-form__label">
                  Custom Header Name
                </label>
                <input
                  id="customHeaderName"
                  type="text"
                  className="apikey-form__input"
                  value={(values.customHeaderName as string) || ''}
                  onChange={(e) => handleFieldChange('customHeaderName', e.target.value)}
                  placeholder="X-Custom-API-Key"
                  disabled={disabled || isLoading}
                />
              </div>
              <div className="apikey-form__field">
                <label htmlFor="customHeaderPrefix" className="apikey-form__label">
                  Value Prefix
                  <span className="apikey-form__optional">(Optional)</span>
                </label>
                <input
                  id="customHeaderPrefix"
                  type="text"
                  className="apikey-form__input"
                  value={(values.customHeaderPrefix as string) || ''}
                  onChange={(e) => handleFieldChange('customHeaderPrefix', e.target.value)}
                  placeholder="Bearer "
                  disabled={disabled || isLoading}
                />
                <span className="apikey-form__hint">
                  Prefix before the key (include trailing space if needed)
                </span>
              </div>
            </>
          )}
        </>
      )}

      {/* Query parameter options */}
      {values.placement === 'query' && (
        <div className="apikey-form__field">
          <label htmlFor="queryParamName" className="apikey-form__label">
            Query Parameter Name
          </label>
          <input
            id="queryParamName"
            type="text"
            className="apikey-form__input"
            value={(values.queryParamName as string) || 'api_key'}
            onChange={(e) => handleFieldChange('queryParamName', e.target.value)}
            placeholder="api_key"
            disabled={disabled || isLoading}
          />
          <span className="apikey-form__hint">
            ⚠️ Query params may appear in server logs. Headers are preferred.
          </span>
        </div>
      )}

      {/* Body field options */}
      {values.placement === 'body' && (
        <div className="apikey-form__field">
          <label htmlFor="bodyFieldName" className="apikey-form__label">
            Body Field Name
          </label>
          <input
            id="bodyFieldName"
            type="text"
            className="apikey-form__input"
            value={(values.bodyFieldName as string) || 'api_key'}
            onChange={(e) => handleFieldChange('bodyFieldName', e.target.value)}
            placeholder="api_key"
            disabled={disabled || isLoading}
          />
          <span className="apikey-form__hint">
            JSON field name for the API key
          </span>
        </div>
      )}

      {/* Preview of how key will be sent */}
      <div className="apikey-form__preview">
        <label className="apikey-form__label">Request Preview</label>
        <pre className="apikey-form__preview-code">
          {renderRequestPreview()}
        </pre>
      </div>
    </div>
  );

  // Render request preview
  const renderRequestPreview = () => {
    const placement = values.placement as string || 'header';
    const key = values.apiKey as string || 'your-api-key';
    const masked = RestApiKeyHandshakeExecutor.maskApiKey(key, 3);

    if (placement === 'header') {
      const format = values.headerFormat as string || 'x-api-key';
      switch (format) {
        case 'x-api-key':
          return `X-API-Key: ${masked}`;
        case 'authorization-bearer':
          return `Authorization: Bearer ${masked}`;
        case 'authorization-apikey':
          return `Authorization: ApiKey ${masked}`;
        case 'authorization-basic':
          return `Authorization: Basic ${btoa(':' + key).substring(0, 10)}...`;
        case 'authorization-token':
          return `Authorization: Token ${masked}`;
        case 'custom':
          const name = values.customHeaderName || 'X-Custom-Key';
          const prefix = values.customHeaderPrefix || '';
          return `${name}: ${prefix}${masked}`;
        default:
          return `X-API-Key: ${masked}`;
      }
    } else if (placement === 'query') {
      const paramName = values.queryParamName || 'api_key';
      return `?${paramName}=${masked}`;
    } else if (placement === 'body') {
      const fieldName = values.bodyFieldName || 'api_key';
      return `{ "${fieldName}": "${masked}" }`;
    }

    return '';
  };

  // Render endpoints fields
  const renderEndpointsFields = () => (
    <div className="apikey-form__endpoints">
      <div className="apikey-form__field">
        <label htmlFor="baseUrl" className="apikey-form__label">
          Base URL
          <span className="apikey-form__optional">(For Testing)</span>
        </label>
        <input
          id="baseUrl"
          type="url"
          className="apikey-form__input"
          value={(values.baseUrl as string) || ''}
          onChange={(e) => handleFieldChange('baseUrl', e.target.value)}
          placeholder="https://api.example.com"
          disabled={disabled || isLoading}
        />
      </div>

      <div className="apikey-form__field">
        <label htmlFor="healthCheckPath" className="apikey-form__label">
          Health Check Path
          <span className="apikey-form__optional">(Optional)</span>
        </label>
        <input
          id="healthCheckPath"
          type="text"
          className="apikey-form__input"
          value={(values.healthCheckPath as string) || ''}
          onChange={(e) => handleFieldChange('healthCheckPath', e.target.value)}
          placeholder="/v1/me"
          disabled={disabled || isLoading}
        />
        <span className="apikey-form__hint">
          Endpoint to test if the API key is valid
        </span>
      </div>
    </div>
  );

  // Render test button
  const renderTestButton = () => {
    const canTest = values.apiKey && values.baseUrl && values.healthCheckPath;
    
    return (
      <div className="apikey-form__test-section">
        {keyStatus === 'valid' ? (
          <div className="apikey-form__status apikey-form__status--success">
            <span className="apikey-form__status-icon">✓</span>
            <span>API key is valid</span>
          </div>
        ) : keyStatus === 'invalid' ? (
          <div className="apikey-form__status apikey-form__status--error">
            <span className="apikey-form__status-icon">✗</span>
            <span>API key is invalid or expired</span>
          </div>
        ) : keyStatus === 'testing' ? (
          <div className="apikey-form__status apikey-form__status--pending">
            <span className="apikey-form__status-icon">⏳</span>
            <span>Testing API key...</span>
          </div>
        ) : keyStatus === 'error' ? (
          <div className="apikey-form__status apikey-form__status--error">
            <span className="apikey-form__status-icon">⚠</span>
            <span>Test failed - check configuration</span>
          </div>
        ) : null}

        {onTestKey && (
          <button
            type="button"
            className="apikey-form__test-button"
            onClick={onTestKey}
            disabled={disabled || isLoading || !canTest || keyStatus === 'testing'}
          >
            {keyStatus === 'testing' ? 'Testing...' : '🧪 Test API Key'}
          </button>
        )}

        {!canTest && values.apiKey && (
          <span className="apikey-form__hint">
            Set Base URL and Health Check Path to test the key
          </span>
        )}
      </div>
    );
  };

  return (
    <form
      className={`apikey-form ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Provider Selection */}
      <div className="apikey-form__group">
        {renderGroupHeader('provider', 'Select Provider')}
        {expandedGroups.provider && (
          <div className="apikey-form__group-content">
            {renderProviderSelector()}
          </div>
        )}
      </div>

      {/* Credentials */}
      <div className="apikey-form__group">
        {renderGroupHeader('credentials', 'API Key', undefined,
          values.apiKey ? (
            <span className="apikey-form__badge apikey-form__badge--security">🔑 Configured</span>
          ) : null
        )}
        {expandedGroups.credentials && (
          <div className="apikey-form__group-content">
            {renderCredentialsFields()}
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="apikey-form__group">
        {renderGroupHeader('configuration', 'Key Configuration')}
        {expandedGroups.configuration && (
          <div className="apikey-form__group-content">
            {renderConfigurationFields()}
          </div>
        )}
      </div>

      {/* Endpoints */}
      <div className="apikey-form__group">
        {renderGroupHeader('endpoints', 'Endpoints (For Testing)')}
        {expandedGroups.endpoints && (
          <div className="apikey-form__group-content">
            {renderEndpointsFields()}
            {renderTestButton()}
          </div>
        )}
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="apikey-form__actions">
          <button
            type="submit"
            className="apikey-form__submit"
            disabled={disabled || isLoading || !keyValidation.valid}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </form>
  );
};

/**
 * Hook for managing REST API Key credential form state
 */
export function useRestApiKeyCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'none' | 'testing' | 'valid' | 'invalid' | 'error'>('none');

  const executor = useMemo(() => new RestApiKeyHandshakeExecutor(), []);

  const handleChange = useCallback((newValues: Record<string, unknown>) => {
    setValues(newValues);
    setIsDirty(true);
    setKeyStatus('none'); // Reset status when values change
    
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
    setKeyStatus('none');
  }, []);

  /**
   * Test the API key
   */
  const testKey = useCallback(async () => {
    if (!values.apiKey || !values.baseUrl || !values.healthCheckPath) {
      return { success: false, error: 'Missing required fields' };
    }

    setKeyStatus('testing');
    
    try {
      const result = await executor.healthCheck(values as any);
      
      if (result.healthy) {
        setKeyStatus('valid');
        return { success: true };
      } else {
        setKeyStatus('invalid');
        return { success: false, error: result.message };
      }
    } catch (error) {
      setKeyStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [values, executor]);

  return {
    values,
    errors,
    isDirty,
    keyStatus,
    handleChange,
    validate,
    reset,
    setErrors,
    setKeyStatus,
    testKey,
  };
}

export default RestApiKeyCredentialFormFields;
