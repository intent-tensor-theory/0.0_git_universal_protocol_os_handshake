// ============================================
// PROTOCOL OS - SAVED HANDSHAKE CARD HEADER
// ============================================
// Address: 1.5.c
// Purpose: Card Header with Name, Protocol, and Actions
// ============================================

import React from 'react';
import { SavedHandshake, HandshakeVersion } from './1.5.e_fileSavedHandshakeVersioningLogic';
import type { ViewMode } from './1.5.a_fileSavedHandshakesContainer';

/**
 * Saved Handshake Card Header
 * 
 * Displays the header section of a saved handshake card with:
 * - Protocol icon and name
 * - Handshake name and description
 * - Version information
 * - Usage statistics
 * - Action menu button
 */

/**
 * Protocol icon mapping
 */
const PROTOCOL_ICONS: Record<string, string> = {
  oauth: '🔐',
  'oauth-pkce': '🔐',
  'oauth-authcode': '🔑',
  'oauth-client-credentials': '🤖',
  apikey: '🔒',
  'api-key': '🔒',
  basic: '👤',
  bearer: '🎫',
  graphql: '◈',
  rest: '🌐',
  websocket: '⚡',
  soap: '📄',
  github: '🐙',
  scraper: '🕷️',
  custom: '⚙️',
};

/**
 * Handshake type icon mapping
 */
const HANDSHAKE_TYPE_ICONS: Record<string, string> = {
  auth: '🔐',
  refresh: '↻',
  revoke: '⊘',
  validate: '✓',
  request: '📡',
  health: '💚',
  webhook: '🔔',
};

/**
 * Card header props
 */
export interface SavedHandshakeCardHeaderProps {
  /** Handshake data */
  handshake: SavedHandshake;
  
  /** Latest version */
  latestVersion?: HandshakeVersion;
  
  /** Has multiple versions */
  hasMultipleVersions?: boolean;
  
  /** View mode */
  viewMode?: ViewMode;
  
  /** Is menu open */
  isMenuOpen?: boolean;
  
  /** On menu toggle */
  onMenuToggle?: (e: React.MouseEvent) => void;
  
  /** On menu action */
  onMenuAction?: (action: string) => void;
  
  /** On view versions */
  onViewVersions?: () => void;
  
  /** Show version info */
  showVersionInfo?: boolean;
  
  /** Show usage stats */
  showUsageStats?: boolean;
}

/**
 * Saved Handshake Card Header Component
 */
export const SavedHandshakeCardHeader: React.FC<SavedHandshakeCardHeaderProps> = ({
  handshake,
  latestVersion,
  hasMultipleVersions = false,
  viewMode = 'grid',
  isMenuOpen = false,
  onMenuToggle,
  onMenuAction,
  onViewVersions,
  showVersionInfo = true,
  showUsageStats = true,
}) => {
  // Get icons
  const protocolIcon = PROTOCOL_ICONS[handshake.protocol.type] || PROTOCOL_ICONS.custom;
  const typeIcon = HANDSHAKE_TYPE_ICONS[handshake.handshakeType] || '📡';
  
  // Format date
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1) return 'Just now';
        return `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  return (
    <div className={`saved-handshake-card-header saved-handshake-card-header--${viewMode}`}>
      {/* Protocol Icon */}
      <div className="saved-handshake-card-header__icon">
        <span className="saved-handshake-card-header__protocol-icon" title={handshake.protocol.name}>
          {protocolIcon}
        </span>
        {viewMode === 'list' && (
          <span className="saved-handshake-card-header__type-icon" title={handshake.handshakeType}>
            {typeIcon}
          </span>
        )}
      </div>

      {/* Main Info */}
      <div className="saved-handshake-card-header__info">
        {/* Title Row */}
        <div className="saved-handshake-card-header__title-row">
          <h3 className="saved-handshake-card-header__name">
            {handshake.name}
          </h3>
          
          {viewMode === 'grid' && (
            <span className="saved-handshake-card-header__type-badge" title={handshake.handshakeType}>
              {typeIcon} {handshake.handshakeType}
            </span>
          )}
        </div>

        {/* Protocol & Version */}
        <div className="saved-handshake-card-header__meta">
          <span className="saved-handshake-card-header__protocol">
            {handshake.protocol.name}
            {handshake.protocol.version && (
              <span className="saved-handshake-card-header__protocol-version">
                v{handshake.protocol.version}
              </span>
            )}
          </span>
          
          {showVersionInfo && latestVersion && (
            <span className="saved-handshake-card-header__version">
              <span className="saved-handshake-card-header__version-number">
                v{latestVersion.versionNumber}
              </span>
              {hasMultipleVersions && onViewVersions && (
                <button
                  type="button"
                  className="saved-handshake-card-header__version-history"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewVersions();
                  }}
                  title={`${handshake.versions.length} versions`}
                >
                  ({handshake.versions.length})
                </button>
              )}
            </span>
          )}
        </div>

        {/* Description (list view) */}
        {viewMode === 'list' && handshake.description && (
          <p className="saved-handshake-card-header__description">
            {handshake.description}
          </p>
        )}

        {/* Stats Row */}
        <div className="saved-handshake-card-header__stats">
          {/* Updated Date */}
          <span className="saved-handshake-card-header__stat saved-handshake-card-header__stat--date">
            <span className="saved-handshake-card-header__stat-icon">🕐</span>
            {formatDate(handshake.updatedAt)}
          </span>
          
          {/* Usage Count */}
          {showUsageStats && handshake.usageCount !== undefined && handshake.usageCount > 0 && (
            <span className="saved-handshake-card-header__stat saved-handshake-card-header__stat--usage">
              <span className="saved-handshake-card-header__stat-icon">📊</span>
              {handshake.usageCount} {handshake.usageCount === 1 ? 'use' : 'uses'}
            </span>
          )}
          
          {/* Success Rate */}
          {showUsageStats && handshake.successRate !== undefined && (
            <span 
              className={`saved-handshake-card-header__stat saved-handshake-card-header__stat--success ${
                handshake.successRate >= 90 ? 'saved-handshake-card-header__stat--success-high' :
                handshake.successRate >= 70 ? 'saved-handshake-card-header__stat--success-medium' :
                'saved-handshake-card-header__stat--success-low'
              }`}
            >
              <span className="saved-handshake-card-header__stat-icon">
                {handshake.successRate >= 90 ? '✓' : handshake.successRate >= 70 ? '◐' : '⚠'}
              </span>
              {handshake.successRate.toFixed(0)}%
            </span>
          )}
          
          {/* Category */}
          {handshake.category && (
            <span className="saved-handshake-card-header__stat saved-handshake-card-header__stat--category">
              <span className="saved-handshake-card-header__stat-icon">📁</span>
              {handshake.category}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="saved-handshake-card-header__actions">
        {/* Quick Favorite */}
        <button
          type="button"
          className={`saved-handshake-card-header__action-btn saved-handshake-card-header__action-btn--favorite ${
            handshake.isFavorite ? 'saved-handshake-card-header__action-btn--active' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onMenuAction?.('favorite');
          }}
          title={handshake.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {handshake.isFavorite ? '★' : '☆'}
        </button>
        
        {/* Menu Button */}
        <button
          type="button"
          className={`saved-handshake-card-header__action-btn saved-handshake-card-header__action-btn--menu ${
            isMenuOpen ? 'saved-handshake-card-header__action-btn--active' : ''
          }`}
          onClick={onMenuToggle}
          aria-label="More actions"
          aria-expanded={isMenuOpen}
        >
          ⋮
        </button>
      </div>
    </div>
  );
};

/**
 * Compact header for minimal display
 */
export interface CompactHeaderProps {
  handshake: SavedHandshake;
  className?: string;
}

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  handshake,
  className = '',
}) => {
  const protocolIcon = PROTOCOL_ICONS[handshake.protocol.type] || PROTOCOL_ICONS.custom;
  
  return (
    <div className={`compact-header ${className}`}>
      <span className="compact-header__icon">{protocolIcon}</span>
      <span className="compact-header__name">{handshake.name}</span>
      {handshake.isFavorite && (
        <span className="compact-header__favorite">⭐</span>
      )}
    </div>
  );
};

/**
 * Version badge component
 */
export interface VersionBadgeProps {
  version: HandshakeVersion;
  isLatest?: boolean;
  onClick?: () => void;
  className?: string;
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({
  version,
  isLatest = false,
  onClick,
  className = '',
}) => {
  return (
    <span 
      className={`version-badge ${isLatest ? 'version-badge--latest' : ''} ${onClick ? 'version-badge--clickable' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="version-badge__number">v{version.versionNumber}</span>
      {isLatest && (
        <span className="version-badge__latest">latest</span>
      )}
    </span>
  );
};

/**
 * Protocol badge component
 */
export interface ProtocolBadgeProps {
  protocol: SavedHandshake['protocol'];
  size?: 'small' | 'medium' | 'large';
  showVersion?: boolean;
  className?: string;
}

export const ProtocolBadge: React.FC<ProtocolBadgeProps> = ({
  protocol,
  size = 'medium',
  showVersion = false,
  className = '',
}) => {
  const icon = PROTOCOL_ICONS[protocol.type] || PROTOCOL_ICONS.custom;
  
  return (
    <span className={`protocol-badge protocol-badge--${size} ${className}`}>
      <span className="protocol-badge__icon">{icon}</span>
      <span className="protocol-badge__name">{protocol.name}</span>
      {showVersion && protocol.version && (
        <span className="protocol-badge__version">v{protocol.version}</span>
      )}
    </span>
  );
};

/**
 * Usage stats component
 */
export interface UsageStatsProps {
  usageCount?: number;
  successRate?: number;
  lastUsed?: Date;
  compact?: boolean;
  className?: string;
}

export const UsageStats: React.FC<UsageStatsProps> = ({
  usageCount = 0,
  successRate,
  lastUsed,
  compact = false,
  className = '',
}) => {
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  
  if (compact) {
    return (
      <span className={`usage-stats usage-stats--compact ${className}`}>
        {usageCount > 0 && <span>📊 {usageCount}</span>}
        {successRate !== undefined && <span>✓ {successRate.toFixed(0)}%</span>}
      </span>
    );
  }
  
  return (
    <div className={`usage-stats ${className}`}>
      <div className="usage-stats__item">
        <span className="usage-stats__icon">📊</span>
        <span className="usage-stats__label">Uses</span>
        <span className="usage-stats__value">{usageCount}</span>
      </div>
      {successRate !== undefined && (
        <div className="usage-stats__item">
          <span className="usage-stats__icon">✓</span>
          <span className="usage-stats__label">Success</span>
          <span className="usage-stats__value">{successRate.toFixed(0)}%</span>
        </div>
      )}
      {lastUsed && (
        <div className="usage-stats__item">
          <span className="usage-stats__icon">🕐</span>
          <span className="usage-stats__label">Last used</span>
          <span className="usage-stats__value">{formatDate(lastUsed)}</span>
        </div>
      )}
    </div>
  );
};

export default SavedHandshakeCardHeader;
