// ============================================
// PROTOCOL OS - RESOURCE ACCORDION HEADER
// ============================================
// Address: 1.4.3.b
// Purpose: Clickable Header for Resource Accordion
// ============================================

import React, { useCallback } from 'react';
import type { ResourceConfiguration } from './1.4.3.a_fileResourceAccordionSection';
import type { ResourceType, ResourceStatus } from '../1.4.1.b_fileResourceSerialNumberGenerator';

/**
 * Resource Accordion Header
 * 
 * Displays resource summary information and controls:
 * - Expand/collapse toggle
 * - Resource type icon
 * - Name and status badge
 * - Handshake stats
 * - Token status
 * - Action buttons
 */

/**
 * Resource accordion header props
 */
export interface ResourceAccordionHeaderProps {
  /** Resource configuration */
  resource: ResourceConfiguration;
  
  /** Is section expanded */
  isExpanded: boolean;
  
  /** Is in edit mode */
  isEditing: boolean;
  
  /** Is loading */
  isLoading: boolean;
  
  /** Is testing connection */
  isTesting: boolean;
  
  /** Is disabled */
  disabled: boolean;
  
  /** Total handshake count */
  handshakeCount: number;
  
  /** Success rate percentage */
  successRate: number;
  
  /** Is token expiring soon */
  isTokenExpiring: boolean;
  
  /** Is token expired */
  isTokenExpired: boolean;
  
  /** Show action buttons */
  showActions: boolean;
  
  /** Allow editing */
  allowEdit: boolean;
  
  /** Allow delete */
  allowDelete: boolean;
  
  /** Toggle expand handler */
  onToggle: () => void;
  
  /** Edit handler */
  onEdit: () => void;
  
  /** Delete handler */
  onDelete: () => void;
  
  /** Test connection handler */
  onTestConnection?: () => void;
  
  /** Refresh tokens handler */
  onRefreshTokens?: () => void;
}

/**
 * Resource type icons
 */
const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  oauth: '🔑',
  apikey: '🔒',
  graphql: '◈',
  rest: '🌐',
  websocket: '⚡',
  soap: '📄',
  github: '🐙',
  scraper: '🕷️',
  custom: '⚙️',
};

/**
 * Resource type labels
 */
const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  oauth: 'OAuth',
  apikey: 'API Key',
  graphql: 'GraphQL',
  rest: 'REST API',
  websocket: 'WebSocket',
  soap: 'SOAP',
  github: 'GitHub',
  scraper: 'Scraper',
  custom: 'Custom',
};

/**
 * Status colors
 */
const STATUS_COLORS: Record<ResourceStatus, string> = {
  active: 'green',
  inactive: 'gray',
  expired: 'orange',
  revoked: 'red',
  error: 'red',
};

/**
 * Resource Accordion Header Component
 */
export const ResourceAccordionHeader: React.FC<ResourceAccordionHeaderProps> = ({
  resource,
  isExpanded,
  isEditing,
  isLoading,
  isTesting,
  disabled,
  handshakeCount,
  successRate,
  isTokenExpiring,
  isTokenExpired,
  showActions,
  allowEdit,
  allowDelete,
  onToggle,
  onEdit,
  onDelete,
  onTestConnection,
  onRefreshTokens,
}) => {
  // ============================================
  // HANDLERS
  // ============================================

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  }, [onToggle]);

  const handleEditClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onEdit();
  }, [onEdit]);

  const handleDeleteClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onDelete();
  }, [onDelete]);

  const handleTestClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onTestConnection?.();
  }, [onTestConnection]);

  const handleRefreshClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onRefreshTokens?.();
  }, [onRefreshTokens]);

  // ============================================
  // COMPUTED
  // ============================================

  const typeIcon = RESOURCE_TYPE_ICONS[resource.resourceType] || '📦';
  const typeLabel = RESOURCE_TYPE_LABELS[resource.resourceType] || resource.resourceType;
  const statusColor = STATUS_COLORS[resource.status] || 'gray';

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      className={`resource-accordion-header ${isExpanded ? 'resource-accordion-header--expanded' : ''}`}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-expanded={isExpanded}
      aria-disabled={disabled}
    >
      {/* Expand/Collapse Icon */}
      <div className="resource-accordion-header__toggle">
        <span 
          className={`resource-accordion-header__toggle-icon ${isExpanded ? 'resource-accordion-header__toggle-icon--expanded' : ''}`}
          aria-hidden="true"
        >
          ▶
        </span>
      </div>

      {/* Resource Type Icon */}
      <div className="resource-accordion-header__type-icon" title={typeLabel}>
        {typeIcon}
      </div>

      {/* Resource Info */}
      <div className="resource-accordion-header__info">
        {/* Name and Type */}
        <div className="resource-accordion-header__title-row">
          <h3 className="resource-accordion-header__name">
            {resource.name}
          </h3>
          <span className={`resource-accordion-header__type-badge resource-accordion-header__type-badge--${resource.resourceType}`}>
            {typeLabel}
          </span>
          <span className={`resource-accordion-header__status-badge resource-accordion-header__status-badge--${resource.status}`}>
            {resource.status}
          </span>
          {isTokenExpired && (
            <span className="resource-accordion-header__warning-badge resource-accordion-header__warning-badge--expired">
              Token Expired
            </span>
          )}
          {isTokenExpiring && !isTokenExpired && (
            <span className="resource-accordion-header__warning-badge resource-accordion-header__warning-badge--expiring">
              Token Expiring
            </span>
          )}
        </div>

        {/* Description or Endpoint */}
        {(resource.description || resource.endpointUrl) && !isExpanded && (
          <p className="resource-accordion-header__description">
            {resource.description || resource.endpointUrl}
          </p>
        )}

        {/* Meta Info */}
        <div className="resource-accordion-header__meta">
          {/* Handshake Count */}
          <span className="resource-accordion-header__meta-item">
            <span className="resource-accordion-header__meta-icon">🤝</span>
            <span className="resource-accordion-header__meta-value">
              {handshakeCount} handshakes
            </span>
          </span>

          {/* Success Rate */}
          {handshakeCount > 0 && (
            <span className={`resource-accordion-header__meta-item ${
              successRate >= 90 ? 'resource-accordion-header__meta-item--success' :
              successRate >= 70 ? 'resource-accordion-header__meta-item--warning' :
              'resource-accordion-header__meta-item--error'
            }`}>
              <span className="resource-accordion-header__meta-icon">📊</span>
              <span className="resource-accordion-header__meta-value">
                {successRate}% success
              </span>
            </span>
          )}

          {/* Last Used */}
          {resource.lastUsedAt && (
            <span className="resource-accordion-header__meta-item">
              <span className="resource-accordion-header__meta-icon">🕐</span>
              <span className="resource-accordion-header__meta-value">
                {formatRelativeDate(resource.lastUsedAt)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="resource-accordion-header__status">
        {isLoading || isTesting ? (
          <span className="resource-accordion-header__spinner" aria-label="Loading">
            {isTesting ? '🔄' : '⏳'}
          </span>
        ) : (
          <span 
            className={`resource-accordion-header__status-dot resource-accordion-header__status-dot--${resource.status}`}
            style={{ '--status-color': `var(--ras-color-${statusColor})` } as React.CSSProperties}
            aria-label={resource.status}
          />
        )}
      </div>

      {/* Actions */}
      {showActions && !isEditing && (
        <div className="resource-accordion-header__actions">
          {/* Test Connection Button */}
          {onTestConnection && (
            <button
              type="button"
              className="resource-accordion-header__action resource-accordion-header__action--test"
              onClick={handleTestClick}
              disabled={disabled || isLoading || isTesting}
              title="Test connection"
              aria-label="Test connection"
            >
              {isTesting ? '⏳' : '🔌'}
            </button>
          )}

          {/* Refresh Token Button */}
          {onRefreshTokens && (isTokenExpiring || isTokenExpired) && (
            <button
              type="button"
              className="resource-accordion-header__action resource-accordion-header__action--refresh"
              onClick={handleRefreshClick}
              disabled={disabled || isLoading}
              title="Refresh token"
              aria-label="Refresh token"
            >
              ↻
            </button>
          )}

          {/* Edit Button */}
          {allowEdit && (
            <button
              type="button"
              className="resource-accordion-header__action resource-accordion-header__action--edit"
              onClick={handleEditClick}
              disabled={disabled || isLoading}
              title="Edit resource"
              aria-label="Edit resource"
            >
              ✏️
            </button>
          )}

          {/* Delete Button */}
          {allowDelete && (
            <button
              type="button"
              className="resource-accordion-header__action resource-accordion-header__action--delete"
              onClick={handleDeleteClick}
              disabled={disabled || isLoading}
              title="Delete resource"
              aria-label="Delete resource"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Format relative date
 */
function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes === 0) {
        return 'Just now';
      }
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  
  return `${Math.floor(diffDays / 365)}y ago`;
}

/**
 * Compact header variant for smaller displays
 */
export interface ResourceAccordionHeaderCompactProps {
  resource: ResourceConfiguration;
  isExpanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const ResourceAccordionHeaderCompact: React.FC<ResourceAccordionHeaderCompactProps> = ({
  resource,
  isExpanded,
  onToggle,
  disabled = false,
}) => {
  const typeIcon = RESOURCE_TYPE_ICONS[resource.resourceType] || '📦';
  
  return (
    <div
      className={`resource-accordion-header resource-accordion-header--compact ${
        isExpanded ? 'resource-accordion-header--expanded' : ''
      }`}
      onClick={onToggle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-expanded={isExpanded}
    >
      <span 
        className={`resource-accordion-header__toggle-icon ${
          isExpanded ? 'resource-accordion-header__toggle-icon--expanded' : ''
        }`}
      >
        ▶
      </span>
      <span className="resource-accordion-header__type-icon resource-accordion-header__type-icon--small">
        {typeIcon}
      </span>
      <span className="resource-accordion-header__name">
        {resource.name}
      </span>
      <span 
        className={`resource-accordion-header__status-dot resource-accordion-header__status-dot--${resource.status} resource-accordion-header__status-dot--small`}
      />
    </div>
  );
};

/**
 * Resource type selector for filtering
 */
export interface ResourceTypeFilterProps {
  selectedTypes: ResourceType[];
  onChange: (types: ResourceType[]) => void;
  disabled?: boolean;
  className?: string;
}

export const ResourceTypeFilter: React.FC<ResourceTypeFilterProps> = ({
  selectedTypes,
  onChange,
  disabled = false,
  className = '',
}) => {
  const allTypes: ResourceType[] = ['oauth', 'apikey', 'graphql', 'rest', 'websocket', 'soap', 'github', 'scraper', 'custom'];
  
  const toggleType = (type: ResourceType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter(t => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };
  
  const selectAll = () => onChange(allTypes);
  const clearAll = () => onChange([]);
  
  return (
    <div className={`resource-type-filter ${className}`}>
      <div className="resource-type-filter__actions">
        <button
          type="button"
          className="resource-type-filter__action"
          onClick={selectAll}
          disabled={disabled}
        >
          Select All
        </button>
        <button
          type="button"
          className="resource-type-filter__action"
          onClick={clearAll}
          disabled={disabled}
        >
          Clear
        </button>
      </div>
      <div className="resource-type-filter__types">
        {allTypes.map(type => (
          <button
            key={type}
            type="button"
            className={`resource-type-filter__type ${
              selectedTypes.includes(type) ? 'resource-type-filter__type--selected' : ''
            }`}
            onClick={() => toggleType(type)}
            disabled={disabled}
          >
            <span className="resource-type-filter__type-icon">
              {RESOURCE_TYPE_ICONS[type]}
            </span>
            <span className="resource-type-filter__type-label">
              {RESOURCE_TYPE_LABELS[type]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ResourceAccordionHeader;
