// ============================================
// PROTOCOL OS - SOAP/XML HANDLER
// ============================================
// Address: 1.4.9.a
// Purpose: SOAP/XML web services handler
// ============================================

import {
  BaseProtocolHandler,
  type AuthenticationValidationResult,
  type HandshakeExecutionOptions,
} from '@registry/1.3.a_fileProtocolHandlerInterface';
import type { AuthenticationConfig, AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';

/**
 * SOAP/XML Handler
 * 
 * Enterprise SOAP web services with XML messages.
 */
export class SoapXmlHandler extends BaseProtocolHandler {
  readonly protocolType = 'soap-xml' as const;
  readonly displayName = 'SOAP/XML';
  readonly description = 'Enterprise SOAP web services with XML';
  readonly supportsTokenRefresh = false;
  readonly requiresUserInteraction = false;
  readonly iconId = 'file-code';

  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult {
    const missingFields: string[] = [];
    const soapConfig = config.soapXml;

    if (!soapConfig) {
      return { isValid: false, missingFields: ['soapXml configuration'], invalidFields: [], warnings: [] };
    }

    if (!soapConfig.endpoint) missingFields.push('endpoint');

    return {
      isValid: missingFields.length === 0,
      missingFields,
      invalidFields: [],
      warnings: soapConfig.wsdlUrl ? [] : ['No WSDL URL provided - operations must be defined manually'],
    };
  }

  getRequiredFields(): string[] {
    return ['endpoint'];
  }

  getOptionalFields(): string[] {
    return ['wsdlUrl', 'soapAction', 'soapVersion', 'username', 'password', 'wsseHeader'];
  }

  async authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    const soapConfig = config.soapXml;
    
    if (!soapConfig) {
      return { success: false, error: 'SOAP/XML configuration not provided' };
    }

    return {
      success: true,
      credentials: {
        type: 'soap',
        endpoint: soapConfig.endpoint,
        username: soapConfig.username,
        password: soapConfig.password,
        obtainedAt: new Date().toISOString(),
      },
    };
  }

  async executeRequest(
    curlRequest: CurlRequest,
    config: AuthenticationConfig,
    credentials: AuthenticationCredentials,
    options?: HandshakeExecutionOptions
  ): Promise<HandshakeExecutionResult> {
    const startTime = Date.now();
    const logs: ExecutionLogEntry[] = [];

    const log = (level: ExecutionLogEntry['level'], message: string) => {
      logs.push({ timestamp: new Date().toISOString(), level, message });
      options?.onLog?.({ timestamp: new Date().toISOString(), level, message });
    };

    log('INFO', `SOAP Request: ${curlRequest.title}`);

    try {
      const soapConfig = config.soapXml!;
      
      // Extract SOAP envelope from curl command or testData
      let soapEnvelope = '';
      const dataMatch = curlRequest.command.match(/-d\s+['"](.+?)['"]/s);
      
      if (dataMatch) {
        soapEnvelope = dataMatch[1];
      } else if (curlRequest.testData) {
        soapEnvelope = curlRequest.testData;
      }

      if (!soapEnvelope) {
        throw new Error('No SOAP envelope found');
      }

      // Add WS-Security header if credentials provided
      if (soapConfig.username && soapConfig.password) {
        soapEnvelope = this.addWsseHeader(soapEnvelope, soapConfig.username, soapConfig.password);
      }

      log('INFO', `Sending to ${soapConfig.endpoint}`);

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': soapConfig.soapVersion === '1.2' 
          ? 'application/soap+xml; charset=utf-8'
          : 'text/xml; charset=utf-8',
        ...options?.additionalHeaders,
      };

      if (soapConfig.soapAction) {
        headers['SOAPAction'] = soapConfig.soapAction;
      }

      const response = await fetch(soapConfig.endpoint, {
        method: 'POST',
        headers,
        body: soapEnvelope,
        signal: options?.signal,
      });

      const responseText = await response.text();

      // Check for SOAP fault
      if (responseText.includes('soap:Fault') || responseText.includes('SOAP-ENV:Fault')) {
        log('ERROR', 'SOAP Fault received');
        return {
          ...this.createSuccessResult(response, responseText, logs, startTime),
          success: false,
          error: 'SOAP Fault in response',
        };
      }

      log('SUCCESS', 'SOAP request completed');
      return this.createSuccessResult(response, responseText, logs, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log('ERROR', message);
      return this.createErrorResult(message, logs, startTime);
    }
  }

  /**
   * Add WS-Security header to SOAP envelope
   */
  private addWsseHeader(envelope: string, username: string, password: string): string {
    const wsseHeader = `
      <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
        <wsse:UsernameToken>
          <wsse:Username>${username}</wsse:Username>
          <wsse:Password>${password}</wsse:Password>
        </wsse:UsernameToken>
      </wsse:Security>`;

    // Insert into Header element
    return envelope.replace(/<soap:Header>/, `<soap:Header>${wsseHeader}`);
  }

  generateSampleCurl(config: AuthenticationConfig): string {
    const endpoint = config.soapXml?.endpoint || 'https://api.example.com/soap';
    
    return `curl -X POST "${endpoint}" \\
  -H "Content-Type: text/xml; charset=utf-8" \\
  -H "SOAPAction: http://example.com/Action" \\
  -d '<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body>
    <GetData xmlns="http://example.com/">
      <id>123</id>
    </GetData>
  </soap:Body>
</soap:Envelope>'`;
  }

  async testConnection(config: AuthenticationConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const soapConfig = config.soapXml;
    if (!soapConfig?.endpoint) {
      return { success: false, message: 'SOAP endpoint not configured' };
    }

    const startTime = Date.now();
    try {
      const response = await fetch(soapConfig.endpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return {
        success: true,
        message: `Endpoint reachable (${response.status})`,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
    }
  }
}

export default SoapXmlHandler;
