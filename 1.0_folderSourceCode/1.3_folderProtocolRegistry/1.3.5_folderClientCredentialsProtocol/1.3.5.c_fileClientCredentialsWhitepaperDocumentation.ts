// ============================================
// PROTOCOL OS - CLIENT CREDENTIALS WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.5.c
// Purpose: Technical specification for OAuth 2.0 Client Credentials Grant
// ============================================

/**
 * Whitepaper: OAuth 2.0 Client Credentials Grant
 * 
 * Machine-to-Machine Authentication for Backend Services
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 * 
 * RFC Reference: RFC 6749 Section 4.4
 */

export const CLIENT_CREDENTIALS_WHITEPAPER = {
  metadata: {
    title: 'OAuth 2.0 Client Credentials Grant',
    subtitle: 'Machine-to-Machine Authentication for Backend Services',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    rfc: 'RFC 6749 Section 4.4',
    securityProfile: 'Confidential Client (Server-Side Only)',
  },

  // ============================================
  // SECTION 1: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
The OAuth 2.0 Client Credentials Grant is designed for machine-to-machine (M2M)
authentication scenarios where no human user is involved. The client application
authenticates directly with its own credentials to obtain an access token.

Key Characteristics:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • No user interaction required                                             │
│  • Client acts on its own behalf (not a user's behalf)                     │
│  • Simple POST request to token endpoint                                   │
│  • No authorization code or redirect flow                                  │
│  • Typically no refresh tokens (request new when expired)                  │
│  • Most straightforward OAuth 2.0 flow                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Primary Use Cases:
1. Backend service-to-service communication
2. Microservices authentication
3. Scheduled jobs and cron tasks
4. CLI tools and automation scripts
5. Server-side API integrations
6. Daemon processes
7. Batch processing jobs
8. Infrastructure automation

Security Profile:
• MUST be used server-side only (confidential client)
• NEVER expose client_secret in browser or mobile apps
• Credentials grant direct API access - treat them like passwords

Comparison with Other Flows:
┌────────────────────┬────────────────────┬────────────────────────────────┐
│ Flow               │ User Involved?     │ Use Case                       │
├────────────────────┼────────────────────┼────────────────────────────────┤
│ Client Credentials │ No                 │ M2M, Backend services          │
│ Authorization Code │ Yes (interactive)  │ Web apps with user login       │
│ PKCE               │ Yes (interactive)  │ SPAs and mobile apps           │
│ Implicit (Depr.)   │ Yes (interactive)  │ Legacy SPAs                    │
└────────────────────┴────────────────────┴────────────────────────────────┘
    `.trim(),
  },

  // ============================================
  // SECTION 2: HOW CLIENT CREDENTIALS WORKS
  // ============================================
  
  flowDescription: {
    title: '2. How Client Credentials Works',
    sections: [
      {
        subtitle: '2.1 Flow Overview',
        content: `
Client Credentials Flow:

┌──────────────────┐                    ┌──────────────────┐
│   Your Backend   │                    │   OAuth Server   │
│     Service      │                    │                  │
└────────┬─────────┘                    └────────┬─────────┘
         │                                       │
         │  1. POST /oauth/token                 │
         │     grant_type=client_credentials     │
         │     client_id=...                     │
         │     client_secret=...                 │
         │     scope=...                         │
         │──────────────────────────────────────▶│
         │                                       │
         │                              2. Validate credentials
         │                                       │
         │  3. 200 OK                            │
         │     {                                 │
         │       "access_token": "...",          │
         │       "token_type": "Bearer",         │
         │       "expires_in": 3600              │
         │     }                                 │
         │◀──────────────────────────────────────│
         │                                       │
         │  4. Use token for API requests        │
         │                                       │
         │  GET /api/resource                    │
         │  Authorization: Bearer {token}        │
         │──────────────────────────────────────▶│
         │                                       │
         ▼                                       ▼

Key Points:
• Single request to obtain token
• No browser redirects
• No user authentication
• Service authenticates itself directly
        `.trim(),
      },
      {
        subtitle: '2.2 Token Request',
        content: `
Token Request Format:

POST /oauth/token HTTP/1.1
Host: auth.provider.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}

grant_type=client_credentials
&scope=read:data%20write:data
&audience=https://api.example.com

Request Parameters:
┌──────────────────┬──────────┬──────────────────────────────────────────────┐
│ Parameter        │ Required │ Description                                  │
├──────────────────┼──────────┼──────────────────────────────────────────────┤
│ grant_type       │ Yes      │ Must be "client_credentials"                 │
│ client_id        │ Yes*     │ Your application's client ID                 │
│ client_secret    │ Yes*     │ Your application's client secret             │
│ scope            │ No       │ Space-separated list of scopes               │
│ audience         │ Varies   │ Target API identifier (required by some)     │
│ resource         │ No       │ RFC 8707 resource indicator                  │
└──────────────────┴──────────┴──────────────────────────────────────────────┘

* client_id and client_secret can be sent in Authorization header (Basic)
  or in POST body, depending on provider requirements.
        `.trim(),
      },
      {
        subtitle: '2.3 Token Response',
        content: `
Successful Token Response:

HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "read:data write:data"
}

Response Fields:
┌──────────────────┬──────────────────────────────────────────────────────────┐
│ Field            │ Description                                              │
├──────────────────┼──────────────────────────────────────────────────────────┤
│ access_token     │ The token to use for API requests                        │
│ token_type       │ Usually "Bearer"                                         │
│ expires_in       │ Token lifetime in seconds                                │
│ scope            │ Granted scopes (may differ from requested)               │
│ refresh_token    │ Rare for client credentials (typically not provided)     │
└──────────────────┴──────────────────────────────────────────────────────────┘

Error Response:

HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}

Common Errors:
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Error Code           │ Description                                           │
├──────────────────────┼───────────────────────────────────────────────────────┤
│ invalid_client       │ Client authentication failed                          │
│ invalid_grant        │ Grant type not allowed for this client                │
│ invalid_scope        │ Requested scope is invalid or not allowed             │
│ unauthorized_client  │ Client not authorized for this grant type             │
│ server_error         │ Authorization server error                            │
└──────────────────────┴───────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '2.4 Using the Access Token',
        content: `
Making Authenticated API Requests:

GET /api/v1/data HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

Code Example (Node.js):

  const response = await fetch('https://api.example.com/v1/data', {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${accessToken}\`,
      'Content-Type': 'application/json',
    },
  });

Token Lifecycle:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1. Request token at startup or before first API call                       │
│  2. Store token in memory (or encrypted storage)                            │
│  3. Check expiration before each API call                                   │
│  4. Request new token when expired (no refresh token needed)                │
│  5. Handle 401 responses by requesting new token                            │
│                                                                              │
│  Timeline:                                                                   │
│  ├─────────────────────────────────────────────────────────────────────────│
│  │ 0min              30min              55min     60min                     │
│  │ │─────────────────│──────────────────│─────────│                        │
│  │ Token              Use token for     Proactive   Token                  │
│  │ requested          API calls         refresh     expires                │
│  │                                      (5min early)                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 3: CLIENT AUTHENTICATION METHODS
  // ============================================
  
  clientAuthMethods: {
    title: '3. Client Authentication Methods',
    sections: [
      {
        subtitle: '3.1 client_secret_basic (Recommended)',
        content: `
Authorization Header with Basic Authentication:

The client_id and client_secret are combined with a colon (:) separator,
Base64-encoded, and sent in the Authorization header.

Format:
  Authorization: Basic {base64(client_id:client_secret)}

Example:
  client_id:     my-service-client
  client_secret: super-secret-key
  Combined:      my-service-client:super-secret-key
  Base64:        bXktc2VydmljZS1jbGllbnQ6c3VwZXItc2VjcmV0LWtleQ==

HTTP Request:
  POST /oauth/token HTTP/1.1
  Host: auth.provider.com
  Authorization: Basic bXktc2VydmljZS1jbGllbnQ6c3VwZXItc2VjcmV0LWtleQ==
  Content-Type: application/x-www-form-urlencoded

  grant_type=client_credentials&scope=read:data

Code:
  const basicAuth = btoa(\`\${clientId}:\${clientSecret}\`);
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': \`Basic \${basicAuth}\`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

⚠️ Note: URL-encode the client_id and client_secret if they contain
   special characters before Base64 encoding.
        `.trim(),
      },
      {
        subtitle: '3.2 client_secret_post',
        content: `
Credentials in POST Body:

The client_id and client_secret are sent as form parameters in the
request body instead of the Authorization header.

HTTP Request:
  POST /oauth/token HTTP/1.1
  Host: auth.provider.com
  Content-Type: application/x-www-form-urlencoded

  grant_type=client_credentials
  &client_id=my-service-client
  &client_secret=super-secret-key
  &scope=read:data

Code:
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'read:data',
  });
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

When to Use:
• Some providers (like HubSpot) require this method
• When Basic auth is not supported by the provider
• When HTTP proxies strip Authorization headers
        `.trim(),
      },
      {
        subtitle: '3.3 client_secret_jwt (HS256)',
        content: `
JWT Signed with Client Secret (HMAC-SHA256):

Instead of sending the client_secret directly, the client creates a
JWT assertion signed with the client_secret using HS256.

JWT Structure:

Header:
  {
    "alg": "HS256",
    "typ": "JWT"
  }

Payload:
  {
    "iss": "my-service-client",        // client_id
    "sub": "my-service-client",        // client_id
    "aud": "https://auth.provider.com/oauth/token",  // token URL
    "jti": "unique-token-id",          // unique identifier
    "exp": 1699999999,                 // expiration (5 min max)
    "iat": 1699999699                  // issued at
  }

Signature:
  HMAC-SHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    client_secret
  )

HTTP Request:
  POST /oauth/token HTTP/1.1
  Host: auth.provider.com
  Content-Type: application/x-www-form-urlencoded

  grant_type=client_credentials
  &client_id=my-service-client
  &client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
  &client_assertion=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Benefits:
• Client secret is never sent over the wire
• JWT is short-lived (reduces risk of interception)
• Provides proof-of-possession of the secret
        `.trim(),
      },
      {
        subtitle: '3.4 private_key_jwt (RS256)',
        content: `
JWT Signed with Private Key (RSA or ECDSA):

The client uses a private key to sign the JWT. The authorization server
verifies using the corresponding public key (registered in advance).

JWT Structure:

Header:
  {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "my-key-id"    // Key ID (optional, helps server find key)
  }

Payload:
  {
    "iss": "my-service-client",
    "sub": "my-service-client",
    "aud": "https://auth.provider.com/oauth/token",
    "jti": "unique-token-id",
    "exp": 1699999999,
    "iat": 1699999699
  }

Signature:
  RSA-SHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    privateKey
  )

Key Registration:
Before using private_key_jwt, register the public key with the provider:
• Upload public key in PEM format
• Or register JWKS URL where public keys are published

HTTP Request:
  POST /oauth/token HTTP/1.1
  Host: auth.provider.com
  Content-Type: application/x-www-form-urlencoded

  grant_type=client_credentials
  &client_id=my-service-client
  &client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
  &client_assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

Use Cases:
• Google Service Accounts (required)
• High-security environments
• When client_secret storage is a concern
• Automated key rotation scenarios
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 4: SECURITY CONSIDERATIONS
  // ============================================
  
  security: {
    title: '4. Security Considerations',
    sections: [
      {
        subtitle: '4.1 Credential Protection',
        content: `
Protecting Client Credentials:

Client Credentials grant DIRECT API access. Treat them like passwords!

✅ DO:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Store in environment variables                                           │
│  • Use secrets managers (AWS Secrets Manager, HashiCorp Vault, etc.)       │
│  • Rotate credentials periodically (every 90 days recommended)              │
│  • Use different credentials per environment (dev, staging, prod)           │
│  • Limit access to credentials (need-to-know basis)                         │
│  • Audit access to credentials                                              │
│  • Monitor for credential exposure (GitHub secret scanning, etc.)           │
└─────────────────────────────────────────────────────────────────────────────┘

❌ DON'T:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Commit credentials to version control                                    │
│  • Log credentials (even in debug mode)                                     │
│  • Include in error messages                                                │
│  • Send in URL query parameters                                             │
│  • Share between applications                                               │
│  • Use in browser or mobile apps                                            │
│  • Hard-code in source files                                                │
└─────────────────────────────────────────────────────────────────────────────┘

Environment Variable Pattern:
  // ✅ Good
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  
  // ❌ Bad
  const clientSecret = 'hard-coded-secret-123';
        `.trim(),
      },
      {
        subtitle: '4.2 Token Storage',
        content: `
Storing Access Tokens:

Tokens are less sensitive than credentials (they expire), but still need
protection.

Storage Options (in order of preference):
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. In-Memory (Best for short-lived services)                               │
│     • Token stored in process memory                                        │
│     • Lost when process restarts                                            │
│     • Most secure (no persistence)                                          │
│                                                                              │
│  2. Encrypted File/Database (For persistent services)                       │
│     • AES-256-GCM encryption                                                │
│     • Encryption key in secrets manager                                     │
│     • Survives restarts                                                     │
│                                                                              │
│  3. Secrets Manager (For distributed systems)                               │
│     • Central token storage                                                 │
│     • Multiple services can share                                           │
│     • Automatic rotation possible                                           │
└─────────────────────────────────────────────────────────────────────────────┘

Example In-Memory Token Store:
  class TokenStore {
    private token: string | null = null;
    private expiresAt: number = 0;
    
    set(token: string, expiresIn: number) {
      this.token = token;
      this.expiresAt = Date.now() + (expiresIn * 1000);
    }
    
    get(): string | null {
      if (!this.token || Date.now() > this.expiresAt) {
        return null; // Expired or missing
      }
      return this.token;
    }
    
    clear() {
      this.token = null;
      this.expiresAt = 0;
    }
  }
        `.trim(),
      },
      {
        subtitle: '4.3 Scope Minimization',
        content: `
Principle of Least Privilege:

Request only the scopes your service actually needs.

Example:
  If your service only reads user data, don't request write scopes.
  
  ✅ Good:  scope=read:users
  ❌ Bad:   scope=read:users write:users delete:users admin

Benefits of Minimal Scopes:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Limits damage if token is compromised                                    │
│  • Reduces attack surface                                                   │
│  • Clearer audit trail                                                      │
│  • Easier compliance (SOC 2, ISO 27001, etc.)                              │
│  • Faster token validation (smaller token)                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Service-Specific Credentials:
  Different services should have different credentials with different scopes.
  
  ┌─────────────────┬──────────────────────────────────────────┐
  │ Service         │ Scopes                                   │
  ├─────────────────┼──────────────────────────────────────────┤
  │ Report Service  │ read:data, read:analytics                │
  │ Import Service  │ write:data                               │
  │ Admin Service   │ read:data, write:data, admin:settings    │
  └─────────────────┴──────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '4.4 Network Security',
        content: `
Securing Token Requests:

1. Always Use HTTPS
   • Token endpoint MUST be HTTPS
   • API endpoints MUST be HTTPS
   • No exceptions, even in development

2. Certificate Validation
   • Verify server certificates
   • Use certificate pinning for high-security scenarios
   • Don't disable certificate validation in production

3. Network Isolation
   • Run M2M services in private subnets when possible
   • Use VPC peering for cloud-to-cloud communication
   • Implement IP allowlisting where supported

4. Request Signing (Additional Layer)
   Some high-security APIs require request signing in addition to OAuth:
   • AWS Signature V4
   • Custom HMAC signatures
   
   Example AWS SigV4:
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  POST /api/data                                                         │
   │  Authorization: Bearer {oauth_token}                                    │
   │  x-amz-date: 20241203T120000Z                                          │
   │  x-amz-content-sha256: {hash}                                          │
   │  Authorization: AWS4-HMAC-SHA256 Credential=.../Signature=...          │
   └─────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: PROVIDER-SPECIFIC NOTES
  // ============================================
  
  providerNotes: {
    title: '5. Provider-Specific Implementation',
    sections: [
      {
        subtitle: '5.1 Auth0',
        content: `
Auth0 Machine-to-Machine Applications:

Token Endpoint:
  https://{tenant}.auth0.com/oauth/token

Required Parameters:
  • audience: REQUIRED - Your API identifier (e.g., https://api.example.com)
  • client_id: Your M2M application's client ID
  • client_secret: Your M2M application's client secret

Authentication Method:
  client_secret_post (client credentials in POST body)

Example Request:
  POST https://your-tenant.auth0.com/oauth/token
  Content-Type: application/x-www-form-urlencoded

  grant_type=client_credentials
  &client_id=YOUR_CLIENT_ID
  &client_secret=YOUR_CLIENT_SECRET
  &audience=https://api.example.com

Notes:
  • audience is REQUIRED - without it, you get a generic token
  • Create a separate M2M application in Auth0 dashboard
  • Authorize the M2M app to call your API
  • Token lifetime configurable in API settings
        `.trim(),
      },
      {
        subtitle: '5.2 Azure AD (Microsoft Entra ID)',
        content: `
Azure AD App-Only Access:

Token Endpoint:
  https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token

Tenant Options:
  • {tenant-id}: Specific tenant
  • common: Multi-tenant apps
  • organizations: Work/school accounts only
  • consumers: Personal accounts only

Required Scope:
  Use "{resource}/.default" format for app-only access
  Example: https://graph.microsoft.com/.default

Example Request:
  POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
  Content-Type: application/x-www-form-urlencoded

  grant_type=client_credentials
  &client_id=YOUR_CLIENT_ID
  &client_secret=YOUR_CLIENT_SECRET
  &scope=https://graph.microsoft.com/.default

Setup Requirements:
  1. Register app in Azure AD
  2. Add Application Permissions (not Delegated)
  3. Grant admin consent for the permissions
  4. Create client secret or upload certificate

Certificate Authentication (Recommended for Production):
  Use private_key_jwt with X.509 certificate
        `.trim(),
      },
      {
        subtitle: '5.3 Google Cloud (Service Accounts)',
        content: `
Google Service Account Authentication:

Google uses JWT Bearer assertion (not client_secret):

Token Endpoint:
  https://oauth2.googleapis.com/token

Authentication Method:
  private_key_jwt with RS256

JWT Claims:
  {
    "iss": "service-account@project.iam.gserviceaccount.com",
    "scope": "https://www.googleapis.com/auth/cloud-platform",
    "aud": "https://oauth2.googleapis.com/token",
    "exp": 1699999999,
    "iat": 1699999699
  }

Example Request:
  POST https://oauth2.googleapis.com/token
  Content-Type: application/x-www-form-urlencoded

  grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
  &assertion=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

Setup:
  1. Create service account in Google Cloud Console
  2. Download JSON key file (contains private key)
  3. DO NOT commit key file to version control!
  4. Use environment variable or secrets manager

Google Client Library (Recommended):
  const {GoogleAuth} = require('google-auth-library');
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
  });
  const client = await auth.getClient();
        `.trim(),
      },
      {
        subtitle: '5.4 AWS Cognito',
        content: `
AWS Cognito M2M Authentication:

Token Endpoint:
  https://{domain}.auth.{region}.amazoncognito.com/oauth2/token

Domain Format:
  • Cognito domain: your-domain.auth.us-east-1.amazoncognito.com
  • Custom domain: auth.yourdomain.com

Required:
  • App client with client credentials grant enabled
  • Resource server with defined scopes

Example Request:
  POST https://your-domain.auth.us-east-1.amazoncognito.com/oauth2/token
  Authorization: Basic {base64(client_id:client_secret)}
  Content-Type: application/x-www-form-urlencoded

  grant_type=client_credentials
  &scope=resource-server/read resource-server/write

Setup:
  1. Create User Pool
  2. Create App Client (enable client credentials)
  3. Create Resource Server with scopes
  4. Associate scopes with App Client

AWS SDK Alternative:
  const cognito = new AWS.CognitoIdentityServiceProvider();
  // SDK handles token refresh automatically
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
Client Credentials Best Practices Checklist:

Credential Management:
☐ Store credentials in environment variables or secrets manager
☐ Never commit credentials to version control
☐ Use different credentials per environment
☐ Rotate credentials every 90 days
☐ Monitor for credential exposure

Token Handling:
☐ Cache tokens until near expiration
☐ Refresh proactively (5 minutes before expiration)
☐ Handle token refresh atomically (avoid race conditions)
☐ Clear tokens on service shutdown
☐ Don't log tokens (even partially)

Scope Management:
☐ Request minimum necessary scopes
☐ Use separate credentials for different services
☐ Review scope requirements periodically

Error Handling:
☐ Retry on transient failures (5xx, network errors)
☐ Implement exponential backoff
☐ Alert on repeated authentication failures
☐ Handle credential expiration/revocation gracefully

Monitoring:
☐ Log authentication events (success/failure, not credentials)
☐ Monitor token usage patterns
☐ Alert on unusual access patterns
☐ Track token lifetimes and refresh rates

Security:
☐ Use HTTPS for all requests
☐ Validate server certificates
☐ Implement rate limiting
☐ Use network isolation where possible
    `.trim(),
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportClientCredentialsWhitepaperAsMarkdown(): string {
  const wp = CLIENT_CREDENTIALS_WHITEPAPER;
  let markdown = '';

  // Title
  markdown += `# ${wp.metadata.title}\n\n`;
  markdown += `**${wp.metadata.subtitle}**\n\n`;
  markdown += `Version: ${wp.metadata.version} | `;
  markdown += `RFC: ${wp.metadata.rfc} | `;
  markdown += `Last Updated: ${wp.metadata.lastUpdated}\n\n`;
  markdown += `---\n\n`;

  // Executive Summary
  markdown += `## ${wp.executiveSummary.title}\n\n`;
  markdown += `\`\`\`\n${wp.executiveSummary.content}\n\`\`\`\n\n`;

  // Flow Description
  markdown += `## ${wp.flowDescription.title}\n\n`;
  for (const section of wp.flowDescription.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Client Auth Methods
  markdown += `## ${wp.clientAuthMethods.title}\n\n`;
  for (const section of wp.clientAuthMethods.sections) {
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
 * Get client credentials capability summary
 */
export function getClientCredentialsCapabilities(): {
  noUserRequired: boolean;
  refreshStrategy: string;
  securityLevel: string;
  typicalTokenLifetime: string;
  recommendedEnvironments: string[];
} {
  return {
    noUserRequired: true,
    refreshStrategy: 'Request new token when expired (no refresh_token)',
    securityLevel: 'High (confidential client with server-side secret)',
    typicalTokenLifetime: '1 hour (configurable by provider)',
    recommendedEnvironments: [
      'Backend services',
      'Microservices',
      'Scheduled jobs',
      'CLI tools',
      'Server-side integrations',
    ],
  };
}

export default CLIENT_CREDENTIALS_WHITEPAPER;
