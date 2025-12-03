// ============================================
// PROTOCOL OS - APPLICATION PAGES INDEX
// ============================================
// Address: 1.6
// Purpose: Export all application pages
// ============================================

// Home Dashboard
export { HomeDashboardPage, default as HomeDashboard } from './1.6.1_folderHomeDashboard/1.6.1.a_fileHomeDashboardPage';

// Platform Accordion View
export { PlatformAccordionViewPage, default as PlatformAccordionView } from './1.6.2_folderPlatformAccordionView/1.6.2.a_filePlatformAccordionViewPage';

// Handshake Editor
export { HandshakeEditorPage, default as HandshakeEditor } from './1.6.3_folderHandshakeEditor/1.6.3.a_fileHandshakeEditorPage';

// Saved Handshakes Browser
export { SavedHandshakesBrowserPage, default as SavedHandshakesBrowser } from './1.6.4_folderSavedHandshakesBrowser/1.6.4.a_fileSavedHandshakesBrowserPage';

// Settings
export { SettingsPage, default as Settings } from './1.6.5_folderSettings/1.6.5.a_fileSettingsPage';

/**
 * Route configuration for the application
 */
export const ROUTE_CONFIG = [
  {
    path: '/',
    component: 'HomeDashboardPage',
    title: 'Dashboard',
    icon: 'home',
  },
  {
    path: '/platforms',
    component: 'PlatformAccordionViewPage',
    title: 'Platforms',
    icon: 'layers',
  },
  {
    path: '/platforms/:platformId/resources/:resourceId/handshakes/new',
    component: 'HandshakeEditorPage',
    title: 'New Handshake',
    icon: 'plus',
  },
  {
    path: '/platforms/:platformId/resources/:resourceId/handshakes/:handshakeId',
    component: 'HandshakeEditorPage',
    title: 'Edit Handshake',
    icon: 'edit',
  },
  {
    path: '/saved',
    component: 'SavedHandshakesBrowserPage',
    title: 'Saved Handshakes',
    icon: 'archive',
  },
  {
    path: '/settings',
    component: 'SettingsPage',
    title: 'Settings',
    icon: 'settings',
  },
] as const;

/**
 * Navigation items for sidebar
 */
export const NAVIGATION_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'home' },
  { path: '/platforms', label: 'Platforms', icon: 'layers' },
  { path: '/saved', label: 'Saved', icon: 'archive' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
] as const;
