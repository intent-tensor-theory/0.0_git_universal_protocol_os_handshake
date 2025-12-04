# TABLE OF CONTENTS - REQUIRED UPDATES
## Based on Grandfather Code Analysis

---

## ❌ ISSUES TO FIX

### 1. AUTH TYPE DROPDOWN - MISSING OPTGROUPS
**Current:** Flat list of options  
**Required:** Categorized with `<optgroup>` labels

```html
<select id="authType">
  <option value="curl-default">🌐 Universal cURL Mode (Default)</option>
  <optgroup label="OAuth 2.0 Flows (Callback Required)">
    <option value="oauth-pkce">OAuth PKCE - Auth Code + Challenge</option>
    <option value="oauth-auth-code">OAuth 2.0 - Authorization Code</option>
    <option value="oauth-implicit">OAuth 2.0 - Implicit Grant</option>
  </optgroup>
  <optgroup label="Direct Token Auth (No Callback)">
    <option value="client-credentials">OAuth Client Credentials</option>
    <option value="rest-api-key">REST API - Bearer/API Key</option>
    <option value="basic-auth">HTTP Basic Authentication</option>
  </optgroup>
  <optgroup label="Structured Protocols">
    <option value="graphql">GraphQL - Query + Variables</option>
    <option value="soap-xml">SOAP/XML - WS-Security</option>
    <option value="grpc-web">gRPC-Web - Protocol Buffers</option>
  </optgroup>
  <optgroup label="Real-time Protocols">
    <option value="websocket">WebSocket - Bidirectional</option>
    <option value="sse">Server-Sent Events</option>
  </optgroup>
  <optgroup label="Custom Protocols">
    <option value="github-direct">GitHub Direct Connect</option>
    <option value="keyless-scraper">Keyless Access (Web Scraper)</option>
  </optgroup>
</select>
```

---

### 2. HANDSHAKE INTERFACE - INCOMPLETE
**Current:** Only has `endpointName`, `authentication`, `status`  
**Required:** Full interface from grandfather:

```typescript
interface Handshake {
  id: string;
  serial: string;
  endpointName: string;
  authentication: Authentication;
  curlRequests: CurlRequest[];      // MISSING
  schemaModels: SchemaModel[];      // MISSING
  promotedActions: PromotedAction[]; // MISSING
  status: HandshakeStatus;
}

interface CurlRequest {
  id: string;
  serial: string;
  name: string;
  command: string;
  supportedFileTypes: string[];
  selectedTestFileType: string | null;
  testData: TestData;
}

interface SchemaModel {
  id: string;
  serial: string;
  name: string;
  schemaJson: string;
  supportedFileTypes: string[];
  selectedTestFileType: string | null;
  testData: TestData;
  promotedFromCurlId?: string;
}

interface PromotedAction {
  id: string;
  serial: string;
  name: string;
  curlRequestId: string;
  schemaModelId: string;
  curlRequest: Omit<CurlRequest, 'id' | 'serial' | 'selectedTestFileType' | 'testData'>;
  schemaModel: Omit<SchemaModel, 'id' | 'serial' | 'selectedTestFileType' | 'testData'>;
}

interface TestData {
  [fileType: string]: {
    stringInput: string;
    fileInput: { name: string; data: string; } | null;
    output: string;
  }
}
```

---

### 3. SERIAL NUMBERS - NOT DISPLAYING
**Current:** Serial generated but not shown  
**Required:** Serial number visible in accordion summary right-aligned

```
┌──────────────────────────────────────────────────────────┐
│ 🛡️ Platform Name                    PLAT-AB12    [✕]    │
└──────────────────────────────────────────────────────────┘
```

---

### 4. HEADER CLICK - NO ARCHIVED DROPDOWN
**Current:** Header is static  
**Required:** Click header title → toggles archived platforms sub-container

```javascript
titleContainer.onclick = () => {
  headerSubcontainer.classList.toggle('is-visible');
};
```

**CSS Required:**
```css
.header-subcontainer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out, padding 0.3s ease-out;
}

.header-subcontainer.is-visible {
  max-height: 500px;
  padding: 1.5rem;
}

.archive-panel-style {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  margin: 1rem 0;
  border-radius: 0.5rem;
}
```

---

### 5. HANDSHAKE FORM SECTIONS - INCOMPLETE
**Current:** Only Step 1 (endpoint) + Step 2 (auth type + credentials)  
**Required:** Full 4-step structure

#### Section 1 - Protocol Channel
- 1.a Integration Name (optional)
- 1.b Protocol Channel (auth type dropdown with optgroups)

#### Section 2 - Channel Configuration  
- Dynamic fields based on auth type (2.a, 2.b, 2.c...)

#### Section 3 - Request Input
- 3.a Input Model (cURL, Schema, JSON, XML)
- 3.b Dynamic Input
  - 3.b.i Text Input
  - 3.b.ii File Input (OR separator between)

#### Section 4 - Execution & Output
- 4.a Execute button
- 4.b Output metrics (status, duration, method, size)
- 4.c Response output
- 4.d Logs

---

### 6. STATE MANAGEMENT - INCOMPLETE
**Current:** Only `platforms[]`  
**Required:**

```typescript
interface AppState {
  platforms: Platform[];
  archivedPlatforms: Platform[];           // MISSING
  openAccordionIds: Set<string>;           // MISSING
  editingCurlRequestId: string | null;     // MISSING
  _tempCurlRequest: CurlRequest | null;    // MISSING
  editingModelId: string | null;           // MISSING
  _tempSchemaModel: SchemaModel | null;    // MISSING
  isEditingNewItem: boolean;               // MISSING
  editingPromotedAction: {...} | null;     // MISSING
  liveLogs: {...};                         // MISSING
}
```

---

### 7. AUTH TYPE MAP - MISSING
**Required:**
```typescript
const authTypeMap: { [key: string]: string } = {
  'API Key / Basic Auth': 'apiKey',
  'OAuth 2.0 (Authorization Code)': 'oauth2_auth_code',
  'OAuth 2.0 (PKCE)': 'oauth2_pkce',
  'OAuth 2.0 (Client Credentials)': 'oauth2_client_credentials',
  'GitHub Direct Execution': 'directExecution',
  'Web Scraper (No Auth - Keyless exchange)': 'webScrape'
};
```

---

### 8. LOCALSTORAGE PERSISTENCE - MISSING
**Required:**
- `saveState()` - serialize and save to localStorage('apiManagerConfig')
- `loadState()` - load and parse from localStorage
- `reloadState()` - reload without saving
- Sensitive field sanitization: `clientSecret`, `value`, `password`, `apiKey`, `githubPat`

---

### 9. UNIQUE SERIAL GENERATOR - EXISTS BUT NOT USING UNIQUENESS CHECK
**Current:** Simple random  
**Required:**
```typescript
function generateUniqueSerial(prefix: string, existingSerials: string[]): string {
  let serial = '';
  do {
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    serial = `${prefix}-${randomPart}`;
  } while (existingSerials.includes(serial));
  return serial;
}
```

---

### 10. DEAD CODE/FILES TO DELETE
- Check for any unused imports
- Check for any discontinued components
- Remove any files that are not referenced

---

## ✅ IMPLEMENTATION ORDER

1. Fix TypeScript interfaces (Handshake, CurlRequest, SchemaModel, etc.)
2. Fix AUTH_TYPES constant with optgroups
3. Fix serial number display in accordions
4. Add header click → archived platforms dropdown
5. Implement full handshake form (4 sections)
6. Add state persistence (localStorage)
7. Clean up dead code
8. Maintain exhaustive logging throughout

---

## FILES TO MODIFY

1. `1.0.b_fileApp.tsx` - Main component (heavy rewrite)
2. `app.css` - Add header-subcontainer styles
3. `1.8.g_fileSystemLogger.ts` - Already good, keep

## FILES TO CHECK FOR DELETION
- Any unused components in 1.0_folderSourceCode
- Any test files not needed in production
