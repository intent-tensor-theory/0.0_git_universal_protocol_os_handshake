// ============================================
// PROTOCOL OS - SOAP/XML ENVELOPE BUILDER
// ============================================
// Address: 1.3.9.d
// Purpose: Utility for constructing SOAP envelopes
// ============================================

import type {
  SoapVersion,
  WsSecurityPasswordType,
} from './1.3.9.a_fileSoapXmlHandshakeExecutor';

/**
 * SOAP Envelope Builder
 * 
 * Fluent API for constructing SOAP messages with:
 * - Namespace management
 * - WS-Security headers
 * - Custom headers
 * - Structured body content
 */

/**
 * Namespace definition
 */
export interface SoapNamespace {
  prefix: string;
  uri: string;
}

/**
 * WS-Security configuration
 */
export interface WsSecurityConfig {
  username: string;
  password: string;
  passwordType: WsSecurityPasswordType;
  includeTimestamp: boolean;
  timestampTtl: number;
  includeNonce: boolean;
}

/**
 * SOAP Envelope options
 */
export interface SoapEnvelopeOptions {
  version: SoapVersion;
  namespaces?: SoapNamespace[];
  encoding?: string;
}

/**
 * SOAP Header element
 */
export interface SoapHeaderElement {
  xml: string;
  mustUnderstand?: boolean;
  actor?: string; // SOAP 1.1
  role?: string;  // SOAP 1.2
}

/**
 * SOAP Envelope Builder
 */
export class SoapEnvelopeBuilder {
  private version: SoapVersion;
  private encoding: string;
  private namespaces: Map<string, string> = new Map();
  private headers: SoapHeaderElement[] = [];
  private bodyContent: string = '';

  constructor(options: SoapEnvelopeOptions = { version: '1.1' }) {
    this.version = options.version;
    this.encoding = options.encoding || 'UTF-8';

    // Add default SOAP namespace
    if (this.version === '1.2') {
      this.namespaces.set('soap', 'http://www.w3.org/2003/05/soap-envelope');
    } else {
      this.namespaces.set('soap', 'http://schemas.xmlsoap.org/soap/envelope/');
    }

    // Add any custom namespaces
    if (options.namespaces) {
      for (const ns of options.namespaces) {
        this.namespaces.set(ns.prefix, ns.uri);
      }
    }
  }

  /**
   * Add a namespace
   */
  addNamespace(prefix: string, uri: string): this {
    this.namespaces.set(prefix, uri);
    return this;
  }

  /**
   * Add WS-Security header
   */
  addWsSecurity(config: WsSecurityConfig): this {
    // Add WS-Security namespaces
    this.addNamespace('wsse', 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd');
    this.addNamespace('wsu', 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd');

    const now = new Date();
    const created = now.toISOString();
    const expires = new Date(now.getTime() + config.timestampTtl * 1000).toISOString();
    const nonce = this.generateNonce();

    let passwordValue = config.password;
    let passwordTypeUri = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText';

    if (config.passwordType === 'PasswordDigest') {
      passwordValue = this.createPasswordDigest(nonce, created, config.password);
      passwordTypeUri = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest';
    }

    let timestampXml = '';
    if (config.includeTimestamp) {
      timestampXml = `
      <wsu:Timestamp wsu:Id="Timestamp-${this.generateId()}">
        <wsu:Created>${created}</wsu:Created>
        <wsu:Expires>${expires}</wsu:Expires>
      </wsu:Timestamp>`;
    }

    let nonceXml = '';
    if (config.includeNonce) {
      nonceXml = `
        <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce}</wsse:Nonce>
        <wsu:Created>${created}</wsu:Created>`;
    }

    const securityXml = `
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" 
                   xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"
                   soap:mustUnderstand="${this.version === '1.2' ? 'true' : '1'}">
      ${timestampXml}
      <wsse:UsernameToken wsu:Id="UsernameToken-${this.generateId()}">
        <wsse:Username>${this.escapeXml(config.username)}</wsse:Username>
        <wsse:Password Type="${passwordTypeUri}">${this.escapeXml(passwordValue)}</wsse:Password>${nonceXml}
      </wsse:UsernameToken>
    </wsse:Security>`;

    this.headers.push({
      xml: securityXml.trim(),
      mustUnderstand: true,
    });

    return this;
  }

  /**
   * Add WS-Addressing headers
   */
  addWsAddressing(options: {
    to: string;
    action: string;
    messageId?: string;
    replyTo?: string;
    from?: string;
  }): this {
    this.addNamespace('wsa', 'http://www.w3.org/2005/08/addressing');

    const messageId = options.messageId || `urn:uuid:${this.generateUUID()}`;
    
    let addressingXml = `
    <wsa:To>${this.escapeXml(options.to)}</wsa:To>
    <wsa:Action>${this.escapeXml(options.action)}</wsa:Action>
    <wsa:MessageID>${messageId}</wsa:MessageID>`;

    if (options.replyTo) {
      addressingXml += `
    <wsa:ReplyTo>
      <wsa:Address>${this.escapeXml(options.replyTo)}</wsa:Address>
    </wsa:ReplyTo>`;
    }

    if (options.from) {
      addressingXml += `
    <wsa:From>
      <wsa:Address>${this.escapeXml(options.from)}</wsa:Address>
    </wsa:From>`;
    }

    this.headers.push({ xml: addressingXml.trim() });

    return this;
  }

  /**
   * Add a custom header
   */
  addHeader(xml: string, options?: { mustUnderstand?: boolean; actor?: string; role?: string }): this {
    this.headers.push({
      xml: xml.trim(),
      mustUnderstand: options?.mustUnderstand,
      actor: options?.actor,
      role: options?.role,
    });
    return this;
  }

  /**
   * Set the body content
   */
  setBody(xml: string): this {
    this.bodyContent = xml.trim();
    return this;
  }

  /**
   * Build an operation body
   */
  buildOperationBody(
    operationName: string,
    namespace: string,
    parameters: Record<string, unknown>
  ): this {
    const prefix = this.findPrefixForUri(namespace) || 'ns';
    if (!this.namespaces.has(prefix)) {
      this.addNamespace(prefix, namespace);
    }

    const paramsXml = this.objectToXml(parameters, '    ');
    
    this.bodyContent = `
    <${prefix}:${operationName} xmlns:${prefix}="${namespace}">
${paramsXml}
    </${prefix}:${operationName}>`.trim();

    return this;
  }

  /**
   * Build the complete SOAP envelope
   */
  build(): string {
    const namespaceDeclarations = Array.from(this.namespaces.entries())
      .map(([prefix, uri]) => `xmlns:${prefix}="${uri}"`)
      .join('\n      ');

    let headerSection = '';
    if (this.headers.length > 0) {
      const headerContent = this.headers.map(h => h.xml).join('\n    ');
      headerSection = `
  <soap:Header>
    ${headerContent}
  </soap:Header>`;
    }

    const envelope = `<?xml version="1.0" encoding="${this.encoding}"?>
<soap:Envelope
      ${namespaceDeclarations}>${headerSection}
  <soap:Body>
    ${this.bodyContent}
  </soap:Body>
</soap:Envelope>`;

    return envelope;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Find namespace prefix for URI
   */
  private findPrefixForUri(uri: string): string | undefined {
    for (const [prefix, nsUri] of this.namespaces.entries()) {
      if (nsUri === uri) return prefix;
    }
    return undefined;
  }

  /**
   * Convert object to XML elements
   */
  private objectToXml(obj: Record<string, unknown>, indent: string = ''): string {
    const lines: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;

      if (typeof value === 'object' && !Array.isArray(value)) {
        // Nested object
        const nested = this.objectToXml(value as Record<string, unknown>, indent + '  ');
        lines.push(`${indent}<${key}>`);
        lines.push(nested);
        lines.push(`${indent}</${key}>`);
      } else if (Array.isArray(value)) {
        // Array of items
        for (const item of value) {
          if (typeof item === 'object') {
            const nested = this.objectToXml(item as Record<string, unknown>, indent + '  ');
            lines.push(`${indent}<${key}>`);
            lines.push(nested);
            lines.push(`${indent}</${key}>`);
          } else {
            lines.push(`${indent}<${key}>${this.escapeXml(String(item))}</${key}>`);
          }
        }
      } else {
        // Simple value
        lines.push(`${indent}<${key}>${this.escapeXml(String(value))}</${key}>`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate nonce for WS-Security
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 11).toUpperCase();
  }

  /**
   * Generate UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Create password digest for WS-Security
   */
  private createPasswordDigest(nonce: string, created: string, password: string): string {
    // Note: In production, use proper crypto library
    // This is a simplified placeholder
    const data = atob(nonce) + created + password;
    return btoa(data); // Should be Base64(SHA-1(nonce + created + password))
  }
}

/**
 * SOAP Response Parser
 */
export class SoapResponseParser {
  private xml: string;

  constructor(xml: string) {
    this.xml = xml;
  }

  /**
   * Check if response is a SOAP Fault
   */
  isFault(): boolean {
    return this.xml.includes('Fault>');
  }

  /**
   * Extract SOAP body content
   */
  getBody(): string | null {
    const match = this.xml.match(/<(?:soap:|SOAP-ENV:)?Body[^>]*>([\s\S]*?)<\/(?:soap:|SOAP-ENV:)?Body>/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract fault information
   */
  getFault(): {
    faultCode: string;
    faultString: string;
    faultActor?: string;
    detail?: string;
  } | null {
    if (!this.isFault()) return null;

    const body = this.getBody();
    if (!body) return null;

    return {
      faultCode: this.extractElement(body, 'faultcode') || 
                 this.extractElement(body, 'Code') || 'Unknown',
      faultString: this.extractElement(body, 'faultstring') || 
                   this.extractElement(body, 'Reason') || 'Unknown error',
      faultActor: this.extractElement(body, 'faultactor') ||
                  this.extractElement(body, 'Role'),
      detail: this.extractElement(body, 'detail') ||
              this.extractElement(body, 'Detail'),
    };
  }

  /**
   * Extract element by name
   */
  extractElement(xml: string, name: string): string | null {
    const regex = new RegExp(`<(?:[a-z]+:)?${name}[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?${name}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract all elements by name
   */
  extractAllElements(name: string): string[] {
    const regex = new RegExp(`<(?:[a-z]+:)?${name}[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?${name}>`, 'gi');
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(this.xml)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  }

  /**
   * Get raw XML
   */
  getRawXml(): string {
    return this.xml;
  }
}

/**
 * XML Builder utilities
 */
export class XmlBuilder {
  private elements: string[] = [];
  private indent: number = 0;

  /**
   * Add element with content
   */
  element(name: string, content: string | number | boolean, attributes?: Record<string, string>): this {
    const attrs = attributes 
      ? ' ' + Object.entries(attributes).map(([k, v]) => `${k}="${this.escapeAttr(v)}"`).join(' ')
      : '';
    const indentStr = '  '.repeat(this.indent);
    this.elements.push(`${indentStr}<${name}${attrs}>${this.escapeXml(String(content))}</${name}>`);
    return this;
  }

  /**
   * Start element (for nesting)
   */
  start(name: string, attributes?: Record<string, string>): this {
    const attrs = attributes 
      ? ' ' + Object.entries(attributes).map(([k, v]) => `${k}="${this.escapeAttr(v)}"`).join(' ')
      : '';
    const indentStr = '  '.repeat(this.indent);
    this.elements.push(`${indentStr}<${name}${attrs}>`);
    this.indent++;
    return this;
  }

  /**
   * End element
   */
  end(name: string): this {
    this.indent--;
    const indentStr = '  '.repeat(this.indent);
    this.elements.push(`${indentStr}</${name}>`);
    return this;
  }

  /**
   * Add raw XML
   */
  raw(xml: string): this {
    const indentStr = '  '.repeat(this.indent);
    const lines = xml.split('\n').map(line => indentStr + line.trim());
    this.elements.push(...lines);
    return this;
  }

  /**
   * Add comment
   */
  comment(text: string): this {
    const indentStr = '  '.repeat(this.indent);
    this.elements.push(`${indentStr}<!-- ${text} -->`);
    return this;
  }

  /**
   * Build final XML string
   */
  build(): string {
    return this.elements.join('\n');
  }

  /**
   * Reset builder
   */
  reset(): this {
    this.elements = [];
    this.indent = 0;
    return this;
  }

  /**
   * Escape XML content
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Escape XML attribute value
   */
  private escapeAttr(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

/**
 * Factory function for SOAP envelope builder
 */
export function createSoapEnvelope(version: SoapVersion = '1.1'): SoapEnvelopeBuilder {
  return new SoapEnvelopeBuilder({ version });
}

/**
 * Factory function for SOAP response parser
 */
export function parseSoapResponse(xml: string): SoapResponseParser {
  return new SoapResponseParser(xml);
}

/**
 * Factory function for XML builder
 */
export function createXmlBuilder(): XmlBuilder {
  return new XmlBuilder();
}

export default SoapEnvelopeBuilder;
