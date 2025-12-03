// ============================================
// PROTOCOL OS - CLIENT CREDENTIALS CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.5.b
// Purpose: React component for Client Credentials Grant configuration UI
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { ClientCredentialsHandshakeExecutor, type ClientAuthMethod } from './1.3.5.a_fileClientCredentialsHandshakeExecutor';

/**
 * M2M Provider preset configuration
 */
export interface ClientCredentialsProviderPreset {
  id: string;
  name: string;
  icon: string;
  tokenUrl: string;
  introspectionUrl?: string;
  revocationUrl?: string;
  defaultScopes: string[];
  scopeOptions: Array<{ value: string; label: string; description?: string }>;
  defaultAuthMethod: ClientAuthMethod;
  requiresAudience: boolean;
  documentationUrl: string;
  notes?: string;
}

/**
 * Provider presets for common M2M OAuth providers
 */
export const CLIENT_CREDENTIALS_PROVIDER_PRESETS: ClientCredentialsProviderPreset[] = [
  {
    id: 'auth0',
    name: 'Auth0 M2M',
    icon: 'auth0',
    tokenUrl: 'https://{domain}/oauth/token',
    introspectionUrl: 'https://{domain}/oauth/introspect',
    revocationUrl: 'https://{domain}/oauth/revoke',
    defaultScopes: [],
    scopeOptions: [],
    defaultAuthMethod: 'client_secret_post',
    requiresAudience: true,
    documentationUrl: 'https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-credentials-flow',
    notes: 'Audience is REQUIRED for Auth0. Set to your API identifier.',
  },
  {
    id: 'okta',
    name: 'Okta Service App',
    icon: 'okta',
    tokenUrl: 'https://{domain}/oauth2/default/v1/token',
    introspectionUrl: 'https://{domain}/oauth2/default/v1/introspect',
    revocationUrl: 'https://{domain}/oauth2/default/v1/revoke',
    defaultScopes: [],
    scopeOptions: [],
    defaultAuthMethod: 'client_secret_basic',
    requiresAudience: false,
    documentationUrl: 'https://developer.okta.com/docs/guides/implement-grant-type/clientcreds/main/',
    notes: 'Use your Okta domain (e.g., dev-123456.okta.com)',
  },
  {
    id: 'azure-ad',
    name: 'Azure AD App-Only',
    icon: 'microsoft',
    tokenUrl: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
    defaultScopes: ['.default'],
    scopeOptions: [
      { value: '.default', label: '.default', description: 'All static permissions for the app' },
    ],
    defaultAuthMethod: 'client_secret_post',
    requiresAudience: false,
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow',
    notes: 'Tenant can be: tenant-id, common, organizations, or consumers',
  },
  {
    id: 'google',
    name: 'Google Service Account',
    icon: 'google',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    defaultScopes: [],
    scopeOptions: [
      { value: 'https://www.googleapis.com/auth/cloud-platform', label: 'Cloud Platform', description: 'Full GCP access' },
      { value: 'https://www.googleapis.com/auth/bigquery', label: 'BigQuery', description: 'BigQuery access' },
      { value: 'https://www.googleapis.com/auth/pubsub', label: 'Pub/Sub', description: 'Pub/Sub access' },
    ],
    defaultAuthMethod: 'private_key_jwt',
    requiresAudience: false,
    documentationUrl: 'https://developers.google.com/identity/protocols/oauth2/service-account',
    notes: 'Google service accounts use JWT with private key (private_key_jwt)',
  },
  {
    id: 'aws-cognito',
    name: 'AWS Cognito M2M',
    icon: 'aws',
    tokenUrl: 'https://{domain}.auth.{region}.amazoncognito.com/oauth2/token',
    defaultScopes: [],
    scopeOptions: [],
    defaultAuthMethod: 'client_secret_basic',
    requiresAudience: false,
    documentationUrl: 'https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html',
    notes: 'Domain format: your-domain.auth.us-east-1.amazoncognito.com',
  },
  {
    id: 'salesforce',
    name: 'Salesforce Server-to-Server',
    icon: 'salesforce',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    introspectionUrl: 'https://login.salesforce.com/services/oauth2/introspect',
    revocationUrl: 'https://login.salesforce.com/services/oauth2/revoke',
    defaultScopes: ['api', 'refresh_token'],
    scopeOptions: [
      { value: 'api', label: 'API', description: 'REST API access' },
      { value: 'chatter_api', label: 'Chatter API', description: 'Chatter access' },
      { value: 'full', label: 'Full', description: 'Full access' },
    ],
    defaultAuthMethod: 'client_secret_post',
    requiresAudience: false,
    documentationUrl: 'https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_client_credentials_flow.htm',
    notes: 'Use test.salesforce.com for sandbox environments',
  },
  {
    id: 'twilio',
    name: 'Twilio API',
    icon: 'twilio',
    tokenUrl: 'https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Tokens.json',
    defaultScopes: [],
    scopeOptions: [],
    defaultAuthMethod: 'client_secret_basic',
    requiresAudience: false,
    documentationUrl: 'https://www.twilio.com/docs/iam/credentials/api',
    notes: 'Client ID = Account SID, Client Secret = Auth Token',
  },
  {
    id: 'stripe',
    name: 'Stripe API',
    icon: 'stripe',
    tokenUrl: '', // Stripe uses API keys, not OAuth
    defaultScopes: [],
    scopeOptions: [],
    defaultAuthMethod: 'client_secret_basic',
    requiresAudience: false,
    documentationUrl: 'https://stripe.com/docs/api/authentication',
    notes: 'Stripe Connect uses OAuth. Regular API uses API keys (not this flow).',
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    icon: 'settings',
    tokenUrl: '',
    defaultScopes: [],
    scopeOptions: [],
    defaultAuthMethod: 'client_secret_basic',
    requiresAudience: false,
    documentationUrl: '',
  },
];

/**
 * Props for the credential form
 */
export interface ClientCredentialsCredentialFormFieldsProps {
  /** Current credential values */
  values: Record<string, unknown>;
  
  /** Callback when values change */
  onChange: (values: Record<string, unknown>) => void;
  
  /** Callback to trigger authentication */
  onAuthenticate?: () => void;
  
  /** Callback when form is submitted */
  onSubmit?: () => void;
  
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  
  /** Whether the form is disabled */
  disabled?: boolean;
  
  /** Validation errors from parent */
  errors?: Record<string, string>;
  
  /** Current authentication status */
  authStatus?: 'none' | 'pending' | 'authenticated' | 'expired' | 'error';
  
  /** Custom class name */
  className?: string;
}

/**
 * Client Credentials Credential Form Fields Component
 */
export const ClientCredentialsCredentialFormFields: React.FC<ClientCredentialsCredentialFormFieldsProps> = ({
  values,
  onChange,
  onAuthenticate,
  onSubmit,
  isLoading = false,
  disabled = false,
  errors = {},
  authStatus = 'none',
  className = '',
}) => {
  // State for selected provider preset
  const [selectedProvider, setSelectedProvider] = useState<string>('custom');
  
  // State for collapsible sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    provider: true,
    credentials: true,
    endpoints: true,
    authentication: false,
    authorization: true,
    tokens: false,
    advanced: false,
  });

  // State for showing/hiding secrets
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Get executor for field definitions
  const executor = useMemo(() => new ClientCredentialsHandshakeExecutor(), []);

  // Detect provider from tokenUrl
  useEffect(() => {
    const tokenUrl = values.tokenUrl as string;
    if (!tokenUrl) return;

    for (const preset of CLIENT_CREDENTIALS_PROVIDER_PRESETS) {
      if (preset.id !== 'custom') {
        // Check for domain pattern match
        const urlPattern = preset.tokenUrl
          .replace('{domain}', '[^/]+')
          .replace('{tenant}', '[^/]+')
          .replace('{region}', '[^/]+')
          .replace('{accountSid}', '[^/]+');
        
        if (new RegExp(urlPattern).test(tokenUrl)) {
          setSelectedProvider(preset.id);
          return;
        }
      }
    }
    
    setSelectedProvider('custom');
  }, [values.tokenUrl]);

  // Handle provider selection
  const handleProviderSelect = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    
    const preset = CLIENT_CREDENTIALS_PROVIDER_PRESETS.find((p) => p.id === providerId);
    if (preset && preset.id !== 'custom') {
      onChange({
        ...values,
        tokenUrl: preset.tokenUrl,
        introspectionUrl: preset.introspectionUrl || '',
        revocationUrl: preset.revocationUrl || '',
        scopes: preset.defaultScopes.join(' '),
        clientAuthMethod: preset.defaultAuthMethod,
      });
    }
  }, [values, onChange]);

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    onChange({
      ...values,
      [fieldId]: value,
    });
  }, [values, onChange]);

  // Handle scope toggle
  const handleScopeToggle = useCallback((scope: string) => {
    const currentScopes = ((values.scopes as string) || '').split(/[\s,]+/).filter(Boolean);
    const newScopes = currentScopes.includes(scope)
      ? currentScopes.filter((s) => s !== scope)
      : [...currentScopes, scope];
    
    handleFieldChange('scopes', newScopes.join(' '));
  }, [values.scopes, handleFieldChange]);

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
    CLIENT_CREDENTIALS_PROVIDER_PRESETS.find((p) => p.id === selectedProvider),
    [selectedProvider]
  );

  // Parse current scopes
  const currentScopes = useMemo(() => 
    ((values.scopes as string) || '').split(/[\s,]+/).filter(Boolean),
    [values.scopes]
  );

  // Check if authentication method needs private key
  const needsPrivateKey = (values.clientAuthMethod as string) === 'private_key_jwt';

  // Render group header
  const renderGroupHeader = (
    groupId: string,
    label: string,
    description?: string,
    badge?: React.ReactNode
  ) => (
    <button
      type="button"
      className="cc-form__group-header"
      onClick={() => toggleGroup(groupId)}
      aria-expanded={expandedGroups[groupId]}
    >
      <span className="cc-form__group-icon">
        {expandedGroups[groupId] ? '▼' : '▶'}
      </span>
      <span className="cc-form__group-label">{label}</span>
      {badge}
      {description && (
        <span className="cc-form__group-description">{description}</span>
      )}
    </button>
  );

  // Render provider selector
  const renderProviderSelector = () => (
    <div className="cc-form__providers">
      <label className="cc-form__label">M2M OAuth Provider</label>
      <div className="cc-form__provider-grid">
        {CLIENT_CREDENTIALS_PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`cc-form__provider-button ${
              selectedProvider === preset.id ? 'cc-form__provider-button--selected' : ''
            }`}
            onClick={() => handleProviderSelect(preset.id)}
            disabled={disabled || isLoading}
            title={preset.name}
          >
            <span className="cc-form__provider-icon">{preset.icon}</span>
            <span className="cc-form__provider-name">{preset.name}</span>
          </button>
        ))}
      </div>
      {currentPreset?.documentationUrl && (
        <a
          href={currentPreset.documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cc-form__docs-link"
        >
          View {currentPreset.name} Documentation →
        </a>
      )}
      {currentPreset?.notes && (
        <div className="cc-form__provider-notes">
          ℹ️ {currentPreset.notes}
        </div>
      )}
    </div>
  );

  // Render credentials fields
  const renderCredentialsFields = () => (
    <div className="cc-form__credentials">
      <div className="cc-form__security-warning">
        <span className="cc-form__warning-icon">🔐</span>
        <div className="cc-form__warning-content">
          <strong>Security Notice</strong>
          <p>
            Client Credentials grant direct API access without user involvement.
            Store these credentials securely using environment variables or a secrets manager.
            Never expose them in client-side code or logs.
          </p>
        </div>
      </div>

      <div className="cc-form__field">
        <label htmlFor="clientId" className="cc-form__label">
          Client ID
          <span className="cc-form__required">*</span>
        </label>
        <input
          id="clientId"
          type="text"
          className={`cc-form__input ${errors.clientId ? 'cc-form__input--error' : ''}`}
          value={(values.clientId as string) || ''}
          onChange={(e) => handleFieldChange('clientId', e.target.value)}
          placeholder="your-service-client-id"
          disabled={disabled || isLoading}
        />
        {errors.clientId && (
          <span className="cc-form__error">{errors.clientId}</span>
        )}
      </div>

      <div className="cc-form__field">
        <label htmlFor="clientSecret" className="cc-form__label">
          Client Secret
          <span className="cc-form__required">*</span>
        </label>
        <div className="cc-form__secret-input">
          <input
            id="clientSecret"
            type={showClientSecret ? 'text' : 'password'}
            className={`cc-form__input ${errors.clientSecret ? 'cc-form__input--error' : ''}`}
            value={(values.clientSecret as string) || ''}
            onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
            placeholder="••••••••••••••••"
            disabled={disabled || isLoading}
          />
          <button
            type="button"
            className="cc-form__secret-toggle"
            onClick={() => setShowClientSecret(!showClientSecret)}
            aria-label={showClientSecret ? 'Hide secret' : 'Show secret'}
          >
            {showClientSecret ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.clientSecret && (
          <span className="cc-form__error">{errors.clientSecret}</span>
        )}
        <span className="cc-form__hint">
          ⚠️ Keep this secret secure. Never commit to version control.
        </span>
      </div>
    </div>
  );

  // Render endpoints fields
  const renderEndpointsFields = () => (
    <div className="cc-form__endpoints">
      <div className="cc-form__field">
        <label htmlFor="tokenUrl" className="cc-form__label">
          Token URL
          <span className="cc-form__required">*</span>
        </label>
        <input
          id="tokenUrl"
          type="url"
          className={`cc-form__input ${errors.tokenUrl ? 'cc-form__input--error' : ''}`}
          value={(values.tokenUrl as string) || ''}
          onChange={(e) => handleFieldChange('tokenUrl', e.target.value)}
          placeholder="https://auth.provider.com/oauth/token"
          disabled={disabled || isLoading}
        />
        {errors.tokenUrl && (
          <span className="cc-form__error">{errors.tokenUrl}</span>
        )}
        <span className="cc-form__hint">
          The endpoint where tokens are requested
        </span>
      </div>

      <div className="cc-form__field">
        <label htmlFor="introspectionUrl" className="cc-form__label">
          Introspection URL
          <span className="cc-form__optional">(Optional)</span>
        </label>
        <input
          id="introspectionUrl"
          type="url"
          className="cc-form__input"
          value={(values.introspectionUrl as string) || ''}
          onChange={(e) => handleFieldChange('introspectionUrl', e.target.value)}
          placeholder="https://auth.provider.com/oauth/introspect"
          disabled={disabled || isLoading}
        />
        <span className="cc-form__hint">
          Used to validate tokens without making API calls
        </span>
      </div>

      <div className="cc-form__field">
        <label htmlFor="revocationUrl" className="cc-form__label">
          Revocation URL
          <span className="cc-form__optional">(Optional)</span>
        </label>
        <input
          id="revocationUrl"
          type="url"
          className="cc-form__input"
          value={(values.revocationUrl as string) || ''}
          onChange={(e) => handleFieldChange('revocationUrl', e.target.value)}
          placeholder="https://auth.provider.com/oauth/revoke"
          disabled={disabled || isLoading}
        />
      </div>
    </div>
  );

  // Render authentication method selector
  const renderAuthMethodSelector = () => (
    <div className="cc-form__auth-method">
      <div className="cc-form__field">
        <label htmlFor="clientAuthMethod" className="cc-form__label">
          Client Authentication Method
        </label>
        <select
          id="clientAuthMethod"
          className="cc-form__select"
          value={(values.clientAuthMethod as string) || 'client_secret_basic'}
          onChange={(e) => handleFieldChange('clientAuthMethod', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="client_secret_basic">Basic Auth Header (Most Common)</option>
          <option value="client_secret_post">POST Body</option>
          <option value="client_secret_jwt">JWT Assertion (HS256)</option>
          <option value="private_key_jwt">JWT with Private Key (RS256)</option>
        </select>
        <span className="cc-form__hint">
          How credentials are sent to the token endpoint
        </span>
      </div>

      {/* Private key field for private_key_jwt */}
      {needsPrivateKey && (
        <>
          <div className="cc-form__field">
            <label htmlFor="privateKey" className="cc-form__label">
              Private Key (PEM)
              <span className="cc-form__required">*</span>
            </label>
            <div className="cc-form__secret-input cc-form__secret-input--multiline">
              <textarea
                id="privateKey"
                className={`cc-form__textarea ${errors.privateKey ? 'cc-form__textarea--error' : ''}`}
                value={(values.privateKey as string) || ''}
                onChange={(e) => handleFieldChange('privateKey', e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                disabled={disabled || isLoading}
                rows={6}
                style={{ fontFamily: 'monospace' }}
              />
              <button
                type="button"
                className="cc-form__secret-toggle"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                aria-label={showPrivateKey ? 'Hide key' : 'Show key'}
              >
                {showPrivateKey ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.privateKey && (
              <span className="cc-form__error">{errors.privateKey}</span>
            )}
          </div>

          <div className="cc-form__field">
            <label htmlFor="keyId" className="cc-form__label">
              Key ID (kid)
              <span className="cc-form__optional">(Optional)</span>
            </label>
            <input
              id="keyId"
              type="text"
              className="cc-form__input"
              value={(values.keyId as string) || ''}
              onChange={(e) => handleFieldChange('keyId', e.target.value)}
              placeholder="your-key-id"
              disabled={disabled || isLoading}
            />
            <span className="cc-form__hint">
              Key ID for JWT header (required by some providers)
            </span>
          </div>
        </>
      )}
    </div>
  );

  // Render authorization settings
  const renderAuthorizationSettings = () => (
    <div className="cc-form__authorization">
      <div className="cc-form__field">
        <label htmlFor="scopes" className="cc-form__label">
          Scopes
          <span className="cc-form__optional">(Optional)</span>
        </label>
        
        {/* Quick scope buttons for current provider */}
        {currentPreset && currentPreset.scopeOptions.length > 0 && (
          <div className="cc-form__scope-options">
            {currentPreset.scopeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`cc-form__scope-button ${
                  currentScopes.includes(option.value) ? 'cc-form__scope-button--selected' : ''
                }`}
                onClick={() => handleScopeToggle(option.value)}
                disabled={disabled || isLoading}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        
        {/* Manual scope input */}
        <input
          id="scopes"
          type="text"
          className="cc-form__input"
          value={(values.scopes as string) || ''}
          onChange={(e) => handleFieldChange('scopes', e.target.value)}
          placeholder="read:data write:data"
          disabled={disabled || isLoading}
        />
        <span className="cc-form__hint">
          Space-separated list of scopes. Leave empty for default scopes.
        </span>
      </div>

      <div className="cc-form__field">
        <label htmlFor="audience" className="cc-form__label">
          Audience
          {currentPreset?.requiresAudience && <span className="cc-form__required">*</span>}
          {!currentPreset?.requiresAudience && <span className="cc-form__optional">(Optional)</span>}
        </label>
        <input
          id="audience"
          type="text"
          className={`cc-form__input ${errors.audience ? 'cc-form__input--error' : ''}`}
          value={(values.audience as string) || ''}
          onChange={(e) => handleFieldChange('audience', e.target.value)}
          placeholder="https://api.yourservice.com"
          disabled={disabled || isLoading}
        />
        {errors.audience && (
          <span className="cc-form__error">{errors.audience}</span>
        )}
        {currentPreset?.requiresAudience && (
          <span className="cc-form__hint">
            ⚠️ Required for {currentPreset.name}. Set to your API identifier.
          </span>
        )}
      </div>

      <div className="cc-form__field">
        <label htmlFor="resource" className="cc-form__label">
          Resource
          <span className="cc-form__optional">(Optional)</span>
        </label>
        <input
          id="resource"
          type="text"
          className="cc-form__input"
          value={(values.resource as string) || ''}
          onChange={(e) => handleFieldChange('resource', e.target.value)}
          placeholder="https://api.example.com"
          disabled={disabled || isLoading}
        />
        <span className="cc-form__hint">
          Resource indicator per RFC 8707 (used by some providers)
        </span>
      </div>
    </div>
  );

  // Render token status
  const renderTokenStatus = () => {
    const hasAccessToken = !!(values.accessToken);
    const expiresAt = values.tokenExpiresAt as number;
    
    let expirationText = 'No expiration info';
    let isExpired = false;
    
    if (expiresAt) {
      const expirationDate = new Date(expiresAt * 1000);
      isExpired = Date.now() > expiresAt * 1000;
      expirationText = isExpired 
        ? `Expired ${expirationDate.toLocaleString()}`
        : `Expires ${expirationDate.toLocaleString()}`;
    }

    return (
      <div className="cc-form__token-status">
        <div className="cc-form__token-row">
          <span className="cc-form__token-label">Access Token:</span>
          <span className={`cc-form__token-badge ${hasAccessToken ? 'cc-form__token-badge--present' : 'cc-form__token-badge--missing'}`}>
            {hasAccessToken ? '✓ Present' : '✗ Not obtained'}
          </span>
        </div>
        
        <div className="cc-form__token-row">
          <span className="cc-form__token-label">Refresh Token:</span>
          <span className="cc-form__token-badge cc-form__token-badge--na">
            N/A (Request new token instead)
          </span>
        </div>
        
        <div className="cc-form__token-row">
          <span className="cc-form__token-label">Expiration:</span>
          <span className={`cc-form__token-badge ${isExpired ? 'cc-form__token-badge--expired' : ''}`}>
            {expirationText}
          </span>
        </div>

        {hasAccessToken && (
          <div className="cc-form__field">
            <label className="cc-form__label">Access Token (masked)</label>
            <input
              type="password"
              className="cc-form__input"
              value={(values.accessToken as string) || ''}
              readOnly
              disabled
            />
          </div>
        )}
      </div>
    );
  };

  // Render auth button
  const renderAuthButton = () => {
    const isConfigured = values.clientId && values.clientSecret && values.tokenUrl;
    const needsAudience = currentPreset?.requiresAudience && !values.audience;
    const canAuthenticate = isConfigured && !needsAudience;
    
    return (
      <div className="cc-form__auth-section">
        {authStatus === 'authenticated' ? (
          <div className="cc-form__auth-status cc-form__auth-status--success">
            <span className="cc-form__auth-icon">✓</span>
            <span>Token obtained successfully</span>
          </div>
        ) : authStatus === 'expired' ? (
          <div className="cc-form__auth-status cc-form__auth-status--warning">
            <span className="cc-form__auth-icon">⚠</span>
            <span>Token expired - request a new one</span>
          </div>
        ) : authStatus === 'pending' ? (
          <div className="cc-form__auth-status cc-form__auth-status--pending">
            <span className="cc-form__auth-icon">⏳</span>
            <span>Requesting token...</span>
          </div>
        ) : authStatus === 'error' ? (
          <div className="cc-form__auth-status cc-form__auth-status--error">
            <span className="cc-form__auth-icon">✗</span>
            <span>Token request failed</span>
          </div>
        ) : null}

        <button
          type="button"
          className="cc-form__auth-button"
          onClick={onAuthenticate}
          disabled={disabled || isLoading || !canAuthenticate || authStatus === 'pending'}
        >
          {authStatus === 'pending' ? (
            'Requesting Token...'
          ) : authStatus === 'authenticated' ? (
            '🔄 Request New Token'
          ) : (
            '🔐 Get Access Token'
          )}
        </button>

        {!canAuthenticate && (
          <span className="cc-form__hint">
            {needsAudience 
              ? `Audience is required for ${currentPreset?.name}`
              : 'Complete all required fields to enable authentication'}
          </span>
        )}

        <div className="cc-form__m2m-info">
          <strong>ℹ️ Machine-to-Machine Flow:</strong> No user interaction needed.
          This authenticates your service directly.
        </div>
      </div>
    );
  };

  return (
    <form
      className={`cc-form ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Provider Selection */}
      <div className="cc-form__group">
        {renderGroupHeader('provider', 'Select Provider')}
        {expandedGroups.provider && (
          <div className="cc-form__group-content">
            {renderProviderSelector()}
          </div>
        )}
      </div>

      {/* Credentials */}
      <div className="cc-form__group">
        {renderGroupHeader('credentials', 'Client Credentials', undefined,
          <span className="cc-form__badge cc-form__badge--security">🔐 Sensitive</span>
        )}
        {expandedGroups.credentials && (
          <div className="cc-form__group-content">
            {renderCredentialsFields()}
          </div>
        )}
      </div>

      {/* Endpoints */}
      <div className="cc-form__group">
        {renderGroupHeader('endpoints', 'OAuth Endpoints')}
        {expandedGroups.endpoints && (
          <div className="cc-form__group-content">
            {renderEndpointsFields()}
          </div>
        )}
      </div>

      {/* Authentication Method */}
      <div className="cc-form__group">
        {renderGroupHeader('authentication', 'Authentication Method')}
        {expandedGroups.authentication && (
          <div className="cc-form__group-content">
            {renderAuthMethodSelector()}
          </div>
        )}
      </div>

      {/* Authorization Settings */}
      <div className="cc-form__group">
        {renderGroupHeader('authorization', 'Authorization')}
        {expandedGroups.authorization && (
          <div className="cc-form__group-content">
            {renderAuthorizationSettings()}
            {renderAuthButton()}
          </div>
        )}
      </div>

      {/* Token Status */}
      <div className="cc-form__group">
        {renderGroupHeader(
          'tokens',
          'Token Status',
          undefined,
          values.accessToken ? (
            <span className="cc-form__badge cc-form__badge--success">Active</span>
          ) : (
            <span className="cc-form__badge">Not obtained</span>
          )
        )}
        {expandedGroups.tokens && (
          <div className="cc-form__group-content">
            {renderTokenStatus()}
          </div>
        )}
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="cc-form__actions">
          <button
            type="submit"
            className="cc-form__submit"
            disabled={disabled || isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </form>
  );
};

/**
 * Hook for managing Client Credentials credential form state
 */
export function useClientCredentialsCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'authenticated' | 'expired' | 'error'>('none');

  const executor = useMemo(() => new ClientCredentialsHandshakeExecutor(), []);

  // Check auth status based on token
  useEffect(() => {
    if (values.accessToken) {
      const expiresAt = values.tokenExpiresAt as number;
      if (expiresAt && Date.now() > expiresAt * 1000) {
        setAuthStatus('expired');
      } else {
        setAuthStatus('authenticated');
      }
    } else {
      setAuthStatus('none');
    }
  }, [values.accessToken, values.tokenExpiresAt]);

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
    setAuthStatus('none');
  }, []);

  /**
   * Authenticate and get token
   */
  const authenticate = useCallback(async () => {
    setAuthStatus('pending');
    
    try {
      const result = await executor.authenticate(values);
      
      if (result.type === 'complete' && result.data) {
        const data = result.data as { accessToken: string; expiresAt?: number };
        setValues((prev) => ({
          ...prev,
          accessToken: data.accessToken,
          tokenExpiresAt: data.expiresAt,
        }));
        setAuthStatus('authenticated');
        return { success: true, data };
      } else {
        setAuthStatus('error');
        setErrors({ auth: result.error || 'Authentication failed' });
        return { success: false, error: result.error };
      }
    } catch (error) {
      setAuthStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors({ auth: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [values, executor]);

  return {
    values,
    errors,
    isDirty,
    authStatus,
    handleChange,
    validate,
    reset,
    setErrors,
    setAuthStatus,
    authenticate,
  };
}

export default ClientCredentialsCredentialFormFields;
