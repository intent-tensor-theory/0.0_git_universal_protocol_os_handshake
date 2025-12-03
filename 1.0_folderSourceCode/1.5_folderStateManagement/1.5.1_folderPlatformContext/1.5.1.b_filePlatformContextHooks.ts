// ============================================
// PROTOCOL OS - PLATFORM CONTEXT HOOKS
// ============================================
// Address: 1.5.1.b
// Purpose: Custom hooks for platform state operations
// ============================================

import { useMemo, useCallback } from 'react';
import { usePlatformContext, usePlatforms } from './1.5.1.a_filePlatformContextProvider';
import type { Platform, Resource, Handshake } from '@types/1.9.c_filePlatformTypeDefinitions';

/**
 * Hook for platform CRUD operations
 */
export function usePlatformOperations() {
  const { createPlatform, updatePlatform, deletePlatform, loadPlatforms } = usePlatformContext();

  return {
    create: createPlatform,
    update: updatePlatform,
    delete: deletePlatform,
    refresh: loadPlatforms,
  };
}

/**
 * Hook for platform selection
 */
export function usePlatformSelection() {
  const { state, selectPlatform, getSelectedPlatform } = usePlatformContext();

  return {
    selectedId: state.selectedPlatformId,
    selected: getSelectedPlatform(),
    select: selectPlatform,
    clear: () => selectPlatform(null),
  };
}

/**
 * Hook for platform loading state
 */
export function usePlatformLoading() {
  const { state } = usePlatformContext();

  return {
    isLoading: state.isLoading,
    error: state.error,
    lastUpdated: state.lastUpdated,
  };
}

/**
 * Hook for platform statistics
 */
export function usePlatformStats() {
  const platforms = usePlatforms();

  return useMemo(() => {
    const totalPlatforms = platforms.length;
    const totalResources = platforms.reduce((acc, p) => acc + p.resources.length, 0);
    const totalHandshakes = platforms.reduce(
      (acc, p) => acc + p.resources.reduce((rAcc, r) => rAcc + r.handshakes.length, 0),
      0
    );

    const byProtocolType: Record<string, number> = {};
    platforms.forEach((p) => {
      byProtocolType[p.protocolType] = (byProtocolType[p.protocolType] || 0) + 1;
    });

    return {
      totalPlatforms,
      totalResources,
      totalHandshakes,
      byProtocolType,
    };
  }, [platforms]);
}

/**
 * Hook for finding resources across platforms
 */
export function useResourceSearch() {
  const platforms = usePlatforms();

  const findResource = useCallback(
    (resourceId: string): { platform: Platform; resource: Resource } | null => {
      for (const platform of platforms) {
        const resource = platform.resources.find((r) => r.id === resourceId);
        if (resource) {
          return { platform, resource };
        }
      }
      return null;
    },
    [platforms]
  );

  const findResourcesByName = useCallback(
    (name: string): Array<{ platform: Platform; resource: Resource }> => {
      const results: Array<{ platform: Platform; resource: Resource }> = [];
      const lowerName = name.toLowerCase();

      platforms.forEach((platform) => {
        platform.resources.forEach((resource) => {
          if (resource.baseName.toLowerCase().includes(lowerName)) {
            results.push({ platform, resource });
          }
        });
      });

      return results;
    },
    [platforms]
  );

  return { findResource, findResourcesByName };
}

/**
 * Hook for finding handshakes across platforms
 */
export function useHandshakeSearch() {
  const platforms = usePlatforms();

  const findHandshake = useCallback(
    (handshakeId: string): { platform: Platform; resource: Resource; handshake: Handshake } | null => {
      for (const platform of platforms) {
        for (const resource of platform.resources) {
          const handshake = resource.handshakes.find((h) => h.id === handshakeId);
          if (handshake) {
            return { platform, resource, handshake };
          }
        }
      }
      return null;
    },
    [platforms]
  );

  const findHandshakesByName = useCallback(
    (name: string): Array<{ platform: Platform; resource: Resource; handshake: Handshake }> => {
      const results: Array<{ platform: Platform; resource: Resource; handshake: Handshake }> = [];
      const lowerName = name.toLowerCase();

      platforms.forEach((platform) => {
        platform.resources.forEach((resource) => {
          resource.handshakes.forEach((handshake) => {
            if (handshake.title.toLowerCase().includes(lowerName)) {
              results.push({ platform, resource, handshake });
            }
          });
        });
      });

      return results;
    },
    [platforms]
  );

  return { findHandshake, findHandshakesByName };
}

/**
 * Hook for platform filtering
 */
export function usePlatformFilter() {
  const platforms = usePlatforms();

  const filterByProtocol = useCallback(
    (protocolType: string) => platforms.filter((p) => p.protocolType === protocolType),
    [platforms]
  );

  const filterBySearch = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return platforms.filter(
        (p) =>
          p.title.toLowerCase().includes(lowerQuery) ||
          p.protocolType.toLowerCase().includes(lowerQuery) ||
          p.resources.some((r) => r.baseName.toLowerCase().includes(lowerQuery))
      );
    },
    [platforms]
  );

  const sortByDate = useCallback(
    (order: 'asc' | 'desc' = 'desc') => {
      return [...platforms].sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      });
    },
    [platforms]
  );

  const sortByName = useCallback(
    (order: 'asc' | 'desc' = 'asc') => {
      return [...platforms].sort((a, b) => {
        const comparison = a.title.localeCompare(b.title);
        return order === 'asc' ? comparison : -comparison;
      });
    },
    [platforms]
  );

  return {
    filterByProtocol,
    filterBySearch,
    sortByDate,
    sortByName,
  };
}

/**
 * Hook for managing a single platform's resources
 */
export function usePlatformResources(platformId: string) {
  const { getPlatformById, updatePlatform } = usePlatformContext();
  const platform = getPlatformById(platformId);

  const addResource = useCallback(
    async (resource: Resource) => {
      if (!platform) return;
      
      const updated = {
        ...platform,
        resources: [...platform.resources, resource],
        updatedAt: new Date().toISOString(),
      };
      await updatePlatform(updated);
    },
    [platform, updatePlatform]
  );

  const updateResource = useCallback(
    async (resource: Resource) => {
      if (!platform) return;
      
      const updated = {
        ...platform,
        resources: platform.resources.map((r) => (r.id === resource.id ? resource : r)),
        updatedAt: new Date().toISOString(),
      };
      await updatePlatform(updated);
    },
    [platform, updatePlatform]
  );

  const deleteResource = useCallback(
    async (resourceId: string) => {
      if (!platform) return;
      
      const updated = {
        ...platform,
        resources: platform.resources.filter((r) => r.id !== resourceId),
        updatedAt: new Date().toISOString(),
      };
      await updatePlatform(updated);
    },
    [platform, updatePlatform]
  );

  return {
    resources: platform?.resources ?? [],
    addResource,
    updateResource,
    deleteResource,
  };
}
