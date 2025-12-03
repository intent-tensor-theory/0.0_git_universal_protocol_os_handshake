// ============================================
// PROTOCOL OS - OAUTH PKCE CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.2.b
// Purpose: React component for OAuth 2.0 + PKCE configuration UI
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { OAuthPkceHandshakeExecutor } from './1.3.2.a_fileOauthPkceHandshakeExecutor';

/**
 * Common OAuth providers with pre-configured endpoints
 */
export interface OAuthProviderPreset {
  id: string;
  name: string;
  icon: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
  revocationUrl?: string;
  defaultScopes: string[];
  scopeOptions: Array<{ value: string; label: string; description?: string }>;
  documentationUrl: string;
}

/**
 * Pre-configured OAuth provider presets
 */
export const OAUTH_PROVIDER_PRESETS: OAuthProviderPreset[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'google',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    revocationUrl: 'https://oauth2.googleapis.com/revoke',
    defaultScopes: ['openid', 'email', 'profile'],
    scopeOptions: [
      { value: 'openid', label: 'OpenID', description: 'Basic identity' },
      { value: 'email', label: 'Email', description: 'View email address' },
      { value: 'profile', label: 'Profile', description: 'View basic profile' },
      { value: 'https://www.googleapis.com/auth/drive.readonly', label: 'Drive (Read)', description: 'Read Google Drive files' },
      { value: 'https://www.googleapis.com/auth/calendar.readonly', label: 'Calendar (Read)', description: 'Read calendar events' },
      { value: 'https://www.googleapis.com/auth/gmail.readonly', label: 'Gmail (Read)', description: 'Read Gmail messages' },
    ],
    documentationUrl: 'https://developers.google.com/identity/protocols/oauth2',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    icon: 'microsoft',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    defaultScopes: ['openid', 'email', 'profile', 'User.Read'],
    scopeOptions: [
      { value: 'openid', label: 'OpenID', description: 'Basic identity' },
      { value: 'email', label: 'Email', description: 'View email address' },
      { value: 'profile', label: 'Profile', description: 'View basic profile' },
      { value: 'User.Read', label: 'User.Read', description: 'Read user profile' },
      { value: 'Mail.Read', label: 'Mail.Read', description: 'Read mail' },
      { value: 'Calendars.Read', label: 'Calendars.Read', description: 'Read calendars' },
      { value: 'Files.Read', label: 'Files.Read', description: 'Read OneDrive files' },
    ],
    documentationUrl: 'https://docs.microsoft.com/en-us/azure/active-directory/develop/',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    defaultScopes: ['read:user', 'user:email'],
    scopeOptions: [
      { value: 'read:user', label: 'read:user', description: 'Read user profile' },
      { value: 'user:email', label: 'user:email', description: 'Read email addresses' },
      { value: 'repo', label: 'repo', description: 'Full repository access' },
      { value: 'public_repo', label: 'public_repo', description: 'Public repositories only' },
      { value: 'gist', label: 'gist', description: 'Create gists' },
      { value: 'read:org', label: 'read:org', description: 'Read organization membership' },
    ],
    documentationUrl: 'https://docs.github.com/en/developers/apps/building-oauth-apps',
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: 'slack',
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    userInfoUrl: 'https://slack.com/api/users.identity',
    defaultScopes: ['openid', 'email', 'profile'],
    scopeOptions: [
      { value: 'openid', label: 'openid', description: 'OpenID Connect' },
      { value: 'email', label: 'email', description: 'View email' },
      { value: 'profile', label: 'profile', description: 'View profile' },
      { value: 'channels:read', label: 'channels:read', description: 'Read channels' },
      { value: 'chat:write', label: 'chat:write', description: 'Send messages' },
      { value: 'users:read', label: 'users:read', description: 'Read users' },
    ],
    documentationUrl: 'https://api.slack.com/authentication/oauth-v2',
  },
  {
    id: 'auth0',
    name: 'Auth0',
    icon: 'auth0',
    authorizationUrl: 'https://{domain}/authorize',
    tokenUrl: 'https://{domain}/oauth/token',
    userInfoUrl: 'https://{domain}/userinfo',
    revocationUrl: 'https://{domain}/oauth/revoke',
    defaultScopes: ['openid', 'email', 'profile'],
    scopeOptions: [
      { value: 'openid', label: 'openid', description: 'OpenID Connect' },
      { value: 'email', label: 'email', description: 'View email' },
      { value: 'profile', label: 'profile', description: 'View profile' },
      { value: 'offline_access', label: 'offline_access', description: 'Refresh tokens' },
    ],
    documentationUrl: 'https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-proof-key-for-code-exchange-pkce',
  },
  {
    id: 'okta',
    name: 'Okta',
    icon: 'okta',
    authorizationUrl: 'https://{domain}/oauth2/default/v1/authorize',
    tokenUrl: 'https://{domain}/oauth2/default/v1/token',
    userInfoUrl: 'https://{domain}/oauth2/default/v1/userinfo',
    revocationUrl: 'https://{domain}/oauth2/default/v1/revoke',
    defaultScopes: ['openid', 'email', 'profile'],
    scopeOptions: [
      { value: 'openid', label: 'openid', description: 'OpenID Connect' },
      { value: 'email', label: 'email', description: 'View email' },
      { value: 'profile', label: 'profile', description: 'View profile' },
      { value: 'offline_access', label: 'offline_access', description: 'Refresh tokens' },
    ],
    documentationUrl: 'https://developer.okta.com/docs/guides/implement-grant-type/authcodepkce/main/',
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    icon: 'settings',
    authorizationUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    defaultScopes: [],
    scopeOptions: [],
    documentationUrl: '',
  },
];

/**
 * Props for the credential form
 */
export interface OAuthPkceCredentialFormFieldsProps {
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
 * OAuth PKCE Credential Form Fields Component
 */
export const OAuthPkceCredentialFormFields: React.FC<OAuthPkceCredentialFormFieldsProps> = ({
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
    tokens: false,
    advanced: false,
  });

  // Get executor for field definitions
  const executor = useMemo(() => new OAuthPkceHandshakeExecutor(), []);

  // Detect selected provider from current values
  useEffect(() => {
    const authUrl = values.authorizationUrl as string;
    if (authUrl) {
      const matchingPreset = OAUTH_PROVIDER_PRESETS.find(
        (p) => p.id !== 'custom' && authUrl.includes(new URL(p.authorizationUrl.replace('{domain}', 'example.com')).hostname.split('.')[0])
      );
      if (matchingPreset) {
        setSelectedProvider(matchingPreset.id);
      }
    }
  }, [values.authorizationUrl]);

  // Handle provider selection
  const handleProviderSelect = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    
    const preset = OAUTH_PROVIDER_PRESETS.find((p) => p.id === providerId);
    if (preset && preset.id !== 'custom') {
      onChange({
        ...values,
        authorizationUrl: preset.authorizationUrl,
        tokenUrl: preset.tokenUrl,
        userInfoUrl: preset.userInfoUrl || '',
        revocationUrl: preset.revocationUrl || '',
        scopes: preset.defaultScopes.join(' '),
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
    OAUTH_PROVIDER_PRESETS.find((p) => p.id === selectedProvider),
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
        {OAUTH_PROVIDER_PRESETS.map((preset) => (
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
    </div>
  );

  // Render credentials fields
  const renderCredentialsFields = () => (
    <div className="oauth-form__credentials">
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
        <span className="oauth-form__hint">
          Found in your OAuth provider's application settings
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
        <span className="oauth-form__hint">
          Must match the URI registered with your OAuth provider
        </span>
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
        <span className="oauth-form__hint">
          Space-separated list of OAuth scopes to request
        </span>
      </div>

      {/* Audience field (for Auth0, etc.) */}
      <div className="oauth-form__field">
        <label htmlFor="audience" className="oauth-form__label">
          Audience
          <span className="oauth-form__optional">(Optional)</span>
        </label>
        <input
          id="audience"
          type="text"
          className="oauth-form__input"
          value={(values.audience as string) || ''}
          onChange={(e) => handleFieldChange('audience', e.target.value)}
          placeholder="https://api.yourapp.com"
          disabled={disabled || isLoading}
        />
        <span className="oauth-form__hint">
          Required by some providers (Auth0, Okta) for API access
        </span>
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
    const isConfigured = values.clientId && values.authorizationUrl && values.tokenUrl && values.redirectUri && values.scopes;
    
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
      className={`oauth-form ${className}`}
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
 * Hook for managing OAuth PKCE credential form state
 */
export function useOAuthPkceCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'authenticated' | 'expired' | 'error'>('none');

  const executor = useMemo(() => new OAuthPkceHandshakeExecutor(), []);

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

export default OAuthPkceCredentialFormFields;
