// ============================================
// PROTOCOL OS - VITE CONFIGURATION
// ============================================

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      // Source code aliases
      '@': path.resolve(__dirname, './1.0_folderSourceCode'),
      '@theme': path.resolve(__dirname, './1.0_folderSourceCode/1.1_folderThemeAndStyling'),
      '@database': path.resolve(__dirname, './1.0_folderSourceCode/1.2_folderDatabaseProviders'),
      '@registry': path.resolve(__dirname, './1.0_folderSourceCode/1.3_folderProtocolRegistry'),
      '@protocols': path.resolve(__dirname, './1.0_folderSourceCode/1.4_folderProtocolImplementations'),
      '@context': path.resolve(__dirname, './1.0_folderSourceCode/1.5_folderContextStateManagement'),
      '@pages': path.resolve(__dirname, './1.0_folderSourceCode/1.6_folderApplicationPages'),
      '@ui': path.resolve(__dirname, './1.0_folderSourceCode/1.7_folderUiComponents'),
      '@utils': path.resolve(__dirname, './1.0_folderSourceCode/1.8_folderUtilityFunctions'),
      '@types': path.resolve(__dirname, './1.0_folderSourceCode/1.9_folderTypeDefinitions'),
    },
  },
  
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          state: ['zustand'],
        },
      },
    },
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand'],
  },
});
