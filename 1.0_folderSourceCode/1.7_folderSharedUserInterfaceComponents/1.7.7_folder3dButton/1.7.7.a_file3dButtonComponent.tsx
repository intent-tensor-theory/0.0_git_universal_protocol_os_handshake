// ============================================
// PROTOCOL OS - 3D BUTTON COMPONENT
// ============================================
// Address: 1.7.7.a
// Purpose: Raised 3D button with press animation
// ============================================

import React, { useState, forwardRef } from 'react';
import './1.7.7.b_file3dButtonStyles.css';

/**
 * Button color variants
 */
export type Button3dVariant = 
  | 'primary'     // Teal - primary actions
  | 'success'     // Green - success/confirm actions
  | 'danger'      // Red - destructive actions
  | 'warning'     // Orange - warning actions
  | 'info'        // Blue - informational actions
  | 'secondary'   // Gray - secondary actions
  | 'ghost';      // Transparent - minimal emphasis

/**
 * Button size variants
 */
export type Button3dSize = 'small' | 'medium' | 'large';

/**
 * Props for Button3d component
 */
export interface Button3dProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: Button3dVariant;
  
  /** Size variant */
  size?: Button3dSize;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Icon to show before label */
  iconBefore?: React.ReactNode;
  
  /** Icon to show after label */
  iconAfter?: React.ReactNode;
  
  /** Loading state */
  loading?: boolean;
  
  /** Loading text (replaces children during loading) */
  loadingText?: string;
  
  /** Whether the button appears raised (3D effect) */
  raised?: boolean;
  
  /** Whether to show glow effect on hover */
  glowOnHover?: boolean;
}

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC = () => (
  <svg 
    className="button-3d__spinner"
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

/**
 * Button3d Component
 * 
 * A stylized button with 3D raised appearance that "presses" when clicked.
 * Supports multiple color variants, sizes, and optional icons.
 * 
 * @example
 * ```tsx
 * // Primary action
 * <Button3d variant="primary" onClick={handleSave}>
 *   Save Configuration
 * </Button3d>
 * 
 * // With icon
 * <Button3d 
 *   variant="success" 
 *   iconBefore={<CheckIcon />}
 *   glowOnHover
 * >
 *   Execute Handshake
 * </Button3d>
 * 
 * // Loading state
 * <Button3d loading loadingText="Processing...">
 *   Submit
 * </Button3d>
 * ```
 */
export const Button3d = forwardRef<HTMLButtonElement, Button3dProps>(({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  iconBefore,
  iconAfter,
  loading = false,
  loadingText,
  raised = true,
  glowOnHover = false,
  disabled,
  className = '',
  children,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
    onMouseDown?.(e);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPressed(false);
    onMouseUp?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPressed(false);
    onMouseLeave?.(e);
  };

  const buttonClasses = [
    'button-3d',
    `button-3d--${variant}`,
    `button-3d--${size}`,
    raised ? 'button-3d--raised' : '',
    isPressed ? 'button-3d--pressed' : '',
    fullWidth ? 'button-3d--full-width' : '',
    loading ? 'button-3d--loading' : '',
    glowOnHover ? 'button-3d--glow-hover' : '',
    disabled ? 'button-3d--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;
  const displayContent = loading && loadingText ? loadingText : children;

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={isDisabled}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {/* Shadow layer for 3D effect */}
      {raised && <span className="button-3d__shadow" aria-hidden="true" />}
      
      {/* Content layer */}
      <span className="button-3d__content">
        {loading && <LoadingSpinner />}
        {!loading && iconBefore && (
          <span className="button-3d__icon button-3d__icon--before">
            {iconBefore}
          </span>
        )}
        <span className="button-3d__label">{displayContent}</span>
        {!loading && iconAfter && (
          <span className="button-3d__icon button-3d__icon--after">
            {iconAfter}
          </span>
        )}
      </span>
      
      {/* Highlight layer */}
      <span className="button-3d__highlight" aria-hidden="true" />
    </button>
  );
});

Button3d.displayName = 'Button3d';

/**
 * Convenience components for common variants
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<Button3dProps, 'variant'>>(
  (props, ref) => <Button3d ref={ref} variant="primary" {...props} />
);
PrimaryButton.displayName = 'PrimaryButton';

export const SuccessButton = forwardRef<HTMLButtonElement, Omit<Button3dProps, 'variant'>>(
  (props, ref) => <Button3d ref={ref} variant="success" {...props} />
);
SuccessButton.displayName = 'SuccessButton';

export const DangerButton = forwardRef<HTMLButtonElement, Omit<Button3dProps, 'variant'>>(
  (props, ref) => <Button3d ref={ref} variant="danger" {...props} />
);
DangerButton.displayName = 'DangerButton';

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<Button3dProps, 'variant'>>(
  (props, ref) => <Button3d ref={ref} variant="secondary" {...props} />
);
SecondaryButton.displayName = 'SecondaryButton';

export const GhostButton = forwardRef<HTMLButtonElement, Omit<Button3dProps, 'variant'>>(
  (props, ref) => <Button3d ref={ref} variant="ghost" raised={false} {...props} />
);
GhostButton.displayName = 'GhostButton';

export default Button3d;
