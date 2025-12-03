// ============================================
// PROTOCOL OS - KEYLESS SCRAPER DOM PARSER
// ============================================
// Address: 1.3.11.d
// Purpose: HTML Parsing and Data Extraction Utilities
// ============================================

/**
 * Keyless Scraper DOM Parser
 * 
 * Provides lightweight HTML parsing capabilities without requiring
 * a full DOM implementation. Uses regex-based extraction for
 * server-side and browser-agnostic operation.
 * 
 * Note: For complex parsing needs, consider using a proper DOM parser
 * like cheerio (Node.js) or the browser's DOMParser.
 */

/**
 * Extracted element data
 */
export interface ExtractedElement {
  tag: string;
  attributes: Record<string, string>;
  content: string;
  outerHtml: string;
  index: number;
}

/**
 * Selector result
 */
export interface SelectorResult {
  elements: ExtractedElement[];
  count: number;
  first: ExtractedElement | null;
  last: ExtractedElement | null;
  texts: string[];
  attrs: (attr: string) => string[];
}

/**
 * Meta tag information
 */
export interface MetaInfo {
  title: string | null;
  description: string | null;
  keywords: string | null;
  author: string | null;
  viewport: string | null;
  robots: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
}

/**
 * Link information
 */
export interface LinkInfo {
  href: string;
  text: string;
  title?: string;
  rel?: string;
  target?: string;
  isExternal: boolean;
  isAnchor: boolean;
}

/**
 * Image information
 */
export interface ImageInfo {
  src: string;
  alt: string;
  title?: string;
  width?: string;
  height?: string;
  loading?: string;
}

/**
 * Table data
 */
export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

/**
 * DOM Parser class
 */
export class KeylessScraperDomParser {
  private html: string;
  private baseUrl: string;

  constructor(html: string, baseUrl: string = '') {
    this.html = html;
    this.baseUrl = baseUrl;
  }

  // ============================================
  // BASIC ELEMENT EXTRACTION
  // ============================================

  /**
   * Find elements by tag name
   */
  getElementsByTagName(tagName: string): SelectorResult {
    const elements: ExtractedElement[] = [];
    const regex = new RegExp(
      `<${tagName}([^>]*)>([\\s\\S]*?)<\\/${tagName}>|<${tagName}([^>]*)\\/?>`,
      'gi'
    );

    let match;
    let index = 0;
    while ((match = regex.exec(this.html)) !== null) {
      const attributeString = match[1] || match[3] || '';
      const content = match[2] || '';
      
      elements.push({
        tag: tagName.toLowerCase(),
        attributes: this.parseAttributes(attributeString),
        content: content.trim(),
        outerHtml: match[0],
        index: index++,
      });
    }

    return this.createSelectorResult(elements);
  }

  /**
   * Find elements by class name
   */
  getElementsByClassName(className: string): SelectorResult {
    const elements: ExtractedElement[] = [];
    const escapedClass = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `<([a-z][a-z0-9]*)([^>]*class=["'][^"']*\\b${escapedClass}\\b[^"']*["'][^>]*)>([\\s\\S]*?)<\\/\\1>`,
      'gi'
    );

    let match;
    let index = 0;
    while ((match = regex.exec(this.html)) !== null) {
      elements.push({
        tag: match[1].toLowerCase(),
        attributes: this.parseAttributes(match[2]),
        content: match[3].trim(),
        outerHtml: match[0],
        index: index++,
      });
    }

    return this.createSelectorResult(elements);
  }

  /**
   * Find element by ID
   */
  getElementById(id: string): ExtractedElement | null {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `<([a-z][a-z0-9]*)([^>]*id=["']${escapedId}["'][^>]*)>([\\s\\S]*?)<\\/\\1>`,
      'i'
    );

    const match = regex.exec(this.html);
    if (!match) return null;

    return {
      tag: match[1].toLowerCase(),
      attributes: this.parseAttributes(match[2]),
      content: match[3].trim(),
      outerHtml: match[0],
      index: 0,
    };
  }

  /**
   * Find elements by attribute
   */
  getElementsByAttribute(attrName: string, attrValue?: string): SelectorResult {
    const elements: ExtractedElement[] = [];
    let regex: RegExp;

    if (attrValue !== undefined) {
      const escapedValue = attrValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      regex = new RegExp(
        `<([a-z][a-z0-9]*)([^>]*${attrName}=["']${escapedValue}["'][^>]*)>([\\s\\S]*?)<\\/\\1>`,
        'gi'
      );
    } else {
      regex = new RegExp(
        `<([a-z][a-z0-9]*)([^>]*${attrName}(?:=["'][^"']*["'])?[^>]*)>([\\s\\S]*?)<\\/\\1>`,
        'gi'
      );
    }

    let match;
    let index = 0;
    while ((match = regex.exec(this.html)) !== null) {
      elements.push({
        tag: match[1].toLowerCase(),
        attributes: this.parseAttributes(match[2]),
        content: match[3].trim(),
        outerHtml: match[0],
        index: index++,
      });
    }

    return this.createSelectorResult(elements);
  }

  // ============================================
  // CSS SELECTOR SUPPORT (BASIC)
  // ============================================

  /**
   * Query selector (basic support)
   * Supports: tag, .class, #id, tag.class, tag#id, [attr], [attr=value]
   */
  querySelector(selector: string): ExtractedElement | null {
    const result = this.querySelectorAll(selector);
    return result.first;
  }

  /**
   * Query selector all (basic support)
   */
  querySelectorAll(selector: string): SelectorResult {
    // Parse selector
    const idMatch = selector.match(/#([a-zA-Z][a-zA-Z0-9_-]*)/);
    const classMatches = selector.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g);
    const tagMatch = selector.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
    const attrMatch = selector.match(/\[([a-zA-Z][a-zA-Z0-9_-]*)(?:=["']([^"']*)["'])?\]/);

    // ID selector takes precedence
    if (idMatch) {
      const element = this.getElementById(idMatch[1]);
      return this.createSelectorResult(element ? [element] : []);
    }

    // Start with tag or all elements
    let elements: ExtractedElement[];
    if (tagMatch) {
      elements = this.getElementsByTagName(tagMatch[1]).elements;
    } else {
      // Get all elements with the specified class
      if (classMatches && classMatches.length > 0) {
        const className = classMatches[0].substring(1);
        elements = this.getElementsByClassName(className).elements;
      } else if (attrMatch) {
        elements = this.getElementsByAttribute(attrMatch[1], attrMatch[2]).elements;
      } else {
        return this.createSelectorResult([]);
      }
    }

    // Filter by classes
    if (classMatches) {
      for (const classSelector of classMatches) {
        const className = classSelector.substring(1);
        elements = elements.filter((el) => {
          const classes = (el.attributes.class || '').split(/\s+/);
          return classes.includes(className);
        });
      }
    }

    // Filter by attribute
    if (attrMatch) {
      const attrName = attrMatch[1];
      const attrValue = attrMatch[2];
      elements = elements.filter((el) => {
        if (attrValue !== undefined) {
          return el.attributes[attrName] === attrValue;
        }
        return attrName in el.attributes;
      });
    }

    return this.createSelectorResult(elements);
  }

  // ============================================
  // META INFORMATION
  // ============================================

  /**
   * Extract all meta information
   */
  getMetaInfo(): MetaInfo {
    return {
      title: this.getTitle(),
      description: this.getMetaContent('description'),
      keywords: this.getMetaContent('keywords'),
      author: this.getMetaContent('author'),
      viewport: this.getMetaContent('viewport'),
      robots: this.getMetaContent('robots'),
      canonical: this.getCanonical(),
      ogTitle: this.getMetaProperty('og:title'),
      ogDescription: this.getMetaProperty('og:description'),
      ogImage: this.getMetaProperty('og:image'),
      ogUrl: this.getMetaProperty('og:url'),
      twitterCard: this.getMetaContent('twitter:card'),
      twitterTitle: this.getMetaContent('twitter:title'),
      twitterDescription: this.getMetaContent('twitter:description'),
      twitterImage: this.getMetaContent('twitter:image'),
    };
  }

  /**
   * Get page title
   */
  getTitle(): string | null {
    const match = this.html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? this.decodeHtmlEntities(match[1].trim()) : null;
  }

  /**
   * Get meta tag content by name
   */
  getMetaContent(name: string): string | null {
    const regex = new RegExp(
      `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']|<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${name}["']`,
      'i'
    );
    const match = this.html.match(regex);
    return match ? this.decodeHtmlEntities(match[1] || match[2]) : null;
  }

  /**
   * Get meta tag content by property (Open Graph)
   */
  getMetaProperty(property: string): string | null {
    const regex = new RegExp(
      `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']|<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`,
      'i'
    );
    const match = this.html.match(regex);
    return match ? this.decodeHtmlEntities(match[1] || match[2]) : null;
  }

  /**
   * Get canonical URL
   */
  getCanonical(): string | null {
    const match = this.html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    return match ? match[1] : null;
  }

  // ============================================
  // LINK EXTRACTION
  // ============================================

  /**
   * Extract all links
   */
  getLinks(): LinkInfo[] {
    const links: LinkInfo[] = [];
    const regex = /<a([^>]*)>([^<]*(?:<(?!\/a>)[^<]*)*)<\/a>/gi;

    let match;
    while ((match = regex.exec(this.html)) !== null) {
      const attributes = this.parseAttributes(match[1]);
      const href = attributes.href;

      if (!href) continue;

      links.push({
        href: this.resolveUrl(href),
        text: this.extractText(match[2]),
        title: attributes.title,
        rel: attributes.rel,
        target: attributes.target,
        isExternal: this.isExternalUrl(href),
        isAnchor: href.startsWith('#'),
      });
    }

    return links;
  }

  /**
   * Extract internal links only
   */
  getInternalLinks(): LinkInfo[] {
    return this.getLinks().filter((link) => !link.isExternal && !link.isAnchor);
  }

  /**
   * Extract external links only
   */
  getExternalLinks(): LinkInfo[] {
    return this.getLinks().filter((link) => link.isExternal);
  }

  // ============================================
  // IMAGE EXTRACTION
  // ============================================

  /**
   * Extract all images
   */
  getImages(): ImageInfo[] {
    const images: ImageInfo[] = [];
    const regex = /<img([^>]*)>/gi;

    let match;
    while ((match = regex.exec(this.html)) !== null) {
      const attributes = this.parseAttributes(match[1]);
      
      if (!attributes.src) continue;

      images.push({
        src: this.resolveUrl(attributes.src),
        alt: attributes.alt || '',
        title: attributes.title,
        width: attributes.width,
        height: attributes.height,
        loading: attributes.loading,
      });
    }

    return images;
  }

  // ============================================
  // TABLE EXTRACTION
  // ============================================

  /**
   * Extract tables as structured data
   */
  getTables(): TableData[] {
    const tables: TableData[] = [];
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;

    let tableMatch;
    while ((tableMatch = tableRegex.exec(this.html)) !== null) {
      const tableHtml = tableMatch[1];
      const table: TableData = {
        headers: [],
        rows: [],
      };

      // Extract caption
      const captionMatch = tableHtml.match(/<caption[^>]*>([^<]+)<\/caption>/i);
      if (captionMatch) {
        table.caption = this.extractText(captionMatch[1]);
      }

      // Extract headers from thead or first row with th
      const headerRegex = /<th[^>]*>([^<]*(?:<(?!\/th>)[^<]*)*)<\/th>/gi;
      let headerMatch;
      while ((headerMatch = headerRegex.exec(tableHtml)) !== null) {
        table.headers.push(this.extractText(headerMatch[1]));
      }

      // Extract rows
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;
      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const rowHtml = rowMatch[1];
        const cells: string[] = [];
        
        const cellRegex = /<t[dh][^>]*>([^<]*(?:<(?!\/t[dh]>)[^<]*)*)<\/t[dh]>/gi;
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
          cells.push(this.extractText(cellMatch[1]));
        }

        if (cells.length > 0) {
          // Skip if all cells are headers (already captured)
          if (table.headers.length === 0 || !rowHtml.includes('<th')) {
            table.rows.push(cells);
          }
        }
      }

      tables.push(table);
    }

    return tables;
  }

  // ============================================
  // TEXT EXTRACTION
  // ============================================

  /**
   * Extract all text content
   */
  getTextContent(): string {
    let text = this.html;

    // Remove script and style tags
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

    // Remove comments
    text = text.replace(/<!--[\s\S]*?-->/g, '');

    // Remove tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode entities
    text = this.decodeHtmlEntities(text);

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Extract text from specific elements (headings, paragraphs, etc.)
   */
  getStructuredText(): {
    headings: { level: number; text: string }[];
    paragraphs: string[];
    lists: { type: 'ul' | 'ol'; items: string[] }[];
  } {
    const headings: { level: number; text: string }[] = [];
    const paragraphs: string[] = [];
    const lists: { type: 'ul' | 'ol'; items: string[] }[] = [];

    // Extract headings
    for (let level = 1; level <= 6; level++) {
      const regex = new RegExp(`<h${level}[^>]*>([^<]*(?:<(?!\\/h${level}>)[^<]*)*)<\\/h${level}>`, 'gi');
      let match;
      while ((match = regex.exec(this.html)) !== null) {
        headings.push({
          level,
          text: this.extractText(match[1]),
        });
      }
    }

    // Extract paragraphs
    const pRegex = /<p[^>]*>([^<]*(?:<(?!\/p>)[^<]*)*)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(this.html)) !== null) {
      const text = this.extractText(pMatch[1]);
      if (text) paragraphs.push(text);
    }

    // Extract lists
    const listRegex = /<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi;
    let listMatch;
    while ((listMatch = listRegex.exec(this.html)) !== null) {
      const listType = listMatch[1].toLowerCase() as 'ul' | 'ol';
      const listHtml = listMatch[2];
      const items: string[] = [];

      const itemRegex = /<li[^>]*>([^<]*(?:<(?!\/li>)[^<]*)*)<\/li>/gi;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(listHtml)) !== null) {
        const text = this.extractText(itemMatch[1]);
        if (text) items.push(text);
      }

      if (items.length > 0) {
        lists.push({ type: listType, items });
      }
    }

    return { headings, paragraphs, lists };
  }

  // ============================================
  // STRUCTURED DATA
  // ============================================

  /**
   * Extract JSON-LD structured data
   */
  getJsonLd(): unknown[] {
    const results: unknown[] = [];
    const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match;
    while ((match = regex.exec(this.html)) !== null) {
      try {
        const data = JSON.parse(match[1].trim());
        results.push(data);
      } catch {
        // Invalid JSON, skip
      }
    }

    return results;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Parse HTML attributes from attribute string
   */
  private parseAttributes(attrString: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const regex = /([a-zA-Z][a-zA-Z0-9_-]*)(?:=["']([^"']*)["']|=([^\s>]+))?/g;

    let match;
    while ((match = regex.exec(attrString)) !== null) {
      const name = match[1].toLowerCase();
      const value = match[2] || match[3] || '';
      attributes[name] = this.decodeHtmlEntities(value);
    }

    return attributes;
  }

  /**
   * Create selector result object
   */
  private createSelectorResult(elements: ExtractedElement[]): SelectorResult {
    return {
      elements,
      count: elements.length,
      first: elements.length > 0 ? elements[0] : null,
      last: elements.length > 0 ? elements[elements.length - 1] : null,
      texts: elements.map((el) => this.extractText(el.content)),
      attrs: (attr: string) => elements.map((el) => el.attributes[attr] || ''),
    };
  }

  /**
   * Extract text from HTML content
   */
  private extractText(html: string): string {
    let text = html.replace(/<[^>]+>/g, ' ');
    text = this.decodeHtmlEntities(text);
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(url: string): string {
    if (!this.baseUrl) return url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      return url;
    }
    try {
      return new URL(url, this.baseUrl).toString();
    } catch {
      return url;
    }
  }

  /**
   * Check if URL is external
   */
  private isExternalUrl(url: string): boolean {
    if (!this.baseUrl || url.startsWith('#')) return false;
    try {
      const baseOrigin = new URL(this.baseUrl).origin;
      const urlOrigin = new URL(url, this.baseUrl).origin;
      return baseOrigin !== urlOrigin;
    } catch {
      return false;
    }
  }
}

/**
 * Factory function to create parser
 */
export function createDomParser(html: string, baseUrl?: string): KeylessScraperDomParser {
  return new KeylessScraperDomParser(html, baseUrl);
}

/**
 * Quick extraction utilities
 */
export const DomUtils = {
  /**
   * Extract title from HTML
   */
  getTitle(html: string): string | null {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : null;
  },

  /**
   * Extract all links from HTML
   */
  getLinks(html: string, baseUrl?: string): string[] {
    const links: string[] = [];
    const regex = /<a[^>]+href=["']([^"']+)["']/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      try {
        const href = match[1];
        if (href.startsWith('javascript:') || href.startsWith('#')) continue;
        
        const absoluteUrl = baseUrl ? new URL(href, baseUrl).toString() : href;
        if (!links.includes(absoluteUrl)) {
          links.push(absoluteUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return links;
  },

  /**
   * Extract all text from HTML
   */
  getText(html: string): string {
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    
    return text.replace(/\s+/g, ' ').trim();
  },

  /**
   * Extract images from HTML
   */
  getImages(html: string, baseUrl?: string): string[] {
    const images: string[] = [];
    const regex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      try {
        const src = match[1];
        const absoluteUrl = baseUrl ? new URL(src, baseUrl).toString() : src;
        if (!images.includes(absoluteUrl)) {
          images.push(absoluteUrl);
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return images;
  },
};

export default KeylessScraperDomParser;
