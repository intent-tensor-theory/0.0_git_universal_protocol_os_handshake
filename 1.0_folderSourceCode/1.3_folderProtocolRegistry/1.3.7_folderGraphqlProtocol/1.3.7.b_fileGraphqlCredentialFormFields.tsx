// ============================================
// PROTOCOL OS - GRAPHQL CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.7.b
// Purpose: React component for GraphQL configuration UI
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { 
  GraphQLHandshakeExecutor, 
  type GraphQLAuthMethod,
  type GraphQLResponse,
  type GraphQLError,
} from './1.3.7.a_fileGraphqlHandshakeExecutor';

/**
 * GraphQL provider preset configuration
 */
export interface GraphQLProviderPreset {
  id: string;
  name: string;
  icon: string;
  endpoint: string;
  authMethod: GraphQLAuthMethod;
  authHeaderName?: string;
  documentationUrl: string;
  notes?: string;
  sampleQuery?: string;
  requiresAuth: boolean;
}

/**
 * Provider presets for common GraphQL APIs
 */
export const GRAPHQL_PROVIDER_PRESETS: GraphQLProviderPreset[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    endpoint: 'https://api.github.com/graphql',
    authMethod: 'bearer',
    documentationUrl: 'https://docs.github.com/en/graphql',
    notes: 'Requires a Personal Access Token with appropriate scopes.',
    requiresAuth: true,
    sampleQuery: `query {
  viewer {
    login
    name
    repositories(first: 5) {
      nodes {
        name
        stargazerCount
      }
    }
  }
}`,
  },
  {
    id: 'shopify',
    name: 'Shopify Storefront',
    icon: 'shopify',
    endpoint: 'https://{store}.myshopify.com/api/2024-01/graphql.json',
    authMethod: 'custom-header',
    authHeaderName: 'X-Shopify-Storefront-Access-Token',
    documentationUrl: 'https://shopify.dev/docs/api/storefront',
    notes: 'Replace {store} with your shop name. Uses Storefront Access Token.',
    requiresAuth: true,
    sampleQuery: `query {
  shop {
    name
    primaryDomain {
      url
    }
  }
  products(first: 5) {
    edges {
      node {
        title
        handle
      }
    }
  }
}`,
  },
  {
    id: 'contentful',
    name: 'Contentful',
    icon: 'contentful',
    endpoint: 'https://graphql.contentful.com/content/v1/spaces/{spaceId}',
    authMethod: 'bearer',
    documentationUrl: 'https://www.contentful.com/developers/docs/references/graphql/',
    notes: 'Replace {spaceId} with your space ID. Uses Content Delivery API token.',
    requiresAuth: true,
    sampleQuery: `query {
  __schema {
    types {
      name
    }
  }
}`,
  },
  {
    id: 'hasura',
    name: 'Hasura',
    icon: 'hasura',
    endpoint: 'https://{project}.hasura.app/v1/graphql',
    authMethod: 'custom-header',
    authHeaderName: 'x-hasura-admin-secret',
    documentationUrl: 'https://hasura.io/docs/latest/graphql/core/api-reference/',
    notes: 'Replace {project} with your Hasura project name.',
    requiresAuth: true,
    sampleQuery: `query {
  __schema {
    queryType {
      name
    }
  }
}`,
  },
  {
    id: 'hygraph',
    name: 'Hygraph (GraphCMS)',
    icon: 'hygraph',
    endpoint: 'https://{region}.hygraph.com/v2/{projectId}/master',
    authMethod: 'bearer',
    documentationUrl: 'https://hygraph.com/docs/api-reference',
    notes: 'Replace {region} and {projectId} with your project details.',
    requiresAuth: true,
    sampleQuery: `query {
  __schema {
    types {
      name
      kind
    }
  }
}`,
  },
  {
    id: 'strapi',
    name: 'Strapi',
    icon: 'strapi',
    endpoint: 'http://localhost:1337/graphql',
    authMethod: 'bearer',
    documentationUrl: 'https://docs.strapi.io/dev-docs/plugins/graphql',
    notes: 'Default local Strapi endpoint. Change to your deployed URL.',
    requiresAuth: false,
    sampleQuery: `query {
  __schema {
    queryType {
      fields {
        name
      }
    }
  }
}`,
  },
  {
    id: 'fauna',
    name: 'Fauna',
    icon: 'fauna',
    endpoint: 'https://graphql.fauna.com/graphql',
    authMethod: 'bearer',
    documentationUrl: 'https://docs.fauna.com/fauna/current/api/graphql/',
    notes: 'Uses Fauna secret key as Bearer token.',
    requiresAuth: true,
    sampleQuery: `query {
  __schema {
    types {
      name
    }
  }
}`,
  },
  {
    id: 'apollo',
    name: 'Apollo Studio',
    icon: 'apollo',
    endpoint: 'https://{graph-id}.apollo.dev/',
    authMethod: 'api-key',
    authHeaderName: 'x-api-key',
    documentationUrl: 'https://www.apollographql.com/docs/studio/',
    notes: 'Replace {graph-id} with your Apollo graph ID.',
    requiresAuth: true,
    sampleQuery: `query {
  __typename
}`,
  },
  {
    id: 'countries',
    name: 'Countries API (Public)',
    icon: 'globe',
    endpoint: 'https://countries.trevorblades.com/graphql',
    authMethod: 'none',
    documentationUrl: 'https://github.com/trevorblades/countries',
    notes: 'Free public GraphQL API for country data. No authentication required.',
    requiresAuth: false,
    sampleQuery: `query {
  countries {
    code
    name
    capital
    currency
  }
}`,
  },
  {
    id: 'spacex',
    name: 'SpaceX API (Public)',
    icon: 'rocket',
    endpoint: 'https://spacex-production.up.railway.app/',
    authMethod: 'none',
    documentationUrl: 'https://studio.apollographql.com/public/SpaceX-pxxbxen/home',
    notes: 'Free public GraphQL API for SpaceX data.',
    requiresAuth: false,
    sampleQuery: `query {
  company {
    name
    founder
    founded
    employees
  }
  launches(limit: 5) {
    mission_name
    launch_date_utc
    rocket {
      rocket_name
    }
  }
}`,
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    icon: 'settings',
    endpoint: '',
    authMethod: 'bearer',
    documentationUrl: '',
    requiresAuth: true,
  },
];

/**
 * Props for the credential form
 */
export interface GraphQLCredentialFormFieldsProps {
  /** Current credential values */
  values: Record<string, unknown>;
  
  /** Callback when values change */
  onChange: (values: Record<string, unknown>) => void;
  
  /** Callback to test the connection */
  onTestConnection?: () => void;
  
  /** Callback to run a query */
  onRunQuery?: (query: string, variables?: Record<string, unknown>) => void;
  
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
  
  /** Last query result */
  lastQueryResult?: GraphQLResponse;
  
  /** Custom class name */
  className?: string;
}

/**
 * GraphQL Credential Form Fields Component
 */
export const GraphQLCredentialFormFields: React.FC<GraphQLCredentialFormFieldsProps> = ({
  values,
  onChange,
  onTestConnection,
  onRunQuery,
  onSubmit,
  isLoading = false,
  disabled = false,
  errors = {},
  connectionStatus = 'none',
  lastQueryResult,
  className = '',
}) => {
  // State for selected provider preset
  const [selectedProvider, setSelectedProvider] = useState<string>('custom');
  
  // State for collapsible sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    provider: true,
    endpoint: true,
    authentication: true,
    queryBuilder: false,
    advanced: false,
  });

  // State for showing/hiding token
  const [showToken, setShowToken] = useState(false);
  
  // State for query builder
  const [queryInput, setQueryInput] = useState('');
  const [variablesInput, setVariablesInput] = useState('{}');

  // Get executor for utilities
  const executor = useMemo(() => new GraphQLHandshakeExecutor(), []);

  // Detect provider from endpoint
  useEffect(() => {
    const endpoint = values.endpoint as string;
    if (!endpoint) return;

    for (const preset of GRAPHQL_PROVIDER_PRESETS) {
      if (preset.id !== 'custom') {
        // Simple detection based on endpoint patterns
        const pattern = preset.endpoint
          .replace(/\{[^}]+\}/g, '[^/]+')
          .replace(/\./g, '\\.');
        const regex = new RegExp(pattern.replace('https://', 'https?://'));
        if (regex.test(endpoint)) {
          setSelectedProvider(preset.id);
          return;
        }
      }
    }
  }, [values.endpoint]);

  // Handle provider selection
  const handleProviderSelect = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    
    const preset = GRAPHQL_PROVIDER_PRESETS.find((p) => p.id === providerId);
    if (preset && preset.id !== 'custom') {
      const newValues: Record<string, unknown> = {
        ...values,
        endpoint: preset.endpoint,
        authMethod: preset.authMethod,
      };
      
      if (preset.authHeaderName) {
        newValues.authHeaderName = preset.authHeaderName;
      }
      
      // Set sample query
      if (preset.sampleQuery) {
        setQueryInput(preset.sampleQuery);
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

  // Handle run query
  const handleRunQuery = useCallback(() => {
    if (!queryInput.trim()) return;
    
    try {
      const variables = variablesInput.trim() ? JSON.parse(variablesInput) : undefined;
      onRunQuery?.(queryInput, variables);
    } catch (e) {
      // Invalid JSON variables
      console.error('Invalid variables JSON:', e);
    }
  }, [queryInput, variablesInput, onRunQuery]);

  // Get current provider preset
  const currentPreset = useMemo(() => 
    GRAPHQL_PROVIDER_PRESETS.find((p) => p.id === selectedProvider),
    [selectedProvider]
  );

  // Get auth method
  const authMethod = values.authMethod as GraphQLAuthMethod || 'bearer';
  const needsAuth = authMethod !== 'none';

  // Render group header
  const renderGroupHeader = (
    groupId: string,
    label: string,
    description?: string,
    badge?: React.ReactNode
  ) => (
    <button
      type="button"
      className="graphql-form__group-header"
      onClick={() => toggleGroup(groupId)}
      aria-expanded={expandedGroups[groupId]}
    >
      <span className="graphql-form__group-icon">
        {expandedGroups[groupId] ? '▼' : '▶'}
      </span>
      <span className="graphql-form__group-label">{label}</span>
      {badge}
      {description && (
        <span className="graphql-form__group-description">{description}</span>
      )}
    </button>
  );

  // Render provider selector
  const renderProviderSelector = () => (
    <div className="graphql-form__providers">
      <label className="graphql-form__label">GraphQL Provider</label>
      <div className="graphql-form__provider-grid">
        {GRAPHQL_PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`graphql-form__provider-button ${
              selectedProvider === preset.id ? 'graphql-form__provider-button--selected' : ''
            } ${!preset.requiresAuth ? 'graphql-form__provider-button--public' : ''}`}
            onClick={() => handleProviderSelect(preset.id)}
            disabled={disabled || isLoading}
            title={preset.name}
          >
            <span className="graphql-form__provider-icon">{preset.icon}</span>
            <span className="graphql-form__provider-name">{preset.name}</span>
            {!preset.requiresAuth && (
              <span className="graphql-form__public-badge">Public</span>
            )}
          </button>
        ))}
      </div>
      {currentPreset?.documentationUrl && (
        <a
          href={currentPreset.documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="graphql-form__docs-link"
        >
          View {currentPreset.name} Docs →
        </a>
      )}
      {currentPreset?.notes && (
        <div className="graphql-form__provider-notes">
          ℹ️ {currentPreset.notes}
        </div>
      )}
    </div>
  );

  // Render endpoint fields
  const renderEndpointFields = () => (
    <div className="graphql-form__endpoint">
      <div className="graphql-form__field">
        <label htmlFor="endpoint" className="graphql-form__label">
          GraphQL Endpoint
          <span className="graphql-form__required">*</span>
        </label>
        <input
          id="endpoint"
          type="url"
          className={`graphql-form__input ${errors.endpoint ? 'graphql-form__input--error' : ''}`}
          value={(values.endpoint as string) || ''}
          onChange={(e) => handleFieldChange('endpoint', e.target.value)}
          placeholder="https://api.example.com/graphql"
          disabled={disabled || isLoading}
        />
        {errors.endpoint && (
          <span className="graphql-form__error">{errors.endpoint}</span>
        )}
        <span className="graphql-form__hint">
          The GraphQL API endpoint URL (usually ends with /graphql)
        </span>
      </div>

      {/* Connection status */}
      <div className="graphql-form__connection-status">
        {connectionStatus === 'connected' ? (
          <div className="graphql-form__status graphql-form__status--success">
            <span className="graphql-form__status-icon">✓</span>
            <span>Connected to GraphQL endpoint</span>
          </div>
        ) : connectionStatus === 'testing' ? (
          <div className="graphql-form__status graphql-form__status--pending">
            <span className="graphql-form__status-icon">⏳</span>
            <span>Testing connection...</span>
          </div>
        ) : connectionStatus === 'error' ? (
          <div className="graphql-form__status graphql-form__status--error">
            <span className="graphql-form__status-icon">✗</span>
            <span>Connection failed</span>
          </div>
        ) : null}

        {onTestConnection && (
          <button
            type="button"
            className="graphql-form__test-button"
            onClick={onTestConnection}
            disabled={disabled || isLoading || !values.endpoint || connectionStatus === 'testing'}
          >
            {connectionStatus === 'testing' ? 'Testing...' : '🔌 Test Connection'}
          </button>
        )}
      </div>
    </div>
  );

  // Render authentication fields
  const renderAuthenticationFields = () => (
    <div className="graphql-form__authentication">
      <div className="graphql-form__field">
        <label htmlFor="authMethod" className="graphql-form__label">
          Authentication Method
        </label>
        <select
          id="authMethod"
          className="graphql-form__select"
          value={authMethod}
          onChange={(e) => handleFieldChange('authMethod', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="bearer">Bearer Token (Most Common)</option>
          <option value="api-key">API Key Header</option>
          <option value="basic">Basic Authentication</option>
          <option value="custom-header">Custom Header</option>
          <option value="none">No Authentication (Public API)</option>
        </select>
      </div>

      {needsAuth && (
        <>
          <div className="graphql-form__field">
            <label htmlFor="authToken" className="graphql-form__label">
              {authMethod === 'api-key' ? 'API Key' : 'Auth Token'}
              <span className="graphql-form__required">*</span>
            </label>
            <div className="graphql-form__secret-input">
              <input
                id="authToken"
                type={showToken ? 'text' : 'password'}
                className={`graphql-form__input ${errors.authToken ? 'graphql-form__input--error' : ''}`}
                value={(values.authToken as string) || ''}
                onChange={(e) => handleFieldChange('authToken', e.target.value)}
                placeholder={authMethod === 'api-key' ? 'your-api-key' : 'your-auth-token'}
                disabled={disabled || isLoading}
              />
              <button
                type="button"
                className="graphql-form__secret-toggle"
                onClick={() => setShowToken(!showToken)}
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.authToken && (
              <span className="graphql-form__error">{errors.authToken}</span>
            )}
          </div>

          {(authMethod === 'api-key' || authMethod === 'custom-header') && (
            <div className="graphql-form__field">
              <label htmlFor="authHeaderName" className="graphql-form__label">
                Header Name
              </label>
              <input
                id="authHeaderName"
                type="text"
                className="graphql-form__input"
                value={(values.authHeaderName as string) || (authMethod === 'api-key' ? 'X-API-Key' : 'Authorization')}
                onChange={(e) => handleFieldChange('authHeaderName', e.target.value)}
                placeholder={authMethod === 'api-key' ? 'X-API-Key' : 'Authorization'}
                disabled={disabled || isLoading}
              />
            </div>
          )}

          {authMethod === 'custom-header' && (
            <div className="graphql-form__field">
              <label htmlFor="authHeaderPrefix" className="graphql-form__label">
                Header Value Prefix
                <span className="graphql-form__optional">(Optional)</span>
              </label>
              <input
                id="authHeaderPrefix"
                type="text"
                className="graphql-form__input"
                value={(values.authHeaderPrefix as string) || ''}
                onChange={(e) => handleFieldChange('authHeaderPrefix', e.target.value)}
                placeholder="Bearer "
                disabled={disabled || isLoading}
              />
              <span className="graphql-form__hint">
                Prefix before the token (include trailing space if needed)
              </span>
            </div>
          )}
        </>
      )}

      {!needsAuth && (
        <div className="graphql-form__info-box">
          <span className="graphql-form__info-icon">ℹ️</span>
          <span>This is a public API - no authentication required.</span>
        </div>
      )}
    </div>
  );

  // Render query builder
  const renderQueryBuilder = () => (
    <div className="graphql-form__query-builder">
      <div className="graphql-form__field">
        <label htmlFor="queryInput" className="graphql-form__label">
          GraphQL Query
        </label>
        <textarea
          id="queryInput"
          className="graphql-form__textarea graphql-form__textarea--code"
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder={`query {
  __schema {
    types {
      name
    }
  }
}`}
          disabled={disabled || isLoading}
          rows={10}
        />
      </div>

      <div className="graphql-form__field">
        <label htmlFor="variablesInput" className="graphql-form__label">
          Variables (JSON)
          <span className="graphql-form__optional">(Optional)</span>
        </label>
        <textarea
          id="variablesInput"
          className="graphql-form__textarea graphql-form__textarea--code"
          value={variablesInput}
          onChange={(e) => setVariablesInput(e.target.value)}
          placeholder='{"id": "123"}'
          disabled={disabled || isLoading}
          rows={3}
        />
      </div>

      {onRunQuery && (
        <button
          type="button"
          className="graphql-form__run-button"
          onClick={handleRunQuery}
          disabled={disabled || isLoading || !queryInput.trim() || !values.endpoint}
        >
          ▶ Run Query
        </button>
      )}

      {/* Query result */}
      {lastQueryResult && (
        <div className="graphql-form__result">
          <label className="graphql-form__label">Result</label>
          {lastQueryResult.errors && lastQueryResult.errors.length > 0 ? (
            <div className="graphql-form__result-errors">
              <span className="graphql-form__error-icon">⚠️</span>
              <pre className="graphql-form__result-code graphql-form__result-code--error">
                {GraphQLHandshakeExecutor.formatErrors(lastQueryResult.errors)}
              </pre>
            </div>
          ) : null}
          {lastQueryResult.data && (
            <pre className="graphql-form__result-code">
              {JSON.stringify(lastQueryResult.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Sample queries */}
      {currentPreset?.sampleQuery && (
        <div className="graphql-form__sample">
          <button
            type="button"
            className="graphql-form__sample-button"
            onClick={() => setQueryInput(currentPreset.sampleQuery || '')}
          >
            📝 Load Sample Query
          </button>
        </div>
      )}
    </div>
  );

  // Render advanced settings
  const renderAdvancedSettings = () => (
    <div className="graphql-form__advanced">
      <div className="graphql-form__field">
        <label htmlFor="timeout" className="graphql-form__label">
          Request Timeout (ms)
        </label>
        <input
          id="timeout"
          type="number"
          className="graphql-form__input"
          value={(values.timeout as number) || 30000}
          onChange={(e) => handleFieldChange('timeout', parseInt(e.target.value, 10))}
          placeholder="30000"
          disabled={disabled || isLoading}
          min={1000}
          max={120000}
        />
      </div>

      <div className="graphql-form__field">
        <label className="graphql-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.enableIntrospection as boolean) !== false}
            onChange={(e) => handleFieldChange('enableIntrospection', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Enable Introspection
        </label>
        <span className="graphql-form__hint">
          Allow schema introspection queries for auto-discovery
        </span>
      </div>

      <div className="graphql-form__field">
        <label htmlFor="subscriptionEndpoint" className="graphql-form__label">
          Subscription Endpoint
          <span className="graphql-form__optional">(Optional)</span>
        </label>
        <input
          id="subscriptionEndpoint"
          type="url"
          className="graphql-form__input"
          value={(values.subscriptionEndpoint as string) || ''}
          onChange={(e) => handleFieldChange('subscriptionEndpoint', e.target.value)}
          placeholder="wss://api.example.com/graphql"
          disabled={disabled || isLoading}
        />
        <span className="graphql-form__hint">
          WebSocket endpoint for GraphQL subscriptions
        </span>
      </div>

      <div className="graphql-form__field">
        <label htmlFor="additionalHeaders" className="graphql-form__label">
          Additional Headers (JSON)
          <span className="graphql-form__optional">(Optional)</span>
        </label>
        <textarea
          id="additionalHeaders"
          className="graphql-form__textarea graphql-form__textarea--code"
          value={
            typeof values.additionalHeaders === 'string'
              ? values.additionalHeaders
              : JSON.stringify(values.additionalHeaders || {}, null, 2)
          }
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleFieldChange('additionalHeaders', parsed);
            } catch {
              handleFieldChange('additionalHeaders', e.target.value);
            }
          }}
          placeholder='{"X-Custom-Header": "value"}'
          disabled={disabled || isLoading}
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <form
      className={`graphql-form ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Provider Selection */}
      <div className="graphql-form__group">
        {renderGroupHeader('provider', 'Select Provider')}
        {expandedGroups.provider && (
          <div className="graphql-form__group-content">
            {renderProviderSelector()}
          </div>
        )}
      </div>

      {/* Endpoint */}
      <div className="graphql-form__group">
        {renderGroupHeader('endpoint', 'GraphQL Endpoint', undefined,
          connectionStatus === 'connected' ? (
            <span className="graphql-form__badge graphql-form__badge--success">✓ Connected</span>
          ) : null
        )}
        {expandedGroups.endpoint && (
          <div className="graphql-form__group-content">
            {renderEndpointFields()}
          </div>
        )}
      </div>

      {/* Authentication */}
      <div className="graphql-form__group">
        {renderGroupHeader('authentication', 'Authentication', undefined,
          !needsAuth ? (
            <span className="graphql-form__badge graphql-form__badge--info">Public</span>
          ) : values.authToken ? (
            <span className="graphql-form__badge graphql-form__badge--security">🔑 Configured</span>
          ) : null
        )}
        {expandedGroups.authentication && (
          <div className="graphql-form__group-content">
            {renderAuthenticationFields()}
          </div>
        )}
      </div>

      {/* Query Builder */}
      <div className="graphql-form__group">
        {renderGroupHeader('queryBuilder', 'Query Builder', 'Test your queries')}
        {expandedGroups.queryBuilder && (
          <div className="graphql-form__group-content">
            {renderQueryBuilder()}
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="graphql-form__group">
        {renderGroupHeader('advanced', 'Advanced Settings')}
        {expandedGroups.advanced && (
          <div className="graphql-form__group-content">
            {renderAdvancedSettings()}
          </div>
        )}
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="graphql-form__actions">
          <button
            type="submit"
            className="graphql-form__submit"
            disabled={disabled || isLoading || !values.endpoint}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </form>
  );
};

/**
 * Hook for managing GraphQL credential form state
 */
export function useGraphQLCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'testing' | 'connected' | 'error'>('none');
  const [lastQueryResult, setLastQueryResult] = useState<GraphQLResponse | undefined>();

  const executor = useMemo(() => new GraphQLHandshakeExecutor(), []);

  const handleChange = useCallback((newValues: Record<string, unknown>) => {
    setValues(newValues);
    setIsDirty(true);
    setConnectionStatus('none');
    
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
    setLastQueryResult(undefined);
  }, []);

  /**
   * Test the GraphQL connection
   */
  const testConnection = useCallback(async () => {
    setConnectionStatus('testing');
    
    try {
      const result = await executor.healthCheck(values as any);
      
      if (result.healthy) {
        setConnectionStatus('connected');
        return { success: true };
      } else {
        setConnectionStatus('error');
        return { success: false, error: result.message };
      }
    } catch (error) {
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [values, executor]);

  /**
   * Run a GraphQL query
   */
  const runQuery = useCallback(async (query: string, variables?: Record<string, unknown>) => {
    try {
      const result = await executor.query(values as any, query, variables);
      setLastQueryResult(result);
      return result;
    } catch (error) {
      const errorResult: GraphQLResponse = {
        errors: [{
          message: error instanceof Error ? error.message : 'Query failed',
        }],
      };
      setLastQueryResult(errorResult);
      return errorResult;
    }
  }, [values, executor]);

  return {
    values,
    errors,
    isDirty,
    connectionStatus,
    lastQueryResult,
    handleChange,
    validate,
    reset,
    setErrors,
    setConnectionStatus,
    testConnection,
    runQuery,
  };
}

export default GraphQLCredentialFormFields;
