// ============================================
// PROTOCOL OS - PLATFORM ACCORDION COMPONENT
// ============================================
// Address: 1.6.1.a
// Purpose: Top-level accordion displaying platforms
// ============================================

import React, { useState, useCallback, type ReactNode } from 'react';
import { usePlatforms, usePlatformSelection } from '@state/1.5.a_fileIndex';
import type { Platform } from '@types/1.9.c_filePlatformTypeDefinitions';

// ----------------------------------------
// Types
// ----------------------------------------

interface PlatformAccordionProps {
  onPlatformSelect?: (platform: Platform) => void;
  onPlatformEdit?: (platform: Platform) => void;
  onPlatformDelete?: (platform: Platform) => void;
  onAddPlatform?: () => void;
  renderPlatformContent?: (platform: Platform) => ReactNode;
  className?: string;
}

interface PlatformAccordionItemProps {
  platform: Platform;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: ReactNode;
}

// ----------------------------------------
// Platform Accordion Item
// ----------------------------------------

function PlatformAccordionItem({
  platform,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  children,
}: PlatformAccordionItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Protocol icon mapping
  const getProtocolIcon = (protocolType: string): string => {
    const icons: Record<string, string> = {
      'curl-default': '⌨️',
      'oauth-pkce': '🛡️',
      'oauth-auth-code': '🔑',
      'oauth-implicit': '⚠️',
      'client-credentials': '🖥️',
      'rest-api-key': '🔐',
      'graphql': '⬡',
      'websocket': '📡',
      'soap-xml': '📄',
      'github-repo-runner': '🐙',
      'keyless-scraper': '🌐',
    };
    return icons[protocolType] || '📦';
  };

  return (
    <div
      className={`platform-accordion-item ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        marginBottom: '8px',
        borderRadius: '12px',
        border: isSelected ? '1px solid var(--color-teal-500)' : '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface-elevated)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        className="platform-accordion-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          cursor: 'pointer',
          gap: '12px',
        }}
        onClick={onToggle}
      >
        {/* Expand/Collapse Arrow */}
        <span
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
          }}
        >
          ▶
        </span>

        {/* Protocol Icon */}
        <span style={{ fontSize: '20px' }}>{getProtocolIcon(platform.protocolType)}</span>

        {/* Title & Meta */}
        <div style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {platform.title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {platform.protocolType} • {platform.resources.length} resource{platform.resources.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Actions */}
        {isHovered && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--color-red-900)',
                  color: 'var(--color-red-400)',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div
          className="platform-accordion-content"
          style={{
            padding: '0 16px 16px 48px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------
// Platform Accordion
// ----------------------------------------

export function PlatformAccordion({
  onPlatformSelect,
  onPlatformEdit,
  onPlatformDelete,
  onAddPlatform,
  renderPlatformContent,
  className = '',
}: PlatformAccordionProps) {
  const platforms = usePlatforms();
  const { selectedId, select } = usePlatformSelection();
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

  const handleSelect = useCallback((platform: Platform) => {
    select(platform.id);
    onPlatformSelect?.(platform);
  }, [select, onPlatformSelect]);

  if (platforms.length === 0) {
    return (
      <div
        className={`platform-accordion empty ${className}`}
        style={{
          padding: '32px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)',
          border: '2px dashed var(--color-border)',
          borderRadius: '12px',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <div style={{ marginBottom: '8px', fontWeight: 600 }}>No Platforms Yet</div>
        <div style={{ marginBottom: '16px', fontSize: '14px' }}>
          Create your first platform to get started
        </div>
        {onAddPlatform && (
          <button
            onClick={onAddPlatform}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-teal-500)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            + Add Platform
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`platform-accordion ${className}`}>
      {platforms.map((platform) => (
        <PlatformAccordionItem
          key={platform.id}
          platform={platform}
          isExpanded={expandedIds.has(platform.id)}
          isSelected={selectedId === platform.id}
          onToggle={() => toggleExpanded(platform.id)}
          onSelect={() => handleSelect(platform)}
          onEdit={onPlatformEdit ? () => onPlatformEdit(platform) : undefined}
          onDelete={onPlatformDelete ? () => onPlatformDelete(platform) : undefined}
        >
          {renderPlatformContent?.(platform)}
        </PlatformAccordionItem>
      ))}

      {/* Add Platform Button */}
      {onAddPlatform && (
        <button
          onClick={onAddPlatform}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '8px',
            borderRadius: '12px',
            border: '2px dashed var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-teal-500)';
            e.currentTarget.style.color = 'var(--color-teal-500)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span>
          Add Platform
        </button>
      )}
    </div>
  );
}

export default PlatformAccordion;
