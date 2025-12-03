// ============================================
// PROTOCOL OS - PLATFORM ACCORDION SECTION
// ============================================
// Address: 1.4.2.a
// Purpose: Main Container for Platform Configuration UI
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import { PlatformAccordionHeader } from './1.4.2.b_filePlatformAccordionHeader';
import { PlatformFormFields } from './1.4.2.c_filePlatformFormFields';
import { PlatformAddResourceButton } from './1.4.2.d_filePlatformAddResourceButton';
import type { PlatformSerialNumber, PlatformEdition } from '../1.4.1.a_filePlatformSerialNumberGenerator';
import type { ResourceSerialNumber, ResourceType } from '../1.4.1.b_fileResourceSerialNumberGenerator';
import './1.4.2.e_filePlatformAccordionSection.css';

/**
 * Platform Accordion Section
 * 
 * Provides a collapsible accordion interface for managing
 * platform configurations and their associated resources.
 * 
 * Features:
 * - Expandable/collapsible sections
 * - Platform metadata display
 * - Resource management
 * - Status indicators
 * - Action buttons
 */

/**
 * Platform configuration data
 */
export interface PlatformConfiguration {
  /** Serial number */
  serial: PlatformSerialNumber;
  
  /** Display name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Platform edition */
  edition: PlatformEdition;
  
  /** Is this the active platform */
  isActive: boolean;
  
  /** Associated resources */
  resources: ResourceSerialNumber[];
  
  /** Creation date */
  createdAt: Date;
  
  /** Last modified date */
  updatedAt: Date;
  
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Platform accordion section props
 */
export interface PlatformAccordionSectionProps {
  /** Platform configuration */
  platform: PlatformConfiguration;
  
  /** Is section expanded */
  isExpanded?: boolean;
  
  /** Default expanded state */
  defaultExpanded?: boolean;
  
  /** Controlled expansion change handler */
  onExpandedChange?: (expanded: boolean) => void;
  
  /** Platform update handler */
  onUpdate?: (platform: PlatformConfiguration) => void;
  
  /** Platform delete handler */
  onDelete?: (serial: string) => void;
  
  /** Platform activate handler */
  onActivate?: (serial: string) => void;
  
  /** Resource add handler */
  onAddResource?: (platformSerial: string, resourceType: ResourceType) => void;
  
  /** Resource select handler */
  onSelectResource?: (resourceSerial: string) => void;
  
  /** Resource delete handler */
  onDeleteResource?: (resourceSerial: string) => void;
  
  /** Is loading */
  isLoading?: boolean;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Show actions */
  showActions?: boolean;
  
  /** Show resources */
  showResources?: boolean;
  
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
 * Platform Accordion Section Component
 */
export const PlatformAccordionSection: React.FC<PlatformAccordionSectionProps> = ({
  platform,
  isExpanded: controlledExpanded,
  defaultExpanded = false,
  onExpandedChange,
  onUpdate,
  onDelete,
  onActivate,
  onAddResource,
  onSelectResource,
  onDeleteResource,
  isLoading = false,
  disabled = false,
  showActions = true,
  showResources = true,
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
  const [editedValues, setEditedValues] = useState<Partial<PlatformConfiguration>>({});

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
      name: platform.name,
      description: platform.description,
    });
  }, [platform]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedValues({});
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (onUpdate) {
      onUpdate({
        ...platform,
        ...editedValues,
        updatedAt: new Date(),
      });
    }
    setIsEditing(false);
    setEditedValues({});
  }, [platform, editedValues, onUpdate]);

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    setEditedValues(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Are you sure you want to delete platform "${platform.name}"? This will also delete all associated resources.`)) {
      onDelete?.(platform.serial.serial);
    }
  }, [platform, onDelete]);

  const handleActivate = useCallback(() => {
    onActivate?.(platform.serial.serial);
  }, [platform, onActivate]);

  const handleAddResource = useCallback((resourceType: ResourceType) => {
    onAddResource?.(platform.serial.serial, resourceType);
  }, [platform, onAddResource]);

  // ============================================
  // COMPUTED
  // ============================================

  const resourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const resource of platform.resources) {
      const type = resource.metadata.resourceType;
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }, [platform.resources]);

  const totalResources = platform.resources.length;

  const activeResources = useMemo(() => {
    return platform.resources.filter(r => r.metadata.status === 'active').length;
  }, [platform.resources]);

  // ============================================
  // RENDER
  // ============================================

  const sectionClasses = [
    'platform-accordion-section',
    isExpanded ? 'platform-accordion-section--expanded' : '',
    platform.isActive ? 'platform-accordion-section--active' : '',
    isLoading ? 'platform-accordion-section--loading' : '',
    disabled ? 'platform-accordion-section--disabled' : '',
    isEditing ? 'platform-accordion-section--editing' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={sectionClasses} style={style}>
      {/* Header */}
      <PlatformAccordionHeader
        platform={platform}
        isExpanded={isExpanded}
        isEditing={isEditing}
        isLoading={isLoading}
        disabled={disabled}
        resourceCount={totalResources}
        activeResourceCount={activeResources}
        showActions={showActions}
        allowEdit={allowEdit}
        allowDelete={allowDelete}
        onToggle={handleToggleExpand}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onActivate={handleActivate}
      />

      {/* Content */}
      <div 
        className="platform-accordion-section__content"
        aria-hidden={!isExpanded}
      >
        <div className="platform-accordion-section__content-inner">
          {/* Platform Details */}
          <div className="platform-accordion-section__details">
            <PlatformFormFields
              values={isEditing ? { ...platform, ...editedValues } : platform}
              onChange={handleFieldChange}
              isEditing={isEditing}
              disabled={disabled || isLoading}
            />

            {/* Edit Actions */}
            {isEditing && (
              <div className="platform-accordion-section__edit-actions">
                <button
                  type="button"
                  className="platform-accordion-section__btn platform-accordion-section__btn--secondary"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="platform-accordion-section__btn platform-accordion-section__btn--primary"
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Resources Section */}
          {showResources && (
            <div className="platform-accordion-section__resources">
              <div className="platform-accordion-section__resources-header">
                <h4 className="platform-accordion-section__resources-title">
                  Resources
                  <span className="platform-accordion-section__resources-count">
                    ({activeResources}/{totalResources})
                  </span>
                </h4>
                
                {/* Resource Type Summary */}
                {totalResources > 0 && (
                  <div className="platform-accordion-section__resource-summary">
                    {Object.entries(resourceCounts).map(([type, count]) => (
                      <span 
                        key={type} 
                        className="platform-accordion-section__resource-badge"
                        data-type={type}
                      >
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Resource List */}
              {totalResources > 0 ? (
                <div className="platform-accordion-section__resource-list">
                  {platform.resources.map(resource => (
                    <div
                      key={resource.serial}
                      className={`platform-accordion-section__resource-item platform-accordion-section__resource-item--${resource.metadata.status}`}
                      onClick={() => onSelectResource?.(resource.serial)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onSelectResource?.(resource.serial);
                        }
                      }}
                    >
                      <div className="platform-accordion-section__resource-icon">
                        {getResourceIcon(resource.metadata.resourceType)}
                      </div>
                      <div className="platform-accordion-section__resource-info">
                        <span className="platform-accordion-section__resource-name">
                          {resource.metadata.name}
                        </span>
                        <span className="platform-accordion-section__resource-type">
                          {resource.metadata.resourceType}
                        </span>
                      </div>
                      <div className="platform-accordion-section__resource-status">
                        <span 
                          className={`platform-accordion-section__status-dot platform-accordion-section__status-dot--${resource.metadata.status}`}
                        />
                        {resource.metadata.status}
                      </div>
                      {onDeleteResource && (
                        <button
                          type="button"
                          className="platform-accordion-section__resource-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete resource "${resource.metadata.name}"?`)) {
                              onDeleteResource(resource.serial);
                            }
                          }}
                          aria-label={`Delete ${resource.metadata.name}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="platform-accordion-section__no-resources">
                  <p>No resources configured yet.</p>
                  <p>Add a resource to start making API connections.</p>
                </div>
              )}

              {/* Add Resource Button */}
              {onAddResource && !disabled && (
                <PlatformAddResourceButton
                  onAddResource={handleAddResource}
                  disabled={disabled || isLoading}
                />
              )}
            </div>
          )}

          {/* Serial Info */}
          <div className="platform-accordion-section__serial-info">
            <div className="platform-accordion-section__serial-row">
              <span className="platform-accordion-section__serial-label">Serial:</span>
              <code className="platform-accordion-section__serial-value">
                {platform.serial.serial}
              </code>
            </div>
            <div className="platform-accordion-section__serial-row">
              <span className="platform-accordion-section__serial-label">Created:</span>
              <span className="platform-accordion-section__serial-value">
                {platform.createdAt.toLocaleDateString()} {platform.createdAt.toLocaleTimeString()}
              </span>
            </div>
            <div className="platform-accordion-section__serial-row">
              <span className="platform-accordion-section__serial-label">Updated:</span>
              <span className="platform-accordion-section__serial-value">
                {platform.updatedAt.toLocaleDateString()} {platform.updatedAt.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Get icon for resource type
 */
function getResourceIcon(type: ResourceType): string {
  const icons: Record<ResourceType, string> = {
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
  return icons[type] || '📦';
}

/**
 * Platform Accordion Group - manages multiple accordions
 */
export interface PlatformAccordionGroupProps {
  /** Platforms to display */
  platforms: PlatformConfiguration[];
  
  /** Allow multiple expanded */
  allowMultiple?: boolean;
  
  /** Initially expanded platform serials */
  defaultExpandedSerials?: string[];
  
  /** All handlers from PlatformAccordionSectionProps */
  onUpdate?: (platform: PlatformConfiguration) => void;
  onDelete?: (serial: string) => void;
  onActivate?: (serial: string) => void;
  onAddResource?: (platformSerial: string, resourceType: ResourceType) => void;
  onSelectResource?: (resourceSerial: string) => void;
  onDeleteResource?: (resourceSerial: string) => void;
  
  /** Custom class name */
  className?: string;
}

export const PlatformAccordionGroup: React.FC<PlatformAccordionGroupProps> = ({
  platforms,
  allowMultiple = false,
  defaultExpandedSerials = [],
  onUpdate,
  onDelete,
  onActivate,
  onAddResource,
  onSelectResource,
  onDeleteResource,
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
    <div className={`platform-accordion-group ${className}`}>
      {platforms.map(platform => (
        <PlatformAccordionSection
          key={platform.serial.serial}
          platform={platform}
          isExpanded={expandedSerials.has(platform.serial.serial)}
          onExpandedChange={(expanded) => handleExpandedChange(platform.serial.serial, expanded)}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onActivate={onActivate}
          onAddResource={onAddResource}
          onSelectResource={onSelectResource}
          onDeleteResource={onDeleteResource}
        />
      ))}
      
      {platforms.length === 0 && (
        <div className="platform-accordion-group__empty">
          <p>No platforms configured.</p>
          <p>Create a platform to get started.</p>
        </div>
      )}
    </div>
  );
};

export default PlatformAccordionSection;
