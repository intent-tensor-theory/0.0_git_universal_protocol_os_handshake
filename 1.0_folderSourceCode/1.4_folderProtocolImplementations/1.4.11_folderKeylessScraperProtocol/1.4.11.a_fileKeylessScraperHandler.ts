// ============================================
// PROTOCOL OS - KEYLESS SCRAPER HANDLER
// ============================================
// Address: 1.4.11.a
// Purpose: Web scraping without authentication
// ============================================

import {
  BaseProtocolHandler,
  type AuthenticationValidationResult,
  type HandshakeExecutionOptions,
} from '@registry/1.3.a_fileProtocolHandlerInterface';
import type { AuthenticationConfig, AuthenticationCredentials } from '@types/1.9.d_fileAuthenticationTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';
import type { HandshakeExecutionResult, ExecutionLogEntry } from '@types/1.9.h_fileExecutionResultTypeDefinitions';
import { substituteAllPlaceholders } from '@utils/1.8.e_fileInputPlaceholderSubstitution';

/**
 * Keyless Scraper Handler
 * 
 * Web scraping for public resources without authentication.
 */
export class KeylessScraperHandler extends BaseProtocolHandler {
  readonly protocolType = 'keyless-scraper' as const;
  readonly displayName = 'Keyless Scraper';
  readonly description = 'Web scraping without authentication';
  readonly supportsTokenRefresh = false;
  readonly requiresUserInteraction = false;
  readonly iconId = 'globe';

  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult {
    const scraperConfig = config.keylessScraper;

    const warnings: string[] = [
      'Ensure you have permission to scrape the target website',
      'Respect robots.txt and rate limits',
    ];

    if (scraperConfig?.userAgent?.includes('bot')) {
      warnings.push('User-Agent identifies as a bot - some sites may block this');
    }

    return {
      isValid: true,
      missingFields: [],
      invalidFields: [],
      warnings,
    };
  }

  getRequiredFields(): string[] {
    return [];
  }

  getOptionalFields(): string[] {
    return ['userAgent', 'defaultHeaders', 'rateLimit', 'followRedirects'];
  }

  async authenticate(_config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    // No authentication needed
    return {
      success: true,
      credentials: {
        type: 'none',
        obtainedAt: new Date().toISOString(),
      },
    };
  }

  async executeRequest(
    curlRequest: CurlRequest,
    config: AuthenticationConfig,
    _credentials: AuthenticationCredentials,
    options?: HandshakeExecutionOptions
  ): Promise<HandshakeExecutionResult> {
    const startTime = Date.now();
    const logs: ExecutionLogEntry[] = [];

    const log = (level: ExecutionLogEntry['level'], message: string) => {
      logs.push({ timestamp: new Date().toISOString(), level, message });
      options?.onLog?.({ timestamp: new Date().toISOString(), level, message });
    };

    log('INFO', `Scraping: ${curlRequest.title}`);

    try {
      const scraperConfig = config.keylessScraper;

      // Substitute placeholders
      const substituted = substituteAllPlaceholders(
        curlRequest.command,
        options?.variables ?? {},
        { timestamp: true, uuid: true }
      );

      // Extract URL
      const urlMatch = substituted.result.match(/["']?(https?:\/\/[^"'\s]+)["']?/);
      if (!urlMatch) {
        throw new Error('Could not extract URL from command');
      }

      const url = urlMatch[1];
      const methodMatch = substituted.result.match(/-X\s+(\w+)/i);
      const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

      log('INFO', `${method} ${url}`);

      // Build headers with realistic browser-like defaults
      const headers: Record<string, string> = {
        'User-Agent': scraperConfig?.userAgent || 
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        ...scraperConfig?.defaultHeaders,
        ...options?.additionalHeaders,
      };

      // Extract headers from curl command
      const headerMatches = substituted.result.matchAll(/-H\s+["']([^:]+):\s*([^"']+)["']/gi);
      for (const match of headerMatches) {
        headers[match[1].trim()] = match[2].trim();
      }

      const response = await fetch(url, {
        method,
        headers,
        redirect: options?.followRedirects ?? scraperConfig?.followRedirects !== false ? 'follow' : 'manual',
        signal: options?.signal,
      });

      log('INFO', `Status: ${response.status}`);

      // Get content type to determine parsing
      const contentType = response.headers.get('content-type') || '';
      let responseBody: unknown;

      if (contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      if (response.ok) {
        log('SUCCESS', `Scraped ${typeof responseBody === 'string' ? responseBody.length : 'N/A'} characters`);
        return this.createSuccessResult(response, responseBody, logs, startTime);
      } else {
        log('WARNING', `HTTP ${response.status}`);
        return {
          ...this.createSuccessResult(response, responseBody, logs, startTime),
          success: response.status < 400,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log('ERROR', message);
      return this.createErrorResult(message, logs, startTime);
    }
  }

  generateSampleCurl(_config: AuthenticationConfig): string {
    return `curl -X GET "https://example.com" \\
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" \\
  -H "Accept: text/html,application/xhtml+xml" \\
  -H "Accept-Language: en-US,en;q=0.5"`;
  }

  async testConnection(config: AuthenticationConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    // Test with a simple HEAD request to a known good URL
    const startTime = Date.now();
    
    try {
      const scraperConfig = config.keylessScraper;
      const response = await fetch('https://httpbin.org/get', {
        method: 'HEAD',
        headers: {
          'User-Agent': scraperConfig?.userAgent || 'Protocol-OS-Test',
        },
        signal: AbortSignal.timeout(5000),
      });

      return {
        success: response.ok,
        message: response.ok ? 'HTTP requests working' : `Status: ${response.status}`,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}

export default KeylessScraperHandler;
