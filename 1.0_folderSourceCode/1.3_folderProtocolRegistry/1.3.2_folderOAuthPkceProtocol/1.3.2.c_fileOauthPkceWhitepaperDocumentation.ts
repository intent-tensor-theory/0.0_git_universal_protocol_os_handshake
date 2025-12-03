// ============================================
// PROTOCOL OS - OAUTH PKCE WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.2.c
// Purpose: Technical specification and security analysis for OAuth 2.0 + PKCE
// ============================================

/**
 * Whitepaper: OAuth 2.0 Authorization Code Flow with PKCE
 * 
 * Secure Authentication for Single-Page Applications
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 */

export const OAUTH_PKCE_WHITEPAPER = {
  metadata: {
    title: 'OAuth 2.0 with PKCE: Secure Authentication for SPAs',
    subtitle: 'Technical Specification and Security Analysis',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    status: 'Stable',
    rfc: 'RFC 7636 - Proof Key for Code Exchange',
  },

  // ============================================
  // SECTION 1: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
OAuth 2.0 Authorization Code Flow with Proof Key for Code Exchange (PKCE) is the
recommended authentication method for single-page applications (SPAs) and mobile
apps. It extends the standard OAuth 2.0 authorization code flow with a dynamic
client secret that prevents authorization code interception attacks.

Key Benefits:
• No Client Secret: Public clients can authenticate securely
• Code Interception Protection: PKCE prevents stolen codes from being used
• Browser-Safe: Works entirely in the browser without server-side secrets
• Standard Compliance: RFC 7636 and OAuth 2.1 compliant
• Wide Support: Implemented by all major OAuth providers

PKCE replaces the static client_secret with a dynamically generated code_verifier
and code_challenge pair, ensuring that even if an attacker intercepts the
authorization code, they cannot exchange it for tokens without the original
code_verifier.
    `.trim(),
  },

  // ============================================
  // SECTION 2: THE PROBLEM PKCE SOLVES
  // ============================================
  
  problemStatement: {
    title: '2. The Problem PKCE Solves',
    sections: [
      {
        subtitle: '2.1 The Authorization Code Interception Attack',
        content: `
In traditional OAuth 2.0 with confidential clients, the client_secret protects
the token exchange. But public clients (SPAs, mobile apps) cannot securely
store a client_secret - it would be visible in the browser or app bundle.

Without a client_secret, the authorization code becomes the only proof of
identity. An attacker who intercepts this code can exchange it for tokens:

Vulnerable Flow (OAuth 2.0 without PKCE):
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   User   │    │   SPA    │    │ Attacker │    │  OAuth   │
│          │    │          │    │          │    │ Provider │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ Click Login   │               │               │
     │──────────────▶│               │               │
     │               │               │               │
     │               │ Redirect to /authorize        │
     │◀──────────────│──────────────────────────────▶│
     │               │               │               │
     │ Authenticate  │               │               │
     │──────────────────────────────────────────────▶│
     │               │               │               │
     │ Redirect with code            │               │
     │◀──────────────────────────────────────────────│
     │               │               │               │
     │     ┌─────────┴───────────────┤               │
     │     │   ATTACKER INTERCEPTS   │               │
     │     │   THE REDIRECT URL      │               │
     │     └─────────────────────────┤               │
     │               │               │               │
     │               │               │ POST /token   │
     │               │               │ (with stolen  │
     │               │               │  code)        │
     │               │               │──────────────▶│
     │               │               │               │
     │               │               │ Access Token! │
     │               │               │◀──────────────│
     │               │               │               │
     ▼               ▼               ▼               ▼

Attack vectors for code interception:
• Malicious browser extensions
• Compromised redirect handler
• Network interception (if not HTTPS)
• Evil twin WiFi attacks
• Clipboard monitoring
        `.trim(),
      },
      {
        subtitle: '2.2 Why Client Secrets Don\'t Work for SPAs',
        content: `
A client_secret embedded in a SPA is not secret:

1. Source Code Inspection
   └─ JavaScript is delivered to the browser
   └─ Users can view source and extract secrets
   └─ Build artifacts contain the secret in plain text

2. Network Traffic Analysis
   └─ Even if obfuscated, the secret is sent to the server
   └─ TLS terminates at the browser
   └─ The secret can be extracted from requests

3. Reverse Engineering
   └─ Mobile apps can be decompiled
   └─ Desktop apps can be disassembled
   └─ Obfuscation only slows down attackers

Conclusion: Public clients CANNOT have secrets. We need a different mechanism.
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 3: PKCE SOLUTION
  // ============================================
  
  pkceSolution: {
    title: '3. The PKCE Solution',
    sections: [
      {
        subtitle: '3.1 How PKCE Works',
        content: `
PKCE adds a dynamic, per-request secret that is generated for each authorization
flow and verified during token exchange.

PKCE Components:
┌─────────────────────────────────────────────────────────────────────────┐
│                          PKCE Parameters                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  code_verifier                                                          │
│  ├─ High-entropy random string                                          │
│  ├─ 43-128 characters                                                   │
│  ├─ Characters: [A-Z][a-z][0-9]-._~                                    │
│  └─ NEVER sent to authorization endpoint                               │
│                                                                          │
│  code_challenge                                                          │
│  ├─ Derived from code_verifier                                          │
│  ├─ SHA-256 hash of verifier (S256 method)                             │
│  ├─ Base64-URL encoded (no padding)                                    │
│  └─ Sent to authorization endpoint                                      │
│                                                                          │
│  code_challenge_method                                                   │
│  ├─ "S256" (recommended) - SHA-256 hash                                │
│  └─ "plain" (not recommended) - verifier sent as-is                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

The Math:
  code_verifier = random_string(43-128 chars)
  code_challenge = BASE64URL(SHA256(code_verifier))

Example:
  code_verifier  = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
  code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
        `.trim(),
      },
      {
        subtitle: '3.2 PKCE Flow Diagram',
        content: `
Secure Flow (OAuth 2.0 with PKCE):
┌──────────┐                      ┌──────────┐                      ┌──────────┐
│   SPA    │                      │  OAuth   │                      │ Attacker │
│          │                      │ Provider │                      │          │
└────┬─────┘                      └────┬─────┘                      └────┬─────┘
     │                                 │                                 │
     │ 1. Generate code_verifier       │                                 │
     │    (keep secret locally)        │                                 │
     │                                 │                                 │
     │ 2. Generate code_challenge      │                                 │
     │    = SHA256(code_verifier)      │                                 │
     │                                 │                                 │
     │ 3. GET /authorize               │                                 │
     │    ?code_challenge=xxx          │                                 │
     │    &code_challenge_method=S256  │                                 │
     │────────────────────────────────▶│                                 │
     │                                 │                                 │
     │ 4. User authenticates           │                                 │
     │                                 │                                 │
     │ 5. Redirect with code           │                                 │
     │◀────────────────────────────────│                                 │
     │                                 │                                 │
     │          ┌──────────────────────┼─────────────────────────────────┤
     │          │   Even if attacker   │                                 │
     │          │   intercepts code... │                                 │
     │          └──────────────────────┼─────────────────────────────────┤
     │                                 │                                 │
     │ 6. POST /token                  │                                 │
     │    code=xxx                     │                                 │
     │    code_verifier=yyy ◀──────── ATTACKER DOESN'T HAVE THIS        │
     │────────────────────────────────▶│                                 │
     │                                 │                                 │
     │ 7. Provider verifies:           │                                 │
     │    SHA256(code_verifier)        │                                 │
     │    == stored code_challenge     │                                 │
     │                                 │                                 │
     │ 8. Access Token                 │      ✗ Attacker cannot          │
     │◀────────────────────────────────│        exchange code            │
     │                                 │        without verifier         │
     ▼                                 ▼                                 ▼
        `.trim(),
      },
      {
        subtitle: '3.3 Why PKCE is Secure',
        content: `
Security Properties of PKCE:

1. One-Way Function (SHA-256)
   └─ Given code_challenge, cannot compute code_verifier
   └─ Cryptographic preimage resistance
   └─ No known practical attacks

2. High Entropy
   └─ code_verifier has minimum 256 bits of entropy
   └─ Brute force is computationally infeasible
   └─ Each flow uses a new random verifier

3. Binding
   └─ code_challenge is tied to the authorization request
   └─ Token exchange requires matching verifier
   └─ Provider stores challenge during auth flow

4. Single Use
   └─ Authorization codes are single-use
   └─ code_verifier is discarded after exchange
   └─ Replay attacks are prevented

Attack Scenarios and Mitigations:

| Attack                    | PKCE Mitigation                        |
|---------------------------|----------------------------------------|
| Code interception         | Attacker lacks code_verifier           |
| Brute force verifier      | 256+ bits entropy, infeasible          |
| Replay attack             | Codes are single-use                   |
| Man-in-the-middle         | TLS + code_verifier binding            |
| Malicious redirect        | Verifier stored in original client     |
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 4: IMPLEMENTATION
  // ============================================
  
  implementation: {
    title: '4. Implementation Details',
    sections: [
      {
        subtitle: '4.1 Generating PKCE Values',
        content: `
Code Verifier Generation:

Requirements (RFC 7636):
• Length: 43-128 characters
• Characters: [A-Za-z0-9-._~]
• Entropy: Minimum 256 bits

Implementation:
  function generateCodeVerifier(): string {
    const array = new Uint8Array(32); // 256 bits
    crypto.getRandomValues(array);
    return base64UrlEncode(array);
  }

Code Challenge Generation:

S256 Method (Required):
  async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(new Uint8Array(hash));
  }

Base64-URL Encoding:
  function base64UrlEncode(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\\+/g, '-')
      .replace(/\\//g, '_')
      .replace(/=+$/, '');
  }
        `.trim(),
      },
      {
        subtitle: '4.2 Authorization Request',
        content: `
Required Parameters:

GET /authorize
  ?response_type=code
  &client_id={client_id}
  &redirect_uri={redirect_uri}
  &scope={scopes}
  &state={state}                    // CSRF protection
  &code_challenge={code_challenge}  // PKCE
  &code_challenge_method=S256       // PKCE

Example URL:
https://auth.example.com/authorize
  ?response_type=code
  &client_id=spa_client_123
  &redirect_uri=https://myapp.com/callback
  &scope=openid%20email%20profile
  &state=abc123xyz
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256

State Parameter:
• Generated per request
• Stored locally (sessionStorage/memory)
• Verified on callback to prevent CSRF
• Should include timestamp for expiration
        `.trim(),
      },
      {
        subtitle: '4.3 Token Exchange',
        content: `
Token Request:

POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id={client_id}
&code={authorization_code}
&redirect_uri={redirect_uri}
&code_verifier={code_verifier}  // PKCE - the original verifier

Example:
POST https://auth.example.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id=spa_client_123
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://myapp.com/callback
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

Token Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "xRxGGEpVawiUak6He367W3oe...",
  "scope": "openid email profile",
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
        `.trim(),
      },
      {
        subtitle: '4.4 Token Refresh',
        content: `
Refresh Token Flow:

When the access_token expires, use the refresh_token to obtain a new one:

POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&client_id={client_id}
&refresh_token={refresh_token}

Note: PKCE is not used for refresh. The refresh_token itself is the proof.

Response:
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "NEW_xRxGGEpVawiUak6He367W3oe...",  // May be rotated
  "scope": "openid email profile"
}

Refresh Token Rotation:
Some providers rotate refresh tokens on each use:
• Old refresh token is invalidated
• New refresh token must be stored
• Prevents refresh token theft/replay

Best Practices:
• Store refresh tokens securely (HttpOnly cookies preferred)
• Implement token refresh before expiration (proactive)
• Handle refresh failure gracefully (re-authenticate)
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: SECURITY CONSIDERATIONS
  // ============================================
  
  security: {
    title: '5. Security Considerations',
    sections: [
      {
        subtitle: '5.1 Token Storage in SPAs',
        content: `
Token Storage Options:

| Storage          | XSS Risk | CSRF Risk | Persistence | Recommended |
|------------------|----------|-----------|-------------|-------------|
| Memory (variable)| Low      | N/A       | None        | ✓ Best      |
| sessionStorage   | Medium   | N/A       | Tab         | ✓ Acceptable|
| localStorage     | High     | N/A       | Permanent   | ✗ Avoid     |
| HttpOnly Cookie  | None     | Medium    | Configurable| ✓ Preferred |

Recommendation: In-Memory + Refresh via HttpOnly Cookie

1. Store access_token in memory only
2. Store refresh_token in HttpOnly, Secure, SameSite=Strict cookie
3. Use BFF (Backend-for-Frontend) pattern for sensitive operations
4. Implement silent refresh for token renewal

Memory Storage Pattern:
  class TokenManager {
    private accessToken: string | null = null;
    
    setToken(token: string) {
      this.accessToken = token;
    }
    
    getToken(): string | null {
      return this.accessToken;
    }
    
    clearToken() {
      this.accessToken = null;
    }
  }
        `.trim(),
      },
      {
        subtitle: '5.2 XSS Protection',
        content: `
Cross-Site Scripting (XSS) Mitigations:

1. Content Security Policy (CSP)
   Content-Security-Policy: 
     default-src 'self';
     script-src 'self';
     style-src 'self' 'unsafe-inline';
     img-src 'self' data:;
     connect-src 'self' https://auth.example.com;

2. Input Sanitization
   • Escape all user input before rendering
   • Use framework auto-escaping (React, Vue, Angular)
   • Avoid innerHTML and dangerouslySetInnerHTML

3. Subresource Integrity (SRI)
   <script src="https://cdn.example.com/lib.js"
           integrity="sha384-oqVuAfXRKap7..."
           crossorigin="anonymous"></script>

4. Token Handling
   • Never expose tokens in URLs
   • Never log tokens
   • Use short-lived access tokens
   • Implement token binding where supported

5. OAuth Response Handling
   • Validate state parameter before processing
   • Clear URL fragments containing tokens
   • Process tokens in isolated scope
        `.trim(),
      },
      {
        subtitle: '5.3 CSRF Protection',
        content: `
Cross-Site Request Forgery Protection:

1. State Parameter
   • Generate unique state per authorization request
   • Store state before redirect
   • Verify state in callback
   • Include timestamp for expiration

   State Generation:
     function generateState(): string {
       const random = crypto.getRandomValues(new Uint8Array(16));
       const timestamp = Date.now();
       return btoa(JSON.stringify({
         nonce: base64UrlEncode(random),
         ts: timestamp
       }));
     }

2. State Validation:
     function validateState(received: string, stored: string): boolean {
       if (received !== stored) return false;
       
       try {
         const parsed = JSON.parse(atob(received));
         const maxAge = 10 * 60 * 1000; // 10 minutes
         return Date.now() - parsed.ts < maxAge;
       } catch {
         return false;
       }
     }

3. SameSite Cookies
   • Use SameSite=Strict for refresh token cookies
   • Prevents cookies from being sent in cross-site requests
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 6: PROVIDER SPECIFICS
  // ============================================
  
  providerSpecifics: {
    title: '6. Provider-Specific Notes',
    sections: [
      {
        subtitle: '6.1 Google',
        content: `
Google OAuth 2.0 with PKCE:

Authorization Endpoint:
  https://accounts.google.com/o/oauth2/v2/auth

Token Endpoint:
  https://oauth2.googleapis.com/token

Special Parameters:
  • access_type=offline - Required for refresh tokens
  • prompt=consent - Force consent screen (ensures refresh token)

Example:
  GET https://accounts.google.com/o/oauth2/v2/auth
    ?client_id={client_id}
    &redirect_uri={redirect_uri}
    &response_type=code
    &scope=openid%20email%20profile
    &code_challenge={code_challenge}
    &code_challenge_method=S256
    &access_type=offline
    &prompt=consent

Notes:
  • Refresh tokens only issued with access_type=offline
  • First authorization must include prompt=consent
  • Scopes are granular (can request individual APIs)
        `.trim(),
      },
      {
        subtitle: '6.2 Microsoft / Azure AD',
        content: `
Microsoft Identity Platform with PKCE:

Authorization Endpoint (v2.0):
  https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize

Token Endpoint:
  https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token

Tenant Options:
  • "common" - Any Microsoft account or Azure AD
  • "organizations" - Azure AD accounts only
  • "consumers" - Personal Microsoft accounts only
  • {tenant-id} - Specific Azure AD tenant

Special Parameters:
  • response_mode=query (default) or fragment
  • prompt=consent / login / select_account / none

Example:
  GET https://login.microsoftonline.com/common/oauth2/v2.0/authorize
    ?client_id={client_id}
    &redirect_uri={redirect_uri}
    &response_type=code
    &scope=openid%20email%20profile%20User.Read
    &code_challenge={code_challenge}
    &code_challenge_method=S256

Notes:
  • Refresh tokens issued by default for offline_access scope
  • Supports incremental consent
  • Graph API scopes require User.Read at minimum
        `.trim(),
      },
      {
        subtitle: '6.3 Auth0',
        content: `
Auth0 with PKCE:

Authorization Endpoint:
  https://{domain}/authorize

Token Endpoint:
  https://{domain}/oauth/token

Special Parameters:
  • audience - Required for API access tokens
  • connection - Skip to specific identity provider

Example:
  GET https://your-domain.auth0.com/authorize
    ?client_id={client_id}
    &redirect_uri={redirect_uri}
    &response_type=code
    &scope=openid%20email%20profile%20offline_access
    &audience=https://api.yourapp.com
    &code_challenge={code_challenge}
    &code_challenge_method=S256

Notes:
  • audience is required for non-opaque access tokens
  • offline_access scope required for refresh tokens
  • Supports custom domains
  • Universal Login recommended over embedded
        `.trim(),
      },
    ],
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportOAuthPkceWhitepaperAsMarkdown(): string {
  const wp = OAUTH_PKCE_WHITEPAPER;
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
  markdown += `${wp.executiveSummary.content}\n\n`;

  // Problem Statement
  markdown += `## ${wp.problemStatement.title}\n\n`;
  for (const section of wp.problemStatement.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // PKCE Solution
  markdown += `## ${wp.pkceSolution.title}\n\n`;
  for (const section of wp.pkceSolution.sections) {
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

  // Provider Specifics
  markdown += `## ${wp.providerSpecifics.title}\n\n`;
  for (const section of wp.providerSpecifics.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  return markdown;
}

export default OAUTH_PKCE_WHITEPAPER;
