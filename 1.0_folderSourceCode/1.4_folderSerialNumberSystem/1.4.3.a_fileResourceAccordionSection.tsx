// ============================================
// PROTOCOL OS - RESOURCE ACCORDION SECTION
// ============================================
// Address: 1.4.3.a
// Purpose: Main Container for Resource Configuration UI
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import { ResourceAccordionHeader } from './1.4.3.b_fileResourceAccordionHeader';
import { ResourceFormFields } from './1.4.3.c_fileResourceFormFields';
import { ResourceAddHandshakeButton } from './1.4.3.d_fileResourceAddHandshakeButton';
import type { ResourceSerialNumber, ResourceType, ResourceStatus } from '../1.4.1.b_fileResourceSerialNumberGenerator';
import type { HandshakeSerialNumber, HandshakeType, HandshakeOutcome } from '../1.4.1.c_fileHandshakeSerialNumberGenerator';
import './1.4.3.e_fileResourceAccordionSection.css';

/**
 * Resource Accordion Section
 * 
 * Provides a collapsible accordion interface for managing
 * resource configurations and their associated handshakes.
 * 
 * Features:
 * - Expandable/collapsible sections
 * - Resource metadata display
 * - Handshake history
 * - Status indicators
 * - Action buttons
 * - Credential management
 */

/**
 * Resource configuration data
 */
export interface ResourceConfiguration {
  /** Serial number */
  serial: ResourceSerialNumber;
  
  /** Display name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Resource type */
  resourceType: ResourceType;
  
  /** Resource status */
  status: ResourceStatus;
  
  /** Parent platform serial */
  platformSerial: string;
  
  /** Associated handshakes */
  handshakes: HandshakeSerialNumber[];
  
  /** Endpoint URL (if applicable) */
  endpointUrl?: string;
  
  /** Last successful handshake */
  lastSuccessfulHandshake?: Date;
  
  /** Token expiration (if applicable) */
  tokenExpiresAt?: Date;
  
  /** Creation date */
  createdAt: Date;
  
  /** Last modified date */
  updatedAt: Date;
  
  /** Last used date */
  lastUsedAt?: Date;
  
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Resource accordion section props
 */
export interface ResourceAccordionSectionProps {
  /** Resource configuration */
  resource: ResourceConfiguration;
  
  /** Is section expanded */
  isExpanded?: boolean;
  
  /** Default expanded state */
  defaultExpanded?: boolean;
  
  /** Controlled expansion change handler */
  onExpandedChange?: (expanded: boolean) => void;
  
  /** Resource update handler */
  onUpdate?: (resource: ResourceConfiguration) => void;
  
  /** Resource delete handler */
  onDelete?: (serial: string) => void;
  
  /** Resource test connection handler */
  onTestConnection?: (serial: string) => Promise<boolean>;
  
  /** Resource refresh tokens handler */
  onRefreshTokens?: (serial: string) => Promise<boolean>;
  
  /** Handshake add handler */
  onAddHandshake?: (resourceSerial: string, handshakeType: HandshakeType) => void;
  
  /** Handshake select handler */
  onSelectHandshake?: (handshakeSerial: string) => void;
  
  /** Is loading */
  isLoading?: boolean;
  
  /** Is testing connection */
  isTesting?: boolean;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Show actions */
  showActions?: boolean;
  
  /** Show handshakes */
  showHandshakes?: boolean;
  
  /** Max handshakes to display */
  maxHandshakesDisplay?: number;
  
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
 * Resource Accordion Section Component
 */
export const ResourceAccordionSection: React.FC<ResourceAccordionSectionProps> = ({
  resource,
  isExpanded: controlledExpanded,
  defaultExpanded = false,
  onExpandedChange,
  onUpdate,
  onDelete,
  onTestConnection,
  onRefreshTokens,
  onAddHandshake,
  onSelectHandshake,
  isLoading = false,
  isTesting = false,
  disabled = false,
  showActions = true,
  showHandshakes = true,
  maxHandshakesDisplay = 10,
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
  const [editedValues, setEditedValues] = useState<Partial<ResourceConfiguration>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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
      name: resource.name,
      description: resource.description,
      endpointUrl: resource.endpointUrl,
    });
  }, [resource]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedValues({});
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (onUpdate) {
      onUpdate({
        ...resource,
        ...editedValues,
        updatedAt: new Date(),
      });
    }
    setIsEditing(false);
    setEditedValues({});
  }, [resource, editedValues, onUpdate]);

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    setEditedValues(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Are you sure you want to delete resource "${resource.name}"? This will also delete all associated handshakes.`)) {
      onDelete?.(resource.serial.serial);
    }
  }, [resource, onDelete]);

  const handleTestConnection = useCallback(async () => {
    if (!onTestConnection) return;
    
    setTestResult(null);
    try {
      const success = await onTestConnection(resource.serial.serial);
      setTestResult({
        success,
        message: success ? 'Connection successful!' : 'Connection failed',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Test failed',
      });
    }
  }, [resource, onTestConnection]);

  const handleRefreshTokens = useCallback(async () => {
    if (!onRefreshTokens) return;
    
    try {
      await onRefreshTokens(resource.serial.serial);
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }, [resource, onRefreshTokens]);

  const handleAddHandshake = useCallback((handshakeType: HandshakeType) => {
    onAddHandshake?.(resource.serial.serial, handshakeType);
  }, [resource, onAddHandshake]);

  // ============================================
  // COMPUTED
  // ============================================

  const handshakeStats = useMemo(() => {
    const total = resource.handshakes.length;
    const successful = resource.handshakes.filter(h => 
      h.metadata.outcome === 'OK' || h.metadata.outcome === 'REFRESH'
    ).length;
    const failed = resource.handshakes.filter(h => h.metadata.outcome === 'FAIL').length;
    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
    
    return { total, successful, failed, successRate };
  }, [resource.handshakes]);

  const recentHandshakes = useMemo(() => {
    return [...resource.handshakes]
      .sort((a, b) => b.metadata.startedAt.getTime() - a.metadata.startedAt.getTime())
      .slice(0, maxHandshakesDisplay);
  }, [resource.handshakes, maxHandshakesDisplay]);

  const isTokenExpiring = useMemo(() => {
    if (!resource.tokenExpiresAt) return false;
    const hoursUntilExpiry = (resource.tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 24 && hoursUntilExpiry > 0;
  }, [resource.tokenExpiresAt]);

  const isTokenExpired = useMemo(() => {
    if (!resource.tokenExpiresAt) return false;
    return resource.tokenExpiresAt.getTime() < Date.now();
  }, [resource.tokenExpiresAt]);

  // ============================================
  // RENDER
  // ============================================

  const sectionClasses = [
    'resource-accordion-section',
    isExpanded ? 'resource-accordion-section--expanded' : '',
    `resource-accordion-section--${resource.status}`,
    `resource-accordion-section--type-${resource.resourceType}`,
    isLoading ? 'resource-accordion-section--loading' : '',
    disabled ? 'resource-accordion-section--disabled' : '',
    isEditing ? 'resource-accordion-section--editing' : '',
    isTokenExpired ? 'resource-accordion-section--token-expired' : '',
    isTokenExpiring ? 'resource-accordion-section--token-expiring' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={sectionClasses} style={style}>
      {/* Header */}
      <ResourceAccordionHeader
        resource={resource}
        isExpanded={isExpanded}
        isEditing={isEditing}
        isLoading={isLoading}
        isTesting={isTesting}
        disabled={disabled}
        handshakeCount={handshakeStats.total}
        successRate={handshakeStats.successRate}
        isTokenExpiring={isTokenExpiring}
        isTokenExpired={isTokenExpired}
        showActions={showActions}
        allowEdit={allowEdit}
        allowDelete={allowDelete}
        onToggle={handleToggleExpand}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTestConnection={onTestConnection ? handleTestConnection : undefined}
        onRefreshTokens={onRefreshTokens ? handleRefreshTokens : undefined}
      />

      {/* Content */}
      <div 
        className="resource-accordion-section__content"
        aria-hidden={!isExpanded}
      >
        <div className="resource-accordion-section__content-inner">
          {/* Test Result */}
          {testResult && (
            <div className={`resource-accordion-section__test-result resource-accordion-section__test-result--${testResult.success ? 'success' : 'error'}`}>
              <span className="resource-accordion-section__test-result-icon">
                {testResult.success ? '✓' : '✗'}
              </span>
              <span className="resource-accordion-section__test-result-message">
                {testResult.message}
              </span>
              <button
                type="button"
                className="resource-accordion-section__test-result-dismiss"
                onClick={() => setTestResult(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {/* Resource Details */}
          <div className="resource-accordion-section__details">
            <ResourceFormFields
              values={isEditing ? { ...resource, ...editedValues } : resource}
              onChange={handleFieldChange}
              isEditing={isEditing}
              disabled={disabled || isLoading}
              resourceType={resource.resourceType}
            />

            {/* Edit Actions */}
            {isEditing && (
              <div className="resource-accordion-section__edit-actions">
                <button
                  type="button"
                  className="resource-accordion-section__btn resource-accordion-section__btn--secondary"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="resource-accordion-section__btn resource-accordion-section__btn--primary"
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Token Status */}
          {resource.tokenExpiresAt && (
            <div className={`resource-accordion-section__token-status ${
              isTokenExpired ? 'resource-accordion-section__token-status--expired' :
              isTokenExpiring ? 'resource-accordion-section__token-status--expiring' :
              'resource-accordion-section__token-status--valid'
            }`}>
              <span className="resource-accordion-section__token-status-icon">
                {isTokenExpired ? '⚠️' : isTokenExpiring ? '⏰' : '✓'}
              </span>
              <span className="resource-accordion-section__token-status-text">
                {isTokenExpired 
                  ? 'Token expired' 
                  : isTokenExpiring
                    ? `Token expires ${formatRelativeTime(resource.tokenExpiresAt)}`
                    : `Token valid until ${resource.tokenExpiresAt.toLocaleString()}`
                }
              </span>
              {(isTokenExpired || isTokenExpiring) && onRefreshTokens && (
                <button
                  type="button"
                  className="resource-accordion-section__token-refresh-btn"
                  onClick={handleRefreshTokens}
                  disabled={isLoading}
                >
                  Refresh Token
                </button>
              )}
            </div>
          )}

          {/* Handshakes Section */}
          {showHandshakes && (
            <div className="resource-accordion-section__handshakes">
              <div className="resource-accordion-section__handshakes-header">
                <h4 className="resource-accordion-section__handshakes-title">
                  Handshake History
                  <span className="resource-accordion-section__handshakes-count">
                    ({handshakeStats.total})
                  </span>
                </h4>
                
                {/* Handshake Stats */}
                {handshakeStats.total > 0 && (
                  <div className="resource-accordion-section__handshake-stats">
                    <span className="resource-accordion-section__stat resource-accordion-section__stat--success">
                      ✓ {handshakeStats.successful}
                    </span>
                    <span className="resource-accordion-section__stat resource-accordion-section__stat--error">
                      ✗ {handshakeStats.failed}
                    </span>
                    <span className="resource-accordion-section__stat">
                      {handshakeStats.successRate}% success
                    </span>
                  </div>
                )}
              </div>

              {/* Handshake List */}
              {recentHandshakes.length > 0 ? (
                <div className="resource-accordion-section__handshake-list">
                  {recentHandshakes.map(handshake => (
                    <div
                      key={handshake.serial}
                      className={`resource-accordion-section__handshake-item resource-accordion-section__handshake-item--${handshake.metadata.outcome.toLowerCase()}`}
                      onClick={() => onSelectHandshake?.(handshake.serial)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onSelectHandshake?.(handshake.serial);
                        }
                      }}
                    >
                      <div className="resource-accordion-section__handshake-outcome">
                        {getOutcomeIcon(handshake.metadata.outcome)}
                      </div>
                      <div className="resource-accordion-section__handshake-info">
                        <span className="resource-accordion-section__handshake-type">
                          {handshake.metadata.handshakeType}
                        </span>
                        <span className="resource-accordion-section__handshake-time">
                          {formatRelativeTime(handshake.metadata.startedAt)}
                        </span>
                      </div>
                      <div className="resource-accordion-section__handshake-duration">
                        {handshake.metadata.durationMs !== undefined && (
                          <span>{handshake.metadata.durationMs}ms</span>
                        )}
                      </div>
                      <div className="resource-accordion-section__handshake-status">
                        <span className={`resource-accordion-section__outcome-badge resource-accordion-section__outcome-badge--${handshake.metadata.outcome.toLowerCase()}`}>
                          {handshake.metadata.outcome}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {resource.handshakes.length > maxHandshakesDisplay && (
                    <div className="resource-accordion-section__handshake-more">
                      +{resource.handshakes.length - maxHandshakesDisplay} more handshakes
                    </div>
                  )}
                </div>
              ) : (
                <div className="resource-accordion-section__no-handshakes">
                  <p>No handshakes recorded yet.</p>
                  <p>Test the connection or make an API call to create handshakes.</p>
                </div>
              )}

              {/* Add Handshake Button */}
              {onAddHandshake && !disabled && (
                <ResourceAddHandshakeButton
                  onAddHandshake={handleAddHandshake}
                  disabled={disabled || isLoading}
                  resourceType={resource.resourceType}
                />
              )}
            </div>
          )}

          {/* Serial Info */}
          <div className="resource-accordion-section__serial-info">
            <div className="resource-accordion-section__serial-row">
              <span className="resource-accordion-section__serial-label">Serial:</span>
              <code className="resource-accordion-section__serial-value">
                {resource.serial.serial}
              </code>
            </div>
            <div className="resource-accordion-section__serial-row">
              <span className="resource-accordion-section__serial-label">Platform:</span>
              <code className="resource-accordion-section__serial-value">
                {resource.platformSerial}
              </code>
            </div>
            <div className="resource-accordion-section__serial-row">
              <span className="resource-accordion-section__serial-label">Created:</span>
              <span className="resource-accordion-section__serial-value">
                {resource.createdAt.toLocaleDateString()} {resource.createdAt.toLocaleTimeString()}
              </span>
            </div>
            {resource.lastUsedAt && (
              <div className="resource-accordion-section__serial-row">
                <span className="resource-accordion-section__serial-label">Last Used:</span>
                <span className="resource-accordion-section__serial-value">
                  {formatRelativeTime(resource.lastUsedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Get icon for handshake outcome
 */
function getOutcomeIcon(outcome: HandshakeOutcome): string {
  const icons: Record<HandshakeOutcome, string> = {
    OK: '✓',
    FAIL: '✗',
    TIMEOUT: '⏱',
    REFRESH: '↻',
    REVOKE: '⊘',
    PARTIAL: '◐',
    RETRY: '↺',
    PENDING: '⋯',
  };
  return icons[outcome] || '?';
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  
  return date.toLocaleDateString();
}

/**
 * Resource Accordion Group - manages multiple resource accordions
 */
export interface ResourceAccordionGroupProps {
  /** Resources to display */
  resources: ResourceConfiguration[];
  
  /** Allow multiple expanded */
  allowMultiple?: boolean;
  
  /** Initially expanded resource serials */
  defaultExpandedSerials?: string[];
  
  /** All handlers from ResourceAccordionSectionProps */
  onUpdate?: (resource: ResourceConfiguration) => void;
  onDelete?: (serial: string) => void;
  onTestConnection?: (serial: string) => Promise<boolean>;
  onRefreshTokens?: (serial: string) => Promise<boolean>;
  onAddHandshake?: (resourceSerial: string, handshakeType: HandshakeType) => void;
  onSelectHandshake?: (handshakeSerial: string) => void;
  
  /** Custom class name */
  className?: string;
}

export const ResourceAccordionGroup: React.FC<ResourceAccordionGroupProps> = ({
  resources,
  allowMultiple = false,
  defaultExpandedSerials = [],
  onUpdate,
  onDelete,
  onTestConnection,
  onRefreshTokens,
  onAddHandshake,
  onSelectHandshake,
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
    <div className={`resource-accordion-group ${className}`}>
      {resources.map(resource => (
        <ResourceAccordionSection
          key={resource.serial.serial}
          resource={resource}
          isExpanded={expandedSerials.has(resource.serial.serial)}
          onExpandedChange={(expanded) => handleExpandedChange(resource.serial.serial, expanded)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onTestConnection={onTestConnection}
          onRefreshTokens={onRefreshTokens}
          onAddHandshake={onAddHandshake}
          onSelectHandshake={onSelectHandshake}
        />
      ))}
      
      {resources.length === 0 && (
        <div className="resource-accordion-group__empty">
          <p>No resources configured.</p>
          <p>Add a resource to start making API connections.</p>
        </div>
      )}
    </div>
  );
};

export default ResourceAccordionSection;
