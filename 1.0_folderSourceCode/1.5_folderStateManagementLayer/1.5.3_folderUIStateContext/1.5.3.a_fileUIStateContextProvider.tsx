// ============================================
// PROTOCOL OS - UI STATE CONTEXT PROVIDER
// ============================================
// Address: 1.5.3.a
// Purpose: React Context for UI state management
// ============================================

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

/**
 * Accordion expansion state
 */
interface AccordionState {
  expandedPlatforms: Set<string>;
  expandedResources: Set<string>;
  expandedHandshakes: Set<string>;
}

/**
 * Modal state
 */
interface ModalState {
  activeModal: string | null;
  modalData: Record<string, unknown>;
}

/**
 * Panel state
 */
interface PanelState {
  leftPanelWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  isPanelCollapsed: Record<string, boolean>;
}

/**
 * Theme state
 */
interface ThemeState {
  isDarkMode: boolean;
  accentColor: string;
}

/**
 * Complete UI state
 */
interface UIState {
  accordion: AccordionState;
  modal: ModalState;
  panel: PanelState;
  theme: ThemeState;
  searchQuery: string;
  viewMode: 'list' | 'grid' | 'tree';
  sidebarCollapsed: boolean;
}

/**
 * UI actions
 */
type UIAction =
  // Accordion actions
  | { type: 'TOGGLE_PLATFORM'; payload: string }
  | { type: 'TOGGLE_RESOURCE'; payload: string }
  | { type: 'TOGGLE_HANDSHAKE'; payload: string }
  | { type: 'EXPAND_ALL' }
  | { type: 'COLLAPSE_ALL' }
  | { type: 'EXPAND_TO_ITEM'; payload: { platformId: string; resourceId?: string; handshakeId?: string } }
  // Modal actions
  | { type: 'OPEN_MODAL'; payload: { modalId: string; data?: Record<string, unknown> } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'UPDATE_MODAL_DATA'; payload: Record<string, unknown> }
  // Panel actions
  | { type: 'SET_PANEL_WIDTH'; payload: { panel: 'left' | 'right'; width: number } }
  | { type: 'SET_PANEL_HEIGHT'; payload: { panel: 'bottom'; height: number } }
  | { type: 'TOGGLE_PANEL_COLLAPSE'; payload: string }
  // Theme actions
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_ACCENT_COLOR'; payload: string }
  // General UI actions
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: 'list' | 'grid' | 'tree' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'RESET_UI' };

/**
 * Initial state
 */
const initialState: UIState = {
  accordion: {
    expandedPlatforms: new Set(),
    expandedResources: new Set(),
    expandedHandshakes: new Set(),
  },
  modal: {
    activeModal: null,
    modalData: {},
  },
  panel: {
    leftPanelWidth: 280,
    rightPanelWidth: 320,
    bottomPanelHeight: 200,
    isPanelCollapsed: {},
  },
  theme: {
    isDarkMode: true,
    accentColor: '#00d4aa', // Teal
  },
  searchQuery: '',
  viewMode: 'tree',
  sidebarCollapsed: false,
};

/**
 * UI reducer
 */
function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    // Accordion actions
    case 'TOGGLE_PLATFORM': {
      const newExpanded = new Set(state.accordion.expandedPlatforms);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return {
        ...state,
        accordion: { ...state.accordion, expandedPlatforms: newExpanded },
      };
    }

    case 'TOGGLE_RESOURCE': {
      const newExpanded = new Set(state.accordion.expandedResources);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return {
        ...state,
        accordion: { ...state.accordion, expandedResources: newExpanded },
      };
    }

    case 'TOGGLE_HANDSHAKE': {
      const newExpanded = new Set(state.accordion.expandedHandshakes);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return {
        ...state,
        accordion: { ...state.accordion, expandedHandshakes: newExpanded },
      };
    }

    case 'EXPAND_ALL':
      return state; // Would need platform data to implement

    case 'COLLAPSE_ALL':
      return {
        ...state,
        accordion: {
          expandedPlatforms: new Set(),
          expandedResources: new Set(),
          expandedHandshakes: new Set(),
        },
      };

    case 'EXPAND_TO_ITEM': {
      const newPlatforms = new Set(state.accordion.expandedPlatforms);
      const newResources = new Set(state.accordion.expandedResources);
      
      newPlatforms.add(action.payload.platformId);
      
      if (action.payload.resourceId) {
        newResources.add(action.payload.resourceId);
      }
      
      return {
        ...state,
        accordion: {
          ...state.accordion,
          expandedPlatforms: newPlatforms,
          expandedResources: newResources,
        },
      };
    }

    // Modal actions
    case 'OPEN_MODAL':
      return {
        ...state,
        modal: {
          activeModal: action.payload.modalId,
          modalData: action.payload.data || {},
        },
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modal: { activeModal: null, modalData: {} },
      };

    case 'UPDATE_MODAL_DATA':
      return {
        ...state,
        modal: {
          ...state.modal,
          modalData: { ...state.modal.modalData, ...action.payload },
        },
      };

    // Panel actions
    case 'SET_PANEL_WIDTH':
      return {
        ...state,
        panel: {
          ...state.panel,
          [action.payload.panel === 'left' ? 'leftPanelWidth' : 'rightPanelWidth']: action.payload.width,
        },
      };

    case 'SET_PANEL_HEIGHT':
      return {
        ...state,
        panel: { ...state.panel, bottomPanelHeight: action.payload.height },
      };

    case 'TOGGLE_PANEL_COLLAPSE':
      return {
        ...state,
        panel: {
          ...state.panel,
          isPanelCollapsed: {
            ...state.panel.isPanelCollapsed,
            [action.payload]: !state.panel.isPanelCollapsed[action.payload],
          },
        },
      };

    // Theme actions
    case 'TOGGLE_DARK_MODE':
      return {
        ...state,
        theme: { ...state.theme, isDarkMode: !state.theme.isDarkMode },
      };

    case 'SET_ACCENT_COLOR':
      return {
        ...state,
        theme: { ...state.theme, accentColor: action.payload },
      };

    // General UI actions
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'RESET_UI':
      return initialState;

    default:
      return state;
  }
}

/**
 * Context value type
 */
interface UIContextValue {
  state: UIState;
  // Accordion actions
  togglePlatform: (id: string) => void;
  toggleResource: (id: string) => void;
  toggleHandshake: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  expandToItem: (platformId: string, resourceId?: string, handshakeId?: string) => void;
  // Modal actions
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  updateModalData: (data: Record<string, unknown>) => void;
  // Panel actions
  setPanelWidth: (panel: 'left' | 'right', width: number) => void;
  setPanelHeight: (panel: 'bottom', height: number) => void;
  togglePanelCollapse: (panelId: string) => void;
  // Theme actions
  toggleDarkMode: () => void;
  setAccentColor: (color: string) => void;
  // General actions
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'list' | 'grid' | 'tree') => void;
  toggleSidebar: () => void;
  resetUI: () => void;
  // Selectors
  isPlatformExpanded: (id: string) => boolean;
  isResourceExpanded: (id: string) => boolean;
  isHandshakeExpanded: (id: string) => boolean;
}

/**
 * Create context
 */
const UIContext = createContext<UIContextValue | null>(null);

/**
 * Local storage key for UI state persistence
 */
const UI_STATE_STORAGE_KEY = 'protocol-os-ui-state';

/**
 * UI Provider component
 */
export function UIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState, (initial) => {
    // Try to restore from localStorage
    try {
      const saved = localStorage.getItem(UI_STATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initial,
          theme: parsed.theme || initial.theme,
          panel: parsed.panel || initial.panel,
          viewMode: parsed.viewMode || initial.viewMode,
          sidebarCollapsed: parsed.sidebarCollapsed ?? initial.sidebarCollapsed,
          // Don't restore accordion state - start fresh
        };
      }
    } catch {
      // Ignore parse errors
    }
    return initial;
  });

  // Persist relevant UI state
  useEffect(() => {
    try {
      const toSave = {
        theme: state.theme,
        panel: state.panel,
        viewMode: state.viewMode,
        sidebarCollapsed: state.sidebarCollapsed,
      };
      localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Ignore storage errors
    }
  }, [state.theme, state.panel, state.viewMode, state.sidebarCollapsed]);

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme.isDarkMode);
  }, [state.theme.isDarkMode]);

  // Apply accent color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', state.theme.accentColor);
  }, [state.theme.accentColor]);

  // Accordion actions
  const togglePlatform = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_PLATFORM', payload: id });
  }, []);

  const toggleResource = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_RESOURCE', payload: id });
  }, []);

  const toggleHandshake = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_HANDSHAKE', payload: id });
  }, []);

  const expandAll = useCallback(() => {
    dispatch({ type: 'EXPAND_ALL' });
  }, []);

  const collapseAll = useCallback(() => {
    dispatch({ type: 'COLLAPSE_ALL' });
  }, []);

  const expandToItem = useCallback((platformId: string, resourceId?: string, handshakeId?: string) => {
    dispatch({ type: 'EXPAND_TO_ITEM', payload: { platformId, resourceId, handshakeId } });
  }, []);

  // Modal actions
  const openModal = useCallback((modalId: string, data?: Record<string, unknown>) => {
    dispatch({ type: 'OPEN_MODAL', payload: { modalId, data } });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  const updateModalData = useCallback((data: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_MODAL_DATA', payload: data });
  }, []);

  // Panel actions
  const setPanelWidth = useCallback((panel: 'left' | 'right', width: number) => {
    dispatch({ type: 'SET_PANEL_WIDTH', payload: { panel, width } });
  }, []);

  const setPanelHeight = useCallback((panel: 'bottom', height: number) => {
    dispatch({ type: 'SET_PANEL_HEIGHT', payload: { panel, height } });
  }, []);

  const togglePanelCollapse = useCallback((panelId: string) => {
    dispatch({ type: 'TOGGLE_PANEL_COLLAPSE', payload: panelId });
  }, []);

  // Theme actions
  const toggleDarkMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  }, []);

  const setAccentColor = useCallback((color: string) => {
    dispatch({ type: 'SET_ACCENT_COLOR', payload: color });
  }, []);

  // General actions
  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setViewMode = useCallback((mode: 'list' | 'grid' | 'tree') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const resetUI = useCallback(() => {
    dispatch({ type: 'RESET_UI' });
  }, []);

  // Selectors
  const isPlatformExpanded = useCallback((id: string): boolean => {
    return state.accordion.expandedPlatforms.has(id);
  }, [state.accordion.expandedPlatforms]);

  const isResourceExpanded = useCallback((id: string): boolean => {
    return state.accordion.expandedResources.has(id);
  }, [state.accordion.expandedResources]);

  const isHandshakeExpanded = useCallback((id: string): boolean => {
    return state.accordion.expandedHandshakes.has(id);
  }, [state.accordion.expandedHandshakes]);

  const value: UIContextValue = {
    state,
    togglePlatform,
    toggleResource,
    toggleHandshake,
    expandAll,
    collapseAll,
    expandToItem,
    openModal,
    closeModal,
    updateModalData,
    setPanelWidth,
    setPanelHeight,
    togglePanelCollapse,
    toggleDarkMode,
    setAccentColor,
    setSearchQuery,
    setViewMode,
    toggleSidebar,
    resetUI,
    isPlatformExpanded,
    isResourceExpanded,
    isHandshakeExpanded,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

/**
 * Hook to use UI context
 */
export function useUIContext(): UIContextValue {
  const context = useContext(UIContext);
  
  if (!context) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  
  return context;
}

export default UIContext;
