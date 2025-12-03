// ============================================
// PROTOCOL OS - KEYLESS SCRAPER UTILITIES
// ============================================
// Address: 1.4.11.b
// Purpose: Utility functions for web scraping
// ============================================

/**
 * Common browser User-Agent strings
 */
export const USER_AGENTS = {
  CHROME_WINDOWS: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  CHROME_MAC: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  FIREFOX_WINDOWS: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  SAFARI_MAC: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  EDGE_WINDOWS: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  GOOGLEBOT: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
} as const;

/**
 * Get a random User-Agent from common browsers
 */
export function getRandomUserAgent(): string {
  const agents = [
    USER_AGENTS.CHROME_WINDOWS,
    USER_AGENTS.CHROME_MAC,
    USER_AGENTS.FIREFOX_WINDOWS,
    USER_AGENTS.SAFARI_MAC,
    USER_AGENTS.EDGE_WINDOWS,
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

/**
 * Build browser-like headers
 */
export function buildBrowserHeaders(userAgent?: string): Record<string, string> {
  return {
    'User-Agent': userAgent || getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
  };
}

/**
 * Extract text content from HTML (basic)
 */
export function extractTextFromHtml(html: string): string {
  // Remove script and style elements
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

/**
 * Extract links from HTML
 */
export function extractLinksFromHtml(html: string, baseUrl?: string): string[] {
  const links: string[] = [];
  const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    
    // Convert relative URLs to absolute
    if (baseUrl && !href.startsWith('http')) {
      try {
        href = new URL(href, baseUrl).toString();
      } catch {
        continue;
      }
    }
    
    links.push(href);
  }
  
  return [...new Set(links)]; // Remove duplicates
}

/**
 * Check if URL is allowed by robots.txt (basic check)
 */
export async function checkRobotsTxt(
  url: string,
  userAgent: string = '*'
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.origin}/robots.txt`;
    
    const response = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      return { allowed: true, reason: 'No robots.txt found' };
    }
    
    const robotsTxt = await response.text();
    const path = urlObj.pathname;
    
    // Simple parsing - this is a basic implementation
    const lines = robotsTxt.split('\n');
    let currentUserAgent = '';
    let isRelevantSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase();
      
      if (trimmed.startsWith('user-agent:')) {
        currentUserAgent = trimmed.replace('user-agent:', '').trim();
        isRelevantSection = currentUserAgent === '*' || 
          userAgent.toLowerCase().includes(currentUserAgent);
      }
      
      if (isRelevantSection && trimmed.startsWith('disallow:')) {
        const disallowedPath = trimmed.replace('disallow:', '').trim();
        if (disallowedPath && path.startsWith(disallowedPath)) {
          return { allowed: false, reason: `Disallowed by robots.txt: ${disallowedPath}` };
        }
      }
    }
    
    return { allowed: true };
  } catch (error) {
    return { allowed: true, reason: 'Could not check robots.txt' };
  }
}

/**
 * Rate limiter for scraping
 */
export class RateLimiter {
  private lastRequestTime = 0;
  private readonly minInterval: number;

  constructor(requestsPerSecond: number = 1) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    
    if (elapsed < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
    }
    
    this.lastRequestTime = Date.now();
  }
}
