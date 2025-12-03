// ============================================
// PROTOCOL OS - ACCORDION PLUS BUTTON COMPONENT
// ============================================
// Address: 1.7.5.a
// Purpose: Plus button for adding child items in accordion hierarchy
// ============================================

import React, { useState } from 'react';
import './1.7.5.b_fileAccordionPlusButtonStyles.css';

/**
 * Context type for the plus button
 */
export type PlusButtonContext = 
  | 'platform'    // Add resource to platform
  | 'resource'    // Add handshake to resource
  | 'handshake'   // Add curl/model to handshake
  | 'generic';    // Generic add action

/**
 * Props for AccordionPlusButton component
 */
export interface AccordionPlusButtonProps {
  /** Context determining what will be added */
  context: PlusButtonContext;
  
  /** Callback when button is clicked */
  onClick: () => void;
  
  /** Custom label (overrides context default) */
  label?: string;
  
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Whether button is disabled */
  disabled?: boolean;
  
  /** Whether to show label or just icon */
  showLabel?: boolean;
  
  /** Whether the button is in loading state */
  loading?: boolean;
  
  /** Optional CSS class name */
  className?: string;
  
  /** Optional tooltip text */
  tooltip?: string;
}

/**
 * Default labels for each context
 */
const CONTEXT_LABELS: Record<PlusButtonContext, string> = {
  platform: 'Add Resource',
  resource: 'Add Handshake',
  handshake: 'Add Request',
  generic: 'Add Item',
};

/**
 * Default tooltips for each context
 */
const CONTEXT_TOOLTIPS: Record<PlusButtonContext, string> = {
  platform: 'Add a new API resource to this platform',
  resource: 'Add a new handshake to this resource',
  handshake: 'Add a new cURL request or schema model',
  generic: 'Add a new item',
};

/**
 * Plus icon SVG
 */
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className}
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/**
 * Loading spinner SVG
 */
const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={`${className} accordion-plus-button__spinner`}
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

/**
 * AccordionPlusButton Component
 * 
 * A styled plus button used at the bottom of accordion sections
 * to add new child items. Includes context-aware labels and
 * appropriate styling for the hierarchy level.
 * 
 * @example
 * ```tsx
 * // In Platform accordion - adds Resource
 * <AccordionPlusButton
 *   context="platform"
 *   onClick={() => addResource(platformId)}
 *   showLabel
 * />
 * 
 * // In Resource accordion - adds Handshake
 * <AccordionPlusButton
 *   context="resource"
 *   onClick={() => addHandshake(resourceId)}
 * />
 * ```
 */
export const AccordionPlusButton: React.FC<AccordionPlusButtonProps> = ({
  context,
  onClick,
  label,
  size = 'medium',
  disabled = false,
  showLabel = true,
  loading = false,
  className = '',
  tooltip,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const displayLabel = label ?? CONTEXT_LABELS[context];
  const displayTooltip = tooltip ?? CONTEXT_TOOLTIPS[context];

  const handleClick = () => {
    if (!disabled && !loading) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const buttonClasses = [
    'accordion-plus-button',
    `accordion-plus-button--${context}`,
    `accordion-plus-button--${size}`,
    isHovered ? 'accordion-plus-button--hovered' : '',
    isPressed ? 'accordion-plus-button--pressed' : '',
    disabled ? 'accordion-plus-button--disabled' : '',
    loading ? 'accordion-plus-button--loading' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled || loading}
      title={displayTooltip}
      aria-label={displayTooltip}
    >
      {/* Icon container */}
      <span className="accordion-plus-button__icon-wrapper">
        {loading ? (
          <LoadingSpinner className="accordion-plus-button__icon" />
        ) : (
          <PlusIcon className="accordion-plus-button__icon" />
        )}
      </span>

      {/* Label */}
      {showLabel && (
        <span className="accordion-plus-button__label">
          {loading ? 'Adding...' : displayLabel}
        </span>
      )}

      {/* Glow effect layer */}
      <span className="accordion-plus-button__glow" aria-hidden="true" />
    </button>
  );
};

/**
 * Convenience component for Platform context
 */
export const AddResourceButton: React.FC<Omit<AccordionPlusButtonProps, 'context'>> = (props) => (
  <AccordionPlusButton context="platform" {...props} />
);

/**
 * Convenience component for Resource context
 */
export const AddHandshakeButton: React.FC<Omit<AccordionPlusButtonProps, 'context'>> = (props) => (
  <AccordionPlusButton context="resource" {...props} />
);

/**
 * Convenience component for Handshake context
 */
export const AddRequestButton: React.FC<Omit<AccordionPlusButtonProps, 'context'>> = (props) => (
  <AccordionPlusButton context="handshake" {...props} />
);

export default AccordionPlusButton;
