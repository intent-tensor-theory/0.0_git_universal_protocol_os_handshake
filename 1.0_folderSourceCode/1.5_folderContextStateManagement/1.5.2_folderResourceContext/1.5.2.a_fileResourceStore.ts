// ============================================
// PROTOCOL OS - RESOURCE STORE
// ============================================
// Address: 1.5.2.a
// Purpose: Zustand store for resource state management
// ============================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Resource } from '@types/1.9.c_fileResourceTypeDefinitions';
import { usePlatformStore } from '@context/1.5.1_folderPlatformContext/1.5.1.a_filePlatformStore';

/**
 * Resource Store State
 */
interface ResourceState {
  // Selection
  selectedResourceId: string | null;
  expandedResourceIds: Set<string>;
  
  // UI State
  isEditing: boolean;
  editingResourceId: string | null;
  searchQuery: string;
}

/**
 * Resource Store Actions
 */
interface ResourceActions {
  // Selection
  selectResource: (id: string | null) => void;
  toggleResourceExpanded: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  
  // CRUD (operates through Platform store)
  createResource: (platformId: string, resource: Omit<Resource, 'id'>) => Promise<Resource>;
  updateResource: (platformId: string, resourceId: string, updates: Partial<Resource>) => Promise<void>;
  deleteResource: (platformId: string, resourceId: string) => Promise<void>;
  
  // UI Actions
  startEditing: (id: string) => void;
  stopEditing: () => void;
  setSearchQuery: (query: string) => void;
  
  // Helpers
  getResourcesForPlatform: (platformId: string) => Resource[];
  getResourceById: (platformId: string, resourceId: string) => Resource | undefined;
  duplicateResource: (platformId: string, resourceId: string) => Promise<Resource>;
  moveResource: (fromPlatformId: string, toPlatformId: string, resourceId: string) => Promise<void>;
}

type ResourceStore = ResourceState & ResourceActions;

/**
 * Create Resource Store
 */
export const useResourceStore = create<ResourceStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      selectedResourceId: null,
      expandedResourceIds: new Set(),
      isEditing: false,
      editingResourceId: null,
      searchQuery: '',

      // Selection
      selectResource: (id) => {
        set({ selectedResourceId: id });
      },

      toggleResourceExpanded: (id) => {
        set(state => {
          const newExpanded = new Set(state.expandedResourceIds);
          if (newExpanded.has(id)) {
            newExpanded.delete(id);
          } else {
            newExpanded.add(id);
          }
          return { expandedResourceIds: newExpanded };
        });
      },

      expandAll: () => {
        const platforms = usePlatformStore.getState().platforms;
        const allResourceIds = new Set<string>();
        platforms.forEach(p => {
          p.resources?.forEach(r => allResourceIds.add(r.id));
        });
        set({ expandedResourceIds: allResourceIds });
      },

      collapseAll: () => {
        set({ expandedResourceIds: new Set() });
      },

      // CRUD Operations
      createResource: async (platformId, resourceData) => {
        const platformStore = usePlatformStore.getState();
        const platform = platformStore.platforms.find(p => p.id === platformId);
        
        if (!platform) {
          throw new Error('Platform not found');
        }

        const newResource: Resource = {
          ...resourceData,
          id: crypto.randomUUID(),
          handshakes: resourceData.handshakes ?? [],
        };

        await platformStore.updatePlatform(platformId, {
          resources: [...(platform.resources ?? []), newResource],
        });

        return newResource;
      },

      updateResource: async (platformId, resourceId, updates) => {
        const platformStore = usePlatformStore.getState();
        const platform = platformStore.platforms.find(p => p.id === platformId);
        
        if (!platform) {
          throw new Error('Platform not found');
        }

        const updatedResources = platform.resources?.map(r =>
          r.id === resourceId ? { ...r, ...updates } : r
        );

        await platformStore.updatePlatform(platformId, {
          resources: updatedResources,
        });
      },

      deleteResource: async (platformId, resourceId) => {
        const platformStore = usePlatformStore.getState();
        const platform = platformStore.platforms.find(p => p.id === platformId);
        
        if (!platform) {
          throw new Error('Platform not found');
        }

        const filteredResources = platform.resources?.filter(r => r.id !== resourceId);

        await platformStore.updatePlatform(platformId, {
          resources: filteredResources,
        });

        // Clear selection if deleted resource was selected
        if (get().selectedResourceId === resourceId) {
          set({ selectedResourceId: null });
        }
      },

      // UI Actions
      startEditing: (id) => {
        set({ isEditing: true, editingResourceId: id });
      },

      stopEditing: () => {
        set({ isEditing: false, editingResourceId: null });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      // Helpers
      getResourcesForPlatform: (platformId) => {
        const platform = usePlatformStore.getState().platforms.find(p => p.id === platformId);
        if (!platform) return [];

        const { searchQuery } = get();
        let resources = platform.resources ?? [];

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          resources = resources.filter(r =>
            r.name.toLowerCase().includes(query) ||
            r.baseName.toLowerCase().includes(query) ||
            r.description?.toLowerCase().includes(query)
          );
        }

        return resources;
      },

      getResourceById: (platformId, resourceId) => {
        const platform = usePlatformStore.getState().platforms.find(p => p.id === platformId);
        return platform?.resources?.find(r => r.id === resourceId);
      },

      duplicateResource: async (platformId, resourceId) => {
        const resource = get().getResourceById(platformId, resourceId);
        if (!resource) throw new Error('Resource not found');

        const duplicate = {
          ...resource,
          name: `${resource.name} (Copy)`,
          baseName: `${resource.baseName}-copy`,
        };
        const { id: _id, ...rest } = duplicate;

        return get().createResource(platformId, rest);
      },

      moveResource: async (fromPlatformId, toPlatformId, resourceId) => {
        const resource = get().getResourceById(fromPlatformId, resourceId);
        if (!resource) throw new Error('Resource not found');

        // Add to target platform
        const { id: _id, ...resourceData } = resource;
        await get().createResource(toPlatformId, resourceData);

        // Remove from source platform
        await get().deleteResource(fromPlatformId, resourceId);
      },
    }),
    { name: 'ResourceStore' }
  )
);

export default useResourceStore;
