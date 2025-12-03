// ============================================
// PROTOCOL OS - OAUTH IMPLICIT WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.4.c
// Purpose: Technical specification for OAuth 2.0 Implicit Grant (Deprecated)
// ============================================

/**
 * Whitepaper: OAuth 2.0 Implicit Grant Flow (DEPRECATED)
 * 
 * Legacy Authentication for Browser-Based Applications
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 * 
 * ⚠️ DEPRECATION STATUS: This flow is deprecated and should not be used
 * for new implementations. Use OAuth 2.0 with PKCE instead.
 */

export const OAUTH_IMPLICIT_WHITEPAPER = {
  metadata: {
    title: 'OAuth 2.0 Implicit Grant: Legacy Flow (DEPRECATED)',
    subtitle: 'Technical Specification and Security Analysis',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    status: 'Deprecated',
    rfc: 'RFC 6749 Section 4.2 (Deprecated by RFC 9700)',
    deprecationNotice: 'Implicit Grant is deprecated. Use PKCE for browser-based apps.',
  },

  // ============================================
  // SECTION 1: DEPRECATION NOTICE
  // ============================================
  
  deprecationNotice: {
    title: '⚠️ DEPRECATION NOTICE',
    content: `
╔══════════════════════════════════════════════════════════════════════════════╗
║                         ⚠️  DEPRECATION WARNING  ⚠️                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  The OAuth 2.0 Implicit Grant is DEPRECATED as of:                          ║
║                                                                              ║
║  • OAuth 2.0 Security Best Current Practice (RFC 9700)                      ║
║  • OAuth 2.1 Draft Specification                                            ║
║                                                                              ║
║  This flow is included in Protocol OS ONLY for legacy system                ║
║  compatibility. Do NOT use for new implementations.                          ║
║                                                                              ║
║  RECOMMENDED ALTERNATIVE:                                                    ║
║  ┌────────────────────────────────────────────────────────────────────────┐ ║
║  │  OAuth 2.0 Authorization Code Flow with PKCE (Module 1.3.2)            │ ║
║  │  • Same security as Implicit for public clients                         │ ║
║  │  • Supports refresh tokens                                              │ ║
║  │  • Tokens not exposed in URL                                            │ ║
║  │  • Widely supported by all modern providers                             │ ║
║  └────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `.trim(),
  },

  // ============================================
  // SECTION 2: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
The OAuth 2.0 Implicit Grant was designed in 2012 for browser-based applications
(SPAs) when the Authorization Code flow was considered unsuitable for public
clients. It returns the access_token directly in the URL fragment.

Historical Context:
• Created before PKCE existed (PKCE: RFC 7636, 2015)
• Designed when SPAs couldn't perform secure token exchange
• Intended for short-lived, read-only access tokens
• Never intended for long-term or privileged access

Why It's Deprecated:
• Access tokens exposed in URL fragment
• Tokens leak via browser history, logs, Referer headers
• No refresh tokens (user must re-authenticate frequently)
• Vulnerable to token injection and interception attacks
• PKCE provides equivalent functionality with better security

Current Status:
• OAuth 2.1 removes Implicit Grant entirely
• Major providers (Google, Microsoft, etc.) recommend PKCE
• Still supported for backward compatibility
• Should NOT be used for new implementations

This document serves as:
1. Reference for maintaining legacy integrations
2. Security analysis for risk assessment
3. Migration guide to PKCE
    `.trim(),
  },

  // ============================================
  // SECTION 3: HOW IMPLICIT FLOW WORKS
  // ============================================
  
  flowDescription: {
    title: '2. How Implicit Flow Works',
    sections: [
      {
        subtitle: '2.1 Flow Overview',
        content: `
Implicit Grant Flow:

┌──────────┐                              ┌──────────┐
│  Browser │                              │  OAuth   │
│   (SPA)  │                              │ Provider │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │ 1. User clicks "Login"                  │
     │                                         │
     │ 2. Redirect to authorization endpoint   │
     │    response_type=token                  │
     │────────────────────────────────────────▶│
     │                                         │
     │ 3. User authenticates                   │
     │                                         │
     │ 4. User consents to permissions         │
     │                                         │
     │ 5. Redirect with token in FRAGMENT      │
     │    #access_token=...&token_type=Bearer  │
     │◀────────────────────────────────────────│
     │                                         │
     │ 6. JavaScript extracts token from       │
     │    window.location.hash                 │
     │                                         │
     │ 7. Use token for API requests           │
     │────────────────────────────────────────▶│
     │                                         │
     ▼                                         ▼

Key Characteristics:
• No intermediate authorization code
• Token returned directly in URL fragment
• No token exchange step
• No client secret (public client)
• No refresh token
        `.trim(),
      },
      {
        subtitle: '2.2 URL Fragment vs Query String',
        content: `
Why URL Fragment (#) Instead of Query String (?):

URL Fragment:
  https://yourapp.com/callback#access_token=abc123&token_type=Bearer

Query String:
  https://yourapp.com/callback?access_token=abc123&token_type=Bearer

The fragment (#) was chosen because:

1. Fragment is NOT sent to the server
   ┌─────────────────────────────────────────────────────────────────────┐
   │  GET /callback HTTP/1.1                                             │
   │  Host: yourapp.com                                                  │
   │                                                                      │
   │  ❌ Server does NOT see #access_token=...                           │
   │  ✓  Only client-side JavaScript can access it                       │
   └─────────────────────────────────────────────────────────────────────┘

2. Fragment is NOT included in Referer header (mostly)
   • If user clicks a link, token won't leak to next site
   • However, this protection is incomplete

3. Fragment doesn't cause server-side logging
   • Token won't appear in server access logs
   • But may appear in client-side analytics

⚠️ HOWEVER, fragments CAN leak via:
   • Browser history
   • Browser extensions
   • Screen sharing/recording
   • Shoulder surfing
   • Copy/paste accidents
   • Some analytics tools
        `.trim(),
      },
      {
        subtitle: '2.3 Authorization Request',
        content: `
Implicit Authorization Request:

GET {authorization_endpoint}
  ?response_type=token                    ← Request token directly
  &client_id={client_id}
  &redirect_uri={redirect_uri}
  &scope={scopes}
  &state={state}
  &nonce={nonce}                          ← Required for OpenID

Example:
https://accounts.google.com/o/oauth2/v2/auth
  ?response_type=token
  &client_id=123456789.apps.googleusercontent.com
  &redirect_uri=https://myapp.com/callback
  &scope=openid%20email%20profile
  &state=abc123xyz
  &nonce=n-0S6_WzA2Mj

Response Types:

| response_type    | Returns                    |
|------------------|----------------------------|
| token            | access_token only          |
| token id_token   | access_token + id_token    |
| id_token token   | Same as above              |
| id_token         | id_token only (OpenID)     |

State Parameter:
• Random string for CSRF protection
• MUST be validated on callback
• Same importance as in Authorization Code flow

Nonce Parameter (OpenID Connect):
• Required when requesting id_token
• Prevents replay attacks
• Must be validated in id_token claims
        `.trim(),
      },
      {
        subtitle: '2.4 Callback Response',
        content: `
Successful Response (in URL fragment):

https://yourapp.com/callback
  #access_token=eyJhbGciOiJSUzI1NiIs...
  &token_type=Bearer
  &expires_in=3600
  &state=abc123xyz
  &scope=openid%20email%20profile
  &id_token=eyJhbGciOiJSUzI1NiIs...    ← If requested

Parsing the Fragment in JavaScript:

  function parseFragment(hash) {
    const params = {};
    hash.substring(1).split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    });
    return params;
  }

  const token = parseFragment(window.location.hash);
  
  // IMPORTANT: Clear the fragment immediately!
  window.history.replaceState(null, '', window.location.pathname);

Error Response:

https://yourapp.com/callback
  #error=access_denied
  &error_description=User%20denied%20access
  &state=abc123xyz

Common Errors:
| Error                    | Description                     |
|--------------------------|---------------------------------|
| access_denied            | User denied authorization       |
| invalid_request          | Missing required parameter      |
| unauthorized_client      | Client not allowed implicit     |
| unsupported_response_type| Provider doesn't support token  |
| invalid_scope            | Unknown or invalid scope        |
| server_error             | Provider error                  |
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 4: SECURITY VULNERABILITIES
  // ============================================
  
  securityVulnerabilities: {
    title: '3. Security Vulnerabilities',
    sections: [
      {
        subtitle: '3.1 Token Leakage via Browser History',
        content: `
Vulnerability: Token Exposure in Browser History

When a user completes Implicit flow, the full URL including the token
is saved in browser history:

Browser History Entry:
┌─────────────────────────────────────────────────────────────────────────┐
│  🔓 https://myapp.com/callback#access_token=eyJhbGciOiJSUzI1NiIs...    │
│     Visited: Dec 3, 2024 at 10:30 AM                                    │
└─────────────────────────────────────────────────────────────────────────┘

Attack Scenarios:

1. Shared Computer
   └─ Next user opens browser history
   └─ Copies token from URL
   └─ Uses token to impersonate victim

2. History Sync
   └─ Chrome syncs history across devices
   └─ Attacker compromises any synced device
   └─ Retrieves tokens from history

3. Browser Extension
   └─ Malicious extension reads history
   └─ Exfiltrates tokens to attacker server

4. Forensic Analysis
   └─ History survives "sign out"
   └─ Can be recovered from disk

Mitigation (Incomplete):
  // Clear fragment immediately after parsing
  window.history.replaceState(null, '', window.location.pathname);
  
  // But history entry may already exist!
        `.trim(),
      },
      {
        subtitle: '3.2 Token Leakage via Referer Header',
        content: `
Vulnerability: Token Exposure in HTTP Referer

Although fragments are generally not included in Referer headers,
certain scenarios can leak the token:

Scenario 1: External Link Click
┌─────────────────────────────────────────────────────────────────────────┐
│  User is on: https://myapp.com/dashboard#access_token=secret123        │
│                                                                          │
│  User clicks: <a href="https://external-site.com">Click here</a>       │
│                                                                          │
│  External site receives:                                                 │
│  Referer: https://myapp.com/dashboard                                   │
│                                                                          │
│  ✓ Token NOT leaked (fragment excluded)                                 │
└─────────────────────────────────────────────────────────────────────────┘

Scenario 2: Same-Origin Navigation (LEAKED!)
┌─────────────────────────────────────────────────────────────────────────┐
│  User is on: https://myapp.com/callback#access_token=secret123         │
│                                                                          │
│  JavaScript navigates: window.location = '/api/data';                   │
│                                                                          │
│  Server log: GET /api/data                                              │
│              Referer: /callback#access_token=secret123 ← LEAKED!       │
└─────────────────────────────────────────────────────────────────────────┘

Scenario 3: Embedded Resources
┌─────────────────────────────────────────────────────────────────────────┐
│  Page with token in URL loads:                                          │
│  <img src="https://analytics.com/pixel.gif">                           │
│                                                                          │
│  Analytics server may receive fragment in some browsers                 │
└─────────────────────────────────────────────────────────────────────────┘

Mitigation:
  // Always navigate AFTER clearing fragment
  window.history.replaceState(null, '', window.location.pathname);
  // THEN make any navigation or resource requests
        `.trim(),
      },
      {
        subtitle: '3.3 Token Injection Attack',
        content: `
Vulnerability: Attacker Injects Their Token

In Implicit flow, there's no way to verify the token was issued for
the current authorization request (unlike PKCE's code_verifier).

Attack Flow:
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Attacker │    │  Victim  │    │ Malicious│    │   Your   │
│          │    │          │    │   App    │    │   App    │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. Attacker gets their own token              │
     │   (legitimate OAuth flow)                     │
     │───────────────────────────────────────────────│
     │               │               │               │
     │ 2. Attacker crafts URL:                       │
     │   https://yourapp.com/callback                │
     │   #access_token=ATTACKER_TOKEN                │
     │               │               │               │
     │ 3. Trick victim to visit URL  │               │
     │──────────────▶│               │               │
     │               │               │               │
     │               │ 4. Victim's app              │
     │               │   accepts attacker's token   │
     │               │──────────────────────────────▶│
     │               │               │               │
     │               │ 5. Victim now authenticated  │
     │               │   as attacker's account!     │
     │               │               │               │

Why PKCE Prevents This:
• code_verifier is generated locally before redirect
• Only the original client has the verifier
• Server verifies challenge matches verifier
• Injected code cannot be exchanged

Partial Mitigation with state:
• Validates request came from expected flow
• But attacker can steal victim's state from history/logs
        `.trim(),
      },
      {
        subtitle: '3.4 No Refresh Tokens',
        content: `
Limitation: Users Must Re-authenticate Frequently

Implicit flow does NOT support refresh tokens because:

1. Security by Design
   • Refresh tokens are long-lived secrets
   • Storing them in browser is too risky
   • If token leaks, impact should be limited

2. Short Token Lifetime
   • Implicit tokens typically expire in 1 hour
   • User must re-authenticate to continue
   • Poor user experience for long sessions

Impact on Applications:

┌─────────────────────────────────────────────────────────────────────────┐
│                        Token Lifecycle                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Authorization Code + PKCE:                                              │
│  ├─ access_token: 1 hour                                                │
│  ├─ refresh_token: 30 days                                              │
│  └─ User re-authenticates: Once per 30 days                            │
│                                                                          │
│  Implicit Flow:                                                          │
│  ├─ access_token: 1 hour                                                │
│  ├─ refresh_token: None                                                 │
│  └─ User re-authenticates: Every hour! (or session end)                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

Workarounds (All Problematic):
1. Silent iframe refresh (broken by third-party cookie restrictions)
2. Longer token lifetime (increases security risk)
3. Session cookies (defeats OAuth purpose)
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: MIGRATION TO PKCE
  // ============================================
  
  migrationGuide: {
    title: '4. Migration to PKCE',
    sections: [
      {
        subtitle: '4.1 Why Migrate',
        content: `
Benefits of Migrating from Implicit to PKCE:

┌─────────────────────┬─────────────────────┬─────────────────────────────┐
│ Feature             │ Implicit            │ PKCE                        │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ Token in URL        │ Yes (fragment)      │ No (POST response)          │
│ Refresh Tokens      │ No                  │ Yes                         │
│ Token Injection     │ Vulnerable          │ Protected                   │
│ Browser History     │ Token leaked        │ Only code leaked            │
│ Referer Leakage     │ Possible            │ Minimal (code is useless)   │
│ Token Lifetime      │ Short (no refresh)  │ Long (with refresh)         │
│ User Experience     │ Frequent re-auth    │ Seamless refresh            │
│ Standard Status     │ Deprecated          │ Recommended                 │
│ OAuth 2.1           │ Removed             │ Required                    │
└─────────────────────┴─────────────────────┴─────────────────────────────┘

Migration is:
• ✓ Security improvement
• ✓ Better user experience
• ✓ Future-proof (OAuth 2.1 compliance)
• ✓ Same client-side complexity
        `.trim(),
      },
      {
        subtitle: '4.2 Migration Steps',
        content: `
Step-by-Step Migration:

1. Check Provider Support
   └─ Verify your OAuth provider supports PKCE
   └─ Most providers have supported PKCE since 2017+

2. Update response_type
   - response_type=token           (Implicit)
   + response_type=code            (PKCE)

3. Add PKCE Parameters
   + code_challenge={SHA256(code_verifier)}
   + code_challenge_method=S256

4. Generate PKCE Values
   const verifier = generateCodeVerifier();
   const challenge = await generateCodeChallenge(verifier);
   // Store verifier in sessionStorage

5. Handle Callback Differently
   - // Parse token from #fragment
   + // Parse code from ?query
   + // Exchange code for tokens via POST

6. Update Token Storage
   - // Token from URL
   + // Token from JSON response
   + // Also store refresh_token

7. Implement Token Refresh
   + // Check expiration before requests
   + // Use refresh_token to get new tokens

8. Test Thoroughly
   └─ Test full auth flow
   └─ Test token refresh
   └─ Test expiration handling
   └─ Verify no regression
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 6: WHEN IMPLICIT IS ACCEPTABLE
  // ============================================
  
  acceptableUseCases: {
    title: '5. When Implicit Might Be Acceptable',
    content: `
While PKCE is always preferred, Implicit MAY be acceptable in these scenarios:

1. Legacy System Compatibility
   ┌─────────────────────────────────────────────────────────────────────┐
   │  • Provider doesn't support PKCE (rare now)                         │
   │  • Integration with legacy enterprise system                        │
   │  • Cannot update old application code                               │
   │  • Temporary while planning migration                               │
   └─────────────────────────────────────────────────────────────────────┘

2. Extremely Low-Risk Scenarios
   ┌─────────────────────────────────────────────────────────────────────┐
   │  • Read-only, public data                                           │
   │  • Demo or prototype applications                                   │
   │  • No sensitive user data                                           │
   │  • Very short sessions (< 5 minutes)                               │
   └─────────────────────────────────────────────────────────────────────┘

3. Internal/Trusted Environments
   ┌─────────────────────────────────────────────────────────────────────┐
   │  • Internal tools with network isolation                            │
   │  • Fully trusted user base                                          │
   │  • Strong network-level security                                    │
   └─────────────────────────────────────────────────────────────────────┘

⚠️ Even in these cases, consider:
• Planning migration to PKCE
• Documenting the security trade-offs
• Implementing all available mitigations
• Monitoring for abuse
• Using shortest possible token lifetime
    `.trim(),
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportOAuthImplicitWhitepaperAsMarkdown(): string {
  const wp = OAUTH_IMPLICIT_WHITEPAPER;
  let markdown = '';

  // Title
  markdown += `# ${wp.metadata.title}\n\n`;
  markdown += `**${wp.metadata.subtitle}**\n\n`;
  markdown += `Version: ${wp.metadata.version} | `;
  markdown += `RFC: ${wp.metadata.rfc} | `;
  markdown += `Status: **${wp.metadata.status}** | `;
  markdown += `Last Updated: ${wp.metadata.lastUpdated}\n\n`;
  markdown += `---\n\n`;

  // Deprecation Notice
  markdown += `## ${wp.deprecationNotice.title}\n\n`;
  markdown += `\`\`\`\n${wp.deprecationNotice.content}\n\`\`\`\n\n`;

  // Executive Summary
  markdown += `## ${wp.executiveSummary.title}\n\n`;
  markdown += `\`\`\`\n${wp.executiveSummary.content}\n\`\`\`\n\n`;

  // Flow Description
  markdown += `## ${wp.flowDescription.title}\n\n`;
  for (const section of wp.flowDescription.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Security Vulnerabilities
  markdown += `## ${wp.securityVulnerabilities.title}\n\n`;
  for (const section of wp.securityVulnerabilities.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Migration Guide
  markdown += `## ${wp.migrationGuide.title}\n\n`;
  for (const section of wp.migrationGuide.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Acceptable Use Cases
  markdown += `## ${wp.acceptableUseCases.title}\n\n`;
  markdown += `\`\`\`\n${wp.acceptableUseCases.content}\n\`\`\`\n\n`;

  return markdown;
}

/**
 * Get deprecation info for display
 */
export function getImplicitDeprecationInfo(): {
  isDeprecated: boolean;
  alternativeModule: string;
  reasons: string[];
  migrationDifficulty: 'easy' | 'moderate' | 'complex';
} {
  return {
    isDeprecated: true,
    alternativeModule: '1.3.2 (OAuth PKCE)',
    reasons: [
      'Tokens exposed in URL fragment',
      'No refresh token support',
      'Vulnerable to token injection',
      'Removed in OAuth 2.1',
      'All major providers recommend PKCE',
    ],
    migrationDifficulty: 'easy',
  };
}

export default OAUTH_IMPLICIT_WHITEPAPER;
