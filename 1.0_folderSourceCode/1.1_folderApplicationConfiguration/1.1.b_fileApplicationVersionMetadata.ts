// ============================================
// PROTOCOL OS - APPLICATION VERSION METADATA
// ============================================
// Address: 1.1.b
// Purpose: Version information, build metadata, and compatibility tracking
// ============================================

/**
 * Semantic version components
 */
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

/**
 * Build metadata
 */
export interface BuildMetadata {
  /** Build timestamp (ISO 8601) */
  timestamp: string;
  
  /** Git commit hash */
  commitHash: string;
  
  /** Git branch name */
  branch: string;
  
  /** CI/CD build number */
  buildNumber: string;
  
  /** Build environment */
  environment: 'local' | 'ci' | 'production';
}

/**
 * Compatibility information
 */
export interface CompatibilityInfo {
  /** Minimum supported browser versions */
  browsers: {
    chrome: number;
    firefox: number;
    safari: number;
    edge: number;
  };
  
  /** Minimum Node.js version (for server components) */
  node: string;
  
  /** Database schema version */
  schemaVersion: number;
  
  /** API version */
  apiVersion: string;
  
  /** Breaking changes from previous versions */
  breakingChanges: string[];
}

/**
 * Complete application version metadata
 */
export interface ApplicationVersionMetadata {
  /** Application name */
  name: string;
  
  /** Display name */
  displayName: string;
  
  /** Version string (semver) */
  version: string;
  
  /** Parsed semantic version */
  semver: SemanticVersion;
  
  /** Build metadata */
  build: BuildMetadata;
  
  /** Compatibility information */
  compatibility: CompatibilityInfo;
  
  /** Application description */
  description: string;
  
  /** Homepage URL */
  homepage: string;
  
  /** Repository URL */
  repository: string;
  
  /** License */
  license: string;
  
  /** Author/Organization */
  author: string;
}

// ============================================
// VERSION CONSTANTS
// ============================================

/**
 * Current application version
 * 
 * Update this when releasing new versions.
 * Follows Semantic Versioning (https://semver.org/)
 */
const VERSION = '0.1.0';

/**
 * Parse semantic version string
 */
function parseSemanticVersion(version: string): SemanticVersion {
  const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
  const match = version.match(regex);
  
  if (!match) {
    return { major: 0, minor: 0, patch: 0 };
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5],
  };
}

/**
 * Get build metadata from environment
 */
function getBuildMetadata(): BuildMetadata {
  return {
    timestamp: import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString(),
    commitHash: import.meta.env.VITE_COMMIT_HASH || 'development',
    branch: import.meta.env.VITE_GIT_BRANCH || 'main',
    buildNumber: import.meta.env.VITE_BUILD_NUMBER || 'local',
    environment: import.meta.env.CI ? 'ci' : 
                 import.meta.env.PROD ? 'production' : 'local',
  };
}

/**
 * Application version metadata singleton
 */
export const APPLICATION_VERSION_METADATA: ApplicationVersionMetadata = {
  name: 'protocol-os',
  displayName: 'Protocol OS',
  version: VERSION,
  semver: parseSemanticVersion(VERSION),
  build: getBuildMetadata(),
  
  compatibility: {
    browsers: {
      chrome: 90,
      firefox: 88,
      safari: 14,
      edge: 90,
    },
    node: '18.0.0',
    schemaVersion: 1,
    apiVersion: 'v1',
    breakingChanges: [],
  },
  
  description: 'Universal API Handshake System - Configure once, connect anywhere',
  homepage: 'https://github.com/intent-tensor-theory/0.0_git_universal_protocol_os_handshake',
  repository: 'https://github.com/intent-tensor-theory/0.0_git_universal_protocol_os_handshake',
  license: 'MIT',
  author: 'Intent Tensor Theory Institute',
};

// ============================================
// VERSION UTILITIES
// ============================================

/**
 * Get the current version string
 */
export function getVersion(): string {
  return APPLICATION_VERSION_METADATA.version;
}

/**
 * Get the full version with build info
 */
export function getFullVersion(): string {
  const { version, build } = APPLICATION_VERSION_METADATA;
  return `${version}+${build.commitHash.substring(0, 7)}`;
}

/**
 * Get version display string
 */
export function getVersionDisplay(): string {
  const { displayName, version, build } = APPLICATION_VERSION_METADATA;
  const env = build.environment === 'production' ? '' : ` (${build.environment})`;
  return `${displayName} v${version}${env}`;
}

/**
 * Compare two semantic versions
 * 
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const versionA = parseSemanticVersion(a);
  const versionB = parseSemanticVersion(b);
  
  // Compare major
  if (versionA.major !== versionB.major) {
    return versionA.major < versionB.major ? -1 : 1;
  }
  
  // Compare minor
  if (versionA.minor !== versionB.minor) {
    return versionA.minor < versionB.minor ? -1 : 1;
  }
  
  // Compare patch
  if (versionA.patch !== versionB.patch) {
    return versionA.patch < versionB.patch ? -1 : 1;
  }
  
  // Handle prerelease (no prerelease > prerelease)
  if (!versionA.prerelease && versionB.prerelease) return 1;
  if (versionA.prerelease && !versionB.prerelease) return -1;
  if (versionA.prerelease && versionB.prerelease) {
    return versionA.prerelease < versionB.prerelease ? -1 :
           versionA.prerelease > versionB.prerelease ? 1 : 0;
  }
  
  return 0;
}

/**
 * Check if current version satisfies a version requirement
 * 
 * @param requirement - Semver requirement (e.g., ">=1.0.0", "^2.0.0", "~1.2.0")
 */
export function satisfiesVersion(requirement: string): boolean {
  const current = APPLICATION_VERSION_METADATA.version;
  
  // Handle exact version
  if (!requirement.match(/^[<>=~^]/)) {
    return compareVersions(current, requirement) === 0;
  }
  
  // Handle >= requirement
  if (requirement.startsWith('>=')) {
    const target = requirement.slice(2);
    return compareVersions(current, target) >= 0;
  }
  
  // Handle > requirement
  if (requirement.startsWith('>') && !requirement.startsWith('>=')) {
    const target = requirement.slice(1);
    return compareVersions(current, target) > 0;
  }
  
  // Handle <= requirement
  if (requirement.startsWith('<=')) {
    const target = requirement.slice(2);
    return compareVersions(current, target) <= 0;
  }
  
  // Handle < requirement
  if (requirement.startsWith('<') && !requirement.startsWith('<=')) {
    const target = requirement.slice(1);
    return compareVersions(current, target) < 0;
  }
  
  // Handle ^ (compatible with version)
  if (requirement.startsWith('^')) {
    const target = parseSemanticVersion(requirement.slice(1));
    const curr = APPLICATION_VERSION_METADATA.semver;
    
    // Major must match, minor/patch must be >=
    if (curr.major !== target.major) return false;
    if (curr.minor < target.minor) return false;
    if (curr.minor === target.minor && curr.patch < target.patch) return false;
    return true;
  }
  
  // Handle ~ (approximately equivalent)
  if (requirement.startsWith('~')) {
    const target = parseSemanticVersion(requirement.slice(1));
    const curr = APPLICATION_VERSION_METADATA.semver;
    
    // Major and minor must match, patch must be >=
    if (curr.major !== target.major) return false;
    if (curr.minor !== target.minor) return false;
    if (curr.patch < target.patch) return false;
    return true;
  }
  
  return false;
}

/**
 * Check browser compatibility
 */
export function checkBrowserCompatibility(): {
  compatible: boolean;
  browser: string;
  version: number;
  required: number;
} {
  const { browsers } = APPLICATION_VERSION_METADATA.compatibility;
  
  // Detect browser and version
  const ua = navigator.userAgent;
  let browser = 'unknown';
  let version = 0;
  let required = 0;
  
  if (ua.includes('Chrome')) {
    browser = 'chrome';
    version = parseInt(ua.match(/Chrome\/(\d+)/)?.[1] || '0', 10);
    required = browsers.chrome;
  } else if (ua.includes('Firefox')) {
    browser = 'firefox';
    version = parseInt(ua.match(/Firefox\/(\d+)/)?.[1] || '0', 10);
    required = browsers.firefox;
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'safari';
    version = parseInt(ua.match(/Version\/(\d+)/)?.[1] || '0', 10);
    required = browsers.safari;
  } else if (ua.includes('Edg')) {
    browser = 'edge';
    version = parseInt(ua.match(/Edg\/(\d+)/)?.[1] || '0', 10);
    required = browsers.edge;
  }
  
  return {
    compatible: version >= required,
    browser,
    version,
    required,
  };
}

/**
 * Check if database schema needs migration
 */
export function needsSchemaMigration(currentSchemaVersion: number): boolean {
  return currentSchemaVersion < APPLICATION_VERSION_METADATA.compatibility.schemaVersion;
}

/**
 * Get migration path between schema versions
 */
export function getSchemaMigrationPath(fromVersion: number, toVersion: number): number[] {
  const path: number[] = [];
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    path.push(v);
  }
  return path;
}

/**
 * Generate version info for API responses
 */
export function getApiVersionInfo(): Record<string, string> {
  const { version, build, compatibility } = APPLICATION_VERSION_METADATA;
  
  return {
    'X-Protocol-OS-Version': version,
    'X-API-Version': compatibility.apiVersion,
    'X-Build-Timestamp': build.timestamp,
    'X-Commit-Hash': build.commitHash,
  };
}

/**
 * Log version info to console
 */
export function logVersionInfo(): void {
  const { displayName, version, build, compatibility } = APPLICATION_VERSION_METADATA;
  
  console.log(
    `%c${displayName} v${version}%c\n` +
    `Build: ${build.buildNumber} (${build.commitHash.substring(0, 7)})\n` +
    `Branch: ${build.branch}\n` +
    `API: ${compatibility.apiVersion}\n` +
    `Schema: v${compatibility.schemaVersion}`,
    'font-size: 16px; font-weight: bold; color: #2dd4bf;',
    'font-size: 12px; color: #94a3b8;'
  );
}
