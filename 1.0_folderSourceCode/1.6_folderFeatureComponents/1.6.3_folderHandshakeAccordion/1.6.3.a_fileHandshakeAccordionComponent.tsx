// ============================================
// PROTOCOL OS - HANDSHAKE ACCORDION COMPONENT
// ============================================
// Address: 1.6.3.a
// Purpose: Accordion for handshakes within a resource
// ============================================

import React, { useState, useCallback } from 'react';
import type { Handshake, CurlRequest } from '@types/1.9.c_filePlatformTypeDefinitions';

// ----------------------------------------
// Types
// ----------------------------------------

interface HandshakeAccordionProps {
  handshakes: Handshake[];
  onHandshakeSelect?: (handshake: Handshake) => void;
  onHandshakeEdit?: (handshake: Handshake) => void;
  onHandshakeDelete?: (handshake: Handshake) => void;
  onHandshakeExecute?: (handshake: Handshake) => void;
  onAddHandshake?: () => void;
  onRequestSelect?: (handshake: Handshake, request: CurlRequest) => void;
  selectedHandshakeId?: string | null;
  className?: string;
}

interface HandshakeItemProps {
  handshake: Handshake;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExecute?: () => void;
  onRequestSelect?: (request: CurlRequest) => void;
}

// ----------------------------------------
// Request List Item
// ----------------------------------------

function RequestListItem({
  request,
  index,
  onSelect,
}: {
  request: CurlRequest;
  index: number;
  onSelect?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Extract method from curl command
  const getMethod = (command: string): string => {
    const match = command.match(/-X\s+(\w+)/i);
    return match ? match[1].toUpperCase() : 'GET';
  };

  const method = getMethod(request.command);
  const methodColors: Record<string, string> = {
    GET: 'var(--color-green-500)',
    POST: 'var(--color-blue-500)',
    PUT: 'var(--color-orange-500)',
    PATCH: 'var(--color-yellow-500)',
    DELETE: 'var(--color-red-500)',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 8px',
        marginBottom: '2px',
        borderRadius: '6px',
        cursor: 'pointer',
        backgroundColor: isHovered ? 'var(--color-surface-hover)' : 'transparent',
        gap: '8px',
        fontSize: '12px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Index */}
      <span style={{ 
        color: 'var(--color-text-tertiary)', 
        width: '16px',
        textAlign: 'right',
      }}>
        {index + 1}.
      </span>

      {/* Method Badge */}
      <span
        style={{
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 600,
          backgroundColor: `${methodColors[method] || 'var(--color-gray-500)'}20`,
          color: methodColors[method] || 'var(--color-gray-500)',
          minWidth: '40px',
          textAlign: 'center',
        }}
      >
        {method}
      </span>

      {/* Title */}
      <span style={{ 
        flex: 1, 
        color: 'var(--color-text-secondary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {request.title}
      </span>
    </div>
  );
}

// ----------------------------------------
// Handshake Item
// ----------------------------------------

function HandshakeItem({
  handshake,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  onEdit,
  onDelete,
  onExecute,
  onRequestSelect,
}: HandshakeItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const requestCount = handshake.curlRequests.length;

  return (
    <div
      className={`handshake-accordion-item ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        marginBottom: '2px',
        borderRadius: '6px',
        border: isSelected ? '1px solid var(--color-blue-500)' : '1px solid transparent',
        backgroundColor: isExpanded ? 'var(--color-surface)' : 'transparent',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 10px',
          cursor: 'pointer',
          gap: '8px',
          borderRadius: '6px',
          backgroundColor: isHovered && !isExpanded ? 'var(--color-surface-hover)' : 'transparent',
        }}
        onClick={onToggle}
      >
        {/* Expand Arrow */}
        <span
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            fontSize: '8px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          ▶
        </span>

        {/* Icon */}
        <span style={{ fontSize: '14px' }}>🤝</span>

        {/* Title */}
        <div 
          style={{ flex: 1, minWidth: 0 }} 
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          <div style={{ 
            fontWeight: 500, 
            fontSize: '13px', 
            color: 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {handshake.title}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
            {requestCount} request{requestCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Actions */}
        {isHovered && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {onExecute && (
              <button
                onClick={(e) => { e.stopPropagation(); onExecute(); }}
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--color-teal-600)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 500,
                }}
                title="Execute Handshake"
              >
                ▶ Run
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-text-tertiary)',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                ✏️
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content - Request List */}
      {isExpanded && handshake.curlRequests.length > 0 && (
        <div
          style={{
            padding: '4px 8px 8px 28px',
          }}
        >
          {handshake.curlRequests.map((request, index) => (
            <RequestListItem
              key={request.id}
              request={request}
              index={index}
              onSelect={() => onRequestSelect?.(request)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------
// Handshake Accordion
// ----------------------------------------

export function HandshakeAccordion({
  handshakes,
  onHandshakeSelect,
  onHandshakeEdit,
  onHandshakeDelete,
  onHandshakeExecute,
  onAddHandshake,
  onRequestSelect,
  selectedHandshakeId,
  className = '',
}: HandshakeAccordionProps) {
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

  if (handshakes.length === 0) {
    return (
      <div
        className={`handshake-accordion empty ${className}`}
        style={{
          padding: '12px',
          textAlign: 'center',
          color: 'var(--color-text-tertiary)',
          fontSize: '12px',
        }}
      >
        <div style={{ marginBottom: '6px' }}>No handshakes</div>
        {onAddHandshake && (
          <button
            onClick={onAddHandshake}
            style={{
              padding: '3px 10px',
              borderRadius: '4px',
              border: '1px dashed var(--color-border)',
              background: 'transparent',
              color: 'var(--color-blue-500)',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            + Add Handshake
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`handshake-accordion ${className}`}>
      {handshakes.map((handshake) => (
        <HandshakeItem
          key={handshake.id}
          handshake={handshake}
          isExpanded={expandedIds.has(handshake.id)}
          isSelected={selectedHandshakeId === handshake.id}
          onToggle={() => toggleExpanded(handshake.id)}
          onSelect={() => onHandshakeSelect?.(handshake)}
          onEdit={onHandshakeEdit ? () => onHandshakeEdit(handshake) : undefined}
          onDelete={onHandshakeDelete ? () => onHandshakeDelete(handshake) : undefined}
          onExecute={onHandshakeExecute ? () => onHandshakeExecute(handshake) : undefined}
          onRequestSelect={
            onRequestSelect 
              ? (request) => onRequestSelect(handshake, request)
              : undefined
          }
        />
      ))}

      {/* Add Handshake Button */}
      {onAddHandshake && (
        <button
          onClick={onAddHandshake}
          style={{
            width: '100%',
            padding: '6px',
            marginTop: '4px',
            borderRadius: '6px',
            border: '1px dashed var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            fontSize: '11px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-blue-500)';
            e.currentTarget.style.color = 'var(--color-blue-500)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.color = 'var(--color-text-tertiary)';
          }}
        >
          + Add Handshake
        </button>
      )}
    </div>
  );
}

export default HandshakeAccordion;
