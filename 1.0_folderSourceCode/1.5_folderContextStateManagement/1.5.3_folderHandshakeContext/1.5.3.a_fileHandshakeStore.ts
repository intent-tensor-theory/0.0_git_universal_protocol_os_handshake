// ============================================
// PROTOCOL OS - HANDSHAKE STORE
// ============================================
// Address: 1.5.3.a
// Purpose: Zustand store for handshake state management
// ============================================

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Handshake, ProtocolType } from '@types/1.9.f_fileHandshakeTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import { usePlatformStore } from '@context/1.5.1_folderPlatformContext/1.5.1.a_filePlatformStore';

/**
 * Handshake Store State
 */
interface HandshakeState {
  // Selection
  selectedHandshakeId: string | null;
  expandedHandshakeIds: Set<string>;
  
  // Active Editing
  activeHandshake: Handshake | null;
  isDirty: boolean;
  
  // UI State
  viewMode: 'compact' | 'expanded' | 'editor';
  filterByProtocol: ProtocolType | null;
}

/**
 * Handshake Store Actions
 */
interface HandshakeActions {
  // Selection
  selectHandshake: (id: string | null) => void;
  toggleHandshakeExpanded: (id: string) => void;
  
  // Active Editing
  setActiveHandshake: (handshake: Handshake | null) => void;
  updateActiveHandshake: (updates: Partial<Handshake>) => void;
  saveActiveHandshake: (platformId: string, resourceId: string) => Promise<void>;
  discardChanges: () => void;
  
  // CRUD
  createHandshake: (platformId: string, resourceId: string, handshake: Omit<Handshake, 'id'>) => Promise<Handshake>;
  updateHandshake: (platformId: string, resourceId: string, handshakeId: string, updates: Partial<Handshake>) => Promise<void>;
  deleteHandshake: (platformId: string, resourceId: string, handshakeId: string) => Promise<void>;
  
  // cURL Request Management
  addCurlRequest: (platformId: string, resourceId: string, handshakeId: string, request: Omit<CurlRequest, 'id' | 'serial'>) => Promise<CurlRequest>;
  updateCurlRequest: (platformId: string, resourceId: string, handshakeId: string, requestId: string, updates: Partial<CurlRequest>) => Promise<void>;
  deleteCurlRequest: (platformId: string, resourceId: string, handshakeId: string, requestId: string) => Promise<void>;
  reorderCurlRequests: (platformId: string, resourceId: string, handshakeId: string, requestIds: string[]) => Promise<void>;
  
  // UI Actions
  setViewMode: (mode: HandshakeState['viewMode']) => void;
  setFilterByProtocol: (protocol: ProtocolType | null) => void;
  
  // Helpers
  getHandshakesForResource: (platformId: string, resourceId: string) => Handshake[];
  getHandshakeById: (platformId: string, resourceId: string, handshakeId: string) => Handshake | undefined;
  duplicateHandshake: (platformId: string, resourceId: string, handshakeId: string) => Promise<Handshake>;
}

type HandshakeStore = HandshakeState & HandshakeActions;

/**
 * Create Handshake Store
 */
export const useHandshakeStore = create<HandshakeStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      selectedHandshakeId: null,
      expandedHandshakeIds: new Set(),
      activeHandshake: null,
      isDirty: false,
      viewMode: 'compact',
      filterByProtocol: null,

      // Selection
      selectHandshake: (id) => {
        set({ selectedHandshakeId: id });
      },

      toggleHandshakeExpanded: (id) => {
        set(state => {
          const newExpanded = new Set(state.expandedHandshakeIds);
          if (newExpanded.has(id)) {
            newExpanded.delete(id);
          } else {
            newExpanded.add(id);
          }
          return { expandedHandshakeIds: newExpanded };
        });
      },

      // Active Editing
      setActiveHandshake: (handshake) => {
        set({ activeHandshake: handshake, isDirty: false });
      },

      updateActiveHandshake: (updates) => {
        set(state => ({
          activeHandshake: state.activeHandshake
            ? { ...state.activeHandshake, ...updates }
            : null,
          isDirty: true,
        }));
      },

      saveActiveHandshake: async (platformId, resourceId) => {
        const { activeHandshake } = get();
        if (!activeHandshake) return;

        await get().updateHandshake(platformId, resourceId, activeHandshake.id, activeHandshake);
        set({ isDirty: false });
      },

      discardChanges: () => {
        set({ activeHandshake: null, isDirty: false });
      },

      // CRUD Operations
      createHandshake: async (platformId, resourceId, handshakeData) => {
        const platformStore = usePlatformStore.getState();
        const platform = platformStore.platforms.find(p => p.id === platformId);
        const resource = platform?.resources?.find(r => r.id === resourceId);
        
        if (!platform || !resource) {
          throw new Error('Platform or resource not found');
        }

        const newHandshake: Handshake = {
          ...handshakeData,
          id: crypto.randomUUID(),
          curlRequests: handshakeData.curlRequests ?? [],
        };

        const updatedResources = platform.resources?.map(r =>
          r.id === resourceId
            ? { ...r, handshakes: [...(r.handshakes ?? []), newHandshake] }
            : r
        );

        await platformStore.updatePlatform(platformId, { resources: updatedResources });

        return newHandshake;
      },

      updateHandshake: async (platformId, resourceId, handshakeId, updates) => {
        const platformStore = usePlatformStore.getState();
        const platform = platformStore.platforms.find(p => p.id === platformId);
        
        if (!platform) throw new Error('Platform not found');

        const updatedResources = platform.resources?.map(r =>
          r.id === resourceId
            ? {
                ...r,
                handshakes: r.handshakes?.map(h =>
                  h.id === handshakeId ? { ...h, ...updates } : h
                ),
              }
            : r
        );

        await platformStore.updatePlatform(platformId, { resources: updatedResources });
      },

      deleteHandshake: async (platformId, resourceId, handshakeId) => {
        const platformStore = usePlatformStore.getState();
        const platform = platformStore.platforms.find(p => p.id === platformId);
        
        if (!platform) throw new Error('Platform not found');

        const updatedResources = platform.resources?.map(r =>
          r.id === resourceId
            ? { ...r, handshakes: r.handshakes?.filter(h => h.id !== handshakeId) }
            : r
        );

        await platformStore.updatePlatform(platformId, { resources: updatedResources });

        if (get().selectedHandshakeId === handshakeId) {
          set({ selectedHandshakeId: null });
        }
      },

      // cURL Request Management
      addCurlRequest: async (platformId, resourceId, handshakeId, requestData) => {
        const handshake = get().getHandshakeById(platformId, resourceId, handshakeId);
        if (!handshake) throw new Error('Handshake not found');

        const existingSerials = handshake.curlRequests?.map(r => r.serial) ?? [];
        const nextSerial = existingSerials.length > 0 ? Math.max(...existingSerials) + 1 : 1;

        const newRequest: CurlRequest = {
          ...requestData,
          id: crypto.randomUUID(),
          serial: nextSerial,
        };

        await get().updateHandshake(platformId, resourceId, handshakeId, {
          curlRequests: [...(handshake.curlRequests ?? []), newRequest],
        });

        return newRequest;
      },

      updateCurlRequest: async (platformId, resourceId, handshakeId, requestId, updates) => {
        const handshake = get().getHandshakeById(platformId, resourceId, handshakeId);
        if (!handshake) throw new Error('Handshake not found');

        const updatedRequests = handshake.curlRequests?.map(r =>
          r.id === requestId ? { ...r, ...updates } : r
        );

        await get().updateHandshake(platformId, resourceId, handshakeId, {
          curlRequests: updatedRequests,
        });
      },

      deleteCurlRequest: async (platformId, resourceId, handshakeId, requestId) => {
        const handshake = get().getHandshakeById(platformId, resourceId, handshakeId);
        if (!handshake) throw new Error('Handshake not found');

        const filteredRequests = handshake.curlRequests?.filter(r => r.id !== requestId);

        await get().updateHandshake(platformId, resourceId, handshakeId, {
          curlRequests: filteredRequests,
        });
      },

      reorderCurlRequests: async (platformId, resourceId, handshakeId, requestIds) => {
        const handshake = get().getHandshakeById(platformId, resourceId, handshakeId);
        if (!handshake) throw new Error('Handshake not found');

        const requestMap = new Map(handshake.curlRequests?.map(r => [r.id, r]));
        const reorderedRequests = requestIds
          .map((id, index) => {
            const request = requestMap.get(id);
            return request ? { ...request, serial: index + 1 } : null;
          })
          .filter((r): r is CurlRequest => r !== null);

        await get().updateHandshake(platformId, resourceId, handshakeId, {
          curlRequests: reorderedRequests,
        });
      },

      // UI Actions
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      setFilterByProtocol: (protocol) => {
        set({ filterByProtocol: protocol });
      },

      // Helpers
      getHandshakesForResource: (platformId, resourceId) => {
        const platform = usePlatformStore.getState().platforms.find(p => p.id === platformId);
        const resource = platform?.resources?.find(r => r.id === resourceId);
        let handshakes = resource?.handshakes ?? [];

        const { filterByProtocol } = get();
        if (filterByProtocol) {
          handshakes = handshakes.filter(h => h.protocolType === filterByProtocol);
        }

        return handshakes;
      },

      getHandshakeById: (platformId, resourceId, handshakeId) => {
        const platform = usePlatformStore.getState().platforms.find(p => p.id === platformId);
        const resource = platform?.resources?.find(r => r.id === resourceId);
        return resource?.handshakes?.find(h => h.id === handshakeId);
      },

      duplicateHandshake: async (platformId, resourceId, handshakeId) => {
        const handshake = get().getHandshakeById(platformId, resourceId, handshakeId);
        if (!handshake) throw new Error('Handshake not found');

        const duplicate = {
          ...handshake,
          title: `${handshake.title} (Copy)`,
          curlRequests: handshake.curlRequests?.map(r => ({
            ...r,
            id: crypto.randomUUID(),
          })),
        };
        const { id: _id, ...rest } = duplicate;

        return get().createHandshake(platformId, resourceId, rest);
      },
    }),
    { name: 'HandshakeStore' }
  )
);

export default useHandshakeStore;
