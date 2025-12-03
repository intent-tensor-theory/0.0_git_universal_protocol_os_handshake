// ============================================
// PROTOCOL OS - PLATFORM STORE
// ============================================
// Address: 1.5.1.a
// Purpose: Zustand store for platform state management
// ============================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Platform } from '@types/1.9.b_filePlatformTypeDefinitions';
import { getDatabaseProvider } from '@database/1.2.c_fileIndex';

/**
 * Platform Store State
 */
interface PlatformState {
  // Data
  platforms: Platform[];
  selectedPlatformId: string | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  
  // Computed (derived from platforms)
  get selectedPlatform(): Platform | undefined;
  get filteredPlatforms(): Platform[];
  get platformCount(): number;
}

/**
 * Platform Store Actions
 */
interface PlatformActions {
  // CRUD Operations
  loadPlatforms: () => Promise<void>;
  createPlatform: (platform: Omit<Platform, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Platform>;
  updatePlatform: (id: string, updates: Partial<Platform>) => Promise<void>;
  deletePlatform: (id: string) => Promise<void>;
  
  // Selection
  selectPlatform: (id: string | null) => void;
  
  // UI Actions
  setSearchQuery: (query: string) => void;
  setSorting: (sortBy: PlatformState['sortBy'], sortOrder?: PlatformState['sortOrder']) => void;
  clearError: () => void;
  
  // Bulk Operations
  duplicatePlatform: (id: string) => Promise<Platform>;
  exportPlatform: (id: string) => Promise<string>;
  importPlatform: (json: string) => Promise<Platform>;
}

type PlatformStore = PlatformState & PlatformActions;

/**
 * Create Platform Store
 */
export const usePlatformStore = create<PlatformStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        platforms: [],
        selectedPlatformId: null,
        isLoading: false,
        error: null,
        searchQuery: '',
        sortBy: 'updatedAt',
        sortOrder: 'desc',

        // Computed Getters
        get selectedPlatform() {
          const state = get();
          return state.platforms.find(p => p.id === state.selectedPlatformId);
        },

        get filteredPlatforms() {
          const state = get();
          let filtered = [...state.platforms];

          // Apply search
          if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
              p.name.toLowerCase().includes(query) ||
              p.description?.toLowerCase().includes(query)
            );
          }

          // Apply sorting
          filtered.sort((a, b) => {
            let comparison = 0;
            switch (state.sortBy) {
              case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
              case 'createdAt':
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
              case 'updatedAt':
                comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                break;
            }
            return state.sortOrder === 'asc' ? comparison : -comparison;
          });

          return filtered;
        },

        get platformCount() {
          return get().platforms.length;
        },

        // CRUD Operations
        loadPlatforms: async () => {
          set({ isLoading: true, error: null });
          try {
            const db = getDatabaseProvider();
            const result = await db.getAllPlatforms();
            if (result.success) {
              set({ platforms: result.data ?? [], isLoading: false });
            } else {
              set({ error: result.error, isLoading: false });
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to load platforms', isLoading: false });
          }
        },

        createPlatform: async (platformData) => {
          set({ isLoading: true, error: null });
          try {
            const db = getDatabaseProvider();
            const now = new Date().toISOString();
            const newPlatform: Platform = {
              ...platformData,
              id: crypto.randomUUID(),
              createdAt: now,
              updatedAt: now,
              resources: platformData.resources ?? [],
            };

            const result = await db.createPlatform(newPlatform);
            if (result.success) {
              set(state => ({
                platforms: [...state.platforms, newPlatform],
                isLoading: false,
              }));
              return newPlatform;
            } else {
              set({ error: result.error, isLoading: false });
              throw new Error(result.error);
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to create platform', isLoading: false });
            throw error;
          }
        },

        updatePlatform: async (id, updates) => {
          set({ isLoading: true, error: null });
          try {
            const db = getDatabaseProvider();
            const updatedPlatform = {
              ...updates,
              updatedAt: new Date().toISOString(),
            };

            const result = await db.updatePlatform(id, updatedPlatform);
            if (result.success) {
              set(state => ({
                platforms: state.platforms.map(p =>
                  p.id === id ? { ...p, ...updatedPlatform } : p
                ),
                isLoading: false,
              }));
            } else {
              set({ error: result.error, isLoading: false });
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to update platform', isLoading: false });
          }
        },

        deletePlatform: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const db = getDatabaseProvider();
            const result = await db.deletePlatform(id);
            if (result.success) {
              set(state => ({
                platforms: state.platforms.filter(p => p.id !== id),
                selectedPlatformId: state.selectedPlatformId === id ? null : state.selectedPlatformId,
                isLoading: false,
              }));
            } else {
              set({ error: result.error, isLoading: false });
            }
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to delete platform', isLoading: false });
          }
        },

        // Selection
        selectPlatform: (id) => {
          set({ selectedPlatformId: id });
        },

        // UI Actions
        setSearchQuery: (query) => {
          set({ searchQuery: query });
        },

        setSorting: (sortBy, sortOrder) => {
          set(state => ({
            sortBy,
            sortOrder: sortOrder ?? (state.sortBy === sortBy ? (state.sortOrder === 'asc' ? 'desc' : 'asc') : 'desc'),
          }));
        },

        clearError: () => {
          set({ error: null });
        },

        // Bulk Operations
        duplicatePlatform: async (id) => {
          const platform = get().platforms.find(p => p.id === id);
          if (!platform) throw new Error('Platform not found');

          const duplicate = {
            ...platform,
            name: `${platform.name} (Copy)`,
          };
          // Remove id, createdAt, updatedAt - they'll be set by createPlatform
          const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = duplicate;
          
          return get().createPlatform(rest);
        },

        exportPlatform: async (id) => {
          const platform = get().platforms.find(p => p.id === id);
          if (!platform) throw new Error('Platform not found');
          return JSON.stringify(platform, null, 2);
        },

        importPlatform: async (json) => {
          const parsed = JSON.parse(json) as Platform;
          const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = parsed;
          return get().createPlatform(rest);
        },
      }),
      {
        name: 'protocol-os-platform-store',
        partialize: (state) => ({
          selectedPlatformId: state.selectedPlatformId,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
        }),
      }
    ),
    { name: 'PlatformStore' }
  )
);

export default usePlatformStore;
