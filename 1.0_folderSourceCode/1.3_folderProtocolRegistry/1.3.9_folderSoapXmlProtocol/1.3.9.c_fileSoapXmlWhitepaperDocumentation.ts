// ============================================
// PROTOCOL OS - SOAP/XML WHITEPAPER DOCUMENTATION
// ============================================
// Address: 1.3.9.c
// Purpose: Technical specification for SOAP/XML Protocol
// ============================================

/**
 * Whitepaper: SOAP/XML Protocol
 * 
 * Enterprise Web Services Communication
 * 
 * Version: 1.0.0
 * Author: Intent Tensor Theory Institute
 * Date: 2024
 */

export const SOAP_XML_WHITEPAPER = {
  metadata: {
    title: 'SOAP/XML Protocol',
    subtitle: 'Enterprise Web Services Communication',
    version: '1.0.0',
    author: 'Intent Tensor Theory Institute',
    lastUpdated: '2024-12-03',
    specifications: [
      'SOAP 1.1 (W3C Note)',
      'SOAP 1.2 (W3C Recommendation)',
      'WS-Security 1.1 (OASIS Standard)',
      'WSDL 1.1 / 2.0',
    ],
  },

  // ============================================
  // SECTION 1: EXECUTIVE SUMMARY
  // ============================================
  
  executiveSummary: {
    title: '1. Executive Summary',
    content: `
SOAP (Simple Object Access Protocol) is an XML-based messaging protocol for
exchanging structured information in web services. Originally developed by
Microsoft, SOAP became a W3C standard and remains the backbone of enterprise
integration.

Key Characteristics:
┌─────────────────────────────────────────────────────────────────────────────┐
│  • XML-based message format                                                 │
│  • Platform and language independent                                        │
│  • Strongly typed with WSDL schemas                                         │
│  • Built-in error handling (SOAP Faults)                                   │
│  • Extensible via WS-* specifications                                      │
│  • Transport independent (HTTP, SMTP, JMS)                                 │
│  • Enterprise-grade security (WS-Security)                                 │
└─────────────────────────────────────────────────────────────────────────────┘

SOAP vs REST Comparison:
┌────────────────────┬──────────────────────────┬──────────────────────────┐
│ Feature            │ SOAP                      │ REST                     │
├────────────────────┼──────────────────────────┼──────────────────────────┤
│ Format             │ XML only                  │ JSON, XML, etc.          │
│ Contract           │ WSDL (strict)             │ OpenAPI (optional)       │
│ State              │ Can be stateful           │ Stateless                │
│ Security           │ WS-Security               │ HTTPS, OAuth             │
│ Transactions       │ WS-AtomicTransaction      │ Not built-in             │
│ Error Handling     │ SOAP Faults               │ HTTP status codes        │
│ Caching            │ Not native                │ HTTP caching             │
│ Performance        │ Higher overhead           │ Lower overhead           │
│ Learning Curve     │ Steeper                   │ Easier                   │
│ Enterprise Support │ Excellent                 │ Good                     │
└────────────────────┴──────────────────────────┴──────────────────────────┘

When to Use SOAP:
✅ Enterprise system integration (ERP, CRM)
✅ Financial services (banking, trading)
✅ Healthcare systems (HL7 SOAP bindings)
✅ Government and regulated industries
✅ B2B communication with contracts
✅ When WS-* features are required
✅ Legacy system integration

When REST is Better:
• Public APIs for web/mobile
• Simple CRUD operations
• Bandwidth-constrained environments
• Rapid development needs
• Browser-based applications
    `.trim(),
  },

  // ============================================
  // SECTION 2: SOAP MESSAGE STRUCTURE
  // ============================================
  
  messageStructure: {
    title: '2. SOAP Message Structure',
    sections: [
      {
        subtitle: '2.1 Envelope Structure',
        content: `
Every SOAP message is wrapped in an Envelope with Header and Body.

SOAP 1.1 Structure:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <?xml version="1.0" encoding="UTF-8"?>                                     │
│  <soap:Envelope                                                             │
│      xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">               │
│                                                                              │
│    <soap:Header>                                                            │
│      <!-- Optional headers (security, routing, etc.) -->                   │
│    </soap:Header>                                                           │
│                                                                              │
│    <soap:Body>                                                              │
│      <!-- Request or Response content -->                                  │
│    </soap:Body>                                                             │
│                                                                              │
│  </soap:Envelope>                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

SOAP 1.2 Structure:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <?xml version="1.0" encoding="UTF-8"?>                                     │
│  <soap:Envelope                                                             │
│      xmlns:soap="http://www.w3.org/2003/05/soap-envelope">                 │
│                                                                              │
│    <soap:Header>                                                            │
│      <!-- Optional headers -->                                             │
│    </soap:Header>                                                           │
│                                                                              │
│    <soap:Body>                                                              │
│      <!-- Request or Response content -->                                  │
│    </soap:Body>                                                             │
│                                                                              │
│  </soap:Envelope>                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

Key Differences:
┌────────────────────┬──────────────────────────┬──────────────────────────┐
│ Aspect             │ SOAP 1.1                  │ SOAP 1.2                 │
├────────────────────┼──────────────────────────┼──────────────────────────┤
│ Namespace          │ ...soap/envelope/        │ .../05/soap-envelope     │
│ Content-Type       │ text/xml                  │ application/soap+xml     │
│ SOAPAction         │ HTTP header               │ Content-Type param       │
│ Fault Codes        │ Client, Server            │ Sender, Receiver         │
│ mustUnderstand     │ "1" or "0"               │ "true" or "false"        │
└────────────────────┴──────────────────────────┴──────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '2.2 SOAP Header',
        content: `
The Header contains metadata, security, and routing information.

Header Elements:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <soap:Header>                                                              │
│                                                                              │
│    <!-- WS-Security -->                                                     │
│    <wsse:Security                                                           │
│        xmlns:wsse="http://...wss-wssecurity-secext-1.0.xsd"               │
│        soap:mustUnderstand="1">                                             │
│      <wsse:UsernameToken>                                                   │
│        <wsse:Username>user</wsse:Username>                                 │
│        <wsse:Password>pass</wsse:Password>                                 │
│      </wsse:UsernameToken>                                                  │
│    </wsse:Security>                                                         │
│                                                                              │
│    <!-- WS-Addressing -->                                                   │
│    <wsa:To xmlns:wsa="http://...addressing">                               │
│      http://example.com/service                                             │
│    </wsa:To>                                                                │
│    <wsa:Action>http://example.com/Action</wsa:Action>                      │
│    <wsa:MessageID>uuid:12345</wsa:MessageID>                               │
│                                                                              │
│    <!-- Custom Headers -->                                                  │
│    <auth:SessionId xmlns:auth="http://example.com/auth">                   │
│      ABC123                                                                 │
│    </auth:SessionId>                                                        │
│                                                                              │
│  </soap:Header>                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

mustUnderstand Attribute:
• If mustUnderstand="1" (SOAP 1.1) or "true" (SOAP 1.2)
• Recipient MUST process the header or return a Fault
• If recipient doesn't understand it, request fails

actor/role Attribute:
• Specifies which node should process the header
• SOAP 1.1: soap:actor
• SOAP 1.2: soap:role
        `.trim(),
      },
      {
        subtitle: '2.3 SOAP Body',
        content: `
The Body contains the actual request or response data.

Request Example:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <soap:Body>                                                                │
│    <GetStockPrice xmlns="http://example.com/stock">                        │
│      <StockSymbol>MSFT</StockSymbol>                                       │
│    </GetStockPrice>                                                         │
│  </soap:Body>                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

Response Example:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <soap:Body>                                                                │
│    <GetStockPriceResponse xmlns="http://example.com/stock">                │
│      <Price>94.35</Price>                                                  │
│      <Currency>USD</Currency>                                               │
│      <Timestamp>2024-01-15T10:30:00Z</Timestamp>                          │
│    </GetStockPriceResponse>                                                 │
│  </soap:Body>                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

Complex Types:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <soap:Body>                                                                │
│    <CreateOrder xmlns="http://example.com/orders">                         │
│      <Order>                                                                │
│        <Customer>                                                           │
│          <Name>John Doe</Name>                                             │
│          <Email>john@example.com</Email>                                   │
│        </Customer>                                                          │
│        <Items>                                                              │
│          <Item>                                                             │
│            <ProductId>SKU-001</ProductId>                                  │
│            <Quantity>2</Quantity>                                          │
│          </Item>                                                            │
│          <Item>                                                             │
│            <ProductId>SKU-002</ProductId>                                  │
│            <Quantity>1</Quantity>                                          │
│          </Item>                                                            │
│        </Items>                                                             │
│      </Order>                                                               │
│    </CreateOrder>                                                           │
│  </soap:Body>                                                               │
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
        subtitle: '3.1 WS-Security UsernameToken',
        content: `
The most common SOAP authentication method.

Plain Text Password:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <wsse:Security                                                             │
│      xmlns:wsse="http://docs.oasis-open.org/.../wss-wssecurity-secext-1.0.xsd"│
│      soap:mustUnderstand="1">                                               │
│                                                                              │
│    <wsse:UsernameToken>                                                     │
│      <wsse:Username>myuser</wsse:Username>                                 │
│      <wsse:Password                                                         │
│          Type="http://...#PasswordText">                                   │
│        mypassword                                                           │
│      </wsse:Password>                                                       │
│    </wsse:UsernameToken>                                                    │
│                                                                              │
│  </wsse:Security>                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

Password Digest (More Secure):
┌─────────────────────────────────────────────────────────────────────────────┐
│  <wsse:Security soap:mustUnderstand="1">                                    │
│    <wsu:Timestamp                                                           │
│        xmlns:wsu="http://...wss-wssecurity-utility-1.0.xsd">               │
│      <wsu:Created>2024-01-15T10:30:00Z</wsu:Created>                       │
│      <wsu:Expires>2024-01-15T10:35:00Z</wsu:Expires>                       │
│    </wsu:Timestamp>                                                         │
│                                                                              │
│    <wsse:UsernameToken>                                                     │
│      <wsse:Username>myuser</wsse:Username>                                 │
│      <wsse:Password                                                         │
│          Type="http://...#PasswordDigest">                                 │
│        Base64(SHA1(nonce + created + password))                            │
│      </wsse:Password>                                                       │
│      <wsse:Nonce                                                            │
│          EncodingType="http://...#Base64Binary">                           │
│        randombase64nonce==                                                  │
│      </wsse:Nonce>                                                          │
│      <wsu:Created>2024-01-15T10:30:00Z</wsu:Created>                       │
│    </wsse:UsernameToken>                                                    │
│  </wsse:Security>                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

Password Digest Calculation:
  Digest = Base64(SHA1(Nonce + Created + Password))
  
  Where:
  • Nonce: Random value (Base64 decoded for calculation)
  • Created: Timestamp in ISO 8601 format
  • Password: Plain text password
        `.trim(),
      },
      {
        subtitle: '3.2 HTTP Basic Authentication',
        content: `
Simple HTTP-level authentication.

HTTP Header:
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /soap/service HTTP/1.1                                                │
│  Host: api.example.com                                                      │
│  Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=                             │
│  Content-Type: text/xml; charset=utf-8                                      │
│  SOAPAction: "http://example.com/Action"                                   │
│                                                                              │
│  <?xml version="1.0" encoding="UTF-8"?>                                     │
│  <soap:Envelope xmlns:soap="...">                                          │
│    <soap:Body>                                                              │
│      <!-- No security header needed -->                                    │
│    </soap:Body>                                                             │
│  </soap:Envelope>                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

Base64 Encoding:
  Base64("username:password") = "dXNlcm5hbWU6cGFzc3dvcmQ="

Pros:
• Simple to implement
• Works with any SOAP service
• No special headers in SOAP envelope

Cons:
• Credentials sent with every request
• Base64 is encoding, not encryption
• Requires HTTPS for security
        `.trim(),
      },
      {
        subtitle: '3.3 Bearer Token',
        content: `
OAuth-style bearer token authentication.

HTTP Header:
┌─────────────────────────────────────────────────────────────────────────────┐
│  POST /soap/service HTTP/1.1                                                │
│  Host: api.example.com                                                      │
│  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...             │
│  Content-Type: text/xml; charset=utf-8                                      │
│  SOAPAction: "http://example.com/Action"                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Use Cases:
• OAuth 2.0 integration with SOAP services
• JWT tokens from identity providers
• API gateway tokens
• Session tokens
        `.trim(),
      },
      {
        subtitle: '3.4 Custom SOAP Headers',
        content: `
Service-specific authentication headers.

Salesforce Example:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <soap:Header>                                                              │
│    <sf:SessionHeader xmlns:sf="urn:partner.soap.sforce.com">              │
│      <sf:sessionId>your-session-id</sf:sessionId>                          │
│    </sf:SessionHeader>                                                      │
│  </soap:Header>                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

PayPal Example:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <soap:Header>                                                              │
│    <ebl:RequesterCredentials xmlns:ebl="urn:ebay:apis:eBLBaseComponents">  │
│      <ebl:Credentials>                                                      │
│        <ebl:Username>api_user</ebl:Username>                               │
│        <ebl:Password>api_password</ebl:Password>                           │
│        <ebl:Signature>api_signature</ebl:Signature>                        │
│      </ebl:Credentials>                                                     │
│    </ebl:RequesterCredentials>                                              │
│  </soap:Header>                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 4: SOAP FAULTS
  // ============================================
  
  soapFaults: {
    title: '4. SOAP Faults (Error Handling)',
    sections: [
      {
        subtitle: '4.1 SOAP 1.1 Fault Structure',
        content: `
SOAP 1.1 Fault:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <soap:Fault>                                                               │
│    <faultcode>soap:Client</faultcode>                                      │
│    <faultstring>Invalid input parameter</faultstring>                      │
│    <faultactor>http://example.com/service</faultactor>                    │
│    <detail>                                                                 │
│      <error:ValidationError xmlns:error="http://example.com/errors">       │
│        <error:Field>quantity</error:Field>                                 │
│        <error:Message>Must be positive integer</error:Message>             │
│      </error:ValidationError>                                               │
│    </detail>                                                                │
│  </soap:Fault>                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

SOAP 1.1 Fault Codes:
┌────────────────────┬────────────────────────────────────────────────────────┐
│ Fault Code         │ Meaning                                                 │
├────────────────────┼────────────────────────────────────────────────────────┤
│ VersionMismatch    │ Invalid SOAP version                                   │
│ MustUnderstand     │ Header not understood but marked mustUnderstand        │
│ Client             │ Client sent invalid request (bad input)                │
│ Server             │ Server processing error                                 │
└────────────────────┴────────────────────────────────────────────────────────┘
        `.trim(),
      },
      {
        subtitle: '4.2 SOAP 1.2 Fault Structure',
        content: `
SOAP 1.2 Fault (More structured):
┌─────────────────────────────────────────────────────────────────────────────┐
│  <soap:Fault>                                                               │
│    <soap:Code>                                                              │
│      <soap:Value>soap:Sender</soap:Value>                                  │
│      <soap:Subcode>                                                         │
│        <soap:Value>err:InvalidInput</soap:Value>                           │
│      </soap:Subcode>                                                        │
│    </soap:Code>                                                             │
│    <soap:Reason>                                                            │
│      <soap:Text xml:lang="en">Invalid input parameter</soap:Text>          │
│    </soap:Reason>                                                           │
│    <soap:Node>http://example.com/service</soap:Node>                       │
│    <soap:Role>http://www.w3.org/2003/05/soap-envelope/role/next</soap:Role>│
│    <soap:Detail>                                                            │
│      <!-- Application-specific error details -->                           │
│    </soap:Detail>                                                           │
│  </soap:Fault>                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

SOAP 1.2 Fault Codes:
┌────────────────────────┬────────────────────────────────────────────────────┐
│ Fault Code             │ Meaning                                             │
├────────────────────────┼────────────────────────────────────────────────────┤
│ VersionMismatch        │ Invalid SOAP version                               │
│ MustUnderstand         │ Header not understood but mandatory                │
│ DataEncodingUnknown    │ Unknown data encoding                              │
│ Sender                 │ Client error (replaces Client)                     │
│ Receiver               │ Server error (replaces Server)                     │
└────────────────────────┴────────────────────────────────────────────────────┘
        `.trim(),
      },
    ],
  },

  // ============================================
  // SECTION 5: WSDL
  // ============================================
  
  wsdl: {
    title: '5. WSDL (Web Services Description Language)',
    content: `
WSDL describes SOAP services in a machine-readable format.

WSDL Structure:
┌─────────────────────────────────────────────────────────────────────────────┐
│  <definitions xmlns="http://schemas.xmlsoap.org/wsdl/"                     │
│               xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"           │
│               xmlns:tns="http://example.com/service"                       │
│               name="StockService"                                           │
│               targetNamespace="http://example.com/service">                │
│                                                                              │
│    <!-- Types: XML Schema definitions -->                                   │
│    <types>                                                                  │
│      <xsd:schema>                                                           │
│        <xsd:element name="GetStockPrice">                                  │
│          <xsd:complexType>                                                  │
│            <xsd:sequence>                                                   │
│              <xsd:element name="symbol" type="xsd:string"/>                │
│            </xsd:sequence>                                                  │
│          </xsd:complexType>                                                 │
│        </xsd:element>                                                       │
│      </xsd:schema>                                                          │
│    </types>                                                                 │
│                                                                              │
│    <!-- Message: Data exchanged -->                                         │
│    <message name="GetStockPriceInput">                                     │
│      <part name="parameters" element="tns:GetStockPrice"/>                 │
│    </message>                                                               │
│    <message name="GetStockPriceOutput">                                    │
│      <part name="parameters" element="tns:GetStockPriceResponse"/>         │
│    </message>                                                               │
│                                                                              │
│    <!-- PortType: Operations (like an interface) -->                        │
│    <portType name="StockPortType">                                         │
│      <operation name="GetStockPrice">                                      │
│        <input message="tns:GetStockPriceInput"/>                           │
│        <output message="tns:GetStockPriceOutput"/>                         │
│      </operation>                                                           │
│    </portType>                                                              │
│                                                                              │
│    <!-- Binding: Protocol and format -->                                    │
│    <binding name="StockBinding" type="tns:StockPortType">                  │
│      <soap:binding style="document"                                        │
│                    transport="http://schemas.xmlsoap.org/soap/http"/>      │
│      <operation name="GetStockPrice">                                      │
│        <soap:operation soapAction="http://example.com/GetStockPrice"/>     │
│        <input><soap:body use="literal"/></input>                           │
│        <output><soap:body use="literal"/></output>                         │
│      </operation>                                                           │
│    </binding>                                                               │
│                                                                              │
│    <!-- Service: Endpoint address -->                                       │
│    <service name="StockService">                                           │
│      <port name="StockPort" binding="tns:StockBinding">                    │
│        <soap:address location="http://example.com/stock"/>                 │
│      </port>                                                                │
│    </service>                                                               │
│                                                                              │
│  </definitions>                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

WSDL Components:
• types: XML Schema defining data structures
• message: Input/output data definitions
• portType: Abstract operations (interface)
• binding: Protocol-specific details (SOAP 1.1/1.2)
• service: Actual endpoint addresses

Accessing WSDL:
Usually available at: http://service-url?wsdl
    `.trim(),
  },

  // ============================================
  // SECTION 6: BEST PRACTICES
  // ============================================
  
  bestPractices: {
    title: '6. Best Practices',
    content: `
SOAP Best Practices Checklist:

Security:
☐ Always use HTTPS in production
☐ Use WS-Security for sensitive operations
☐ Prefer Password Digest over Plain Text
☐ Include timestamp to prevent replay attacks
☐ Validate all incoming SOAP headers
☐ Use XML signature for message integrity

Message Design:
☐ Use document/literal style (most interoperable)
☐ Define clear namespaces
☐ Use meaningful operation names
☐ Keep messages reasonably sized
☐ Use MTOM for binary attachments

Error Handling:
☐ Return proper SOAP Faults
☐ Include detailed error information
☐ Use appropriate fault codes
☐ Log errors server-side
☐ Handle faults gracefully client-side

Performance:
☐ Reuse HTTP connections (keep-alive)
☐ Consider response caching
☐ Use compression for large messages
☐ Monitor response times
☐ Set appropriate timeouts

Development:
☐ Generate clients from WSDL
☐ Test with WSDL-first approach
☐ Use SOAP testing tools (SoapUI)
☐ Document custom headers
☐ Version services appropriately

Common Pitfalls to Avoid:
✗ Embedding credentials in message body
✗ Ignoring mustUnderstand headers
✗ Using RPC encoding (deprecated)
✗ Hardcoding namespace URIs
✗ Missing error handling for faults
    `.trim(),
  },
};

/**
 * Export whitepaper as formatted markdown
 */
export function exportSoapXmlWhitepaperAsMarkdown(): string {
  const wp = SOAP_XML_WHITEPAPER;
  let markdown = '';

  // Title
  markdown += `# ${wp.metadata.title}\n\n`;
  markdown += `**${wp.metadata.subtitle}**\n\n`;
  markdown += `Version: ${wp.metadata.version}\n\n`;
  markdown += `Specifications: ${wp.metadata.specifications.join(', ')}\n\n`;
  markdown += `---\n\n`;

  // Executive Summary
  markdown += `## ${wp.executiveSummary.title}\n\n`;
  markdown += `\`\`\`\n${wp.executiveSummary.content}\n\`\`\`\n\n`;

  // Message Structure
  markdown += `## ${wp.messageStructure.title}\n\n`;
  for (const section of wp.messageStructure.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // Authentication
  markdown += `## ${wp.authentication.title}\n\n`;
  for (const section of wp.authentication.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // SOAP Faults
  markdown += `## ${wp.soapFaults.title}\n\n`;
  for (const section of wp.soapFaults.sections) {
    markdown += `### ${section.subtitle}\n\n`;
    markdown += `\`\`\`\n${section.content}\n\`\`\`\n\n`;
  }

  // WSDL
  markdown += `## ${wp.wsdl.title}\n\n`;
  markdown += `\`\`\`\n${wp.wsdl.content}\n\`\`\`\n\n`;

  // Best Practices
  markdown += `## ${wp.bestPractices.title}\n\n`;
  markdown += `\`\`\`\n${wp.bestPractices.content}\n\`\`\`\n\n`;

  return markdown;
}

/**
 * Common SOAP namespaces
 */
export const SOAP_NAMESPACES = {
  SOAP_1_1_ENVELOPE: 'http://schemas.xmlsoap.org/soap/envelope/',
  SOAP_1_2_ENVELOPE: 'http://www.w3.org/2003/05/soap-envelope',
  WS_SECURITY: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
  WS_SECURITY_UTILITY: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
  WS_ADDRESSING: 'http://www.w3.org/2005/08/addressing',
  XML_SCHEMA: 'http://www.w3.org/2001/XMLSchema',
  XML_SCHEMA_INSTANCE: 'http://www.w3.org/2001/XMLSchema-instance',
  WSDL: 'http://schemas.xmlsoap.org/wsdl/',
  WSDL_SOAP: 'http://schemas.xmlsoap.org/wsdl/soap/',
};

export default SOAP_XML_WHITEPAPER;
