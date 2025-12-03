// ============================================
// PROTOCOL OS - PLATFORM ACCORDION HEADER
// ============================================
// Address: 1.4.2.b
// Purpose: Clickable Header for Platform Accordion
// ============================================

import React, { useCallback } from 'react';
import type { PlatformConfiguration } from './1.4.2.a_filePlatformAccordionSection';

/**
 * Platform Accordion Header
 * 
 * Displays platform summary information and controls:
 * - Expand/collapse toggle
 * - Platform name and edition badge
 * - Resource count
 * - Status indicator
 * - Action buttons (edit, delete, activate)
 */

/**
 * Platform accordion header props
 */
export interface PlatformAccordionHeaderProps {
  /** Platform configuration */
  platform: PlatformConfiguration;
  
  /** Is section expanded */
  isExpanded: boolean;
  
  /** Is in edit mode */
  isEditing: boolean;
  
  /** Is loading */
  isLoading: boolean;
  
  /** Is disabled */
  disabled: boolean;
  
  /** Total resource count */
  resourceCount: number;
  
  /** Active resource count */
  activeResourceCount: number;
  
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
  
  /** Activate handler */
  onActivate: () => void;
}

/**
 * Platform Accordion Header Component
 */
export const PlatformAccordionHeader: React.FC<PlatformAccordionHeaderProps> = ({
  platform,
  isExpanded,
  isEditing,
  isLoading,
  disabled,
  resourceCount,
  activeResourceCount,
  showActions,
  allowEdit,
  allowDelete,
  onToggle,
  onEdit,
  onDelete,
  onActivate,
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

  const handleActivateClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onActivate();
  }, [onActivate]);

  // ============================================
  // COMPUTED
  // ============================================

  const editionLabel = getEditionLabel(platform.edition);
  const editionClass = `platform-accordion-header__edition--${platform.edition}`;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div
      className={`platform-accordion-header ${isExpanded ? 'platform-accordion-header--expanded' : ''}`}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-expanded={isExpanded}
      aria-disabled={disabled}
    >
      {/* Expand/Collapse Icon */}
      <div className="platform-accordion-header__toggle">
        <span 
          className={`platform-accordion-header__toggle-icon ${isExpanded ? 'platform-accordion-header__toggle-icon--expanded' : ''}`}
          aria-hidden="true"
        >
          ▶
        </span>
      </div>

      {/* Platform Info */}
      <div className="platform-accordion-header__info">
        {/* Name and Edition */}
        <div className="platform-accordion-header__title-row">
          <h3 className="platform-accordion-header__name">
            {platform.name}
          </h3>
          <span className={`platform-accordion-header__edition ${editionClass}`}>
            {editionLabel}
          </span>
          {platform.isActive && (
            <span className="platform-accordion-header__active-badge">
              Active
            </span>
          )}
        </div>

        {/* Description */}
        {platform.description && !isExpanded && (
          <p className="platform-accordion-header__description">
            {platform.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="platform-accordion-header__meta">
          {/* Resource Count */}
          <span className="platform-accordion-header__meta-item">
            <span className="platform-accordion-header__meta-icon">📦</span>
            <span className="platform-accordion-header__meta-value">
              {activeResourceCount}/{resourceCount} resources
            </span>
          </span>

          {/* Version */}
          <span className="platform-accordion-header__meta-item">
            <span className="platform-accordion-header__meta-icon">🏷️</span>
            <span className="platform-accordion-header__meta-value">
              v{platform.serial.components.version}
            </span>
          </span>

          {/* Created Date */}
          <span className="platform-accordion-header__meta-item">
            <span className="platform-accordion-header__meta-icon">📅</span>
            <span className="platform-accordion-header__meta-value">
              {formatRelativeDate(platform.createdAt)}
            </span>
          </span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="platform-accordion-header__status">
        {isLoading ? (
          <span className="platform-accordion-header__spinner" aria-label="Loading">
            ⏳
          </span>
        ) : (
          <span 
            className={`platform-accordion-header__status-dot ${
              platform.isActive 
                ? 'platform-accordion-header__status-dot--active' 
                : 'platform-accordion-header__status-dot--inactive'
            }`}
            aria-label={platform.isActive ? 'Active' : 'Inactive'}
          />
        )}
      </div>

      {/* Actions */}
      {showActions && !isEditing && (
        <div className="platform-accordion-header__actions">
          {/* Activate Button */}
          {!platform.isActive && (
            <button
              type="button"
              className="platform-accordion-header__action platform-accordion-header__action--activate"
              onClick={handleActivateClick}
              disabled={disabled || isLoading}
              title="Set as active platform"
              aria-label="Activate platform"
            >
              ✓
            </button>
          )}

          {/* Edit Button */}
          {allowEdit && (
            <button
              type="button"
              className="platform-accordion-header__action platform-accordion-header__action--edit"
              onClick={handleEditClick}
              disabled={disabled || isLoading}
              title="Edit platform"
              aria-label="Edit platform"
            >
              ✏️
            </button>
          )}

          {/* Delete Button */}
          {allowDelete && (
            <button
              type="button"
              className="platform-accordion-header__action platform-accordion-header__action--delete"
              onClick={handleDeleteClick}
              disabled={disabled || isLoading}
              title="Delete platform"
              aria-label="Delete platform"
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
 * Get edition display label
 */
function getEditionLabel(edition: string): string {
  const labels: Record<string, string> = {
    community: 'Community',
    professional: 'Professional',
    enterprise: 'Enterprise',
    developer: 'Developer',
  };
  return labels[edition] || edition;
}

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
export interface PlatformAccordionHeaderCompactProps {
  platform: PlatformConfiguration;
  isExpanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const PlatformAccordionHeaderCompact: React.FC<PlatformAccordionHeaderCompactProps> = ({
  platform,
  isExpanded,
  onToggle,
  disabled = false,
}) => {
  return (
    <div
      className={`platform-accordion-header platform-accordion-header--compact ${
        isExpanded ? 'platform-accordion-header--expanded' : ''
      }`}
      onClick={onToggle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-expanded={isExpanded}
    >
      <span 
        className={`platform-accordion-header__toggle-icon ${
          isExpanded ? 'platform-accordion-header__toggle-icon--expanded' : ''
        }`}
      >
        ▶
      </span>
      <span className="platform-accordion-header__name">
        {platform.name}
      </span>
      {platform.isActive && (
        <span className="platform-accordion-header__active-badge platform-accordion-header__active-badge--small">
          ●
        </span>
      )}
    </div>
  );
};

export default PlatformAccordionHeader;
