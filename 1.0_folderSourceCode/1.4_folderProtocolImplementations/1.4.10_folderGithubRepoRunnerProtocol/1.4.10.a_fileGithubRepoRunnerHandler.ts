// ============================================
// PROTOCOL OS - GITHUB REPO RUNNER HANDLER
// ============================================
// Address: 1.4.10.a
// Purpose: Clone and execute scripts from GitHub repositories
// ============================================

import {
  BaseProtocolHandler,
  type AuthenticationValidationResult,
  type HandshakeExecutionOptions,
} from '@registry/1.3.a_fileProtocolHandlerInterface';
import type { AuthenticationConfig, AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';

/**
 * GitHub Repo Runner Handler
 * 
 * Access GitHub repositories, fetch files, and trigger workflows.
 */
export class GithubRepoRunnerHandler extends BaseProtocolHandler {
  readonly protocolType = 'github-repo-runner' as const;
  readonly displayName = 'GitHub Repo Runner';
  readonly description = 'Clone and execute scripts from GitHub repositories';
  readonly supportsTokenRefresh = false;
  readonly requiresUserInteraction = false;
  readonly iconId = 'github';

  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult {
    const missingFields: string[] = [];
    const ghConfig = config.githubRepoRunner;

    if (!ghConfig) {
      return { isValid: false, missingFields: ['githubRepoRunner configuration'], invalidFields: [], warnings: [] };
    }

    if (!ghConfig.owner) missingFields.push('owner');
    if (!ghConfig.repo) missingFields.push('repo');

    const warnings: string[] = [];
    if (!ghConfig.token) {
      warnings.push('No token provided - only public repositories will be accessible');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      invalidFields: [],
      warnings,
    };
  }

  getRequiredFields(): string[] {
    return ['owner', 'repo'];
  }

  getOptionalFields(): string[] {
    return ['token', 'branch', 'path', 'workflowId'];
  }

  async authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    const ghConfig = config.githubRepoRunner;
    
    if (!ghConfig) {
      return { success: false, error: 'GitHub configuration not provided' };
    }

    // Test API access
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Protocol-OS',
      };

      if (ghConfig.token) {
        headers['Authorization'] = `token ${ghConfig.token}`;
      }

      const response = await fetch(
        `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}`,
        { headers }
      );

      if (!response.ok) {
        return { success: false, error: `Repository access failed: ${response.status}` };
      }

      return {
        success: true,
        credentials: {
          type: 'github',
          token: ghConfig.token,
          owner: ghConfig.owner,
          repo: ghConfig.repo,
          obtainedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Authentication failed' };
    }
  }

  async executeRequest(
    curlRequest: CurlRequest,
    config: AuthenticationConfig,
    credentials: AuthenticationCredentials,
    options?: HandshakeExecutionOptions
  ): Promise<HandshakeExecutionResult> {
    const startTime = Date.now();
    const logs: ExecutionLogEntry[] = [];

    const log = (level: ExecutionLogEntry['level'], message: string) => {
      logs.push({ timestamp: new Date().toISOString(), level, message });
      options?.onLog?.({ timestamp: new Date().toISOString(), level, message });
    };

    log('INFO', `GitHub: ${curlRequest.title}`);

    try {
      const ghConfig = config.githubRepoRunner!;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Protocol-OS',
        ...options?.additionalHeaders,
      };

      if (ghConfig.token) {
        headers['Authorization'] = `token ${ghConfig.token}`;
      }

      // Determine operation from curl command
      let apiUrl = '';
      let method = 'GET';
      let body: string | undefined;

      if (curlRequest.command.includes('/contents/')) {
        // Fetch file contents
        const pathMatch = curlRequest.command.match(/\/contents\/([^"'\s]+)/);
        const path = pathMatch?.[1] || ghConfig.path || 'README.md';
        apiUrl = `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/contents/${path}`;
        log('INFO', `Fetching file: ${path}`);
      } else if (curlRequest.command.includes('/actions/workflows/')) {
        // Trigger workflow
        apiUrl = `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/actions/workflows/${ghConfig.workflowId}/dispatches`;
        method = 'POST';
        body = JSON.stringify({ ref: ghConfig.branch || 'main' });
        log('INFO', `Triggering workflow: ${ghConfig.workflowId}`);
      } else {
        // Default: get repo info
        apiUrl = `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}`;
        log('INFO', `Fetching repo info`);
      }

      const response = await fetch(apiUrl, {
        method,
        headers,
        body,
        signal: options?.signal,
      });

      const responseBody = await response.json().catch(() => ({}));

      if (response.ok) {
        log('SUCCESS', `GitHub API call completed: ${response.status}`);
        return this.createSuccessResult(response, responseBody, logs, startTime);
      } else {
        log('ERROR', `GitHub API error: ${response.status}`);
        return {
          ...this.createSuccessResult(response, responseBody, logs, startTime),
          success: false,
          error: `GitHub API error: ${response.status}`,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log('ERROR', message);
      return this.createErrorResult(message, logs, startTime);
    }
  }

  generateSampleCurl(config: AuthenticationConfig): string {
    const ghConfig = config.githubRepoRunner;
    const owner = ghConfig?.owner || 'owner';
    const repo = ghConfig?.repo || 'repo';

    return `# Get repository info
curl -X GET "https://api.github.com/repos/${owner}/${repo}" \\
  -H "Accept: application/vnd.github.v3+json" \\
  -H "Authorization: token {GITHUB_TOKEN}"

# Get file contents
curl -X GET "https://api.github.com/repos/${owner}/${repo}/contents/README.md" \\
  -H "Accept: application/vnd.github.v3+json" \\
  -H "Authorization: token {GITHUB_TOKEN}"`;
  }

  async testConnection(config: AuthenticationConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const startTime = Date.now();
    const result = await this.authenticate(config);
    return {
      success: result.success,
      message: result.success ? 'Repository accessible' : (result.error || 'Connection failed'),
      latencyMs: Date.now() - startTime,
    };
  }
}

export default GithubRepoRunnerHandler;
