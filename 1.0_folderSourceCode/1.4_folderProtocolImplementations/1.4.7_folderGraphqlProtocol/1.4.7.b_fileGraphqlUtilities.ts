// ============================================
// PROTOCOL OS - GRAPHQL UTILITIES
// ============================================
// Address: 1.4.7.b
// Purpose: Utility functions for GraphQL operations
// ============================================

/**
 * GraphQL operation types
 */
export type GraphQLOperationType = 'query' | 'mutation' | 'subscription';

/**
 * Build a GraphQL request body
 */
export function buildGraphQLRequest(
  query: string,
  variables?: Record<string, unknown>,
  operationName?: string
): string {
  const body: Record<string, unknown> = { query };
  if (variables) body.variables = variables;
  if (operationName) body.operationName = operationName;
  return JSON.stringify(body);
}

/**
 * Extract operation type from query
 */
export function getOperationType(query: string): GraphQLOperationType | null {
  const trimmed = query.trim();
  if (trimmed.startsWith('query') || trimmed.startsWith('{')) return 'query';
  if (trimmed.startsWith('mutation')) return 'mutation';
  if (trimmed.startsWith('subscription')) return 'subscription';
  return null;
}

/**
 * Format GraphQL query for display
 */
export function formatGraphQLQuery(query: string): string {
  // Simple formatting - add newlines and indentation
  let depth = 0;
  let formatted = '';
  let inString = false;
  
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    
    if (char === '"' && query[i - 1] !== '\\') {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === '{') {
        depth++;
        formatted += ' {\n' + '  '.repeat(depth);
        continue;
      }
      if (char === '}') {
        depth--;
        formatted += '\n' + '  '.repeat(depth) + '}';
        continue;
      }
    }
    
    formatted += char;
  }
  
  return formatted.trim();
}

/**
 * Introspection query
 */
export const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      types { name kind description }
    }
  }
`;

/**
 * Simple typename query for connection testing
 */
export const TYPENAME_QUERY = '{ __typename }';

/**
 * Parse GraphQL error response
 */
export function parseGraphQLErrors(response: { errors?: Array<{ message: string; path?: string[] }> }): string[] {
  return response.errors?.map(e => e.message) || [];
}
