// ============================================
// PROTOCOL OS - PLATFORM CONTEXT HOOKS
// ============================================
// Address: 1.5.1.b
// Purpose: Specialized hooks for platform operations
// ============================================

import { useMemo, useCallback } from 'react';
import { usePlatformContext, usePlatforms } from './1.5.1.a_filePlatformContextProvider';
import type { Platform } from '@types/1.9.a_filePlatformTypeDefinitions';
import type { Resource } from '@types/1.9.b_fileResourceTypeDefinitions';

/**
 * Hook to get platforms filtered by various criteria
 */
export function useFilteredPlatforms(filters?: {
  search?: string;
  hasResources?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}): Platform[] {
  const platforms = usePlatforms();

  return useMemo(() => {
    let filtered = [...platforms];

    // Apply search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.baseUrl?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by has resources
    if (filters?.hasResources !== undefined) {
      filtered = filtered.filter(p =>
        filters.hasResources 
          ? p.resources.length > 0 
          : p.resources.length === 0
      );
    }

    // Sort
    if (filters?.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (filters.sortBy) {
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
        
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [platforms, filters?.search, filters?.hasResources, filters?.sortBy, filters?.sortOrder]);
}

/**
 * Hook to get platform statistics
 */
export function usePlatformStats(): {
  totalPlatforms: number;
  totalResources: number;
  totalHandshakes: number;
  totalCurlRequests: number;
  platformsWithResources: number;
} {
  const platforms = usePlatforms();

  return useMemo(() => {
    let totalResources = 0;
    let totalHandshakes = 0;
    let totalCurlRequests = 0;
    let platformsWithResources = 0;

    platforms.forEach(platform => {
      if (platform.resources.length > 0) {
        platformsWithResources++;
      }
      
      totalResources += platform.resources.length;
      
      platform.resources.forEach(resource => {
        totalHandshakes += resource.handshakes.length;
        
        resource.handshakes.forEach(handshake => {
          totalCurlRequests += handshake.curlRequests.length;
        });
      });
    });

    return {
      totalPlatforms: platforms.length,
      totalResources,
      totalHandshakes,
      totalCurlRequests,
      platformsWithResources,
    };
  }, [platforms]);
}

/**
 * Hook for CRUD operations on a specific platform's resources
 */
export function usePlatformResources(platformId: string): {
  resources: Resource[];
  addResource: (resource: Omit<Resource, 'id' | 'handshakes'>) => Promise<boolean>;
  updateResource: (resource: Resource) => Promise<boolean>;
  deleteResource: (resourceId: string) => Promise<boolean>;
} {
  const { getPlatformById, updatePlatform } = usePlatformContext();
  
  const platform = getPlatformById(platformId);
  const resources = platform?.resources ?? [];

  const addResource = useCallback(async (
    resourceData: Omit<Resource, 'id' | 'handshakes'>
  ): Promise<boolean> => {
    if (!platform) return false;

    const newResource: Resource = {
      ...resourceData,
      id: crypto.randomUUID(),
      handshakes: [],
    };

    const updatedPlatform: Platform = {
      ...platform,
      resources: [...platform.resources, newResource],
      updatedAt: new Date().toISOString(),
    };

    return updatePlatform(updatedPlatform);
  }, [platform, updatePlatform]);

  const updateResource = useCallback(async (resource: Resource): Promise<boolean> => {
    if (!platform) return false;

    const updatedPlatform: Platform = {
      ...platform,
      resources: platform.resources.map(r =>
        r.id === resource.id ? resource : r
      ),
      updatedAt: new Date().toISOString(),
    };

    return updatePlatform(updatedPlatform);
  }, [platform, updatePlatform]);

  const deleteResource = useCallback(async (resourceId: string): Promise<boolean> => {
    if (!platform) return false;

    const updatedPlatform: Platform = {
      ...platform,
      resources: platform.resources.filter(r => r.id !== resourceId),
      updatedAt: new Date().toISOString(),
    };

    return updatePlatform(updatedPlatform);
  }, [platform, updatePlatform]);

  return {
    resources,
    addResource,
    updateResource,
    deleteResource,
  };
}

/**
 * Hook to find a resource across all platforms
 */
export function useFindResource(resourceId: string): {
  resource: Resource | null;
  platform: Platform | null;
} {
  const platforms = usePlatforms();

  return useMemo(() => {
    for (const platform of platforms) {
      const resource = platform.resources.find(r => r.id === resourceId);
      if (resource) {
        return { resource, platform };
      }
    }
    return { resource: null, platform: null };
  }, [platforms, resourceId]);
}

/**
 * Hook to get recent platforms (last modified)
 */
export function useRecentPlatforms(count: number = 5): Platform[] {
  const platforms = usePlatforms();

  return useMemo(() => {
    return [...platforms]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, count);
  }, [platforms, count]);
}

/**
 * Hook for platform validation
 */
export function usePlatformValidation(platform: Partial<Platform>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  return useMemo(() => {
    const errors: Record<string, string> = {};

    if (!platform.name?.trim()) {
      errors.name = 'Platform name is required';
    } else if (platform.name.length < 2) {
      errors.name = 'Platform name must be at least 2 characters';
    }

    if (platform.baseUrl && !isValidUrl(platform.baseUrl)) {
      errors.baseUrl = 'Invalid URL format';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }, [platform.name, platform.baseUrl]);
}

/**
 * Helper to validate URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}
