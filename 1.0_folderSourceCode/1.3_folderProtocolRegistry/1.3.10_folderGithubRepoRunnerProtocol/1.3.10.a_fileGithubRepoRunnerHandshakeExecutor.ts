// ============================================
// PROTOCOL OS - GITHUB REPO RUNNER HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.10.a
// Purpose: GitHub Repository and Runner Authentication
// ============================================

import {
  BaseProtocolModule,
  type ProtocolModuleMetadata,
  type ProtocolCapabilities,
  type ProtocolFieldDefinition,
  type ProtocolAuthenticationFlow,
  type ProtocolExecutionContext,
  type ProtocolExecutionResult,
  type ProtocolTokenRefreshResult,
  type ProtocolHealthCheckResult,
} from '../1.3.b_fileProtocolHandshakeModuleInterface';
import type { AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';

/**
 * GitHub Repo Runner Protocol
 * 
 * Provides authentication and API access for:
 * - GitHub REST API v3
 * - GitHub GraphQL API v4
 * - GitHub Actions runners
 * - Repository operations
 * - Webhook management
 * 
 * Supports multiple authentication methods:
 * - Personal Access Tokens (PAT)
 * - GitHub Apps (Installation tokens)
 * - OAuth tokens
 * - Fine-grained PATs
 */

/**
 * GitHub authentication method
 */
export type GitHubAuthMethod =
  | 'pat'                // Personal Access Token (classic)
  | 'fine-grained-pat'   // Fine-grained Personal Access Token
  | 'github-app'         // GitHub App installation token
  | 'oauth-token'        // OAuth access token
  | 'runner-token';      // Self-hosted runner registration token

/**
 * GitHub API version
 */
export type GitHubApiVersion = 'rest' | 'graphql';

/**
 * GitHub scope categories
 */
export const GITHUB_SCOPES = {
  repo: {
    'repo': 'Full control of private repositories',
    'repo:status': 'Access commit status',
    'repo_deployment': 'Access deployment status',
    'public_repo': 'Access public repositories',
    'repo:invite': 'Access repository invitations',
    'security_events': 'Read and write security events',
  },
  workflow: {
    'workflow': 'Update GitHub Action workflows',
  },
  packages: {
    'write:packages': 'Upload packages to GitHub Package Registry',
    'read:packages': 'Download packages from GitHub Package Registry',
    'delete:packages': 'Delete packages from GitHub Package Registry',
  },
  admin: {
    'admin:org': 'Full control of orgs and teams',
    'write:org': 'Read and write org and team membership',
    'read:org': 'Read org and team membership',
    'admin:public_key': 'Full control of user public keys',
    'write:public_key': 'Write user public keys',
    'read:public_key': 'Read user public keys',
    'admin:repo_hook': 'Full control of repository hooks',
    'write:repo_hook': 'Write repository hooks',
    'read:repo_hook': 'Read repository hooks',
    'admin:org_hook': 'Full control of organization hooks',
  },
  user: {
    'user': 'Update all user data',
    'read:user': 'Read all user profile data',
    'user:email': 'Access user email addresses (read-only)',
    'user:follow': 'Follow and unfollow users',
  },
  other: {
    'gist': 'Create gists',
    'notifications': 'Access notifications',
    'delete_repo': 'Delete repositories',
    'write:discussion': 'Read and write team discussions',
    'read:discussion': 'Read team discussions',
    'codespace': 'Full control of codespaces',
    'copilot': 'Full control of GitHub Copilot settings',
    'project': 'Full control of projects',
  },
} as const;

/**
 * GitHub repository information
 */
export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  owner: {
    login: string;
    type: 'User' | 'Organization';
  };
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
}

/**
 * GitHub runner information
 */
export interface GitHubRunner {
  id: number;
  name: string;
  os: string;
  status: 'online' | 'offline';
  busy: boolean;
  labels: Array<{ id: number; name: string; type: string }>;
}

/**
 * GitHub configuration
 */
export interface GitHubConfiguration {
  /** Authentication method */
  authMethod: GitHubAuthMethod;
  
  /** Personal Access Token or OAuth token */
  token?: string;
  
  /** GitHub App ID */
  appId?: string;
  
  /** GitHub App private key (PEM) */
  privateKey?: string;
  
  /** GitHub App installation ID */
  installationId?: string;
  
  /** Target repository (owner/repo) */
  repository?: string;
  
  /** Target organization */
  organization?: string;
  
  /** GitHub Enterprise Server URL */
  enterpriseUrl?: string;
  
  /** API version to use */
  apiVersion?: GitHubApiVersion;
  
  /** Request timeout (ms) */
  timeout?: number;
}

/**
 * GitHub Repo Runner Protocol Module
 */
export class GitHubRepoRunnerHandshakeExecutor extends BaseProtocolModule {
  private baseUrl = 'https://api.github.com';
  private cachedUser: { login: string; name: string } | null = null;
  private installationToken: string | null = null;
  private installationTokenExpiry: Date | null = null;

  constructor() {
    super();
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'github',
      displayName: 'GitHub Repo Runner',
      description: 'GitHub API authentication for repositories, actions, and runners.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/github',
      icon: 'github',
      capabilities: this.getCapabilities(),
      useCases: [
        'Repository management',
        'CI/CD automation',
        'GitHub Actions workflows',
        'Self-hosted runner setup',
        'Webhook management',
        'Code scanning and security',
        'Package registry access',
        'Issue and PR automation',
      ],
      examplePlatforms: [
        'GitHub.com',
        'GitHub Enterprise Server',
        'GitHub Actions',
        'GitHub Packages',
        'GitHub Codespaces',
      ],
    };
  }

  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRedirectFlow: false, // OAuth flow handled separately
      supportsTokenRefresh: true,  // GitHub App tokens can be refreshed
      supportsTokenRevocation: true,
      supportsScopes: true,
      supportsIncrementalAuth: false,
      supportsOfflineAccess: true,
      supportsPkce: false,
      requiresServerSide: false,
      browserCompatible: true,
      supportsRequestSigning: false,
      supportsAutoInjection: true,
    };
  }

  // ============================================
  // FIELD DEFINITIONS
  // ============================================

  getRequiredFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'authMethod',
        label: 'Authentication Method',
        type: 'select',
        required: true,
        description: 'How to authenticate with GitHub.',
        defaultValue: 'pat',
        options: [
          { value: 'pat', label: 'Personal Access Token (Classic)' },
          { value: 'fine-grained-pat', label: 'Fine-Grained PAT' },
          { value: 'github-app', label: 'GitHub App' },
          { value: 'oauth-token', label: 'OAuth Token' },
          { value: 'runner-token', label: 'Runner Registration Token' },
        ],
        group: 'authentication',
        order: 1,
      },
    ];
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'token',
        label: 'Access Token',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'Personal Access Token or OAuth token.',
        placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
        group: 'authentication',
        order: 2,
        visibleWhen: { field: 'authMethod', value: ['pat', 'fine-grained-pat', 'oauth-token'] },
      },
      {
        id: 'appId',
        label: 'GitHub App ID',
        type: 'text',
        required: false,
        description: 'The App ID from your GitHub App settings.',
        placeholder: '123456',
        group: 'authentication',
        order: 3,
        visibleWhen: { field: 'authMethod', value: 'github-app' },
      },
      {
        id: 'privateKey',
        label: 'Private Key (PEM)',
        type: 'textarea',
        required: false,
        sensitive: true,
        description: 'The private key generated for your GitHub App.',
        placeholder: '-----BEGIN RSA PRIVATE KEY-----\n...',
        group: 'authentication',
        order: 4,
        visibleWhen: { field: 'authMethod', value: 'github-app' },
      },
      {
        id: 'installationId',
        label: 'Installation ID',
        type: 'text',
        required: false,
        description: 'The installation ID for the target org/repo.',
        placeholder: '12345678',
        group: 'authentication',
        order: 5,
        visibleWhen: { field: 'authMethod', value: 'github-app' },
      },
      {
        id: 'runnerToken',
        label: 'Runner Registration Token',
        type: 'secret',
        required: false,
        sensitive: true,
        description: 'Token for registering self-hosted runners.',
        placeholder: 'AXXXXXXXXXXXXXXXXXX',
        group: 'authentication',
        order: 6,
        visibleWhen: { field: 'authMethod', value: 'runner-token' },
      },
      {
        id: 'repository',
        label: 'Repository',
        type: 'text',
        required: false,
        description: 'Target repository in owner/repo format.',
        placeholder: 'owner/repository',
        group: 'target',
        order: 1,
      },
      {
        id: 'organization',
        label: 'Organization',
        type: 'text',
        required: false,
        description: 'Target organization name.',
        placeholder: 'my-organization',
        group: 'target',
        order: 2,
      },
      {
        id: 'enterpriseUrl',
        label: 'Enterprise Server URL',
        type: 'url',
        required: false,
        description: 'URL for GitHub Enterprise Server (leave empty for github.com).',
        placeholder: 'https://github.mycompany.com',
        group: 'advanced',
        order: 1,
      },
      {
        id: 'apiVersion',
        label: 'Preferred API',
        type: 'select',
        required: false,
        description: 'Which GitHub API to use.',
        defaultValue: 'rest',
        options: [
          { value: 'rest', label: 'REST API v3' },
          { value: 'graphql', label: 'GraphQL API v4' },
        ],
        group: 'advanced',
        order: 2,
      },
      {
        id: 'timeout',
        label: 'Request Timeout (ms)',
        type: 'number',
        required: false,
        description: 'Maximum time to wait for API responses.',
        defaultValue: 30000,
        placeholder: '30000',
        group: 'advanced',
        order: 3,
      },
    ];
  }

  getFieldGroups() {
    return [
      {
        id: 'authentication',
        label: 'Authentication',
        description: 'How to authenticate with GitHub.',
      },
      {
        id: 'target',
        label: 'Target',
        description: 'Repository or organization to access.',
      },
      {
        id: 'advanced',
        label: 'Advanced',
        description: 'Additional configuration options.',
        collapsible: true,
        defaultCollapsed: true,
      },
    ];
  }

  // ============================================
  // AUTHENTICATION FLOW
  // ============================================

  async authenticate(
    credentials: Partial<AuthenticationCredentials>,
    _currentStep?: number
  ): Promise<ProtocolAuthenticationFlow> {
    // Validate required fields
    const validation = this.validateCredentials(credentials);
    if (!validation.valid) {
      return {
        step: 1,
        totalSteps: 1,
        type: 'error',
        title: 'Configuration Error',
        description: 'Please fix the configuration errors.',
        error: Object.values(validation.fieldErrors).join(', '),
      };
    }

    const authMethod = credentials.authMethod as GitHubAuthMethod;

    // Set base URL for Enterprise
    if (credentials.enterpriseUrl) {
      this.baseUrl = `${credentials.enterpriseUrl}/api/v3`;
    } else {
      this.baseUrl = 'https://api.github.com';
    }

    // Validate auth-specific requirements
    if (authMethod === 'pat' || authMethod === 'fine-grained-pat' || authMethod === 'oauth-token') {
      if (!credentials.token) {
        return {
          step: 1,
          totalSteps: 1,
          type: 'error',
          title: 'Missing Token',
          description: 'Access token is required.',
          error: 'Please provide a valid GitHub token.',
        };
      }

      // Verify token by getting user info
      const userResult = await this.getAuthenticatedUser(credentials.token as string);
      if (!userResult.success) {
        return {
          step: 1,
          totalSteps: 1,
          type: 'error',
          title: 'Authentication Failed',
          description: 'Could not authenticate with GitHub.',
          error: userResult.error,
        };
      }

      this.cachedUser = userResult.user!;
      this.status = 'authenticated';

      return {
        step: 1,
        totalSteps: 1,
        type: 'complete',
        title: 'GitHub Authenticated',
        description: `Authenticated as ${userResult.user!.login}`,
        data: {
          user: userResult.user,
          authMethod,
        },
      };
    }

    if (authMethod === 'github-app') {
      if (!credentials.appId || !credentials.privateKey || !credentials.installationId) {
        return {
          step: 1,
          totalSteps: 1,
          type: 'error',
          title: 'Missing Configuration',
          description: 'GitHub App requires App ID, private key, and installation ID.',
          error: 'Please provide all GitHub App credentials.',
        };
      }

      // Generate installation token
      const tokenResult = await this.getInstallationToken(credentials as AuthenticationCredentials);
      if (!tokenResult.success) {
        return {
          step: 1,
          totalSteps: 1,
          type: 'error',
          title: 'Token Generation Failed',
          description: 'Could not generate installation token.',
          error: tokenResult.error,
        };
      }

      this.installationToken = tokenResult.token!;
      this.installationTokenExpiry = tokenResult.expiresAt!;
      this.status = 'authenticated';

      return {
        step: 1,
        totalSteps: 1,
        type: 'complete',
        title: 'GitHub App Authenticated',
        description: `Installation token generated (expires ${tokenResult.expiresAt!.toISOString()})`,
        data: {
          authMethod,
          expiresAt: tokenResult.expiresAt,
        },
      };
    }

    if (authMethod === 'runner-token') {
      // Runner tokens are used directly, no verification needed
      this.status = 'authenticated';

      return {
        step: 1,
        totalSteps: 1,
        type: 'complete',
        title: 'Runner Token Configured',
        description: 'Runner registration token is ready to use.',
        data: {
          authMethod,
        },
      };
    }

    return {
      step: 1,
      totalSteps: 1,
      type: 'error',
      title: 'Unknown Auth Method',
      description: 'The selected authentication method is not supported.',
      error: `Unknown auth method: ${authMethod}`,
    };
  }

  /**
   * Get authenticated user info
   */
  private async getAuthenticatedUser(token: string): Promise<{
    success: boolean;
    user?: { login: string; name: string };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.message || `HTTP ${response.status}`,
        };
      }

      const user = await response.json();
      return {
        success: true,
        user: {
          login: user.login,
          name: user.name || user.login,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Generate GitHub App installation token
   */
  private async getInstallationToken(credentials: AuthenticationCredentials): Promise<{
    success: boolean;
    token?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      // First, generate a JWT for the App
      const jwt = await this.generateAppJwt(
        credentials.appId as string,
        credentials.privateKey as string
      );

      // Then, get an installation token
      const response = await fetch(
        `${this.baseUrl}/app/installations/${credentials.installationId}/access_tokens`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: error.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        token: data.token,
        expiresAt: new Date(data.expires_at),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token generation failed',
      };
    }
  }

  /**
   * Generate JWT for GitHub App
   * Note: In production, use a proper JWT library
   */
  private async generateAppJwt(appId: string, privateKey: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // Issued 60 seconds ago
      exp: now + 600, // Expires in 10 minutes
      iss: appId,
    };

    // Simplified JWT generation - in production use jsonwebtoken or similar
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    
    // Note: Actual RS256 signing requires crypto library
    // This is a placeholder - real implementation needs proper signing
    const signature = 'placeholder_signature';
    
    return `${header}.${body}.${signature}`;
  }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  async refreshTokens(credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    const authMethod = credentials.authMethod as GitHubAuthMethod;

    if (authMethod === 'github-app') {
      const result = await this.getInstallationToken(credentials);
      if (result.success) {
        this.installationToken = result.token!;
        this.installationTokenExpiry = result.expiresAt!;
        return {
          success: true,
          accessToken: result.token,
          expiresIn: Math.floor((result.expiresAt!.getTime() - Date.now()) / 1000),
        };
      }
      return {
        success: false,
        error: result.error,
      };
    }

    // PAT and OAuth tokens don't refresh
    return {
      success: true,
      accessToken: credentials.token as string,
    };
  }

  async revokeTokens(credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }> {
    // GitHub doesn't have a standard token revocation API
    // Tokens must be revoked through the GitHub UI or settings
    this.status = 'unauthenticated';
    this.cachedUser = null;
    this.installationToken = null;
    this.installationTokenExpiry = null;
    
    return {
      success: true,
    };
  }

  isTokenExpired(credentials: AuthenticationCredentials): boolean {
    const authMethod = credentials.authMethod as GitHubAuthMethod;
    
    if (authMethod === 'github-app' && this.installationTokenExpiry) {
      return this.installationTokenExpiry.getTime() < Date.now();
    }
    
    return false;
  }

  getTokenExpirationTime(credentials: AuthenticationCredentials): Date | null {
    const authMethod = credentials.authMethod as GitHubAuthMethod;
    
    if (authMethod === 'github-app') {
      return this.installationTokenExpiry;
    }
    
    return null;
  }

  // ============================================
  // REQUEST EXECUTION
  // ============================================

  async injectAuthentication(
    context: ProtocolExecutionContext
  ): Promise<{
    headers: Record<string, string>;
    queryParams: Record<string, string>;
    body?: string | Record<string, unknown>;
  }> {
    const credentials = context.credentials as AuthenticationCredentials;
    const authMethod = credentials.authMethod as GitHubAuthMethod;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    let token: string | undefined;

    if (authMethod === 'github-app') {
      // Check if token needs refresh
      if (this.isTokenExpired(credentials)) {
        await this.refreshTokens(credentials);
      }
      token = this.installationToken || undefined;
    } else if (authMethod === 'runner-token') {
      token = credentials.runnerToken as string;
    } else {
      token = credentials.token as string;
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return { headers, queryParams: {} };
  }

  async executeRequest(context: ProtocolExecutionContext): Promise<ProtocolExecutionResult> {
    const startTime = performance.now();
    const credentials = context.credentials as AuthenticationCredentials;
    const timeout = (credentials.timeout as number) || 30000;

    // Set base URL
    if (credentials.enterpriseUrl) {
      this.baseUrl = `${credentials.enterpriseUrl}/api/v3`;
    }

    // Build full URL
    let url = context.url;
    if (!url.startsWith('http')) {
      url = `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    // Inject authentication
    const { headers } = await this.injectAuthentication(context);

    try {
      const response = await fetch(url, {
        method: context.method || 'GET',
        headers: {
          ...headers,
          ...context.headers,
        },
        body: context.body ? JSON.stringify(context.body) : undefined,
        signal: AbortSignal.timeout(timeout),
      });

      const responseText = await response.text();
      const durationMs = performance.now() - startTime;

      let body: unknown;
      try {
        body = JSON.parse(responseText);
      } catch {
        body = responseText;
      }

      // Check for rate limiting
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');

      return {
        success: response.ok,
        statusCode: response.status,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'x-ratelimit-remaining': rateLimitRemaining || '',
          'x-ratelimit-reset': rateLimitReset || '',
        },
        body,
        rawBody: responseText,
        durationMs,
        credentialsRefreshed: false,
        error: response.ok ? undefined : (body as { message?: string })?.message || `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: 0,
        headers: {},
        body: null,
        rawBody: '',
        durationMs: performance.now() - startTime,
        credentialsRefreshed: false,
        error: error instanceof Error ? error.message : 'Request failed',
        errorCode: 'NETWORK_ERROR',
      };
    }
  }

  // ============================================
  // GITHUB-SPECIFIC OPERATIONS
  // ============================================

  /**
   * Get repository information
   */
  async getRepository(
    credentials: AuthenticationCredentials,
    owner: string,
    repo: string
  ): Promise<{ success: boolean; repository?: GitHubRepository; error?: string }> {
    const result = await this.executeRequest({
      credentials,
      url: `/repos/${owner}/${repo}`,
      method: 'GET',
      headers: {},
    });

    if (result.success) {
      const data = result.body as any;
      return {
        success: true,
        repository: {
          id: data.id,
          name: data.name,
          fullName: data.full_name,
          private: data.private,
          owner: {
            login: data.owner.login,
            type: data.owner.type,
          },
          htmlUrl: data.html_url,
          cloneUrl: data.clone_url,
          sshUrl: data.ssh_url,
          defaultBranch: data.default_branch,
        },
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * List organization runners
   */
  async listOrgRunners(
    credentials: AuthenticationCredentials,
    org: string
  ): Promise<{ success: boolean; runners?: GitHubRunner[]; error?: string }> {
    const result = await this.executeRequest({
      credentials,
      url: `/orgs/${org}/actions/runners`,
      method: 'GET',
      headers: {},
    });

    if (result.success) {
      const data = result.body as any;
      return {
        success: true,
        runners: data.runners.map((r: any) => ({
          id: r.id,
          name: r.name,
          os: r.os,
          status: r.status,
          busy: r.busy,
          labels: r.labels,
        })),
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Get runner registration token
   */
  async getRunnerRegistrationToken(
    credentials: AuthenticationCredentials,
    owner: string,
    repo?: string
  ): Promise<{ success: boolean; token?: string; expiresAt?: Date; error?: string }> {
    const url = repo
      ? `/repos/${owner}/${repo}/actions/runners/registration-token`
      : `/orgs/${owner}/actions/runners/registration-token`;

    const result = await this.executeRequest({
      credentials,
      url,
      method: 'POST',
      headers: {},
    });

    if (result.success) {
      const data = result.body as any;
      return {
        success: true,
        token: data.token,
        expiresAt: new Date(data.expires_at),
      };
    }

    return { success: false, error: result.error };
  }

  /**
   * Trigger workflow dispatch
   */
  async triggerWorkflow(
    credentials: AuthenticationCredentials,
    owner: string,
    repo: string,
    workflowId: string | number,
    ref: string,
    inputs?: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.executeRequest({
      credentials,
      url: `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      method: 'POST',
      headers: {},
      body: {
        ref,
        inputs: inputs || {},
      },
    });

    return {
      success: result.success,
      error: result.error,
    };
  }

  /**
   * Execute GraphQL query
   */
  async graphql<T = unknown>(
    credentials: AuthenticationCredentials,
    query: string,
    variables?: Record<string, unknown>
  ): Promise<{ success: boolean; data?: T; errors?: Array<{ message: string }>; error?: string }> {
    const enterpriseUrl = credentials.enterpriseUrl as string;
    const graphqlUrl = enterpriseUrl
      ? `${enterpriseUrl}/api/graphql`
      : 'https://api.github.com/graphql';

    const result = await this.executeRequest({
      credentials,
      url: graphqlUrl,
      method: 'POST',
      headers: {},
      body: {
        query,
        variables,
      },
    });

    if (result.success) {
      const data = result.body as { data?: T; errors?: Array<{ message: string }> };
      return {
        success: !data.errors,
        data: data.data,
        errors: data.errors,
      };
    }

    return { success: false, error: result.error };
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(credentials: AuthenticationCredentials): Promise<ProtocolHealthCheckResult> {
    const startTime = performance.now();
    const authMethod = credentials.authMethod as GitHubAuthMethod;

    // Check rate limit status (doesn't consume rate limit)
    const result = await this.executeRequest({
      credentials,
      url: '/rate_limit',
      method: 'GET',
      headers: {},
    });

    const latencyMs = performance.now() - startTime;

    if (result.success) {
      const data = result.body as any;
      const coreLimit = data.resources?.core;
      
      return {
        healthy: true,
        message: `GitHub API healthy. Rate limit: ${coreLimit?.remaining}/${coreLimit?.limit}`,
        latencyMs,
        tokenStatus: this.isTokenExpired(credentials) ? 'expired' : 'valid',
        tokenExpiresIn: authMethod === 'github-app' && this.installationTokenExpiry
          ? Math.floor((this.installationTokenExpiry.getTime() - Date.now()) / 1000)
          : -1,
        canRefresh: authMethod === 'github-app',
        details: {
          rateLimit: coreLimit,
          user: this.cachedUser,
        },
      };
    }

    return {
      healthy: false,
      message: result.error || 'Health check failed',
      latencyMs,
      tokenStatus: 'invalid',
      tokenExpiresIn: 0,
      canRefresh: authMethod === 'github-app',
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Parse repository string (owner/repo)
   */
  static parseRepository(repo: string): { owner: string; repo: string } | null {
    const parts = repo.split('/');
    if (parts.length !== 2) return null;
    return { owner: parts[0], repo: parts[1] };
  }

  /**
   * Get token prefix type
   */
  static getTokenType(token: string): 'classic-pat' | 'fine-grained-pat' | 'oauth' | 'installation' | 'unknown' {
    if (token.startsWith('ghp_')) return 'classic-pat';
    if (token.startsWith('github_pat_')) return 'fine-grained-pat';
    if (token.startsWith('gho_')) return 'oauth';
    if (token.startsWith('ghs_')) return 'installation';
    return 'unknown';
  }

  /**
   * Mask token for display
   */
  static maskToken(token: string): string {
    if (token.length <= 8) return '****';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
  }
}

// Export default instance
export default GitHubRepoRunnerHandshakeExecutor;
