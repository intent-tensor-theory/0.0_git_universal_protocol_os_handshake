// ============================================
// PROTOCOL OS - GITHUB REPO RUNNER UTILITIES
// ============================================
// Address: 1.4.10.b
// Purpose: Utility functions for GitHub operations
// ============================================

/**
 * GitHub API base URL
 */
export const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Build GitHub API URL
 */
export function buildGitHubApiUrl(
  owner: string,
  repo: string,
  path: string = ''
): string {
  return `${GITHUB_API_BASE}/repos/${owner}/${repo}${path ? `/${path}` : ''}`;
}

/**
 * Build GitHub raw content URL
 */
export function buildRawContentUrl(
  owner: string,
  repo: string,
  branch: string,
  path: string
): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

/**
 * Standard GitHub API headers
 */
export function buildGitHubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Protocol-OS',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  return headers;
}

/**
 * Parse GitHub repository URL
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^/]+)\/([^/]+)/,
    /github\.com:([^/]+)\/([^.]+)/,
    /^([^/]+)\/([^/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
  }

  return null;
}

/**
 * Decode base64 file content from GitHub API
 */
export function decodeGitHubContent(content: string): string {
  return atob(content.replace(/\n/g, ''));
}

/**
 * Common GitHub API endpoints
 */
export const GITHUB_ENDPOINTS = {
  repo: (owner: string, repo: string) => `/repos/${owner}/${repo}`,
  contents: (owner: string, repo: string, path: string) => `/repos/${owner}/${repo}/contents/${path}`,
  branches: (owner: string, repo: string) => `/repos/${owner}/${repo}/branches`,
  commits: (owner: string, repo: string) => `/repos/${owner}/${repo}/commits`,
  releases: (owner: string, repo: string) => `/repos/${owner}/${repo}/releases`,
  workflows: (owner: string, repo: string) => `/repos/${owner}/${repo}/actions/workflows`,
  dispatchWorkflow: (owner: string, repo: string, workflowId: string) => 
    `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
} as const;

/**
 * GitHub rate limit info
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Parse rate limit from response headers
 */
export function parseRateLimit(headers: Headers): RateLimitInfo {
  return {
    limit: parseInt(headers.get('x-ratelimit-limit') || '60', 10),
    remaining: parseInt(headers.get('x-ratelimit-remaining') || '60', 10),
    reset: new Date(parseInt(headers.get('x-ratelimit-reset') || '0', 10) * 1000),
  };
}
