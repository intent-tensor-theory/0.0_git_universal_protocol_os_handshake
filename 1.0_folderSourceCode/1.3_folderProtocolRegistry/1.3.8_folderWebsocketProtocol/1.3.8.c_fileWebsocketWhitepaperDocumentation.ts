// ============================================
// PROTOCOL OS - WEBSOCKET WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.8.c
// Purpose: Technical specification for WebSocket Protocol
// ============================================

/**
 * Whitepaper: WebSocket Protocol
 * 
 * Real-Time Bidirectional Communication
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 */

export const WEBSOCKET_WHITEPAPER = {
  metadata: {
    title: 'WebSocket Protocol',
    subtitle: 'Real-Time Bidirectional Communication',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    specification: 'RFC 6455 - The WebSocket Protocol',
  },

  // ============================================
  // SECTION 1: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
WebSocket provides full-duplex communication channels over a single TCP connection.
Standardized in RFC 6455, WebSocket enables real-time, bidirectional communication
between clients and servers with low overhead.

Key Characteristics:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • Persistent connection (stays open)                                       │
│  • Bidirectional data flow (client ↔ server)                               │
│  • Low latency (no HTTP overhead per message)                              │
│  • Full-duplex (send and receive simultaneously)                           │
│  • Lightweight frames (2-14 bytes header vs HTTP headers)                  │
│  • Single TCP connection (efficient resource usage)                        │
└─────────────────────────────────────────────────────────────────────────────┘

WebSocket vs HTTP Comparison:
┌────────────────────┬──────────────────────────┬──────────────────────────┐
│ Feature            │ HTTP                      │ WebSocket                │
├────────────────────┼──────────────────────────┼──────────────────────────┤
│ Connection         │ New per request          │ Persistent               │
│ Direction          │ Request-Response only    │ Bidirectional            │
│ Server Push        │ Not native               │ Native support           │
│ Overhead           │ High (headers each time) │ Low (2-14 byte frames)   │
│ Latency            │ Higher (TCP handshake)   │ Lower (connection reuse) │
│ Real-time          │ Polling/SSE required     │ Native                   │
│ Browser Support    │ Universal                │ Universal (modern)       │
└────────────────────┴──────────────────────────┴──────────────────────────┘

When to Use WebSocket:
✅ Real-time chat applications
✅ Live data feeds (stocks, sports, IoT)
✅ Collaborative editing
✅ Gaming multiplayer
✅ Live notifications
✅ Streaming data
✅ Live dashboards

When HTTP Might Be Better:
• Simple request-response patterns
• Cacheable responses
• Occasional updates (use polling)
• File uploads/downloads
• REST API operations
    `.trim(),
  },

  // ============================================
  // SECTION 2: CONNECTION LIFECYCLE
  // ============================================
  
  connectionLifecycle: {
    title: '2. Connection Lifecycle',
    sections: [
      {
        subtitle: '2.1 Opening Handshake',
        content: `
WebSocket uses an HTTP Upgrade handshake to establish the connection.

Client Request:
┌─────────────────────────────────────────────────────────────────────────────┐
│  GET /chat HTTP/1.1                                                         │
│  Host: server.example.com                                                   │
│  Upgrade: websocket                                                         │
│  Connection: Upgrade                                                        │
│  Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==                               │
│  Sec-WebSocket-Version: 13                                                  │
│  Sec-WebSocket-Protocol: chat, superchat                                   │
│  Origin: http://example.com                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Server Response:
┌─────────────────────────────────────────────────────────────────────────────┐
│  HTTP/1.1 101 Switching Protocols                                           │
│  Upgrade: websocket                                                         │
│  Connection: Upgrade                                                        │
│  Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=                        │
│  Sec-WebSocket-Protocol: chat                                               │
└─────────────────────────────────────────────────────────────────────────────┘

Handshake Flow:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Client                                  Server                             │
│    │                                        │                               │
│    │  HTTP GET /ws (Upgrade: websocket)    │                               │
│    │ ─────────────────────────────────────▶│                               │
│    │                                        │                               │
│    │  HTTP 101 Switching Protocols          │                               │
│    │ ◀─────────────────────────────────────│                               │
│    │                                        │                               │
│    │  ═══════ WebSocket Connection ════════│                               │
│    │                                        │                               │
│    │  Message (client → server)            │                               │
│    │ ─────────────────────────────────────▶│                               │
│    │                                        │                               │
│    │  Message (server → client)            │                               │
│    │ ◀─────────────────────────────────────│                               │
│    │                                        │                               │
│    ▼                                        ▼                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Key Headers:
• Upgrade: websocket - Request protocol upgrade
• Connection: Upgrade - Signal connection upgrade
• Sec-WebSocket-Key: Random base64 nonce (client)
• Sec-WebSocket-Accept: SHA1(Key + GUID) base64 (server)
• Sec-WebSocket-Protocol: Subprotocol negotiation
• Sec-WebSocket-Version: Protocol version (13)
        `.trim(),
      },
      {
        subtitle: '2.2 Data Frames',
        content: `
WebSocket data is transmitted in frames with minimal overhead.

Frame Structure:
┌─────────────────────────────────────────────────────────────────────────────┐
│  0                   1                   2                   3              │
│  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1          │
│ +-+-+-+-+-------+-+-------------+-------------------------------+          │
│ |F|R|R|R| opcode|M| Payload len |    Extended payload length    |          │
│ |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |          │
│ |N|V|V|V|       |S|             |   (if payload len==126/127)   |          │
│ | |1|2|3|       |K|             |                               |          │
│ +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +          │
│ |     Extended payload length continued, if payload len == 127  |          │
│ + - - - - - - - - - - - - - - - +-------------------------------+          │
│ |                               |Masking-key, if MASK set to 1  |          │
│ +-------------------------------+-------------------------------+          │
│ | Masking-key (continued)       |          Payload Data         |          │
│ +-------------------------------- - - - - - - - - - - - - - - - +          │
│ :                     Payload Data continued ...                :          │
│ + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +          │
│ |                     Payload Data continued ...                |          │
│ +---------------------------------------------------------------+          │
└─────────────────────────────────────────────────────────────────────────────┘

Frame Types (Opcodes):
┌──────────┬────────┬─────────────────────────────────────────────────────────┐
│ Opcode   │ Hex    │ Description                                             │
├──────────┼────────┼─────────────────────────────────────────────────────────┤
│ 0x0      │ 0      │ Continuation frame                                      │
│ 0x1      │ 1      │ Text frame (UTF-8 encoded)                             │
│ 0x2      │ 2      │ Binary frame                                            │
│ 0x3-0x7  │ 3-7    │ Reserved for future data frames                        │
│ 0x8      │ 8      │ Connection close                                        │
│ 0x9      │ 9      │ Ping                                                    │
│ 0xA      │ 10     │ Pong                                                    │
│ 0xB-0xF  │ 11-15  │ Reserved for future control frames                     │
└──────────┴────────┴─────────────────────────────────────────────────────────┘

Payload Length:
• 0-125: Payload length directly in 7 bits
• 126: Following 2 bytes are the length (16-bit)
• 127: Following 8 bytes are the length (64-bit)
        `.trim(),
      },
      {
        subtitle: '2.3 Closing Handshake',
        content: `
Clean closure requires a closing handshake.

Close Frame Format:
┌─────────────────────────────────────────────────────────────────────────────┐
│  +--------+--------+------------------------+                               │
│  | Status Code (2) |   Reason (optional)    |                               │
│  +--------+--------+------------------------+                               │
└─────────────────────────────────────────────────────────────────────────────┘

Common Close Codes:
┌──────────┬────────────────────────────────────────────────────────────────┐
│ Code     │ Meaning                                                         │
├──────────┼────────────────────────────────────────────────────────────────┤
│ 1000     │ Normal closure (clean)                                         │
│ 1001     │ Going away (page unload, server shutdown)                      │
│ 1002     │ Protocol error                                                  │
│ 1003     │ Unsupported data type                                          │
│ 1005     │ No status received (reserved, not sent)                        │
│ 1006     │ Abnormal closure (reserved, connection lost)                   │
│ 1007     │ Invalid payload data (e.g., non-UTF8 in text)                  │
│ 1008     │ Policy violation                                                │
│ 1009     │ Message too big                                                 │
│ 1010     │ Missing extension (client expected server extension)           │
│ 1011     │ Internal server error                                           │
│ 1012     │ Service restart                                                 │
│ 1013     │ Try again later (temporary condition)                          │
│ 1014     │ Bad gateway (proxy couldn't reach server)                      │
│ 1015     │ TLS handshake failed (reserved, not sent)                      │
│ 3000-3999│ Reserved for libraries/frameworks                               │
│ 4000-4999│ Reserved for applications                                       │
└──────────┴────────────────────────────────────────────────────────────────┘

Closing Flow:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Initiator                            Responder                             │
│    │                                      │                                 │
│    │  Close Frame (code, reason)         │                                 │
│    │ ────────────────────────────────────▶│                                 │
│    │                                      │                                 │
│    │  Close Frame (code, reason)         │                                 │
│    │ ◀────────────────────────────────────│                                 │
│    │                                      │                                 │
│    │  ══════ TCP Connection Closed ══════│                                 │
│    │                                      │                                 │
│    ▼                                      ▼                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
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
        subtitle: '3.1 Query Parameter (Most Common)',
        content: `
Include authentication token in the WebSocket URL.

Format:
  wss://api.example.com/ws?token=<auth_token>

Example:
┌─────────────────────────────────────────────────────────────────────────────┐
│  const ws = new WebSocket(                                                  │
│    'wss://api.example.com/ws?token=eyJhbGciOiJIUzI1NiIs...'               │
│  );                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

Pros:
• Simple to implement
• Works in browsers without custom headers
• Server validates during handshake

Cons:
• Token visible in URL (logged by proxies, browser history)
• Cannot easily refresh token
• URL length limits

Common Parameter Names:
• token
• access_token
• auth
• key
• api_key
• Authorization (URL-encoded)
        `.trim(),
      },
      {
        subtitle: '3.2 First Message Authentication',
        content: `
Send authentication as the first message after connection opens.

Flow:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Client                                  Server                             │
│    │                                        │                               │
│    │  WebSocket Connect (no auth)          │                               │
│    │ ─────────────────────────────────────▶│                               │
│    │                                        │                               │
│    │  Connection Established                │                               │
│    │ ◀─────────────────────────────────────│                               │
│    │                                        │                               │
│    │  Auth Message {token: "..."}          │                               │
│    │ ─────────────────────────────────────▶│                               │
│    │                                        │                               │
│    │  Auth Response {status: "ok"}         │                               │
│    │ ◀─────────────────────────────────────│                               │
│    │                                        │                               │
│    │  ══════ Authenticated Session ════════│                               │
│    │                                        │                               │
│    ▼                                        ▼                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Example Messages:

GraphQL Subscriptions (graphql-ws):
  {"type": "connection_init", "payload": {"authorization": "Bearer token"}}

Socket.IO:
  ["auth", {"token": "your-token"}]

Custom:
  {"type": "authenticate", "token": "your-token"}

Pros:
• Token not in URL
• Can use existing HTTP auth tokens
• Allows token refresh

Cons:
• Requires server-side handling
• Brief unauthenticated window
• More complex implementation
        `.trim(),
      },
      {
        subtitle: '3.3 Subprotocol Authentication',
        content: `
Use the Sec-WebSocket-Protocol header to pass authentication.

How it works:
The client sends the token as one of the requested subprotocols.
The server validates and echoes it back if accepted.

Example:
┌─────────────────────────────────────────────────────────────────────────────┐
│  // Client                                                                  │
│  const ws = new WebSocket(                                                  │
│    'wss://api.example.com/ws',                                             │
│    ['your-auth-token', 'v1.json']  // Token + actual protocol              │
│  );                                                                         │
│                                                                              │
│  // Server validates token, responds with just the protocol                 │
│  // Sec-WebSocket-Protocol: v1.json                                        │
└─────────────────────────────────────────────────────────────────────────────┘

Pros:
• Token sent during handshake (not in URL)
• Server-side validation before accepting
• No additional messages needed

Cons:
• Token visible in Sec-WebSocket-Protocol header
• Limited to valid subprotocol characters
• Unusual pattern (potential confusion)

⚠️ Note: This is a workaround. For production, prefer first-message auth.
        `.trim(),
      },
      {
        subtitle: '3.4 Cookie Authentication',
        content: `
Use existing HTTP cookies for authentication.

How it works:
Browser automatically sends cookies with the WebSocket handshake.
Same-origin cookies work automatically.

Flow:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1. User logs in via HTTP                                                   │
│     Server sets: Set-Cookie: session=abc123; HttpOnly; Secure              │
│                                                                              │
│  2. WebSocket connects (same origin)                                        │
│     Browser sends: Cookie: session=abc123                                   │
│                                                                              │
│  3. Server validates session cookie                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Pros:
• Automatic (browsers handle it)
• Works with existing session infrastructure
• No additional code for auth

Cons:
• Same-origin only (CORS limitations)
• Doesn't work for cross-origin WebSockets
• Cookie security concerns (CSRF)
• Third-party cookie restrictions
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 4: KEEP-ALIVE & RECONNECTION
  // ============================================
  
  keepAlive: {
    title: '4. Keep-Alive & Reconnection',
    sections: [
      {
        subtitle: '4.1 Ping/Pong Mechanism',
        content: `
WebSocket defines ping/pong frames for connection health.

Protocol-Level Ping/Pong:
• Ping (0x9): Initiator sends to check if peer is alive
• Pong (0xA): Receiver MUST respond with same payload

Application-Level Ping/Pong:
Many frameworks implement their own ping/pong over data frames.

Example Heartbeat:
┌─────────────────────────────────────────────────────────────────────────────┐
│  // Send ping every 30 seconds                                              │
│  const pingInterval = setInterval(() => {                                   │
│    if (ws.readyState === WebSocket.OPEN) {                                 │
│      ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));     │
│    }                                                                        │
│  }, 30000);                                                                 │
│                                                                              │
│  // Handle pong response                                                    │
│  ws.onmessage = (event) => {                                               │
│    const message = JSON.parse(event.data);                                 │
│    if (message.type === 'pong') {                                          │
│      lastPongTime = Date.now();                                             │
│    }                                                                        │
│  };                                                                         │
│                                                                              │
│  // Check for missed pongs                                                  │
│  const healthCheck = setInterval(() => {                                   │
│    if (Date.now() - lastPongTime > 60000) {                                │
│      console.log('Connection appears dead, reconnecting...');              │
│      ws.close();                                                            │
│      reconnect();                                                           │
│    }                                                                        │
│  }, 10000);                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '4.2 Reconnection Strategy',
        content: `
Automatic reconnection is essential for production WebSocket apps.

Exponential Backoff:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Attempt 1: Wait 1 second                                                   │
│  Attempt 2: Wait 2 seconds                                                  │
│  Attempt 3: Wait 4 seconds                                                  │
│  Attempt 4: Wait 8 seconds                                                  │
│  Attempt 5: Wait 16 seconds                                                 │
│  ...                                                                        │
│  Cap at: 30-60 seconds max                                                  │
│                                                                              │
│  + Add random jitter (0-1000ms) to prevent thundering herd                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Implementation:
┌─────────────────────────────────────────────────────────────────────────────┐
│  function reconnect() {                                                     │
│    if (reconnectAttempts >= maxReconnectAttempts) {                        │
│      console.error('Max reconnect attempts reached');                       │
│      return;                                                                │
│    }                                                                        │
│                                                                              │
│    const delay = Math.min(                                                  │
│      baseDelay * Math.pow(2, reconnectAttempts),                           │
│      maxDelay                                                               │
│    );                                                                       │
│    const jitter = Math.random() * 1000;                                    │
│                                                                              │
│    setTimeout(() => {                                                       │
│      reconnectAttempts++;                                                   │
│      connect();                                                             │
│    }, delay + jitter);                                                      │
│  }                                                                          │
│                                                                              │
│  // Reset on successful connection                                          │
│  ws.onopen = () => {                                                       │
│    reconnectAttempts = 0;                                                   │
│  };                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

Best Practices:
• Reset attempt counter on successful connection
• Use exponential backoff with jitter
• Set maximum delay cap (30-60 seconds)
• Distinguish clean vs dirty disconnects
• Consider user visibility (don't reconnect in background)
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: COMMON PROTOCOLS
  // ============================================
  
  commonProtocols: {
    title: '5. Common Subprotocols & Frameworks',
    sections: [
      {
        subtitle: '5.1 GraphQL Subscriptions',
        content: `
Two main protocols for GraphQL over WebSocket:

graphql-ws (Modern, Recommended):
┌─────────────────────────────────────────────────────────────────────────────┐
│  Subprotocol: graphql-transport-ws                                         │
│                                                                              │
│  Messages:                                                                  │
│  → {"type": "connection_init", "payload": {"auth": "token"}}               │
│  ← {"type": "connection_ack"}                                               │
│  → {"id": "1", "type": "subscribe", "payload": {"query": "..."}}           │
│  ← {"id": "1", "type": "next", "payload": {"data": {...}}}                 │
│  → {"id": "1", "type": "complete"}                                         │
│  → {"type": "ping"}                                                         │
│  ← {"type": "pong"}                                                         │
└─────────────────────────────────────────────────────────────────────────────┘

subscriptions-transport-ws (Legacy Apollo):
┌─────────────────────────────────────────────────────────────────────────────┐
│  Subprotocol: graphql-ws                                                    │
│                                                                              │
│  Messages:                                                                  │
│  → {"type": "connection_init", "payload": {"authToken": "..."}}            │
│  ← {"type": "connection_ack"}                                               │
│  ← {"type": "ka"}  // Keep-alive                                           │
│  → {"id": "1", "type": "start", "payload": {"query": "..."}}               │
│  ← {"id": "1", "type": "data", "payload": {"data": {...}}}                 │
│  → {"id": "1", "type": "stop"}                                             │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '5.2 Socket.IO',
        content: `
Socket.IO is a popular WebSocket wrapper with fallbacks.

Connection URL (Engine.IO 4):
  wss://server.com/socket.io/?EIO=4&transport=websocket

Packet Format:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Engine.IO Packets:                                                         │
│  0 - open                                                                   │
│  1 - close                                                                  │
│  2 - ping                                                                   │
│  3 - pong                                                                   │
│  4 - message                                                                │
│  5 - upgrade                                                                │
│  6 - noop                                                                   │
│                                                                              │
│  Socket.IO Packets (inside Engine.IO message):                             │
│  0 - CONNECT                                                                │
│  1 - DISCONNECT                                                             │
│  2 - EVENT         ["eventName", ...args]                                  │
│  3 - ACK           [ackId, ...args]                                        │
│  4 - CONNECT_ERROR                                                          │
│  5 - BINARY_EVENT                                                           │
│  6 - BINARY_ACK                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Example Messages:
  Open:     0{"sid":"lv_VI...","upgrades":[],"pingInterval":25000}
  Event:    42["chat message","hello"]
  Ack:      43["received"]
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 6: BEST PRACTICES
  // ============================================
  
  bestPractices: {
    title: '6. Best Practices',
    content: `
WebSocket Best Practices Checklist:

Connection Management:
☐ Use wss:// in production (encrypted)
☐ Implement automatic reconnection with exponential backoff
☐ Add jitter to prevent thundering herd
☐ Set maximum reconnect attempts
☐ Handle page visibility (pause reconnects when hidden)

Authentication:
☐ Use first-message auth (avoid token in URL)
☐ Implement token refresh mechanism
☐ Handle authentication failures gracefully
☐ Clear sensitive data on disconnect

Keep-Alive:
☐ Implement ping/pong heartbeat
☐ Set appropriate ping interval (15-30 seconds)
☐ Detect dead connections (missed pongs)
☐ Clean up intervals on disconnect

Message Handling:
☐ Use JSON for structured messages
☐ Include message type/action field
☐ Add unique IDs for request/response matching
☐ Implement message acknowledgments where needed

Error Handling:
☐ Handle all WebSocket events (open, close, error, message)
☐ Log close codes and reasons
☐ Distinguish normal vs abnormal closures
☐ Queue messages during reconnection

Security:
☐ Validate origin on server side
☐ Use secure WebSocket (wss://)
☐ Implement rate limiting
☐ Sanitize incoming messages
☐ Set maximum message size limits

Performance:
☐ Use binary frames for large data
☐ Implement message compression (permessage-deflate)
☐ Batch small messages when possible
☐ Clean up resources on disconnect

Message Structure Example:
┌─────────────────────────────────────────────────────────────────────────────┐
│  {                                                                          │
│    "type": "message",           // Message type                            │
│    "id": "uuid-here",           // Unique ID for tracking                  │
│    "timestamp": 1699999999999,  // Unix timestamp                          │
│    "payload": {                 // Actual data                             │
│      "channel": "chat-room-1",                                             │
│      "content": "Hello world"                                               │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
    `.trim(),
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportWebSocketWhitepaperAsMarkdown(): string {
  const wp = WEBSOCKET_WHITEPAPER;
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

  // Connection Lifecycle
  markdown += `## ${wp.connectionLifecycle.title}\n\n`;
  for (const section of wp.connectionLifecycle.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Authentication
  markdown += `## ${wp.authentication.title}\n\n`;
  for (const section of wp.authentication.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Keep-Alive
  markdown += `## ${wp.keepAlive.title}\n\n`;
  for (const section of wp.keepAlive.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Common Protocols
  markdown += `## ${wp.commonProtocols.title}\n\n`;
  for (const section of wp.commonProtocols.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Best Practices
  markdown += `## ${wp.bestPractices.title}\n\n`;
  markdown += `\`\`\`\n${wp.bestPractices.content}\n\`\`\`\n\n`;

  return markdown;
}

/**
 * Get WebSocket close code meaning
 */
export function getCloseCodeMeaning(code: number): string {
  const meanings: Record<number, string> = {
    1000: 'Normal closure',
    1001: 'Going away (page unload)',
    1002: 'Protocol error',
    1003: 'Unsupported data type',
    1005: 'No status received',
    1006: 'Abnormal closure (no close frame)',
    1007: 'Invalid payload data',
    1008: 'Policy violation',
    1009: 'Message too big',
    1010: 'Missing extension',
    1011: 'Internal server error',
    1012: 'Service restart',
    1013: 'Try again later',
    1014: 'Bad gateway',
    1015: 'TLS handshake failed',
  };
  return meanings[code] || `Unknown (${code})`;
}

export default WEBSOCKET_WHITEPAPER;
