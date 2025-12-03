// ============================================
// PROTOCOL OS - REST API KEY WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.6.c
// Purpose: Technical specification for REST API Key Authentication
// ============================================

/**
 * Whitepaper: REST API Key Authentication
 * 
 * The Simplest Form of API Authentication
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 */

export const REST_API_KEY_WHITEPAPER = {
  metadata: {
    title: 'REST API Key Authentication',
    subtitle: 'Simple, Stateless API Authentication',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    securityProfile: 'Simple Bearer Token (Symmetric Secret)',
  },

  // ============================================
  // SECTION 1: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
API Key authentication is the simplest and most widely used method for
authenticating API requests. A static secret token is included with each
request to identify and authorize the caller.

Key Characteristics:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Simple to implement (just add a header or parameter)                    │
│  • No expiration by default (key is valid until revoked)                   │
│  • No refresh flow needed                                                   │
│  • Stateless - no session management                                        │
│  • Widely supported by APIs                                                 │
│  • Single point of authentication per request                               │
└─────────────────────────────────────────────────────────────────────────────┘

When to Use API Keys:
✅ Server-to-server communication
✅ Backend integrations
✅ CLI tools and scripts
✅ Scheduled jobs
✅ Internal microservices
✅ Third-party API integrations

When NOT to Use API Keys:
❌ Client-side (browser) applications
❌ Mobile apps with key embedded
❌ Public-facing applications
❌ When fine-grained user permissions are needed
❌ When token rotation is critical

Comparison with Other Auth Methods:
┌────────────────────┬─────────────┬─────────────┬─────────────┬────────────┐
│ Feature            │ API Key     │ OAuth 2.0   │ JWT         │ Basic Auth │
├────────────────────┼─────────────┼─────────────┼─────────────┼────────────┤
│ Complexity         │ Very Low    │ High        │ Medium      │ Very Low   │
│ Expiration         │ None*       │ Yes         │ Yes         │ None       │
│ Scopes/Permissions │ Fixed**     │ Dynamic     │ In Token    │ None       │
│ User Context       │ No          │ Yes         │ Yes         │ Yes        │
│ Rotation           │ Manual      │ Automatic   │ Automatic   │ Manual     │
│ Security Level     │ Medium      │ High        │ High        │ Low        │
└────────────────────┴─────────────┴─────────────┴─────────────┴────────────┘

* Unless rotated manually or by policy
** Set at key creation time
    `.trim(),
  },

  // ============================================
  // SECTION 2: KEY PLACEMENT OPTIONS
  // ============================================
  
  keyPlacement: {
    title: '2. Key Placement Options',
    sections: [
      {
        subtitle: '2.1 HTTP Header (Recommended)',
        content: `
Headers are the preferred method for API key transmission because they:
• Are not logged by most web servers
• Don't appear in browser history
• Don't appear in referrer headers
• Are not cached by proxies (usually)

Common Header Formats:

1. X-API-Key Header (Most Common)
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/resource HTTP/1.1                                              │
│  Host: api.example.com                                                      │
│  X-API-Key: YOUR_SECRET_KEY                                   │
│  Content-Type: application/json                                             │
└─────────────────────────────────────────────────────────────────────────────┘

2. Authorization: Bearer (OAuth-style)
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/resource HTTP/1.1                                              │
│  Host: api.example.com                                                      │
│  Authorization: Bearer YOUR_SECRET_KEY                        │
│  Content-Type: application/json                                             │
└─────────────────────────────────────────────────────────────────────────────┘

3. Authorization: Basic (Key as Password)
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/resource HTTP/1.1                                              │
│  Host: api.example.com                                                      │
│  Authorization: Basic base64(:your_api_key)                                │
│  Content-Type: application/json                                             │
│                                                                              │
│  // Empty username, API key as password:                                    │
│  // base64(":YOUR_SECRET_KEY") = "OnNrX2xpdmVfeHh4"                            │
└─────────────────────────────────────────────────────────────────────────────┘

4. Custom Headers
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/resource HTTP/1.1                                              │
│  Host: api.example.com                                                      │
│  X-Custom-Auth: ApiKey your_api_key                                        │
│  Content-Type: application/json                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Provider Header Preferences:
┌──────────────────┬────────────────────────────────────────────────────────┐
│ Provider         │ Header Format                                          │
├──────────────────┼────────────────────────────────────────────────────────┤
│ Stripe           │ Authorization: Bearer YOUR_SECRET_KEY                      │
│ OpenAI           │ Authorization: Bearer sk-xxx                           │
│ Anthropic        │ x-api-key: sk-ant-xxx                                 │
│ SendGrid         │ Authorization: Bearer SG.xxx                           │
│ Twilio           │ Authorization: Basic base64(AccountSID:AuthToken)     │
│ GitHub           │ Authorization: Bearer ghp_xxx                          │
│ Slack            │ Authorization: Bearer xoxb-xxx                         │
│ Notion           │ Authorization: Bearer secret_xxx                       │
└──────────────────┴────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '2.2 Query Parameter',
        content: `
Query parameters are simpler but less secure:

Format:
  GET /api/v1/resource?api_key=YOUR_SECRET_KEY

Example:
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET /api/v1/users?api_key=YOUR_SECRET_KEY&limit=10 HTTP/1.1                   │
│  Host: api.example.com                                                      │
│  Content-Type: application/json                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Common Parameter Names:
• api_key
• apikey
• key
• access_key
• token

⚠️ SECURITY WARNINGS:

1. Server Logs
   Most web servers log the full URL including query parameters:
   
   [2024-12-03 10:30:00] GET /api/users?api_key=YOUR_SECRET_KEY 200 OK
   
   Your API key is now in the log file!

2. Browser History
   If accessed from a browser, the URL (with key) is stored in history.

3. Referrer Leakage
   If the page links to another site, the full URL may be sent in Referer.

4. Proxy Caching
   Some proxies cache responses based on the full URL.

When Query Parameters Are Acceptable:
• Internal APIs with controlled access
• Debug/development environments
• When headers can't be set (some legacy systems)
• Webhook callbacks (some providers require this)
        `.trim(),
      },
      {
        subtitle: '2.3 Request Body',
        content: `
Including the API key in the request body is rare but used by some APIs:

Format:
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /api/v1/action HTTP/1.1                                               │
│  Host: api.example.com                                                      │
│  Content-Type: application/json                                             │
│                                                                              │
│  {                                                                          │
│    "api_key": "YOUR_SECRET_KEY",                              │
│    "action": "send_email",                                                 │
│    "data": {                                                                │
│      "to": "user@example.com",                                             │
│      "subject": "Hello"                                                    │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Pros:
• Key not in URL (not logged by default)
• Works with POST requests naturally
• Can include multiple auth parameters

Cons:
• Only works with POST/PUT/PATCH (not GET)
• Mixes authentication with data payload
• More complex to implement
• Not RESTful (auth should be in headers)

When Body Auth Is Used:
• Legacy SOAP-style APIs
• Some payment processors (for PCI compliance)
• Custom enterprise APIs
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 3: SECURITY CONSIDERATIONS
  // ============================================
  
  security: {
    title: '3. Security Considerations',
    sections: [
      {
        subtitle: '3.1 Key Protection',
        content: `
API Keys are Secrets - Treat Them Like Passwords!

✅ DO:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Store in environment variables or secrets manager                        │
│  • Use separate keys for development/staging/production                     │
│  • Rotate keys periodically (every 90 days recommended)                     │
│  • Monitor key usage for anomalies                                          │
│  • Revoke keys immediately if compromised                                   │
│  • Use HTTPS for all API requests                                           │
│  • Limit key permissions to what's needed                                   │
└─────────────────────────────────────────────────────────────────────────────┘

❌ DON'T:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Commit keys to version control                                           │
│  • Include keys in client-side code                                         │
│  • Log keys (even partially)                                                │
│  • Share keys via email/chat                                                │
│  • Use the same key across multiple applications                            │
│  • Use production keys in development                                       │
│  • Expose keys in error messages                                            │
└─────────────────────────────────────────────────────────────────────────────┘

Storage Recommendations:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Priority │ Method                       │ When to Use                      │
│  ──────────────────────────────────────────────────────────────────────────│
│  1 (Best) │ Secrets Manager              │ Production, sensitive keys       │
│           │ (AWS, GCP, Azure, Vault)     │                                  │
│  ──────────────────────────────────────────────────────────────────────────│
│  2        │ Environment Variables        │ Server-side applications         │
│           │ (process.env.API_KEY)        │                                  │
│  ──────────────────────────────────────────────────────────────────────────│
│  3        │ Config File (encrypted)      │ Local development                │
│           │ (.env with encryption)       │                                  │
│  ──────────────────────────────────────────────────────────────────────────│
│  ✗ Never  │ Hardcoded in source          │ NEVER                            │
│           │ const key = "YOUR_SECRET_KEY"    │                                  │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '3.2 Key Rotation',
        content: `
Regular Key Rotation Limits Exposure Risk:

Why Rotate?
• Limits damage window if key is compromised
• Reduces risk from employee turnover
• Compliance requirements (PCI, SOC 2)
• Best practice for security hygiene

Rotation Strategy:
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. Generate new key in provider dashboard                                  │
│  2. Deploy new key to all applications (env var update)                     │
│  3. Verify new key is working                                               │
│  4. Wait for in-flight requests to complete (grace period)                  │
│  5. Revoke old key in provider dashboard                                    │
│  6. Verify old key no longer works                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Zero-Downtime Rotation:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Time ──────────────────────────────────────────────────────────────────▶   │
│                                                                              │
│  Old Key:  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │
│                             ↑                                               │
│                        Grace Period                                         │
│                                                                              │
│  New Key:  ░░░░░░░░░░░░░░░░████████████████████████████████████████████   │
│                   ↑                                                         │
│             Deploy New Key                                                  │
│                                                                              │
│  Both keys valid during overlap period                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Automated Rotation (Recommended):
Many secrets managers support automatic rotation:
• AWS Secrets Manager - Built-in rotation
• HashiCorp Vault - Rotation policies
• Azure Key Vault - Rotation reminders
        `.trim(),
      },
      {
        subtitle: '3.3 Rate Limiting',
        content: `
API Rate Limits Protect Both Provider and Consumer:

Common Rate Limit Headers:
┌─────────────────────────────────────────────────────────────────────────────┐
│  X-RateLimit-Limit: 1000          // Max requests per window               │
│  X-RateLimit-Remaining: 998       // Requests left in window               │
│  X-RateLimit-Reset: 1699999999    // Unix timestamp when window resets     │
│  Retry-After: 60                  // Seconds until retry (on 429)          │
└─────────────────────────────────────────────────────────────────────────────┘

Handling Rate Limits:

  async function apiCall(url) {
    const response = await fetch(url, { headers });
    
    if (response.status === 429) {
      // Rate limited
      const retryAfter = response.headers.get('Retry-After') || 60;
      console.log(\`Rate limited. Retry after \${retryAfter}s\`);
      
      // Wait and retry
      await sleep(retryAfter * 1000);
      return apiCall(url);
    }
    
    // Track remaining quota
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining && parseInt(remaining) < 10) {
      console.warn(\`Low on quota: \${remaining} requests remaining\`);
    }
    
    return response;
  }

Exponential Backoff:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Attempt 1: Wait 1 second                                                   │
│  Attempt 2: Wait 2 seconds                                                  │
│  Attempt 3: Wait 4 seconds                                                  │
│  Attempt 4: Wait 8 seconds                                                  │
│  Attempt 5: Wait 16 seconds                                                 │
│  ...with jitter to prevent thundering herd                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  function exponentialBackoff(attempt, baseMs = 1000, maxMs = 30000) {
    const delay = Math.min(baseMs * Math.pow(2, attempt), maxMs);
    const jitter = delay * 0.2 * Math.random(); // 20% jitter
    return delay + jitter;
  }
        `.trim(),
      },
      {
        subtitle: '3.4 Key Scoping and Permissions',
        content: `
Best Practice: Minimum Required Permissions

Most providers allow creating keys with limited scopes:

Example: Stripe Restricted Keys
┌─────────────────────────────────────────────────────────────────────────────┐
│  Key Purpose      │ Permissions                                             │
│  ─────────────────────────────────────────────────────────────────────────│
│  Read-only        │ Charges: Read, Customers: Read, Products: Read         │
│  Webhook handler  │ Charges: Read, Events: Read                            │
│  Subscription     │ Subscriptions: Write, Customers: Write                 │
└─────────────────────────────────────────────────────────────────────────────┘

Example: GitHub Fine-Grained Tokens
┌─────────────────────────────────────────────────────────────────────────────┐
│  Repository access: Only selected repositories                             │
│  Permissions:                                                               │
│    - Contents: Read-only                                                    │
│    - Pull requests: Read and write                                          │
│    - Issues: Read and write                                                 │
│    - Actions: No access                                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Service-Specific Keys:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Service          │ Key Permissions                                         │
│  ─────────────────────────────────────────────────────────────────────────│
│  Email Service    │ Send only (no admin)                                    │
│  Analytics        │ Read only                                               │
│  CRM Integration  │ Contacts read/write only                               │
│  Payment          │ Charges only (no refunds)                              │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 4: PROVIDER-SPECIFIC NOTES
  // ============================================
  
  providerNotes: {
    title: '4. Provider Implementation Examples',
    sections: [
      {
        subtitle: '4.1 Stripe',
        content: `
Stripe API Key Format:

Key Types:
• Secret Key: YOUR_SECRET_KEY (server-side only)
• Publishable Key: YOUR_PUBLIC_KEY (client-side safe)
• Restricted Key: YOUR_RESTRICTED_KEY (limited permissions)

Test Mode:
• Test Secret Key: YOUR_TEST_KEY
• Test Publishable Key: YOUR_TEST_PUBLIC_KEY

Authentication:
  Authorization: Bearer YOUR_SECRET_KEY

Example Request:
  curl https://api.stripe.com/v1/charges \\
    -u YOUR_SECRET_KEY: \\
    -d amount=2000 \\
    -d currency=usd \\
    -d source=tok_visa

Best Practices:
• Use restricted keys with minimum permissions
• Use test mode keys for development
• Never expose secret keys client-side
• Use webhook signatures for verification
        `.trim(),
      },
      {
        subtitle: '4.2 OpenAI / Anthropic',
        content: `
AI API Key Formats:

OpenAI:
• Format: sk-YOUR_API_KEY_HERE
• Header: Authorization: Bearer sk-xxx
• Endpoint: https://api.openai.com/v1/

Anthropic:
• Format: sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
• Header: x-api-key: sk-ant-xxx
• Also requires: anthropic-version: 2023-06-01
• Endpoint: https://api.anthropic.com/v1/

Example (OpenAI):
  curl https://api.openai.com/v1/chat/completions \\
    -H "Authorization: Bearer sk-xxx" \\
    -H "Content-Type: application/json" \\
    -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'

Example (Anthropic):
  curl https://api.anthropic.com/v1/messages \\
    -H "x-api-key: sk-ant-xxx" \\
    -H "anthropic-version: 2023-06-01" \\
    -H "Content-Type: application/json" \\
    -d '{"model": "claude-3-opus-20240229", "max_tokens": 1024, "messages": [...]}'

Best Practices:
• Set spending limits in dashboard
• Monitor usage to detect abuse
• Use organization-level keys for team access
        `.trim(),
      },
      {
        subtitle: '4.3 SendGrid / Mailchimp',
        content: `
Email Service API Keys:

SendGrid:
• Format: SG.xxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyy
• Header: Authorization: Bearer SG.xxx
• Supports: Full access or scoped (Mail Send only, etc.)

Mailchimp:
• Format: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us21
• Header: Authorization: Basic base64(anystring:apikey)
• Note: The suffix (us21) is your datacenter

SendGrid Example:
  curl https://api.sendgrid.com/v3/mail/send \\
    -H "Authorization: Bearer SG.xxx" \\
    -H "Content-Type: application/json" \\
    -d '{"personalizations":[{"to":[{"email":"user@example.com"}]}], ...}'

Mailchimp Example:
  curl https://us21.api.mailchimp.com/3.0/lists \\
    -H "Authorization: Basic base64(anystring:apikey-us21)" \\
    -H "Content-Type: application/json"

Best Practices:
• Create dedicated keys per application
• Use "Mail Send" only keys for transactional email
• Monitor reputation scores
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: BEST PRACTICES CHECKLIST
  // ============================================
  
  bestPractices: {
    title: '5. Best Practices Checklist',
    content: `
API Key Security Checklist:

Key Management:
☐ Store keys in environment variables or secrets manager
☐ Never commit keys to version control
☐ Use separate keys per environment (dev/staging/prod)
☐ Use separate keys per application/service
☐ Implement key rotation (every 90 days)
☐ Document which keys are used where

Key Permissions:
☐ Use restricted keys with minimum permissions
☐ Create read-only keys where possible
☐ Avoid using admin/full-access keys
☐ Review permissions regularly

Transport Security:
☐ Always use HTTPS
☐ Prefer headers over query parameters
☐ Never log full API keys
☐ Mask keys in any display (show only first/last 4 chars)

Monitoring:
☐ Monitor API key usage
☐ Alert on unusual patterns
☐ Track which keys are actively used
☐ Revoke unused keys

Error Handling:
☐ Handle 401/403 gracefully
☐ Implement rate limit handling
☐ Use exponential backoff for retries
☐ Don't expose key in error messages

Emergency Response:
☐ Have a key rotation procedure documented
☐ Know how to revoke keys quickly
☐ Have backup keys ready
☐ Test key rotation process regularly
    `.trim(),
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportRestApiKeyWhitepaperAsMarkdown(): string {
  const wp = REST_API_KEY_WHITEPAPER;
  let markdown = '';

  // Title
  markdown += `# ${wp.metadata.title}\n\n`;
  markdown += `**${wp.metadata.subtitle}**\n\n`;
  markdown += `Version: ${wp.metadata.version} | `;
  markdown += `Last Updated: ${wp.metadata.lastUpdated}\n\n`;
  markdown += `---\n\n`;

  // Executive Summary
  markdown += `## ${wp.executiveSummary.title}\n\n`;
  markdown += `\`\`\`\n${wp.executiveSummary.content}\n\`\`\`\n\n`;

  // Key Placement
  markdown += `## ${wp.keyPlacement.title}\n\n`;
  for (const section of wp.keyPlacement.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Security
  markdown += `## ${wp.security.title}\n\n`;
  for (const section of wp.security.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Provider Notes
  markdown += `## ${wp.providerNotes.title}\n\n`;
  for (const section of wp.providerNotes.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Best Practices
  markdown += `## ${wp.bestPractices.title}\n\n`;
  markdown += `\`\`\`\n${wp.bestPractices.content}\n\`\`\`\n\n`;

  return markdown;
}

/**
 * Get common API key patterns for validation
 */
export function getApiKeyPatterns(): Record<string, RegExp> {
  return {
    stripe_secret: /^YOUR_SECRET_(live|test)_[a-zA-Z0-9]+$/,
    stripe_publishable: /^YOUR_PUBLIC_(live|test)_[a-zA-Z0-9]+$/,
    stripe_restricted: /^YOUR_RESTRICTED_(live|test)_[a-zA-Z0-9]+$/,
    openai: /^sk-[a-zA-Z0-9-_]+$/,
    anthropic: /^sk-ant-[a-zA-Z0-9-_]+$/,
    sendgrid: /^SG\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/,
    github_classic: /^ghp_[a-zA-Z0-9]+$/,
    github_fine_grained: /^github_pat_[a-zA-Z0-9_]+$/,
    slack_bot: /^xoxb-[0-9]+-[0-9A-Za-z-]+$/,
    slack_app: /^xapp-[0-9]+-[0-9A-Za-z-]+$/,
    notion: /^secret_[a-zA-Z0-9]+$/,
    airtable: /^pat[a-zA-Z0-9.]+$/,
  };
}

export default REST_API_KEY_WHITEPAPER;
