// ============================================
// PROTOCOL OS - KEYLESS SCRAPER HANDSHAKE EXECUTOR
// ============================================
// Address: 1.3.11.a
// Purpose: Web Scraping Protocol Without Authentication
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
 * Keyless Scraper Protocol
 * 
 * Provides web scraping capabilities for publicly accessible content
 * without requiring API keys or authentication.
 * 
 * Key features:
 * - HTML content fetching
 * - User-Agent rotation
 * - Rate limiting and delays
 * - Robots.txt compliance
 * - Proxy support
 * - Response caching
 * 
 * IMPORTANT: Always respect robots.txt and website terms of service.
 * This protocol is intended for legitimate data access only.
 */

/**
 * Scraper request method
 */
export type ScraperMethod = 'GET' | 'POST' | 'HEAD';

/**
 * Response format
 */
export type ScraperResponseFormat = 'html' | 'json' | 'text' | 'binary';

/**
 * Common user agents for rotation
 */
export const USER_AGENTS = {
  chrome_windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  chrome_mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  chrome_linux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox_windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  firefox_mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  safari_mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  edge_windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  curl: 'curl/8.4.0',
} as const;

/**
 * Robots.txt rules
 */
export interface RobotsTxtRules {
  allowed: string[];
  disallowed: string[];
  crawlDelay?: number;
  sitemaps: string[];
}

/**
 * Scraper configuration
 */
export interface ScraperConfiguration {
  /** Base URL for scraping */
  baseUrl: string;
  
  /** User agent to use */
  userAgent?: string;
  
  /** Rotate user agents */
  rotateUserAgents?: boolean;
  
  /** Delay between requests (ms) */
  requestDelay?: number;
  
  /** Respect robots.txt */
  respectRobotsTxt?: boolean;
  
  /** Follow redirects */
  followRedirects?: boolean;
  
  /** Maximum redirects to follow */
  maxRedirects?: number;
  
  /** Request timeout (ms) */
  timeout?: number;
  
  /** Proxy URL */
  proxyUrl?: string;
  
  /** Custom headers */
  customHeaders?: Record<string, string>;
  
  /** Accept cookies */
  acceptCookies?: boolean;
  
  /** Cache responses */
  cacheResponses?: boolean;
  
  /** Cache TTL (seconds) */
  cacheTtl?: number;
  
  /** Response format */
  responseFormat?: ScraperResponseFormat;
  
  /** Retry failed requests */
  retryOnFailure?: boolean;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Retry delay (ms) */
  retryDelay?: number;
}

/**
 * Cached response
 */
interface CachedResponse {
  data: string;
  headers: Record<string, string>;
  statusCode: number;
  timestamp: number;
  ttl: number;
}

/**
 * Keyless Scraper Protocol Module
 */
export class KeylessScraperHandshakeExecutor extends BaseProtocolModule {
  private userAgentIndex = 0;
  private userAgentList: string[] = [];
  private lastRequestTime = 0;
  private cache = new Map<string, CachedResponse>();
  private robotsCache = new Map<string, RobotsTxtRules>();
  private cookies = new Map<string, string>();

  constructor() {
    super();
    this.userAgentList = Object.values(USER_AGENTS).filter(
      (ua) => !ua.includes('bot') && !ua.includes('curl')
    );
  }

  // ============================================
  // METADATA
  // ============================================

  getMetadata(): ProtocolModuleMetadata {
    return {
      type: 'scraper',
      displayName: 'Keyless Scraper',
      description: 'Web scraping for publicly accessible content without authentication.',
      version: '1.0.0',
      author: 'Protocol OS',
      documentationUrl: 'https://github.com/intent-tensor-theory/protocol-os/docs/scraper',
      icon: 'globe',
      capabilities: this.getCapabilities(),
      useCases: [
        'Public data extraction',
        'Price monitoring',
        'Content aggregation',
        'SEO analysis',
        'Research data collection',
        'News aggregation',
        'Product comparison',
        'Market research',
      ],
      examplePlatforms: [
        'Public websites',
        'News sites',
        'E-commerce (public pages)',
        'Government data portals',
        'Academic resources',
        'Social media (public)',
      ],
    };
  }

  getCapabilities(): ProtocolCapabilities {
    return {
      supportsRedirectFlow: false,
      supportsTokenRefresh: false,
      supportsTokenRevocation: false,
      supportsScopes: false,
      supportsIncrementalAuth: false,
      supportsOfflineAccess: true,
      supportsPkce: false,
      requiresServerSide: false,
      browserCompatible: false, // CORS restrictions
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
        id: 'baseUrl',
        label: 'Base URL',
        type: 'url',
        required: true,
        description: 'The website URL to scrape.',
        placeholder: 'https://example.com',
        group: 'target',
        order: 1,
      },
    ];
  }

  getOptionalFields(): ProtocolFieldDefinition[] {
    return [
      {
        id: 'userAgent',
        label: 'User Agent',
        type: 'select',
        required: false,
        description: 'Browser user agent to use.',
        defaultValue: 'chrome_windows',
        options: [
          { value: 'chrome_windows', label: 'Chrome (Windows)' },
          { value: 'chrome_mac', label: 'Chrome (macOS)' },
          { value: 'chrome_linux', label: 'Chrome (Linux)' },
          { value: 'firefox_windows', label: 'Firefox (Windows)' },
          { value: 'firefox_mac', label: 'Firefox (macOS)' },
          { value: 'safari_mac', label: 'Safari (macOS)' },
          { value: 'edge_windows', label: 'Edge (Windows)' },
          { value: 'custom', label: 'Custom' },
        ],
        group: 'browser',
        order: 1,
      },
      {
        id: 'customUserAgent',
        label: 'Custom User Agent',
        type: 'text',
        required: false,
        description: 'Custom user agent string.',
        placeholder: 'Mozilla/5.0 ...',
        group: 'browser',
        order: 2,
        visibleWhen: { field: 'userAgent', value: 'custom' },
      },
      {
        id: 'rotateUserAgents',
        label: 'Rotate User Agents',
        type: 'checkbox',
        required: false,
        description: 'Automatically rotate between different user agents.',
        defaultValue: false,
        group: 'browser',
        order: 3,
      },
      {
        id: 'requestDelay',
        label: 'Request Delay (ms)',
        type: 'number',
        required: false,
        description: 'Delay between consecutive requests.',
        defaultValue: 1000,
        placeholder: '1000',
        group: 'rate-limiting',
        order: 1,
      },
      {
        id: 'respectRobotsTxt',
        label: 'Respect robots.txt',
        type: 'checkbox',
        required: false,
        description: 'Check and respect robots.txt rules.',
        defaultValue: true,
        group: 'rate-limiting',
        order: 2,
      },
      {
        id: 'followRedirects',
        label: 'Follow Redirects',
        type: 'checkbox',
        required: false,
        description: 'Automatically follow HTTP redirects.',
        defaultValue: true,
        group: 'requests',
        order: 1,
      },
      {
        id: 'maxRedirects',
        label: 'Max Redirects',
        type: 'number',
        required: false,
        description: 'Maximum number of redirects to follow.',
        defaultValue: 5,
        placeholder: '5',
        group: 'requests',
        order: 2,
        visibleWhen: { field: 'followRedirects', value: true },
      },
      {
        id: 'timeout',
        label: 'Request Timeout (ms)',
        type: 'number',
        required: false,
        description: 'Maximum time to wait for response.',
        defaultValue: 30000,
        placeholder: '30000',
        group: 'requests',
        order: 3,
      },
      {
        id: 'proxyUrl',
        label: 'Proxy URL',
        type: 'url',
        required: false,
        description: 'HTTP/HTTPS proxy server URL.',
        placeholder: 'http://proxy.example.com:8080',
        group: 'proxy',
        order: 1,
      },
      {
        id: 'customHeaders',
        label: 'Custom Headers',
        type: 'json',
        required: false,
        description: 'Additional HTTP headers (JSON format).',
        placeholder: '{"Accept-Language": "en-US"}',
        group: 'advanced',
        order: 1,
      },
      {
        id: 'acceptCookies',
        label: 'Accept Cookies',
        type: 'checkbox',
        required: false,
        description: 'Store and send cookies with requests.',
        defaultValue: true,
        group: 'advanced',
        order: 2,
      },
      {
        id: 'cacheResponses',
        label: 'Cache Responses',
        type: 'checkbox',
        required: false,
        description: 'Cache responses to reduce requests.',
        defaultValue: false,
        group: 'caching',
        order: 1,
      },
      {
        id: 'cacheTtl',
        label: 'Cache TTL (seconds)',
        type: 'number',
        required: false,
        description: 'How long to cache responses.',
        defaultValue: 300,
        placeholder: '300',
        group: 'caching',
        order: 2,
        visibleWhen: { field: 'cacheResponses', value: true },
      },
      {
        id: 'retryOnFailure',
        label: 'Retry on Failure',
        type: 'checkbox',
        required: false,
        description: 'Automatically retry failed requests.',
        defaultValue: true,
        group: 'reliability',
        order: 1,
      },
      {
        id: 'maxRetries',
        label: 'Max Retries',
        type: 'number',
        required: false,
        description: 'Maximum retry attempts.',
        defaultValue: 3,
        placeholder: '3',
        group: 'reliability',
        order: 2,
        visibleWhen: { field: 'retryOnFailure', value: true },
      },
      {
        id: 'retryDelay',
        label: 'Retry Delay (ms)',
        type: 'number',
        required: false,
        description: 'Delay between retry attempts.',
        defaultValue: 2000,
        placeholder: '2000',
        group: 'reliability',
        order: 3,
        visibleWhen: { field: 'retryOnFailure', value: true },
      },
    ];
  }

  getFieldGroups() {
    return [
      {
        id: 'target',
        label: 'Target Website',
        description: 'The website to scrape.',
      },
      {
        id: 'browser',
        label: 'Browser Emulation',
        description: 'User agent and browser settings.',
      },
      {
        id: 'rate-limiting',
        label: 'Rate Limiting',
        description: 'Control request frequency.',
      },
      {
        id: 'requests',
        label: 'Request Settings',
        description: 'HTTP request configuration.',
        collapsible: true,
        defaultCollapsed: false,
      },
      {
        id: 'proxy',
        label: 'Proxy',
        description: 'Proxy server configuration.',
        collapsible: true,
        defaultCollapsed: true,
      },
      {
        id: 'caching',
        label: 'Caching',
        description: 'Response caching options.',
        collapsible: true,
        defaultCollapsed: true,
      },
      {
        id: 'reliability',
        label: 'Reliability',
        description: 'Retry and error handling.',
        collapsible: true,
        defaultCollapsed: true,
      },
      {
        id: 'advanced',
        label: 'Advanced',
        description: 'Additional options.',
        collapsible: true,
        defaultCollapsed: true,
      },
    ];
  }

  // ============================================
  // AUTHENTICATION (KEYLESS)
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

    const baseUrl = credentials.baseUrl as string;

    // Validate URL
    try {
      new URL(baseUrl);
    } catch {
      return {
        step: 1,
        totalSteps: 1,
        type: 'error',
        title: 'Invalid URL',
        description: 'Please provide a valid URL.',
        error: 'Invalid base URL format.',
      };
    }

    // Check robots.txt if enabled
    if (credentials.respectRobotsTxt !== false) {
      const robotsResult = await this.fetchRobotsTxt(baseUrl);
      if (robotsResult.rules) {
        const urlObj = new URL(baseUrl);
        this.robotsCache.set(urlObj.origin, robotsResult.rules);
      }
    }

    this.status = 'authenticated';

    return {
      step: 1,
      totalSteps: 1,
      type: 'complete',
      title: 'Scraper Configured',
      description: `Ready to scrape ${new URL(baseUrl).hostname}`,
      data: {
        baseUrl,
        respectRobotsTxt: credentials.respectRobotsTxt !== false,
      },
    };
  }

  // ============================================
  // ROBOTS.TXT HANDLING
  // ============================================

  /**
   * Fetch and parse robots.txt
   */
  async fetchRobotsTxt(baseUrl: string): Promise<{
    success: boolean;
    rules?: RobotsTxtRules;
    error?: string;
  }> {
    try {
      const urlObj = new URL(baseUrl);
      const robotsUrl = `${urlObj.origin}/robots.txt`;

      const response = await fetch(robotsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENTS.googlebot,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { success: true, rules: this.getDefaultRobotsTxt() };
      }

      const text = await response.text();
      const rules = this.parseRobotsTxt(text);

      return { success: true, rules };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch robots.txt',
        rules: this.getDefaultRobotsTxt(),
      };
    }
  }

  /**
   * Parse robots.txt content
   */
  private parseRobotsTxt(content: string): RobotsTxtRules {
    const rules: RobotsTxtRules = {
      allowed: [],
      disallowed: [],
      sitemaps: [],
    };

    let isRelevantUserAgent = false;
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const directive = trimmed.substring(0, colonIndex).toLowerCase().trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      if (directive === 'user-agent') {
        isRelevantUserAgent = value === '*' || value.toLowerCase().includes('bot');
      } else if (isRelevantUserAgent || directive === 'sitemap') {
        switch (directive) {
          case 'allow':
            rules.allowed.push(value);
            break;
          case 'disallow':
            rules.disallowed.push(value);
            break;
          case 'crawl-delay':
            rules.crawlDelay = parseFloat(value) * 1000; // Convert to ms
            break;
          case 'sitemap':
            rules.sitemaps.push(value);
            break;
        }
      }
    }

    return rules;
  }

  /**
   * Get default robots.txt rules (allow all)
   */
  private getDefaultRobotsTxt(): RobotsTxtRules {
    return {
      allowed: ['/'],
      disallowed: [],
      sitemaps: [],
    };
  }

  /**
   * Check if URL is allowed by robots.txt
   */
  isUrlAllowed(url: string, credentials: AuthenticationCredentials): boolean {
    if (credentials.respectRobotsTxt === false) return true;

    try {
      const urlObj = new URL(url);
      const rules = this.robotsCache.get(urlObj.origin);
      if (!rules) return true;

      const path = urlObj.pathname;

      // Check disallowed first
      for (const pattern of rules.disallowed) {
        if (this.matchesPattern(path, pattern)) {
          // Check if explicitly allowed
          for (const allowPattern of rules.allowed) {
            if (this.matchesPattern(path, allowPattern) && 
                allowPattern.length > pattern.length) {
              return true;
            }
          }
          return false;
        }
      }

      return true;
    } catch {
      return true;
    }
  }

  /**
   * Match path against robots.txt pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    if (!pattern) return false;
    if (pattern === '/') return true;
    
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    
    const regex = new RegExp(`^${regexPattern}`);
    return regex.test(path);
  }

  // ============================================
  // USER AGENT MANAGEMENT
  // ============================================

  /**
   * Get user agent for request
   */
  private getUserAgent(credentials: AuthenticationCredentials): string {
    if (credentials.rotateUserAgents) {
      const ua = this.userAgentList[this.userAgentIndex];
      this.userAgentIndex = (this.userAgentIndex + 1) % this.userAgentList.length;
      return ua;
    }

    const userAgentKey = credentials.userAgent as keyof typeof USER_AGENTS;
    if (userAgentKey === 'custom') {
      return (credentials.customUserAgent as string) || USER_AGENTS.chrome_windows;
    }

    return USER_AGENTS[userAgentKey] || USER_AGENTS.chrome_windows;
  }

  // ============================================
  // RATE LIMITING
  // ============================================

  /**
   * Wait for rate limit
   */
  private async waitForRateLimit(credentials: AuthenticationCredentials): Promise<void> {
    const delay = (credentials.requestDelay as number) || 1000;
    const elapsed = Date.now() - this.lastRequestTime;
    
    if (elapsed < delay) {
      await new Promise((resolve) => setTimeout(resolve, delay - elapsed));
    }
    
    this.lastRequestTime = Date.now();
  }

  // ============================================
  // CACHING
  // ============================================

  /**
   * Get cached response
   */
  private getCachedResponse(url: string, credentials: AuthenticationCredentials): CachedResponse | null {
    if (!credentials.cacheResponses) return null;

    const cached = this.cache.get(url);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.cache.delete(url);
      return null;
    }

    return cached;
  }

  /**
   * Cache response
   */
  private cacheResponse(
    url: string,
    data: string,
    headers: Record<string, string>,
    statusCode: number,
    credentials: AuthenticationCredentials
  ): void {
    if (!credentials.cacheResponses) return;

    const ttl = (credentials.cacheTtl as number) || 300;
    this.cache.set(url, {
      data,
      headers,
      statusCode,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ============================================
  // COOKIE MANAGEMENT
  // ============================================

  /**
   * Parse Set-Cookie header
   */
  private parseCookies(setCookieHeader: string | null): void {
    if (!setCookieHeader) return;

    const cookies = setCookieHeader.split(',');
    for (const cookie of cookies) {
      const parts = cookie.split(';')[0].trim().split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        this.cookies.set(name, value);
      }
    }
  }

  /**
   * Get cookie header value
   */
  private getCookieHeader(): string {
    const pairs: string[] = [];
    for (const [name, value] of this.cookies) {
      pairs.push(`${name}=${value}`);
    }
    return pairs.join('; ');
  }

  /**
   * Clear cookies
   */
  clearCookies(): void {
    this.cookies.clear();
  }

  // ============================================
  // TOKEN MANAGEMENT (N/A)
  // ============================================

  async refreshTokens(_credentials: AuthenticationCredentials): Promise<ProtocolTokenRefreshResult> {
    return { success: true, accessToken: undefined };
  }

  async revokeTokens(_credentials: AuthenticationCredentials): Promise<{ success: boolean; error?: string }> {
    this.clearCache();
    this.clearCookies();
    return { success: true };
  }

  isTokenExpired(_credentials: AuthenticationCredentials): boolean {
    return false;
  }

  getTokenExpirationTime(_credentials: AuthenticationCredentials): Date | null {
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
    const headers: Record<string, string> = {
      'User-Agent': this.getUserAgent(credentials),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    // Add cookies if enabled
    if (credentials.acceptCookies !== false && this.cookies.size > 0) {
      headers['Cookie'] = this.getCookieHeader();
    }

    // Add custom headers
    if (credentials.customHeaders) {
      try {
        const custom = typeof credentials.customHeaders === 'string'
          ? JSON.parse(credentials.customHeaders)
          : credentials.customHeaders;
        Object.assign(headers, custom);
      } catch {
        // Invalid JSON, ignore
      }
    }

    return { headers, queryParams: {} };
  }

  async executeRequest(context: ProtocolExecutionContext): Promise<ProtocolExecutionResult> {
    const startTime = performance.now();
    const credentials = context.credentials as AuthenticationCredentials;
    const timeout = (credentials.timeout as number) || 30000;
    const maxRetries = credentials.retryOnFailure ? ((credentials.maxRetries as number) || 3) : 0;
    const retryDelay = (credentials.retryDelay as number) || 2000;

    // Build full URL
    let url = context.url;
    const baseUrl = credentials.baseUrl as string;
    if (!url.startsWith('http')) {
      url = new URL(url, baseUrl).toString();
    }

    // Check robots.txt
    if (!this.isUrlAllowed(url, credentials)) {
      return {
        success: false,
        statusCode: 403,
        headers: {},
        body: null,
        rawBody: '',
        durationMs: performance.now() - startTime,
        credentialsRefreshed: false,
        error: 'URL blocked by robots.txt',
        errorCode: 'ROBOTS_BLOCKED',
      };
    }

    // Check cache
    const cached = this.getCachedResponse(url, credentials);
    if (cached) {
      return {
        success: true,
        statusCode: cached.statusCode,
        headers: { ...cached.headers, 'x-cache': 'HIT' },
        body: cached.data,
        rawBody: cached.data,
        durationMs: performance.now() - startTime,
        credentialsRefreshed: false,
      };
    }

    // Wait for rate limit
    await this.waitForRateLimit(credentials);

    // Inject headers
    const { headers } = await this.injectAuthentication(context);

    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts <= maxRetries) {
      try {
        const response = await fetch(url, {
          method: (context.method as ScraperMethod) || 'GET',
          headers: {
            ...headers,
            ...context.headers,
          },
          body: context.body ? JSON.stringify(context.body) : undefined,
          redirect: credentials.followRedirects !== false ? 'follow' : 'manual',
          signal: AbortSignal.timeout(timeout),
        });

        const responseText = await response.text();
        const durationMs = performance.now() - startTime;

        // Store cookies
        if (credentials.acceptCookies !== false) {
          this.parseCookies(response.headers.get('Set-Cookie'));
        }

        const responseHeaders = Object.fromEntries(response.headers.entries());

        // Cache successful response
        if (response.ok) {
          this.cacheResponse(url, responseText, responseHeaders, response.status, credentials);
        }

        return {
          success: response.ok,
          statusCode: response.status,
          headers: responseHeaders,
          body: responseText,
          rawBody: responseText,
          durationMs,
          credentialsRefreshed: false,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Request failed');
        attempts++;
        
        if (attempts <= maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * attempts));
        }
      }
    }

    return {
      success: false,
      statusCode: 0,
      headers: {},
      body: null,
      rawBody: '',
      durationMs: performance.now() - startTime,
      credentialsRefreshed: false,
      error: lastError?.message || 'Request failed after retries',
      errorCode: 'NETWORK_ERROR',
    };
  }

  // ============================================
  // SCRAPING UTILITIES
  // ============================================

  /**
   * Scrape multiple URLs
   */
  async scrapeMultiple(
    credentials: AuthenticationCredentials,
    urls: string[],
    options?: { concurrency?: number }
  ): Promise<Map<string, ProtocolExecutionResult>> {
    const results = new Map<string, ProtocolExecutionResult>();
    const concurrency = options?.concurrency || 1;

    // Sequential for rate limiting compliance
    if (concurrency === 1) {
      for (const url of urls) {
        const result = await this.executeRequest({
          credentials,
          url,
          method: 'GET',
          headers: {},
        });
        results.set(url, result);
      }
    } else {
      // Parallel with concurrency limit
      const chunks: string[][] = [];
      for (let i = 0; i < urls.length; i += concurrency) {
        chunks.push(urls.slice(i, i + concurrency));
      }

      for (const chunk of chunks) {
        const chunkResults = await Promise.all(
          chunk.map((url) =>
            this.executeRequest({
              credentials,
              url,
              method: 'GET',
              headers: {},
            })
          )
        );

        chunk.forEach((url, i) => results.set(url, chunkResults[i]));
      }
    }

    return results;
  }

  /**
   * Extract links from HTML
   */
  static extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const regex = /<a[^>]+href=["']([^"']+)["']/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      try {
        const href = match[1];
        if (href.startsWith('javascript:') || href.startsWith('#')) continue;
        
        const absoluteUrl = new URL(href, baseUrl).toString();
        if (!links.includes(absoluteUrl)) {
          links.push(absoluteUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return links;
  }

  /**
   * Extract text content from HTML
   */
  static extractText(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(credentials: AuthenticationCredentials): Promise<ProtocolHealthCheckResult> {
    const startTime = performance.now();
    const baseUrl = credentials.baseUrl as string;

    try {
      const result = await this.executeRequest({
        credentials,
        url: baseUrl,
        method: 'HEAD',
        headers: {},
      });

      const latencyMs = performance.now() - startTime;

      return {
        healthy: result.success,
        message: result.success 
          ? `Website reachable (${result.statusCode})`
          : `Website returned ${result.statusCode}`,
        latencyMs,
        tokenStatus: 'valid',
        tokenExpiresIn: -1,
        canRefresh: false,
        details: {
          statusCode: result.statusCode,
          cacheSize: this.cache.size,
          cookieCount: this.cookies.size,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
        latencyMs: performance.now() - startTime,
        tokenStatus: 'unknown',
        tokenExpiresIn: 0,
        canRefresh: false,
      };
    }
  }
}

// Export default instance
export default KeylessScraperHandshakeExecutor;
