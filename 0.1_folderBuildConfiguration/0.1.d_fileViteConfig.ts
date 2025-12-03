// ============================================
// PROTOCOL OS - VITE BUILD CONFIGURATION
// ============================================
// Address: 0.1.d
// Purpose: Configure Vite bundler for React + TypeScript
// ============================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // --- PATH RESOLUTION ---
  resolve: {
    alias: {
      '@': resolve(__dirname, './1.0_folderSourceCode'),
      '@config': resolve(__dirname, './1.0_folderSourceCode/1.1_folderApplicationConfiguration'),
      '@database': resolve(__dirname, './1.0_folderSourceCode/1.2_folderDatabasePersistenceProviders'),
      '@protocols': resolve(__dirname, './1.0_folderSourceCode/1.3_folderProtocolHandshakeRegistry'),
      '@tree': resolve(__dirname, './1.0_folderSourceCode/1.4_folderPlatformResourceHandshakeTree'),
      '@saved': resolve(__dirname, './1.0_folderSourceCode/1.5_folderSavedHandshakesLibrary'),
      '@output': resolve(__dirname, './1.0_folderSourceCode/1.6_folderExecutionOutputDisplay'),
      '@components': resolve(__dirname, './1.0_folderSourceCode/1.7_folderSharedUserInterfaceComponents'),
      '@utils': resolve(__dirname, './1.0_folderSourceCode/1.8_folderSharedUtilities'),
      '@types': resolve(__dirname, './1.0_folderSourceCode/1.9_folderSharedTypeDefinitions'),
      '@theme': resolve(__dirname, './1.0_folderSourceCode/1.10_folderThemeAndStyling'),
    },
  },

  // --- BUILD CONFIGURATION ---
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-utils': ['uuid'],
        },
      },
    },
  },

  // --- DEVELOPMENT SERVER ---
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    open: true,
  },

  // --- PREVIEW SERVER ---
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },

  // --- ENVIRONMENT VARIABLES ---
  envPrefix: 'VITE_',

  // --- CSS CONFIGURATION ---
  css: {
    devSourcemap: true,
  },
});
