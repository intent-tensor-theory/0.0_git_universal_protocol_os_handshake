// ============================================
// PROTOCOL OS - KEYLESS SCRAPER WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.11.c
// Purpose: Technical specification for Keyless Scraper Protocol
// ============================================

/**
 * Whitepaper: Keyless Scraper Protocol
 * 
 * Ethical Web Scraping for Public Data
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 */

export const KEYLESS_SCRAPER_WHITEPAPER = {
  metadata: {
    title: 'Keyless Scraper Protocol',
    subtitle: 'Ethical Web Scraping for Public Data',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    standards: [
      'Robots Exclusion Standard (robots.txt)',
      'HTTP/1.1 (RFC 7230-7235)',
      'HTML5 Parsing Specification',
    ],
  },

  // ============================================
  // SECTION 1: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
The Keyless Scraper Protocol provides capabilities for extracting publicly 
accessible data from websites without requiring API keys or authentication.

IMPORTANT NOTICE:
┌─────────────────────────────────────────────────────────────────────────────┐
│  This protocol is intended for LEGITIMATE purposes only:                    │
│  • Public data that doesn't require login                                   │
│  • Research and academic purposes                                           │
│  • Personal use and archival                                                │
│  • Data that website owners intend to be accessible                         │
│                                                                              │
│  ALWAYS:                                                                    │
│  ✓ Respect robots.txt directives                                           │
│  ✓ Follow website Terms of Service                                         │
│  ✓ Use reasonable request rates                                            │
│  ✓ Identify your scraper appropriately                                     │
│  ✓ Cache responses to minimize load                                        │
└─────────────────────────────────────────────────────────────────────────────┘

Key Capabilities:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • HTTP request execution without authentication                            │
│  • User-Agent management and rotation                                       │
│  • Rate limiting and request delays                                         │
│  • Robots.txt compliance checking                                           │
│  • Response caching                                                         │
│  • Cookie handling                                                          │
│  • Redirect following                                                       │
│  • Retry with exponential backoff                                          │
│  • Proxy support                                                            │
│  • HTML content extraction                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Use Cases:
• Price monitoring and comparison
• News aggregation
• Academic research data collection
• Market research
• Content archival
• SEO analysis
• Public dataset compilation
    `.trim(),
  },

  // ============================================
  // SECTION 2: ROBOTS.TXT COMPLIANCE
  // ============================================
  
  robotsTxt: {
    title: '2. Robots.txt Compliance',
    sections: [
      {
        subtitle: '2.1 Robots Exclusion Standard',
        content: `
The Robots Exclusion Standard (robots.txt) allows website owners to 
communicate crawling preferences.

robots.txt Location:
  https://example.com/robots.txt

Example robots.txt:
┌─────────────────────────────────────────────────────────────────────────────┐
│  # Allow all crawlers                                                       │
│  User-agent: *                                                              │
│  Allow: /                                                                   │
│  Disallow: /private/                                                        │
│  Disallow: /admin/                                                          │
│  Disallow: /api/                                                            │
│                                                                              │
│  # Specific rules for Googlebot                                             │
│  User-agent: Googlebot                                                      │
│  Crawl-delay: 10                                                            │
│                                                                              │
│  # Sitemap location                                                         │
│  Sitemap: https://example.com/sitemap.xml                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Key Directives:
┌────────────────────┬────────────────────────────────────────────────────────┐
│ Directive          │ Meaning                                                 │
├────────────────────┼────────────────────────────────────────────────────────┤
│ User-agent         │ Which crawler the rules apply to (* = all)             │
│ Disallow           │ Paths that should NOT be crawled                       │
│ Allow              │ Paths that CAN be crawled (overrides Disallow)         │
│ Crawl-delay        │ Seconds to wait between requests                       │
│ Sitemap            │ Location of XML sitemap                                │
└────────────────────┴────────────────────────────────────────────────────────┘

Path Matching:
• /path - Matches /path, /path/, /path/page
• /path/ - Only matches paths starting with /path/
• * - Wildcard (matches any sequence)
• $ - End of URL anchor
        `.trim(),
      },
      {
        subtitle: '2.2 Compliance Algorithm',
        content: `
The scraper follows this algorithm for robots.txt compliance:

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1. FETCH robots.txt                                                        │
│     └─▶ GET /robots.txt                                                    │
│         ├─▶ 200 OK: Parse rules                                            │
│         ├─▶ 404 Not Found: Allow all (no restrictions)                     │
│         └─▶ Other: Treat as temporary block, retry later                   │
│                                                                              │
│  2. PARSE Rules                                                             │
│     └─▶ Find rules for User-agent: * (or specific agent)                   │
│         ├─▶ Collect Disallow paths                                         │
│         ├─▶ Collect Allow paths (higher priority)                          │
│         └─▶ Note Crawl-delay if specified                                  │
│                                                                              │
│  3. CHECK Each URL Before Request                                           │
│     └─▶ Is path in Disallow list?                                          │
│         ├─▶ Yes: Is it also in Allow list (more specific)?                 │
│         │       ├─▶ Yes: ALLOW request                                     │
│         │       └─▶ No: BLOCK request                                      │
│         └─▶ No: ALLOW request                                              │
│                                                                              │
│  4. RESPECT Crawl-delay                                                     │
│     └─▶ Wait specified seconds between requests                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Example Path Checks:
• Disallow: /private/ → /private/data blocks, /public allows
• Allow: /private/public/ overrides /private/ disallow
• Disallow: /*.pdf blocks all PDF files
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 3: USER-AGENT MANAGEMENT
  // ============================================
  
  userAgentManagement: {
    title: '3. User-Agent Management',
    sections: [
      {
        subtitle: '3.1 Browser Emulation',
        content: `
User-Agent strings identify the client making requests.

Common User-Agents:
┌─────────────────────────────────────────────────────────────────────────────┐
│ Chrome (Windows):                                                           │
│ Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36               │
│ (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Firefox (macOS):                                                            │
│ Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0)                    │
│ Gecko/20100101 Firefox/121.0                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Safari (macOS):                                                             │
│ Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15       │
│ (KHTML, like Gecko) Version/17.2 Safari/605.1.15                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Edge (Windows):                                                             │
│ Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36               │
│ (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0          │
└─────────────────────────────────────────────────────────────────────────────┘

User-Agent Anatomy:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Mozilla/5.0 (platform) engine/version (KHTML, like Gecko) browser/version │
│       │           │         │                                   │          │
│       │           │         │                                   └─ Browser │
│       │           │         └─ Rendering engine                            │
│       │           └─ OS and architecture                                   │
│       └─ Mozilla compatibility token (historical)                          │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '3.2 User-Agent Rotation',
        content: `
Rotating user agents helps distribute requests across different "browsers".

Rotation Strategy:
1. Maintain a pool of valid, current user agents
2. Exclude bot/crawler user agents from rotation
3. Cycle through pool sequentially or randomly
4. Update pool periodically (browsers update frequently)

Implementation:
┌─────────────────────────────────────────────────────────────────────────────┐
│  const userAgentPool = [                                                    │
│    'Chrome Windows',                                                        │
│    'Chrome macOS',                                                          │
│    'Chrome Linux',                                                          │
│    'Firefox Windows',                                                       │
│    'Firefox macOS',                                                         │
│    'Safari macOS',                                                          │
│    'Edge Windows',                                                          │
│  ];                                                                         │
│                                                                              │
│  let currentIndex = 0;                                                      │
│                                                                              │
│  function getNextUserAgent() {                                              │
│    const ua = userAgentPool[currentIndex];                                 │
│    currentIndex = (currentIndex + 1) % userAgentPool.length;               │
│    return ua;                                                               │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Best Practices:
✓ Use realistic, up-to-date user agents
✓ Match user agent with appropriate Accept headers
✓ Don't rotate too frequently (appears suspicious)
✓ Consider geographic consistency
✗ Don't use obviously fake user agents
✗ Don't claim to be search engine bots
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 4: RATE LIMITING
  // ============================================
  
  rateLimiting: {
    title: '4. Rate Limiting',
    sections: [
      {
        subtitle: '4.1 Request Delays',
        content: `
Rate limiting prevents overwhelming target servers.

Recommended Delays:
┌────────────────────┬──────────────────────┬────────────────────────────────┐
│ Mode               │ Delay                 │ Requests/Hour                  │
├────────────────────┼──────────────────────┼────────────────────────────────┤
│ Polite             │ 3-5 seconds          │ ~720-1,200                     │
│ Moderate           │ 1-2 seconds          │ ~1,800-3,600                   │
│ Fast               │ 0.5-1 second         │ ~3,600-7,200                   │
│ Aggressive         │ <0.5 seconds         │ >7,200 (not recommended)       │
└────────────────────┴──────────────────────┴────────────────────────────────┘

Adaptive Rate Limiting:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  function adaptiveDelay(lastStatusCode, currentDelay) {                    │
│    if (lastStatusCode === 429) {                                           │
│      // Too Many Requests - back off significantly                         │
│      return Math.min(currentDelay * 3, 60000);                             │
│    } else if (lastStatusCode >= 500) {                                     │
│      // Server error - back off                                            │
│      return Math.min(currentDelay * 2, 30000);                             │
│    } else if (lastStatusCode === 200) {                                    │
│      // Success - can potentially speed up                                 │
│      return Math.max(currentDelay * 0.9, minDelay);                        │
│    }                                                                        │
│    return currentDelay;                                                    │
│  }                                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '4.2 HTTP 429 Handling',
        content: `
HTTP 429 "Too Many Requests" indicates rate limit exceeded.

429 Response Headers:
┌─────────────────────────────────────────────────────────────────────────────┐
│  HTTP/1.1 429 Too Many Requests                                             │
│  Retry-After: 60                    ← Wait 60 seconds                      │
│  X-RateLimit-Limit: 100             ← Max requests per window              │
│  X-RateLimit-Remaining: 0           ← Requests left                        │
│  X-RateLimit-Reset: 1697312400      ← Unix timestamp when limit resets     │
└─────────────────────────────────────────────────────────────────────────────┘

Handling Strategy:
1. Parse Retry-After header (seconds or HTTP date)
2. Wait the specified duration
3. If no Retry-After, use exponential backoff
4. Log rate limit events for monitoring

Exponential Backoff:
  Attempt 1: Wait 2 seconds
  Attempt 2: Wait 4 seconds
  Attempt 3: Wait 8 seconds
  Attempt 4: Wait 16 seconds
  ...
  Max: 60 seconds (or site-specific limit)
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: CACHING
  // ============================================
  
  caching: {
    title: '5. Response Caching',
    content: `
Caching reduces server load and speeds up repeated requests.

Cache Strategy:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Request URL ──▶ Check Cache ──▶ Hit? ──▶ Return cached response           │
│                       │                                                     │
│                       ▼                                                     │
│                    Miss? ──▶ Fetch from server ──▶ Store in cache          │
│                                                     │                       │
│                                                     ▼                       │
│                                              Return response                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Cache Considerations:
┌────────────────────┬────────────────────────────────────────────────────────┐
│ Content Type       │ Recommended TTL                                         │
├────────────────────┼────────────────────────────────────────────────────────┤
│ Static pages       │ 1-24 hours                                             │
│ Product listings   │ 15-60 minutes                                          │
│ News/articles      │ 5-15 minutes                                           │
│ Real-time data     │ No caching                                             │
│ User-specific      │ No caching                                             │
└────────────────────┴────────────────────────────────────────────────────────┘

HTTP Caching Headers:
• Cache-Control: max-age=3600 - Cache for 1 hour
• ETag: "abc123" - Version identifier for conditional requests
• Last-Modified: Date - When content was last changed

Conditional Requests (save bandwidth):
  Request: If-None-Match: "abc123"
  Response: 304 Not Modified (use cached version)
    `.trim(),
  },

  // ============================================
  // SECTION 6: ERROR HANDLING
  // ============================================
  
  errorHandling: {
    title: '6. Error Handling',
    content: `
Proper error handling ensures reliable scraping.

HTTP Status Codes:
┌──────────┬────────────────────────────────────────────────────────────────┐
│ Code     │ Meaning & Action                                               │
├──────────┼────────────────────────────────────────────────────────────────┤
│ 200      │ Success - process response                                     │
│ 301/302  │ Redirect - follow if enabled                                   │
│ 304      │ Not Modified - use cached version                              │
│ 400      │ Bad Request - check URL/parameters                             │
│ 403      │ Forbidden - may need different approach                        │
│ 404      │ Not Found - skip URL, log for review                          │
│ 429      │ Rate Limited - back off, wait, retry                          │
│ 500      │ Server Error - retry with backoff                              │
│ 502/503  │ Gateway/Service Unavailable - retry later                      │
│ 504      │ Gateway Timeout - increase timeout, retry                      │
└──────────┴────────────────────────────────────────────────────────────────┘

Retry Strategy:
┌─────────────────────────────────────────────────────────────────────────────┐
│  async function fetchWithRetry(url, maxRetries = 3) {                      │
│    for (let attempt = 1; attempt <= maxRetries; attempt++) {               │
│      try {                                                                  │
│        const response = await fetch(url);                                  │
│                                                                              │
│        if (response.ok) return response;                                   │
│                                                                              │
│        if (response.status === 429) {                                      │
│          const retryAfter = response.headers.get('Retry-After') || 60;     │
│          await sleep(parseInt(retryAfter) * 1000);                         │
│          continue;                                                          │
│        }                                                                    │
│                                                                              │
│        if (response.status >= 500) {                                       │
│          await sleep(Math.pow(2, attempt) * 1000);                         │
│          continue;                                                          │
│        }                                                                    │
│                                                                              │
│        return response; // 4xx errors don't retry                          │
│      } catch (error) {                                                      │
│        if (attempt === maxRetries) throw error;                            │
│        await sleep(Math.pow(2, attempt) * 1000);                           │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
    `.trim(),
  },

  // ============================================
  // SECTION 7: BEST PRACTICES
  // ============================================
  
  bestPractices: {
    title: '7. Best Practices',
    content: `
Ethical Scraping Checklist:

Legal & Ethical:
☐ Verify scraping is allowed by Terms of Service
☐ Only scrape publicly accessible content
☐ Respect robots.txt directives
☐ Don't scrape personal/private information
☐ Don't circumvent access controls
☐ Consider data protection regulations (GDPR, etc.)

Technical:
☐ Use reasonable request delays (≥1 second)
☐ Implement proper error handling
☐ Cache responses to reduce server load
☐ Set appropriate timeouts
☐ Handle redirects gracefully
☐ Use realistic User-Agent strings
☐ Support HTTP compression

Identification:
☐ Use identifiable User-Agent (include contact info for bots)
☐ Set meaningful Referer header when appropriate
☐ Don't impersonate search engine crawlers

Resource Management:
☐ Limit concurrent connections
☐ Respect Crawl-delay directives
☐ Back off on errors
☐ Don't scrape during peak hours if possible
☐ Monitor and adjust rate based on server response

Data Handling:
☐ Store only necessary data
☐ Respect data freshness requirements
☐ Keep data secure
☐ Delete data when no longer needed

Common Pitfalls to Avoid:
✗ Ignoring robots.txt
✗ Aggressive request rates
✗ Not handling rate limits
✗ Scraping dynamic content without JavaScript rendering
✗ Not updating stale User-Agent strings
✗ Storing sensitive data
✗ Violating Terms of Service
    `.trim(),
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportKeylessScraperWhitepaperAsMarkdown(): string {
  const wp = KEYLESS_SCRAPER_WHITEPAPER;
  let markdown = '';

  // Title
  markdown += `# ${wp.metadata.title}\n\n`;
  markdown += `**${wp.metadata.subtitle}**\n\n`;
  markdown += `Version: ${wp.metadata.version}\n\n`;
  markdown += `Standards: ${wp.metadata.standards.join(', ')}\n\n`;
  markdown += `---\n\n`;

  // Executive Summary
  markdown += `## ${wp.executiveSummary.title}\n\n`;
  markdown += `\`\`\`\n${wp.executiveSummary.content}\n\`\`\`\n\n`;

  // Robots.txt
  markdown += `## ${wp.robotsTxt.title}\n\n`;
  for (const section of wp.robotsTxt.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // User-Agent Management
  markdown += `## ${wp.userAgentManagement.title}\n\n`;
  for (const section of wp.userAgentManagement.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Rate Limiting
  markdown += `## ${wp.rateLimiting.title}\n\n`;
  for (const section of wp.rateLimiting.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Caching
  markdown += `## ${wp.caching.title}\n\n`;
  markdown += `\`\`\`\n${wp.caching.content}\n\`\`\`\n\n`;

  // Error Handling
  markdown += `## ${wp.errorHandling.title}\n\n`;
  markdown += `\`\`\`\n${wp.errorHandling.content}\n\`\`\`\n\n`;

  // Best Practices
  markdown += `## ${wp.bestPractices.title}\n\n`;
  markdown += `\`\`\`\n${wp.bestPractices.content}\n\`\`\`\n\n`;

  return markdown;
}

/**
 * HTTP status codes with descriptions
 */
export const HTTP_STATUS_CODES = {
  200: { name: 'OK', action: 'Process response' },
  201: { name: 'Created', action: 'Resource created successfully' },
  204: { name: 'No Content', action: 'Success, no body' },
  301: { name: 'Moved Permanently', action: 'Follow redirect' },
  302: { name: 'Found', action: 'Follow redirect' },
  303: { name: 'See Other', action: 'Follow redirect (GET)' },
  304: { name: 'Not Modified', action: 'Use cached version' },
  307: { name: 'Temporary Redirect', action: 'Follow redirect (same method)' },
  308: { name: 'Permanent Redirect', action: 'Follow redirect (same method)' },
  400: { name: 'Bad Request', action: 'Check URL/parameters' },
  401: { name: 'Unauthorized', action: 'Authentication required' },
  403: { name: 'Forbidden', action: 'Access denied' },
  404: { name: 'Not Found', action: 'Skip URL, log' },
  405: { name: 'Method Not Allowed', action: 'Try different method' },
  408: { name: 'Request Timeout', action: 'Retry' },
  410: { name: 'Gone', action: 'Resource permanently removed' },
  429: { name: 'Too Many Requests', action: 'Wait, retry' },
  500: { name: 'Internal Server Error', action: 'Retry with backoff' },
  502: { name: 'Bad Gateway', action: 'Retry later' },
  503: { name: 'Service Unavailable', action: 'Retry later' },
  504: { name: 'Gateway Timeout', action: 'Increase timeout, retry' },
};

export default KEYLESS_SCRAPER_WHITEPAPER;
