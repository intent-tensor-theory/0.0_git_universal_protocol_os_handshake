// ============================================
// PROTOCOL OS - SOAP/XML CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.9.b
// Purpose: React component for SOAP/XML configuration UI
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { 
  SoapXmlHandshakeExecutor, 
  type SoapAuthMethod,
  type SoapVersion,
  type WsSecurityPasswordType,
  type SoapFault,
} from './1.3.9.a_fileSoapXmlHandshakeExecutor';

/**
 * SOAP provider preset configuration
 */
export interface SoapProviderPreset {
  id: string;
  name: string;
  icon: string;
  endpoint: string;
  wsdlUrl?: string;
  soapVersion: SoapVersion;
  authMethod: SoapAuthMethod;
  targetNamespace?: string;
  documentationUrl: string;
  notes?: string;
  sampleRequest?: string;
}

/**
 * Provider presets for common SOAP services
 */
export const SOAP_PROVIDER_PRESETS: SoapProviderPreset[] = [
  {
    id: 'ups',
    name: 'UPS Shipping',
    icon: 'truck',
    endpoint: 'https://onlinetools.ups.com/webservices/Ship',
    wsdlUrl: 'https://onlinetools.ups.com/webservices/Ship?wsdl',
    soapVersion: '1.1',
    authMethod: 'ws-security-username',
    targetNamespace: 'http://www.ups.com/XMLSchema/XOLTWS/Ship/v1.0',
    documentationUrl: 'https://developer.ups.com/api/reference',
    notes: 'UPS Shipping API requires WS-Security with username token.',
    sampleRequest: `<ship:ShipmentRequest xmlns:ship="http://www.ups.com/XMLSchema/XOLTWS/Ship/v1.0">
  <ship:Request>
    <common:RequestOption>validate</common:RequestOption>
  </ship:Request>
</ship:ShipmentRequest>`,
  },
  {
    id: 'fedex',
    name: 'FedEx Ship',
    icon: 'truck',
    endpoint: 'https://ws.fedex.com:443/web-services/ship',
    wsdlUrl: 'https://ws.fedex.com:443/web-services/ship?wsdl',
    soapVersion: '1.1',
    authMethod: 'custom-header',
    documentationUrl: 'https://developer.fedex.com/api/en-us/home.html',
    notes: 'FedEx uses custom security header with Account Number and Meter Number.',
  },
  {
    id: 'salesforce',
    name: 'Salesforce SOAP API',
    icon: 'cloud',
    endpoint: 'https://login.salesforce.com/services/Soap/u/58.0',
    wsdlUrl: 'https://login.salesforce.com/services/wsdl/Soap?wsdl',
    soapVersion: '1.1',
    authMethod: 'custom-header',
    targetNamespace: 'urn:partner.soap.sforce.com',
    documentationUrl: 'https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/',
    notes: 'Salesforce requires SessionHeader with sessionId after login.',
    sampleRequest: `<sf:login xmlns:sf="urn:partner.soap.sforce.com">
  <sf:username>user@example.com</sf:username>
  <sf:password>password+securitytoken</sf:password>
</sf:login>`,
  },
  {
    id: 'sap',
    name: 'SAP Web Services',
    icon: 'database',
    endpoint: 'https://your-sap-server/sap/bc/srt/wsdl/...',
    soapVersion: '1.1',
    authMethod: 'basic-auth',
    documentationUrl: 'https://help.sap.com/docs/',
    notes: 'SAP typically uses Basic Auth. Replace endpoint with your SAP server URL.',
  },
  {
    id: 'oracle',
    name: 'Oracle SOA',
    icon: 'database',
    endpoint: 'http://your-oracle-server/soa-infra/services/...',
    soapVersion: '1.1',
    authMethod: 'ws-security-username',
    documentationUrl: 'https://docs.oracle.com/en/middleware/soa-suite/',
    notes: 'Oracle SOA Suite supports WS-Security.',
  },
  {
    id: 'paypal',
    name: 'PayPal SOAP API',
    icon: 'credit-card',
    endpoint: 'https://api-3t.paypal.com/2.0/',
    wsdlUrl: 'https://www.paypal.com/wsdl/PayPalSvc.wsdl',
    soapVersion: '1.1',
    authMethod: 'custom-header',
    documentationUrl: 'https://developer.paypal.com/docs/nvp-soap-api/soap-api/',
    notes: 'PayPal SOAP API uses RequesterCredentials header.',
    sampleRequest: `<urn:GetBalanceReq xmlns:urn="urn:ebay:api:PayPalAPI">
  <urn:GetBalanceRequest>
    <ebl:Version xmlns:ebl="urn:ebay:apis:eBLBaseComponents">204.0</ebl:Version>
  </urn:GetBalanceRequest>
</urn:GetBalanceReq>`,
  },
  {
    id: 'usps',
    name: 'USPS Web Tools',
    icon: 'mail',
    endpoint: 'https://secure.shippingapis.com/ShippingAPI.dll',
    soapVersion: '1.1',
    authMethod: 'none',
    documentationUrl: 'https://www.usps.com/business/web-tools-apis/',
    notes: 'USPS uses URL parameters for authentication (USERID).',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks QBMS',
    icon: 'calculator',
    endpoint: 'https://merchantaccount.ptc.quickbooks.com/j/AppGateway',
    soapVersion: '1.1',
    authMethod: 'custom-header',
    documentationUrl: 'https://developer.intuit.com/',
    notes: 'QuickBooks Merchant Services uses application ticket header.',
  },
  {
    id: 'globalweather',
    name: 'Global Weather (Test)',
    icon: 'cloud-sun',
    endpoint: 'http://www.webservicex.net/globalweather.asmx',
    wsdlUrl: 'http://www.webservicex.net/globalweather.asmx?WSDL',
    soapVersion: '1.1',
    authMethod: 'none',
    targetNamespace: 'http://www.webserviceX.NET',
    documentationUrl: 'http://www.webservicex.net/ws/default.aspx',
    notes: 'Public test SOAP service. No authentication required.',
    sampleRequest: `<GetCitiesByCountry xmlns="http://www.webserviceX.NET">
  <CountryName>United States</CountryName>
</GetCitiesByCountry>`,
  },
  {
    id: 'calculator',
    name: 'Calculator (Test)',
    icon: 'calculator',
    endpoint: 'http://www.dneonline.com/calculator.asmx',
    wsdlUrl: 'http://www.dneonline.com/calculator.asmx?WSDL',
    soapVersion: '1.1',
    authMethod: 'none',
    targetNamespace: 'http://tempuri.org/',
    documentationUrl: 'http://www.dneonline.com/calculator.asmx',
    notes: 'Public test SOAP calculator service.',
    sampleRequest: `<Add xmlns="http://tempuri.org/">
  <intA>10</intA>
  <intB>20</intB>
</Add>`,
  },
  {
    id: 'custom',
    name: 'Custom SOAP Service',
    icon: 'settings',
    endpoint: '',
    soapVersion: '1.1',
    authMethod: 'none',
    documentationUrl: '',
  },
];

/**
 * Props for the credential form
 */
export interface SoapCredentialFormFieldsProps {
  /** Current credential values */
  values: Record<string, unknown>;
  
  /** Callback when values change */
  onChange: (values: Record<string, unknown>) => void;
  
  /** Callback to test connection */
  onTestConnection?: () => void;
  
  /** Callback to execute a request */
  onExecuteRequest?: (body: string) => void;
  
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
  
  /** Last response */
  lastResponse?: { success: boolean; body?: string; fault?: SoapFault; rawBody?: string };
  
  /** Custom class name */
  className?: string;
}

/**
 * SOAP/XML Credential Form Fields Component
 */
export const SoapCredentialFormFields: React.FC<SoapCredentialFormFieldsProps> = ({
  values,
  onChange,
  onTestConnection,
  onExecuteRequest,
  onSubmit,
  isLoading = false,
  disabled = false,
  errors = {},
  connectionStatus = 'none',
  lastResponse,
  className = '',
}) => {
  // State for selected provider preset
  const [selectedProvider, setSelectedProvider] = useState<string>('custom');
  
  // State for collapsible sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    provider: true,
    endpoint: true,
    protocol: false,
    authentication: true,
    security: false,
    request: false,
    advanced: false,
  });

  // State for showing/hiding password
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);
  
  // State for request body
  const [requestBody, setRequestBody] = useState('');

  // Get executor for utilities
  const executor = useMemo(() => new SoapXmlHandshakeExecutor(), []);

  // Get current provider preset
  const currentPreset = useMemo(() => 
    SOAP_PROVIDER_PRESETS.find((p) => p.id === selectedProvider),
    [selectedProvider]
  );

  // Set sample request from preset
  useEffect(() => {
    if (currentPreset?.sampleRequest) {
      setRequestBody(currentPreset.sampleRequest);
    }
  }, [currentPreset]);

  // Handle provider selection
  const handleProviderSelect = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    
    const preset = SOAP_PROVIDER_PRESETS.find((p) => p.id === providerId);
    if (preset && preset.id !== 'custom') {
      const newValues: Record<string, unknown> = {
        ...values,
        endpoint: preset.endpoint,
        soapVersion: preset.soapVersion,
        authMethod: preset.authMethod,
      };
      
      if (preset.wsdlUrl) {
        newValues.wsdlUrl = preset.wsdlUrl;
      }
      if (preset.targetNamespace) {
        newValues.targetNamespace = preset.targetNamespace;
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

  // Handle execute request
  const handleExecuteRequest = useCallback(() => {
    if (requestBody.trim()) {
      onExecuteRequest?.(requestBody);
    }
  }, [requestBody, onExecuteRequest]);

  // Get auth method
  const authMethod = values.authMethod as SoapAuthMethod || 'none';

  // Render group header
  const renderGroupHeader = (
    groupId: string,
    label: string,
    description?: string,
    badge?: React.ReactNode
  ) => (
    <button
      type="button"
      className="soap-form__group-header"
      onClick={() => toggleGroup(groupId)}
      aria-expanded={expandedGroups[groupId]}
    >
      <span className="soap-form__group-icon">
        {expandedGroups[groupId] ? '▼' : '▶'}
      </span>
      <span className="soap-form__group-label">{label}</span>
      {badge}
      {description && (
        <span className="soap-form__group-description">{description}</span>
      )}
    </button>
  );

  // Render provider selector
  const renderProviderSelector = () => (
    <div className="soap-form__providers">
      <label className="soap-form__label">SOAP Service Provider</label>
      <div className="soap-form__provider-grid">
        {SOAP_PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`soap-form__provider-button ${
              selectedProvider === preset.id ? 'soap-form__provider-button--selected' : ''
            } ${preset.authMethod === 'none' ? 'soap-form__provider-button--public' : ''}`}
            onClick={() => handleProviderSelect(preset.id)}
            disabled={disabled || isLoading}
            title={preset.name}
          >
            <span className="soap-form__provider-icon">{preset.icon}</span>
            <span className="soap-form__provider-name">{preset.name}</span>
          </button>
        ))}
      </div>
      {currentPreset?.documentationUrl && (
        <a
          href={currentPreset.documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="soap-form__docs-link"
        >
          View {currentPreset.name} Docs →
        </a>
      )}
      {currentPreset?.notes && (
        <div className="soap-form__provider-notes">
          ℹ️ {currentPreset.notes}
        </div>
      )}
    </div>
  );

  // Render endpoint fields
  const renderEndpointFields = () => (
    <div className="soap-form__endpoint">
      <div className="soap-form__field">
        <label htmlFor="endpoint" className="soap-form__label">
          SOAP Endpoint URL
          <span className="soap-form__required">*</span>
        </label>
        <input
          id="endpoint"
          type="url"
          className={`soap-form__input ${errors.endpoint ? 'soap-form__input--error' : ''}`}
          value={(values.endpoint as string) || ''}
          onChange={(e) => handleFieldChange('endpoint', e.target.value)}
          placeholder="https://api.example.com/soap/service"
          disabled={disabled || isLoading}
        />
        {errors.endpoint && (
          <span className="soap-form__error">{errors.endpoint}</span>
        )}
      </div>

      <div className="soap-form__field">
        <label htmlFor="wsdlUrl" className="soap-form__label">
          WSDL URL
          <span className="soap-form__optional">(Optional)</span>
        </label>
        <input
          id="wsdlUrl"
          type="url"
          className="soap-form__input"
          value={(values.wsdlUrl as string) || ''}
          onChange={(e) => handleFieldChange('wsdlUrl', e.target.value)}
          placeholder="https://api.example.com/soap/service?wsdl"
          disabled={disabled || isLoading}
        />
        <span className="soap-form__hint">
          Web Services Description Language URL for service discovery
        </span>
      </div>

      {/* Connection status */}
      <div className="soap-form__connection-status">
        {connectionStatus === 'connected' ? (
          <div className="soap-form__status soap-form__status--success">
            <span className="soap-form__status-icon">✓</span>
            <span>Service endpoint verified</span>
          </div>
        ) : connectionStatus === 'testing' ? (
          <div className="soap-form__status soap-form__status--pending">
            <span className="soap-form__status-icon">⏳</span>
            <span>Testing connection...</span>
          </div>
        ) : connectionStatus === 'error' ? (
          <div className="soap-form__status soap-form__status--error">
            <span className="soap-form__status-icon">✗</span>
            <span>Connection failed</span>
          </div>
        ) : null}

        {onTestConnection && (
          <button
            type="button"
            className="soap-form__test-button"
            onClick={onTestConnection}
            disabled={disabled || isLoading || !values.endpoint || connectionStatus === 'testing'}
          >
            {connectionStatus === 'testing' ? 'Testing...' : '🔌 Test Connection'}
          </button>
        )}
      </div>
    </div>
  );

  // Render protocol fields
  const renderProtocolFields = () => (
    <div className="soap-form__protocol">
      <div className="soap-form__field">
        <label htmlFor="soapVersion" className="soap-form__label">
          SOAP Version
        </label>
        <select
          id="soapVersion"
          className="soap-form__select"
          value={(values.soapVersion as string) || '1.1'}
          onChange={(e) => handleFieldChange('soapVersion', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="1.1">SOAP 1.1 (Most Common)</option>
          <option value="1.2">SOAP 1.2</option>
        </select>
      </div>

      <div className="soap-form__field">
        <label htmlFor="soapAction" className="soap-form__label">
          SOAPAction
          <span className="soap-form__optional">(Optional)</span>
        </label>
        <input
          id="soapAction"
          type="text"
          className="soap-form__input"
          value={(values.soapAction as string) || ''}
          onChange={(e) => handleFieldChange('soapAction', e.target.value)}
          placeholder="http://example.com/Action"
          disabled={disabled || isLoading}
        />
      </div>

      <div className="soap-form__field">
        <label htmlFor="targetNamespace" className="soap-form__label">
          Target Namespace
          <span className="soap-form__optional">(Optional)</span>
        </label>
        <input
          id="targetNamespace"
          type="text"
          className="soap-form__input"
          value={(values.targetNamespace as string) || ''}
          onChange={(e) => handleFieldChange('targetNamespace', e.target.value)}
          placeholder="http://example.com/service"
          disabled={disabled || isLoading}
        />
      </div>
    </div>
  );

  // Render authentication fields
  const renderAuthenticationFields = () => (
    <div className="soap-form__authentication">
      <div className="soap-form__field">
        <label htmlFor="authMethod" className="soap-form__label">
          Authentication Method
        </label>
        <select
          id="authMethod"
          className="soap-form__select"
          value={authMethod}
          onChange={(e) => handleFieldChange('authMethod', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="none">No Authentication</option>
          <option value="ws-security-username">WS-Security UsernameToken</option>
          <option value="basic-auth">HTTP Basic Authentication</option>
          <option value="bearer-token">HTTP Bearer Token</option>
          <option value="custom-header">Custom SOAP Header</option>
        </select>
      </div>

      {(authMethod === 'ws-security-username' || authMethod === 'basic-auth') && (
        <>
          <div className="soap-form__field">
            <label htmlFor="username" className="soap-form__label">
              Username
              <span className="soap-form__required">*</span>
            </label>
            <input
              id="username"
              type="text"
              className={`soap-form__input ${errors.username ? 'soap-form__input--error' : ''}`}
              value={(values.username as string) || ''}
              onChange={(e) => handleFieldChange('username', e.target.value)}
              placeholder="username"
              disabled={disabled || isLoading}
            />
            {errors.username && (
              <span className="soap-form__error">{errors.username}</span>
            )}
          </div>

          <div className="soap-form__field">
            <label htmlFor="password" className="soap-form__label">
              Password
              <span className="soap-form__required">*</span>
            </label>
            <div className="soap-form__secret-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`soap-form__input ${errors.password ? 'soap-form__input--error' : ''}`}
                value={(values.password as string) || ''}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="password"
                disabled={disabled || isLoading}
              />
              <button
                type="button"
                className="soap-form__secret-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <span className="soap-form__error">{errors.password}</span>
            )}
          </div>
        </>
      )}

      {authMethod === 'ws-security-username' && (
        <div className="soap-form__field">
          <label htmlFor="passwordType" className="soap-form__label">
            Password Type
          </label>
          <select
            id="passwordType"
            className="soap-form__select"
            value={(values.passwordType as string) || 'PasswordText'}
            onChange={(e) => handleFieldChange('passwordType', e.target.value)}
            disabled={disabled || isLoading}
          >
            <option value="PasswordText">Plain Text</option>
            <option value="PasswordDigest">Password Digest (SHA-1)</option>
          </select>
          <span className="soap-form__hint">
            Password Digest is more secure but not supported by all services
          </span>
        </div>
      )}

      {authMethod === 'bearer-token' && (
        <div className="soap-form__field">
          <label htmlFor="bearerToken" className="soap-form__label">
            Bearer Token
            <span className="soap-form__required">*</span>
          </label>
          <div className="soap-form__secret-input">
            <input
              id="bearerToken"
              type={showToken ? 'text' : 'password'}
              className={`soap-form__input ${errors.bearerToken ? 'soap-form__input--error' : ''}`}
              value={(values.bearerToken as string) || ''}
              onChange={(e) => handleFieldChange('bearerToken', e.target.value)}
              placeholder="your-bearer-token"
              disabled={disabled || isLoading}
            />
            <button
              type="button"
              className="soap-form__secret-toggle"
              onClick={() => setShowToken(!showToken)}
              aria-label={showToken ? 'Hide token' : 'Show token'}
            >
              {showToken ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.bearerToken && (
            <span className="soap-form__error">{errors.bearerToken}</span>
          )}
        </div>
      )}

      {authMethod === 'custom-header' && (
        <div className="soap-form__field">
          <label htmlFor="customHeader" className="soap-form__label">
            Custom SOAP Header XML
          </label>
          <textarea
            id="customHeader"
            className="soap-form__textarea soap-form__textarea--code"
            value={(values.customHeader as string) || ''}
            onChange={(e) => handleFieldChange('customHeader', e.target.value)}
            placeholder={`<auth:AuthToken xmlns:auth="http://example.com/auth">
  <auth:Token>your-token-here</auth:Token>
</auth:AuthToken>`}
            disabled={disabled || isLoading}
            rows={5}
          />
        </div>
      )}

      {authMethod === 'none' && (
        <div className="soap-form__info-box">
          <span className="soap-form__info-icon">ℹ️</span>
          <span>No authentication required for this service.</span>
        </div>
      )}
    </div>
  );

  // Render WS-Security fields
  const renderSecurityFields = () => (
    <div className="soap-form__security">
      <div className="soap-form__field">
        <label className="soap-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.includeTimestamp as boolean) !== false}
            onChange={(e) => handleFieldChange('includeTimestamp', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Include Timestamp
        </label>
        <span className="soap-form__hint">
          Add WS-Security timestamp to prevent replay attacks
        </span>
      </div>

      {values.includeTimestamp !== false && (
        <div className="soap-form__field">
          <label htmlFor="timestampTtl" className="soap-form__label">
            Timestamp TTL (seconds)
          </label>
          <input
            id="timestampTtl"
            type="number"
            className="soap-form__input"
            value={(values.timestampTtl as number) || 300}
            onChange={(e) => handleFieldChange('timestampTtl', parseInt(e.target.value, 10))}
            placeholder="300"
            disabled={disabled || isLoading}
            min={60}
          />
        </div>
      )}
    </div>
  );

  // Render request builder
  const renderRequestBuilder = () => (
    <div className="soap-form__request">
      <div className="soap-form__field">
        <label htmlFor="requestBody" className="soap-form__label">
          SOAP Body XML
        </label>
        <textarea
          id="requestBody"
          className="soap-form__textarea soap-form__textarea--code"
          value={requestBody}
          onChange={(e) => setRequestBody(e.target.value)}
          placeholder={`<MyOperation xmlns="http://example.com/service">
  <Parameter1>value1</Parameter1>
  <Parameter2>value2</Parameter2>
</MyOperation>`}
          disabled={disabled || isLoading}
          rows={10}
        />
      </div>

      {onExecuteRequest && (
        <button
          type="button"
          className="soap-form__execute-button"
          onClick={handleExecuteRequest}
          disabled={disabled || isLoading || !requestBody.trim() || !values.endpoint}
        >
          ▶ Execute Request
        </button>
      )}

      {/* Response display */}
      {lastResponse && (
        <div className="soap-form__response">
          <label className="soap-form__label">Response</label>
          {lastResponse.fault ? (
            <div className="soap-form__response-fault">
              <div className="soap-form__fault-header">
                <span className="soap-form__fault-icon">⚠️</span>
                <span>SOAP Fault</span>
              </div>
              <div className="soap-form__fault-details">
                <div><strong>Code:</strong> {lastResponse.fault.faultCode}</div>
                <div><strong>Message:</strong> {lastResponse.fault.faultString}</div>
                {lastResponse.fault.faultActor && (
                  <div><strong>Actor:</strong> {lastResponse.fault.faultActor}</div>
                )}
                {lastResponse.fault.detail && (
                  <div><strong>Detail:</strong> {lastResponse.fault.detail}</div>
                )}
              </div>
            </div>
          ) : lastResponse.success ? (
            <pre className="soap-form__response-code">
              {lastResponse.body || lastResponse.rawBody}
            </pre>
          ) : (
            <div className="soap-form__response-error">
              Request failed
            </div>
          )}
        </div>
      )}

      {/* Sample request loader */}
      {currentPreset?.sampleRequest && (
        <div className="soap-form__sample">
          <button
            type="button"
            className="soap-form__sample-button"
            onClick={() => setRequestBody(currentPreset.sampleRequest || '')}
          >
            📝 Load Sample Request
          </button>
        </div>
      )}
    </div>
  );

  // Render advanced settings
  const renderAdvancedSettings = () => (
    <div className="soap-form__advanced">
      <div className="soap-form__field">
        <label htmlFor="timeout" className="soap-form__label">
          Request Timeout (ms)
        </label>
        <input
          id="timeout"
          type="number"
          className="soap-form__input"
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
      className={`soap-form ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Provider Selection */}
      <div className="soap-form__group">
        {renderGroupHeader('provider', 'Select Provider')}
        {expandedGroups.provider && (
          <div className="soap-form__group-content">
            {renderProviderSelector()}
          </div>
        )}
      </div>

      {/* Endpoint */}
      <div className="soap-form__group">
        {renderGroupHeader('endpoint', 'Service Endpoint', undefined,
          connectionStatus === 'connected' ? (
            <span className="soap-form__badge soap-form__badge--success">✓ Verified</span>
          ) : null
        )}
        {expandedGroups.endpoint && (
          <div className="soap-form__group-content">
            {renderEndpointFields()}
          </div>
        )}
      </div>

      {/* Protocol */}
      <div className="soap-form__group">
        {renderGroupHeader('protocol', 'Protocol Settings', undefined,
          <span className="soap-form__badge">SOAP {values.soapVersion || '1.1'}</span>
        )}
        {expandedGroups.protocol && (
          <div className="soap-form__group-content">
            {renderProtocolFields()}
          </div>
        )}
      </div>

      {/* Authentication */}
      <div className="soap-form__group">
        {renderGroupHeader('authentication', 'Authentication', undefined,
          authMethod !== 'none' ? (
            <span className="soap-form__badge soap-form__badge--security">🔑 {authMethod}</span>
          ) : (
            <span className="soap-form__badge soap-form__badge--info">No Auth</span>
          )
        )}
        {expandedGroups.authentication && (
          <div className="soap-form__group-content">
            {renderAuthenticationFields()}
          </div>
        )}
      </div>

      {/* WS-Security (only for ws-security-username) */}
      {authMethod === 'ws-security-username' && (
        <div className="soap-form__group">
          {renderGroupHeader('security', 'WS-Security Options')}
          {expandedGroups.security && (
            <div className="soap-form__group-content">
              {renderSecurityFields()}
            </div>
          )}
        </div>
      )}

      {/* Request Builder */}
      <div className="soap-form__group">
        {renderGroupHeader('request', 'Request Builder', 'Test your SOAP requests')}
        {expandedGroups.request && (
          <div className="soap-form__group-content">
            {renderRequestBuilder()}
          </div>
        )}
      </div>

      {/* Advanced */}
      <div className="soap-form__group">
        {renderGroupHeader('advanced', 'Advanced Settings')}
        {expandedGroups.advanced && (
          <div className="soap-form__group-content">
            {renderAdvancedSettings()}
          </div>
        )}
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="soap-form__actions">
          <button
            type="submit"
            className="soap-form__submit"
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
 * Hook for managing SOAP credential form state
 */
export function useSoapCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'testing' | 'connected' | 'error'>('none');
  const [lastResponse, setLastResponse] = useState<{ success: boolean; body?: string; fault?: SoapFault; rawBody?: string } | undefined>();

  const executor = useMemo(() => new SoapXmlHandshakeExecutor(), []);

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
    setLastResponse(undefined);
  }, []);

  /**
   * Test the SOAP connection
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
   * Execute a SOAP request
   */
  const executeRequest = useCallback(async (body: string) => {
    try {
      const result = await executor.executeRequest({
        credentials: values as any,
        url: values.endpoint as string,
        method: 'POST',
        headers: {},
        body,
      });

      const response = {
        success: result.success,
        body: (result.body as { body?: string })?.body,
        fault: (result.body as { fault?: SoapFault })?.fault,
        rawBody: result.rawBody,
      };
      
      setLastResponse(response);
      return response;
    } catch (error) {
      const response = {
        success: false,
        rawBody: error instanceof Error ? error.message : 'Request failed',
      };
      setLastResponse(response);
      return response;
    }
  }, [values, executor]);

  return {
    values,
    errors,
    isDirty,
    connectionStatus,
    lastResponse,
    handleChange,
    validate,
    reset,
    setErrors,
    testConnection,
    executeRequest,
  };
}

export default SoapCredentialFormFields;
