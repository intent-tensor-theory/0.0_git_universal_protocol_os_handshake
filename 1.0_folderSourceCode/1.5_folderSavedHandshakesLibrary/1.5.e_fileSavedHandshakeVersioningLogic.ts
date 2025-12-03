// ============================================
// PROTOCOL OS - SAVED HANDSHAKE VERSIONING LOGIC
// ============================================
// Address: 1.5.e
// Purpose: Version Control for Saved Handshakes
// ============================================

/**
 * Saved Handshake Versioning Logic
 * 
 * Implements version control for handshake configurations:
 * - Semantic versioning (major.minor)
 * - Version history with change descriptions
 * - Diff comparison between versions
 * - Restore to previous versions
 * - Version metadata tracking
 * 
 * Implements Intent Tensor Theory principles for
 * recursive state management and configuration evolution.
 */

/**
 * Protocol configuration
 */
export interface ProtocolConfig {
  /** Protocol type */
  type: string;
  
  /** Protocol name */
  name: string;
  
  /** Protocol version */
  version?: string;
  
  /** Protocol description */
  description?: string;
}

/**
 * Credential configuration
 */
export interface CredentialConfig {
  /** Credential type */
  type: string;
  
  /** Credential values (encrypted references, not actual values) */
  values: Record<string, string>;
  
  /** Is encrypted */
  isEncrypted?: boolean;
}

/**
 * Request configuration
 */
export interface RequestConfig {
  /** HTTP method */
  method?: string;
  
  /** Request URL */
  url?: string;
  
  /** Request headers */
  headers?: Record<string, string>;
  
  /** Request parameters */
  params?: Record<string, string>;
  
  /** Request body */
  body?: unknown;
}

/**
 * Handshake configuration
 */
export interface HandshakeConfig {
  /** Request configuration */
  request?: RequestConfig;
  
  /** Credentials configuration */
  credentials?: CredentialConfig;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Version change type
 */
export type VersionChangeType = 
  | 'create'
  | 'update'
  | 'restore'
  | 'duplicate'
  | 'import';

/**
 * Version change
 */
export interface VersionChange {
  /** Field that changed */
  field: string;
  
  /** Previous value */
  oldValue?: unknown;
  
  /** New value */
  newValue?: unknown;
  
  /** Change type */
  type: 'add' | 'modify' | 'remove';
}

/**
 * Handshake version
 */
export interface HandshakeVersion {
  /** Version ID */
  id: string;
  
  /** Version number (major.minor format) */
  versionNumber: string;
  
  /** Version created at */
  createdAt: Date;
  
  /** Version created by (user ID or system) */
  createdBy?: string;
  
  /** Change description */
  changeDescription?: string;
  
  /** Change type */
  changeType: VersionChangeType;
  
  /** Changes from previous version */
  changes?: VersionChange[];
  
  /** Configuration snapshot */
  configSnapshot: HandshakeConfig;
  
  /** Protocol snapshot */
  protocolSnapshot: ProtocolConfig;
  
  /** Previous version ID */
  previousVersionId?: string;
  
  /** Is current version */
  isCurrent: boolean;
}

/**
 * Saved handshake
 */
export interface SavedHandshake {
  /** Unique ID */
  id: string;
  
  /** Serial reference */
  serial?: string;
  
  /** Name */
  name: string;
  
  /** Description */
  description?: string;
  
  /** Protocol configuration */
  protocol: ProtocolConfig;
  
  /** Handshake type */
  handshakeType: string;
  
  /** Current configuration */
  configuration: HandshakeConfig;
  
  /** Version history */
  versions: HandshakeVersion[];
  
  /** Category */
  category?: string;
  
  /** Tags */
  tags?: string[];
  
  /** Notes */
  notes?: string;
  
  /** Is favorite */
  isFavorite: boolean;
  
  /** Is archived */
  isArchived: boolean;
  
  /** Usage count */
  usageCount?: number;
  
  /** Success rate (percentage) */
  successRate?: number;
  
  /** Last used date */
  lastUsedAt?: Date;
  
  /** Created date */
  createdAt: Date;
  
  /** Updated date */
  updatedAt: Date;
  
  /** Created by */
  createdBy?: string;
}

// ============================================
// VERSION NUMBER UTILITIES
// ============================================

/**
 * Parse version number
 */
export function parseVersionNumber(version: string): { major: number; minor: number } {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0] || '1', 10),
    minor: parseInt(parts[1] || '0', 10),
  };
}

/**
 * Format version number
 */
export function formatVersionNumber(major: number, minor: number): string {
  return `${major}.${minor}`;
}

/**
 * Increment minor version
 */
export function incrementMinorVersion(version: string): string {
  const { major, minor } = parseVersionNumber(version);
  return formatVersionNumber(major, minor + 1);
}

/**
 * Increment major version
 */
export function incrementMajorVersion(version: string): string {
  const { major } = parseVersionNumber(version);
  return formatVersionNumber(major + 1, 0);
}

/**
 * Compare version numbers
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const parsedA = parseVersionNumber(a);
  const parsedB = parseVersionNumber(b);
  
  if (parsedA.major !== parsedB.major) {
    return parsedA.major < parsedB.major ? -1 : 1;
  }
  
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor < parsedB.minor ? -1 : 1;
  }
  
  return 0;
}

// ============================================
// VERSION MANAGEMENT
// ============================================

/**
 * Get latest version
 */
export function getLatestVersion(handshake: SavedHandshake): HandshakeVersion | undefined {
  if (handshake.versions.length === 0) return undefined;
  
  return handshake.versions.reduce((latest, current) => {
    if (!latest) return current;
    if (current.isCurrent) return current;
    if (compareVersions(current.versionNumber, latest.versionNumber) > 0) {
      return current;
    }
    return latest;
  }, undefined as HandshakeVersion | undefined);
}

/**
 * Get version by ID
 */
export function getVersionById(
  handshake: SavedHandshake, 
  versionId: string
): HandshakeVersion | undefined {
  return handshake.versions.find(v => v.id === versionId);
}

/**
 * Get version by number
 */
export function getVersionByNumber(
  handshake: SavedHandshake, 
  versionNumber: string
): HandshakeVersion | undefined {
  return handshake.versions.find(v => v.versionNumber === versionNumber);
}

/**
 * Generate version ID
 */
export function generateVersionId(): string {
  return `ver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create new version
 */
export function createNewVersion(
  handshake: SavedHandshake,
  config: HandshakeConfig,
  options: {
    changeType: VersionChangeType;
    changeDescription?: string;
    createdBy?: string;
    isMajorChange?: boolean;
  }
): HandshakeVersion {
  const latestVersion = getLatestVersion(handshake);
  const previousVersionNumber = latestVersion?.versionNumber || '0.0';
  
  const newVersionNumber = options.isMajorChange
    ? incrementMajorVersion(previousVersionNumber)
    : incrementMinorVersion(previousVersionNumber);
  
  // Calculate changes
  const changes = latestVersion
    ? calculateChanges(latestVersion.configSnapshot, config)
    : [];
  
  const newVersion: HandshakeVersion = {
    id: generateVersionId(),
    versionNumber: newVersionNumber,
    createdAt: new Date(),
    createdBy: options.createdBy,
    changeDescription: options.changeDescription,
    changeType: options.changeType,
    changes,
    configSnapshot: deepClone(config),
    protocolSnapshot: deepClone(handshake.protocol),
    previousVersionId: latestVersion?.id,
    isCurrent: true,
  };
  
  return newVersion;
}

/**
 * Add version to handshake
 */
export function addVersion(
  handshake: SavedHandshake,
  version: HandshakeVersion
): SavedHandshake {
  // Mark previous versions as not current
  const updatedVersions = handshake.versions.map(v => ({
    ...v,
    isCurrent: false,
  }));
  
  return {
    ...handshake,
    versions: [...updatedVersions, version],
    configuration: version.configSnapshot,
    updatedAt: new Date(),
  };
}

/**
 * Restore version
 */
export function restoreVersion(
  handshake: SavedHandshake,
  versionId: string,
  createdBy?: string
): SavedHandshake {
  const versionToRestore = getVersionById(handshake, versionId);
  
  if (!versionToRestore) {
    throw new Error(`Version ${versionId} not found`);
  }
  
  // Create a new version that represents the restore
  const restoreVersion = createNewVersion(
    handshake,
    versionToRestore.configSnapshot,
    {
      changeType: 'restore',
      changeDescription: `Restored from version ${versionToRestore.versionNumber}`,
      createdBy,
      isMajorChange: false,
    }
  );
  
  return addVersion(handshake, restoreVersion);
}

// ============================================
// CHANGE DETECTION
// ============================================

/**
 * Calculate changes between two configurations
 */
export function calculateChanges(
  oldConfig: HandshakeConfig,
  newConfig: HandshakeConfig
): VersionChange[] {
  const changes: VersionChange[] = [];
  
  // Compare request configuration
  if (oldConfig.request || newConfig.request) {
    const requestChanges = compareObjects(
      oldConfig.request || {},
      newConfig.request || {},
      'request'
    );
    changes.push(...requestChanges);
  }
  
  // Compare credentials configuration
  if (oldConfig.credentials || newConfig.credentials) {
    const credChanges = compareObjects(
      oldConfig.credentials || {},
      newConfig.credentials || {},
      'credentials'
    );
    changes.push(...credChanges);
  }
  
  // Compare metadata
  if (oldConfig.metadata || newConfig.metadata) {
    const metaChanges = compareObjects(
      oldConfig.metadata || {},
      newConfig.metadata || {},
      'metadata'
    );
    changes.push(...metaChanges);
  }
  
  return changes;
}

/**
 * Compare two objects and return changes
 */
function compareObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  prefix: string
): VersionChange[] {
  const changes: VersionChange[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  for (const key of allKeys) {
    const fieldPath = `${prefix}.${key}`;
    const oldValue = oldObj[key];
    const newValue = newObj[key];
    
    if (oldValue === undefined && newValue !== undefined) {
      changes.push({
        field: fieldPath,
        newValue,
        type: 'add',
      });
    } else if (oldValue !== undefined && newValue === undefined) {
      changes.push({
        field: fieldPath,
        oldValue,
        type: 'remove',
      });
    } else if (!deepEqual(oldValue, newValue)) {
      changes.push({
        field: fieldPath,
        oldValue,
        newValue,
        type: 'modify',
      });
    }
  }
  
  return changes;
}

/**
 * Generate change summary
 */
export function generateChangeSummary(changes: VersionChange[]): string {
  if (changes.length === 0) return 'No changes';
  
  const summary: string[] = [];
  
  const adds = changes.filter(c => c.type === 'add');
  const modifies = changes.filter(c => c.type === 'modify');
  const removes = changes.filter(c => c.type === 'remove');
  
  if (adds.length > 0) {
    summary.push(`Added ${adds.length} field${adds.length > 1 ? 's' : ''}`);
  }
  if (modifies.length > 0) {
    summary.push(`Modified ${modifies.length} field${modifies.length > 1 ? 's' : ''}`);
  }
  if (removes.length > 0) {
    summary.push(`Removed ${removes.length} field${removes.length > 1 ? 's' : ''}`);
  }
  
  return summary.join(', ');
}

// ============================================
// DIFF UTILITIES
// ============================================

/**
 * Version diff
 */
export interface VersionDiff {
  /** From version */
  fromVersion: HandshakeVersion;
  
  /** To version */
  toVersion: HandshakeVersion;
  
  /** Changes */
  changes: VersionChange[];
  
  /** Summary */
  summary: string;
}

/**
 * Compare two versions
 */
export function diffVersions(
  handshake: SavedHandshake,
  fromVersionId: string,
  toVersionId: string
): VersionDiff | null {
  const fromVersion = getVersionById(handshake, fromVersionId);
  const toVersion = getVersionById(handshake, toVersionId);
  
  if (!fromVersion || !toVersion) return null;
  
  const changes = calculateChanges(
    fromVersion.configSnapshot,
    toVersion.configSnapshot
  );
  
  return {
    fromVersion,
    toVersion,
    changes,
    summary: generateChangeSummary(changes),
  };
}

/**
 * Get version history with diffs
 */
export function getVersionHistoryWithDiffs(
  handshake: SavedHandshake
): Array<HandshakeVersion & { diff?: VersionDiff }> {
  const sortedVersions = [...handshake.versions].sort(
    (a, b) => compareVersions(a.versionNumber, b.versionNumber)
  );
  
  return sortedVersions.map((version, index) => {
    if (index === 0) {
      return { ...version, diff: undefined };
    }
    
    const previousVersion = sortedVersions[index - 1];
    const diff = diffVersions(handshake, previousVersion.id, version.id);
    
    return { ...version, diff: diff || undefined };
  });
}

// ============================================
// SAVED HANDSHAKE FACTORY
// ============================================

/**
 * Create new saved handshake
 */
export function createSavedHandshake(options: {
  name: string;
  description?: string;
  protocol: ProtocolConfig;
  handshakeType: string;
  configuration: HandshakeConfig;
  category?: string;
  tags?: string[];
  createdBy?: string;
}): SavedHandshake {
  const id = `shk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  // Create initial version
  const initialVersion: HandshakeVersion = {
    id: generateVersionId(),
    versionNumber: '1.0',
    createdAt: now,
    createdBy: options.createdBy,
    changeDescription: 'Initial version',
    changeType: 'create',
    changes: [],
    configSnapshot: deepClone(options.configuration),
    protocolSnapshot: deepClone(options.protocol),
    isCurrent: true,
  };
  
  return {
    id,
    name: options.name,
    description: options.description,
    protocol: options.protocol,
    handshakeType: options.handshakeType,
    configuration: options.configuration,
    versions: [initialVersion],
    category: options.category,
    tags: options.tags,
    isFavorite: false,
    isArchived: false,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: options.createdBy,
  };
}

/**
 * Duplicate saved handshake
 */
export function duplicateSavedHandshake(
  source: SavedHandshake,
  newName?: string,
  createdBy?: string
): SavedHandshake {
  const id = `shk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  
  // Create initial version for duplicate
  const initialVersion: HandshakeVersion = {
    id: generateVersionId(),
    versionNumber: '1.0',
    createdAt: now,
    createdBy,
    changeDescription: `Duplicated from "${source.name}"`,
    changeType: 'duplicate',
    changes: [],
    configSnapshot: deepClone(source.configuration),
    protocolSnapshot: deepClone(source.protocol),
    isCurrent: true,
  };
  
  return {
    id,
    name: newName || `${source.name} (Copy)`,
    description: source.description,
    protocol: deepClone(source.protocol),
    handshakeType: source.handshakeType,
    configuration: deepClone(source.configuration),
    versions: [initialVersion],
    category: source.category,
    tags: source.tags ? [...source.tags] : undefined,
    isFavorite: false,
    isArchived: false,
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

// ============================================
// EXPORT/IMPORT
// ============================================

/**
 * Export format
 */
export interface HandshakeExport {
  version: string;
  exportedAt: string;
  handshakes: SavedHandshake[];
}

/**
 * Export handshakes to JSON
 */
export function exportHandshakes(handshakes: SavedHandshake[]): string {
  const exportData: HandshakeExport = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    handshakes: handshakes.map(h => ({
      ...h,
      // Convert dates to ISO strings for JSON
      createdAt: h.createdAt instanceof Date ? h.createdAt : new Date(h.createdAt),
      updatedAt: h.updatedAt instanceof Date ? h.updatedAt : new Date(h.updatedAt),
      lastUsedAt: h.lastUsedAt instanceof Date ? h.lastUsedAt : h.lastUsedAt ? new Date(h.lastUsedAt) : undefined,
      versions: h.versions.map(v => ({
        ...v,
        createdAt: v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt),
      })),
    })),
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import handshakes from JSON
 */
export function importHandshakes(json: string): SavedHandshake[] {
  const data = JSON.parse(json) as HandshakeExport;
  
  // Validate version
  if (!data.version || !data.handshakes) {
    throw new Error('Invalid export format');
  }
  
  // Convert dates back from strings
  return data.handshakes.map(h => ({
    ...h,
    createdAt: new Date(h.createdAt),
    updatedAt: new Date(h.updatedAt),
    lastUsedAt: h.lastUsedAt ? new Date(h.lastUsedAt) : undefined,
    versions: h.versions.map(v => ({
      ...v,
      createdAt: new Date(v.createdAt),
    })),
  }));
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Deep clone an object
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default {
  parseVersionNumber,
  formatVersionNumber,
  incrementMinorVersion,
  incrementMajorVersion,
  compareVersions,
  getLatestVersion,
  getVersionById,
  getVersionByNumber,
  generateVersionId,
  createNewVersion,
  addVersion,
  restoreVersion,
  calculateChanges,
  generateChangeSummary,
  diffVersions,
  getVersionHistoryWithDiffs,
  createSavedHandshake,
  duplicateSavedHandshake,
  exportHandshakes,
  importHandshakes,
};
