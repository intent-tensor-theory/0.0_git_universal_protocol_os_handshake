// ============================================
// PROTOCOL OS - HANDSHAKE ACCORDION SECTION
// ============================================
// Address: 1.4.4.a
// Purpose: Main Container for Handshake Configuration UI
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import { HandshakeAccordionHeader } from './1.4.4.b_fileHandshakeAccordionHeader';
import { HandshakeProtocolSelector } from './1.4.4.c_fileHandshakeProtocolSelector';
import { HandshakeCredentialFormContainer } from './1.4.4.d_fileHandshakeCredentialFormContainer';
import { HandshakeModelInputWithWhitepaper } from './1.4.4.e_fileHandshakeModelInputWithWhitepaper';
import { HandshakeDynamicInputSection } from './1.4.4.f_fileHandshakeDynamicInputSection';
import { HandshakeExecutionPanel } from './1.4.4.g_fileHandshakeExecutionPanel';
import { HandshakeSaveButton } from './1.4.4.h_fileHandshakeSaveButton';
import type { HandshakeSerialNumber, HandshakeType, HandshakeOutcome } from '../1.4.1.c_fileHandshakeSerialNumberGenerator';
import type { ResourceType } from '../1.4.1.b_fileResourceSerialNumberGenerator';
import './1.4.4.i_fileHandshakeAccordionSection.css';

/**
 * Handshake Accordion Section
 * 
 * Provides a comprehensive interface for configuring and
 * executing API handshakes with full protocol support.
 * 
 * Features:
 * - Protocol selection
 * - Credential management
 * - Dynamic input fields
 * - Execution with live results
 * - Save and replay capability
 */

/**
 * Protocol configuration
 */
export interface ProtocolConfig {
  id: string;
  name: string;
  type: ResourceType;
  version?: string;
  description?: string;
}

/**
 * Credential set for handshake
 */
export interface CredentialSet {
  id: string;
  name: string;
  type: 'oauth' | 'apikey' | 'basic' | 'bearer' | 'custom';
  values: Record<string, string>;
  isEncrypted: boolean;
  expiresAt?: Date;
}

/**
 * Handshake execution result
 */
export interface HandshakeExecutionResult {
  success: boolean;
  outcome: HandshakeOutcome;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: unknown;
  error?: string;
  durationMs: number;
  timestamp: Date;
}

/**
 * Handshake configuration data
 */
export interface HandshakeConfiguration {
  /** Serial number */
  serial: HandshakeSerialNumber;
  
  /** Display name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Handshake type */
  handshakeType: HandshakeType;
  
  /** Protocol configuration */
  protocol: ProtocolConfig;
  
  /** Credential set */
  credentials?: CredentialSet;
  
  /** Parent resource serial */
  resourceSerial: string;
  
  /** Request configuration */
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    params?: Record<string, string>;
    body?: unknown;
  };
  
  /** Last execution result */
  lastResult?: HandshakeExecutionResult;
  
  /** Execution history */
  executionHistory: HandshakeExecutionResult[];
  
  /** Creation date */
  createdAt: Date;
  
  /** Last modified date */
  updatedAt: Date;
  
  /** Is saved as template */
  isSavedTemplate: boolean;
  
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Handshake accordion section props
 */
export interface HandshakeAccordionSectionProps {
  /** Handshake configuration */
  handshake: HandshakeConfiguration;
  
  /** Available protocols */
  availableProtocols: ProtocolConfig[];
  
  /** Is section expanded */
  isExpanded?: boolean;
  
  /** Default expanded state */
  defaultExpanded?: boolean;
  
  /** Controlled expansion change handler */
  onExpandedChange?: (expanded: boolean) => void;
  
  /** Handshake update handler */
  onUpdate?: (handshake: HandshakeConfiguration) => void;
  
  /** Handshake delete handler */
  onDelete?: (serial: string) => void;
  
  /** Handshake execute handler */
  onExecute?: (handshake: HandshakeConfiguration) => Promise<HandshakeExecutionResult>;
  
  /** Handshake save as template handler */
  onSaveTemplate?: (handshake: HandshakeConfiguration) => void;
  
  /** Handshake duplicate handler */
  onDuplicate?: (handshake: HandshakeConfiguration) => void;
  
  /** Is loading */
  isLoading?: boolean;
  
  /** Is executing */
  isExecuting?: boolean;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Show execution panel */
  showExecutionPanel?: boolean;
  
  /** Show save button */
  showSaveButton?: boolean;
  
  /** Allow editing */
  allowEdit?: boolean;
  
  /** Allow delete */
  allowDelete?: boolean;
  
  /** Custom class name */
  className?: string;
  
  /** Custom styles */
  style?: React.CSSProperties;
}

/**
 * Handshake Accordion Section Component
 */
export const HandshakeAccordionSection: React.FC<HandshakeAccordionSectionProps> = ({
  handshake,
  availableProtocols,
  isExpanded: controlledExpanded,
  defaultExpanded = false,
  onExpandedChange,
  onUpdate,
  onDelete,
  onExecute,
  onSaveTemplate,
  onDuplicate,
  isLoading = false,
  isExecuting = false,
  disabled = false,
  showExecutionPanel = true,
  showSaveButton = true,
  allowEdit = true,
  allowDelete = true,
  className = '',
  style,
}) => {
  // ============================================
  // STATE
  // ============================================

  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Partial<HandshakeConfiguration>>({});
  const [activeTab, setActiveTab] = useState<'config' | 'execution' | 'history'>('config');
  const [executionResult, setExecutionResult] = useState<HandshakeExecutionResult | null>(
    handshake.lastResult || null
  );

  // Controlled vs uncontrolled expansion
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  // ============================================
  // HANDLERS
  // ============================================

  const handleToggleExpand = useCallback(() => {
    if (disabled) return;
    
    const newExpanded = !isExpanded;
    
    if (controlledExpanded === undefined) {
      setInternalExpanded(newExpanded);
    }
    
    onExpandedChange?.(newExpanded);
  }, [isExpanded, controlledExpanded, disabled, onExpandedChange]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditedValues({
      name: handshake.name,
      description: handshake.description,
      protocol: handshake.protocol,
      credentials: handshake.credentials,
      request: handshake.request,
    });
  }, [handshake]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedValues({});
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (onUpdate) {
      onUpdate({
        ...handshake,
        ...editedValues,
        updatedAt: new Date(),
      });
    }
    setIsEditing(false);
    setEditedValues({});
  }, [handshake, editedValues, onUpdate]);

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    setEditedValues(prev => {
      // Handle nested fields like 'request.method'
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof typeof prev] as Record<string, unknown> || {}),
            [child]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  }, []);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Are you sure you want to delete handshake "${handshake.name}"?`)) {
      onDelete?.(handshake.serial.serial);
    }
  }, [handshake, onDelete]);

  const handleExecute = useCallback(async () => {
    if (!onExecute) return;
    
    try {
      const result = await onExecute(handshake);
      setExecutionResult(result);
      setActiveTab('execution');
    } catch (error) {
      setExecutionResult({
        success: false,
        outcome: 'FAIL',
        error: error instanceof Error ? error.message : 'Execution failed',
        durationMs: 0,
        timestamp: new Date(),
      });
      setActiveTab('execution');
    }
  }, [handshake, onExecute]);

  const handleSaveTemplate = useCallback(() => {
    onSaveTemplate?.(handshake);
  }, [handshake, onSaveTemplate]);

  const handleDuplicate = useCallback(() => {
    onDuplicate?.(handshake);
  }, [handshake, onDuplicate]);

  const handleProtocolChange = useCallback((protocol: ProtocolConfig) => {
    handleFieldChange('protocol', protocol);
  }, [handleFieldChange]);

  const handleCredentialChange = useCallback((credentials: CredentialSet) => {
    handleFieldChange('credentials', credentials);
  }, [handleFieldChange]);

  const handleRequestChange = useCallback((request: HandshakeConfiguration['request']) => {
    handleFieldChange('request', request);
  }, [handleFieldChange]);

  // ============================================
  // COMPUTED
  // ============================================

  const currentValues = useMemo(() => {
    return isEditing ? { ...handshake, ...editedValues } : handshake;
  }, [isEditing, handshake, editedValues]);

  const executionStats = useMemo(() => {
    const history = handshake.executionHistory;
    const total = history.length;
    const successful = history.filter(h => h.success).length;
    const avgDuration = total > 0 
      ? Math.round(history.reduce((sum, h) => sum + h.durationMs, 0) / total)
      : 0;
    
    return { total, successful, avgDuration };
  }, [handshake.executionHistory]);

  // ============================================
  // RENDER
  // ============================================

  const sectionClasses = [
    'handshake-accordion-section',
    isExpanded ? 'handshake-accordion-section--expanded' : '',
    `handshake-accordion-section--${handshake.handshakeType}`,
    `handshake-accordion-section--outcome-${handshake.serial.metadata.outcome.toLowerCase()}`,
    isLoading ? 'handshake-accordion-section--loading' : '',
    isExecuting ? 'handshake-accordion-section--executing' : '',
    disabled ? 'handshake-accordion-section--disabled' : '',
    isEditing ? 'handshake-accordion-section--editing' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={sectionClasses} style={style}>
      {/* Header */}
      <HandshakeAccordionHeader
        handshake={handshake}
        isExpanded={isExpanded}
        isEditing={isEditing}
        isLoading={isLoading}
        isExecuting={isExecuting}
        disabled={disabled}
        executionCount={executionStats.total}
        successCount={executionStats.successful}
        avgDuration={executionStats.avgDuration}
        showActions={allowEdit || allowDelete}
        allowEdit={allowEdit}
        allowDelete={allowDelete}
        onToggle={handleToggleExpand}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExecute={onExecute ? handleExecute : undefined}
        onDuplicate={onDuplicate ? handleDuplicate : undefined}
      />

      {/* Content */}
      <div 
        className="handshake-accordion-section__content"
        aria-hidden={!isExpanded}
      >
        <div className="handshake-accordion-section__content-inner">
          {/* Tab Navigation */}
          <div className="handshake-accordion-section__tabs">
            <button
              type="button"
              className={`handshake-accordion-section__tab ${activeTab === 'config' ? 'handshake-accordion-section__tab--active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              Configuration
            </button>
            {showExecutionPanel && (
              <button
                type="button"
                className={`handshake-accordion-section__tab ${activeTab === 'execution' ? 'handshake-accordion-section__tab--active' : ''}`}
                onClick={() => setActiveTab('execution')}
              >
                Execution
                {executionResult && (
                  <span className={`handshake-accordion-section__tab-badge handshake-accordion-section__tab-badge--${executionResult.success ? 'success' : 'error'}`}>
                    {executionResult.success ? '✓' : '✗'}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              className={`handshake-accordion-section__tab ${activeTab === 'history' ? 'handshake-accordion-section__tab--active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
              <span className="handshake-accordion-section__tab-count">
                ({executionStats.total})
              </span>
            </button>
          </div>

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="handshake-accordion-section__config">
              {/* Protocol Selector */}
              <HandshakeProtocolSelector
                selectedProtocol={currentValues.protocol}
                availableProtocols={availableProtocols}
                onChange={handleProtocolChange}
                disabled={disabled || isLoading || !isEditing}
                isEditing={isEditing}
              />

              {/* Credential Form */}
              <HandshakeCredentialFormContainer
                credentials={currentValues.credentials}
                protocolType={currentValues.protocol.type}
                onChange={handleCredentialChange}
                disabled={disabled || isLoading || !isEditing}
                isEditing={isEditing}
              />

              {/* Model Input with Whitepaper */}
              <HandshakeModelInputWithWhitepaper
                handshakeType={currentValues.handshakeType}
                protocol={currentValues.protocol}
                disabled={disabled || isLoading}
              />

              {/* Dynamic Input Section */}
              <HandshakeDynamicInputSection
                request={currentValues.request}
                protocolType={currentValues.protocol.type}
                onChange={handleRequestChange}
                disabled={disabled || isLoading || !isEditing}
                isEditing={isEditing}
              />

              {/* Edit Actions */}
              {isEditing && (
                <div className="handshake-accordion-section__edit-actions">
                  <button
                    type="button"
                    className="handshake-accordion-section__btn handshake-accordion-section__btn--secondary"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="handshake-accordion-section__btn handshake-accordion-section__btn--primary"
                    onClick={handleSaveEdit}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Execution Tab */}
          {activeTab === 'execution' && showExecutionPanel && (
            <HandshakeExecutionPanel
              handshake={currentValues}
              result={executionResult}
              isExecuting={isExecuting}
              onExecute={handleExecute}
              disabled={disabled || isLoading}
            />
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="handshake-accordion-section__history">
              <h4 className="handshake-accordion-section__history-title">
                Execution History
              </h4>
              {handshake.executionHistory.length > 0 ? (
                <div className="handshake-accordion-section__history-list">
                  {handshake.executionHistory.slice().reverse().map((result, index) => (
                    <div 
                      key={index}
                      className={`handshake-accordion-section__history-item handshake-accordion-section__history-item--${result.success ? 'success' : 'error'}`}
                    >
                      <div className="handshake-accordion-section__history-outcome">
                        {result.success ? '✓' : '✗'}
                      </div>
                      <div className="handshake-accordion-section__history-info">
                        <span className="handshake-accordion-section__history-status">
                          {result.outcome} {result.statusCode && `(${result.statusCode})`}
                        </span>
                        <span className="handshake-accordion-section__history-time">
                          {result.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <div className="handshake-accordion-section__history-duration">
                        {result.durationMs}ms
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="handshake-accordion-section__no-history">
                  <p>No execution history yet.</p>
                  <p>Execute the handshake to see results here.</p>
                </div>
              )}
            </div>
          )}

          {/* Save Button */}
          {showSaveButton && (
            <HandshakeSaveButton
              handshake={currentValues}
              onSave={handleSaveTemplate}
              isSaved={handshake.isSavedTemplate}
              disabled={disabled || isLoading || isEditing}
            />
          )}

          {/* Serial Info */}
          <div className="handshake-accordion-section__serial-info">
            <div className="handshake-accordion-section__serial-row">
              <span className="handshake-accordion-section__serial-label">Serial:</span>
              <code className="handshake-accordion-section__serial-value">
                {handshake.serial.serial}
              </code>
            </div>
            <div className="handshake-accordion-section__serial-row">
              <span className="handshake-accordion-section__serial-label">Resource:</span>
              <code className="handshake-accordion-section__serial-value">
                {handshake.resourceSerial}
              </code>
            </div>
            <div className="handshake-accordion-section__serial-row">
              <span className="handshake-accordion-section__serial-label">Created:</span>
              <span className="handshake-accordion-section__serial-value">
                {handshake.createdAt.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Handshake Accordion Group - manages multiple handshake accordions
 */
export interface HandshakeAccordionGroupProps {
  /** Handshakes to display */
  handshakes: HandshakeConfiguration[];
  
  /** Available protocols */
  availableProtocols: ProtocolConfig[];
  
  /** Allow multiple expanded */
  allowMultiple?: boolean;
  
  /** Initially expanded handshake serials */
  defaultExpandedSerials?: string[];
  
  /** All handlers from HandshakeAccordionSectionProps */
  onUpdate?: (handshake: HandshakeConfiguration) => void;
  onDelete?: (serial: string) => void;
  onExecute?: (handshake: HandshakeConfiguration) => Promise<HandshakeExecutionResult>;
  onSaveTemplate?: (handshake: HandshakeConfiguration) => void;
  onDuplicate?: (handshake: HandshakeConfiguration) => void;
  
  /** Custom class name */
  className?: string;
}

export const HandshakeAccordionGroup: React.FC<HandshakeAccordionGroupProps> = ({
  handshakes,
  availableProtocols,
  allowMultiple = false,
  defaultExpandedSerials = [],
  onUpdate,
  onDelete,
  onExecute,
  onSaveTemplate,
  onDuplicate,
  className = '',
}) => {
  const [expandedSerials, setExpandedSerials] = useState<Set<string>>(
    new Set(defaultExpandedSerials)
  );

  const handleExpandedChange = useCallback((serial: string, expanded: boolean) => {
    setExpandedSerials(prev => {
      const next = new Set(allowMultiple ? prev : []);
      if (expanded) {
        next.add(serial);
      } else {
        next.delete(serial);
      }
      return next;
    });
  }, [allowMultiple]);

  return (
    <div className={`handshake-accordion-group ${className}`}>
      {handshakes.map(handshake => (
        <HandshakeAccordionSection
          key={handshake.serial.serial}
          handshake={handshake}
          availableProtocols={availableProtocols}
          isExpanded={expandedSerials.has(handshake.serial.serial)}
          onExpandedChange={(expanded) => handleExpandedChange(handshake.serial.serial, expanded)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onExecute={onExecute}
          onSaveTemplate={onSaveTemplate}
          onDuplicate={onDuplicate}
        />
      ))}
      
      {handshakes.length === 0 && (
        <div className="handshake-accordion-group__empty">
          <p>No handshakes configured.</p>
          <p>Add a handshake to start making API calls.</p>
        </div>
      )}
    </div>
  );
};

export default HandshakeAccordionSection;
