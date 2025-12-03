// ============================================
// PROTOCOL OS - PLATFORM RESOURCE HANDSHAKE STATE MANAGER
// ============================================
// Address: 1.4.a
// Purpose: Centralized State Management for Protocol OS
// ============================================

/**
 * Platform Resource Handshake State Manager
 * 
 * Implements Intent Tensor Theory principles for recursive
 * state management across the three-tier hierarchy:
 * - Platforms (Δ₁): Top-level service providers
 * - Resources (Δ₂): API endpoints within platforms
 * - Handshakes (Δ₃): Authentication/request configurations
 * 
 * Provides:
 * - Centralized state container
 * - Action dispatching
 * - State subscriptions
 * - Undo/redo capabilities
 * - State persistence hooks
 */

import { 
  SavedHandshake, 
  HandshakeVersion,
  createNewVersion,
  addVersion 
} from '../1.5_folderSavedHandshakesLibrary/1.5.e_fileSavedHandshakeVersioningLogic';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Platform edition types
 */
export type PlatformEdition = 'free' | 'pro' | 'enterprise' | 'custom';

/**
 * Platform status
 */
export type PlatformStatus = 'active' | 'inactive' | 'error' | 'pending';

/**
 * Resource status
 */
export type ResourceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

/**
 * Handshake status
 */
export type HandshakeStatus = 
  | 'draft'
  | 'ready'
  | 'executing'
  | 'success'
  | 'failed'
  | 'expired';

/**
 * Platform definition
 */
export interface Platform {
  /** Unique ID */
  id: string;
  
  /** Serial reference */
  serial: string;
  
  /** Platform name */
  name: string;
  
  /** Platform description */
  description?: string;
  
  /** Platform icon/logo URL */
  iconUrl?: string;
  
  /** Platform edition */
  edition: PlatformEdition;
  
  /** Platform status */
  status: PlatformStatus;
  
  /** Base URL */
  baseUrl?: string;
  
  /** Documentation URL */
  docsUrl?: string;
  
  /** Resource IDs */
  resourceIds: string[];
  
  /** Platform metadata */
  metadata?: Record<string, unknown>;
  
  /** Created date */
  createdAt: Date;
  
  /** Updated date */
  updatedAt: Date;
  
  /** Is expanded in UI */
  isExpanded?: boolean;
}

/**
 * Resource definition
 */
export interface Resource {
  /** Unique ID */
  id: string;
  
  /** Serial reference */
  serial: string;
  
  /** Parent platform ID */
  platformId: string;
  
  /** Resource name */
  name: string;
  
  /** Resource description */
  description?: string;
  
  /** Resource type */
  type: string;
  
  /** Resource status */
  status: ResourceStatus;
  
  /** Endpoint path */
  endpoint?: string;
  
  /** Handshake IDs */
  handshakeIds: string[];
  
  /** Resource metadata */
  metadata?: Record<string, unknown>;
  
  /** Token expiration (if applicable) */
  tokenExpiresAt?: Date;
  
  /** Last health check */
  lastHealthCheck?: Date;
  
  /** Created date */
  createdAt: Date;
  
  /** Updated date */
  updatedAt: Date;
  
  /** Is expanded in UI */
  isExpanded?: boolean;
}

/**
 * Handshake definition (extends SavedHandshake)
 */
export interface Handshake extends SavedHandshake {
  /** Parent resource ID */
  resourceId: string;
  
  /** Handshake status */
  status: HandshakeStatus;
  
  /** Last execution result */
  lastExecutionResult?: {
    success: boolean;
    statusCode?: number;
    duration?: number;
    executedAt: Date;
    error?: string;
  };
}

/**
 * Application state
 */
export interface AppState {
  /** Platforms by ID */
  platforms: Record<string, Platform>;
  
  /** Resources by ID */
  resources: Record<string, Resource>;
  
  /** Handshakes by ID */
  handshakes: Record<string, Handshake>;
  
  /** Platform order (for display) */
  platformOrder: string[];
  
  /** Selected platform ID */
  selectedPlatformId: string | null;
  
  /** Selected resource ID */
  selectedResourceId: string | null;
  
  /** Selected handshake ID */
  selectedHandshakeId: string | null;
  
  /** UI state */
  ui: {
    /** Is loading */
    isLoading: boolean;
    
    /** Error message */
    error: string | null;
    
    /** Active modal */
    activeModal: string | null;
    
    /** Search query */
    searchQuery: string;
    
    /** Filter settings */
    filters: {
      platformEditions: PlatformEdition[];
      resourceTypes: string[];
      handshakeStatuses: HandshakeStatus[];
      showArchived: boolean;
    };
    
    /** View preferences */
    view: {
      expandedPlatforms: Set<string>;
      expandedResources: Set<string>;
    };
  };
  
  /** Metadata */
  meta: {
    /** State version */
    version: string;
    
    /** Last saved at */
    lastSavedAt: Date | null;
    
    /** Is dirty (unsaved changes) */
    isDirty: boolean;
  };
}

/**
 * Action types
 */
export type ActionType =
  // Platform actions
  | 'PLATFORM_ADD'
  | 'PLATFORM_UPDATE'
  | 'PLATFORM_DELETE'
  | 'PLATFORM_REORDER'
  | 'PLATFORM_SELECT'
  | 'PLATFORM_EXPAND'
  | 'PLATFORM_COLLAPSE'
  
  // Resource actions
  | 'RESOURCE_ADD'
  | 'RESOURCE_UPDATE'
  | 'RESOURCE_DELETE'
  | 'RESOURCE_MOVE'
  | 'RESOURCE_SELECT'
  | 'RESOURCE_EXPAND'
  | 'RESOURCE_COLLAPSE'
  
  // Handshake actions
  | 'HANDSHAKE_ADD'
  | 'HANDSHAKE_UPDATE'
  | 'HANDSHAKE_DELETE'
  | 'HANDSHAKE_DUPLICATE'
  | 'HANDSHAKE_MOVE'
  | 'HANDSHAKE_SELECT'
  | 'HANDSHAKE_EXECUTE'
  | 'HANDSHAKE_EXECUTION_COMPLETE'
  | 'HANDSHAKE_VERSION_CREATE'
  | 'HANDSHAKE_VERSION_RESTORE'
  
  // UI actions
  | 'UI_SET_LOADING'
  | 'UI_SET_ERROR'
  | 'UI_CLEAR_ERROR'
  | 'UI_OPEN_MODAL'
  | 'UI_CLOSE_MODAL'
  | 'UI_SET_SEARCH'
  | 'UI_SET_FILTERS'
  | 'UI_CLEAR_FILTERS'
  
  // State actions
  | 'STATE_LOAD'
  | 'STATE_RESET'
  | 'STATE_MARK_SAVED'
  | 'STATE_UNDO'
  | 'STATE_REDO';

/**
 * Action payload types
 */
export interface ActionPayloads {
  PLATFORM_ADD: { platform: Omit<Platform, 'id' | 'serial' | 'createdAt' | 'updatedAt'> };
  PLATFORM_UPDATE: { id: string; updates: Partial<Platform> };
  PLATFORM_DELETE: { id: string };
  PLATFORM_REORDER: { platformIds: string[] };
  PLATFORM_SELECT: { id: string | null };
  PLATFORM_EXPAND: { id: string };
  PLATFORM_COLLAPSE: { id: string };
  
  RESOURCE_ADD: { platformId: string; resource: Omit<Resource, 'id' | 'serial' | 'platformId' | 'createdAt' | 'updatedAt'> };
  RESOURCE_UPDATE: { id: string; updates: Partial<Resource> };
  RESOURCE_DELETE: { id: string };
  RESOURCE_MOVE: { id: string; toPlatformId: string };
  RESOURCE_SELECT: { id: string | null };
  RESOURCE_EXPAND: { id: string };
  RESOURCE_COLLAPSE: { id: string };
  
  HANDSHAKE_ADD: { resourceId: string; handshake: Omit<Handshake, 'id' | 'serial' | 'resourceId' | 'createdAt' | 'updatedAt' | 'versions'> };
  HANDSHAKE_UPDATE: { id: string; updates: Partial<Handshake>; createVersion?: boolean };
  HANDSHAKE_DELETE: { id: string };
  HANDSHAKE_DUPLICATE: { id: string; newName?: string };
  HANDSHAKE_MOVE: { id: string; toResourceId: string };
  HANDSHAKE_SELECT: { id: string | null };
  HANDSHAKE_EXECUTE: { id: string };
  HANDSHAKE_EXECUTION_COMPLETE: { id: string; result: Handshake['lastExecutionResult'] };
  HANDSHAKE_VERSION_CREATE: { id: string; description?: string };
  HANDSHAKE_VERSION_RESTORE: { id: string; versionId: string };
  
  UI_SET_LOADING: { isLoading: boolean };
  UI_SET_ERROR: { error: string };
  UI_CLEAR_ERROR: {};
  UI_OPEN_MODAL: { modalId: string };
  UI_CLOSE_MODAL: {};
  UI_SET_SEARCH: { query: string };
  UI_SET_FILTERS: { filters: Partial<AppState['ui']['filters']> };
  UI_CLEAR_FILTERS: {};
  
  STATE_LOAD: { state: AppState };
  STATE_RESET: {};
  STATE_MARK_SAVED: {};
  STATE_UNDO: {};
  STATE_REDO: {};
}

/**
 * Action definition
 */
export interface Action<T extends ActionType = ActionType> {
  type: T;
  payload: T extends keyof ActionPayloads ? ActionPayloads[T] : never;
  timestamp: Date;
  meta?: {
    undoable?: boolean;
    source?: string;
  };
}

/**
 * State subscriber callback
 */
export type StateSubscriber = (state: AppState, action: Action) => void;

/**
 * State selector
 */
export type StateSelector<T> = (state: AppState) => T;

// ============================================
// INITIAL STATE
// ============================================

/**
 * Create initial state
 */
export function createInitialState(): AppState {
  return {
    platforms: {},
    resources: {},
    handshakes: {},
    platformOrder: [],
    selectedPlatformId: null,
    selectedResourceId: null,
    selectedHandshakeId: null,
    ui: {
      isLoading: false,
      error: null,
      activeModal: null,
      searchQuery: '',
      filters: {
        platformEditions: [],
        resourceTypes: [],
        handshakeStatuses: [],
        showArchived: false,
      },
      view: {
        expandedPlatforms: new Set(),
        expandedResources: new Set(),
      },
    },
    meta: {
      version: '1.0.0',
      lastSavedAt: null,
      isDirty: false,
    },
  };
}

// ============================================
// STATE MANAGER CLASS
// ============================================

/**
 * Platform Resource Handshake State Manager
 */
export class StateManager {
  private state: AppState;
  private subscribers: Set<StateSubscriber>;
  private undoStack: AppState[];
  private redoStack: AppState[];
  private maxUndoLevels: number;
  private serialCounter: number;

  constructor(initialState?: Partial<AppState>, options?: { maxUndoLevels?: number }) {
    this.state = { ...createInitialState(), ...initialState };
    this.subscribers = new Set();
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoLevels = options?.maxUndoLevels ?? 50;
    this.serialCounter = Date.now();
  }

  // ============================================
  // SERIAL GENERATION
  // ============================================

  private generateSerial(prefix: string): string {
    this.serialCounter++;
    return `${prefix}-${this.serialCounter.toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateId(): string {
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // STATE ACCESS
  // ============================================

  /**
   * Get current state
   */
  getState(): AppState {
    return this.state;
  }

  /**
   * Select state slice
   */
  select<T>(selector: StateSelector<T>): T {
    return selector(this.state);
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  /**
   * Subscribe to state changes
   */
  subscribe(subscriber: StateSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * Notify subscribers
   */
  private notify(action: Action): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this.state, action);
      } catch (error) {
        console.error('State subscriber error:', error);
      }
    });
  }

  // ============================================
  // UNDO/REDO
  // ============================================

  /**
   * Push state to undo stack
   */
  private pushUndoState(): void {
    this.undoStack.push(this.cloneState(this.state));
    
    // Limit undo stack size
    if (this.undoStack.length > this.maxUndoLevels) {
      this.undoStack.shift();
    }
    
    // Clear redo stack on new action
    this.redoStack = [];
  }

  /**
   * Can undo
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Can redo
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Undo last action
   */
  undo(): void {
    if (!this.canUndo()) return;
    
    this.redoStack.push(this.cloneState(this.state));
    this.state = this.undoStack.pop()!;
    
    this.notify({
      type: 'STATE_UNDO',
      payload: {},
      timestamp: new Date(),
    } as Action);
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    if (!this.canRedo()) return;
    
    this.undoStack.push(this.cloneState(this.state));
    this.state = this.redoStack.pop()!;
    
    this.notify({
      type: 'STATE_REDO',
      payload: {},
      timestamp: new Date(),
    } as Action);
  }

  /**
   * Clone state (deep copy)
   */
  private cloneState(state: AppState): AppState {
    return {
      ...state,
      platforms: { ...state.platforms },
      resources: { ...state.resources },
      handshakes: { ...state.handshakes },
      platformOrder: [...state.platformOrder],
      ui: {
        ...state.ui,
        filters: { ...state.ui.filters },
        view: {
          expandedPlatforms: new Set(state.ui.view.expandedPlatforms),
          expandedResources: new Set(state.ui.view.expandedResources),
        },
      },
      meta: { ...state.meta },
    };
  }

  // ============================================
  // ACTION DISPATCH
  // ============================================

  /**
   * Dispatch action
   */
  dispatch<T extends ActionType>(
    type: T,
    payload: T extends keyof ActionPayloads ? ActionPayloads[T] : never,
    meta?: Action['meta']
  ): void {
    const action: Action = {
      type,
      payload,
      timestamp: new Date(),
      meta,
    };

    // Push to undo stack for undoable actions
    if (meta?.undoable !== false && this.isUndoableAction(type)) {
      this.pushUndoState();
    }

    // Apply action
    this.state = this.reduce(this.state, action);

    // Mark as dirty
    if (this.isDataAction(type)) {
      this.state.meta.isDirty = true;
    }

    // Notify subscribers
    this.notify(action);
  }

  /**
   * Check if action is undoable
   */
  private isUndoableAction(type: ActionType): boolean {
    return type.startsWith('PLATFORM_') || 
           type.startsWith('RESOURCE_') || 
           type.startsWith('HANDSHAKE_');
  }

  /**
   * Check if action modifies data
   */
  private isDataAction(type: ActionType): boolean {
    const dataActions = [
      'PLATFORM_ADD', 'PLATFORM_UPDATE', 'PLATFORM_DELETE', 'PLATFORM_REORDER',
      'RESOURCE_ADD', 'RESOURCE_UPDATE', 'RESOURCE_DELETE', 'RESOURCE_MOVE',
      'HANDSHAKE_ADD', 'HANDSHAKE_UPDATE', 'HANDSHAKE_DELETE', 'HANDSHAKE_DUPLICATE',
      'HANDSHAKE_MOVE', 'HANDSHAKE_VERSION_CREATE', 'HANDSHAKE_VERSION_RESTORE',
    ];
    return dataActions.includes(type);
  }

  // ============================================
  // REDUCER
  // ============================================

  /**
   * Reduce state based on action
   */
  private reduce(state: AppState, action: Action): AppState {
    switch (action.type) {
      // Platform actions
      case 'PLATFORM_ADD':
        return this.reducePlatformAdd(state, action.payload as ActionPayloads['PLATFORM_ADD']);
      case 'PLATFORM_UPDATE':
        return this.reducePlatformUpdate(state, action.payload as ActionPayloads['PLATFORM_UPDATE']);
      case 'PLATFORM_DELETE':
        return this.reducePlatformDelete(state, action.payload as ActionPayloads['PLATFORM_DELETE']);
      case 'PLATFORM_REORDER':
        return this.reducePlatformReorder(state, action.payload as ActionPayloads['PLATFORM_REORDER']);
      case 'PLATFORM_SELECT':
        return { ...state, selectedPlatformId: (action.payload as ActionPayloads['PLATFORM_SELECT']).id };
      case 'PLATFORM_EXPAND':
        return this.reducePlatformExpand(state, action.payload as ActionPayloads['PLATFORM_EXPAND']);
      case 'PLATFORM_COLLAPSE':
        return this.reducePlatformCollapse(state, action.payload as ActionPayloads['PLATFORM_COLLAPSE']);

      // Resource actions
      case 'RESOURCE_ADD':
        return this.reduceResourceAdd(state, action.payload as ActionPayloads['RESOURCE_ADD']);
      case 'RESOURCE_UPDATE':
        return this.reduceResourceUpdate(state, action.payload as ActionPayloads['RESOURCE_UPDATE']);
      case 'RESOURCE_DELETE':
        return this.reduceResourceDelete(state, action.payload as ActionPayloads['RESOURCE_DELETE']);
      case 'RESOURCE_MOVE':
        return this.reduceResourceMove(state, action.payload as ActionPayloads['RESOURCE_MOVE']);
      case 'RESOURCE_SELECT':
        return { ...state, selectedResourceId: (action.payload as ActionPayloads['RESOURCE_SELECT']).id };
      case 'RESOURCE_EXPAND':
        return this.reduceResourceExpand(state, action.payload as ActionPayloads['RESOURCE_EXPAND']);
      case 'RESOURCE_COLLAPSE':
        return this.reduceResourceCollapse(state, action.payload as ActionPayloads['RESOURCE_COLLAPSE']);

      // Handshake actions
      case 'HANDSHAKE_ADD':
        return this.reduceHandshakeAdd(state, action.payload as ActionPayloads['HANDSHAKE_ADD']);
      case 'HANDSHAKE_UPDATE':
        return this.reduceHandshakeUpdate(state, action.payload as ActionPayloads['HANDSHAKE_UPDATE']);
      case 'HANDSHAKE_DELETE':
        return this.reduceHandshakeDelete(state, action.payload as ActionPayloads['HANDSHAKE_DELETE']);
      case 'HANDSHAKE_DUPLICATE':
        return this.reduceHandshakeDuplicate(state, action.payload as ActionPayloads['HANDSHAKE_DUPLICATE']);
      case 'HANDSHAKE_MOVE':
        return this.reduceHandshakeMove(state, action.payload as ActionPayloads['HANDSHAKE_MOVE']);
      case 'HANDSHAKE_SELECT':
        return { ...state, selectedHandshakeId: (action.payload as ActionPayloads['HANDSHAKE_SELECT']).id };
      case 'HANDSHAKE_EXECUTE':
        return this.reduceHandshakeExecute(state, action.payload as ActionPayloads['HANDSHAKE_EXECUTE']);
      case 'HANDSHAKE_EXECUTION_COMPLETE':
        return this.reduceHandshakeExecutionComplete(state, action.payload as ActionPayloads['HANDSHAKE_EXECUTION_COMPLETE']);
      case 'HANDSHAKE_VERSION_CREATE':
        return this.reduceHandshakeVersionCreate(state, action.payload as ActionPayloads['HANDSHAKE_VERSION_CREATE']);
      case 'HANDSHAKE_VERSION_RESTORE':
        return this.reduceHandshakeVersionRestore(state, action.payload as ActionPayloads['HANDSHAKE_VERSION_RESTORE']);

      // UI actions
      case 'UI_SET_LOADING':
        return { ...state, ui: { ...state.ui, isLoading: (action.payload as ActionPayloads['UI_SET_LOADING']).isLoading } };
      case 'UI_SET_ERROR':
        return { ...state, ui: { ...state.ui, error: (action.payload as ActionPayloads['UI_SET_ERROR']).error } };
      case 'UI_CLEAR_ERROR':
        return { ...state, ui: { ...state.ui, error: null } };
      case 'UI_OPEN_MODAL':
        return { ...state, ui: { ...state.ui, activeModal: (action.payload as ActionPayloads['UI_OPEN_MODAL']).modalId } };
      case 'UI_CLOSE_MODAL':
        return { ...state, ui: { ...state.ui, activeModal: null } };
      case 'UI_SET_SEARCH':
        return { ...state, ui: { ...state.ui, searchQuery: (action.payload as ActionPayloads['UI_SET_SEARCH']).query } };
      case 'UI_SET_FILTERS':
        return { ...state, ui: { ...state.ui, filters: { ...state.ui.filters, ...(action.payload as ActionPayloads['UI_SET_FILTERS']).filters } } };
      case 'UI_CLEAR_FILTERS':
        return { ...state, ui: { ...state.ui, filters: createInitialState().ui.filters } };

      // State actions
      case 'STATE_LOAD':
        return (action.payload as ActionPayloads['STATE_LOAD']).state;
      case 'STATE_RESET':
        return createInitialState();
      case 'STATE_MARK_SAVED':
        return { ...state, meta: { ...state.meta, isDirty: false, lastSavedAt: new Date() } };

      default:
        return state;
    }
  }

  // ============================================
  // PLATFORM REDUCERS
  // ============================================

  private reducePlatformAdd(state: AppState, payload: ActionPayloads['PLATFORM_ADD']): AppState {
    const id = this.generateId();
    const serial = this.generateSerial('PLT');
    const now = new Date();

    const platform: Platform = {
      ...payload.platform,
      id,
      serial,
      resourceIds: [],
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...state,
      platforms: { ...state.platforms, [id]: platform },
      platformOrder: [...state.platformOrder, id],
    };
  }

  private reducePlatformUpdate(state: AppState, payload: ActionPayloads['PLATFORM_UPDATE']): AppState {
    const platform = state.platforms[payload.id];
    if (!platform) return state;

    return {
      ...state,
      platforms: {
        ...state.platforms,
        [payload.id]: {
          ...platform,
          ...payload.updates,
          updatedAt: new Date(),
        },
      },
    };
  }

  private reducePlatformDelete(state: AppState, payload: ActionPayloads['PLATFORM_DELETE']): AppState {
    const platform = state.platforms[payload.id];
    if (!platform) return state;

    // Remove all resources and their handshakes
    const resourceIds = platform.resourceIds;
    const newResources = { ...state.resources };
    const newHandshakes = { ...state.handshakes };

    resourceIds.forEach(resourceId => {
      const resource = newResources[resourceId];
      if (resource) {
        resource.handshakeIds.forEach(handshakeId => {
          delete newHandshakes[handshakeId];
        });
        delete newResources[resourceId];
      }
    });

    const { [payload.id]: _, ...newPlatforms } = state.platforms;

    return {
      ...state,
      platforms: newPlatforms,
      resources: newResources,
      handshakes: newHandshakes,
      platformOrder: state.platformOrder.filter(id => id !== payload.id),
      selectedPlatformId: state.selectedPlatformId === payload.id ? null : state.selectedPlatformId,
    };
  }

  private reducePlatformReorder(state: AppState, payload: ActionPayloads['PLATFORM_REORDER']): AppState {
    return {
      ...state,
      platformOrder: payload.platformIds,
    };
  }

  private reducePlatformExpand(state: AppState, payload: ActionPayloads['PLATFORM_EXPAND']): AppState {
    const newExpanded = new Set(state.ui.view.expandedPlatforms);
    newExpanded.add(payload.id);
    return {
      ...state,
      ui: {
        ...state.ui,
        view: {
          ...state.ui.view,
          expandedPlatforms: newExpanded,
        },
      },
    };
  }

  private reducePlatformCollapse(state: AppState, payload: ActionPayloads['PLATFORM_COLLAPSE']): AppState {
    const newExpanded = new Set(state.ui.view.expandedPlatforms);
    newExpanded.delete(payload.id);
    return {
      ...state,
      ui: {
        ...state.ui,
        view: {
          ...state.ui.view,
          expandedPlatforms: newExpanded,
        },
      },
    };
  }

  // ============================================
  // RESOURCE REDUCERS
  // ============================================

  private reduceResourceAdd(state: AppState, payload: ActionPayloads['RESOURCE_ADD']): AppState {
    const platform = state.platforms[payload.platformId];
    if (!platform) return state;

    const id = this.generateId();
    const serial = this.generateSerial('RSC');
    const now = new Date();

    const resource: Resource = {
      ...payload.resource,
      id,
      serial,
      platformId: payload.platformId,
      handshakeIds: [],
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...state,
      resources: { ...state.resources, [id]: resource },
      platforms: {
        ...state.platforms,
        [payload.platformId]: {
          ...platform,
          resourceIds: [...platform.resourceIds, id],
          updatedAt: now,
        },
      },
    };
  }

  private reduceResourceUpdate(state: AppState, payload: ActionPayloads['RESOURCE_UPDATE']): AppState {
    const resource = state.resources[payload.id];
    if (!resource) return state;

    return {
      ...state,
      resources: {
        ...state.resources,
        [payload.id]: {
          ...resource,
          ...payload.updates,
          updatedAt: new Date(),
        },
      },
    };
  }

  private reduceResourceDelete(state: AppState, payload: ActionPayloads['RESOURCE_DELETE']): AppState {
    const resource = state.resources[payload.id];
    if (!resource) return state;

    const platform = state.platforms[resource.platformId];
    if (!platform) return state;

    // Remove all handshakes
    const newHandshakes = { ...state.handshakes };
    resource.handshakeIds.forEach(handshakeId => {
      delete newHandshakes[handshakeId];
    });

    const { [payload.id]: _, ...newResources } = state.resources;

    return {
      ...state,
      resources: newResources,
      handshakes: newHandshakes,
      platforms: {
        ...state.platforms,
        [resource.platformId]: {
          ...platform,
          resourceIds: platform.resourceIds.filter(id => id !== payload.id),
          updatedAt: new Date(),
        },
      },
      selectedResourceId: state.selectedResourceId === payload.id ? null : state.selectedResourceId,
    };
  }

  private reduceResourceMove(state: AppState, payload: ActionPayloads['RESOURCE_MOVE']): AppState {
    const resource = state.resources[payload.id];
    if (!resource) return state;

    const fromPlatform = state.platforms[resource.platformId];
    const toPlatform = state.platforms[payload.toPlatformId];
    if (!fromPlatform || !toPlatform) return state;

    const now = new Date();

    return {
      ...state,
      resources: {
        ...state.resources,
        [payload.id]: {
          ...resource,
          platformId: payload.toPlatformId,
          updatedAt: now,
        },
      },
      platforms: {
        ...state.platforms,
        [resource.platformId]: {
          ...fromPlatform,
          resourceIds: fromPlatform.resourceIds.filter(id => id !== payload.id),
          updatedAt: now,
        },
        [payload.toPlatformId]: {
          ...toPlatform,
          resourceIds: [...toPlatform.resourceIds, payload.id],
          updatedAt: now,
        },
      },
    };
  }

  private reduceResourceExpand(state: AppState, payload: ActionPayloads['RESOURCE_EXPAND']): AppState {
    const newExpanded = new Set(state.ui.view.expandedResources);
    newExpanded.add(payload.id);
    return {
      ...state,
      ui: {
        ...state.ui,
        view: {
          ...state.ui.view,
          expandedResources: newExpanded,
        },
      },
    };
  }

  private reduceResourceCollapse(state: AppState, payload: ActionPayloads['RESOURCE_COLLAPSE']): AppState {
    const newExpanded = new Set(state.ui.view.expandedResources);
    newExpanded.delete(payload.id);
    return {
      ...state,
      ui: {
        ...state.ui,
        view: {
          ...state.ui.view,
          expandedResources: newExpanded,
        },
      },
    };
  }

  // ============================================
  // HANDSHAKE REDUCERS
  // ============================================

  private reduceHandshakeAdd(state: AppState, payload: ActionPayloads['HANDSHAKE_ADD']): AppState {
    const resource = state.resources[payload.resourceId];
    if (!resource) return state;

    const id = this.generateId();
    const serial = this.generateSerial('HSK');
    const now = new Date();

    const initialVersion: HandshakeVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: '1.0',
      createdAt: now,
      changeType: 'create',
      changeDescription: 'Initial version',
      changes: [],
      configSnapshot: payload.handshake.configuration || {},
      protocolSnapshot: payload.handshake.protocol,
      isCurrent: true,
    };

    const handshake: Handshake = {
      ...payload.handshake,
      id,
      serial,
      resourceId: payload.resourceId,
      versions: [initialVersion],
      isFavorite: false,
      isArchived: false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...state,
      handshakes: { ...state.handshakes, [id]: handshake },
      resources: {
        ...state.resources,
        [payload.resourceId]: {
          ...resource,
          handshakeIds: [...resource.handshakeIds, id],
          updatedAt: now,
        },
      },
    };
  }

  private reduceHandshakeUpdate(state: AppState, payload: ActionPayloads['HANDSHAKE_UPDATE']): AppState {
    const handshake = state.handshakes[payload.id];
    if (!handshake) return state;

    let updatedHandshake: Handshake = {
      ...handshake,
      ...payload.updates,
      updatedAt: new Date(),
    };

    // Create new version if requested
    if (payload.createVersion && payload.updates.configuration) {
      const newVersion = createNewVersion(handshake, payload.updates.configuration, {
        changeType: 'update',
        changeDescription: 'Configuration updated',
      });
      updatedHandshake = addVersion(updatedHandshake, newVersion) as Handshake;
    }

    return {
      ...state,
      handshakes: {
        ...state.handshakes,
        [payload.id]: updatedHandshake,
      },
    };
  }

  private reduceHandshakeDelete(state: AppState, payload: ActionPayloads['HANDSHAKE_DELETE']): AppState {
    const handshake = state.handshakes[payload.id];
    if (!handshake) return state;

    const resource = state.resources[handshake.resourceId];
    if (!resource) return state;

    const { [payload.id]: _, ...newHandshakes } = state.handshakes;

    return {
      ...state,
      handshakes: newHandshakes,
      resources: {
        ...state.resources,
        [handshake.resourceId]: {
          ...resource,
          handshakeIds: resource.handshakeIds.filter(id => id !== payload.id),
          updatedAt: new Date(),
        },
      },
      selectedHandshakeId: state.selectedHandshakeId === payload.id ? null : state.selectedHandshakeId,
    };
  }

  private reduceHandshakeDuplicate(state: AppState, payload: ActionPayloads['HANDSHAKE_DUPLICATE']): AppState {
    const original = state.handshakes[payload.id];
    if (!original) return state;

    const resource = state.resources[original.resourceId];
    if (!resource) return state;

    const id = this.generateId();
    const serial = this.generateSerial('HSK');
    const now = new Date();

    const initialVersion: HandshakeVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: '1.0',
      createdAt: now,
      changeType: 'duplicate',
      changeDescription: `Duplicated from "${original.name}"`,
      changes: [],
      configSnapshot: original.configuration || {},
      protocolSnapshot: original.protocol,
      isCurrent: true,
    };

    const duplicate: Handshake = {
      ...original,
      id,
      serial,
      name: payload.newName || `${original.name} (Copy)`,
      versions: [initialVersion],
      isFavorite: false,
      isArchived: false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    return {
      ...state,
      handshakes: { ...state.handshakes, [id]: duplicate },
      resources: {
        ...state.resources,
        [original.resourceId]: {
          ...resource,
          handshakeIds: [...resource.handshakeIds, id],
          updatedAt: now,
        },
      },
    };
  }

  private reduceHandshakeMove(state: AppState, payload: ActionPayloads['HANDSHAKE_MOVE']): AppState {
    const handshake = state.handshakes[payload.id];
    if (!handshake) return state;

    const fromResource = state.resources[handshake.resourceId];
    const toResource = state.resources[payload.toResourceId];
    if (!fromResource || !toResource) return state;

    const now = new Date();

    return {
      ...state,
      handshakes: {
        ...state.handshakes,
        [payload.id]: {
          ...handshake,
          resourceId: payload.toResourceId,
          updatedAt: now,
        },
      },
      resources: {
        ...state.resources,
        [handshake.resourceId]: {
          ...fromResource,
          handshakeIds: fromResource.handshakeIds.filter(id => id !== payload.id),
          updatedAt: now,
        },
        [payload.toResourceId]: {
          ...toResource,
          handshakeIds: [...toResource.handshakeIds, payload.id],
          updatedAt: now,
        },
      },
    };
  }

  private reduceHandshakeExecute(state: AppState, payload: ActionPayloads['HANDSHAKE_EXECUTE']): AppState {
    const handshake = state.handshakes[payload.id];
    if (!handshake) return state;

    return {
      ...state,
      handshakes: {
        ...state.handshakes,
        [payload.id]: {
          ...handshake,
          status: 'executing',
          updatedAt: new Date(),
        },
      },
    };
  }

  private reduceHandshakeExecutionComplete(state: AppState, payload: ActionPayloads['HANDSHAKE_EXECUTION_COMPLETE']): AppState {
    const handshake = state.handshakes[payload.id];
    if (!handshake) return state;

    return {
      ...state,
      handshakes: {
        ...state.handshakes,
        [payload.id]: {
          ...handshake,
          status: payload.result?.success ? 'success' : 'failed',
          lastExecutionResult: payload.result,
          usageCount: (handshake.usageCount || 0) + 1,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    };
  }

  private reduceHandshakeVersionCreate(state: AppState, payload: ActionPayloads['HANDSHAKE_VERSION_CREATE']): AppState {
    const handshake = state.handshakes[payload.id];
    if (!handshake) return state;

    const newVersion = createNewVersion(handshake, handshake.configuration, {
      changeType: 'update',
      changeDescription: payload.description || 'Manual version created',
    });

    const updatedHandshake = addVersion(handshake, newVersion) as Handshake;

    return {
      ...state,
      handshakes: {
        ...state.handshakes,
        [payload.id]: updatedHandshake,
      },
    };
  }

  private reduceHandshakeVersionRestore(state: AppState, payload: ActionPayloads['HANDSHAKE_VERSION_RESTORE']): AppState {
    const handshake = state.handshakes[payload.id];
    if (!handshake) return state;

    const versionToRestore = handshake.versions.find(v => v.id === payload.versionId);
    if (!versionToRestore) return state;

    const restoreVersion = createNewVersion(handshake, versionToRestore.configSnapshot, {
      changeType: 'restore',
      changeDescription: `Restored from version ${versionToRestore.versionNumber}`,
    });

    const updatedHandshake = addVersion(handshake, restoreVersion) as Handshake;
    updatedHandshake.configuration = versionToRestore.configSnapshot;

    return {
      ...state,
      handshakes: {
        ...state.handshakes,
        [payload.id]: updatedHandshake,
      },
    };
  }
}

// ============================================
// SELECTORS
// ============================================

/**
 * Select all platforms in order
 */
export const selectPlatformsOrdered = (state: AppState): Platform[] => {
  return state.platformOrder.map(id => state.platforms[id]).filter(Boolean);
};

/**
 * Select resources for platform
 */
export const selectResourcesForPlatform = (platformId: string) => (state: AppState): Resource[] => {
  const platform = state.platforms[platformId];
  if (!platform) return [];
  return platform.resourceIds.map(id => state.resources[id]).filter(Boolean);
};

/**
 * Select handshakes for resource
 */
export const selectHandshakesForResource = (resourceId: string) => (state: AppState): Handshake[] => {
  const resource = state.resources[resourceId];
  if (!resource) return [];
  return resource.handshakeIds.map(id => state.handshakes[id]).filter(Boolean);
};

/**
 * Select selected platform
 */
export const selectSelectedPlatform = (state: AppState): Platform | null => {
  return state.selectedPlatformId ? state.platforms[state.selectedPlatformId] : null;
};

/**
 * Select selected resource
 */
export const selectSelectedResource = (state: AppState): Resource | null => {
  return state.selectedResourceId ? state.resources[state.selectedResourceId] : null;
};

/**
 * Select selected handshake
 */
export const selectSelectedHandshake = (state: AppState): Handshake | null => {
  return state.selectedHandshakeId ? state.handshakes[state.selectedHandshakeId] : null;
};

/**
 * Select filtered platforms
 */
export const selectFilteredPlatforms = (state: AppState): Platform[] => {
  const { searchQuery, filters } = state.ui;
  let platforms = selectPlatformsOrdered(state);

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    platforms = platforms.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    );
  }

  // Filter by edition
  if (filters.platformEditions.length > 0) {
    platforms = platforms.filter(p => filters.platformEditions.includes(p.edition));
  }

  return platforms;
};

// ============================================
// SINGLETON INSTANCE
// ============================================

let stateManagerInstance: StateManager | null = null;

/**
 * Get or create state manager instance
 */
export function getStateManager(initialState?: Partial<AppState>): StateManager {
  if (!stateManagerInstance) {
    stateManagerInstance = new StateManager(initialState);
  }
  return stateManagerInstance;
}

/**
 * Reset state manager instance (for testing)
 */
export function resetStateManager(): void {
  stateManagerInstance = null;
}

export default StateManager;
