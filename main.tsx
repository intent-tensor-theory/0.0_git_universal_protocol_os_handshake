// ============================================
// PROTOCOL OS - MAIN ENTRY POINT
// ============================================
// Address: 0.0
// Purpose: Application bootstrap and initialization
// ============================================

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './1.0_folderSourceCode/1.0.b_fileApp';

// Import theme CSS files
import './1.0_folderSourceCode/1.10_folderThemeAndStyling/1.10.a_fileGlobalCssVariables.css';
import './1.0_folderSourceCode/1.10_folderThemeAndStyling/1.10.b_fileGlassPanel3dEffects.css';
import './1.0_folderSourceCode/1.10_folderThemeAndStyling/1.10.c_fileEkgAnimations.css';
import './1.0_folderSourceCode/1.10_folderThemeAndStyling/1.10.d_fileAccordionHierarchyColors.css';
import './1.0_folderSourceCode/1.10_folderThemeAndStyling/1.10.e_fileFormInputInsetEffects.css';
import './1.0_folderSourceCode/1.10_folderThemeAndStyling/1.10.f_fileButtonRaised3dEffects.css';
import './1.0_folderSourceCode/1.10_folderThemeAndStyling/1.10.g_filePulseGlowAnimations.css';
import './1.0_folderSourceCode/1.10_folderThemeAndStyling/1.10.h_fileThemeIndex.css';

/**
 * Initialize and mount the application
 */
function bootstrap(): void {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    throw new Error('Root element not found. Ensure index.html has <div id="root"></div>');
  }

  const root = createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Log initialization
  console.log(
    '%c🔐 Protocol OS v1.0.0',
    'color: #14b8a6; font-size: 16px; font-weight: bold;'
  );
  console.log(
    '%cUniversal API Handshake System',
    'color: #6b7280; font-size: 12px;'
  );
  console.log(
    '%cBuilt with Intent Tensor Theory principles',
    'color: #6b7280; font-size: 10px; font-style: italic;'
  );
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// Hot Module Replacement (HMR) support
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Export for testing
export { bootstrap };
