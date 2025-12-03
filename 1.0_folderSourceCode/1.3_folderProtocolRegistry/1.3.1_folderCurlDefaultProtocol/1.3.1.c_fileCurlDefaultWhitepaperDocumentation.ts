// ============================================
// PROTOCOL OS - CURL DEFAULT WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.1.c
// Purpose: Technical specification and design rationale for cURL Default Protocol
// ============================================

/**
 * Whitepaper: cURL Default Protocol
 * 
 * The Universal API Adapter for Protocol OS
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 */

export const CURL_DEFAULT_WHITEPAPER = {
  metadata: {
    title: 'cURL Default Protocol: The Universal API Adapter',
    subtitle: 'Technical Specification and Design Rationale',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    status: 'Stable',
  },

  // ============================================
  // SECTION 1: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
The cURL Default Protocol serves as the foundational adapter layer in Protocol OS,
enabling integration with any HTTP-based API through familiar cURL command syntax.
By accepting raw cURL commands as configuration input, this protocol eliminates the
need for API-specific adapters while maintaining full flexibility and control.

Key Innovation:
Rather than building individual integrations for each API, the cURL Default Protocol
inverts the integration model. Users provide the exact cURL command that works for
their API, and Protocol OS handles execution, placeholder substitution, error handling,
and retry logic automatically.

This approach offers several advantages:
• Zero Learning Curve: Developers already know cURL
• Universal Compatibility: Any HTTP API can be integrated
• Copy-Paste Configuration: Commands from API docs work directly
• Dynamic Templating: Placeholder system for runtime value injection
• Production-Ready: Built-in retry, timeout, and error handling
    `.trim(),
  },

  // ============================================
  // SECTION 2: DESIGN PHILOSOPHY
  // ============================================
  
  designPhilosophy: {
    title: '2. Design Philosophy',
    sections: [
      {
        subtitle: '2.1 The cURL Lingua Franca',
        content: `
cURL has become the de facto standard for documenting and sharing API requests.
Every API documentation includes cURL examples. Every developer knows cURL syntax.
By choosing cURL as our input format, we tap into this universal knowledge base.

The cURL Default Protocol treats cURL commands not as commands to execute directly,
but as templates to parse, transform, and execute through a managed pipeline.
        `.trim(),
      },
      {
        subtitle: '2.2 Template-Based Execution',
        content: `
Static cURL commands are limited. Real-world usage requires dynamic values:
access tokens, user IDs, timestamps, and more. Our placeholder system
(using {{placeholder}} syntax) transforms static commands into reusable templates.

Example transformation:
  Input:  curl -H "Authorization: Bearer {{token}}" https://api.example.com/users/{{user_id}}
  Values: { token: "abc123", user_id: "42" }
  Output: curl -H "Authorization: Bearer abc123" https://api.example.com/users/42

This maintains the readability of cURL while enabling programmatic execution.
        `.trim(),
      },
      {
        subtitle: '2.3 Fail-Safe Execution',
        content: `
API calls fail. Networks are unreliable. Servers return errors. The cURL Default
Protocol is designed with failure as the expected case:

• Configurable timeouts prevent hanging requests
• Automatic retry with exponential backoff handles transient failures
• Detailed error classification enables appropriate error handling
• Request/response logging supports debugging and auditing
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 3: ARCHITECTURE
  // ============================================
  
  architecture: {
    title: '3. Architecture',
    sections: [
      {
        subtitle: '3.1 Component Overview',
        content: `
┌─────────────────────────────────────────────────────────────────┐
│                    cURL Default Protocol                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Command    │───▶│  Placeholder │───▶│   Request    │       │
│  │   Parser     │    │  Substituter │    │   Builder    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Parsed     │    │   Resolved   │    │   HTTP       │       │
│  │   Command    │    │   Template   │    │   Request    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                 │                │
│                                                 ▼                │
│                           ┌──────────────────────────────┐      │
│                           │      Execution Engine        │      │
│                           │  ┌────────┐  ┌────────────┐  │      │
│                           │  │ Retry  │  │  Timeout   │  │      │
│                           │  │ Logic  │  │  Handler   │  │      │
│                           │  └────────┘  └────────────┘  │      │
│                           └──────────────────────────────┘      │
│                                         │                        │
│                                         ▼                        │
│                           ┌──────────────────────────────┐      │
│                           │      Response Handler        │      │
│                           │  • Parse JSON/XML/Text       │      │
│                           │  • Extract metrics           │      │
│                           │  • Build result object       │      │
│                           └──────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '3.2 Command Parser',
        content: `
The Command Parser transforms raw cURL syntax into a structured representation:

Input:
  curl -X POST 'https://api.example.com/data' \\
    -H 'Authorization: Bearer token123' \\
    -H 'Content-Type: application/json' \\
    -d '{"key": "value"}'

Output (ParsedCurlCommand):
  {
    method: 'POST',
    url: 'https://api.example.com/data',
    headers: {
      'Authorization': 'Bearer token123',
      'Content-Type': 'application/json'
    },
    body: '{"key": "value"}'
  }

Supported cURL flags:
  -X, --request     HTTP method
  -H, --header      Request header
  -d, --data        Request body
  --data-raw        Raw request body (no processing)
  --data-binary     Binary request body
  -u, --user        Basic auth credentials
  -A, --user-agent  User-Agent header
  -k, --insecure    Disable SSL verification
  -L, --location    Follow redirects
  --connect-timeout Connection timeout
  -m, --max-time    Maximum time allowed
        `.trim(),
      },
      {
        subtitle: '3.3 Placeholder System',
        content: `
Placeholders enable dynamic value injection into static command templates.

Syntax: {{placeholder_name}}

Rules:
• Placeholder names are case-sensitive
• Names can contain letters, numbers, underscores, and hyphens
• Nested placeholders are not supported
• Unresolved placeholders remain as-is (with warning)

Substitution Order:
1. URL placeholders
2. Header placeholders
3. Body placeholders
4. Query parameter placeholders

Special Placeholders:
• {{$timestamp}}     - Current Unix timestamp
• {{$uuid}}          - Generated UUID v4
• {{$random}}        - Random alphanumeric string
• {{$date}}          - Current date (ISO 8601)
• {{$datetime}}      - Current datetime (ISO 8601)

Security Considerations:
• Placeholder values are sanitized before logging
• Sensitive placeholders (containing 'token', 'key', 'secret', etc.) are masked
• Values are URL-encoded when appearing in URLs
• JSON values are properly escaped when in body
        `.trim(),
      },
      {
        subtitle: '3.4 Execution Engine',
        content: `
The Execution Engine handles the actual HTTP request with production-grade reliability.

Timeout Handling:
┌─────────────────────────────────────────────────────────────┐
│ Request Timeline                                             │
├─────────────────────────────────────────────────────────────┤
│ 0ms        5000ms      15000ms     25000ms     30000ms      │
│ │───────────│───────────│───────────│───────────│           │
│ │ DNS       │ TCP       │ TLS       │ Response  │ Timeout   │
│ │ Lookup    │ Connect   │ Handshake │ Transfer  │ (default) │
│ └───────────┴───────────┴───────────┴───────────┴───────────│
└─────────────────────────────────────────────────────────────┘

Retry Strategy:
• Trigger: Network errors, timeouts, 5xx responses
• No Retry: 4xx responses (client errors)
• Backoff: Exponential with jitter
• Formula: delay = baseDelay * 2^attempt * (0.5 + random(0.5))

Example with maxRetries=3, baseDelay=1000ms:
  Attempt 1: Failed → Wait ~1000ms
  Attempt 2: Failed → Wait ~2000ms
  Attempt 3: Failed → Wait ~4000ms
  Attempt 4: Final failure
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 4: API REFERENCE
  // ============================================
  
  apiReference: {
    title: '4. API Reference',
    sections: [
      {
        subtitle: '4.1 CurlDefaultHandshakeExecutor',
        content: `
The main class for cURL command execution.

Constructor:
  new CurlDefaultHandshakeExecutor(options?: CurlExecutionOptions)

Options:
  timeout           number    Request timeout in ms (default: 30000)
  followRedirects   boolean   Follow HTTP redirects (default: true)
  maxRedirects      number    Maximum redirects to follow (default: 5)
  retryOnFailure    boolean   Enable automatic retry (default: true)
  maxRetries        number    Maximum retry attempts (default: 3)
  retryDelay        number    Base retry delay in ms (default: 1000)
  validateSsl       boolean   Validate SSL certificates (default: true)
  verbose           boolean   Enable verbose logging (default: false)

Methods:
  authenticate(credentials)     Configure the executor with credentials
  executeRequest(context)       Execute a request with the configured command
  healthCheck(credentials)      Check if configuration is valid
  extractPlaceholders(command)  Get list of placeholders in a command
  generateCommandPreview(...)   Preview command with substituted values
        `.trim(),
      },
      {
        subtitle: '4.2 ProtocolExecutionResult',
        content: `
Result object returned from executeRequest().

interface ProtocolExecutionResult {
  success: boolean;           // Whether request succeeded (2xx status)
  statusCode: number;         // HTTP status code
  headers: Record<string, string>;  // Response headers
  body: unknown;              // Parsed response body
  rawBody: string;            // Raw response body string
  durationMs: number;         // Total execution time
  credentialsRefreshed: boolean;  // Whether tokens were refreshed
  error?: string;             // Error message if failed
  errorCode?: string;         // Error classification
  retry?: {                   // Retry information
    attempted: boolean;
    count: number;
    reason?: string;
  };
}
        `.trim(),
      },
      {
        subtitle: '4.3 Error Codes',
        content: `
Standard error codes returned in errorCode field:

NO_COMMAND        No cURL command configured
PARSE_ERROR       Failed to parse cURL command
NETWORK_ERROR     Network connectivity issue
TIMEOUT           Request timeout exceeded
DNS_ERROR         DNS resolution failed
SSL_ERROR         SSL/TLS certificate error
REDIRECT_ERROR    Too many redirects
CLIENT_ERROR      4xx HTTP response
SERVER_ERROR      5xx HTTP response
UNKNOWN           Unclassified error
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: SECURITY
  // ============================================
  
  security: {
    title: '5. Security Considerations',
    sections: [
      {
        subtitle: '5.1 Credential Handling',
        content: `
Credentials (API keys, tokens, passwords) require careful handling:

Storage:
• Credentials are stored encrypted in the database layer
• In-memory credentials are cleared after use
• No credentials are written to logs

Transmission:
• All requests use HTTPS by default
• SSL certificate validation is enabled by default
• Disabling SSL validation requires explicit configuration

Display:
• Sensitive values are masked in UI (show first/last 4 chars)
• getMaskedCredentials() method for safe logging
• Copy operations require explicit user action
        `.trim(),
      },
      {
        subtitle: '5.2 Input Validation',
        content: `
All inputs are validated before use:

cURL Command:
• Maximum length: 100,000 characters
• Blocked protocols: file://, ftp://, gopher://
• Required: Valid URL in command

Placeholder Values:
• Maximum key length: 256 characters
• Maximum value length: 100,000 characters
• No code injection possible (values are treated as strings)

URLs:
• Must be valid URL format
• Private IP ranges blocked by default
• Localhost only allowed in development mode
        `.trim(),
      },
      {
        subtitle: '5.3 Audit Logging',
        content: `
All executions are logged for security auditing:

Logged Information:
• Timestamp
• Handshake ID
• Request method and URL (no query params with secrets)
• Response status code
• Execution duration
• Error details (no sensitive data)

Not Logged:
• Full request/response bodies (configurable)
• Authorization headers
• API keys and tokens
• Placeholder values
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 6: BEST PRACTICES
  // ============================================
  
  bestPractices: {
    title: '6. Best Practices',
    sections: [
      {
        subtitle: '6.1 Command Design',
        content: `
Writing effective cURL command templates:

DO:
• Use descriptive placeholder names: {{user_access_token}} not {{t}}
• Include Content-Type header for POST/PUT/PATCH requests
• Use single quotes around URLs and headers
• Format multiline commands with backslash continuation

DON'T:
• Hardcode credentials in commands (use placeholders)
• Include unnecessary flags
• Use complex shell features (pipes, redirects, variables)
• Rely on environment variables
        `.trim(),
      },
      {
        subtitle: '6.2 Error Handling',
        content: `
Robust error handling strategies:

1. Check success field first:
   if (!result.success) {
     // Handle error
   }

2. Classify errors by code:
   switch (result.errorCode) {
     case 'TIMEOUT':
       // Maybe increase timeout
       break;
     case 'CLIENT_ERROR':
       // Check statusCode for specific handling
       break;
   }

3. Use retry information:
   if (result.retry?.attempted) {
     console.log(\`Failed after \${result.retry.count} retries\`);
   }

4. Log sanitized details:
   console.error(executor.getSanitizedCredentials(credentials));
        `.trim(),
      },
      {
        subtitle: '6.3 Performance Optimization',
        content: `
Optimizing cURL command execution:

Timeouts:
• Set appropriate timeout for API response time
• Use shorter timeout for status checks
• Consider network latency in timeout calculation

Retries:
• Disable retries for idempotent operations
• Use lower maxRetries for time-sensitive requests
• Increase retryDelay for rate-limited APIs

Caching:
• Cache parsed commands (automatically done)
• Cache placeholder extraction results
• Consider response caching at application level

Connection Reuse:
• The fetch API handles connection pooling
• Avoid creating new executor instances per request
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 7: EXAMPLES
  // ============================================
  
  examples: {
    title: '7. Examples',
    sections: [
      {
        subtitle: '7.1 Basic GET Request',
        content: `
cURL Command:
  curl 'https://api.example.com/users/{{user_id}}' \\
    -H 'Authorization: Bearer {{access_token}}'

Placeholder Values:
  {
    "user_id": "123",
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
  }

Result:
  GET https://api.example.com/users/123
  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
        `.trim(),
      },
      {
        subtitle: '7.2 POST with JSON Body',
        content: `
cURL Command:
  curl -X POST 'https://api.example.com/orders' \\
    -H 'Authorization: Bearer {{access_token}}' \\
    -H 'Content-Type: application/json' \\
    -d '{
      "product_id": "{{product_id}}",
      "quantity": {{quantity}},
      "customer": "{{customer_name}}"
    }'

Placeholder Values:
  {
    "access_token": "token123",
    "product_id": "SKU-001",
    "quantity": "2",
    "customer_name": "John Doe"
  }

Result:
  POST https://api.example.com/orders
  Body: {"product_id": "SKU-001", "quantity": 2, "customer": "John Doe"}
        `.trim(),
      },
      {
        subtitle: '7.3 Multi-Environment Setup',
        content: `
cURL Command (unchanged across environments):
  curl -X GET 'https://api.example.com/v1/data' \\
    -H 'X-API-Key: {{api_key}}'

Development Placeholders:
  { "api_key": "dev_key_xxxxx" }

Production Placeholders:
  { "api_key": "prod_key_yyyyy" }

Base URL Override (optional):
  Development: https://dev-api.example.com
  Production: https://api.example.com

The same cURL template works across all environments.
        `.trim(),
      },
    ],
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportWhitepaperAsMarkdown(): string {
  const wp = CURL_DEFAULT_WHITEPAPER;
  let markdown = '';

  // Title
  markdown += `# ${wp.metadata.title}\n\n`;
  markdown += `**${wp.metadata.subtitle}**\n\n`;
  markdown += `Version: ${wp.metadata.version} | `;
  markdown += `Author: ${wp.metadata.author} | `;
  markdown += `Last Updated: ${wp.metadata.lastUpdated}\n\n`;
  markdown += `---\n\n`;

  // Executive Summary
  markdown += `## ${wp.executiveSummary.title}\n\n`;
  markdown += `${wp.executiveSummary.content}\n\n`;

  // Design Philosophy
  markdown += `## ${wp.designPhilosophy.title}\n\n`;
  for (const section of wp.designPhilosophy.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `${section.content}\n\n`;
  }

  // Architecture
  markdown += `## ${wp.architecture.title}\n\n`;
  for (const section of wp.architecture.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // API Reference
  markdown += `## ${wp.apiReference.title}\n\n`;
  for (const section of wp.apiReference.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Security
  markdown += `## ${wp.security.title}\n\n`;
  for (const section of wp.security.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `${section.content}\n\n`;
  }

  // Best Practices
  markdown += `## ${wp.bestPractices.title}\n\n`;
  for (const section of wp.bestPractices.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `${section.content}\n\n`;
  }

  // Examples
  markdown += `## ${wp.examples.title}\n\n`;
  for (const section of wp.examples.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  return markdown;
}

/**
 * Export whitepaper sections for documentation system
 */
export function getWhitepaperSections(): Array<{
  id: string;
  title: string;
  content: string;
}> {
  const wp = CURL_DEFAULT_WHITEPAPER;
  const sections: Array<{ id: string; title: string; content: string }> = [];

  sections.push({
    id: 'executive-summary',
    title: wp.executiveSummary.title,
    content: wp.executiveSummary.content,
  });

  for (const section of wp.designPhilosophy.sections) {
    sections.push({
      id: section.subtitle.toLowerCase().replace(/\s+/g, '-'),
      title: section.subtitle,
      content: section.content,
    });
  }

  for (const section of wp.architecture.sections) {
    sections.push({
      id: section.subtitle.toLowerCase().replace(/\s+/g, '-'),
      title: section.subtitle,
      content: section.content,
    });
  }

  return sections;
}

export default CURL_DEFAULT_WHITEPAPER;
