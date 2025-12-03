// ============================================
// PROTOCOL OS - RESOURCE ADD HANDSHAKE BUTTON
// ============================================
// Address: 1.4.3.d
// Purpose: Dropdown Button for Adding New Handshakes
// ============================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { HandshakeType } from '../1.4.1.c_fileHandshakeSerialNumberGenerator';
import type { ResourceType } from '../1.4.1.b_fileResourceSerialNumberGenerator';

/**
 * Resource Add Handshake Button
 * 
 * Provides a dropdown button for adding new handshakes:
 * - Displays available handshake types
 * - Icons and descriptions for each type
 * - Context-aware based on resource type
 * - Keyboard navigation support
 */

/**
 * Handshake type option
 */
export interface HandshakeTypeOption {
  type: HandshakeType;
  label: string;
  description: string;
  icon: string;
  applicableResourceTypes?: ResourceType[];
}

/**
 * Available handshake types
 */
export const HANDSHAKE_TYPE_OPTIONS: HandshakeTypeOption[] = [
  {
    type: 'auth',
    label: 'Authentication',
    description: 'Initial authentication handshake',
    icon: '🔐',
    applicableResourceTypes: ['oauth', 'apikey', 'github'],
  },
  {
    type: 'refresh',
    label: 'Token Refresh',
    description: 'Refresh expired tokens',
    icon: '↻',
    applicableResourceTypes: ['oauth', 'github'],
  },
  {
    type: 'revoke',
    label: 'Token Revocation',
    description: 'Revoke access tokens',
    icon: '⊘',
    applicableResourceTypes: ['oauth', 'github'],
  },
  {
    type: 'validate',
    label: 'Token Validation',
    description: 'Validate token validity',
    icon: '✓',
    applicableResourceTypes: ['oauth', 'apikey', 'github'],
  },
  {
    type: 'request',
    label: 'API Request',
    description: 'Make an API request',
    icon: '📡',
  },
  {
    type: 'health',
    label: 'Health Check',
    description: 'Check service health',
    icon: '💚',
  },
  {
    type: 'webhook',
    label: 'Webhook Event',
    description: 'Receive webhook event',
    icon: '🔔',
    applicableResourceTypes: ['rest', 'github', 'custom'],
  },
];

/**
 * Resource add handshake button props
 */
export interface ResourceAddHandshakeButtonProps {
  /** Handshake add handler */
  onAddHandshake: (type: HandshakeType) => void;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Resource type (for filtering options) */
  resourceType?: ResourceType;
  
  /** Button label */
  label?: string;
  
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  
  /** Custom class name */
  className?: string;
}

/**
 * Resource Add Handshake Button Component
 */
export const ResourceAddHandshakeButton: React.FC<ResourceAddHandshakeButtonProps> = ({
  onAddHandshake,
  disabled = false,
  resourceType,
  label = 'Add Handshake',
  size = 'medium',
  variant = 'secondary',
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on resource type
  const options = resourceType
    ? HANDSHAKE_TYPE_OPTIONS.filter(opt => 
        !opt.applicableResourceTypes || 
        opt.applicableResourceTypes.includes(resourceType)
      )
    : HANDSHAKE_TYPE_OPTIONS;

  // ============================================
  // HANDLERS
  // ============================================

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    setFocusedIndex(-1);
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  }, []);

  const handleSelect = useCallback((type: HandshakeType) => {
    onAddHandshake(type);
    handleClose();
  }, [onAddHandshake, handleClose]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        );
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex].type);
        }
        break;
        
      case 'Tab':
        handleClose();
        break;
    }
  }, [isOpen, focusedIndex, options, handleClose, handleSelect]);

  // Click outside handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClose]);

  // ============================================
  // RENDER
  // ============================================

  const buttonClasses = [
    'resource-add-handshake-button',
    `resource-add-handshake-button--${size}`,
    `resource-add-handshake-button--${variant}`,
    isOpen ? 'resource-add-handshake-button--open' : '',
    disabled ? 'resource-add-handshake-button--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="resource-add-handshake-button__container">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        className={buttonClasses}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="resource-add-handshake-button__icon">🤝</span>
        <span className="resource-add-handshake-button__label">{label}</span>
        <span className="resource-add-handshake-button__caret">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="resource-add-handshake-button__dropdown"
          role="listbox"
          aria-label="Select handshake type"
        >
          {options.map((option, index) => (
            <button
              key={option.type}
              type="button"
              className={`resource-add-handshake-button__option ${
                index === focusedIndex 
                  ? 'resource-add-handshake-button__option--focused' 
                  : ''
              }`}
              onClick={() => handleSelect(option.type)}
              onMouseEnter={() => setFocusedIndex(index)}
              role="option"
              aria-selected={index === focusedIndex}
            >
              <span className="resource-add-handshake-button__option-icon">
                {option.icon}
              </span>
              <span className="resource-add-handshake-button__option-content">
                <span className="resource-add-handshake-button__option-label">
                  {option.label}
                </span>
                <span className="resource-add-handshake-button__option-desc">
                  {option.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Quick handshake buttons - inline action buttons
 */
export interface QuickHandshakeButtonsProps {
  /** Handshake handler */
  onHandshake: (type: HandshakeType) => void;
  
  /** Resource type */
  resourceType?: ResourceType;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Is loading */
  isLoading?: boolean;
  
  /** Currently loading type */
  loadingType?: HandshakeType;
  
  /** Show labels */
  showLabels?: boolean;
  
  /** Custom class name */
  className?: string;
}

export const QuickHandshakeButtons: React.FC<QuickHandshakeButtonsProps> = ({
  onHandshake,
  resourceType,
  disabled = false,
  isLoading = false,
  loadingType,
  showLabels = true,
  className = '',
}) => {
  // Quick action types
  const quickTypes: HandshakeType[] = ['auth', 'request', 'health'];
  
  // Filter based on resource type
  const visibleTypes = resourceType
    ? quickTypes.filter(type => {
        const option = HANDSHAKE_TYPE_OPTIONS.find(o => o.type === type);
        return !option?.applicableResourceTypes || 
               option.applicableResourceTypes.includes(resourceType);
      })
    : quickTypes;

  return (
    <div className={`quick-handshake-buttons ${className}`}>
      {visibleTypes.map(type => {
        const option = HANDSHAKE_TYPE_OPTIONS.find(o => o.type === type);
        if (!option) return null;
        
        const isTypeLoading = isLoading && loadingType === type;
        
        return (
          <button
            key={type}
            type="button"
            className={`quick-handshake-button quick-handshake-button--${type}`}
            onClick={() => onHandshake(type)}
            disabled={disabled || isLoading}
            title={option.description}
          >
            <span className="quick-handshake-button__icon">
              {isTypeLoading ? '⏳' : option.icon}
            </span>
            {showLabels && (
              <span className="quick-handshake-button__label">
                {option.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Handshake type selector - radio group
 */
export interface HandshakeTypeSelectorProps {
  /** Selected type */
  value?: HandshakeType;
  
  /** Change handler */
  onChange: (type: HandshakeType) => void;
  
  /** Resource type */
  resourceType?: ResourceType;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  
  /** Custom class name */
  className?: string;
}

export const HandshakeTypeSelector: React.FC<HandshakeTypeSelectorProps> = ({
  value,
  onChange,
  resourceType,
  disabled = false,
  direction = 'vertical',
  className = '',
}) => {
  // Filter options based on resource type
  const options = resourceType
    ? HANDSHAKE_TYPE_OPTIONS.filter(opt => 
        !opt.applicableResourceTypes || 
        opt.applicableResourceTypes.includes(resourceType)
      )
    : HANDSHAKE_TYPE_OPTIONS;

  return (
    <div 
      className={`handshake-type-selector handshake-type-selector--${direction} ${className}`}
      role="radiogroup"
      aria-label="Select handshake type"
    >
      {options.map(option => (
        <button
          key={option.type}
          type="button"
          className={`handshake-type-selector__option ${
            value === option.type ? 'handshake-type-selector__option--selected' : ''
          }`}
          onClick={() => onChange(option.type)}
          disabled={disabled}
          role="radio"
          aria-checked={value === option.type}
        >
          <span className="handshake-type-selector__icon">{option.icon}</span>
          <span className="handshake-type-selector__content">
            <span className="handshake-type-selector__label">{option.label}</span>
            <span className="handshake-type-selector__desc">{option.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
};

/**
 * Handshake outcome badge
 */
export interface HandshakeOutcomeBadgeProps {
  outcome: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const HandshakeOutcomeBadge: React.FC<HandshakeOutcomeBadgeProps> = ({
  outcome,
  size = 'medium',
  className = '',
}) => {
  const outcomeConfig: Record<string, { icon: string; color: string }> = {
    OK: { icon: '✓', color: 'success' },
    FAIL: { icon: '✗', color: 'error' },
    TIMEOUT: { icon: '⏱', color: 'warning' },
    REFRESH: { icon: '↻', color: 'info' },
    REVOKE: { icon: '⊘', color: 'neutral' },
    PARTIAL: { icon: '◐', color: 'warning' },
    RETRY: { icon: '↺', color: 'info' },
    PENDING: { icon: '⋯', color: 'neutral' },
  };
  
  const config = outcomeConfig[outcome] || { icon: '?', color: 'neutral' };
  
  return (
    <span 
      className={`handshake-outcome-badge handshake-outcome-badge--${config.color} handshake-outcome-badge--${size} ${className}`}
    >
      <span className="handshake-outcome-badge__icon">{config.icon}</span>
      <span className="handshake-outcome-badge__label">{outcome}</span>
    </span>
  );
};

/**
 * Handshake timeline item
 */
export interface HandshakeTimelineItemProps {
  type: HandshakeType;
  outcome: string;
  timestamp: Date;
  durationMs?: number;
  error?: string;
  onClick?: () => void;
  className?: string;
}

export const HandshakeTimelineItem: React.FC<HandshakeTimelineItemProps> = ({
  type,
  outcome,
  timestamp,
  durationMs,
  error,
  onClick,
  className = '',
}) => {
  const option = HANDSHAKE_TYPE_OPTIONS.find(o => o.type === type);
  
  return (
    <div 
      className={`handshake-timeline-item handshake-timeline-item--${outcome.toLowerCase()} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="handshake-timeline-item__dot">
        <HandshakeOutcomeBadge outcome={outcome} size="small" />
      </div>
      <div className="handshake-timeline-item__content">
        <div className="handshake-timeline-item__header">
          <span className="handshake-timeline-item__type">
            {option?.icon} {option?.label || type}
          </span>
          <span className="handshake-timeline-item__time">
            {formatTime(timestamp)}
          </span>
        </div>
        <div className="handshake-timeline-item__details">
          {durationMs !== undefined && (
            <span className="handshake-timeline-item__duration">
              {durationMs}ms
            </span>
          )}
          {error && (
            <span className="handshake-timeline-item__error">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Format time for display
 */
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

export default ResourceAddHandshakeButton;
