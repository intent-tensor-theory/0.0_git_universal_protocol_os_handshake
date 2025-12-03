// ============================================
// PROTOCOL OS - CONTIGUOUS SERIAL CHAIN RESOLVER
// ============================================
// Address: 1.4.1.d
// Purpose: Validate and Traverse Serial Number Hierarchy
// ============================================

import { 
  PlatformSerialNumberGenerator, 
  type PlatformSerialNumber 
} from './1.4.1.a_filePlatformSerialNumberGenerator';
import { 
  ResourceSerialNumberGenerator, 
  type ResourceSerialNumber,
  type ResourceType 
} from './1.4.1.b_fileResourceSerialNumberGenerator';
import { 
  HandshakeSerialNumberGenerator, 
  type HandshakeSerialNumber,
  type HandshakeOutcome 
} from './1.4.1.c_fileHandshakeSerialNumberGenerator';

/**
 * Contiguous Serial Chain Resolver
 * 
 * Provides utilities for:
 * - Validating complete serial chains (Platform → Resource → Handshake)
 * - Traversing up/down the hierarchy
 * - Finding related serials
 * - Building audit trails
 * - Chain integrity verification
 * 
 * Serial Hierarchy:
 *   Platform Serial (root)
 *        │
 *        ├── Resource Serial 1
 *        │       ├── Handshake Serial 1.1
 *        │       ├── Handshake Serial 1.2
 *        │       └── ...
 *        │
 *        ├── Resource Serial 2
 *        │       ├── Handshake Serial 2.1
 *        │       └── ...
 *        │
 *        └── ...
 */

/**
 * Serial type enum
 */
export type SerialType = 'platform' | 'resource' | 'handshake';

/**
 * Chain node representing a serial in the hierarchy
 */
export interface ChainNode {
  type: SerialType;
  serial: string;
  isValid: boolean;
  parent?: string;
  children?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Complete chain from platform to handshake
 */
export interface SerialChain {
  platform: PlatformSerialNumber | null;
  resource: ResourceSerialNumber | null;
  handshake: HandshakeSerialNumber | null;
  isComplete: boolean;
  isValid: boolean;
  errors: string[];
}

/**
 * Chain validation result
 */
export interface ChainValidationResult {
  isValid: boolean;
  isComplete: boolean;
  errors: string[];
  nodes: ChainNode[];
}

/**
 * Chain traversal options
 */
export interface ChainTraversalOptions {
  /** Include children when traversing down */
  includeChildren?: boolean;
  
  /** Maximum depth to traverse */
  maxDepth?: number;
  
  /** Filter by serial type */
  filterType?: SerialType;
  
  /** Filter by outcome (handshakes only) */
  filterOutcome?: HandshakeOutcome;
  
  /** Filter by resource type */
  filterResourceType?: ResourceType;
  
  /** Date range filter */
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

/**
 * Serial registry for storing relationships
 */
interface SerialRegistry {
  platforms: Map<string, PlatformSerialNumber>;
  resources: Map<string, ResourceSerialNumber>;
  handshakes: Map<string, HandshakeSerialNumber>;
  
  // Relationship maps
  platformToResources: Map<string, Set<string>>;
  resourceToHandshakes: Map<string, Set<string>>;
}

/**
 * Contiguous Serial Chain Resolver
 */
export class ContiguousSerialChainResolver {
  private static registry: SerialRegistry = {
    platforms: new Map(),
    resources: new Map(),
    handshakes: new Map(),
    platformToResources: new Map(),
    resourceToHandshakes: new Map(),
  };

  // ============================================
  // REGISTRATION
  // ============================================

  /**
   * Register a platform serial
   */
  static registerPlatform(platform: PlatformSerialNumber): void {
    this.registry.platforms.set(platform.serial, platform);
    if (!this.registry.platformToResources.has(platform.serial)) {
      this.registry.platformToResources.set(platform.serial, new Set());
    }
  }

  /**
   * Register a resource serial
   */
  static registerResource(resource: ResourceSerialNumber): void {
    this.registry.resources.set(resource.serial, resource);
    
    // Add to parent's children
    const parentSet = this.registry.platformToResources.get(resource.parentSerial);
    if (parentSet) {
      parentSet.add(resource.serial);
    }
    
    // Initialize handshake set
    if (!this.registry.resourceToHandshakes.has(resource.serial)) {
      this.registry.resourceToHandshakes.set(resource.serial, new Set());
    }
  }

  /**
   * Register a handshake serial
   */
  static registerHandshake(handshake: HandshakeSerialNumber): void {
    this.registry.handshakes.set(handshake.serial, handshake);
    
    // Add to parent's children
    const parentSet = this.registry.resourceToHandshakes.get(handshake.parentSerial);
    if (parentSet) {
      parentSet.add(handshake.serial);
    }
  }

  // ============================================
  // TYPE DETECTION
  // ============================================

  /**
   * Detect serial type from format
   */
  static detectType(serial: string): SerialType | null {
    if (serial.startsWith('POS-')) return 'platform';
    if (serial.startsWith('RES-')) return 'resource';
    if (serial.startsWith('HSK-')) return 'handshake';
    return null;
  }

  /**
   * Check if serial is platform type
   */
  static isPlatformSerial(serial: string): boolean {
    return this.detectType(serial) === 'platform';
  }

  /**
   * Check if serial is resource type
   */
  static isResourceSerial(serial: string): boolean {
    return this.detectType(serial) === 'resource';
  }

  /**
   * Check if serial is handshake type
   */
  static isHandshakeSerial(serial: string): boolean {
    return this.detectType(serial) === 'handshake';
  }

  // ============================================
  // CHAIN RESOLUTION
  // ============================================

  /**
   * Resolve complete chain from any serial
   */
  static resolveChain(serial: string): SerialChain {
    const type = this.detectType(serial);
    const errors: string[] = [];
    
    let platform: PlatformSerialNumber | null = null;
    let resource: ResourceSerialNumber | null = null;
    let handshake: HandshakeSerialNumber | null = null;

    if (!type) {
      errors.push('Unknown serial type');
      return { platform, resource, handshake, isComplete: false, isValid: false, errors };
    }

    try {
      switch (type) {
        case 'platform':
          platform = this.resolvePlatform(serial);
          break;
          
        case 'resource':
          resource = this.resolveResource(serial);
          if (resource) {
            platform = this.resolvePlatform(resource.parentSerial);
          }
          break;
          
        case 'handshake':
          handshake = this.resolveHandshake(serial);
          if (handshake) {
            resource = this.resolveResource(handshake.parentSerial);
            if (resource) {
              platform = this.resolvePlatform(resource.parentSerial);
            }
          }
          break;
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Resolution error');
    }

    // Validate chain integrity
    if (resource && platform) {
      if (!ResourceSerialNumberGenerator.belongsToPlatform(resource.serial, platform.serial)) {
        errors.push('Resource does not belong to platform');
      }
    }
    
    if (handshake && resource) {
      if (!HandshakeSerialNumberGenerator.belongsToResource(handshake.serial, resource.serial)) {
        errors.push('Handshake does not belong to resource');
      }
    }

    const isComplete = platform !== null && resource !== null && handshake !== null;
    const isValid = errors.length === 0 && (
      (type === 'platform' && platform !== null) ||
      (type === 'resource' && resource !== null && platform !== null) ||
      (type === 'handshake' && handshake !== null && resource !== null && platform !== null)
    );

    return { platform, resource, handshake, isComplete, isValid, errors };
  }

  /**
   * Resolve platform serial
   */
  private static resolvePlatform(serial: string): PlatformSerialNumber | null {
    // Check registry first
    const registered = this.registry.platforms.get(serial);
    if (registered) return registered;
    
    // Try to parse
    return PlatformSerialNumberGenerator.parse(serial);
  }

  /**
   * Resolve resource serial
   */
  private static resolveResource(serial: string): ResourceSerialNumber | null {
    // Check registry first
    const registered = this.registry.resources.get(serial);
    if (registered) return registered;
    
    // Try to parse (limited info)
    const parsed = ResourceSerialNumberGenerator.parse(serial);
    if (parsed) {
      return {
        ...parsed,
        parentSerial: '', // Cannot determine from serial alone
      } as ResourceSerialNumber;
    }
    return null;
  }

  /**
   * Resolve handshake serial
   */
  private static resolveHandshake(serial: string): HandshakeSerialNumber | null {
    // Check registry first
    const registered = this.registry.handshakes.get(serial);
    if (registered) return registered;
    
    // Try to parse (limited info)
    const parsed = HandshakeSerialNumberGenerator.parse(serial);
    if (parsed) {
      return {
        ...parsed,
        parentSerial: '', // Cannot determine from serial alone
      } as HandshakeSerialNumber;
    }
    return null;
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validate a serial chain
   */
  static validateChain(
    platformSerial: string,
    resourceSerial?: string,
    handshakeSerial?: string
  ): ChainValidationResult {
    const errors: string[] = [];
    const nodes: ChainNode[] = [];

    // Validate platform
    const platformValidation = PlatformSerialNumberGenerator.validate(platformSerial);
    nodes.push({
      type: 'platform',
      serial: platformSerial,
      isValid: platformValidation.isValid,
      children: resourceSerial ? [resourceSerial] : [],
    });
    
    if (!platformValidation.isValid) {
      errors.push(`Platform serial invalid: ${platformValidation.error}`);
    }

    // Validate resource if provided
    if (resourceSerial) {
      const resourceValidation = ResourceSerialNumberGenerator.validate(
        resourceSerial,
        platformSerial
      );
      nodes.push({
        type: 'resource',
        serial: resourceSerial,
        isValid: resourceValidation.isValid,
        parent: platformSerial,
        children: handshakeSerial ? [handshakeSerial] : [],
      });
      
      if (!resourceValidation.isValid) {
        errors.push(`Resource serial invalid: ${resourceValidation.error}`);
      }
    }

    // Validate handshake if provided
    if (handshakeSerial && resourceSerial) {
      const handshakeValidation = HandshakeSerialNumberGenerator.validate(
        handshakeSerial,
        resourceSerial
      );
      nodes.push({
        type: 'handshake',
        serial: handshakeSerial,
        isValid: handshakeValidation.isValid,
        parent: resourceSerial,
      });
      
      if (!handshakeValidation.isValid) {
        errors.push(`Handshake serial invalid: ${handshakeValidation.error}`);
      }
    }

    const isComplete = nodes.length === 3 && nodes.every(n => n.isValid);
    const isValid = errors.length === 0;

    return { isValid, isComplete, errors, nodes };
  }

  /**
   * Validate serial belongs to chain
   */
  static belongsToChain(serial: string, chainRoot: string): boolean {
    const type = this.detectType(serial);
    const rootType = this.detectType(chainRoot);
    
    if (!type || !rootType) return false;
    if (serial === chainRoot) return true;
    
    const chain = this.resolveChain(serial);
    
    switch (rootType) {
      case 'platform':
        return chain.platform?.serial === chainRoot;
      case 'resource':
        return chain.resource?.serial === chainRoot;
      case 'handshake':
        return chain.handshake?.serial === chainRoot;
      default:
        return false;
    }
  }

  // ============================================
  // TRAVERSAL
  // ============================================

  /**
   * Get parent serial
   */
  static getParent(serial: string): string | null {
    const type = this.detectType(serial);
    
    switch (type) {
      case 'platform':
        return null; // Root has no parent
        
      case 'resource': {
        const resource = this.registry.resources.get(serial);
        return resource?.parentSerial || null;
      }
      
      case 'handshake': {
        const handshake = this.registry.handshakes.get(serial);
        return handshake?.parentSerial || null;
      }
      
      default:
        return null;
    }
  }

  /**
   * Get children serials
   */
  static getChildren(serial: string): string[] {
    const type = this.detectType(serial);
    
    switch (type) {
      case 'platform': {
        const children = this.registry.platformToResources.get(serial);
        return children ? Array.from(children) : [];
      }
      
      case 'resource': {
        const children = this.registry.resourceToHandshakes.get(serial);
        return children ? Array.from(children) : [];
      }
      
      case 'handshake':
        return []; // Leaf nodes have no children
        
      default:
        return [];
    }
  }

  /**
   * Get all descendants
   */
  static getDescendants(serial: string, options: ChainTraversalOptions = {}): string[] {
    const descendants: string[] = [];
    const maxDepth = options.maxDepth ?? Infinity;
    
    const traverse = (current: string, depth: number) => {
      if (depth > maxDepth) return;
      
      const children = this.getChildren(current);
      for (const child of children) {
        const childType = this.detectType(child);
        
        // Apply filters
        if (options.filterType && childType !== options.filterType) continue;
        
        if (options.filterResourceType && childType === 'resource') {
          const resource = this.registry.resources.get(child);
          if (resource?.metadata.resourceType !== options.filterResourceType) continue;
        }
        
        if (options.filterOutcome && childType === 'handshake') {
          const handshake = this.registry.handshakes.get(child);
          if (handshake?.metadata.outcome !== options.filterOutcome) continue;
        }
        
        descendants.push(child);
        traverse(child, depth + 1);
      }
    };
    
    traverse(serial, 0);
    return descendants;
  }

  /**
   * Get all ancestors
   */
  static getAncestors(serial: string): string[] {
    const ancestors: string[] = [];
    let current = this.getParent(serial);
    
    while (current) {
      ancestors.push(current);
      current = this.getParent(current);
    }
    
    return ancestors;
  }

  /**
   * Get root (platform) serial
   */
  static getRoot(serial: string): string | null {
    const ancestors = this.getAncestors(serial);
    return ancestors.length > 0 ? ancestors[ancestors.length - 1] : 
           this.detectType(serial) === 'platform' ? serial : null;
  }

  // ============================================
  // AUDIT TRAIL
  // ============================================

  /**
   * Build audit trail for a serial
   */
  static buildAuditTrail(serial: string): Array<{
    serial: string;
    type: SerialType;
    timestamp: Date;
    action: string;
    details: Record<string, unknown>;
  }> {
    const trail: Array<{
      serial: string;
      type: SerialType;
      timestamp: Date;
      action: string;
      details: Record<string, unknown>;
    }> = [];
    
    const chain = this.resolveChain(serial);
    
    // Add platform creation
    if (chain.platform) {
      trail.push({
        serial: chain.platform.serial,
        type: 'platform',
        timestamp: chain.platform.metadata.generatedAt,
        action: 'Platform Created',
        details: {
          edition: chain.platform.metadata.edition,
          installationType: chain.platform.metadata.installationType,
        },
      });
    }
    
    // Add resource creation
    if (chain.resource) {
      trail.push({
        serial: chain.resource.serial,
        type: 'resource',
        timestamp: chain.resource.metadata.createdAt,
        action: 'Resource Created',
        details: {
          resourceType: chain.resource.metadata.resourceType,
          name: chain.resource.metadata.name,
        },
      });
    }
    
    // Add handshake events
    if (chain.handshake) {
      trail.push({
        serial: chain.handshake.serial,
        type: 'handshake',
        timestamp: chain.handshake.metadata.startedAt,
        action: `Handshake ${chain.handshake.metadata.outcome}`,
        details: {
          outcome: chain.handshake.metadata.outcome,
          handshakeType: chain.handshake.metadata.handshakeType,
          durationMs: chain.handshake.metadata.durationMs,
        },
      });
    }
    
    // Sort by timestamp
    trail.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return trail;
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get registry statistics
   */
  static getRegistryStats(): {
    platforms: number;
    resources: number;
    handshakes: number;
    avgResourcesPerPlatform: number;
    avgHandshakesPerResource: number;
  } {
    const platforms = this.registry.platforms.size;
    const resources = this.registry.resources.size;
    const handshakes = this.registry.handshakes.size;
    
    const avgResourcesPerPlatform = platforms > 0 ? resources / platforms : 0;
    const avgHandshakesPerResource = resources > 0 ? handshakes / resources : 0;
    
    return {
      platforms,
      resources,
      handshakes,
      avgResourcesPerPlatform: Math.round(avgResourcesPerPlatform * 100) / 100,
      avgHandshakesPerResource: Math.round(avgHandshakesPerResource * 100) / 100,
    };
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Clear registry
   */
  static clearRegistry(): void {
    this.registry.platforms.clear();
    this.registry.resources.clear();
    this.registry.handshakes.clear();
    this.registry.platformToResources.clear();
    this.registry.resourceToHandshakes.clear();
  }

  /**
   * Remove platform and all descendants
   */
  static removePlatform(platformSerial: string): number {
    let removed = 0;
    
    // Remove handshakes
    const resources = this.registry.platformToResources.get(platformSerial);
    if (resources) {
      for (const resourceSerial of resources) {
        const handshakes = this.registry.resourceToHandshakes.get(resourceSerial);
        if (handshakes) {
          for (const handshakeSerial of handshakes) {
            this.registry.handshakes.delete(handshakeSerial);
            removed++;
          }
          this.registry.resourceToHandshakes.delete(resourceSerial);
        }
        this.registry.resources.delete(resourceSerial);
        removed++;
      }
      this.registry.platformToResources.delete(platformSerial);
    }
    
    this.registry.platforms.delete(platformSerial);
    removed++;
    
    return removed;
  }

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  /**
   * Export registry to JSON
   */
  static exportRegistry(): string {
    const data = {
      platforms: Array.from(this.registry.platforms.entries()),
      resources: Array.from(this.registry.resources.entries()),
      handshakes: Array.from(this.registry.handshakes.entries()),
      platformToResources: Array.from(this.registry.platformToResources.entries())
        .map(([k, v]) => [k, Array.from(v)]),
      resourceToHandshakes: Array.from(this.registry.resourceToHandshakes.entries())
        .map(([k, v]) => [k, Array.from(v)]),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import registry from JSON
   */
  static importRegistry(json: string): void {
    const data = JSON.parse(json);
    
    this.clearRegistry();
    
    for (const [k, v] of data.platforms) {
      this.registry.platforms.set(k, v);
    }
    for (const [k, v] of data.resources) {
      this.registry.resources.set(k, v);
    }
    for (const [k, v] of data.handshakes) {
      this.registry.handshakes.set(k, v);
    }
    for (const [k, v] of data.platformToResources) {
      this.registry.platformToResources.set(k, new Set(v));
    }
    for (const [k, v] of data.resourceToHandshakes) {
      this.registry.resourceToHandshakes.set(k, new Set(v));
    }
  }
}

/**
 * Utility: Create complete chain
 */
export function createSerialChain(
  platformOptions: Parameters<typeof PlatformSerialNumberGenerator.generate>[0],
  resourceOptions: Omit<Parameters<typeof ResourceSerialNumberGenerator.generate>[0], 'platformSerial'>,
  handshakeOptions?: Omit<Parameters<typeof HandshakeSerialNumberGenerator.generate>[0], 'resourceSerial'>
): SerialChain {
  // Generate platform
  const platform = PlatformSerialNumberGenerator.generate(platformOptions);
  ContiguousSerialChainResolver.registerPlatform(platform);
  
  // Generate resource
  const resource = ResourceSerialNumberGenerator.generate({
    ...resourceOptions,
    platformSerial: platform.serial,
  });
  ContiguousSerialChainResolver.registerResource(resource);
  
  // Generate handshake if options provided
  let handshake: HandshakeSerialNumber | null = null;
  if (handshakeOptions) {
    handshake = HandshakeSerialNumberGenerator.generate({
      ...handshakeOptions,
      resourceSerial: resource.serial,
    });
    ContiguousSerialChainResolver.registerHandshake(handshake);
  }
  
  return {
    platform,
    resource,
    handshake,
    isComplete: handshake !== null,
    isValid: true,
    errors: [],
  };
}

export default ContiguousSerialChainResolver;
