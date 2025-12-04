// ============================================
// PROTOCOL OS - MAIN ENTRY POINT
// ============================================
// Address: 1.0.a
// Purpose: Application Bootstrap and React Root Initialization
// ============================================

/**
 * Main Entry Point
 * 
 * Initializes the Protocol OS application:
 * - Creates React 18 root
 * - Imports global styles
 * - Mounts App component
 * - Handles initialization errors
 * 
 * Implements Intent Tensor Theory principles where
 * this file represents Δ₀ (Delta Zero) - the genesis
 * point from which all application state collapses.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './1.0.b_fileApp';

// Import global styles in order of specificity
import './1.10_folderThemeAndStyling/1.10.a_fileGlobalCssVariables.css';
import './1.10_folderThemeAndStyling/1.10.b_fileGlassPanel3dEffects.css';
import './1.10_folderThemeAndStyling/1.10.c_fileEkgAnimations.css';
import './1.10_folderThemeAndStyling/1.10.d_fileAccordionHierarchyColors.css';
import './1.10_folderThemeAndStyling/1.10.e_fileFormInputInsetEffects.css';
import './1.10_folderThemeAndStyling/1.10.f_fileButtonRaised3dEffects.css';
import './1.10_folderThemeAndStyling/1.10.g_filePulseGlowAnimations.css';

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application
 */
function initializeApp(): void {
  // Get root element
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    // Create root element if it doesn't exist
    const fallbackRoot = document.createElement('div');
    fallbackRoot.id = 'root';
    document.body.appendChild(fallbackRoot);
    
    console.warn(
      '[Protocol OS] Root element not found, created fallback. ' +
      'Ensure index.html contains <div id="root"></div>'
    );
    
    mountApp(fallbackRoot);
    return;
  }

  mountApp(rootElement);
}

/**
 * Mount the React application
 */
function mountApp(container: HTMLElement): void {
  try {
    // Create React 18 root
    const root = createRoot(container);

    // Render application
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Log successful initialization
    logInitialization();

  } catch (error) {
    // Handle initialization errors
    handleInitializationError(error, container);
  }
}

/**
 * Log successful initialization
 */
function logInitialization(): void {
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    console.log(
      '%c🤝 Protocol OS Initialized',
      'color: #3b82f6; font-size: 14px; font-weight: bold;'
    );
    console.log(
      '%c   Universal API Handshake System',
      'color: #64748b; font-size: 12px;'
    );
    console.log(
      '%c   Intent Tensor Theory Architecture',
      'color: #64748b; font-size: 12px;'
    );
    console.log(
      '%c   Δ₀ → Δ₁ → Δ₂ → Δ₃ → Δ₄ → Δ₅ → Δ₆',
      'color: #8b5cf6; font-size: 11px;'
    );
  }
}

/**
 * Handle initialization errors
 */
function handleInitializationError(error: unknown, container: HTMLElement): void {
  console.error('[Protocol OS] Initialization failed:', error);

  // Render error fallback
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #f1f5f9;
    ">
      <div style="
        max-width: 500px;
        text-align: center;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        backdrop-filter: blur(10px);
      ">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h1 style="
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
          color: #ef4444;
        ">
          Protocol OS Initialization Failed
        </h1>
        <p style="
          font-size: 0.875rem;
          color: #94a3b8;
          margin: 0 0 1.5rem 0;
          line-height: 1.6;
        ">
          The application encountered an error during startup.
          Please try refreshing the page or contact support if the issue persists.
        </p>
        <div style="
          font-size: 0.75rem;
          font-family: monospace;
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: 0.5rem;
          text-align: left;
          color: #f87171;
          word-break: break-word;
        ">
          ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <button 
          onclick="window.location.reload()"
          style="
            margin-top: 1.5rem;
            padding: 0.75rem 1.5rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
          "
          onmouseover="this.style.background='#2563eb'"
          onmouseout="this.style.background='#3b82f6'"
        >
          Refresh Page
        </button>
      </div>
    </div>
  `;
}

// ============================================
// ERROR BOUNDARY (Global)
// ============================================

/**
 * Global error handler for uncaught errors
 */
window.addEventListener('error', (event) => {
  console.error('[Protocol OS] Uncaught error:', event.error);
});

/**
 * Global handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Protocol OS] Unhandled promise rejection:', event.reason);
});

// ============================================
// BOOTSTRAP
// ============================================

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// ============================================
// HOT MODULE REPLACEMENT (Development)
// ============================================

if (import.meta.hot) {
  import.meta.hot.accept();
}

// ============================================
// TYPE DECLARATIONS
// ============================================

declare global {
  interface ImportMeta {
    readonly env: {
      readonly DEV: boolean;
      readonly PROD: boolean;
      readonly MODE: string;
      readonly BASE_URL: string;
      readonly SSR: boolean;
    };
    readonly hot?: {
      accept: (callback?: () => void) => void;
      dispose: (callback: () => void) => void;
    };
  }
}

export {};
