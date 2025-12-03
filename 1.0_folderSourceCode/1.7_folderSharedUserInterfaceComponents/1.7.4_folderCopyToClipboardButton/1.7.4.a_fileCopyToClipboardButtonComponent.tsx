// ============================================
// PROTOCOL OS - COPY TO CLIPBOARD BUTTON COMPONENT
// ============================================
// Address: 1.7.4.a
// Purpose: Button that copies text to clipboard with visual feedback
// ============================================

import React, { useState, useCallback } from 'react';

/**
 * Props for CopyToClipboardButton component
 */
export interface CopyToClipboardButtonProps {
  /** Text to copy to clipboard */
  textToCopy: string;
  
  /** Button label (default: 'Copy') */
  label?: string;
  
  /** Label shown after successful copy */
  successLabel?: string;
  
  /** Duration to show success state (ms) */
  successDuration?: number;
  
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  
  /** Whether button is disabled */
  disabled?: boolean;
  
  /** Optional CSS class name */
  className?: string;
  
  /** Callback on successful copy */
  onCopy?: (text: string) => void;
  
  /** Callback on copy error */
  onError?: (error: Error) => void;
  
  /** Optional tooltip text */
  tooltip?: string;
  
  /** Whether to show only an icon (no label) */
  iconOnly?: boolean;
}

/**
 * Copy icon SVG
 */
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className}
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

/**
 * Check/success icon SVG
 */
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className}
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * CopyToClipboardButton Component
 * 
 * A button that copies specified text to the system clipboard.
 * Provides visual feedback on successful copy with a temporary
 * success state and icon change.
 * 
 * @example
 * ```tsx
 * <CopyToClipboardButton
 *   textToCopy="curl -X GET https://api.example.com"
 *   label="Copy cURL"
 *   onCopy={() => console.log('Copied!')}
 * />
 * 
 * // Icon-only variant
 * <CopyToClipboardButton
 *   textToCopy={serialNumber}
 *   iconOnly
 *   tooltip="Copy serial number"
 * />
 * ```
 */
export const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  textToCopy,
  label = 'Copy',
  successLabel = 'Copied!',
  successDuration = 2000,
  size = 'medium',
  variant = 'secondary',
  disabled = false,
  className = '',
  onCopy,
  onError,
  tooltip,
  iconOnly = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  const handleCopy = useCallback(async () => {
    if (disabled || !textToCopy) return;

    try {
      // Modern Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error('execCommand copy failed');
        }
      }

      // Success state
      setCopied(true);
      setError(false);
      onCopy?.(textToCopy);

      // Reset after duration
      setTimeout(() => {
        setCopied(false);
      }, successDuration);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Copy failed');
      setError(true);
      onError?.(error);

      // Reset error state
      setTimeout(() => {
        setError(false);
      }, successDuration);
    }
  }, [textToCopy, disabled, successDuration, onCopy, onError]);

  // Build class names
  const buttonClasses = [
    'copy-to-clipboard-button',
    `copy-to-clipboard-button--${size}`,
    `copy-to-clipboard-button--${variant}`,
    copied ? 'copy-to-clipboard-button--copied' : '',
    error ? 'copy-to-clipboard-button--error' : '',
    iconOnly ? 'copy-to-clipboard-button--icon-only' : '',
    disabled ? 'copy-to-clipboard-button--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  const displayLabel = copied ? successLabel : label;
  const displayTooltip = tooltip ?? (iconOnly ? label : undefined);

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleCopy}
      disabled={disabled}
      title={displayTooltip}
      aria-label={iconOnly ? displayLabel : undefined}
    >
      <span className="copy-to-clipboard-button__icon">
        {copied ? <CheckIcon /> : <CopyIcon />}
      </span>
      
      {!iconOnly && (
        <span className="copy-to-clipboard-button__label">
          {displayLabel}
        </span>
      )}
    </button>
  );
};

/**
 * Hook for clipboard operations without a button
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      setError(null);
      
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Copy failed'));
      setCopied(false);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return { copy, copied, error, reset };
}

/* ============================================
   INLINE STYLES (can be extracted to CSS)
   ============================================ */

const styles = `
.copy-to-clipboard-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.copy-to-clipboard-button:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
  border-color: var(--accent-teal);
}

.copy-to-clipboard-button:active:not(:disabled) {
  transform: scale(0.98);
}

.copy-to-clipboard-button--copied {
  border-color: var(--accent-green);
  color: var(--accent-green);
}

.copy-to-clipboard-button--error {
  border-color: var(--accent-red);
  color: var(--accent-red);
}

.copy-to-clipboard-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.copy-to-clipboard-button--icon-only {
  padding: var(--spacing-2);
}

.copy-to-clipboard-button--small {
  padding: var(--spacing-1) var(--spacing-2);
  font-size: var(--font-size-xs);
}

.copy-to-clipboard-button--large {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
}

.copy-to-clipboard-button--primary {
  background-color: var(--accent-teal-primary);
  border-color: var(--accent-teal-primary);
  color: white;
}

.copy-to-clipboard-button--ghost {
  background-color: transparent;
  border-color: transparent;
}

.copy-to-clipboard-button--ghost:hover:not(:disabled) {
  background-color: var(--bg-tertiary);
}

.copy-to-clipboard-button__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-to-clipboard-button__label {
  white-space: nowrap;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  styleElement.setAttribute('data-component', 'copy-to-clipboard-button');
  
  if (!document.querySelector('style[data-component="copy-to-clipboard-button"]')) {
    document.head.appendChild(styleElement);
  }
}

export default CopyToClipboardButton;
