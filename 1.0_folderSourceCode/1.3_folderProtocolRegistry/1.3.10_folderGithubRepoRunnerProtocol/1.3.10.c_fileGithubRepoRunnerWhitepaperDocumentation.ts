// ============================================
// PROTOCOL OS - GITHUB REPO RUNNER WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.10.c
// Purpose: Technical specification for GitHub API Protocol
// ============================================

/**
 * Whitepaper: GitHub Repo Runner Protocol
 * 
 * Repository and CI/CD Automation
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 */

export const GITHUB_WHITEPAPER = {
  metadata: {
    title: 'GitHub Repo Runner Protocol',
    subtitle: 'Repository and CI/CD Automation',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    apiVersions: [
      'REST API v3',
      'GraphQL API v4',
      'GitHub Actions API',
    ],
  },

  // ============================================
  // SECTION 1: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
GitHub provides comprehensive APIs for repository management, CI/CD automation,
and developer collaboration. This protocol module supports multiple authentication
methods and API versions.

Key Capabilities:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Repository management (clone, commit, branches)                          │
│  • GitHub Actions (workflows, runners, artifacts)                           │
│  • Issue and PR automation                                                  │
│  • Webhook management                                                       │
│  • Package registry access                                                  │
│  • Code scanning and security                                               │
│  • Organization management                                                  │
│  • GraphQL queries for complex data                                        │
└─────────────────────────────────────────────────────────────────────────────┘

Authentication Methods:
┌────────────────────────┬────────────────────────────────────────────────────┐
│ Method                  │ Best For                                          │
├────────────────────────┼────────────────────────────────────────────────────┤
│ Personal Access Token  │ Personal automation, scripts                       │
│ Fine-Grained PAT       │ Minimal permissions, specific repos                │
│ GitHub App             │ Organization automation, CI/CD                     │
│ OAuth Token            │ User-authorized third-party apps                   │
│ Runner Token           │ Self-hosted runner registration                    │
└────────────────────────┴────────────────────────────────────────────────────┘

API Comparison:
┌────────────────────┬──────────────────────────┬──────────────────────────┐
│ Feature            │ REST API                  │ GraphQL API              │
├────────────────────┼──────────────────────────┼──────────────────────────┤
│ Data Fetching      │ Multiple requests        │ Single query             │
│ Over-fetching      │ Common                   │ Request only needed      │
│ Pagination         │ Link headers             │ Cursor-based             │
│ Mutations          │ POST/PUT/DELETE          │ Mutation operations      │
│ Rate Limits        │ 5000/hour (auth)         │ Point-based system       │
│ Caching            │ ETag/Last-Modified       │ Client-side              │
│ Learning Curve     │ Lower                    │ Higher                   │
│ Complexity         │ Simple operations        │ Complex queries          │
└────────────────────┴──────────────────────────┴──────────────────────────┘
    `.trim(),
  },

  // ============================================
  // SECTION 2: AUTHENTICATION
  // ============================================
  
  authentication: {
    title: '2. Authentication Methods',
    sections: [
      {
        subtitle: '2.1 Personal Access Tokens (Classic)',
        content: `
Classic PATs provide broad access based on OAuth scopes.

Token Format:
  ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  
Creating a PAT:
1. Go to Settings → Developer Settings → Personal Access Tokens
2. Click "Generate new token (classic)"
3. Select required scopes
4. Copy token immediately (shown only once)

HTTP Request:
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET /user HTTP/1.1                                                         │
│  Host: api.github.com                                                       │
│  Authorization: Bearer ghp_xxxxxxxxxxxxxxxxxxxx                             │
│  Accept: application/vnd.github+json                                        │
│  X-GitHub-Api-Version: 2022-11-28                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Common Scopes:
┌────────────────────┬────────────────────────────────────────────────────────┐
│ Scope              │ Access                                                  │
├────────────────────┼────────────────────────────────────────────────────────┤
│ repo               │ Full repository access                                  │
│ workflow           │ Update GitHub Actions workflows                         │
│ admin:org          │ Full organization access                                │
│ write:packages     │ Upload packages to registry                            │
│ read:packages      │ Download packages                                       │
│ admin:repo_hook    │ Full webhook access                                    │
│ delete_repo        │ Delete repositories                                    │
└────────────────────┴────────────────────────────────────────────────────────┘

⚠️ Security: Classic PATs have broad access. Consider fine-grained PATs for
   production use.
        `.trim(),
      },
      {
        subtitle: '2.2 Fine-Grained Personal Access Tokens',
        content: `
Fine-grained PATs offer more precise permission control.

Token Format:
  github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  
Key Features:
• Repository-level permissions
• Expiration dates (required)
• Resource owner selection
• Read/write granularity per permission

Creating a Fine-Grained PAT:
1. Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
2. Set token name and expiration
3. Select resource owner (user or organization)
4. Choose specific repositories or all repositories
5. Select individual permissions

Permission Categories:
┌────────────────────┬────────────────────────────────────────────────────────┐
│ Category           │ Permissions                                            │
├────────────────────┼────────────────────────────────────────────────────────┤
│ Repository         │ Actions, Administration, Code scanning alerts,         │
│                    │ Codespaces, Contents, Discussions, Environments, etc.  │
├────────────────────┼────────────────────────────────────────────────────────┤
│ Account            │ Codespaces user secrets, Email addresses, Followers,   │
│                    │ GPG keys, Git SSH keys, Profile, SSH signing keys     │
├────────────────────┼────────────────────────────────────────────────────────┤
│ Organization       │ Administration, Blocking users, Events, Members,      │
│                    │ Projects, Secrets, Self-hosted runners, Webhooks      │
└────────────────────┴────────────────────────────────────────────────────────┘

✓ Recommended for production automation with minimal permissions.
        `.trim(),
      },
      {
        subtitle: '2.3 GitHub Apps',
        content: `
GitHub Apps provide the most secure and scalable authentication.

Components:
• App ID: Unique identifier for your app
• Private Key: RSA key for signing JWTs
• Installation ID: Per-org/repo installation identifier

Authentication Flow:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1. Generate JWT (signed with private key)                                  │
│     ┌─────────────────────────────────────────────────────────────────┐    │
│     │ {                                                                │    │
│     │   "iat": <now - 60>,                                            │    │
│     │   "exp": <now + 600>,                                           │    │
│     │   "iss": "<app_id>"                                             │    │
│     │ }                                                                │    │
│     └─────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  2. Exchange JWT for Installation Token                                     │
│     POST /app/installations/{installation_id}/access_tokens                │
│     Authorization: Bearer <jwt>                                             │
│                                                                              │
│  3. Use Installation Token for API calls                                    │
│     Authorization: Bearer <installation_token>                              │
│     (Token expires in 1 hour)                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Installation Token Response:
{
  "token": "ghs_xxxxxxxxxxxxxxxxxx",
  "expires_at": "2024-01-15T11:00:00Z",
  "permissions": {
    "contents": "write",
    "metadata": "read",
    "pull_requests": "write"
  },
  "repository_selection": "selected"
}

Benefits:
✓ Fine-grained permissions
✓ Automatic token refresh
✓ Installation-specific access
✓ Rate limits per installation
✓ Audit logging
        `.trim(),
      },
      {
        subtitle: '2.4 Runner Registration Tokens',
        content: `
Special tokens for registering self-hosted runners.

Token Format:
  AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

Getting a Registration Token:

For Repository Runners:
POST /repos/{owner}/{repo}/actions/runners/registration-token

For Organization Runners:
POST /orgs/{org}/actions/runners/registration-token

Response:
{
  "token": "AXXXXXXXXXX...",
  "expires_at": "2024-01-15T12:00:00Z"
}

Token Characteristics:
• Valid for 1 hour
• Single use (consumed during registration)
• Requires admin access to repo/org

Runner Configuration:
┌─────────────────────────────────────────────────────────────────────────────┐
│  $ ./config.sh --url https://github.com/owner/repo \\                       │
│                --token AXXXXXXXXXX...                                       │
│                                                                              │
│  Or for organization:                                                       │
│  $ ./config.sh --url https://github.com/myorg \\                            │
│                --token AXXXXXXXXXX...                                       │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 3: REST API
  // ============================================
  
  restApi: {
    title: '3. REST API v3',
    sections: [
      {
        subtitle: '3.1 Base URL and Headers',
        content: `
Base URLs:
• GitHub.com: https://api.github.com
• Enterprise: https://{hostname}/api/v3

Required Headers:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Accept: application/vnd.github+json                                        │
│  Authorization: Bearer <token>                                              │
│  X-GitHub-Api-Version: 2022-11-28                                          │
│  User-Agent: <your-app-name>  (recommended)                                │
└─────────────────────────────────────────────────────────────────────────────┘

API Versioning:
• Use X-GitHub-Api-Version header
• Current version: 2022-11-28
• Without header: uses latest version (may have breaking changes)
        `.trim(),
      },
      {
        subtitle: '3.2 Common Endpoints',
        content: `
User & Authentication:
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET  /user                        # Authenticated user                     │
│  GET  /users/{username}            # Public user profile                   │
│  GET  /rate_limit                  # Check rate limit status               │
└─────────────────────────────────────────────────────────────────────────────┘

Repositories:
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET  /repos/{owner}/{repo}        # Repository details                    │
│  GET  /repos/{owner}/{repo}/branches  # List branches                      │
│  GET  /repos/{owner}/{repo}/commits   # List commits                       │
│  POST /repos/{owner}/{repo}/forks     # Fork repository                    │
│  GET  /repos/{owner}/{repo}/contents/{path}  # Get file contents           │
└─────────────────────────────────────────────────────────────────────────────┘

GitHub Actions:
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET  /repos/{owner}/{repo}/actions/workflows     # List workflows         │
│  POST /repos/{owner}/{repo}/actions/workflows/{id}/dispatches  # Trigger   │
│  GET  /repos/{owner}/{repo}/actions/runs          # List workflow runs     │
│  GET  /repos/{owner}/{repo}/actions/runners       # List runners           │
│  POST /repos/{owner}/{repo}/actions/runners/registration-token  # Get token│
└─────────────────────────────────────────────────────────────────────────────┘

Issues & Pull Requests:
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET  /repos/{owner}/{repo}/issues        # List issues                    │
│  POST /repos/{owner}/{repo}/issues        # Create issue                   │
│  GET  /repos/{owner}/{repo}/pulls         # List pull requests             │
│  POST /repos/{owner}/{repo}/pulls         # Create pull request            │
│  PUT  /repos/{owner}/{repo}/pulls/{n}/merge  # Merge pull request          │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '3.3 Rate Limits',
        content: `
Rate Limit Tiers:
┌────────────────────────┬──────────────────────────────────────────────────┐
│ Authentication         │ Requests per Hour                                 │
├────────────────────────┼──────────────────────────────────────────────────┤
│ Unauthenticated        │ 60                                               │
│ Personal Access Token  │ 5,000                                            │
│ GitHub App (per-inst)  │ 5,000 + (additional per repository)             │
│ OAuth App              │ 5,000                                            │
│ GITHUB_TOKEN (Actions) │ 1,000                                            │
└────────────────────────┴──────────────────────────────────────────────────┘

Rate Limit Headers:
┌─────────────────────────────────────────────────────────────────────────────┐
│  X-RateLimit-Limit: 5000           # Total limit                           │
│  X-RateLimit-Remaining: 4990       # Remaining requests                    │
│  X-RateLimit-Reset: 1697312400     # Unix timestamp when limit resets      │
│  X-RateLimit-Used: 10              # Requests used this window             │
│  X-RateLimit-Resource: core        # Which rate limit pool                 │
└─────────────────────────────────────────────────────────────────────────────┘

Handling Rate Limits:
• Check X-RateLimit-Remaining before operations
• Implement exponential backoff on 403 responses
• Use conditional requests (If-None-Match) to save quota
• Consider GraphQL for complex queries (single request)
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 4: GRAPHQL API
  // ============================================
  
  graphqlApi: {
    title: '4. GraphQL API v4',
    sections: [
      {
        subtitle: '4.1 Endpoint and Query Structure',
        content: `
Endpoint:
• GitHub.com: https://api.github.com/graphql
• Enterprise: https://{hostname}/api/graphql

Request Format:
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /graphql HTTP/1.1                                                     │
│  Host: api.github.com                                                       │
│  Authorization: Bearer <token>                                              │
│  Content-Type: application/json                                             │
│                                                                              │
│  {                                                                          │
│    "query": "query { viewer { login name } }",                             │
│    "variables": {}                                                          │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Example Query:
query GetRepository($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    id
    name
    description
    stargazerCount
    forkCount
    primaryLanguage {
      name
    }
    defaultBranchRef {
      name
      target {
        ... on Commit {
          history(first: 5) {
            nodes {
              message
              author {
                name
                date
              }
            }
          }
        }
      }
    }
  }
}
        `.trim(),
      },
      {
        subtitle: '4.2 Rate Limiting (Point-Based)',
        content: `
GraphQL uses a point-based rate limiting system.

Point Calculation:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Points = nodes_requested × complexity_per_node                             │
│                                                                              │
│  • First/last argument: Counts nodes requested                              │
│  • Connections: 1 point + points for children                               │
│  • Nested connections multiply                                              │
│                                                                              │
│  Example:                                                                   │
│  {                                                                          │
│    viewer {                            # 1 point                            │
│      repositories(first: 10) {         # 10 points                          │
│        nodes {                                                              │
│          issues(first: 20) {           # 10 × 20 = 200 points              │
│            nodes { title }                                                  │
│          }                                                                  │
│        }                                                                    │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
│  Total: ~211 points                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

Limits:
• Maximum: 5,000 points per hour
• Maximum nodes per query: 500,000
• Maximum query complexity: varies

Rate Limit Query:
query {
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
}
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: GITHUB ACTIONS
  // ============================================
  
  githubActions: {
    title: '5. GitHub Actions Integration',
    sections: [
      {
        subtitle: '5.1 Triggering Workflows',
        content: `
Workflow Dispatch (Manual Trigger):

POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches

Request Body:
{
  "ref": "main",
  "inputs": {
    "environment": "production",
    "deploy_version": "v1.2.3"
  }
}

Workflow Requirements:
┌─────────────────────────────────────────────────────────────────────────────┐
│  # .github/workflows/deploy.yml                                             │
│  name: Deploy                                                               │
│  on:                                                                        │
│    workflow_dispatch:                                                       │
│      inputs:                                                                │
│        environment:                                                         │
│          description: 'Target environment'                                  │
│          required: true                                                     │
│          default: 'staging'                                                 │
│        deploy_version:                                                      │
│          description: 'Version to deploy'                                   │
│          required: true                                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Required Permissions:
• actions scope for PAT
• actions: write for fine-grained PAT
• Actions permission for GitHub Apps
        `.trim(),
      },
      {
        subtitle: '5.2 Self-Hosted Runners',
        content: `
Runner Lifecycle:

1. Get Registration Token
   POST /repos/{owner}/{repo}/actions/runners/registration-token
   or
   POST /orgs/{org}/actions/runners/registration-token

2. Configure Runner
   ./config.sh --url <repo_or_org_url> --token <registration_token>

3. Start Runner
   ./run.sh
   or
   Install as service: sudo ./svc.sh install

4. Monitor Runners
   GET /repos/{owner}/{repo}/actions/runners
   
Response:
{
  "total_count": 2,
  "runners": [
    {
      "id": 1,
      "name": "runner-1",
      "os": "linux",
      "status": "online",
      "busy": false,
      "labels": [
        {"name": "self-hosted"},
        {"name": "Linux"},
        {"name": "X64"}
      ]
    }
  ]
}

5. Remove Runner
   POST /repos/{owner}/{repo}/actions/runners/remove-token
   ./config.sh remove --token <remove_token>

Runner Labels:
• Default: self-hosted, {os}, {arch}
• Custom: Add during configuration or via API
• Usage in workflows: runs-on: [self-hosted, linux, gpu]
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 6: BEST PRACTICES
  // ============================================
  
  bestPractices: {
    title: '6. Best Practices',
    content: `
Authentication:
☐ Use fine-grained PATs for minimal permissions
☐ Use GitHub Apps for organizational automation
☐ Set expiration dates on tokens
☐ Store tokens in secure secret managers
☐ Never commit tokens to repositories

API Usage:
☐ Include X-GitHub-Api-Version header
☐ Set a meaningful User-Agent
☐ Check rate limits before bulk operations
☐ Use conditional requests (ETag) for caching
☐ Consider GraphQL for complex data needs
☐ Implement proper error handling

GitHub Actions:
☐ Use GITHUB_TOKEN when possible (no PAT needed)
☐ Pin action versions to SHA
☐ Use environments for deployment protection
☐ Implement proper secrets management
☐ Set appropriate runner labels

Self-Hosted Runners:
☐ Run as non-root user
☐ Use ephemeral runners for sensitive workloads
☐ Implement auto-scaling based on queue
☐ Keep runner software updated
☐ Use runner groups for access control

Security:
☐ Enable branch protection rules
☐ Require signed commits
☐ Enable security advisories
☐ Use Dependabot for updates
☐ Enable secret scanning
☐ Review audit logs regularly

Common Pitfalls:
✗ Using classic PATs when fine-grained available
✗ Ignoring rate limits until hitting them
✗ Not handling pagination properly
✗ Hardcoding tokens in code
✗ Not setting token expiration
✗ Using admin scopes when not needed
    `.trim(),
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportGitHubWhitepaperAsMarkdown(): string {
  const wp = GITHUB_WHITEPAPER;
  let markdown = '';

  // Title
  markdown += `# ${wp.metadata.title}\n\n`;
  markdown += `**${wp.metadata.subtitle}**\n\n`;
  markdown += `Version: ${wp.metadata.version}\n\n`;
  markdown += `APIs: ${wp.metadata.apiVersions.join(', ')}\n\n`;
  markdown += `---\n\n`;

  // Executive Summary
  markdown += `## ${wp.executiveSummary.title}\n\n`;
  markdown += `\`\`\`\n${wp.executiveSummary.content}\n\`\`\`\n\n`;

  // Authentication
  markdown += `## ${wp.authentication.title}\n\n`;
  for (const section of wp.authentication.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // REST API
  markdown += `## ${wp.restApi.title}\n\n`;
  for (const section of wp.restApi.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // GraphQL API
  markdown += `## ${wp.graphqlApi.title}\n\n`;
  for (const section of wp.graphqlApi.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // GitHub Actions
  markdown += `## ${wp.githubActions.title}\n\n`;
  for (const section of wp.githubActions.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Best Practices
  markdown += `## ${wp.bestPractices.title}\n\n`;
  markdown += `\`\`\`\n${wp.bestPractices.content}\n\`\`\`\n\n`;

  return markdown;
}

/**
 * GitHub token prefixes for identification
 */
export const GITHUB_TOKEN_PREFIXES = {
  'ghp_': 'Classic Personal Access Token',
  'github_pat_': 'Fine-Grained Personal Access Token',
  'gho_': 'OAuth Access Token',
  'ghu_': 'OAuth User-to-Server Token',
  'ghs_': 'GitHub App Installation Token',
  'ghr_': 'GitHub App Refresh Token',
} as const;

export default GITHUB_WHITEPAPER;
