// ============================================
// PROTOCOL OS - SAVED HANDSHAKES STORE
// ============================================
// Address: 1.5.5.a
// Purpose: Zustand store for saved handshake snapshots
// ============================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SavedHandshake } from '@types/1.9.g_fileSavedHandshakeTypeDefinitions';
import { getDatabaseProvider } from '@database/1.2.c_fileIndex';

/**
 * Saved Handshakes Store State
 */
interface SavedHandshakesState {
  // Data
  savedHandshakes: SavedHandshake[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterByBaseName: string | null;
  filterByTag: string | null;
  sortBy: 'savedAt' | 'serial' | 'title';
  sortOrder: 'asc' | 'desc';
  
  // Selection
  selectedSnapshotId: string | null;
}

/**
 * Saved Handshakes Store Actions
 */
interface SavedHandshakesActions {
  // CRUD
  loadSavedHandshakes: () => Promise<void>;
  loadByBaseName: (baseName: string) => Promise<void>;
  saveHandshake: (handshake: Omit<SavedHandshake, 'id' | 'savedAt'>) => Promise<SavedHandshake>;
  deleteSavedHandshake: (id: string) => Promise<void>;
  updateSavedHandshake: (id: string, updates: Partial<SavedHandshake>) => Promise<void>;
  
  // Selection
  selectSnapshot: (id: string | null) => void;
  
  // UI Actions
  setSearchQuery: (query: string) => void;
  setFilterByBaseName: (baseName: string | null) => void;
  setFilterByTag: (tag: string | null) => void;
  setSorting: (sortBy: SavedHandshakesState['sortBy'], sortOrder?: SavedHandshakesState['sortOrder']) => void;
  clearError: () => void;
  
  // Queries
  getFilteredHandshakes: () => SavedHandshake[];
  getByBaseName: (baseName: string) => SavedHandshake[];
  getLatestByBaseName: (baseName: string) => SavedHandshake | undefined;
  getMasterByBaseName: (baseName: string) => SavedHandshake | undefined;
  getAllTags: () => string[];
  getAllBaseNames: () => string[];
  
  // Bulk Operations
  exportAll: () => Promise<string>;
  importAll: (json: string) => Promise<void>;
  deleteByBaseName: (baseName: string) => Promise<void>;
  setAsMaster: (id: string) => Promise<void>;
}

type SavedHandshakesStore = SavedHandshakesState & SavedHandshakesActions;

/**
 * Create Saved Handshakes Store
 */
export const useSavedHandshakesStore = create<SavedHandshakesStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      savedHandshakes: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      filterByBaseName: null,
      filterByTag: null,
      sortBy: 'savedAt',
      sortOrder: 'desc',
      selectedSnapshotId: null,

      // CRUD
      loadSavedHandshakes: async () => {
        set({ isLoading: true, error: null });
        try {
          const db = getDatabaseProvider();
          const result = await db.getAllSavedHandshakes();
          if (result.success) {
            set({ savedHandshakes: result.data ?? [], isLoading: false });
          } else {
            set({ error: result.error, isLoading: false });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load', isLoading: false });
        }
      },

      loadByBaseName: async (baseName) => {
        set({ isLoading: true, error: null });
        try {
          const db = getDatabaseProvider();
          const result = await db.getSavedHandshakesByBaseName(baseName);
          if (result.success) {
            // Merge with existing, replacing those with same baseName
            set(state => {
              const otherHandshakes = state.savedHandshakes.filter(h => h.baseName !== baseName);
              return {
                savedHandshakes: [...otherHandshakes, ...(result.data ?? [])],
                isLoading: false,
              };
            });
          } else {
            set({ error: result.error, isLoading: false });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to load', isLoading: false });
        }
      },

      saveHandshake: async (handshakeData) => {
        set({ isLoading: true, error: null });
        try {
          const db = getDatabaseProvider();
          
          // Calculate next serial for this baseName
          const existing = get().getByBaseName(handshakeData.baseName);
          const maxSerial = existing.length > 0 
            ? Math.max(...existing.map(h => h.serial))
            : 0;

          const newHandshake: SavedHandshake = {
            ...handshakeData,
            id: crypto.randomUUID(),
            serial: maxSerial + 1,
            savedAt: new Date().toISOString(),
          };

          const result = await db.saveHandshakeSnapshot(newHandshake);
          if (result.success) {
            set(state => ({
              savedHandshakes: [...state.savedHandshakes, newHandshake],
              isLoading: false,
            }));
            return newHandshake;
          } else {
            set({ error: result.error, isLoading: false });
            throw new Error(result.error);
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to save', isLoading: false });
          throw error;
        }
      },

      deleteSavedHandshake: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const db = getDatabaseProvider();
          const result = await db.deleteSavedHandshake(id);
          if (result.success) {
            set(state => ({
              savedHandshakes: state.savedHandshakes.filter(h => h.id !== id),
              selectedSnapshotId: state.selectedSnapshotId === id ? null : state.selectedSnapshotId,
              isLoading: false,
            }));
          } else {
            set({ error: result.error, isLoading: false });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to delete', isLoading: false });
        }
      },

      updateSavedHandshake: async (id, updates) => {
        // Note: Most databases don't support updating saved snapshots
        // This is primarily for updating metadata like tags or isMaster flag
        set(state => ({
          savedHandshakes: state.savedHandshakes.map(h =>
            h.id === id ? { ...h, ...updates } : h
          ),
        }));
      },

      // Selection
      selectSnapshot: (id) => {
        set({ selectedSnapshotId: id });
      },

      // UI Actions
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setFilterByBaseName: (baseName) => {
        set({ filterByBaseName: baseName });
      },

      setFilterByTag: (tag) => {
        set({ filterByTag: tag });
      },

      setSorting: (sortBy, sortOrder) => {
        set(state => ({
          sortBy,
          sortOrder: sortOrder ?? (state.sortBy === sortBy 
            ? (state.sortOrder === 'asc' ? 'desc' : 'asc') 
            : 'desc'),
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      // Queries
      getFilteredHandshakes: () => {
        const { savedHandshakes, searchQuery, filterByBaseName, filterByTag, sortBy, sortOrder } = get();
        
        let filtered = [...savedHandshakes];

        // Apply baseName filter
        if (filterByBaseName) {
          filtered = filtered.filter(h => h.baseName === filterByBaseName);
        }

        // Apply tag filter
        if (filterByTag) {
          filtered = filtered.filter(h => h.tags?.includes(filterByTag));
        }

        // Apply search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(h =>
            h.title.toLowerCase().includes(query) ||
            h.baseName.toLowerCase().includes(query) ||
            h.description?.toLowerCase().includes(query)
          );
        }

        // Apply sorting
        filtered.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case 'savedAt':
              comparison = new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
              break;
            case 'serial':
              comparison = a.serial - b.serial;
              break;
            case 'title':
              comparison = a.title.localeCompare(b.title);
              break;
          }
          return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
      },

      getByBaseName: (baseName) => {
        return get().savedHandshakes
          .filter(h => h.baseName === baseName)
          .sort((a, b) => b.serial - a.serial);
      },

      getLatestByBaseName: (baseName) => {
        return get().getByBaseName(baseName)[0];
      },

      getMasterByBaseName: (baseName) => {
        return get().savedHandshakes.find(h => h.baseName === baseName && h.isMaster);
      },

      getAllTags: () => {
        const tags = new Set<string>();
        get().savedHandshakes.forEach(h => {
          h.tags?.forEach(t => tags.add(t));
        });
        return Array.from(tags).sort();
      },

      getAllBaseNames: () => {
        const baseNames = new Set<string>();
        get().savedHandshakes.forEach(h => baseNames.add(h.baseName));
        return Array.from(baseNames).sort();
      },

      // Bulk Operations
      exportAll: async () => {
        return JSON.stringify(get().savedHandshakes, null, 2);
      },

      importAll: async (json) => {
        const parsed = JSON.parse(json) as SavedHandshake[];
        for (const handshake of parsed) {
          const { id: _id, savedAt: _s, ...rest } = handshake;
          await get().saveHandshake(rest);
        }
      },

      deleteByBaseName: async (baseName) => {
        const toDelete = get().getByBaseName(baseName);
        for (const handshake of toDelete) {
          await get().deleteSavedHandshake(handshake.id);
        }
      },

      setAsMaster: async (id) => {
        const handshake = get().savedHandshakes.find(h => h.id === id);
        if (!handshake) throw new Error('Handshake not found');

        // Remove master flag from others with same baseName
        set(state => ({
          savedHandshakes: state.savedHandshakes.map(h => {
            if (h.baseName === handshake.baseName) {
              return { ...h, isMaster: h.id === id };
            }
            return h;
          }),
        }));
      },
    }),
    { name: 'SavedHandshakesStore' }
  )
);

export default useSavedHandshakesStore;
