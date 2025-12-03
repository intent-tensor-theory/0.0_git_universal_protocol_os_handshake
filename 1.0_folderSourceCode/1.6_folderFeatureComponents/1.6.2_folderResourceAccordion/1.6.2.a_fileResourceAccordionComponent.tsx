// ============================================
// PROTOCOL OS - RESOURCE ACCORDION COMPONENT
// ============================================
// Address: 1.6.2.a
// Purpose: Accordion for resources within a platform
// ============================================

import React, { useState, useCallback, type ReactNode } from 'react';
import type { Resource, Handshake } from '@types/1.9.c_filePlatformTypeDefinitions';

// ----------------------------------------
// Types
// ----------------------------------------

interface ResourceAccordionProps {
  resources: Resource[];
  onResourceSelect?: (resource: Resource) => void;
  onResourceEdit?: (resource: Resource) => void;
  onResourceDelete?: (resource: Resource) => void;
  onAddResource?: () => void;
  onHandshakeSelect?: (resource: Resource, handshake: Handshake) => void;
  renderHandshakes?: (resource: Resource) => ReactNode;
  selectedResourceId?: string | null;
  className?: string;
}

interface ResourceItemProps {
  resource: Resource;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: ReactNode;
}

// ----------------------------------------
// Resource Item
// ----------------------------------------

function ResourceItem({
  resource,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  children,
}: ResourceItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handshakeCount = resource.handshakes.length;
  const requestCount = resource.handshakes.reduce(
    (acc, h) => acc + h.curlRequests.length,
    0
  );

  return (
    <div
      className={`resource-accordion-item ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        marginBottom: '4px',
        marginLeft: '8px',
        borderRadius: '8px',
        border: isSelected ? '1px solid var(--color-green-500)' : '1px solid transparent',
        backgroundColor: isExpanded ? 'var(--color-surface)' : 'transparent',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Header */}
      <div
        className="resource-accordion-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          cursor: 'pointer',
          gap: '10px',
          borderRadius: '8px',
          backgroundColor: isHovered ? 'var(--color-surface-hover)' : 'transparent',
        }}
        onClick={onToggle}
      >
        {/* Expand Arrow */}
        <span
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            fontSize: '10px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          ▶
        </span>

        {/* Icon */}
        <span style={{ fontSize: '16px' }}>📁</span>

        {/* Title & Meta */}
        <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-text-primary)' }}>
            {resource.baseName}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            {handshakeCount} handshake{handshakeCount !== 1 ? 's' : ''} • {requestCount} request{requestCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Actions */}
        {isHovered && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-tertiary)',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--color-red-900)',
                  color: 'var(--color-red-400)',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div
          className="resource-accordion-content"
          style={{
            padding: '4px 12px 12px 32px',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------
// Resource Accordion
// ----------------------------------------

export function ResourceAccordion({
  resources,
  onResourceSelect,
  onResourceEdit,
  onResourceDelete,
  onAddResource,
  renderHandshakes,
  selectedResourceId,
  className = '',
}: ResourceAccordionProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (resources.length === 0) {
    return (
      <div
        className={`resource-accordion empty ${className}`}
        style={{
          padding: '16px',
          textAlign: 'center',
          color: 'var(--color-text-tertiary)',
          fontSize: '13px',
        }}
      >
        <div style={{ marginBottom: '8px' }}>No resources yet</div>
        {onAddResource && (
          <button
            onClick={onAddResource}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px dashed var(--color-border)',
              background: 'transparent',
              color: 'var(--color-green-500)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            + Add Resource
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`resource-accordion ${className}`}>
      {resources.map((resource) => (
        <ResourceItem
          key={resource.id}
          resource={resource}
          isExpanded={expandedIds.has(resource.id)}
          isSelected={selectedResourceId === resource.id}
          onToggle={() => toggleExpanded(resource.id)}
          onSelect={() => onResourceSelect?.(resource)}
          onEdit={onResourceEdit ? () => onResourceEdit(resource) : undefined}
          onDelete={onResourceDelete ? () => onResourceDelete(resource) : undefined}
        >
          {renderHandshakes?.(resource)}
        </ResourceItem>
      ))}

      {/* Add Resource Button */}
      {onAddResource && (
        <button
          onClick={onAddResource}
          style={{
            width: 'calc(100% - 16px)',
            marginLeft: '8px',
            padding: '8px',
            marginTop: '4px',
            borderRadius: '8px',
            border: '1px dashed var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-green-500)';
            e.currentTarget.style.color = 'var(--color-green-500)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
          }}
        >
          + Add Resource
        </button>
      )}
    </div>
  );
}

export default ResourceAccordion;
