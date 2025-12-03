// ============================================
// PROTOCOL OS - EKG STATUS INDICATOR COMPONENT
// ============================================
// Address: 1.7.2.a
// Purpose: Animated EKG-style health indicator for handshakes
// ============================================

import React from 'react';
import type { HandshakeStatus } from '@types/1.9.c_fileHandshakeTypeDefinitions';
import './1.7.2.c_fileEkgStatusIndicatorStyles.css';

/**
 * Props for EkgStatusIndicator component
 */
export interface EkgStatusIndicatorProps {
  /** Current status of the handshake */
  status: HandshakeStatus;
  
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Whether to show the status label */
  showLabel?: boolean;
  
  /** Optional CSS class name */
  className?: string;
  
  /** Optional tooltip text (overrides default) */
  tooltip?: string;
}

/**
 * Status configuration for visual display
 */
interface StatusConfig {
  label: string;
  cssClass: string;
  tooltip: string;
}

/**
 * Configuration map for each handshake status
 */
const STATUS_CONFIG: Record<HandshakeStatus, StatusConfig> = {
  unconfigured: {
    label: 'Unconfigured',
    cssClass: 'ekg-unconfigured',
    tooltip: 'This handshake needs configuration',
  },
  configured: {
    label: 'Ready',
    cssClass: 'ekg-configured',
    tooltip: 'Configured and ready to execute',
  },
  healthy: {
    label: 'Healthy',
    cssClass: 'ekg-healthy',
    tooltip: 'Last execution was successful',
  },
  failed: {
    label: 'Failed',
    cssClass: 'ekg-failed',
    tooltip: 'Last execution failed',
  },
  processing: {
    label: 'Processing',
    cssClass: 'ekg-processing',
    tooltip: 'Execution in progress...',
  },
};

/**
 * EkgStatusIndicator Component
 * 
 * Displays an animated EKG (electrocardiogram) style indicator
 * showing the health status of a handshake connection.
 * 
 * States:
 * - unconfigured: Sharp blue flat line
 * - configured: Blue with subtle pulse
 * - healthy: Green with strong heartbeat
 * - failed: Red with erratic pattern
 * - processing: Teal with throbbing animation
 * 
 * @example
 * ```tsx
 * <EkgStatusIndicator status="healthy" size="medium" showLabel />
 * ```
 */
export const EkgStatusIndicator: React.FC<EkgStatusIndicatorProps> = ({
  status,
  size = 'medium',
  showLabel = false,
  className = '',
  tooltip,
}) => {
  const config = STATUS_CONFIG[status];
  const displayTooltip = tooltip ?? config.tooltip;

  return (
    <div 
      className={`ekg-status-indicator ekg-status-indicator--${size} ${className}`}
      title={displayTooltip}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {/* EKG Line Container */}
      <div className={`ekg-status-indicator__line ${config.cssClass}`}>
        <svg
          className="ekg-status-indicator__svg"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          {/* Background grid lines (subtle) */}
          <line 
            x1="0" y1="20" x2="100" y2="20" 
            className="ekg-status-indicator__baseline"
          />
          
          {/* EKG Path - The actual heartbeat line */}
          <path
            className="ekg-status-indicator__path"
            d={getEkgPath(status)}
            fill="none"
          />
          
          {/* Animated trace dot */}
          <circle
            className="ekg-status-indicator__dot"
            r="2"
          >
            <animateMotion
              dur={getAnimationDuration(status)}
              repeatCount="indefinite"
              path={getEkgPath(status)}
            />
          </circle>
        </svg>
      </div>

      {/* Status Label */}
      {showLabel && (
        <span className={`ekg-status-indicator__label ${config.cssClass}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

/**
 * Get the SVG path for the EKG line based on status
 */
function getEkgPath(status: HandshakeStatus): string {
  switch (status) {
    case 'healthy':
      // Strong heartbeat pattern
      return 'M0,20 L20,20 L25,20 L30,5 L35,35 L40,15 L45,25 L50,20 L100,20';
    
    case 'failed':
      // Erratic/flatline pattern
      return 'M0,20 L15,20 L20,10 L25,30 L30,15 L35,25 L40,20 L45,22 L50,18 L100,20';
    
    case 'processing':
      // Smooth wave pattern
      return 'M0,20 Q25,10 50,20 T100,20';
    
    case 'configured':
      // Subtle pulse
      return 'M0,20 L40,20 L45,15 L50,25 L55,20 L100,20';
    
    case 'unconfigured':
    default:
      // Flat line
      return 'M0,20 L100,20';
  }
}

/**
 * Get animation duration based on status
 */
function getAnimationDuration(status: HandshakeStatus): string {
  switch (status) {
    case 'healthy':
      return '1.5s';
    case 'processing':
      return '1s';
    case 'failed':
      return '2s';
    case 'configured':
      return '3s';
    case 'unconfigured':
    default:
      return '4s';
  }
}

export default EkgStatusIndicator;
