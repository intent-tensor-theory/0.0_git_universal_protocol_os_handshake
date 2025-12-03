// ============================================
// PROTOCOL OS - WEBSOCKET CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.8.b
// Purpose: React component for WebSocket configuration UI
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { 
  WebSocketHandshakeExecutor, 
  type WebSocketAuthMethod,
  type WebSocketMessageFormat,
  type WebSocketConnectionState,
  type WebSocketMessage,
} from './1.3.8.a_fileWebsocketHandshakeExecutor';

/**
 * WebSocket provider preset configuration
 */
export interface WebSocketProviderPreset {
  id: string;
  name: string;
  icon: string;
  url: string;
  authMethod: WebSocketAuthMethod;
  messageFormat: WebSocketMessageFormat;
  tokenParamName?: string;
  authMessageType?: string;
  authMessageTemplate?: string;
  subprotocols?: string;
  documentationUrl: string;
  notes?: string;
  testMessage?: string;
}

/**
 * Provider presets for common WebSocket services
 */
export const WEBSOCKET_PROVIDER_PRESETS: WebSocketProviderPreset[] = [
  {
    id: 'socketio',
    name: 'Socket.IO',
    icon: 'socketio',
    url: 'wss://your-server.com/socket.io/?EIO=4&transport=websocket',
    authMethod: 'first-message',
    messageFormat: 'json',
    authMessageType: 'auth',
    authMessageTemplate: '{"type": "auth", "token": "{{token}}"}',
    documentationUrl: 'https://socket.io/docs/v4/',
    notes: 'Socket.IO uses its own protocol. EIO=4 is for Socket.IO v4+.',
    testMessage: '["ping"]',
  },
  {
    id: 'pusher',
    name: 'Pusher',
    icon: 'pusher',
    url: 'wss://ws-{cluster}.pusher.com/app/{app_key}?protocol=7&client=js&version=8.0.0',
    authMethod: 'first-message',
    messageFormat: 'json',
    authMessageTemplate: '{"event": "pusher:subscribe", "data": {"channel": "private-channel", "auth": "{{token}}"}}',
    documentationUrl: 'https://pusher.com/docs/channels/library_auth_reference/pusher-websockets-protocol/',
    notes: 'Replace {cluster} and {app_key} with your Pusher credentials.',
  },
  {
    id: 'ably',
    name: 'Ably',
    icon: 'ably',
    url: 'wss://realtime.ably.io/?key={api_key}',
    authMethod: 'query-param',
    messageFormat: 'json',
    tokenParamName: 'key',
    documentationUrl: 'https://ably.com/docs/realtime/connection',
    notes: 'Replace {api_key} with your Ably API key.',
  },
  {
    id: 'phoenix',
    name: 'Phoenix Channels',
    icon: 'phoenix',
    url: 'wss://your-server.com/socket/websocket',
    authMethod: 'query-param',
    messageFormat: 'json',
    tokenParamName: 'token',
    documentationUrl: 'https://hexdocs.pm/phoenix/channels.html',
    notes: 'Elixir Phoenix framework channels.',
    testMessage: '["1","1","phoenix","phx_join",{}]',
  },
  {
    id: 'actioncable',
    name: 'Action Cable',
    icon: 'rails',
    url: 'wss://your-server.com/cable',
    authMethod: 'query-param',
    messageFormat: 'json',
    tokenParamName: 'token',
    documentationUrl: 'https://guides.rubyonrails.org/action_cable_overview.html',
    notes: 'Ruby on Rails WebSocket framework.',
  },
  {
    id: 'signalr',
    name: 'SignalR',
    icon: 'microsoft',
    url: 'wss://your-server.com/hub?negotiateVersion=1',
    authMethod: 'query-param',
    messageFormat: 'json',
    tokenParamName: 'access_token',
    documentationUrl: 'https://learn.microsoft.com/en-us/aspnet/core/signalr/',
    notes: 'Microsoft SignalR requires negotiation before WebSocket.',
  },
  {
    id: 'graphql-ws',
    name: 'GraphQL WS',
    icon: 'graphql',
    url: 'wss://your-server.com/graphql',
    authMethod: 'first-message',
    messageFormat: 'json',
    subprotocols: 'graphql-transport-ws',
    authMessageType: 'connection_init',
    authMessageTemplate: '{"type": "connection_init", "payload": {"authorization": "Bearer {{token}}"}}',
    documentationUrl: 'https://github.com/enisdenjo/graphql-ws',
    notes: 'Modern GraphQL subscriptions protocol.',
    testMessage: '{"type": "ping"}',
  },
  {
    id: 'subscriptions-transport-ws',
    name: 'Apollo Subscriptions',
    icon: 'apollo',
    url: 'wss://your-server.com/graphql',
    authMethod: 'first-message',
    messageFormat: 'json',
    subprotocols: 'graphql-ws',
    authMessageType: 'connection_init',
    authMessageTemplate: '{"type": "connection_init", "payload": {"authToken": "{{token}}"}}',
    documentationUrl: 'https://www.apollographql.com/docs/graphql-subscriptions/',
    notes: 'Legacy Apollo subscriptions protocol.',
  },
  {
    id: 'aws-apigw',
    name: 'AWS API Gateway',
    icon: 'aws',
    url: 'wss://{api-id}.execute-api.{region}.amazonaws.com/{stage}',
    authMethod: 'query-param',
    messageFormat: 'json',
    tokenParamName: 'Authorization',
    documentationUrl: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html',
    notes: 'Replace {api-id}, {region}, and {stage} with your API details.',
  },
  {
    id: 'binance',
    name: 'Binance Streams',
    icon: 'binance',
    url: 'wss://stream.binance.com:9443/ws',
    authMethod: 'none',
    messageFormat: 'json',
    documentationUrl: 'https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams',
    notes: 'Public market data streams. No auth required for public streams.',
    testMessage: '{"method": "SUBSCRIBE", "params": ["btcusdt@ticker"], "id": 1}',
  },
  {
    id: 'coinbase',
    name: 'Coinbase WebSocket',
    icon: 'coinbase',
    url: 'wss://ws-feed.exchange.coinbase.com',
    authMethod: 'first-message',
    messageFormat: 'json',
    authMessageTemplate: '{"type": "subscribe", "product_ids": ["BTC-USD"], "channels": ["ticker"]}',
    documentationUrl: 'https://docs.cloud.coinbase.com/exchange/docs/websocket-overview',
    notes: 'Cryptocurrency market data feed.',
  },
  {
    id: 'echo',
    name: 'WebSocket Echo (Test)',
    icon: 'test',
    url: 'wss://echo.websocket.events',
    authMethod: 'none',
    messageFormat: 'text',
    documentationUrl: 'https://websocket.events/',
    notes: 'Public test server that echoes messages back.',
    testMessage: 'Hello WebSocket!',
  },
  {
    id: 'custom',
    name: 'Custom WebSocket',
    icon: 'settings',
    url: '',
    authMethod: 'query-param',
    messageFormat: 'json',
    documentationUrl: '',
  },
];

/**
 * Props for the credential form
 */
export interface WebSocketCredentialFormFieldsProps {
  /** Current credential values */
  values: Record<string, unknown>;
  
  /** Callback when values change */
  onChange: (values: Record<string, unknown>) => void;
  
  /** Callback to test connection */
  onTestConnection?: () => void;
  
  /** Callback to send a test message */
  onSendTestMessage?: (message: string) => void;
  
  /** Callback when form is submitted */
  onSubmit?: () => void;
  
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  
  /** Whether the form is disabled */
  disabled?: boolean;
  
  /** Validation errors from parent */
  errors?: Record<string, string>;
  
  /** Current connection state */
  connectionState?: WebSocketConnectionState;
  
  /** Received messages */
  messages?: Array<{ direction: 'sent' | 'received'; data: unknown; timestamp: number }>;
  
  /** Custom class name */
  className?: string;
}

/**
 * WebSocket Credential Form Fields Component
 */
export const WebSocketCredentialFormFields: React.FC<WebSocketCredentialFormFieldsProps> = ({
  values,
  onChange,
  onTestConnection,
  onSendTestMessage,
  onSubmit,
  isLoading = false,
  disabled = false,
  errors = {},
  connectionState = 'disconnected',
  messages = [],
  className = '',
}) => {
  // State for selected provider preset
  const [selectedProvider, setSelectedProvider] = useState<string>('custom');
  
  // State for collapsible sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    provider: true,
    connection: true,
    authentication: true,
    messages: false,
    keepalive: false,
    reconnection: false,
    console: false,
  });

  // State for showing/hiding token
  const [showToken, setShowToken] = useState(false);
  
  // State for test message
  const [testMessage, setTestMessage] = useState('');

  // Get executor for utilities
  const executor = useMemo(() => new WebSocketHandshakeExecutor(), []);

  // Get current provider preset
  const currentPreset = useMemo(() => 
    WEBSOCKET_PROVIDER_PRESETS.find((p) => p.id === selectedProvider),
    [selectedProvider]
  );

  // Set test message from preset
  useEffect(() => {
    if (currentPreset?.testMessage) {
      setTestMessage(currentPreset.testMessage);
    }
  }, [currentPreset]);

  // Handle provider selection
  const handleProviderSelect = useCallback((providerId: string) => {
    setSelectedProvider(providerId);
    
    const preset = WEBSOCKET_PROVIDER_PRESETS.find((p) => p.id === providerId);
    if (preset && preset.id !== 'custom') {
      const newValues: Record<string, unknown> = {
        ...values,
        url: preset.url,
        authMethod: preset.authMethod,
        messageFormat: preset.messageFormat,
      };
      
      if (preset.tokenParamName) {
        newValues.tokenParamName = preset.tokenParamName;
      }
      if (preset.authMessageType) {
        newValues.authMessageType = preset.authMessageType;
      }
      if (preset.authMessageTemplate) {
        newValues.authMessageTemplate = preset.authMessageTemplate;
      }
      if (preset.subprotocols) {
        newValues.subprotocols = preset.subprotocols;
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

  // Handle send test message
  const handleSendTestMessage = useCallback(() => {
    if (testMessage.trim()) {
      onSendTestMessage?.(testMessage);
    }
  }, [testMessage, onSendTestMessage]);

  // Get auth method
  const authMethod = values.authMethod as WebSocketAuthMethod || 'query-param';
  const needsAuth = authMethod !== 'none';

  // Connection state styling
  const getStateColor = (state: WebSocketConnectionState) => {
    switch (state) {
      case 'connected':
      case 'authenticated':
        return 'success';
      case 'connecting':
      case 'authenticating':
      case 'reconnecting':
        return 'pending';
      case 'error':
        return 'error';
      default:
        return 'neutral';
    }
  };

  // Render group header
  const renderGroupHeader = (
    groupId: string,
    label: string,
    description?: string,
    badge?: React.ReactNode
  ) => (
    <button
      type="button"
      className="ws-form__group-header"
      onClick={() => toggleGroup(groupId)}
      aria-expanded={expandedGroups[groupId]}
    >
      <span className="ws-form__group-icon">
        {expandedGroups[groupId] ? '▼' : '▶'}
      </span>
      <span className="ws-form__group-label">{label}</span>
      {badge}
      {description && (
        <span className="ws-form__group-description">{description}</span>
      )}
    </button>
  );

  // Render provider selector
  const renderProviderSelector = () => (
    <div className="ws-form__providers">
      <label className="ws-form__label">WebSocket Provider</label>
      <div className="ws-form__provider-grid">
        {WEBSOCKET_PROVIDER_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`ws-form__provider-button ${
              selectedProvider === preset.id ? 'ws-form__provider-button--selected' : ''
            } ${preset.authMethod === 'none' ? 'ws-form__provider-button--public' : ''}`}
            onClick={() => handleProviderSelect(preset.id)}
            disabled={disabled || isLoading}
            title={preset.name}
          >
            <span className="ws-form__provider-icon">{preset.icon}</span>
            <span className="ws-form__provider-name">{preset.name}</span>
          </button>
        ))}
      </div>
      {currentPreset?.documentationUrl && (
        <a
          href={currentPreset.documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ws-form__docs-link"
        >
          View {currentPreset.name} Docs →
        </a>
      )}
      {currentPreset?.notes && (
        <div className="ws-form__provider-notes">
          ℹ️ {currentPreset.notes}
        </div>
      )}
    </div>
  );

  // Render connection fields
  const renderConnectionFields = () => (
    <div className="ws-form__connection">
      <div className="ws-form__field">
        <label htmlFor="url" className="ws-form__label">
          WebSocket URL
          <span className="ws-form__required">*</span>
        </label>
        <input
          id="url"
          type="url"
          className={`ws-form__input ${errors.url ? 'ws-form__input--error' : ''}`}
          value={(values.url as string) || ''}
          onChange={(e) => handleFieldChange('url', e.target.value)}
          placeholder="wss://api.example.com/ws"
          disabled={disabled || isLoading}
        />
        {errors.url && (
          <span className="ws-form__error">{errors.url}</span>
        )}
        <span className="ws-form__hint">
          Use wss:// for secure connections, ws:// for local development
        </span>
      </div>

      <div className="ws-form__field">
        <label htmlFor="subprotocols" className="ws-form__label">
          Subprotocols
          <span className="ws-form__optional">(Optional)</span>
        </label>
        <input
          id="subprotocols"
          type="text"
          className="ws-form__input"
          value={(values.subprotocols as string) || ''}
          onChange={(e) => handleFieldChange('subprotocols', e.target.value)}
          placeholder="graphql-transport-ws, json"
          disabled={disabled || isLoading}
        />
        <span className="ws-form__hint">
          Comma-separated list of subprotocols to negotiate
        </span>
      </div>

      {/* Connection status */}
      <div className="ws-form__connection-status">
        <div className={`ws-form__status ws-form__status--${getStateColor(connectionState)}`}>
          <span className="ws-form__status-icon">
            {connectionState === 'authenticated' ? '✓' :
             connectionState === 'connected' ? '○' :
             connectionState === 'connecting' || connectionState === 'reconnecting' ? '⏳' :
             connectionState === 'error' ? '✗' : '○'}
          </span>
          <span>{connectionState.charAt(0).toUpperCase() + connectionState.slice(1)}</span>
        </div>

        {onTestConnection && (
          <button
            type="button"
            className="ws-form__test-button"
            onClick={onTestConnection}
            disabled={disabled || isLoading || !values.url || 
                     connectionState === 'connecting' || connectionState === 'reconnecting'}
          >
            {connectionState === 'connected' || connectionState === 'authenticated' 
              ? '🔌 Disconnect' 
              : connectionState === 'connecting' 
                ? '⏳ Connecting...' 
                : '🔌 Connect'}
          </button>
        )}
      </div>
    </div>
  );

  // Render authentication fields
  const renderAuthenticationFields = () => (
    <div className="ws-form__authentication">
      <div className="ws-form__field">
        <label htmlFor="authMethod" className="ws-form__label">
          Authentication Method
        </label>
        <select
          id="authMethod"
          className="ws-form__select"
          value={authMethod}
          onChange={(e) => handleFieldChange('authMethod', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="query-param">Query Parameter (Token in URL)</option>
          <option value="first-message">First Message (Send auth after connect)</option>
          <option value="subprotocol">Subprotocol (Token in header)</option>
          <option value="none">No Authentication</option>
        </select>
      </div>

      {needsAuth && (
        <>
          <div className="ws-form__field">
            <label htmlFor="authToken" className="ws-form__label">
              Auth Token
              <span className="ws-form__required">*</span>
            </label>
            <div className="ws-form__secret-input">
              <input
                id="authToken"
                type={showToken ? 'text' : 'password'}
                className={`ws-form__input ${errors.authToken ? 'ws-form__input--error' : ''}`}
                value={(values.authToken as string) || ''}
                onChange={(e) => handleFieldChange('authToken', e.target.value)}
                placeholder="your-auth-token"
                disabled={disabled || isLoading}
              />
              <button
                type="button"
                className="ws-form__secret-toggle"
                onClick={() => setShowToken(!showToken)}
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                {showToken ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.authToken && (
              <span className="ws-form__error">{errors.authToken}</span>
            )}
          </div>

          {authMethod === 'query-param' && (
            <div className="ws-form__field">
              <label htmlFor="tokenParamName" className="ws-form__label">
                Token Parameter Name
              </label>
              <input
                id="tokenParamName"
                type="text"
                className="ws-form__input"
                value={(values.tokenParamName as string) || 'token'}
                onChange={(e) => handleFieldChange('tokenParamName', e.target.value)}
                placeholder="token"
                disabled={disabled || isLoading}
              />
            </div>
          )}

          {authMethod === 'first-message' && (
            <>
              <div className="ws-form__field">
                <label htmlFor="authMessageType" className="ws-form__label">
                  Auth Message Type
                </label>
                <input
                  id="authMessageType"
                  type="text"
                  className="ws-form__input"
                  value={(values.authMessageType as string) || 'authenticate'}
                  onChange={(e) => handleFieldChange('authMessageType', e.target.value)}
                  placeholder="authenticate"
                  disabled={disabled || isLoading}
                />
              </div>
              <div className="ws-form__field">
                <label htmlFor="authMessageTemplate" className="ws-form__label">
                  Auth Message Template (JSON)
                </label>
                <textarea
                  id="authMessageTemplate"
                  className="ws-form__textarea ws-form__textarea--code"
                  value={(values.authMessageTemplate as string) || '{"type": "{{type}}", "token": "{{token}}"}'}
                  onChange={(e) => handleFieldChange('authMessageTemplate', e.target.value)}
                  placeholder='{"type": "authenticate", "token": "{{token}}"}'
                  disabled={disabled || isLoading}
                  rows={3}
                />
                <span className="ws-form__hint">
                  Use {'{{token}}'} and {'{{type}}'} as placeholders
                </span>
              </div>
            </>
          )}
        </>
      )}

      {!needsAuth && (
        <div className="ws-form__info-box">
          <span className="ws-form__info-icon">ℹ️</span>
          <span>No authentication required for this connection.</span>
        </div>
      )}
    </div>
  );

  // Render message format fields
  const renderMessageFields = () => (
    <div className="ws-form__messages">
      <div className="ws-form__field">
        <label htmlFor="messageFormat" className="ws-form__label">
          Message Format
        </label>
        <select
          id="messageFormat"
          className="ws-form__select"
          value={(values.messageFormat as string) || 'json'}
          onChange={(e) => handleFieldChange('messageFormat', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="json">JSON (Most Common)</option>
          <option value="text">Plain Text</option>
          <option value="binary">Binary (ArrayBuffer)</option>
        </select>
      </div>
    </div>
  );

  // Render keep-alive settings
  const renderKeepaliveFields = () => (
    <div className="ws-form__keepalive">
      <div className="ws-form__field">
        <label htmlFor="pingInterval" className="ws-form__label">
          Ping Interval (ms)
        </label>
        <input
          id="pingInterval"
          type="number"
          className="ws-form__input"
          value={(values.pingInterval as number) || 30000}
          onChange={(e) => handleFieldChange('pingInterval', parseInt(e.target.value, 10))}
          placeholder="30000"
          disabled={disabled || isLoading}
          min={0}
        />
        <span className="ws-form__hint">
          Interval for sending ping messages (0 to disable)
        </span>
      </div>

      <div className="ws-form__field">
        <label htmlFor="pongTimeout" className="ws-form__label">
          Pong Timeout (ms)
        </label>
        <input
          id="pongTimeout"
          type="number"
          className="ws-form__input"
          value={(values.pongTimeout as number) || 5000}
          onChange={(e) => handleFieldChange('pongTimeout', parseInt(e.target.value, 10))}
          placeholder="5000"
          disabled={disabled || isLoading}
          min={1000}
        />
      </div>
    </div>
  );

  // Render reconnection settings
  const renderReconnectionFields = () => (
    <div className="ws-form__reconnection">
      <div className="ws-form__field">
        <label className="ws-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.autoReconnect as boolean) !== false}
            onChange={(e) => handleFieldChange('autoReconnect', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Auto Reconnect
        </label>
      </div>

      {values.autoReconnect !== false && (
        <>
          <div className="ws-form__field">
            <label htmlFor="maxReconnectAttempts" className="ws-form__label">
              Max Reconnect Attempts
            </label>
            <input
              id="maxReconnectAttempts"
              type="number"
              className="ws-form__input"
              value={(values.maxReconnectAttempts as number) || 10}
              onChange={(e) => handleFieldChange('maxReconnectAttempts', parseInt(e.target.value, 10))}
              placeholder="10"
              disabled={disabled || isLoading}
              min={0}
            />
            <span className="ws-form__hint">
              0 for unlimited attempts
            </span>
          </div>

          <div className="ws-form__field">
            <label htmlFor="reconnectDelay" className="ws-form__label">
              Initial Reconnect Delay (ms)
            </label>
            <input
              id="reconnectDelay"
              type="number"
              className="ws-form__input"
              value={(values.reconnectDelay as number) || 1000}
              onChange={(e) => handleFieldChange('reconnectDelay', parseInt(e.target.value, 10))}
              placeholder="1000"
              disabled={disabled || isLoading}
              min={100}
            />
            <span className="ws-form__hint">
              Uses exponential backoff
            </span>
          </div>
        </>
      )}
    </div>
  );

  // Render message console
  const renderConsole = () => (
    <div className="ws-form__console">
      <div className="ws-form__console-messages">
        {messages.length === 0 ? (
          <div className="ws-form__console-empty">
            No messages yet. Connect and send a test message.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`ws-form__console-message ws-form__console-message--${msg.direction}`}
            >
              <span className="ws-form__console-direction">
                {msg.direction === 'sent' ? '→' : '←'}
              </span>
              <span className="ws-form__console-time">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              <pre className="ws-form__console-data">
                {typeof msg.data === 'object' 
                  ? JSON.stringify(msg.data, null, 2) 
                  : String(msg.data)}
              </pre>
            </div>
          ))
        )}
      </div>

      {onSendTestMessage && (
        <div className="ws-form__console-input">
          <textarea
            className="ws-form__textarea ws-form__textarea--code"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder='{"type": "ping"}'
            disabled={disabled || isLoading || connectionState !== 'authenticated'}
            rows={2}
          />
          <button
            type="button"
            className="ws-form__send-button"
            onClick={handleSendTestMessage}
            disabled={disabled || isLoading || connectionState !== 'authenticated' || !testMessage.trim()}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );

  return (
    <form
      className={`ws-form ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Provider Selection */}
      <div className="ws-form__group">
        {renderGroupHeader('provider', 'Select Provider')}
        {expandedGroups.provider && (
          <div className="ws-form__group-content">
            {renderProviderSelector()}
          </div>
        )}
      </div>

      {/* Connection */}
      <div className="ws-form__group">
        {renderGroupHeader('connection', 'Connection', undefined,
          <span className={`ws-form__badge ws-form__badge--${getStateColor(connectionState)}`}>
            {connectionState}
          </span>
        )}
        {expandedGroups.connection && (
          <div className="ws-form__group-content">
            {renderConnectionFields()}
          </div>
        )}
      </div>

      {/* Authentication */}
      <div className="ws-form__group">
        {renderGroupHeader('authentication', 'Authentication', undefined,
          !needsAuth ? (
            <span className="ws-form__badge ws-form__badge--info">No Auth</span>
          ) : values.authToken ? (
            <span className="ws-form__badge ws-form__badge--security">🔑 Configured</span>
          ) : null
        )}
        {expandedGroups.authentication && (
          <div className="ws-form__group-content">
            {renderAuthenticationFields()}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="ws-form__group">
        {renderGroupHeader('messages', 'Message Format')}
        {expandedGroups.messages && (
          <div className="ws-form__group-content">
            {renderMessageFields()}
          </div>
        )}
      </div>

      {/* Keep-Alive */}
      <div className="ws-form__group">
        {renderGroupHeader('keepalive', 'Keep-Alive')}
        {expandedGroups.keepalive && (
          <div className="ws-form__group-content">
            {renderKeepaliveFields()}
          </div>
        )}
      </div>

      {/* Reconnection */}
      <div className="ws-form__group">
        {renderGroupHeader('reconnection', 'Reconnection')}
        {expandedGroups.reconnection && (
          <div className="ws-form__group-content">
            {renderReconnectionFields()}
          </div>
        )}
      </div>

      {/* Console */}
      <div className="ws-form__group">
        {renderGroupHeader('console', 'Message Console', 'Test your connection')}
        {expandedGroups.console && (
          <div className="ws-form__group-content">
            {renderConsole()}
          </div>
        )}
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="ws-form__actions">
          <button
            type="submit"
            className="ws-form__submit"
            disabled={disabled || isLoading || !values.url}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </form>
  );
};

/**
 * Hook for managing WebSocket credential form state
 */
export function useWebSocketCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>('disconnected');
  const [messages, setMessages] = useState<Array<{ direction: 'sent' | 'received'; data: unknown; timestamp: number }>>([]);

  const executor = useMemo(() => new WebSocketHandshakeExecutor(), []);

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
    setConnectionState('disconnected');
    setMessages([]);
  }, []);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(async () => {
    executor.setEventHandlers({
      onStateChange: setConnectionState,
      onMessage: (data) => {
        setMessages(prev => [...prev, { direction: 'received', data, timestamp: Date.now() }]);
      },
    });

    return executor.connect(values as any);
  }, [values, executor]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    executor.disconnect();
  }, [executor]);

  /**
   * Toggle connection
   */
  const toggleConnection = useCallback(async () => {
    if (executor.isConnected()) {
      disconnect();
    } else {
      await connect();
    }
  }, [connect, disconnect, executor]);

  /**
   * Send a test message
   */
  const sendTestMessage = useCallback((message: string) => {
    try {
      const data = message.startsWith('{') ? JSON.parse(message) : message;
      const sent = executor.send(data);
      if (sent) {
        setMessages(prev => [...prev, { direction: 'sent', data, timestamp: Date.now() }]);
      }
    } catch {
      // Send as plain text if JSON parse fails
      executor.send(message);
      setMessages(prev => [...prev, { direction: 'sent', data: message, timestamp: Date.now() }]);
    }
  }, [executor]);

  return {
    values,
    errors,
    isDirty,
    connectionState,
    messages,
    handleChange,
    validate,
    reset,
    setErrors,
    connect,
    disconnect,
    toggleConnection,
    sendTestMessage,
  };
}

export default WebSocketCredentialFormFields;
