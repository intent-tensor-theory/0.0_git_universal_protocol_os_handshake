// ============================================
// PROTOCOL OS - OAUTH IMPLICIT CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.4.b
// Purpose: React component for OAuth 2.0 Implicit Grant configuration UI
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { OAuthImplicitHandshakeExecutor } from './1.3.4.a_fileOauthImplicitHandshakeExecutor';

/**
 * Legacy OAuth provider presets (supporting Implicit flow)
 */
export interface OAuthImplicitProviderPreset {
  id: string;
  name: string;
  icon: string;
  authorizationUrl: string;
  userInfoUrl?: string;
  defaultScopes: string[];
  scopeOptions: Array<{ value: string; label: string; description?: string }>;
  supportsIdToken: boolean;
  documentationUrl: string;
  deprecationNote?: string;
}

/**
 * Provider presets that still support Implicit flow
 */
export const OAUTH_IMPLICIT_PROVIDER_PRESETS: OAuthImplicitProviderPreset[] = [
  {
    id: 'google-legacy',
    name: 'Google (Legacy)',
    icon: 'google',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    defaultScopes: ['openid', 'email', 'profile'],
    scopeOptions: [
      { value: 'openid', label: 'OpenID', description: 'Basic identity' },
      { value: 'email', label: 'Email', description: 'View email address' },
      { value: 'profile', label: 'Profile', description: 'View basic profile' },
    ],
    supportsIdToken: true,
    documentationUrl: 'https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow',
    deprecationNote: 'Google recommends using PKCE instead of Implicit flow',
  },
  {
    id: 'microsoft-legacy',
    name: 'Microsoft (Legacy)',
    icon: 'microsoft',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    defaultScopes: ['openid', 'email', 'profile', 'User.Read'],
    scopeOptions: [
      { value: 'openid', label: 'openid', description: 'OpenID Connect' },
      { value: 'email', label: 'email', description: 'View email' },
      { value: 'profile', label: 'profile', description: 'View profile' },
      { value: 'User.Read', label: 'User.Read', description: 'Read user profile' },
    ],
    supportsIdToken: true,
    documentationUrl: 'https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow',
    deprecationNote: 'Microsoft discourages Implicit flow - use PKCE or Auth Code',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    userInfoUrl: 'https://graph.facebook.com/me',
    defaultScopes: ['public_profile', 'email'],
    scopeOptions: [
      { value: 'public_profile', label: 'Public Profile', description: 'Basic profile info' },
      { value: 'email', label: 'Email', description: 'Email address' },
    ],
    supportsIdToken: false,
    documentationUrl: 'https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow',
    deprecationNote: 'Facebook supports server-side flow with better security',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    authorizationUrl: 'https://api.instagram.com/oauth/authorize',
    defaultScopes: ['user_profile', 'user_media'],
    scopeOptions: [
      { value: 'user_profile', label: 'User Profile', description: 'Basic profile' },
      { value: 'user_media', label: 'User Media', description: 'Read user media' },
    ],
    supportsIdToken: false,
    documentationUrl: 'https://developers.facebook.com/docs/instagram-basic-display-api',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'spotify',
    authorizationUrl: 'https://accounts.spotify.com/authorize',
    userInfoUrl: 'https://api.spotify.com/v1/me',
    defaultScopes: ['user-read-private', 'user-read-email'],
    scopeOptions: [
      { value: 'user-read-private', label: 'Read Private', description: 'Read user profile' },
      { value: 'user-read-email', label: 'Read Email', description: 'Read email' },
      { value: 'playlist-read-private', label: 'Read Playlists', description: 'Read private playlists' },
      { value: 'user-library-read', label: 'Read Library', description: 'Read user library' },
    ],
    supportsIdToken: false,
    documentationUrl: 'https://developer.spotify.com/documentation/general/guides/authorization/implicit-grant/',
    deprecationNote: 'Spotify recommends PKCE for better security',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: 'twitch',
    authorizationUrl: 'https://id.twitch.tv/oauth2/authorize',
    userInfoUrl: 'https://api.twitch.tv/helix/users',
    defaultScopes: ['user:read:email'],
    scopeOptions: [
      { value: 'user:read:email', label: 'Read Email', description: 'View email address' },
      { value: 'channel:read:subscriptions', label: 'Read Subscriptions', description: 'View channel subscriptions' },
    ],
    supportsIdToken: true,
    documentationUrl: 'https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#implicit-grant-flow',
    deprecationNote: 'Twitch supports PKCE flow as recommended alternative',
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    icon: 'settings',
    authorizationUrl: '',
    defaultScopes: [],
    scopeOptions: [],
    supportsIdToken: false,
    documentationUrl: '',
  },
];

/**
 * Props for the credential form
 */
export interface OAuthImplicitCredentialFormFieldsProps {
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
  
  /** Whether to show migration recommendation */
  showMigrationWarning?: boolean;
  
  /** Callback to switch to PKCE */
  onSwitchToPkce?: () => void;
  
  /** Custom class name */
  className?: string;
}

/**
 * OAuth Implicit Credential Form Fields Component
 */
export const OAuthImplicitCredentialFormFields: React.FC<OAuthImplicitCredentialFormFieldsProps> = ({
  values,
  onChange,
  onStartAuth,
  onSubmit,
  isLoading = false,
  disabled = false,
  errors = {},
  authStatus = 'none',
  showMigrationWarning = true,
  onSwitchToPkce,
  className = '',
}) => {
  // State for selected provider preset
  const [selectedProvider, setSelectedProvider] = useState<string>('custom');
  
  // State for collapsible sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    deprecation: true,
    provider: true,
    credentials: true,
    endpoints: true,
    authorization: true,
    tokens: false,
    advanced: false,
  });

  // State for dismissing deprecation warning
  const [deprecationDismissed, setDeprecationDismissed] = useState(false);

  // Get executor for field definitions
  const executor = useMemo(() => new OAuthImplicitHandshakeExecutor(), []);

  // Handle provider selection
  const handleProviderSelect = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    
    const preset = OAUTH_IMPLICIT_PROVIDER_PRESETS.find((p) => p.id === providerId);
    if (preset && preset.id !== 'custom') {
      onChange({
        ...values,
        authorizationUrl: preset.authorizationUrl,
        userInfoUrl: preset.userInfoUrl || '',
        scopes: preset.defaultScopes.join(' '),
        responseType: preset.supportsIdToken ? 'token id_token' : 'token',
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
    OAUTH_IMPLICIT_PROVIDER_PRESETS.find((p) => p.id === selectedProvider),
    [selectedProvider]
  );

  // Parse current scopes
  const currentScopes = useMemo(() => 
    ((values.scopes as string) || '').split(/[\s,]+/).filter(Boolean),
    [values.scopes]
  );

  // Get migration recommendation
  const migrationInfo = useMemo(() => OAuthImplicitHandshakeExecutor.shouldMigrateToPkce(), []);

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

  // Render deprecation warning
  const renderDeprecationWarning = () => {
    if (deprecationDismissed && !showMigrationWarning) {
      return null;
    }

    return (
      <div className="oauth-form__deprecation-warning">
        <div className="oauth-form__deprecation-header">
          <span className="oauth-form__deprecation-icon">⚠️</span>
          <strong>Deprecation Warning</strong>
          <button
            type="button"
            className="oauth-form__deprecation-dismiss"
            onClick={() => setDeprecationDismissed(true)}
            aria-label="Dismiss warning"
          >
            ×
          </button>
        </div>
        
        <div className="oauth-form__deprecation-body">
          <p>
            <strong>The OAuth 2.0 Implicit Grant is deprecated</strong> as of OAuth 2.0 Security
            Best Current Practice and will be removed in OAuth 2.1.
          </p>
          
          <div className="oauth-form__deprecation-reasons">
            <p><strong>Security Concerns:</strong></p>
            <ul>
              {migrationInfo.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>

          {onSwitchToPkce && (
            <button
              type="button"
              className="oauth-form__switch-pkce-button"
              onClick={onSwitchToPkce}
            >
              🔐 Switch to OAuth PKCE (Recommended)
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render provider selector
  const renderProviderSelector = () => (
    <div className="oauth-form__providers">
      <label className="oauth-form__label">OAuth Provider (Legacy Support)</label>
      <div className="oauth-form__provider-grid">
        {OAUTH_IMPLICIT_PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`oauth-form__provider-button ${
              selectedProvider === preset.id ? 'oauth-form__provider-button--selected' : ''
            } ${preset.deprecationNote ? 'oauth-form__provider-button--deprecated' : ''}`}
            onClick={() => handleProviderSelect(preset.id)}
            disabled={disabled || isLoading}
            title={preset.deprecationNote || preset.name}
          >
            <span className="oauth-form__provider-icon">{preset.icon}</span>
            <span className="oauth-form__provider-name">{preset.name}</span>
            {preset.deprecationNote && (
              <span className="oauth-form__provider-deprecated-badge">⚠️</span>
            )}
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
          View {currentPreset.name} Documentation →
        </a>
      )}
      {currentPreset?.deprecationNote && (
        <div className="oauth-form__provider-deprecation-note">
          ⚠️ {currentPreset.deprecationNote}
        </div>
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
          No client_secret needed for Implicit flow (public client)
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
          ⚠️ Token will be returned in URL fragment (#access_token=...)
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
    </div>
  );

  // Render authorization settings
  const renderAuthorizationSettings = () => (
    <div className="oauth-form__authorization">
      <div className="oauth-form__field">
        <label htmlFor="responseType" className="oauth-form__label">
          Response Type
        </label>
        <select
          id="responseType"
          className="oauth-form__select"
          value={(values.responseType as string) || 'token'}
          onChange={(e) => handleFieldChange('responseType', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="token">token (Access Token Only)</option>
          <option value="token id_token">token id_token (Access + ID Token)</option>
        </select>
        <span className="oauth-form__hint">
          Use "token id_token" for OpenID Connect providers
        </span>
      </div>

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
    const hasIdToken = !!(values.idToken);
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
          <span className="oauth-form__token-badge oauth-form__token-badge--unavailable">
            ✗ Not Available (Implicit flow)
          </span>
        </div>
        
        <div className="oauth-form__token-row">
          <span className="oauth-form__token-label">ID Token:</span>
          <span className={`oauth-form__token-badge ${hasIdToken ? 'oauth-form__token-badge--present' : 'oauth-form__token-badge--missing'}`}>
            {hasIdToken ? '✓ Present' : '✗ Not requested'}
          </span>
        </div>
        
        <div className="oauth-form__token-row">
          <span className="oauth-form__token-label">Expiration:</span>
          <span className={`oauth-form__token-badge ${isExpired ? 'oauth-form__token-badge--expired' : ''}`}>
            {expirationText}
          </span>
        </div>

        {isExpired && (
          <div className="oauth-form__token-warning">
            ⚠️ Token expired. Must re-authenticate (no refresh available in Implicit flow).
          </div>
        )}

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
    const isConfigured = values.clientId && values.authorizationUrl && 
                         values.redirectUri && values.scopes;
    
    return (
      <div className="oauth-form__auth-section">
        {authStatus === 'authenticated' ? (
          <div className="oauth-form__auth-status oauth-form__auth-status--success">
            <span className="oauth-form__auth-icon">✓</span>
            <span>Authenticated (no refresh available)</span>
          </div>
        ) : authStatus === 'expired' ? (
          <div className="oauth-form__auth-status oauth-form__auth-status--warning">
            <span className="oauth-form__auth-icon">⚠</span>
            <span>Token expired - must re-authenticate</span>
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
          className="oauth-form__auth-button oauth-form__auth-button--deprecated"
          onClick={onStartAuth}
          disabled={disabled || isLoading || !isConfigured || authStatus === 'pending'}
        >
          {authStatus === 'pending' ? (
            'Waiting for Authorization...'
          ) : authStatus === 'authenticated' ? (
            'Re-authenticate (Required when expired)'
          ) : (
            '⚠️ Start Implicit Flow (Deprecated)'
          )}
        </button>

        {!isConfigured && (
          <span className="oauth-form__hint">
            Complete all required fields to enable authorization
          </span>
        )}

        <div className="oauth-form__implicit-warning">
          <strong>⚠️ Security Notice:</strong> Token will be visible in URL.
          Clear browser history after authentication.
        </div>
      </div>
    );
  };

  return (
    <form
      className={`oauth-form oauth-form--implicit oauth-form--deprecated ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Deprecation Warning */}
      {renderDeprecationWarning()}

      {/* Provider Selection */}
      <div className="oauth-form__group">
        {renderGroupHeader('provider', 'Select Provider (Legacy)')}
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
            {renderAuthorizationSettings()}
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
            <span className="oauth-form__badge oauth-form__badge--warning">Active (No Refresh)</span>
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
 * Hook for managing OAuth Implicit credential form state
 */
export function useOAuthImplicitCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'authenticated' | 'expired' | 'error'>('none');

  const executor = useMemo(() => new OAuthImplicitHandshakeExecutor(), []);

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

  /**
   * Parse token from URL fragment
   */
  const parseFragmentToken = useCallback((fragment: string) => {
    const params = OAuthImplicitHandshakeExecutor.parseUrlFragment(fragment);
    
    if (params.error) {
      setAuthStatus('error');
      setErrors({ auth: params.error_description || params.error });
      return null;
    }

    if (params.access_token) {
      const newValues = {
        ...values,
        accessToken: params.access_token,
        tokenExpiresAt: params.expires_in 
          ? Math.floor(Date.now() / 1000) + parseInt(params.expires_in, 10)
          : undefined,
        idToken: params.id_token,
      };
      setValues(newValues);
      setAuthStatus('authenticated');
      
      // Clear URL fragment for security
      OAuthImplicitHandshakeExecutor.clearUrlFragment();
      
      return params.access_token;
    }

    return null;
  }, [values]);

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
    parseFragmentToken,
  };
}

export default OAuthImplicitCredentialFormFields;
