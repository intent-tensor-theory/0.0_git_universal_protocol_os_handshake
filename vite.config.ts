// ============================================
// PROTOCOL OS - VITE CONFIGURATION
// ============================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./1.0_folderSourceCode', import.meta.url)),
      '@theme': fileURLToPath(new URL('./1.0_folderSourceCode/1.10_folderThemeAndStyling', import.meta.url)),
      '@database': fileURLToPath(new URL('./1.0_folderSourceCode/1.2_folderDatabasePersistence', import.meta.url)),
      '@registry': fileURLToPath(new URL('./1.0_folderSourceCode/1.3_folderProtocolRegistry', import.meta.url)),
      '@protocols': fileURLToPath(new URL('./1.0_folderSourceCode/1.4_folderProtocolImplementations', import.meta.url)),
      '@context': fileURLToPath(new URL('./1.0_folderSourceCode/1.5_folderContextStateManagement', import.meta.url)),
      '@pages': fileURLToPath(new URL('./1.0_folderSourceCode/1.6_folderApplicationPages', import.meta.url)),
      '@ui': fileURLToPath(new URL('./1.0_folderSourceCode/1.7_folderSharedUserInterfaceComponents', import.meta.url)),
      '@utils': fileURLToPath(new URL('./1.0_folderSourceCode/1.8_folderSharedUtilities', import.meta.url)),
      '@types': fileURLToPath(new URL('./1.0_folderSourceCode/1.9_folderSharedTypeDefinitions', import.meta.url)),
    },
  },
  
  server: {
    port: 3000,
    open: true,
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
