// ============================================
// PROTOCOL OS - OAUTH AUTH CODE CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.3.b
// Purpose: React component for OAuth 2.0 Authorization Code configuration UI
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { OAuthAuthCodeHandshakeExecutor, type ClientAuthMethod } from './1.3.3.a_fileOauthAuthCodeHandshakeExecutor';

/**
 * OAuth provider presets for confidential clients
 */
export interface OAuthConfidentialProviderPreset {
  id: string;
  name: string;
  icon: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
  revocationUrl?: string;
  introspectionUrl?: string;
  defaultScopes: string[];
  scopeOptions: Array<{ value: string; label: string; description?: string }>;
  defaultAuthMethod: ClientAuthMethod;
  documentationUrl: string;
  notes?: string;
}

/**
 * Pre-configured OAuth provider presets for server-side apps
 */
export const OAUTH_CONFIDENTIAL_PROVIDER_PRESETS: OAuthConfidentialProviderPreset[] = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: 'salesforce',
    authorizationUrl: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenUrl: 'https://login.salesforce.com/services/oauth2/token',
    userInfoUrl: 'https://login.salesforce.com/services/oauth2/userinfo',
    revocationUrl: 'https://login.salesforce.com/services/oauth2/revoke',
    introspectionUrl: 'https://login.salesforce.com/services/oauth2/introspect',
    defaultScopes: ['openid', 'api', 'refresh_token'],
    scopeOptions: [
      { value: 'openid', label: 'OpenID', description: 'Basic identity' },
      { value: 'api', label: 'API', description: 'Full API access' },
      { value: 'refresh_token', label: 'Refresh Token', description: 'Offline access' },
      { value: 'full', label: 'Full', description: 'Full access to all data' },
      { value: 'chatter_api', label: 'Chatter API', description: 'Chatter REST API' },
    ],
    defaultAuthMethod: 'client_secret_post',
    documentationUrl: 'https://help.salesforce.com/articleView?id=remoteaccess_oauth_web_server_flow.htm',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: 'hubspot',
    authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
    tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
    userInfoUrl: 'https://api.hubapi.com/oauth/v1/access-tokens/',
    defaultScopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'],
    scopeOptions: [
      { value: 'crm.objects.contacts.read', label: 'Contacts (Read)', description: 'Read contacts' },
      { value: 'crm.objects.contacts.write', label: 'Contacts (Write)', description: 'Write contacts' },
      { value: 'crm.objects.companies.read', label: 'Companies (Read)', description: 'Read companies' },
      { value: 'crm.objects.deals.read', label: 'Deals (Read)', description: 'Read deals' },
      { value: 'content', label: 'Content', description: 'CMS content access' },
    ],
    defaultAuthMethod: 'client_secret_post',
    documentationUrl: 'https://developers.hubspot.com/docs/api/oauth-quickstart-guide',
    notes: 'HubSpot uses client_secret in POST body',
  },
  {
    id: 'stripe',
    name: 'Stripe Connect',
    icon: 'stripe',
    authorizationUrl: 'https://connect.stripe.com/oauth/authorize',
    tokenUrl: 'https://connect.stripe.com/oauth/token',
    revocationUrl: 'https://connect.stripe.com/oauth/deauthorize',
    defaultScopes: ['read_write'],
    scopeOptions: [
      { value: 'read_only', label: 'Read Only', description: 'Read-only access' },
      { value: 'read_write', label: 'Read/Write', description: 'Full access' },
    ],
    defaultAuthMethod: 'client_secret_post',
    documentationUrl: 'https://stripe.com/docs/connect/oauth-reference',
    notes: 'For Stripe Connect platform integrations',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    icon: 'quickbooks',
    authorizationUrl: 'https://appcenter.intuit.com/connect/oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    userInfoUrl: 'https://sandbox-accounts.platform.intuit.com/v1/openid_connect/userinfo',
    revocationUrl: 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',
    defaultScopes: ['com.intuit.quickbooks.accounting', 'openid', 'profile', 'email'],
    scopeOptions: [
      { value: 'com.intuit.quickbooks.accounting', label: 'Accounting', description: 'QuickBooks accounting' },
      { value: 'com.intuit.quickbooks.payment', label: 'Payments', description: 'QuickBooks payments' },
      { value: 'openid', label: 'OpenID', description: 'OpenID Connect' },
      { value: 'profile', label: 'Profile', description: 'User profile' },
      { value: 'email', label: 'Email', description: 'User email' },
    ],
    defaultAuthMethod: 'client_secret_basic',
    documentationUrl: 'https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0',
  },
  {
    id: 'xero',
    name: 'Xero',
    icon: 'xero',
    authorizationUrl: 'https://login.xero.com/identity/connect/authorize',
    tokenUrl: 'https://identity.xero.com/connect/token',
    revocationUrl: 'https://identity.xero.com/connect/revocation',
    defaultScopes: ['openid', 'profile', 'email', 'accounting.transactions'],
    scopeOptions: [
      { value: 'openid', label: 'OpenID', description: 'OpenID Connect' },
      { value: 'profile', label: 'Profile', description: 'User profile' },
      { value: 'email', label: 'Email', description: 'User email' },
      { value: 'accounting.transactions', label: 'Transactions', description: 'Accounting transactions' },
      { value: 'accounting.contacts', label: 'Contacts', description: 'Accounting contacts' },
      { value: 'accounting.settings', label: 'Settings', description: 'Accounting settings' },
    ],
    defaultAuthMethod: 'client_secret_basic',
    documentationUrl: 'https://developer.xero.com/documentation/guides/oauth2/auth-flow',
  },
  {
    id: 'docusign',
    name: 'DocuSign',
    icon: 'docusign',
    authorizationUrl: 'https://account.docusign.com/oauth/auth',
    tokenUrl: 'https://account.docusign.com/oauth/token',
    userInfoUrl: 'https://account.docusign.com/oauth/userinfo',
    revocationUrl: 'https://account.docusign.com/oauth/revoke',
    defaultScopes: ['signature', 'extended'],
    scopeOptions: [
      { value: 'signature', label: 'Signature', description: 'eSignature API' },
      { value: 'extended', label: 'Extended', description: 'Extended access' },
      { value: 'impersonation', label: 'Impersonation', description: 'Act on behalf of users' },
    ],
    defaultAuthMethod: 'client_secret_basic',
    documentationUrl: 'https://developers.docusign.com/platform/auth/authcode/',
  },
  {
    id: 'box',
    name: 'Box',
    icon: 'box',
    authorizationUrl: 'https://account.box.com/api/oauth2/authorize',
    tokenUrl: 'https://api.box.com/oauth2/token',
    revocationUrl: 'https://api.box.com/oauth2/revoke',
    defaultScopes: [],
    scopeOptions: [
      { value: 'root_readwrite', label: 'Read/Write', description: 'Full access to Box content' },
      { value: 'root_readonly', label: 'Read Only', description: 'Read-only access' },
      { value: 'manage_groups', label: 'Manage Groups', description: 'Group management' },
    ],
    defaultAuthMethod: 'client_secret_post',
    documentationUrl: 'https://developer.box.com/guides/authentication/oauth2/',
    notes: 'Box does not use scopes in the traditional way',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    icon: 'mailchimp',
    authorizationUrl: 'https://login.mailchimp.com/oauth2/authorize',
    tokenUrl: 'https://login.mailchimp.com/oauth2/token',
    defaultScopes: [],
    scopeOptions: [],
    defaultAuthMethod: 'client_secret_post',
    documentationUrl: 'https://mailchimp.com/developer/marketing/guides/access-user-data-oauth-2/',
    notes: 'Mailchimp uses datacenter-specific API URLs',
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    icon: 'settings',
    authorizationUrl: '',
    tokenUrl: '',
    defaultScopes: [],
    scopeOptions: [],
    defaultAuthMethod: 'client_secret_basic',
    documentationUrl: '',
  },
];

/**
 * Props for the credential form
 */
export interface OAuthAuthCodeCredentialFormFieldsProps {
  /** Current credential values */
  values: Record<string, unknown>;
  
  /** Callback when values change */
  onChange: (values: Record<string, unknown>) => void;
  
  /** Callback when authorization should start */
  onStartAuth?: () => void;
  
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
 * OAuth Auth Code Credential Form Fields Component
 */
export const OAuthAuthCodeCredentialFormFields: React.FC<OAuthAuthCodeCredentialFormFieldsProps> = ({
  values,
  onChange,
  onStartAuth,
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
    authorization: true,
    authentication: false,
    tokens: false,
    advanced: false,
  });

  // Show/hide client secret
  const [showClientSecret, setShowClientSecret] = useState(false);

  // Get executor for field definitions
  const executor = useMemo(() => new OAuthAuthCodeHandshakeExecutor(), []);

  // Detect selected provider from current values
  useEffect(() => {
    const authUrl = values.authorizationUrl as string;
    if (authUrl) {
      const matchingPreset = OAUTH_CONFIDENTIAL_PROVIDER_PRESETS.find(
        (p) => p.id !== 'custom' && authUrl.includes(new URL(p.authorizationUrl || 'http://example.com').hostname)
      );
      if (matchingPreset) {
        setSelectedProvider(matchingPreset.id);
      }
    }
  }, [values.authorizationUrl]);

  // Handle provider selection
  const handleProviderSelect = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    
    const preset = OAUTH_CONFIDENTIAL_PROVIDER_PRESETS.find((p) => p.id === providerId);
    if (preset && preset.id !== 'custom') {
      onChange({
        ...values,
        authorizationUrl: preset.authorizationUrl,
        tokenUrl: preset.tokenUrl,
        userInfoUrl: preset.userInfoUrl || '',
        revocationUrl: preset.revocationUrl || '',
        introspectionUrl: preset.introspectionUrl || '',
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
    OAUTH_CONFIDENTIAL_PROVIDER_PRESETS.find((p) => p.id === selectedProvider),
    [selectedProvider]
  );

  // Parse current scopes
  const currentScopes = useMemo(() => 
    ((values.scopes as string) || '').split(/[\s,]+/).filter(Boolean),
    [values.scopes]
  );

  // Render group header
  const renderGroupHeader = (
    groupId: string,
    label: string,
    description?: string,
    badge?: React.ReactNode
  ) => (
    <button
      type="button"
      className="oauth-form__group-header"
      onClick={() => toggleGroup(groupId)}
      aria-expanded={expandedGroups[groupId]}
    >
      <span className="oauth-form__group-icon">
        {expandedGroups[groupId] ? '▼' : '▶'}
      </span>
      <span className="oauth-form__group-label">{label}</span>
      {badge}
      {description && (
        <span className="oauth-form__group-description">{description}</span>
      )}
    </button>
  );

  // Render provider selector
  const renderProviderSelector = () => (
    <div className="oauth-form__providers">
      <label className="oauth-form__label">OAuth Provider</label>
      <div className="oauth-form__provider-grid">
        {OAUTH_CONFIDENTIAL_PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`oauth-form__provider-button ${
              selectedProvider === preset.id ? 'oauth-form__provider-button--selected' : ''
            }`}
            onClick={() => handleProviderSelect(preset.id)}
            disabled={disabled || isLoading}
          >
            <span className="oauth-form__provider-icon">{preset.icon}</span>
            <span className="oauth-form__provider-name">{preset.name}</span>
          </button>
        ))}
      </div>
      {currentPreset?.documentationUrl && (
        <a
          href={currentPreset.documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="oauth-form__docs-link"
        >
          View {currentPreset.name} OAuth Documentation →
        </a>
      )}
      {currentPreset?.notes && (
        <div className="oauth-form__provider-notes">
          ℹ️ {currentPreset.notes}
        </div>
      )}
    </div>
  );

  // Render credentials fields
  const renderCredentialsFields = () => (
    <div className="oauth-form__credentials">
      <div className="oauth-form__warning">
        ⚠️ <strong>Security Warning:</strong> The client_secret must be kept secure.
        Only use this flow in server-side applications. Never expose client_secret
        in browser-side code or mobile apps.
      </div>

      <div className="oauth-form__field">
        <label htmlFor="clientId" className="oauth-form__label">
          Client ID
          <span className="oauth-form__required">*</span>
        </label>
        <input
          id="clientId"
          type="text"
          className={`oauth-form__input ${errors.clientId ? 'oauth-form__input--error' : ''}`}
          value={(values.clientId as string) || ''}
          onChange={(e) => handleFieldChange('clientId', e.target.value)}
          placeholder="your-client-id"
          disabled={disabled || isLoading}
        />
        {errors.clientId && (
          <span className="oauth-form__error">{errors.clientId}</span>
        )}
      </div>

      <div className="oauth-form__field">
        <label htmlFor="clientSecret" className="oauth-form__label">
          Client Secret
          <span className="oauth-form__required">*</span>
        </label>
        <div className="oauth-form__secret-input">
          <input
            id="clientSecret"
            type={showClientSecret ? 'text' : 'password'}
            className={`oauth-form__input ${errors.clientSecret ? 'oauth-form__input--error' : ''}`}
            value={(values.clientSecret as string) || ''}
            onChange={(e) => handleFieldChange('clientSecret', e.target.value)}
            placeholder="your-client-secret"
            disabled={disabled || isLoading}
          />
          <button
            type="button"
            className="oauth-form__toggle-secret"
            onClick={() => setShowClientSecret(!showClientSecret)}
            aria-label={showClientSecret ? 'Hide secret' : 'Show secret'}
          >
            {showClientSecret ? '🙈' : '👁️'}
          </button>
        </div>
        {errors.clientSecret && (
          <span className="oauth-form__error">{errors.clientSecret}</span>
        )}
        <span className="oauth-form__hint">
          ⚠️ Keep this secret! Store securely and never expose in client-side code.
        </span>
      </div>

      <div className="oauth-form__field">
        <label htmlFor="redirectUri" className="oauth-form__label">
          Redirect URI
          <span className="oauth-form__required">*</span>
        </label>
        <input
          id="redirectUri"
          type="url"
          className={`oauth-form__input ${errors.redirectUri ? 'oauth-form__input--error' : ''}`}
          value={(values.redirectUri as string) || ''}
          onChange={(e) => handleFieldChange('redirectUri', e.target.value)}
          placeholder="https://yourapp.com/auth/callback"
          disabled={disabled || isLoading}
        />
        {errors.redirectUri && (
          <span className="oauth-form__error">{errors.redirectUri}</span>
        )}
      </div>
    </div>
  );

  // Render endpoints fields
  const renderEndpointsFields = () => (
    <div className="oauth-form__endpoints">
      <div className="oauth-form__field">
        <label htmlFor="authorizationUrl" className="oauth-form__label">
          Authorization URL
          <span className="oauth-form__required">*</span>
        </label>
        <input
          id="authorizationUrl"
          type="url"
          className={`oauth-form__input ${errors.authorizationUrl ? 'oauth-form__input--error' : ''}`}
          value={(values.authorizationUrl as string) || ''}
          onChange={(e) => handleFieldChange('authorizationUrl', e.target.value)}
          placeholder="https://provider.com/oauth/authorize"
          disabled={disabled || isLoading}
        />
        {errors.authorizationUrl && (
          <span className="oauth-form__error">{errors.authorizationUrl}</span>
        )}
      </div>

      <div className="oauth-form__field">
        <label htmlFor="tokenUrl" className="oauth-form__label">
          Token URL
          <span className="oauth-form__required">*</span>
        </label>
        <input
          id="tokenUrl"
          type="url"
          className={`oauth-form__input ${errors.tokenUrl ? 'oauth-form__input--error' : ''}`}
          value={(values.tokenUrl as string) || ''}
          onChange={(e) => handleFieldChange('tokenUrl', e.target.value)}
          placeholder="https://provider.com/oauth/token"
          disabled={disabled || isLoading}
        />
        {errors.tokenUrl && (
          <span className="oauth-form__error">{errors.tokenUrl}</span>
        )}
      </div>

      <div className="oauth-form__field">
        <label htmlFor="userInfoUrl" className="oauth-form__label">
          User Info URL
          <span className="oauth-form__optional">(Optional)</span>
        </label>
        <input
          id="userInfoUrl"
          type="url"
          className="oauth-form__input"
          value={(values.userInfoUrl as string) || ''}
          onChange={(e) => handleFieldChange('userInfoUrl', e.target.value)}
          placeholder="https://provider.com/oauth/userinfo"
          disabled={disabled || isLoading}
        />
      </div>

      <div className="oauth-form__field">
        <label htmlFor="revocationUrl" className="oauth-form__label">
          Revocation URL
          <span className="oauth-form__optional">(Optional)</span>
        </label>
        <input
          id="revocationUrl"
          type="url"
          className="oauth-form__input"
          value={(values.revocationUrl as string) || ''}
          onChange={(e) => handleFieldChange('revocationUrl', e.target.value)}
          placeholder="https://provider.com/oauth/revoke"
          disabled={disabled || isLoading}
        />
      </div>

      <div className="oauth-form__field">
        <label htmlFor="introspectionUrl" className="oauth-form__label">
          Introspection URL
          <span className="oauth-form__optional">(Optional)</span>
        </label>
        <input
          id="introspectionUrl"
          type="url"
          className="oauth-form__input"
          value={(values.introspectionUrl as string) || ''}
          onChange={(e) => handleFieldChange('introspectionUrl', e.target.value)}
          placeholder="https://provider.com/oauth/introspect"
          disabled={disabled || isLoading}
        />
        <span className="oauth-form__hint">
          Used to validate tokens without making API calls
        </span>
      </div>
    </div>
  );

  // Render client authentication method selector
  const renderAuthMethodSelector = () => (
    <div className="oauth-form__auth-method">
      <div className="oauth-form__field">
        <label htmlFor="clientAuthMethod" className="oauth-form__label">
          Client Authentication Method
        </label>
        <select
          id="clientAuthMethod"
          className="oauth-form__select"
          value={(values.clientAuthMethod as string) || 'client_secret_basic'}
          onChange={(e) => handleFieldChange('clientAuthMethod', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="client_secret_basic">Basic Auth (Header)</option>
          <option value="client_secret_post">POST Body</option>
          <option value="client_secret_jwt">JWT Assertion</option>
        </select>
        <span className="oauth-form__hint">
          {(values.clientAuthMethod as string) === 'client_secret_basic' && (
            'Client credentials sent in Authorization header (most common)'
          )}
          {(values.clientAuthMethod as string) === 'client_secret_post' && (
            'Client credentials included in POST body'
          )}
          {(values.clientAuthMethod as string) === 'client_secret_jwt' && (
            'Client authenticates using signed JWT assertion'
          )}
        </span>
      </div>
    </div>
  );

  // Render scopes selector
  const renderScopesSelector = () => (
    <div className="oauth-form__scopes">
      <div className="oauth-form__field">
        <label htmlFor="scopes" className="oauth-form__label">
          Scopes
          <span className="oauth-form__required">*</span>
        </label>
        
        {/* Quick scope buttons for current provider */}
        {currentPreset && currentPreset.scopeOptions.length > 0 && (
          <div className="oauth-form__scope-options">
            {currentPreset.scopeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`oauth-form__scope-button ${
                  currentScopes.includes(option.value) ? 'oauth-form__scope-button--selected' : ''
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
          className={`oauth-form__input ${errors.scopes ? 'oauth-form__input--error' : ''}`}
          value={(values.scopes as string) || ''}
          onChange={(e) => handleFieldChange('scopes', e.target.value)}
          placeholder="openid email profile"
          disabled={disabled || isLoading}
        />
        {errors.scopes && (
          <span className="oauth-form__error">{errors.scopes}</span>
        )}
      </div>
    </div>
  );

  // Render token status
  const renderTokenStatus = () => {
    const hasAccessToken = !!(values.accessToken);
    const hasRefreshToken = !!(values.refreshToken);
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
      <div className="oauth-form__token-status">
        <div className="oauth-form__token-row">
          <span className="oauth-form__token-label">Access Token:</span>
          <span className={`oauth-form__token-badge ${hasAccessToken ? 'oauth-form__token-badge--present' : 'oauth-form__token-badge--missing'}`}>
            {hasAccessToken ? '✓ Present' : '✗ Missing'}
          </span>
        </div>
        
        <div className="oauth-form__token-row">
          <span className="oauth-form__token-label">Refresh Token:</span>
          <span className={`oauth-form__token-badge ${hasRefreshToken ? 'oauth-form__token-badge--present' : 'oauth-form__token-badge--missing'}`}>
            {hasRefreshToken ? '✓ Present' : '✗ Missing'}
          </span>
        </div>
        
        <div className="oauth-form__token-row">
          <span className="oauth-form__token-label">Expiration:</span>
          <span className={`oauth-form__token-badge ${isExpired ? 'oauth-form__token-badge--expired' : ''}`}>
            {expirationText}
          </span>
        </div>

        {hasAccessToken && (
          <div className="oauth-form__field">
            <label className="oauth-form__label">Access Token (masked)</label>
            <input
              type="password"
              className="oauth-form__input"
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
    const isConfigured = values.clientId && values.clientSecret && 
                         values.authorizationUrl && values.tokenUrl && 
                         values.redirectUri && values.scopes;
    
    return (
      <div className="oauth-form__auth-section">
        {authStatus === 'authenticated' ? (
          <div className="oauth-form__auth-status oauth-form__auth-status--success">
            <span className="oauth-form__auth-icon">✓</span>
            <span>Authenticated successfully</span>
          </div>
        ) : authStatus === 'expired' ? (
          <div className="oauth-form__auth-status oauth-form__auth-status--warning">
            <span className="oauth-form__auth-icon">⚠</span>
            <span>Token expired - click to re-authenticate</span>
          </div>
        ) : authStatus === 'pending' ? (
          <div className="oauth-form__auth-status oauth-form__auth-status--pending">
            <span className="oauth-form__auth-icon">⏳</span>
            <span>Waiting for authorization...</span>
          </div>
        ) : authStatus === 'error' ? (
          <div className="oauth-form__auth-status oauth-form__auth-status--error">
            <span className="oauth-form__auth-icon">✗</span>
            <span>Authentication failed</span>
          </div>
        ) : null}

        <button
          type="button"
          className="oauth-form__auth-button"
          onClick={onStartAuth}
          disabled={disabled || isLoading || !isConfigured || authStatus === 'pending'}
        >
          {authStatus === 'pending' ? (
            'Waiting for Authorization...'
          ) : authStatus === 'authenticated' ? (
            'Re-authorize'
          ) : (
            'Start OAuth Authorization'
          )}
        </button>

        {!isConfigured && (
          <span className="oauth-form__hint">
            Complete all required fields to enable authorization
          </span>
        )}
      </div>
    );
  };

  return (
    <form
      className={`oauth-form oauth-form--auth-code ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Provider Selection */}
      <div className="oauth-form__group">
        {renderGroupHeader('provider', 'Select Provider')}
        {expandedGroups.provider && (
          <div className="oauth-form__group-content">
            {renderProviderSelector()}
          </div>
        )}
      </div>

      {/* Credentials */}
      <div className="oauth-form__group">
        {renderGroupHeader('credentials', 'OAuth Credentials')}
        {expandedGroups.credentials && (
          <div className="oauth-form__group-content">
            {renderCredentialsFields()}
          </div>
        )}
      </div>

      {/* Endpoints */}
      <div className="oauth-form__group">
        {renderGroupHeader('endpoints', 'OAuth Endpoints')}
        {expandedGroups.endpoints && (
          <div className="oauth-form__group-content">
            {renderEndpointsFields()}
          </div>
        )}
      </div>

      {/* Authorization Settings */}
      <div className="oauth-form__group">
        {renderGroupHeader('authorization', 'Authorization')}
        {expandedGroups.authorization && (
          <div className="oauth-form__group-content">
            {renderScopesSelector()}
            {renderAuthButton()}
          </div>
        )}
      </div>

      {/* Client Authentication Method */}
      <div className="oauth-form__group">
        {renderGroupHeader('authentication', 'Client Authentication')}
        {expandedGroups.authentication && (
          <div className="oauth-form__group-content">
            {renderAuthMethodSelector()}
          </div>
        )}
      </div>

      {/* Token Status */}
      <div className="oauth-form__group">
        {renderGroupHeader(
          'tokens',
          'Token Status',
          undefined,
          values.accessToken ? (
            <span className="oauth-form__badge oauth-form__badge--success">Active</span>
          ) : (
            <span className="oauth-form__badge">Not authenticated</span>
          )
        )}
        {expandedGroups.tokens && (
          <div className="oauth-form__group-content">
            {renderTokenStatus()}
          </div>
        )}
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="oauth-form__actions">
          <button
            type="submit"
            className="oauth-form__submit"
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
 * Hook for managing OAuth Auth Code credential form state
 */
export function useOAuthAuthCodeCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'authenticated' | 'expired' | 'error'>('none');

  const executor = useMemo(() => new OAuthAuthCodeHandshakeExecutor(), []);

  // Check auth status based on tokens
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
  };
}

export default OAuthAuthCodeCredentialFormFields;
