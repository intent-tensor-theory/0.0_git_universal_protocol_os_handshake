// ============================================
// PROTOCOL OS - HANDSHAKE MODEL INPUT WITH WHITEPAPER
// ============================================
// Address: 1.4.4.e
// Purpose: Protocol Model Display with ITT Principles
// ============================================

import React, { useState, useMemo } from 'react';
import type { ProtocolConfig } from './1.4.4.a_fileHandshakeAccordionSection';
import type { HandshakeType } from '../1.4.1.c_fileHandshakeSerialNumberGenerator';

/**
 * Handshake Model Input with Whitepaper
 * 
 * Displays protocol model information with references to
 * Intent Tensor Theory principles and documentation:
 * - Protocol flow diagrams
 * - ITT operator mappings
 * - Whitepaper references
 * - Best practices
 */

/**
 * Protocol model definition
 */
export interface ProtocolModel {
  id: string;
  name: string;
  description: string;
  flowSteps: FlowStep[];
  ittOperators: ITTOperatorMapping[];
  whitepaperReferences: WhitepaperReference[];
  bestPractices: string[];
}

/**
 * Flow step in protocol
 */
export interface FlowStep {
  id: string;
  order: number;
  name: string;
  description: string;
  type: 'request' | 'response' | 'redirect' | 'validation' | 'storage';
  isOptional?: boolean;
}

/**
 * ITT Operator mapping
 */
export interface ITTOperatorMapping {
  operator: string;
  symbol: string;
  description: string;
  appliesTo: string;
}

/**
 * Whitepaper reference
 */
export interface WhitepaperReference {
  title: string;
  section: string;
  url?: string;
  description: string;
}

/**
 * Protocol models database
 */
const PROTOCOL_MODELS: Record<string, ProtocolModel> = {
  'oauth-pkce': {
    id: 'oauth-pkce',
    name: 'OAuth 2.0 with PKCE',
    description: 'Proof Key for Code Exchange - Secure authorization for public clients',
    flowSteps: [
      {
        id: 'generate-verifier',
        order: 1,
        name: 'Generate Code Verifier',
        description: 'Create cryptographically random code verifier',
        type: 'validation',
      },
      {
        id: 'generate-challenge',
        order: 2,
        name: 'Generate Code Challenge',
        description: 'Hash verifier using SHA-256 (S256 method)',
        type: 'validation',
      },
      {
        id: 'authorization-request',
        order: 3,
        name: 'Authorization Request',
        description: 'Redirect to authorization server with challenge',
        type: 'redirect',
      },
      {
        id: 'user-authentication',
        order: 4,
        name: 'User Authentication',
        description: 'User authenticates with authorization server',
        type: 'request',
      },
      {
        id: 'authorization-callback',
        order: 5,
        name: 'Authorization Callback',
        description: 'Receive authorization code via redirect',
        type: 'response',
      },
      {
        id: 'token-exchange',
        order: 6,
        name: 'Token Exchange',
        description: 'Exchange code + verifier for tokens',
        type: 'request',
      },
      {
        id: 'token-storage',
        order: 7,
        name: 'Token Storage',
        description: 'Securely store access and refresh tokens',
        type: 'storage',
      },
    ],
    ittOperators: [
      {
        operator: 'Δ₁',
        symbol: 'Δ₁',
        description: 'Authentication Genesis',
        appliesTo: 'Initial PKCE challenge generation',
      },
      {
        operator: 'Δ₂',
        symbol: 'Δ₂',
        description: 'Credential Transformation',
        appliesTo: 'Code verifier to challenge hash',
      },
      {
        operator: 'Δ₃',
        symbol: 'Δ₃',
        description: 'State Validation',
        appliesTo: 'CSRF state parameter verification',
      },
      {
        operator: 'Δ₄',
        symbol: 'Δ₄',
        description: 'Token Collapse',
        appliesTo: 'Authorization code to token exchange',
      },
    ],
    whitepaperReferences: [
      {
        title: 'Intent Tensor Theory Coordinate System',
        section: 'ICHTB Fan Surfaces',
        url: 'https://intent-tensor-theory.com/coordinate-system',
        description: 'Maps OAuth flow to ICHTB coordinate transformations',
      },
      {
        title: 'Ghostless Coding Architecture',
        section: 'Authentication Patterns',
        url: 'https://medium.com/@intent.tensor.theory/ghostless-coding-architecture',
        description: 'Semantic naming for OAuth components',
      },
    ],
    bestPractices: [
      'Always use S256 challenge method over plain',
      'Store tokens in secure, encrypted storage',
      'Implement token refresh before expiry',
      'Validate state parameter to prevent CSRF',
      'Use short-lived access tokens with refresh tokens',
    ],
  },
  'api-key': {
    id: 'api-key',
    name: 'API Key Authentication',
    description: 'Simple key-based authentication for API access',
    flowSteps: [
      {
        id: 'key-retrieval',
        order: 1,
        name: 'Key Retrieval',
        description: 'Retrieve API key from secure storage',
        type: 'storage',
      },
      {
        id: 'request-construction',
        order: 2,
        name: 'Request Construction',
        description: 'Add key to header/query/body based on placement',
        type: 'request',
      },
      {
        id: 'api-call',
        order: 3,
        name: 'API Call',
        description: 'Execute authenticated API request',
        type: 'request',
      },
      {
        id: 'response-handling',
        order: 4,
        name: 'Response Handling',
        description: 'Process API response and handle errors',
        type: 'response',
      },
    ],
    ittOperators: [
      {
        operator: 'Δ₁',
        symbol: 'Δ₁',
        description: 'Key Genesis',
        appliesTo: 'API key generation and storage',
      },
      {
        operator: 'Δ₅',
        symbol: 'Δ₅',
        description: 'Request Embedding',
        appliesTo: 'Key placement in request structure',
      },
    ],
    whitepaperReferences: [
      {
        title: 'The Writables Doctrine',
        section: 'Credential Management',
        url: 'https://medium.com/@intent.tensor.theory/the-writables-doctrine',
        description: 'Secure credential storage patterns',
      },
    ],
    bestPractices: [
      'Never expose API keys in client-side code',
      'Rotate keys regularly',
      'Use environment variables for key storage',
      'Implement key scope restrictions',
      'Monitor key usage for anomalies',
    ],
  },
};

/**
 * Default model for unknown protocols
 */
const DEFAULT_MODEL: ProtocolModel = {
  id: 'default',
  name: 'Custom Protocol',
  description: 'Custom or unsupported protocol configuration',
  flowSteps: [
    {
      id: 'configure',
      order: 1,
      name: 'Configure Request',
      description: 'Set up request parameters and authentication',
      type: 'request',
    },
    {
      id: 'execute',
      order: 2,
      name: 'Execute Request',
      description: 'Send request to target endpoint',
      type: 'request',
    },
    {
      id: 'handle-response',
      order: 3,
      name: 'Handle Response',
      description: 'Process response and extract data',
      type: 'response',
    },
  ],
  ittOperators: [],
  whitepaperReferences: [
    {
      title: 'Intent Tensor Theory',
      section: 'Overview',
      url: 'https://intent-tensor-theory.com',
      description: 'Core framework documentation',
    },
  ],
  bestPractices: [
    'Document custom protocol requirements',
    'Implement proper error handling',
    'Use consistent naming conventions',
  ],
};

/**
 * Handshake model input with whitepaper props
 */
export interface HandshakeModelInputWithWhitepaperProps {
  /** Handshake type */
  handshakeType: HandshakeType;
  
  /** Protocol configuration */
  protocol: ProtocolConfig;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Is expanded by default */
  defaultExpanded?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Handshake Model Input with Whitepaper Component
 */
export const HandshakeModelInputWithWhitepaper: React.FC<HandshakeModelInputWithWhitepaperProps> = ({
  handshakeType,
  protocol,
  disabled = false,
  defaultExpanded = false,
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeSection, setActiveSection] = useState<'flow' | 'itt' | 'references' | 'practices'>('flow');

  // ============================================
  // COMPUTED
  // ============================================

  const model = useMemo(() => {
    return PROTOCOL_MODELS[protocol.id] || DEFAULT_MODEL;
  }, [protocol.id]);

  const handshakeTypeInfo = useMemo(() => {
    const typeInfoMap: Record<HandshakeType, { icon: string; description: string }> = {
      auth: { icon: '🔐', description: 'Initial authentication handshake' },
      refresh: { icon: '↻', description: 'Token refresh operation' },
      revoke: { icon: '⊘', description: 'Token revocation' },
      validate: { icon: '✓', description: 'Token validation check' },
      request: { icon: '📡', description: 'API request with authentication' },
      health: { icon: '💚', description: 'Service health check' },
      webhook: { icon: '🔔', description: 'Webhook event handler' },
    };
    return typeInfoMap[handshakeType] || { icon: '📡', description: 'Unknown type' };
  }, [handshakeType]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`handshake-model-whitepaper ${className}`}>
      {/* Header */}
      <div 
        className={`handshake-model-whitepaper__header ${isExpanded ? 'handshake-model-whitepaper__header--expanded' : ''}`}
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={isExpanded}
      >
        <div className="handshake-model-whitepaper__header-icon">
          📘
        </div>
        <div className="handshake-model-whitepaper__header-info">
          <h4 className="handshake-model-whitepaper__title">
            Protocol Model: {model.name}
          </h4>
          <p className="handshake-model-whitepaper__subtitle">
            {handshakeTypeInfo.icon} {handshakeTypeInfo.description} • {model.flowSteps.length} steps
          </p>
        </div>
        <div className="handshake-model-whitepaper__toggle">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="handshake-model-whitepaper__content">
          {/* Section Tabs */}
          <div className="handshake-model-whitepaper__tabs">
            <button
              type="button"
              className={`handshake-model-whitepaper__tab ${activeSection === 'flow' ? 'handshake-model-whitepaper__tab--active' : ''}`}
              onClick={() => setActiveSection('flow')}
            >
              Flow Steps
            </button>
            {model.ittOperators.length > 0 && (
              <button
                type="button"
                className={`handshake-model-whitepaper__tab ${activeSection === 'itt' ? 'handshake-model-whitepaper__tab--active' : ''}`}
                onClick={() => setActiveSection('itt')}
              >
                ITT Operators
              </button>
            )}
            <button
              type="button"
              className={`handshake-model-whitepaper__tab ${activeSection === 'references' ? 'handshake-model-whitepaper__tab--active' : ''}`}
              onClick={() => setActiveSection('references')}
            >
              References
            </button>
            <button
              type="button"
              className={`handshake-model-whitepaper__tab ${activeSection === 'practices' ? 'handshake-model-whitepaper__tab--active' : ''}`}
              onClick={() => setActiveSection('practices')}
            >
              Best Practices
            </button>
          </div>

          {/* Flow Steps Section */}
          {activeSection === 'flow' && (
            <div className="handshake-model-whitepaper__section">
              <p className="handshake-model-whitepaper__description">
                {model.description}
              </p>
              <div className="handshake-model-whitepaper__flow">
                {model.flowSteps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`handshake-model-whitepaper__step handshake-model-whitepaper__step--${step.type}`}
                  >
                    <div className="handshake-model-whitepaper__step-number">
                      {index + 1}
                    </div>
                    <div className="handshake-model-whitepaper__step-content">
                      <div className="handshake-model-whitepaper__step-header">
                        <span className="handshake-model-whitepaper__step-name">
                          {step.name}
                        </span>
                        <span className={`handshake-model-whitepaper__step-type handshake-model-whitepaper__step-type--${step.type}`}>
                          {step.type}
                        </span>
                        {step.isOptional && (
                          <span className="handshake-model-whitepaper__step-optional">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="handshake-model-whitepaper__step-description">
                        {step.description}
                      </p>
                    </div>
                    {index < model.flowSteps.length - 1 && (
                      <div className="handshake-model-whitepaper__step-connector">
                        ↓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ITT Operators Section */}
          {activeSection === 'itt' && model.ittOperators.length > 0 && (
            <div className="handshake-model-whitepaper__section">
              <p className="handshake-model-whitepaper__itt-intro">
                Intent Tensor Theory operators applied to this protocol:
              </p>
              <div className="handshake-model-whitepaper__operators">
                {model.ittOperators.map(op => (
                  <div key={op.operator} className="handshake-model-whitepaper__operator">
                    <div className="handshake-model-whitepaper__operator-symbol">
                      {op.symbol}
                    </div>
                    <div className="handshake-model-whitepaper__operator-info">
                      <div className="handshake-model-whitepaper__operator-name">
                        {op.description}
                      </div>
                      <div className="handshake-model-whitepaper__operator-applies">
                        Applies to: {op.appliesTo}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References Section */}
          {activeSection === 'references' && (
            <div className="handshake-model-whitepaper__section">
              <div className="handshake-model-whitepaper__references">
                {model.whitepaperReferences.map((ref, index) => (
                  <div key={index} className="handshake-model-whitepaper__reference">
                    <div className="handshake-model-whitepaper__reference-icon">
                      📄
                    </div>
                    <div className="handshake-model-whitepaper__reference-content">
                      <div className="handshake-model-whitepaper__reference-title">
                        {ref.url ? (
                          <a 
                            href={ref.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="handshake-model-whitepaper__reference-link"
                          >
                            {ref.title}
                          </a>
                        ) : (
                          ref.title
                        )}
                      </div>
                      <div className="handshake-model-whitepaper__reference-section">
                        Section: {ref.section}
                      </div>
                      <p className="handshake-model-whitepaper__reference-description">
                        {ref.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices Section */}
          {activeSection === 'practices' && (
            <div className="handshake-model-whitepaper__section">
              <ul className="handshake-model-whitepaper__practices">
                {model.bestPractices.map((practice, index) => (
                  <li key={index} className="handshake-model-whitepaper__practice">
                    <span className="handshake-model-whitepaper__practice-icon">✓</span>
                    {practice}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Compact whitepaper reference badge
 */
export interface WhitepaperBadgeProps {
  reference: WhitepaperReference;
  className?: string;
}

export const WhitepaperBadge: React.FC<WhitepaperBadgeProps> = ({
  reference,
  className = '',
}) => {
  return (
    <a
      href={reference.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`whitepaper-badge ${className}`}
      title={reference.description}
    >
      <span className="whitepaper-badge__icon">📘</span>
      <span className="whitepaper-badge__text">
        {reference.section}
      </span>
    </a>
  );
};

/**
 * ITT Operator tooltip
 */
export interface ITTOperatorTooltipProps {
  operator: ITTOperatorMapping;
  className?: string;
}

export const ITTOperatorTooltip: React.FC<ITTOperatorTooltipProps> = ({
  operator,
  className = '',
}) => {
  return (
    <span className={`itt-operator-tooltip ${className}`}>
      <span className="itt-operator-tooltip__symbol">{operator.symbol}</span>
      <span className="itt-operator-tooltip__popup">
        <strong>{operator.description}</strong>
        <br />
        {operator.appliesTo}
      </span>
    </span>
  );
};

export default HandshakeModelInputWithWhitepaper;
