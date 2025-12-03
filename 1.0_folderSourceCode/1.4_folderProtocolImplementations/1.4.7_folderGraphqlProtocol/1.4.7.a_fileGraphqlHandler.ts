// ============================================
// PROTOCOL OS - GRAPHQL HANDLER
// ============================================
// Address: 1.4.7.a
// Purpose: GraphQL API handler with query/mutation support
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
 * GraphQL Handler
 * 
 * Executes GraphQL queries and mutations with flexible authentication.
 */
export class GraphqlHandler extends BaseProtocolHandler {
  readonly protocolType = 'graphql' as const;
  readonly displayName = 'GraphQL';
  readonly description = 'GraphQL API with query/mutation support';
  readonly supportsTokenRefresh = false;
  readonly requiresUserInteraction = false;
  readonly iconId = 'hexagon';

  validateConfiguration(config: AuthenticationConfig): AuthenticationValidationResult {
    const missingFields: string[] = [];
    const gqlConfig = config.graphql;

    if (!gqlConfig) {
      return { isValid: false, missingFields: ['graphql configuration'], invalidFields: [], warnings: [] };
    }

    if (!gqlConfig.endpoint) missingFields.push('endpoint');

    return {
      isValid: missingFields.length === 0,
      missingFields,
      invalidFields: [],
      warnings: gqlConfig.authHeader ? [] : ['No authentication header configured'],
    };
  }

  getRequiredFields(): string[] {
    return ['endpoint'];
  }

  getOptionalFields(): string[] {
    return ['authHeader', 'authValue', 'defaultHeaders'];
  }

  async authenticate(config: AuthenticationConfig): Promise<{
    success: boolean;
    credentials?: AuthenticationCredentials;
    error?: string;
  }> {
    const gqlConfig = config.graphql;
    
    if (!gqlConfig) {
      return { success: false, error: 'GraphQL configuration not provided' };
    }

    return {
      success: true,
      credentials: {
        type: 'graphql',
        endpoint: gqlConfig.endpoint,
        authHeader: gqlConfig.authHeader,
        authValue: gqlConfig.authValue,
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

    log('INFO', `Executing GraphQL: ${curlRequest.title}`);

    try {
      const gqlConfig = config.graphql!;
      
      // Extract query from curl command or use testData
      let query = '';
      let variables: Record<string, unknown> = {};
      
      // Try to extract from -d flag
      const dataMatch = curlRequest.command.match(/-d\s+['"](.+?)['"]/s);
      if (dataMatch) {
        try {
          const parsed = JSON.parse(dataMatch[1]);
          query = parsed.query || '';
          variables = parsed.variables || {};
        } catch {
          query = dataMatch[1];
        }
      } else if (curlRequest.testData) {
        query = curlRequest.testData;
      }

      if (!query) {
        throw new Error('No GraphQL query found');
      }

      log('INFO', `Query: ${query.substring(0, 100)}...`);

      // Build headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...gqlConfig.defaultHeaders,
        ...options?.additionalHeaders,
      };

      if (gqlConfig.authHeader && gqlConfig.authValue) {
        headers[gqlConfig.authHeader] = gqlConfig.authValue;
      }

      const response = await fetch(gqlConfig.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
        signal: options?.signal,
      });

      const responseBody = await response.json();

      // Check for GraphQL errors
      if (responseBody.errors?.length > 0) {
        log('ERROR', `GraphQL errors: ${JSON.stringify(responseBody.errors)}`);
        return {
          ...this.createSuccessResult(response, responseBody, logs, startTime),
          success: false,
          error: responseBody.errors[0]?.message || 'GraphQL error',
        };
      }

      log('SUCCESS', 'GraphQL query executed successfully');
      return this.createSuccessResult(response, responseBody, logs, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      log('ERROR', message);
      return this.createErrorResult(message, logs, startTime);
    }
  }

  generateSampleCurl(config: AuthenticationConfig): string {
    const endpoint = config.graphql?.endpoint || 'https://api.example.com/graphql';
    
    return `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {TOKEN}" \\
  -d '{"query": "{ users { id name email } }"}'`;
  }

  async testConnection(config: AuthenticationConfig): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const gqlConfig = config.graphql;
    if (!gqlConfig?.endpoint) {
      return { success: false, message: 'GraphQL endpoint not configured' };
    }

    const startTime = Date.now();
    try {
      const response = await fetch(gqlConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ __typename }' }),
        signal: AbortSignal.timeout(5000),
      });
      
      return {
        success: response.ok,
        message: response.ok ? 'GraphQL endpoint reachable' : `Status: ${response.status}`,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
    }
  }
}

export default GraphqlHandler;
