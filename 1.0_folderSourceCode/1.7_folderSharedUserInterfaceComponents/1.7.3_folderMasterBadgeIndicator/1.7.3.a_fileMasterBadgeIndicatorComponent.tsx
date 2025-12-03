// ============================================
// PROTOCOL OS - MASTER BADGE INDICATOR COMPONENT
// ============================================
// Address: 1.7.3.a
// Purpose: Visual badge indicating master/archived platform status
// ============================================

import React from 'react';
import './1.7.3.b_fileMasterBadgeIndicatorStyles.css';

/**
 * Badge type variants
 */
export type BadgeType = 
  | 'master'      // Green glow - active master platform
  | 'archived'    // Blue glow - archived/historical platform
  | 'active'      // Teal glow - active resource/handshake
  | 'draft'       // Gray - work in progress
  | 'template';   // Purple - template item

/**
 * Props for MasterBadgeIndicator component
 */
export interface MasterBadgeIndicatorProps {
  /** Type of badge to display */
  type: BadgeType;
  
  /** Custom label (overrides default) */
  label?: string;
  
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Whether to show the glow effect */
  glowing?: boolean;
  
  /** Whether to show pulse animation */
  pulsing?: boolean;
  
  /** Optional CSS class name */
  className?: string;
  
  /** Optional tooltip text */
  tooltip?: string;
}

/**
 * Default labels for each badge type
 */
const DEFAULT_LABELS: Record<BadgeType, string> = {
  master: 'MASTER',
  archived: 'ARCHIVED',
  active: 'ACTIVE',
  draft: 'DRAFT',
  template: 'TEMPLATE',
};

/**
 * Tooltips for each badge type
 */
const DEFAULT_TOOLTIPS: Record<BadgeType, string> = {
  master: 'This is a master platform',
  archived: 'This platform is archived',
  active: 'Currently active',
  draft: 'Work in progress',
  template: 'Template item - clone to use',
};

/**
 * MasterBadgeIndicator Component
 * 
 * Displays a colored badge indicating the status of a platform or item.
 * Supports different types with corresponding colors and optional animations.
 * 
 * @example
 * ```tsx
 * <MasterBadgeIndicator type="master" glowing pulsing />
 * <MasterBadgeIndicator type="archived" size="small" />
 * <MasterBadgeIndicator type="active" label="LIVE" />
 * ```
 */
export const MasterBadgeIndicator: React.FC<MasterBadgeIndicatorProps> = ({
  type,
  label,
  size = 'medium',
  glowing = true,
  pulsing = false,
  className = '',
  tooltip,
}) => {
  const displayLabel = label ?? DEFAULT_LABELS[type];
  const displayTooltip = tooltip ?? DEFAULT_TOOLTIPS[type];

  const classNames = [
    'master-badge-indicator',
    `master-badge-indicator--${type}`,
    `master-badge-indicator--${size}`,
    glowing ? 'master-badge-indicator--glowing' : '',
    pulsing ? 'master-badge-indicator--pulsing' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span
      className={classNames}
      title={displayTooltip}
      role="status"
      aria-label={displayTooltip}
    >
      {/* Glow ring (for master and active types) */}
      {glowing && (type === 'master' || type === 'active') && (
        <span className="master-badge-indicator__glow-ring" aria-hidden="true" />
      )}
      
      {/* Badge content */}
      <span className="master-badge-indicator__content">
        {displayLabel}
      </span>
    </span>
  );
};

/**
 * Convenience component for Master badge
 */
export const MasterBadge: React.FC<Omit<MasterBadgeIndicatorProps, 'type'>> = (props) => (
  <MasterBadgeIndicator type="master" {...props} />
);

/**
 * Convenience component for Archived badge
 */
export const ArchivedBadge: React.FC<Omit<MasterBadgeIndicatorProps, 'type'>> = (props) => (
  <MasterBadgeIndicator type="archived" {...props} />
);

/**
 * Convenience component for Active badge
 */
export const ActiveBadge: React.FC<Omit<MasterBadgeIndicatorProps, 'type'>> = (props) => (
  <MasterBadgeIndicator type="active" {...props} />
);

/**
 * Convenience component for Draft badge
 */
export const DraftBadge: React.FC<Omit<MasterBadgeIndicatorProps, 'type'>> = (props) => (
  <MasterBadgeIndicator type="draft" glowing={false} {...props} />
);

/**
 * Convenience component for Template badge
 */
export const TemplateBadge: React.FC<Omit<MasterBadgeIndicatorProps, 'type'>> = (props) => (
  <MasterBadgeIndicator type="template" {...props} />
);

export default MasterBadgeIndicator;
