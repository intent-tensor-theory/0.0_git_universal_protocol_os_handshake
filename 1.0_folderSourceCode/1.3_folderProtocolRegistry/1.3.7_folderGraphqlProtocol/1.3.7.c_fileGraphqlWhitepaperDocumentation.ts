// ============================================
// PROTOCOL OS - GRAPHQL WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.7.c
// Purpose: Technical specification for GraphQL Protocol
// ============================================

/**
 * Whitepaper: GraphQL Protocol
 * 
 * A Query Language for APIs
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 */

export const GRAPHQL_WHITEPAPER = {
  metadata: {
    title: 'GraphQL Protocol',
    subtitle: 'A Query Language for APIs',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    specification: 'GraphQL Specification (October 2021)',
  },

  // ============================================
  // SECTION 1: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
GraphQL is a query language for APIs and a runtime for executing those queries
with your existing data. Developed by Facebook in 2012 and open-sourced in 2015,
GraphQL provides a complete and understandable description of the data in your
API, gives clients the power to ask for exactly what they need, and nothing more.

Key Characteristics:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Single endpoint for all operations                                       │
│  • Strongly typed schema                                                     │
│  • Client-specified data requirements                                        │
│  • Hierarchical data fetching                                                │
│  • Real-time updates via subscriptions                                       │
│  • Introspection for API discovery                                           │
└─────────────────────────────────────────────────────────────────────────────┘

GraphQL vs REST Comparison:
┌────────────────────┬──────────────────────────┬──────────────────────────┐
│ Feature            │ REST                      │ GraphQL                  │
├────────────────────┼──────────────────────────┼──────────────────────────┤
│ Endpoints          │ Multiple (per resource)  │ Single                   │
│ Data Fetching      │ Over/under-fetching      │ Exact data needed        │
│ Versioning         │ URL-based (v1, v2)       │ Schema evolution         │
│ Documentation      │ External (OpenAPI)       │ Built-in (introspection) │
│ Real-time          │ Polling/WebSockets       │ Native subscriptions     │
│ Caching            │ HTTP caching             │ Client-side (Apollo)     │
│ Type System        │ None (external schemas)  │ Built-in                 │
│ Multiple Resources │ Multiple requests        │ Single query             │
└────────────────────┴──────────────────────────┴──────────────────────────┘

When to Use GraphQL:
✅ Complex data requirements with nested relationships
✅ Mobile apps needing bandwidth efficiency
✅ Rapidly evolving APIs
✅ Multiple client types (web, mobile, IoT)
✅ Real-time features required
✅ Microservices federation

When REST Might Be Better:
• Simple CRUD operations
• File uploads/downloads
• Caching-heavy workloads
• Public APIs with simple contracts
    `.trim(),
  },

  // ============================================
  // SECTION 2: GRAPHQL OPERATIONS
  // ============================================
  
  operations: {
    title: '2. GraphQL Operations',
    sections: [
      {
        subtitle: '2.1 Queries (Read Data)',
        content: `
Queries are used to fetch data from a GraphQL server.

Basic Query:
┌─────────────────────────────────────────────────────────────────────────────┐
│  query {                                                                    │
│    user(id: "123") {                                                       │
│      id                                                                     │
│      name                                                                   │
│      email                                                                  │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Response:
┌─────────────────────────────────────────────────────────────────────────────┐
│  {                                                                          │
│    "data": {                                                                │
│      "user": {                                                             │
│        "id": "123",                                                        │
│        "name": "John Doe",                                                 │
│        "email": "john@example.com"                                         │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Named Query with Variables:
┌─────────────────────────────────────────────────────────────────────────────┐
│  query GetUser($userId: ID!) {                                             │
│    user(id: $userId) {                                                     │
│      id                                                                     │
│      name                                                                   │
│      posts(first: 5) {                                                     │
│        title                                                                │
│        publishedAt                                                          │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
│                                                                              │
│  Variables:                                                                 │
│  {                                                                          │
│    "userId": "123"                                                         │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Nested Queries (Avoiding N+1):
┌─────────────────────────────────────────────────────────────────────────────┐
│  query {                                                                    │
│    users {                                                                  │
│      id                                                                     │
│      name                                                                   │
│      posts {                  # Nested relationship                        │
│        title                                                                │
│        comments {             # Deeply nested                              │
│          body                                                               │
│          author { name }                                                   │
│        }                                                                    │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '2.2 Mutations (Write Data)',
        content: `
Mutations are used to modify data on the server.

Create Mutation:
┌─────────────────────────────────────────────────────────────────────────────┐
│  mutation CreateUser($input: CreateUserInput!) {                           │
│    createUser(input: $input) {                                             │
│      id                                                                     │
│      name                                                                   │
│      email                                                                  │
│      createdAt                                                              │
│    }                                                                        │
│  }                                                                          │
│                                                                              │
│  Variables:                                                                 │
│  {                                                                          │
│    "input": {                                                              │
│      "name": "Jane Doe",                                                   │
│      "email": "jane@example.com",                                          │
│      "password": "secure123"                                               │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Update Mutation:
┌─────────────────────────────────────────────────────────────────────────────┐
│  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {                 │
│    updateUser(id: $id, input: $input) {                                    │
│      id                                                                     │
│      name                                                                   │
│      updatedAt                                                              │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Delete Mutation:
┌─────────────────────────────────────────────────────────────────────────────┐
│  mutation DeleteUser($id: ID!) {                                           │
│    deleteUser(id: $id) {                                                   │
│      success                                                                │
│      message                                                                │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Mutation Response Best Practices:
• Always return the mutated object
• Include operation status (success/error)
• Return affected related objects
• Include timestamps (createdAt, updatedAt)
        `.trim(),
      },
      {
        subtitle: '2.3 Subscriptions (Real-time)',
        content: `
Subscriptions enable real-time updates via WebSocket connections.

Subscription Definition:
┌─────────────────────────────────────────────────────────────────────────────┐
│  subscription OnMessageReceived($channelId: ID!) {                         │
│    messageReceived(channelId: $channelId) {                                │
│      id                                                                     │
│      content                                                                │
│      author {                                                               │
│        name                                                                 │
│        avatar                                                               │
│      }                                                                      │
│      createdAt                                                              │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Subscription Transport (WebSocket):
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Client                        Server                                       │
│    │                              │                                          │
│    │ ─── WebSocket Connect ────▶ │                                          │
│    │                              │                                          │
│    │ ─── Subscribe ────────────▶ │                                          │
│    │     { subscription: ... }    │                                          │
│    │                              │                                          │
│    │ ◀── Data Push ───────────── │ (when event occurs)                      │
│    │     { data: { ... } }       │                                          │
│    │                              │                                          │
│    │ ◀── Data Push ───────────── │ (when event occurs)                      │
│    │                              │                                          │
│    │ ─── Unsubscribe ──────────▶ │                                          │
│    │                              │                                          │
│    ▼                              ▼                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Common Subscription Protocols:
• graphql-ws (recommended): Modern protocol
• subscriptions-transport-ws (legacy): Original Apollo protocol
• Server-Sent Events (SSE): HTTP-based alternative
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 3: AUTHENTICATION
  // ============================================
  
  authentication: {
    title: '3. Authentication Methods',
    sections: [
      {
        subtitle: '3.1 Bearer Token (Most Common)',
        content: `
Bearer tokens are the most common authentication method for GraphQL APIs.

HTTP Request:
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /graphql HTTP/1.1                                                     │
│  Host: api.example.com                                                      │
│  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...                             │
│  Content-Type: application/json                                             │
│                                                                              │
│  {                                                                          │
│    "query": "query { viewer { name } }",                                   │
│    "variables": {}                                                          │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Token Sources:
• OAuth 2.0 access tokens
• JWT tokens from identity providers
• Custom session tokens

JavaScript Example:
  const response = await fetch('https://api.example.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${accessToken}\`,
    },
    body: JSON.stringify({
      query: \`query { viewer { name email } }\`,
    }),
  });
        `.trim(),
      },
      {
        subtitle: '3.2 API Key Header',
        content: `
Some GraphQL APIs use API keys for authentication.

Common Header Names:
• X-API-Key
• x-api-key
• Authorization (with custom prefix)
• Provider-specific headers

HTTP Request:
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /graphql HTTP/1.1                                                     │
│  Host: api.example.com                                                      │
│  X-API-Key: your-api-key-here                                              │
│  Content-Type: application/json                                             │
│                                                                              │
│  {                                                                          │
│    "query": "query { products { name price } }"                            │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Provider-Specific Headers:
┌──────────────────┬────────────────────────────────────────────────────────┐
│ Provider         │ Header                                                  │
├──────────────────┼────────────────────────────────────────────────────────┤
│ Shopify          │ X-Shopify-Storefront-Access-Token: {token}             │
│ Hasura           │ x-hasura-admin-secret: {secret}                        │
│ Apollo Studio    │ x-api-key: {key}                                        │
│ Contentful       │ Authorization: Bearer {token}                          │
└──────────────────┴────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '3.3 No Authentication (Public APIs)',
        content: `
Some GraphQL APIs are publicly accessible without authentication.

Examples of Public GraphQL APIs:
• Countries API (https://countries.trevorblades.com/graphql)
• SpaceX API (public launch data)
• Rick and Morty API (https://rickandmortyapi.com/graphql)
• PokeAPI GraphQL (https://beta.pokeapi.co/graphql/v1beta)

Public API Considerations:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Pros:                                                                      │
│  • Easy to integrate                                                        │
│  • No authentication overhead                                               │
│  • Great for learning/prototypes                                            │
│                                                                              │
│  Cons:                                                                      │
│  • Often rate-limited                                                       │
│  • May have query depth limits                                              │
│  • Limited or read-only access                                              │
│  • No user-specific data                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Even public APIs may use:
• Rate limiting (by IP)
• Query complexity limits
• Introspection disabled in production
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 4: REQUEST/RESPONSE FORMAT
  // ============================================
  
  requestResponse: {
    title: '4. Request/Response Format',
    sections: [
      {
        subtitle: '4.1 Request Format',
        content: `
GraphQL requests are typically sent as POST requests with JSON body.

Standard Request Format:
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /graphql HTTP/1.1                                                     │
│  Content-Type: application/json                                             │
│                                                                              │
│  {                                                                          │
│    "query": "query GetUser($id: ID!) { user(id: $id) { name } }",         │
│    "operationName": "GetUser",                                             │
│    "variables": {                                                           │
│      "id": "123"                                                           │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Request Fields:
┌────────────────┬──────────┬────────────────────────────────────────────────┐
│ Field          │ Required │ Description                                     │
├────────────────┼──────────┼────────────────────────────────────────────────┤
│ query          │ Yes      │ GraphQL query/mutation/subscription string     │
│ operationName  │ No*      │ Name of operation (required if multiple)       │
│ variables      │ No       │ JSON object of variable values                 │
└────────────────┴──────────┴────────────────────────────────────────────────┘
* Required if query contains multiple operations

Alternative: GET Request (for queries only):
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET /graphql?query={user{name}}&variables={"id":"123"}                    │
└─────────────────────────────────────────────────────────────────────────────┘
⚠️ GET requests are limited by URL length and are queries-only.
        `.trim(),
      },
      {
        subtitle: '4.2 Response Format',
        content: `
GraphQL responses follow a consistent JSON structure.

Successful Response:
┌─────────────────────────────────────────────────────────────────────────────┐
│  {                                                                          │
│    "data": {                                                                │
│      "user": {                                                             │
│        "id": "123",                                                        │
│        "name": "John Doe",                                                 │
│        "posts": [                                                          │
│          { "title": "Hello World" },                                       │
│          { "title": "GraphQL Basics" }                                     │
│        ]                                                                    │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Response with Errors:
┌─────────────────────────────────────────────────────────────────────────────┐
│  {                                                                          │
│    "data": {                                                                │
│      "user": null                                                          │
│    },                                                                       │
│    "errors": [                                                              │
│      {                                                                      │
│        "message": "User not found",                                        │
│        "locations": [{ "line": 2, "column": 3 }],                         │
│        "path": ["user"],                                                   │
│        "extensions": {                                                      │
│          "code": "NOT_FOUND",                                              │
│          "timestamp": "2024-12-03T10:30:00Z"                              │
│        }                                                                    │
│      }                                                                      │
│    ]                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Key Points:
• HTTP status is usually 200 (even with errors)
• "data" and "errors" can both be present (partial success)
• "null" in data indicates the field couldn't be resolved
• "extensions" contains provider-specific metadata
        `.trim(),
      },
      {
        subtitle: '4.3 Error Handling',
        content: `
GraphQL has a unique error model compared to REST.

Error Structure:
┌─────────────────────────────────────────────────────────────────────────────┐
│  {                                                                          │
│    "message": "Cannot query field 'foo' on type 'User'",                   │
│    "locations": [                                                           │
│      { "line": 3, "column": 5 }                                            │
│    ],                                                                       │
│    "path": ["user", "foo"],                                                │
│    "extensions": {                                                          │
│      "code": "GRAPHQL_VALIDATION_FAILED",                                  │
│      "exception": {                                                         │
│        "stacktrace": ["..."]                                               │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Common Error Codes (extensions.code):
┌────────────────────────────┬───────────────────────────────────────────────┐
│ Code                       │ Meaning                                        │
├────────────────────────────┼───────────────────────────────────────────────┤
│ GRAPHQL_PARSE_FAILED       │ Query syntax error                            │
│ GRAPHQL_VALIDATION_FAILED  │ Query doesn't match schema                    │
│ UNAUTHENTICATED           │ Not logged in                                  │
│ FORBIDDEN                  │ Not authorized for this operation             │
│ BAD_USER_INPUT            │ Invalid input values                           │
│ NOT_FOUND                  │ Resource doesn't exist                        │
│ INTERNAL_SERVER_ERROR     │ Server-side error                              │
│ PERSISTED_QUERY_NOT_FOUND │ Unknown persisted query ID                    │
└────────────────────────────┴───────────────────────────────────────────────┘

Partial Success:
┌─────────────────────────────────────────────────────────────────────────────┐
│  query {                                                                    │
│    user(id: "123") { name }      # Success                                 │
│    posts(invalid: true) { title } # Error                                  │
│  }                                                                          │
│                                                                              │
│  Response:                                                                  │
│  {                                                                          │
│    "data": {                                                                │
│      "user": { "name": "John" },  # Succeeded                             │
│      "posts": null                # Failed                                 │
│    },                                                                       │
│    "errors": [{ "message": "..." "path": ["posts"] }]                     │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: INTROSPECTION
  // ============================================
  
  introspection: {
    title: '5. Schema Introspection',
    content: `
GraphQL's introspection system allows clients to discover the schema.

Basic Introspection Query:
┌─────────────────────────────────────────────────────────────────────────────┐
│  query {                                                                    │
│    __schema {                                                               │
│      types {                                                                │
│        name                                                                 │
│        kind                                                                 │
│        description                                                          │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Query Available Operations:
┌─────────────────────────────────────────────────────────────────────────────┐
│  query {                                                                    │
│    __schema {                                                               │
│      queryType { name }                                                    │
│      mutationType { name }                                                 │
│      subscriptionType { name }                                             │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Get Type Details:
┌─────────────────────────────────────────────────────────────────────────────┐
│  query {                                                                    │
│    __type(name: "User") {                                                  │
│      name                                                                   │
│      fields {                                                               │
│        name                                                                 │
│        type {                                                               │
│          name                                                               │
│          kind                                                               │
│        }                                                                    │
│        args {                                                               │
│          name                                                               │
│          type { name }                                                     │
│        }                                                                    │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

⚠️ Security Note:
Many production GraphQL APIs disable introspection to prevent
schema exposure. Always check provider documentation.

Introspection Use Cases:
• IDE/editor autocomplete
• Code generation
• API documentation
• Schema visualization
• Testing tools (GraphiQL, Apollo Sandbox)
    `.trim(),
  },

  // ============================================
  // SECTION 6: BEST PRACTICES
  // ============================================
  
  bestPractices: {
    title: '6. Best Practices',
    content: `
GraphQL Best Practices Checklist:

Query Design:
☐ Use named operations for all queries
☐ Use variables instead of string interpolation
☐ Request only fields you need
☐ Use fragments for reusable field sets
☐ Avoid deeply nested queries (> 5-7 levels)

Authentication:
☐ Use HTTPS for all requests
☐ Store tokens securely (not in localStorage for sensitive apps)
☐ Implement token refresh before expiration
☐ Handle 401/403 gracefully

Error Handling:
☐ Check for errors in response even when data is present
☐ Handle partial success scenarios
☐ Parse error extensions for error codes
☐ Implement retry logic for transient errors

Performance:
☐ Use persisted queries for production
☐ Implement client-side caching (Apollo, URQL)
☐ Use DataLoader pattern to prevent N+1 queries
☐ Set appropriate query complexity limits

Security:
☐ Don't expose introspection in production (usually)
☐ Implement query depth limits
☐ Set query complexity budgets
☐ Validate and sanitize all inputs

Subscriptions:
☐ Implement reconnection logic
☐ Handle connection drops gracefully
☐ Unsubscribe when component unmounts
☐ Use heartbeat/keep-alive where supported

Common Query Patterns:
┌─────────────────────────────────────────────────────────────────────────────┐
│  # Fragment for reusable fields                                             │
│  fragment UserFields on User {                                              │
│    id                                                                       │
│    name                                                                     │
│    email                                                                    │
│    avatar                                                                   │
│  }                                                                          │
│                                                                              │
│  # Query using fragment                                                     │
│  query GetUsers {                                                           │
│    users {                                                                  │
│      ...UserFields                                                          │
│      posts { title }                                                       │
│    }                                                                        │
│  }                                                                          │
│                                                                              │
│  # Aliases for multiple queries                                             │
│  query {                                                                    │
│    activeUsers: users(status: ACTIVE) { id name }                          │
│    inactiveUsers: users(status: INACTIVE) { id name }                      │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
    `.trim(),
  },

  // ============================================
  // SECTION 7: PROVIDER EXAMPLES
  // ============================================
  
  providerExamples: {
    title: '7. Provider Examples',
    sections: [
      {
        subtitle: '7.1 GitHub GraphQL API',
        content: `
GitHub provides a comprehensive GraphQL API for repository data.

Endpoint: https://api.github.com/graphql
Auth: Bearer token (Personal Access Token)

Example Query:
┌─────────────────────────────────────────────────────────────────────────────┐
│  query {                                                                    │
│    viewer {                                                                 │
│      login                                                                  │
│      name                                                                   │
│      repositories(first: 5, orderBy: {field: UPDATED_AT, direction: DESC})│
│        nodes {                                                              │
│          name                                                               │
│          description                                                        │
│          stargazerCount                                                    │
│          primaryLanguage { name }                                          │
│        }                                                                    │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Setup:
1. Generate PAT: Settings > Developer Settings > Personal Access Tokens
2. Grant scopes: repo, read:user (minimum)
3. Add to header: Authorization: Bearer ghp_xxxx
        `.trim(),
      },
      {
        subtitle: '7.2 Shopify Storefront API',
        content: `
Shopify's Storefront API provides GraphQL access to store data.

Endpoint: https://{store}.myshopify.com/api/2024-01/graphql.json
Auth: X-Shopify-Storefront-Access-Token header

Example Query:
┌─────────────────────────────────────────────────────────────────────────────┐
│  query {                                                                    │
│    products(first: 10) {                                                   │
│      edges {                                                                │
│        node {                                                               │
│          id                                                                 │
│          title                                                              │
│          handle                                                             │
│          priceRange {                                                       │
│            minVariantPrice {                                                │
│              amount                                                         │
│              currencyCode                                                   │
│            }                                                                │
│          }                                                                  │
│          images(first: 1) {                                                │
│            edges {                                                          │
│              node { url altText }                                          │
│            }                                                                │
│          }                                                                  │
│        }                                                                    │
│      }                                                                      │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

Note: Shopify uses Relay-style pagination (edges/nodes).
        `.trim(),
      },
    ],
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportGraphQLWhitepaperAsMarkdown(): string {
  const wp = GRAPHQL_WHITEPAPER;
  let markdown = '';

  // Title
  markdown += `# ${wp.metadata.title}\n\n`;
  markdown += `**${wp.metadata.subtitle}**\n\n`;
  markdown += `Version: ${wp.metadata.version} | `;
  markdown += `Specification: ${wp.metadata.specification}\n\n`;
  markdown += `---\n\n`;

  // Executive Summary
  markdown += `## ${wp.executiveSummary.title}\n\n`;
  markdown += `\`\`\`\n${wp.executiveSummary.content}\n\`\`\`\n\n`;

  // Operations
  markdown += `## ${wp.operations.title}\n\n`;
  for (const section of wp.operations.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Authentication
  markdown += `## ${wp.authentication.title}\n\n`;
  for (const section of wp.authentication.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Request/Response
  markdown += `## ${wp.requestResponse.title}\n\n`;
  for (const section of wp.requestResponse.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Introspection
  markdown += `## ${wp.introspection.title}\n\n`;
  markdown += `\`\`\`\n${wp.introspection.content}\n\`\`\`\n\n`;

  // Best Practices
  markdown += `## ${wp.bestPractices.title}\n\n`;
  markdown += `\`\`\`\n${wp.bestPractices.content}\n\`\`\`\n\n`;

  // Provider Examples
  markdown += `## ${wp.providerExamples.title}\n\n`;
  for (const section of wp.providerExamples.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  return markdown;
}

/**
 * Get common GraphQL error codes
 */
export function getGraphQLErrorCodes(): Record<string, string> {
  return {
    GRAPHQL_PARSE_FAILED: 'Query syntax error',
    GRAPHQL_VALIDATION_FAILED: 'Query doesn\'t match schema',
    UNAUTHENTICATED: 'Not logged in',
    FORBIDDEN: 'Not authorized for this operation',
    BAD_USER_INPUT: 'Invalid input values',
    NOT_FOUND: 'Resource doesn\'t exist',
    INTERNAL_SERVER_ERROR: 'Server-side error',
    PERSISTED_QUERY_NOT_FOUND: 'Unknown persisted query ID',
  };
}

export default GRAPHQL_WHITEPAPER;
