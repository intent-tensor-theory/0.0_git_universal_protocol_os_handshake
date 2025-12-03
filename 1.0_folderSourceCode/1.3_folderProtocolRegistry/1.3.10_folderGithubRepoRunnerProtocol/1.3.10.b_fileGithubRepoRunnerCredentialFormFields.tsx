// ============================================
// PROTOCOL OS - GITHUB REPO RUNNER CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.10.b
// Purpose: React component for GitHub configuration UI
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { 
  GitHubRepoRunnerHandshakeExecutor, 
  type GitHubAuthMethod,
  type GitHubRepository,
  type GitHubRunner,
  GITHUB_SCOPES,
} from './1.3.10.a_fileGithubRepoRunnerHandshakeExecutor';

/**
 * GitHub use case preset
 */
export interface GitHubUseCasePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  authMethod: GitHubAuthMethod;
  recommendedScopes?: string[];
  notes?: string;
}

/**
 * Use case presets for common GitHub scenarios
 */
export const GITHUB_USE_CASE_PRESETS: GitHubUseCasePreset[] = [
  {
    id: 'repo-access',
    name: 'Repository Access',
    icon: 'folder-git',
    description: 'Read/write access to repositories',
    authMethod: 'pat',
    recommendedScopes: ['repo'],
    notes: 'Use a PAT with repo scope for full repository access.',
  },
  {
    id: 'actions-workflows',
    name: 'GitHub Actions',
    icon: 'play-circle',
    description: 'Trigger and manage workflows',
    authMethod: 'pat',
    recommendedScopes: ['repo', 'workflow'],
    notes: 'Requires repo and workflow scopes to trigger workflows.',
  },
  {
    id: 'self-hosted-runner',
    name: 'Self-Hosted Runner',
    icon: 'server',
    description: 'Register self-hosted runners',
    authMethod: 'pat',
    recommendedScopes: ['admin:org', 'repo'],
    notes: 'Requires admin:org for org runners or repo for repo runners.',
  },
  {
    id: 'github-app',
    name: 'GitHub App Integration',
    icon: 'puzzle',
    description: 'Automated app authentication',
    authMethod: 'github-app',
    notes: 'Best for automation. App permissions are configured in GitHub.',
  },
  {
    id: 'ci-cd',
    name: 'CI/CD Pipeline',
    icon: 'git-branch',
    description: 'Full CI/CD automation',
    authMethod: 'github-app',
    notes: 'GitHub Apps provide fine-grained permissions for CI/CD.',
  },
  {
    id: 'packages',
    name: 'GitHub Packages',
    icon: 'package',
    description: 'Package registry access',
    authMethod: 'pat',
    recommendedScopes: ['read:packages', 'write:packages'],
    notes: 'For publishing and downloading packages.',
  },
  {
    id: 'read-only',
    name: 'Read-Only Access',
    icon: 'eye',
    description: 'Read public/private repos',
    authMethod: 'fine-grained-pat',
    notes: 'Fine-grained PATs allow minimal read-only permissions.',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Server',
    icon: 'building',
    description: 'GitHub Enterprise Server',
    authMethod: 'pat',
    notes: 'Configure Enterprise Server URL in advanced settings.',
  },
];

/**
 * Props for the credential form
 */
export interface GitHubCredentialFormFieldsProps {
  /** Current credential values */
  values: Record<string, unknown>;
  
  /** Callback when values change */
  onChange: (values: Record<string, unknown>) => void;
  
  /** Callback to test connection */
  onTestConnection?: () => void;
  
  /** Callback when form is submitted */
  onSubmit?: () => void;
  
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  
  /** Whether the form is disabled */
  disabled?: boolean;
  
  /** Validation errors from parent */
  errors?: Record<string, string>;
  
  /** Current connection status */
  connectionStatus?: 'none' | 'testing' | 'connected' | 'error';
  
  /** Authenticated user info */
  userInfo?: { login: string; name: string };
  
  /** Repository info */
  repositoryInfo?: GitHubRepository;
  
  /** Custom class name */
  className?: string;
}

/**
 * GitHub Credential Form Fields Component
 */
export const GitHubCredentialFormFields: React.FC<GitHubCredentialFormFieldsProps> = ({
  values,
  onChange,
  onTestConnection,
  onSubmit,
  isLoading = false,
  disabled = false,
  errors = {},
  connectionStatus = 'none',
  userInfo,
  repositoryInfo,
  className = '',
}) => {
  // State for selected use case
  const [selectedUseCase, setSelectedUseCase] = useState<string>('repo-access');
  
  // State for collapsible sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    useCase: true,
    authentication: true,
    target: false,
    scopes: false,
    advanced: false,
  });

  // State for showing/hiding secrets
  const [showToken, setShowToken] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Get executor for utilities
  const executor = useMemo(() => new GitHubRepoRunnerHandshakeExecutor(), []);

  // Get current use case preset
  const currentPreset = useMemo(() => 
    GITHUB_USE_CASE_PRESETS.find((p) => p.id === selectedUseCase),
    [selectedUseCase]
  );

  // Handle use case selection
  const handleUseCaseSelect = useCallback((useCaseId: string) => {
    setSelectedUseCase(useCaseId);
    
    const preset = GITHUB_USE_CASE_PRESETS.find((p) => p.id === useCaseId);
    if (preset) {
      onChange({
        ...values,
        authMethod: preset.authMethod,
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

  // Get auth method
  const authMethod = values.authMethod as GitHubAuthMethod || 'pat';

  // Detect token type
  const tokenType = useMemo(() => {
    const token = values.token as string;
    if (!token) return null;
    return GitHubRepoRunnerHandshakeExecutor.getTokenType(token);
  }, [values.token]);

  // Render group header
  const renderGroupHeader = (
    groupId: string,
    label: string,
    description?: string,
    badge?: React.ReactNode
  ) => (
    <button
      type="button"
      className="github-form__group-header"
      onClick={() => toggleGroup(groupId)}
      aria-expanded={expandedGroups[groupId]}
    >
      <span className="github-form__group-icon">
        {expandedGroups[groupId] ? '▼' : '▶'}
      </span>
      <span className="github-form__group-label">{label}</span>
      {badge}
      {description && (
        <span className="github-form__group-description">{description}</span>
      )}
    </button>
  );

  // Render use case selector
  const renderUseCaseSelector = () => (
    <div className="github-form__use-cases">
      <label className="github-form__label">What do you want to do?</label>
      <div className="github-form__use-case-grid">
        {GITHUB_USE_CASE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`github-form__use-case-button ${
              selectedUseCase === preset.id ? 'github-form__use-case-button--selected' : ''
            }`}
            onClick={() => handleUseCaseSelect(preset.id)}
            disabled={disabled || isLoading}
          >
            <span className="github-form__use-case-icon">{preset.icon}</span>
            <span className="github-form__use-case-name">{preset.name}</span>
            <span className="github-form__use-case-desc">{preset.description}</span>
          </button>
        ))}
      </div>
      {currentPreset?.notes && (
        <div className="github-form__use-case-notes">
          💡 {currentPreset.notes}
        </div>
      )}
    </div>
  );

  // Render authentication fields
  const renderAuthenticationFields = () => (
    <div className="github-form__authentication">
      <div className="github-form__field">
        <label htmlFor="authMethod" className="github-form__label">
          Authentication Method
        </label>
        <select
          id="authMethod"
          className="github-form__select"
          value={authMethod}
          onChange={(e) => handleFieldChange('authMethod', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="pat">Personal Access Token (Classic)</option>
          <option value="fine-grained-pat">Fine-Grained PAT</option>
          <option value="github-app">GitHub App</option>
          <option value="oauth-token">OAuth Token</option>
          <option value="runner-token">Runner Registration Token</option>
        </select>
      </div>

      {/* PAT / OAuth Token */}
      {(authMethod === 'pat' || authMethod === 'fine-grained-pat' || authMethod === 'oauth-token') && (
        <div className="github-form__field">
          <label htmlFor="token" className="github-form__label">
            Access Token
            <span className="github-form__required">*</span>
          </label>
          <div className="github-form__secret-input">
            <input
              id="token"
              type={showToken ? 'text' : 'password'}
              className={`github-form__input ${errors.token ? 'github-form__input--error' : ''}`}
              value={(values.token as string) || ''}
              onChange={(e) => handleFieldChange('token', e.target.value)}
              placeholder={authMethod === 'fine-grained-pat' ? 'github_pat_xxxx' : 'ghp_xxxxxxxxxxxxxxxxxxxx'}
              disabled={disabled || isLoading}
            />
            <button
              type="button"
              className="github-form__secret-toggle"
              onClick={() => setShowToken(!showToken)}
              aria-label={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.token && (
            <span className="github-form__error">{errors.token}</span>
          )}
          {tokenType && (
            <span className="github-form__token-type">
              Detected: {tokenType === 'classic-pat' ? 'Classic PAT' : 
                        tokenType === 'fine-grained-pat' ? 'Fine-Grained PAT' :
                        tokenType === 'oauth' ? 'OAuth Token' :
                        tokenType === 'installation' ? 'Installation Token' : 'Unknown'}
            </span>
          )}
          <div className="github-form__token-help">
            <a 
              href="https://github.com/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Generate new token →
            </a>
          </div>
        </div>
      )}

      {/* GitHub App */}
      {authMethod === 'github-app' && (
        <>
          <div className="github-form__field">
            <label htmlFor="appId" className="github-form__label">
              App ID
              <span className="github-form__required">*</span>
            </label>
            <input
              id="appId"
              type="text"
              className={`github-form__input ${errors.appId ? 'github-form__input--error' : ''}`}
              value={(values.appId as string) || ''}
              onChange={(e) => handleFieldChange('appId', e.target.value)}
              placeholder="123456"
              disabled={disabled || isLoading}
            />
            {errors.appId && (
              <span className="github-form__error">{errors.appId}</span>
            )}
          </div>

          <div className="github-form__field">
            <label htmlFor="installationId" className="github-form__label">
              Installation ID
              <span className="github-form__required">*</span>
            </label>
            <input
              id="installationId"
              type="text"
              className={`github-form__input ${errors.installationId ? 'github-form__input--error' : ''}`}
              value={(values.installationId as string) || ''}
              onChange={(e) => handleFieldChange('installationId', e.target.value)}
              placeholder="12345678"
              disabled={disabled || isLoading}
            />
            {errors.installationId && (
              <span className="github-form__error">{errors.installationId}</span>
            )}
            <span className="github-form__hint">
              Found in your app's installation settings
            </span>
          </div>

          <div className="github-form__field">
            <label htmlFor="privateKey" className="github-form__label">
              Private Key (PEM)
              <span className="github-form__required">*</span>
            </label>
            <div className="github-form__secret-input github-form__secret-input--textarea">
              <textarea
                id="privateKey"
                className={`github-form__textarea github-form__textarea--code ${
                  errors.privateKey ? 'github-form__textarea--error' : ''
                }`}
                value={(values.privateKey as string) || ''}
                onChange={(e) => handleFieldChange('privateKey', e.target.value)}
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                disabled={disabled || isLoading}
                rows={5}
                style={{ fontFamily: showPrivateKey ? 'monospace' : 'sans-serif' }}
              />
              <button
                type="button"
                className="github-form__secret-toggle"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                aria-label={showPrivateKey ? 'Hide key' : 'Show key'}
              >
                {showPrivateKey ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.privateKey && (
              <span className="github-form__error">{errors.privateKey}</span>
            )}
          </div>
        </>
      )}

      {/* Runner Token */}
      {authMethod === 'runner-token' && (
        <div className="github-form__field">
          <label htmlFor="runnerToken" className="github-form__label">
            Runner Registration Token
            <span className="github-form__required">*</span>
          </label>
          <div className="github-form__secret-input">
            <input
              id="runnerToken"
              type={showToken ? 'text' : 'password'}
              className={`github-form__input ${errors.runnerToken ? 'github-form__input--error' : ''}`}
              value={(values.runnerToken as string) || ''}
              onChange={(e) => handleFieldChange('runnerToken', e.target.value)}
              placeholder="AXXXXXXXXXXXXXXXXXX"
              disabled={disabled || isLoading}
            />
            <button
              type="button"
              className="github-form__secret-toggle"
              onClick={() => setShowToken(!showToken)}
              aria-label={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.runnerToken && (
            <span className="github-form__error">{errors.runnerToken}</span>
          )}
          <span className="github-form__hint">
            Get from Settings → Actions → Runners → New self-hosted runner
          </span>
        </div>
      )}

      {/* Connection status */}
      <div className="github-form__connection-status">
        {connectionStatus === 'connected' && userInfo ? (
          <div className="github-form__status github-form__status--success">
            <span className="github-form__status-icon">✓</span>
            <span>Authenticated as <strong>@{userInfo.login}</strong></span>
          </div>
        ) : connectionStatus === 'testing' ? (
          <div className="github-form__status github-form__status--pending">
            <span className="github-form__status-icon">⏳</span>
            <span>Authenticating...</span>
          </div>
        ) : connectionStatus === 'error' ? (
          <div className="github-form__status github-form__status--error">
            <span className="github-form__status-icon">✗</span>
            <span>Authentication failed</span>
          </div>
        ) : null}

        {onTestConnection && (
          <button
            type="button"
            className="github-form__test-button"
            onClick={onTestConnection}
            disabled={disabled || isLoading || connectionStatus === 'testing'}
          >
            {connectionStatus === 'testing' ? 'Testing...' : '🔌 Test Connection'}
          </button>
        )}
      </div>
    </div>
  );

  // Render target fields
  const renderTargetFields = () => (
    <div className="github-form__target">
      <div className="github-form__field">
        <label htmlFor="repository" className="github-form__label">
          Repository
          <span className="github-form__optional">(Optional)</span>
        </label>
        <input
          id="repository"
          type="text"
          className="github-form__input"
          value={(values.repository as string) || ''}
          onChange={(e) => handleFieldChange('repository', e.target.value)}
          placeholder="owner/repository"
          disabled={disabled || isLoading}
        />
        <span className="github-form__hint">
          Format: owner/repo (e.g., octocat/Hello-World)
        </span>
      </div>

      <div className="github-form__field">
        <label htmlFor="organization" className="github-form__label">
          Organization
          <span className="github-form__optional">(Optional)</span>
        </label>
        <input
          id="organization"
          type="text"
          className="github-form__input"
          value={(values.organization as string) || ''}
          onChange={(e) => handleFieldChange('organization', e.target.value)}
          placeholder="my-organization"
          disabled={disabled || isLoading}
        />
      </div>

      {repositoryInfo && (
        <div className="github-form__repo-info">
          <div className="github-form__repo-header">
            <span className="github-form__repo-icon">📁</span>
            <span className="github-form__repo-name">{repositoryInfo.fullName}</span>
            {repositoryInfo.private && (
              <span className="github-form__badge github-form__badge--private">Private</span>
            )}
          </div>
          <div className="github-form__repo-details">
            <div>Branch: {repositoryInfo.defaultBranch}</div>
            <div>Clone: {repositoryInfo.cloneUrl}</div>
          </div>
        </div>
      )}
    </div>
  );

  // Render scope reference
  const renderScopeReference = () => (
    <div className="github-form__scopes">
      <p className="github-form__scope-intro">
        {authMethod === 'fine-grained-pat' 
          ? 'Fine-grained PATs have repository-level permissions configured in GitHub.'
          : 'Classic PATs use OAuth scopes. Select scopes when creating your token.'}
      </p>

      {authMethod === 'pat' && (
        <div className="github-form__scope-categories">
          {Object.entries(GITHUB_SCOPES).map(([category, scopes]) => (
            <div key={category} className="github-form__scope-category">
              <h4 className="github-form__scope-category-name">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h4>
              <div className="github-form__scope-list">
                {Object.entries(scopes).map(([scope, description]) => (
                  <div key={scope} className="github-form__scope-item">
                    <code className="github-form__scope-name">{scope}</code>
                    <span className="github-form__scope-desc">{description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {currentPreset?.recommendedScopes && (
        <div className="github-form__recommended-scopes">
          <strong>Recommended for {currentPreset.name}:</strong>
          <div className="github-form__scope-tags">
            {currentPreset.recommendedScopes.map((scope) => (
              <span key={scope} className="github-form__scope-tag">{scope}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render advanced settings
  const renderAdvancedSettings = () => (
    <div className="github-form__advanced">
      <div className="github-form__field">
        <label htmlFor="enterpriseUrl" className="github-form__label">
          Enterprise Server URL
          <span className="github-form__optional">(Optional)</span>
        </label>
        <input
          id="enterpriseUrl"
          type="url"
          className="github-form__input"
          value={(values.enterpriseUrl as string) || ''}
          onChange={(e) => handleFieldChange('enterpriseUrl', e.target.value)}
          placeholder="https://github.mycompany.com"
          disabled={disabled || isLoading}
        />
        <span className="github-form__hint">
          Leave empty for github.com
        </span>
      </div>

      <div className="github-form__field">
        <label htmlFor="apiVersion" className="github-form__label">
          Preferred API
        </label>
        <select
          id="apiVersion"
          className="github-form__select"
          value={(values.apiVersion as string) || 'rest'}
          onChange={(e) => handleFieldChange('apiVersion', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="rest">REST API v3</option>
          <option value="graphql">GraphQL API v4</option>
        </select>
      </div>

      <div className="github-form__field">
        <label htmlFor="timeout" className="github-form__label">
          Request Timeout (ms)
        </label>
        <input
          id="timeout"
          type="number"
          className="github-form__input"
          value={(values.timeout as number) || 30000}
          onChange={(e) => handleFieldChange('timeout', parseInt(e.target.value, 10))}
          placeholder="30000"
          disabled={disabled || isLoading}
          min={1000}
        />
      </div>
    </div>
  );

  return (
    <form
      className={`github-form ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Use Case Selection */}
      <div className="github-form__group">
        {renderGroupHeader('useCase', 'Use Case')}
        {expandedGroups.useCase && (
          <div className="github-form__group-content">
            {renderUseCaseSelector()}
          </div>
        )}
      </div>

      {/* Authentication */}
      <div className="github-form__group">
        {renderGroupHeader('authentication', 'Authentication', undefined,
          connectionStatus === 'connected' ? (
            <span className="github-form__badge github-form__badge--success">✓ Connected</span>
          ) : (
            <span className="github-form__badge">{authMethod}</span>
          )
        )}
        {expandedGroups.authentication && (
          <div className="github-form__group-content">
            {renderAuthenticationFields()}
          </div>
        )}
      </div>

      {/* Target */}
      <div className="github-form__group">
        {renderGroupHeader('target', 'Repository / Organization')}
        {expandedGroups.target && (
          <div className="github-form__group-content">
            {renderTargetFields()}
          </div>
        )}
      </div>

      {/* Scopes Reference */}
      {authMethod === 'pat' && (
        <div className="github-form__group">
          {renderGroupHeader('scopes', 'Scope Reference')}
          {expandedGroups.scopes && (
            <div className="github-form__group-content">
              {renderScopeReference()}
            </div>
          )}
        </div>
      )}

      {/* Advanced */}
      <div className="github-form__group">
        {renderGroupHeader('advanced', 'Advanced Settings')}
        {expandedGroups.advanced && (
          <div className="github-form__group-content">
            {renderAdvancedSettings()}
          </div>
        )}
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="github-form__actions">
          <button
            type="submit"
            className="github-form__submit"
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
 * Hook for managing GitHub credential form state
 */
export function useGitHubCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'testing' | 'connected' | 'error'>('none');
  const [userInfo, setUserInfo] = useState<{ login: string; name: string } | undefined>();
  const [repositoryInfo, setRepositoryInfo] = useState<GitHubRepository | undefined>();

  const executor = useMemo(() => new GitHubRepoRunnerHandshakeExecutor(), []);

  const handleChange = useCallback((newValues: Record<string, unknown>) => {
    setValues(newValues);
    setIsDirty(true);
    setConnectionStatus('none');
    setUserInfo(undefined);
    
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
    setConnectionStatus('none');
    setUserInfo(undefined);
    setRepositoryInfo(undefined);
  }, []);

  /**
   * Test the GitHub connection
   */
  const testConnection = useCallback(async () => {
    setConnectionStatus('testing');
    
    try {
      const authResult = await executor.authenticate(values);
      
      if (authResult.type === 'complete') {
        setConnectionStatus('connected');
        if (authResult.data?.user) {
          setUserInfo(authResult.data.user as { login: string; name: string });
        }

        // Try to get repository info if specified
        if (values.repository) {
          const parsed = GitHubRepoRunnerHandshakeExecutor.parseRepository(values.repository as string);
          if (parsed) {
            const repoResult = await executor.getRepository(
              values as any,
              parsed.owner,
              parsed.repo
            );
            if (repoResult.success) {
              setRepositoryInfo(repoResult.repository);
            }
          }
        }

        return { success: true };
      } else {
        setConnectionStatus('error');
        return { success: false, error: authResult.error };
      }
    } catch (error) {
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [values, executor]);

  return {
    values,
    errors,
    isDirty,
    connectionStatus,
    userInfo,
    repositoryInfo,
    handleChange,
    validate,
    reset,
    setErrors,
    testConnection,
  };
}

export default GitHubCredentialFormFields;
