// ============================================
// PROTOCOL OS - UI STORE
// ============================================
// Address: 1.5.6.a
// Purpose: Zustand store for global UI state management
// ============================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Theme options
 */
export type ThemeMode = 'dark' | 'light' | 'system';

/**
 * Panel layout options
 */
export type PanelLayout = 'horizontal' | 'vertical' | 'stacked';

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  type: string | null;
  props?: Record<string, unknown>;
}

/**
 * UI Store State
 */
interface UiState {
  // Theme
  themeMode: ThemeMode;
  accentColor: string;
  
  // Layout
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  panelLayout: PanelLayout;
  showLogger: boolean;
  loggerHeight: number;
  
  // Accordion State
  expandedPlatformIds: Set<string>;
  expandedResourceIds: Set<string>;
  
  // Toasts
  toasts: Toast[];
  
  // Modal
  modal: ModalState;
  
  // Loading States
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Feature Flags
  developerMode: boolean;
  verboseLogging: boolean;
}

/**
 * UI Store Actions
 */
interface UiActions {
  // Theme
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  
  // Layout
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setPanelLayout: (layout: PanelLayout) => void;
  toggleLogger: () => void;
  setLoggerHeight: (height: number) => void;
  
  // Accordion
  togglePlatformExpanded: (id: string) => void;
  toggleResourceExpanded: (id: string) => void;
  expandAllPlatforms: (ids: string[]) => void;
  collapseAllPlatforms: () => void;
  expandAllResources: (ids: string[]) => void;
  collapseAllResources: () => void;
  
  // Toasts
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  
  // Modal
  openModal: (type: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  // Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Feature Flags
  toggleDeveloperMode: () => void;
  toggleVerboseLogging: () => void;
  
  // Keyboard Shortcuts
  registerShortcuts: () => void;
}

type UiStore = UiState & UiActions;

/**
 * Create UI Store
 */
export const useUiStore = create<UiStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        themeMode: 'dark',
        accentColor: '#14b8a6', // Teal
        sidebarCollapsed: false,
        sidebarWidth: 320,
        panelLayout: 'horizontal',
        showLogger: true,
        loggerHeight: 200,
        expandedPlatformIds: new Set(),
        expandedResourceIds: new Set(),
        toasts: [],
        modal: { isOpen: false, type: null },
        globalLoading: false,
        loadingMessage: null,
        developerMode: false,
        verboseLogging: false,

        // Theme
        setThemeMode: (mode) => {
          set({ themeMode: mode });
          // Apply to document
          const root = document.documentElement;
          if (mode === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', prefersDark);
          } else {
            root.classList.toggle('dark', mode === 'dark');
          }
        },

        setAccentColor: (color) => {
          set({ accentColor: color });
          document.documentElement.style.setProperty('--accent-color', color);
        },

        // Layout
        toggleSidebar: () => {
          set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
        },

        setSidebarWidth: (width) => {
          set({ sidebarWidth: Math.min(600, Math.max(200, width)) });
        },

        setPanelLayout: (layout) => {
          set({ panelLayout: layout });
        },

        toggleLogger: () => {
          set(state => ({ showLogger: !state.showLogger }));
        },

        setLoggerHeight: (height) => {
          set({ loggerHeight: Math.min(500, Math.max(100, height)) });
        },

        // Accordion
        togglePlatformExpanded: (id) => {
          set(state => {
            const newSet = new Set(state.expandedPlatformIds);
            if (newSet.has(id)) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            return { expandedPlatformIds: newSet };
          });
        },

        toggleResourceExpanded: (id) => {
          set(state => {
            const newSet = new Set(state.expandedResourceIds);
            if (newSet.has(id)) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            return { expandedResourceIds: newSet };
          });
        },

        expandAllPlatforms: (ids) => {
          set({ expandedPlatformIds: new Set(ids) });
        },

        collapseAllPlatforms: () => {
          set({ expandedPlatformIds: new Set() });
        },

        expandAllResources: (ids) => {
          set({ expandedResourceIds: new Set(ids) });
        },

        collapseAllResources: () => {
          set({ expandedResourceIds: new Set() });
        },

        // Toasts
        showToast: (toast) => {
          const id = crypto.randomUUID();
          const newToast: Toast = {
            ...toast,
            id,
            duration: toast.duration ?? 5000,
            dismissible: toast.dismissible ?? true,
          };

          set(state => ({
            toasts: [...state.toasts, newToast],
          }));

          // Auto-dismiss
          if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => {
              get().dismissToast(id);
            }, newToast.duration);
          }
        },

        dismissToast: (id) => {
          set(state => ({
            toasts: state.toasts.filter(t => t.id !== id),
          }));
        },

        clearAllToasts: () => {
          set({ toasts: [] });
        },

        // Modal
        openModal: (type, props) => {
          set({ modal: { isOpen: true, type, props } });
        },

        closeModal: () => {
          set({ modal: { isOpen: false, type: null, props: undefined } });
        },

        // Loading
        setGlobalLoading: (loading, message) => {
          set({ globalLoading: loading, loadingMessage: message ?? null });
        },

        // Feature Flags
        toggleDeveloperMode: () => {
          set(state => ({ developerMode: !state.developerMode }));
        },

        toggleVerboseLogging: () => {
          set(state => ({ verboseLogging: !state.verboseLogging }));
        },

        // Keyboard Shortcuts
        registerShortcuts: () => {
          document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + B: Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
              e.preventDefault();
              get().toggleSidebar();
            }

            // Ctrl/Cmd + L: Toggle logger
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
              e.preventDefault();
              get().toggleLogger();
            }

            // Escape: Close modal
            if (e.key === 'Escape' && get().modal.isOpen) {
              get().closeModal();
            }

            // Ctrl/Cmd + Shift + D: Toggle developer mode
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
              e.preventDefault();
              get().toggleDeveloperMode();
            }
          });
        },
      }),
      {
        name: 'protocol-os-ui-store',
        partialize: (state) => ({
          themeMode: state.themeMode,
          accentColor: state.accentColor,
          sidebarCollapsed: state.sidebarCollapsed,
          sidebarWidth: state.sidebarWidth,
          panelLayout: state.panelLayout,
          showLogger: state.showLogger,
          loggerHeight: state.loggerHeight,
          developerMode: state.developerMode,
          verboseLogging: state.verboseLogging,
        }),
      }
    ),
    { name: 'UiStore' }
  )
);

export default useUiStore;
