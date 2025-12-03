// ============================================
// PROTOCOL OS - SOAP/XML UTILITIES
// ============================================
// Address: 1.4.9.b
// Purpose: Utility functions for SOAP/XML operations
// ============================================

/**
 * SOAP versions
 */
export const SOAP_VERSIONS = {
  '1.1': {
    namespace: 'http://schemas.xmlsoap.org/soap/envelope/',
    contentType: 'text/xml; charset=utf-8',
  },
  '1.2': {
    namespace: 'http://www.w3.org/2003/05/soap-envelope',
    contentType: 'application/soap+xml; charset=utf-8',
  },
} as const;

/**
 * Build a basic SOAP envelope
 */
export function buildSoapEnvelope(
  body: string,
  header?: string,
  version: '1.1' | '1.2' = '1.1'
): string {
  const ns = version === '1.2' ? 'soap12' : 'soap';
  const namespace = SOAP_VERSIONS[version].namespace;

  return `<?xml version="1.0" encoding="utf-8"?>
<${ns}:Envelope xmlns:${ns}="${namespace}">
  <${ns}:Header>${header || ''}</${ns}:Header>
  <${ns}:Body>${body}</${ns}:Body>
</${ns}:Envelope>`;
}

/**
 * Build WS-Security UsernameToken header
 */
export function buildWsseUsernameToken(
  username: string,
  password: string,
  passwordType: 'PasswordText' | 'PasswordDigest' = 'PasswordText'
): string {
  const nonce = btoa(String(Math.random()));
  const created = new Date().toISOString();

  return `<wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"
                  xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
    <wsse:UsernameToken wsu:Id="UsernameToken-${Date.now()}">
      <wsse:Username>${escapeXml(username)}</wsse:Username>
      <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#${passwordType}">${escapeXml(password)}</wsse:Password>
      <wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${nonce}</wsse:Nonce>
      <wsu:Created>${created}</wsu:Created>
    </wsse:UsernameToken>
  </wsse:Security>`;
}

/**
 * Escape XML special characters
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extract SOAP fault message
 */
export function extractSoapFault(xml: string): { code?: string; message?: string } | null {
  const faultCodeMatch = xml.match(/<faultcode>([^<]+)<\/faultcode>/);
  const faultStringMatch = xml.match(/<faultstring>([^<]+)<\/faultstring>/);
  
  if (!faultCodeMatch && !faultStringMatch) return null;

  return {
    code: faultCodeMatch?.[1],
    message: faultStringMatch?.[1],
  };
}

/**
 * Simple XML parser (for basic extraction)
 */
export function extractXmlElement(xml: string, elementName: string): string | null {
  const regex = new RegExp(`<${elementName}[^>]*>([\\s\\S]*?)<\\/${elementName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Common SOAP namespaces
 */
export const SOAP_NAMESPACES = {
  SOAP_ENV: 'http://schemas.xmlsoap.org/soap/envelope/',
  SOAP12_ENV: 'http://www.w3.org/2003/05/soap-envelope',
  XSD: 'http://www.w3.org/2001/XMLSchema',
  XSI: 'http://www.w3.org/2001/XMLSchema-instance',
  WSSE: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
  WSU: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
} as const;
