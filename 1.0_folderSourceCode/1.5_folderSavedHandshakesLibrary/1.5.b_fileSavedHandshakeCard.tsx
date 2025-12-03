// ============================================
// PROTOCOL OS - SAVED HANDSHAKE CARD
// ============================================
// Address: 1.5.b
// Purpose: Individual Card Component for Saved Handshakes
// ============================================

import React, { useState, useCallback } from 'react';
import { SavedHandshakeCardHeader } from './1.5.c_fileSavedHandshakeCardHeader';
import { SavedHandshakeCardBody } from './1.5.d_fileSavedHandshakeCardBody';
import { SavedHandshake, getLatestVersion } from './1.5.e_fileSavedHandshakeVersioningLogic';
import type { ViewMode } from './1.5.a_fileSavedHandshakesContainer';

/**
 * Saved Handshake Card
 * 
 * Displays a saved handshake template with:
 * - Header with name, protocol, and actions
 * - Body with configuration details
 * - Version history access
 * - Quick actions (favorite, archive, delete)
 */

/**
 * Saved handshake card props
 */
export interface SavedHandshakeCardProps {
  /** Handshake data */
  handshake: SavedHandshake;
  
  /** Is selected */
  isSelected?: boolean;
  
  /** Is expanded */
  isExpanded?: boolean;
  
  /** View mode */
  viewMode?: ViewMode;
  
  /** On select handler */
  onSelect?: () => void;
  
  /** On toggle favorite */
  onToggleFavorite?: () => void;
  
  /** On toggle archive */
  onToggleArchive?: () => void;
  
  /** On duplicate */
  onDuplicate?: () => void;
  
  /** On delete */
  onDelete?: () => void;
  
  /** On update category */
  onUpdateCategory?: (category: string) => void;
  
  /** On update tags */
  onUpdateTags?: (tags: string[]) => void;
  
  /** On expand */
  onExpand?: () => void;
  
  /** On view version history */
  onViewVersions?: () => void;
  
  /** On restore version */
  onRestoreVersion?: (versionId: string) => void;
  
  /** Available categories */
  availableCategories?: string[];
  
  /** Available tags */
  availableTags?: string[];
  
  /** Show version info */
  showVersionInfo?: boolean;
  
  /** Show usage stats */
  showUsageStats?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Card action type
 */
type CardAction = 'favorite' | 'archive' | 'duplicate' | 'delete' | 'category' | 'tags';

/**
 * Saved Handshake Card Component
 */
export const SavedHandshakeCard: React.FC<SavedHandshakeCardProps> = ({
  handshake,
  isSelected = false,
  isExpanded = false,
  viewMode = 'grid',
  onSelect,
  onToggleFavorite,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onUpdateCategory,
  onUpdateTags,
  onExpand,
  onViewVersions,
  onRestoreVersion,
  availableCategories = [],
  availableTags = [],
  showVersionInfo = true,
  showUsageStats = true,
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryEditing, setIsCategoryEditing] = useState(false);
  const [isTagsEditing, setIsTagsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // ============================================
  // COMPUTED
  // ============================================

  const latestVersion = getLatestVersion(handshake);
  const hasMultipleVersions = handshake.versions.length > 1;

  // ============================================
  // HANDLERS
  // ============================================

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger select if clicking on actions
    if ((e.target as HTMLElement).closest('.saved-handshake-card__actions')) {
      return;
    }
    onSelect?.();
  }, [onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.();
    }
  }, [onSelect]);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(prev => !prev);
  }, []);

  const handleMenuAction = useCallback((action: CardAction) => {
    setIsMenuOpen(false);
    
    switch (action) {
      case 'favorite':
        onToggleFavorite?.();
        break;
      case 'archive':
        onToggleArchive?.();
        break;
      case 'duplicate':
        onDuplicate?.();
        break;
      case 'delete':
        setIsConfirmingDelete(true);
        break;
      case 'category':
        setIsCategoryEditing(true);
        break;
      case 'tags':
        setIsTagsEditing(true);
        break;
    }
  }, [onToggleFavorite, onToggleArchive, onDuplicate]);

  const handleDeleteConfirm = useCallback(() => {
    setIsConfirmingDelete(false);
    onDelete?.();
  }, [onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsConfirmingDelete(false);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setIsCategoryEditing(false);
    onUpdateCategory?.(category);
  }, [onUpdateCategory]);

  const handleTagsChange = useCallback((tags: string[]) => {
    setIsTagsEditing(false);
    onUpdateTags?.(tags);
  }, [onUpdateTags]);

  const handleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand?.();
  }, [onExpand]);

  // ============================================
  // RENDER
  // ============================================

  const cardClasses = [
    'saved-handshake-card',
    `saved-handshake-card--${viewMode}`,
    isSelected ? 'saved-handshake-card--selected' : '',
    isExpanded ? 'saved-handshake-card--expanded' : '',
    handshake.isFavorite ? 'saved-handshake-card--favorite' : '',
    handshake.isArchived ? 'saved-handshake-card--archived' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-expanded={isExpanded}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="saved-handshake-card__selection-indicator">
          <span className="saved-handshake-card__selection-check">✓</span>
        </div>
      )}

      {/* Favorite Badge */}
      {handshake.isFavorite && (
        <div className="saved-handshake-card__favorite-badge" title="Favorite">
          ⭐
        </div>
      )}

      {/* Archived Overlay */}
      {handshake.isArchived && (
        <div className="saved-handshake-card__archived-overlay">
          <span className="saved-handshake-card__archived-label">Archived</span>
        </div>
      )}

      {/* Header */}
      <SavedHandshakeCardHeader
        handshake={handshake}
        latestVersion={latestVersion}
        hasMultipleVersions={hasMultipleVersions}
        viewMode={viewMode}
        isMenuOpen={isMenuOpen}
        onMenuToggle={handleMenuToggle}
        onMenuAction={handleMenuAction}
        onViewVersions={onViewVersions}
        showVersionInfo={showVersionInfo}
        showUsageStats={showUsageStats}
      />

      {/* Body (expandable in grid view) */}
      {(viewMode === 'list' || isExpanded) && (
        <SavedHandshakeCardBody
          handshake={handshake}
          viewMode={viewMode}
          isCategoryEditing={isCategoryEditing}
          isTagsEditing={isTagsEditing}
          availableCategories={availableCategories}
          availableTags={availableTags}
          onCategoryChange={handleCategoryChange}
          onTagsChange={handleTagsChange}
          onCancelCategoryEdit={() => setIsCategoryEditing(false)}
          onCancelTagsEdit={() => setIsTagsEditing(false)}
        />
      )}

      {/* Expand Button (grid view only) */}
      {viewMode === 'grid' && (
        <button
          type="button"
          className={`saved-handshake-card__expand-btn ${isExpanded ? 'saved-handshake-card__expand-btn--expanded' : ''}`}
          onClick={handleExpand}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <span className="saved-handshake-card__expand-icon">
            {isExpanded ? '▲' : '▼'}
          </span>
          {isExpanded ? 'Less' : 'More'}
        </button>
      )}

      {/* Menu Dropdown */}
      {isMenuOpen && (
        <div className="saved-handshake-card__menu-dropdown">
          <button
            type="button"
            className="saved-handshake-card__menu-item"
            onClick={() => handleMenuAction('favorite')}
          >
            <span className="saved-handshake-card__menu-icon">
              {handshake.isFavorite ? '★' : '☆'}
            </span>
            {handshake.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
          
          <button
            type="button"
            className="saved-handshake-card__menu-item"
            onClick={() => handleMenuAction('archive')}
          >
            <span className="saved-handshake-card__menu-icon">
              {handshake.isArchived ? '📤' : '📥'}
            </span>
            {handshake.isArchived ? 'Unarchive' : 'Archive'}
          </button>
          
          <button
            type="button"
            className="saved-handshake-card__menu-item"
            onClick={() => handleMenuAction('category')}
          >
            <span className="saved-handshake-card__menu-icon">📁</span>
            Change Category
          </button>
          
          <button
            type="button"
            className="saved-handshake-card__menu-item"
            onClick={() => handleMenuAction('tags')}
          >
            <span className="saved-handshake-card__menu-icon">🏷️</span>
            Edit Tags
          </button>
          
          <div className="saved-handshake-card__menu-divider" />
          
          <button
            type="button"
            className="saved-handshake-card__menu-item"
            onClick={() => handleMenuAction('duplicate')}
          >
            <span className="saved-handshake-card__menu-icon">📋</span>
            Duplicate
          </button>
          
          <button
            type="button"
            className="saved-handshake-card__menu-item saved-handshake-card__menu-item--danger"
            onClick={() => handleMenuAction('delete')}
          >
            <span className="saved-handshake-card__menu-icon">🗑️</span>
            Delete
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      {isConfirmingDelete && (
        <div className="saved-handshake-card__confirm-overlay">
          <div className="saved-handshake-card__confirm-dialog">
            <div className="saved-handshake-card__confirm-icon">⚠️</div>
            <div className="saved-handshake-card__confirm-title">
              Delete Handshake?
            </div>
            <div className="saved-handshake-card__confirm-message">
              This will permanently delete "{handshake.name}" and all its versions.
            </div>
            <div className="saved-handshake-card__confirm-actions">
              <button
                type="button"
                className="saved-handshake-card__confirm-btn saved-handshake-card__confirm-btn--cancel"
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="saved-handshake-card__confirm-btn saved-handshake-card__confirm-btn--delete"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside handler for menu */}
      {isMenuOpen && (
        <div 
          className="saved-handshake-card__menu-backdrop"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

/**
 * Minimal card for quick selection
 */
export interface MinimalCardProps {
  handshake: SavedHandshake;
  onSelect: () => void;
  isSelected?: boolean;
  className?: string;
}

export const MinimalCard: React.FC<MinimalCardProps> = ({
  handshake,
  onSelect,
  isSelected = false,
  className = '',
}) => {
  return (
    <button
      type="button"
      className={`minimal-card ${isSelected ? 'minimal-card--selected' : ''} ${className}`}
      onClick={onSelect}
    >
      <span className="minimal-card__icon">
        {handshake.isFavorite ? '⭐' : '📋'}
      </span>
      <div className="minimal-card__info">
        <span className="minimal-card__name">{handshake.name}</span>
        <span className="minimal-card__protocol">{handshake.protocol.name}</span>
      </div>
      {isSelected && (
        <span className="minimal-card__check">✓</span>
      )}
    </button>
  );
};

/**
 * Card skeleton for loading state
 */
export const CardSkeleton: React.FC<{ viewMode?: ViewMode }> = ({ viewMode = 'grid' }) => {
  return (
    <div className={`saved-handshake-card saved-handshake-card--${viewMode} saved-handshake-card--skeleton`}>
      <div className="saved-handshake-card__skeleton-header">
        <div className="saved-handshake-card__skeleton-icon" />
        <div className="saved-handshake-card__skeleton-text" />
      </div>
      <div className="saved-handshake-card__skeleton-body">
        <div className="saved-handshake-card__skeleton-line" />
        <div className="saved-handshake-card__skeleton-line saved-handshake-card__skeleton-line--short" />
      </div>
    </div>
  );
};

export default SavedHandshakeCard;
