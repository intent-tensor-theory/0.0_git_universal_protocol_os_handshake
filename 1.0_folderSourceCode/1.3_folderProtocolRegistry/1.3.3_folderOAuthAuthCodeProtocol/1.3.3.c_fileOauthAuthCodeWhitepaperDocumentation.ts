// ============================================
// PROTOCOL OS - OAUTH AUTH CODE WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.3.c
// Purpose: Technical specification for OAuth 2.0 Authorization Code Flow
// ============================================

/**
 * Whitepaper: OAuth 2.0 Authorization Code Flow (Confidential Clients)
 * 
 * Traditional OAuth for Server-Side Applications
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 */

export const OAUTH_AUTH_CODE_WHITEPAPER = {
  metadata: {
    title: 'OAuth 2.0 Authorization Code Flow: Confidential Clients',
    subtitle: 'Technical Specification for Server-Side OAuth',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    status: 'Stable',
    rfc: 'RFC 6749 - The OAuth 2.0 Authorization Framework',
  },

  // ============================================
  // SECTION 1: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
OAuth 2.0 Authorization Code Flow is the standard authentication mechanism for
server-side web applications (confidential clients) that can securely store
a client_secret. This is the original and most secure OAuth 2.0 grant type.

Key Characteristics:
• Client Secret: Application authenticates with a secret known only to the server
• Server-Side: Token exchange happens on the backend, never in the browser
• Secure: Tokens never exposed to the user's browser
• Full-Featured: Supports refresh tokens, token introspection, revocation
• Enterprise-Ready: Standard for business integrations

When to Use Authorization Code Flow:
✓ Server-side web applications
✓ Backend API integrations
✓ Service-to-service authentication
✓ Enterprise integrations (Salesforce, HubSpot, etc.)

When NOT to Use:
✗ Single-page applications (use PKCE instead)
✗ Mobile apps (use PKCE instead)
✗ Any client that cannot securely store secrets
    `.trim(),
  },

  // ============================================
  // SECTION 2: ARCHITECTURE
  // ============================================
  
  architecture: {
    title: '2. Architecture',
    sections: [
      {
        subtitle: '2.1 Client Types in OAuth 2.0',
        content: `
OAuth 2.0 defines two types of clients based on their ability to maintain
the confidentiality of credentials:

┌─────────────────────────────────────────────────────────────────────────┐
│                      OAuth 2.0 Client Types                              │
├───────────────────────────────┬─────────────────────────────────────────┤
│     Confidential Clients      │        Public Clients                   │
├───────────────────────────────┼─────────────────────────────────────────┤
│ • Can securely store secrets  │ • Cannot store secrets securely         │
│ • Server-side applications    │ • Browser-based SPAs                    │
│ • Backend services            │ • Mobile applications                   │
│ • Use client_secret           │ • Use PKCE instead                      │
│                               │                                          │
│ Examples:                     │ Examples:                                │
│ • Node.js/Express apps        │ • React/Vue/Angular SPAs                │
│ • Python/Django apps          │ • iOS/Android apps                      │
│ • Java/Spring apps            │ • Desktop applications                  │
│ • .NET applications           │ • CLI tools                             │
└───────────────────────────────┴─────────────────────────────────────────┘

This module implements the Authorization Code Flow for CONFIDENTIAL clients.
For public clients, use the OAuth PKCE module (1.3.2).
        `.trim(),
      },
      {
        subtitle: '2.2 Flow Overview',
        content: `
Authorization Code Flow:

┌──────────┐                              ┌──────────┐                              ┌──────────┐
│   User   │                              │  Server  │                              │  OAuth   │
│ (Browser)│                              │ (Backend)│                              │ Provider │
└────┬─────┘                              └────┬─────┘                              └────┬─────┘
     │                                         │                                         │
     │ 1. Click "Login with Provider"          │                                         │
     │────────────────────────────────────────▶│                                         │
     │                                         │                                         │
     │ 2. Redirect to OAuth Provider           │                                         │
     │◀────────────────────────────────────────│                                         │
     │                                         │                                         │
     │ 3. User authenticates at Provider       │                                         │
     │────────────────────────────────────────────────────────────────────────────────▶│
     │                                         │                                         │
     │ 4. User consents to permissions         │                                         │
     │────────────────────────────────────────────────────────────────────────────────▶│
     │                                         │                                         │
     │ 5. Redirect back with authorization code│                                         │
     │◀────────────────────────────────────────────────────────────────────────────────│
     │                                         │                                         │
     │ 6. Send code to backend                 │                                         │
     │────────────────────────────────────────▶│                                         │
     │                                         │                                         │
     │                                         │ 7. Exchange code + client_secret       │
     │                                         │    for tokens (server-to-server)       │
     │                                         │────────────────────────────────────────▶│
     │                                         │                                         │
     │                                         │ 8. Receive tokens                       │
     │                                         │◀────────────────────────────────────────│
     │                                         │                                         │
     │ 9. Authentication complete              │                                         │
     │◀────────────────────────────────────────│                                         │
     │                                         │                                         │
     ▼                                         ▼                                         ▼

Key Security Properties:
• Authorization code is short-lived (typically 1-10 minutes)
• client_secret never leaves the server
• Tokens are never exposed to the browser
• State parameter prevents CSRF attacks
        `.trim(),
      },
      {
        subtitle: '2.3 Why Client Secret is Secure (on Server)',
        content: `
The client_secret provides security because:

1. Server Environment Isolation
   ┌─────────────────────────────────────────────────────────────────┐
   │                        Server Environment                        │
   │  ┌─────────────────────────────────────────────────────────┐   │
   │  │  Application Code                                        │   │
   │  │  ┌─────────────────────────────────────────────────────┐│   │
   │  │  │  Environment Variables                               ││   │
   │  │  │  CLIENT_SECRET=abc123xyz...                         ││   │
   │  │  │  (Never transmitted to browser)                      ││   │
   │  │  └─────────────────────────────────────────────────────┘│   │
   │  └─────────────────────────────────────────────────────────┘   │
   └─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS (encrypted)
                                ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                     OAuth Provider                               │
   │  Verifies: client_id + client_secret + authorization_code       │
   └─────────────────────────────────────────────────────────────────┘

2. Proof of Application Identity
   • The client_secret proves the request comes from YOUR application
   • Prevents attackers from using stolen authorization codes
   • Even with intercepted code, attacker cannot exchange it

3. Secure Storage Options
   • Environment variables
   • Secrets managers (AWS Secrets Manager, HashiCorp Vault)
   • Key management services
   • Encrypted configuration files
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 3: IMPLEMENTATION
  // ============================================
  
  implementation: {
    title: '3. Implementation Details',
    sections: [
      {
        subtitle: '3.1 Authorization Request',
        content: `
Step 1: Build Authorization URL

GET {authorization_url}
  ?response_type=code
  &client_id={client_id}
  &redirect_uri={redirect_uri}
  &scope={scopes}
  &state={state}

Example (Salesforce):
https://login.salesforce.com/services/oauth2/authorize
  ?response_type=code
  &client_id=3MVG9...
  &redirect_uri=https://yourapp.com/oauth/callback
  &scope=api%20refresh_token
  &state=abc123xyz

Parameters:
┌─────────────────┬────────────────────────────────────────────────────┐
│ Parameter       │ Description                                         │
├─────────────────┼────────────────────────────────────────────────────┤
│ response_type   │ Must be "code"                                      │
│ client_id       │ Your application's client ID                        │
│ redirect_uri    │ URL to receive the authorization code               │
│ scope           │ Permissions requested (space-separated)             │
│ state           │ Random string for CSRF protection                   │
│ nonce           │ (OpenID) Random string for ID token replay protect │
│ prompt          │ (Optional) consent, login, none                    │
│ access_type     │ (Google) "offline" for refresh token               │
└─────────────────┴────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '3.2 Authorization Callback',
        content: `
Step 2: Handle Authorization Callback

After user authorizes, OAuth provider redirects to:

GET {redirect_uri}?code={authorization_code}&state={state}

Example:
https://yourapp.com/oauth/callback
  ?code=aPrx...
  &state=abc123xyz

Your backend must:
1. Validate state matches what was sent
2. Exchange code for tokens (next step)

Error Handling:
If user denies or error occurs:

GET {redirect_uri}
  ?error={error_code}
  &error_description={description}
  &state={state}

Common Error Codes:
┌────────────────────┬────────────────────────────────────────────────┐
│ Error Code         │ Description                                     │
├────────────────────┼────────────────────────────────────────────────┤
│ access_denied      │ User denied the authorization request           │
│ invalid_request    │ Missing or invalid parameter                    │
│ unauthorized_client│ Client not authorized for this grant type      │
│ unsupported_response_type │ Provider doesn't support "code"         │
│ invalid_scope      │ Requested scope is invalid or unknown           │
│ server_error       │ Provider encountered an error                   │
│ temporarily_unavailable │ Provider is temporarily unavailable       │
└────────────────────┴────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '3.3 Token Exchange',
        content: `
Step 3: Exchange Code for Tokens (Server-Side)

POST {token_url}
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={authorization_code}
&redirect_uri={redirect_uri}
&client_id={client_id}
&client_secret={client_secret}

Client Authentication Methods:

1. client_secret_basic (Most Common)
   Authorization: Basic {base64(client_id:client_secret)}

   POST /token
   Authorization: Basic M01WRzk...
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code
   &code=aPrx...
   &redirect_uri=https://yourapp.com/oauth/callback

2. client_secret_post
   POST /token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code
   &code=aPrx...
   &redirect_uri=https://yourapp.com/oauth/callback
   &client_id=3MVG9...
   &client_secret=abc123...

3. client_secret_jwt
   POST /token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code
   &code=aPrx...
   &client_id=3MVG9...
   &client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
   &client_assertion={signed_jwt}

Token Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "5Aep861TSEpv...",
  "scope": "api refresh_token",
  "id_token": "eyJhbGciOiJSUzI1NiIs..."  // If OpenID Connect
}
        `.trim(),
      },
      {
        subtitle: '3.4 Token Refresh',
        content: `
Step 4: Refresh Tokens When Expired

POST {token_url}
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}

grant_type=refresh_token
&refresh_token={refresh_token}

Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8Bep...NEW...",  // May be rotated
  "scope": "api refresh_token"
}

Best Practices:
1. Refresh proactively before expiration (e.g., when 5 minutes remaining)
2. Handle refresh failures gracefully (re-authenticate if needed)
3. Store new refresh_token if rotated
4. Use mutex/locking to prevent concurrent refresh requests

Refresh Token Rotation:
Some providers rotate refresh tokens on each use:

┌─────────────────────────────────────────────────────────────────────┐
│                    Refresh Token Rotation                           │
├─────────────────────────────────────────────────────────────────────┤
│  Request with refresh_token_A                                        │
│       │                                                              │
│       ▼                                                              │
│  Provider invalidates refresh_token_A                                │
│  Provider issues refresh_token_B                                     │
│       │                                                              │
│       ▼                                                              │
│  Client must use refresh_token_B for next refresh                   │
│                                                                      │
│  If refresh_token_A is used again → INVALID (possible theft)        │
└─────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '3.5 Token Introspection',
        content: `
Optional: Validate Tokens via Introspection

POST {introspection_url}
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}

token={access_token}
&token_type_hint=access_token

Response (Active Token):
{
  "active": true,
  "scope": "api refresh_token",
  "client_id": "3MVG9...",
  "username": "user@example.com",
  "token_type": "Bearer",
  "exp": 1700000000,
  "iat": 1699996400,
  "sub": "005xx0000001234"
}

Response (Inactive/Expired Token):
{
  "active": false
}

Use Cases for Introspection:
• Validate tokens before expensive operations
• Implement token blacklisting
• Debug authentication issues
• Audit token usage
        `.trim(),
      },
      {
        subtitle: '3.6 Token Revocation',
        content: `
Revoke Tokens When No Longer Needed

POST {revocation_url}
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}

token={token}
&token_type_hint=access_token  // or refresh_token

Response:
HTTP/1.1 200 OK
(Empty body - success even if token was already revoked)

When to Revoke:
• User logs out
• User revokes access from settings
• Security incident detected
• Application uninstalled
• Session terminated

Note: Revoking a refresh_token typically revokes all associated access_tokens.
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
        subtitle: '4.1 Client Secret Protection',
        content: `
Client Secret Storage Best Practices:

DO:
✓ Store in environment variables
✓ Use secrets managers (AWS Secrets Manager, HashiCorp Vault)
✓ Rotate secrets periodically
✓ Use different secrets per environment (dev, staging, prod)
✓ Limit access to secrets (principle of least privilege)
✓ Audit secret access

DON'T:
✗ Commit secrets to version control
✗ Log secrets
✗ Include in error messages
✗ Send in URLs (query parameters)
✗ Share between applications
✗ Use in client-side code

Secret Rotation Strategy:
┌─────────────────────────────────────────────────────────────────────┐
│                    Secret Rotation Process                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. Generate new client_secret at OAuth provider                    │
│  2. Configure application to accept BOTH old and new secret        │
│  3. Deploy application with dual-secret support                     │
│  4. Update environment to use new secret                            │
│  5. Remove old secret from OAuth provider                           │
│  6. Remove old secret support from application                      │
└─────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '4.2 CSRF Protection',
        content: `
State Parameter for CSRF Protection:

The state parameter prevents Cross-Site Request Forgery:

Attack Without State:
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Attacker │    │  Victim  │    │   Your   │
│          │    │          │    │   App    │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     │ 1. Attacker starts OAuth flow │
     │   with their own account      │
     │───────────────────────────────│
     │               │               │
     │ 2. Intercepts callback URL    │
     │   (with attacker's auth code) │
     │◀──────────────────────────────│
     │               │               │
     │ 3. Tricks victim to visit     │
     │   callback URL                │
     │──────────────▶│               │
     │               │               │
     │               │ 4. Victim's   │
     │               │   session now │
     │               │   linked to   │
     │               │   attacker's  │
     │               │   OAuth acct! │
     │               │──────────────▶│

Prevention:
1. Generate unique state per request
2. Store state in session
3. Verify state on callback
4. Reject mismatched state

Implementation:
  // Before redirect
  const state = crypto.randomBytes(32).toString('hex');
  session.oauthState = state;
  
  // On callback
  if (request.query.state !== session.oauthState) {
    throw new Error('CSRF detected');
  }
  delete session.oauthState;
        `.trim(),
      },
      {
        subtitle: '4.3 Secure Token Storage',
        content: `
Server-Side Token Storage:

Options (in order of preference):

1. Encrypted Database
   ┌─────────────────────────────────────────────────────────────────┐
   │  tokens table                                                    │
   ├─────────────────────────────────────────────────────────────────┤
   │  user_id         │ INTEGER (FK)                                 │
   │  access_token    │ BLOB (encrypted with AES-256-GCM)           │
   │  refresh_token   │ BLOB (encrypted with AES-256-GCM)           │
   │  expires_at      │ TIMESTAMP                                    │
   │  encryption_iv   │ BLOB                                         │
   └─────────────────────────────────────────────────────────────────┘

2. Secrets Manager (for service accounts)
   • AWS Secrets Manager
   • HashiCorp Vault
   • Azure Key Vault
   • Google Secret Manager

3. Secure Session Storage
   • Redis with encryption at rest
   • Encrypted cookies (HttpOnly, Secure, SameSite)

Encryption Key Management:
• Use envelope encryption
• Rotate encryption keys regularly
• Store keys in HSM or KMS
• Never store encryption key with encrypted data
        `.trim(),
      },
      {
        subtitle: '4.4 Redirect URI Validation',
        content: `
Redirect URI Security:

1. Exact Match Validation
   • Provider should only accept exact registered URIs
   • No wildcard domains
   • No open redirects

2. HTTPS Required
   • Always use HTTPS for redirect URIs
   • Exception: localhost for development

3. Avoid Open Redirectors
   BAD:  https://yourapp.com/redirect?url={user_input}
   GOOD: https://yourapp.com/oauth/callback

4. Register Specific Paths
   ✓ https://yourapp.com/oauth/callback
   ✗ https://yourapp.com/  (too broad)

Provider-Side Protections:
┌─────────────────────────────────────────────────────────────────────┐
│              Redirect URI Validation at Provider                    │
├─────────────────────────────────────────────────────────────────────┤
│  Registered: https://yourapp.com/oauth/callback                     │
│                                                                      │
│  ✓ https://yourapp.com/oauth/callback         → ALLOWED             │
│  ✗ https://yourapp.com/oauth/callback?extra   → DEPENDS ON PROVIDER│
│  ✗ https://evilsite.com/oauth/callback        → BLOCKED             │
│  ✗ https://yourapp.com/evil/callback          → BLOCKED             │
│  ✗ http://yourapp.com/oauth/callback          → BLOCKED (HTTP)     │
└─────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: PROVIDER-SPECIFIC NOTES
  // ============================================
  
  providerNotes: {
    title: '5. Provider-Specific Notes',
    sections: [
      {
        subtitle: '5.1 Salesforce',
        content: `
Salesforce OAuth Configuration:

Endpoints:
• Production: https://login.salesforce.com
• Sandbox: https://test.salesforce.com

Required Scopes:
• "api" - REST API access
• "refresh_token" - Offline access

Special Parameters:
• prompt=login - Force re-authentication
• immediate=true - Skip consent screen (if already authorized)

Instance URL:
After authentication, use the instance_url from token response:
{
  "access_token": "...",
  "instance_url": "https://na1.salesforce.com",  ← Use this!
  "id": "https://login.salesforce.com/id/00Dxx.../005xx..."
}

API calls go to: {instance_url}/services/data/v58.0/...
        `.trim(),
      },
      {
        subtitle: '5.2 HubSpot',
        content: `
HubSpot OAuth Configuration:

Authentication Method: client_secret_post (NOT basic auth)

Token Request:
POST https://api.hubapi.com/oauth/v1/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id={client_id}
&client_secret={client_secret}
&redirect_uri={redirect_uri}
&code={code}

Scopes:
• Scopes are set in app settings, not in authorization URL
• Some scopes require app approval

Access Token Info:
GET https://api.hubapi.com/oauth/v1/access-tokens/{access_token}

Returns token metadata including scopes and hub_id.
        `.trim(),
      },
      {
        subtitle: '5.3 QuickBooks',
        content: `
QuickBooks (Intuit) OAuth Configuration:

Environments:
• Sandbox: https://sandbox-quickbooks.api.intuit.com
• Production: https://quickbooks.api.intuit.com

Required Scopes:
• com.intuit.quickbooks.accounting - QuickBooks API access

Realm ID:
After authentication, you receive a "realmId" (company ID):
{
  "access_token": "...",
  "refresh_token": "...",
  "realmId": "1234567890"  ← Store this!
}

API calls require: ?realmId={realmId} or in URL path

Token Lifetime:
• Access token: 1 hour
• Refresh token: 100 days (but refreshing extends to 100 days from refresh)
        `.trim(),
      },
    ],
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportOAuthAuthCodeWhitepaperAsMarkdown(): string {
  const wp = OAUTH_AUTH_CODE_WHITEPAPER;
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

  // Architecture
  markdown += `## ${wp.architecture.title}\n\n`;
  for (const section of wp.architecture.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Implementation
  markdown += `## ${wp.implementation.title}\n\n`;
  for (const section of wp.implementation.sections) {
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

  return markdown;
}

/**
 * Get whitepaper sections for documentation UI
 */
export function getOAuthAuthCodeWhitepaperSections(): Array<{
  id: string;
  title: string;
  content: string;
}> {
  const wp = OAUTH_AUTH_CODE_WHITEPAPER;
  const sections: Array<{ id: string; title: string; content: string }> = [];

  sections.push({
    id: 'executive-summary',
    title: wp.executiveSummary.title,
    content: wp.executiveSummary.content,
  });

  for (const section of wp.architecture.sections) {
    sections.push({
      id: `architecture-${section.subtitle.toLowerCase().replace(/\s+/g, '-')}`,
      title: section.subtitle,
      content: section.content,
    });
  }

  for (const section of wp.implementation.sections) {
    sections.push({
      id: `implementation-${section.subtitle.toLowerCase().replace(/\s+/g, '-')}`,
      title: section.subtitle,
      content: section.content,
    });
  }

  for (const section of wp.security.sections) {
    sections.push({
      id: `security-${section.subtitle.toLowerCase().replace(/\s+/g, '-')}`,
      title: section.subtitle,
      content: section.content,
    });
  }

  for (const section of wp.providerNotes.sections) {
    sections.push({
      id: `provider-${section.subtitle.toLowerCase().replace(/\s+/g, '-')}`,
      title: section.subtitle,
      content: section.content,
    });
  }

  return sections;
}

export default OAUTH_AUTH_CODE_WHITEPAPER;
