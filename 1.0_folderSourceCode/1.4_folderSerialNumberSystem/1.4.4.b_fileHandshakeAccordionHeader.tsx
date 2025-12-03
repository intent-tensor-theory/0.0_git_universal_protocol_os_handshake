// ============================================
// PROTOCOL OS - HANDSHAKE ACCORDION HEADER
// ============================================
// Address: 1.4.4.b
// Purpose: Clickable Header for Handshake Accordion
// ============================================

import React, { useCallback } from 'react';
import type { HandshakeConfiguration } from './1.4.4.a_fileHandshakeAccordionSection';
import type { HandshakeType, HandshakeOutcome } from '../1.4.1.c_fileHandshakeSerialNumberGenerator';

/**
 * Handshake Accordion Header
 * 
 * Displays handshake summary information and controls:
 * - Expand/collapse toggle
 * - Outcome icon and status
 * - Handshake type badge
 * - Execution statistics
 * - Action buttons
 */

/**
 * Handshake accordion header props
 */
export interface HandshakeAccordionHeaderProps {
  /** Handshake configuration */
  handshake: HandshakeConfiguration;
  
  /** Is section expanded */
  isExpanded: boolean;
  
  /** Is in edit mode */
  isEditing: boolean;
  
  /** Is loading */
  isLoading: boolean;
  
  /** Is executing */
  isExecuting: boolean;
  
  /** Is disabled */
  disabled: boolean;
  
  /** Total execution count */
  executionCount: number;
  
  /** Successful execution count */
  successCount: number;
  
  /** Average duration in ms */
  avgDuration: number;
  
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
  
  /** Execute handler */
  onExecute?: () => void;
  
  /** Duplicate handler */
  onDuplicate?: () => void;
}

/**
 * Handshake type icons
 */
const HANDSHAKE_TYPE_ICONS: Record<HandshakeType, string> = {
  auth: '🔐',
  refresh: '↻',
  revoke: '⊘',
  validate: '✓',
  request: '📡',
  health: '💚',
  webhook: '🔔',
};

/**
 * Handshake type labels
 */
const HANDSHAKE_TYPE_LABELS: Record<HandshakeType, string> = {
  auth: 'Authentication',
  refresh: 'Token Refresh',
  revoke: 'Revocation',
  validate: 'Validation',
  request: 'API Request',
  health: 'Health Check',
  webhook: 'Webhook',
};

/**
 * Outcome icons
 */
const OUTCOME_ICONS: Record<HandshakeOutcome, string> = {
  OK: '✓',
  FAIL: '✗',
  TIMEOUT: '⏱',
  REFRESH: '↻',
  REVOKE: '⊘',
  PARTIAL: '◐',
  RETRY: '↺',
  PENDING: '⋯',
};

/**
 * Outcome colors
 */
const OUTCOME_COLORS: Record<HandshakeOutcome, string> = {
  OK: 'success',
  FAIL: 'error',
  TIMEOUT: 'warning',
  REFRESH: 'info',
  REVOKE: 'neutral',
  PARTIAL: 'warning',
  RETRY: 'info',
  PENDING: 'neutral',
};

/**
 * Handshake Accordion Header Component
 */
export const HandshakeAccordionHeader: React.FC<HandshakeAccordionHeaderProps> = ({
  handshake,
  isExpanded,
  isEditing,
  isLoading,
  isExecuting,
  disabled,
  executionCount,
  successCount,
  avgDuration,
  showActions,
  allowEdit,
  allowDelete,
  onToggle,
  onEdit,
  onDelete,
  onExecute,
  onDuplicate,
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

  const handleExecuteClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onExecute?.();
  }, [onExecute]);

  const handleDuplicateClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onDuplicate?.();
  }, [onDuplicate]);

  // ============================================
  // COMPUTED
  // ============================================

  const outcome = handshake.serial.metadata.outcome;
  const outcomeIcon = OUTCOME_ICONS[outcome] || '?';
  const outcomeColor = OUTCOME_COLORS[outcome] || 'neutral';
  const typeIcon = HANDSHAKE_TYPE_ICONS[handshake.handshakeType] || '📡';
  const typeLabel = HANDSHAKE_TYPE_LABELS[handshake.handshakeType] || handshake.handshakeType;
  const successRate = executionCount > 0 ? Math.round((successCount / executionCount) * 100) : 0;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      className={`handshake-accordion-header ${isExpanded ? 'handshake-accordion-header--expanded' : ''}`}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-expanded={isExpanded}
      aria-disabled={disabled}
    >
      {/* Expand/Collapse Icon */}
      <div className="handshake-accordion-header__toggle">
        <span 
          className={`handshake-accordion-header__toggle-icon ${isExpanded ? 'handshake-accordion-header__toggle-icon--expanded' : ''}`}
          aria-hidden="true"
        >
          ▶
        </span>
      </div>

      {/* Outcome Icon */}
      <div 
        className={`handshake-accordion-header__outcome handshake-accordion-header__outcome--${outcomeColor}`}
        title={`Outcome: ${outcome}`}
      >
        {isExecuting ? (
          <span className="handshake-accordion-header__spinner">⏳</span>
        ) : (
          outcomeIcon
        )}
      </div>

      {/* Handshake Info */}
      <div className="handshake-accordion-header__info">
        {/* Name and Type */}
        <div className="handshake-accordion-header__title-row">
          <h3 className="handshake-accordion-header__name">
            {handshake.name}
          </h3>
          <span className={`handshake-accordion-header__type-badge handshake-accordion-header__type-badge--${handshake.handshakeType}`}>
            {typeIcon} {typeLabel}
          </span>
          <span className={`handshake-accordion-header__outcome-badge handshake-accordion-header__outcome-badge--${outcomeColor}`}>
            {outcome}
          </span>
          {handshake.isSavedTemplate && (
            <span className="handshake-accordion-header__template-badge">
              💾 Saved
            </span>
          )}
        </div>

        {/* Protocol Info */}
        <p className="handshake-accordion-header__protocol">
          {handshake.protocol.name}
          {handshake.protocol.version && ` v${handshake.protocol.version}`}
        </p>

        {/* Meta Info */}
        <div className="handshake-accordion-header__meta">
          {/* Execution Count */}
          <span className="handshake-accordion-header__meta-item">
            <span className="handshake-accordion-header__meta-icon">🔄</span>
            <span className="handshake-accordion-header__meta-value">
              {executionCount} executions
            </span>
          </span>

          {/* Success Rate */}
          {executionCount > 0 && (
            <span className={`handshake-accordion-header__meta-item ${
              successRate >= 90 ? 'handshake-accordion-header__meta-item--success' :
              successRate >= 70 ? 'handshake-accordion-header__meta-item--warning' :
              'handshake-accordion-header__meta-item--error'
            }`}>
              <span className="handshake-accordion-header__meta-icon">📊</span>
              <span className="handshake-accordion-header__meta-value">
                {successRate}% success
              </span>
            </span>
          )}

          {/* Average Duration */}
          {avgDuration > 0 && (
            <span className="handshake-accordion-header__meta-item">
              <span className="handshake-accordion-header__meta-icon">⏱</span>
              <span className="handshake-accordion-header__meta-value">
                ~{avgDuration}ms avg
              </span>
            </span>
          )}

          {/* Last Execution */}
          {handshake.lastResult && (
            <span className="handshake-accordion-header__meta-item">
              <span className="handshake-accordion-header__meta-icon">🕐</span>
              <span className="handshake-accordion-header__meta-value">
                {formatRelativeDate(handshake.lastResult.timestamp)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="handshake-accordion-header__status">
        {isLoading || isExecuting ? (
          <span className="handshake-accordion-header__spinner" aria-label="Loading">
            ⏳
          </span>
        ) : (
          <span 
            className={`handshake-accordion-header__status-dot handshake-accordion-header__status-dot--${outcomeColor}`}
            aria-label={outcome}
          />
        )}
      </div>

      {/* Actions */}
      {showActions && !isEditing && (
        <div className="handshake-accordion-header__actions">
          {/* Execute Button */}
          {onExecute && (
            <button
              type="button"
              className="handshake-accordion-header__action handshake-accordion-header__action--execute"
              onClick={handleExecuteClick}
              disabled={disabled || isLoading || isExecuting}
              title="Execute handshake"
              aria-label="Execute handshake"
            >
              {isExecuting ? '⏳' : '▶'}
            </button>
          )}

          {/* Duplicate Button */}
          {onDuplicate && (
            <button
              type="button"
              className="handshake-accordion-header__action handshake-accordion-header__action--duplicate"
              onClick={handleDuplicateClick}
              disabled={disabled || isLoading}
              title="Duplicate handshake"
              aria-label="Duplicate handshake"
            >
              📋
            </button>
          )}

          {/* Edit Button */}
          {allowEdit && (
            <button
              type="button"
              className="handshake-accordion-header__action handshake-accordion-header__action--edit"
              onClick={handleEditClick}
              disabled={disabled || isLoading}
              title="Edit handshake"
              aria-label="Edit handshake"
            >
              ✏️
            </button>
          )}

          {/* Delete Button */}
          {allowDelete && (
            <button
              type="button"
              className="handshake-accordion-header__action handshake-accordion-header__action--delete"
              onClick={handleDeleteClick}
              disabled={disabled || isLoading}
              title="Delete handshake"
              aria-label="Delete handshake"
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
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Compact header variant
 */
export interface HandshakeAccordionHeaderCompactProps {
  handshake: HandshakeConfiguration;
  isExpanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const HandshakeAccordionHeaderCompact: React.FC<HandshakeAccordionHeaderCompactProps> = ({
  handshake,
  isExpanded,
  onToggle,
  disabled = false,
}) => {
  const outcome = handshake.serial.metadata.outcome;
  const outcomeIcon = OUTCOME_ICONS[outcome] || '?';
  const outcomeColor = OUTCOME_COLORS[outcome] || 'neutral';
  
  return (
    <div
      className={`handshake-accordion-header handshake-accordion-header--compact ${
        isExpanded ? 'handshake-accordion-header--expanded' : ''
      }`}
      onClick={onToggle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-expanded={isExpanded}
    >
      <span 
        className={`handshake-accordion-header__toggle-icon ${
          isExpanded ? 'handshake-accordion-header__toggle-icon--expanded' : ''
        }`}
      >
        ▶
      </span>
      <span className={`handshake-accordion-header__outcome handshake-accordion-header__outcome--${outcomeColor} handshake-accordion-header__outcome--small`}>
        {outcomeIcon}
      </span>
      <span className="handshake-accordion-header__name">
        {handshake.name}
      </span>
      <span className={`handshake-accordion-header__outcome-badge handshake-accordion-header__outcome-badge--${outcomeColor} handshake-accordion-header__outcome-badge--small`}>
        {outcome}
      </span>
    </div>
  );
};

/**
 * Handshake type filter
 */
export interface HandshakeTypeFilterProps {
  selectedTypes: HandshakeType[];
  onChange: (types: HandshakeType[]) => void;
  disabled?: boolean;
  className?: string;
}

export const HandshakeTypeFilter: React.FC<HandshakeTypeFilterProps> = ({
  selectedTypes,
  onChange,
  disabled = false,
  className = '',
}) => {
  const allTypes: HandshakeType[] = ['auth', 'refresh', 'revoke', 'validate', 'request', 'health', 'webhook'];
  
  const toggleType = (type: HandshakeType) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter(t => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };
  
  return (
    <div className={`handshake-type-filter ${className}`}>
      {allTypes.map(type => (
        <button
          key={type}
          type="button"
          className={`handshake-type-filter__type ${
            selectedTypes.includes(type) ? 'handshake-type-filter__type--selected' : ''
          }`}
          onClick={() => toggleType(type)}
          disabled={disabled}
        >
          <span className="handshake-type-filter__type-icon">
            {HANDSHAKE_TYPE_ICONS[type]}
          </span>
          <span className="handshake-type-filter__type-label">
            {HANDSHAKE_TYPE_LABELS[type]}
          </span>
        </button>
      ))}
    </div>
  );
};

/**
 * Outcome filter
 */
export interface HandshakeOutcomeFilterProps {
  selectedOutcomes: HandshakeOutcome[];
  onChange: (outcomes: HandshakeOutcome[]) => void;
  disabled?: boolean;
  className?: string;
}

export const HandshakeOutcomeFilter: React.FC<HandshakeOutcomeFilterProps> = ({
  selectedOutcomes,
  onChange,
  disabled = false,
  className = '',
}) => {
  const allOutcomes: HandshakeOutcome[] = ['OK', 'FAIL', 'TIMEOUT', 'REFRESH', 'REVOKE', 'PARTIAL', 'RETRY', 'PENDING'];
  
  const toggleOutcome = (outcome: HandshakeOutcome) => {
    if (selectedOutcomes.includes(outcome)) {
      onChange(selectedOutcomes.filter(o => o !== outcome));
    } else {
      onChange([...selectedOutcomes, outcome]);
    }
  };
  
  return (
    <div className={`handshake-outcome-filter ${className}`}>
      {allOutcomes.map(outcome => (
        <button
          key={outcome}
          type="button"
          className={`handshake-outcome-filter__outcome handshake-outcome-filter__outcome--${OUTCOME_COLORS[outcome]} ${
            selectedOutcomes.includes(outcome) ? 'handshake-outcome-filter__outcome--selected' : ''
          }`}
          onClick={() => toggleOutcome(outcome)}
          disabled={disabled}
        >
          <span className="handshake-outcome-filter__outcome-icon">
            {OUTCOME_ICONS[outcome]}
          </span>
          <span className="handshake-outcome-filter__outcome-label">
            {outcome}
          </span>
        </button>
      ))}
    </div>
  );
};

export default HandshakeAccordionHeader;
