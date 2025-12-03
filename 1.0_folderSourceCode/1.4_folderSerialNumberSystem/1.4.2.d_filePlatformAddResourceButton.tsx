// ============================================
// PROTOCOL OS - PLATFORM ADD RESOURCE BUTTON
// ============================================
// Address: 1.4.2.d
// Purpose: Dropdown Button for Adding New Resources
// ============================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ResourceType } from '../1.4.1.b_fileResourceSerialNumberGenerator';

/**
 * Platform Add Resource Button
 * 
 * Provides a dropdown button for adding new resources:
 * - Displays available resource types
 * - Icons and descriptions for each type
 * - Keyboard navigation support
 * - Click outside to close
 */

/**
 * Resource type option
 */
export interface ResourceTypeOption {
  type: ResourceType;
  label: string;
  description: string;
  icon: string;
  category: 'auth' | 'api' | 'realtime' | 'other';
}

/**
 * Available resource types
 */
export const RESOURCE_TYPE_OPTIONS: ResourceTypeOption[] = [
  // Authentication
  {
    type: 'oauth',
    label: 'OAuth Authentication',
    description: 'OAuth 2.0 with PKCE, Auth Code, or Implicit flows',
    icon: '🔑',
    category: 'auth',
  },
  {
    type: 'apikey',
    label: 'API Key',
    description: 'Simple API key authentication',
    icon: '🔒',
    category: 'auth',
  },
  {
    type: 'github',
    label: 'GitHub Integration',
    description: 'GitHub PAT, App, or OAuth authentication',
    icon: '🐙',
    category: 'auth',
  },
  
  // API Types
  {
    type: 'rest',
    label: 'REST API',
    description: 'RESTful HTTP API endpoint',
    icon: '🌐',
    category: 'api',
  },
  {
    type: 'graphql',
    label: 'GraphQL API',
    description: 'GraphQL query endpoint',
    icon: '◈',
    category: 'api',
  },
  {
    type: 'soap',
    label: 'SOAP Service',
    description: 'XML-based SOAP web service',
    icon: '📄',
    category: 'api',
  },
  
  // Real-time
  {
    type: 'websocket',
    label: 'WebSocket',
    description: 'Real-time bidirectional connection',
    icon: '⚡',
    category: 'realtime',
  },
  
  // Other
  {
    type: 'scraper',
    label: 'Web Scraper',
    description: 'Public web scraping (no auth)',
    icon: '🕷️',
    category: 'other',
  },
  {
    type: 'custom',
    label: 'Custom Protocol',
    description: 'Custom or unsupported protocol',
    icon: '⚙️',
    category: 'other',
  },
];

/**
 * Category labels
 */
const CATEGORY_LABELS: Record<string, string> = {
  auth: 'Authentication',
  api: 'API Types',
  realtime: 'Real-time',
  other: 'Other',
};

/**
 * Platform add resource button props
 */
export interface PlatformAddResourceButtonProps {
  /** Resource add handler */
  onAddResource: (type: ResourceType) => void;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Button label */
  label?: string;
  
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  
  /** Show categories */
  showCategories?: boolean;
  
  /** Filter available types */
  availableTypes?: ResourceType[];
  
  /** Custom class name */
  className?: string;
}

/**
 * Platform Add Resource Button Component
 */
export const PlatformAddResourceButton: React.FC<PlatformAddResourceButtonProps> = ({
  onAddResource,
  disabled = false,
  label = 'Add Resource',
  size = 'medium',
  variant = 'primary',
  showCategories = true,
  availableTypes,
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options if availableTypes provided
  const options = availableTypes
    ? RESOURCE_TYPE_OPTIONS.filter(opt => availableTypes.includes(opt.type))
    : RESOURCE_TYPE_OPTIONS;

  // Group by category
  const groupedOptions = showCategories
    ? options.reduce((acc, opt) => {
        if (!acc[opt.category]) acc[opt.category] = [];
        acc[opt.category].push(opt);
        return acc;
      }, {} as Record<string, ResourceTypeOption[]>)
    : { all: options };

  // Flat list for keyboard navigation
  const flatOptions = Object.values(groupedOptions).flat();

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

  const handleSelect = useCallback((type: ResourceType) => {
    onAddResource(type);
    handleClose();
  }, [onAddResource, handleClose]);

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
          prev < flatOptions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : flatOptions.length - 1
        );
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < flatOptions.length) {
          handleSelect(flatOptions[focusedIndex].type);
        }
        break;
        
      case 'Tab':
        handleClose();
        break;
    }
  }, [isOpen, focusedIndex, flatOptions, handleClose, handleSelect]);

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
    'platform-add-resource-button',
    `platform-add-resource-button--${size}`,
    `platform-add-resource-button--${variant}`,
    isOpen ? 'platform-add-resource-button--open' : '',
    disabled ? 'platform-add-resource-button--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="platform-add-resource-button__container">
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
        <span className="platform-add-resource-button__icon">+</span>
        <span className="platform-add-resource-button__label">{label}</span>
        <span className="platform-add-resource-button__caret">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="platform-add-resource-button__dropdown"
          role="listbox"
          aria-label="Select resource type"
        >
          {showCategories ? (
            // Grouped by category
            Object.entries(groupedOptions).map(([category, categoryOptions]) => (
              <div key={category} className="platform-add-resource-button__category">
                <div className="platform-add-resource-button__category-label">
                  {CATEGORY_LABELS[category] || category}
                </div>
                {categoryOptions.map((option, index) => {
                  const globalIndex = flatOptions.findIndex(o => o.type === option.type);
                  return (
                    <button
                      key={option.type}
                      type="button"
                      className={`platform-add-resource-button__option ${
                        globalIndex === focusedIndex 
                          ? 'platform-add-resource-button__option--focused' 
                          : ''
                      }`}
                      onClick={() => handleSelect(option.type)}
                      onMouseEnter={() => setFocusedIndex(globalIndex)}
                      role="option"
                      aria-selected={globalIndex === focusedIndex}
                    >
                      <span className="platform-add-resource-button__option-icon">
                        {option.icon}
                      </span>
                      <span className="platform-add-resource-button__option-content">
                        <span className="platform-add-resource-button__option-label">
                          {option.label}
                        </span>
                        <span className="platform-add-resource-button__option-desc">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          ) : (
            // Flat list
            flatOptions.map((option, index) => (
              <button
                key={option.type}
                type="button"
                className={`platform-add-resource-button__option ${
                  index === focusedIndex 
                    ? 'platform-add-resource-button__option--focused' 
                    : ''
                }`}
                onClick={() => handleSelect(option.type)}
                onMouseEnter={() => setFocusedIndex(index)}
                role="option"
                aria-selected={index === focusedIndex}
              >
                <span className="platform-add-resource-button__option-icon">
                  {option.icon}
                </span>
                <span className="platform-add-resource-button__option-content">
                  <span className="platform-add-resource-button__option-label">
                    {option.label}
                  </span>
                  <span className="platform-add-resource-button__option-desc">
                    {option.description}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Simple resource type selector (inline buttons)
 */
export interface ResourceTypeSelectorProps {
  /** Selected type */
  value?: ResourceType;
  
  /** Change handler */
  onChange: (type: ResourceType) => void;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Available types */
  availableTypes?: ResourceType[];
  
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  
  /** Custom class name */
  className?: string;
}

export const ResourceTypeSelector: React.FC<ResourceTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  availableTypes,
  direction = 'horizontal',
  className = '',
}) => {
  const options = availableTypes
    ? RESOURCE_TYPE_OPTIONS.filter(opt => availableTypes.includes(opt.type))
    : RESOURCE_TYPE_OPTIONS;

  return (
    <div 
      className={`resource-type-selector resource-type-selector--${direction} ${className}`}
      role="radiogroup"
      aria-label="Select resource type"
    >
      {options.map(option => (
        <button
          key={option.type}
          type="button"
          className={`resource-type-selector__option ${
            value === option.type ? 'resource-type-selector__option--selected' : ''
          }`}
          onClick={() => onChange(option.type)}
          disabled={disabled}
          role="radio"
          aria-checked={value === option.type}
          title={option.description}
        >
          <span className="resource-type-selector__icon">{option.icon}</span>
          <span className="resource-type-selector__label">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Quick add resource button (single action)
 */
export interface QuickAddResourceButtonProps {
  /** Resource type to add */
  resourceType: ResourceType;
  
  /** Add handler */
  onAdd: (type: ResourceType) => void;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Show label */
  showLabel?: boolean;
  
  /** Custom class name */
  className?: string;
}

export const QuickAddResourceButton: React.FC<QuickAddResourceButtonProps> = ({
  resourceType,
  onAdd,
  disabled = false,
  showLabel = true,
  className = '',
}) => {
  const option = RESOURCE_TYPE_OPTIONS.find(opt => opt.type === resourceType);
  
  if (!option) return null;

  return (
    <button
      type="button"
      className={`quick-add-resource-button ${className}`}
      onClick={() => onAdd(resourceType)}
      disabled={disabled}
      title={option.description}
    >
      <span className="quick-add-resource-button__icon">{option.icon}</span>
      {showLabel && (
        <span className="quick-add-resource-button__label">
          Add {option.label}
        </span>
      )}
    </button>
  );
};

export default PlatformAddResourceButton;
