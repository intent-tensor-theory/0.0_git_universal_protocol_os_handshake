// ============================================
// PROTOCOL OS - MAIN APPLICATION COMPONENT
// ============================================
// Address: 1.0.b
// Mirrors: Grandfather Code Structure EXACTLY
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import './app.css';
import { logger, COMMENTARY } from './1.8_folderSharedUtilities/1.8.g_fileSystemLogger';

// ============================================
// TYPES - GRANDFATHER EXACT
// ============================================

interface TestData {
  [fileType: string]: {
    stringInput: string;
    fileInput: { name: string; data: string } | null;
    output: string;
  };
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

interface Authentication {
  type: string;
  [key: string]: unknown;
}

type HandshakeStatus = 'unconfigured' | 'awaiting_auth' | 'healthy' | 'failed';

interface Handshake {
  id: string;
  serial: string;
  endpointName: string;
  authentication: Authentication;
  curlRequests: CurlRequest[];
  schemaModels: SchemaModel[];
  promotedActions: PromotedAction[];
  status: HandshakeStatus;
  isExpanded?: boolean;
}

interface ApiResource {
  id: string;
  serial: string;
  title: string;
  url: string;
  description: string;
  doc_url: string;
  notes: string;
  handshakes: Handshake[];
  isExpanded?: boolean;
}

interface Platform {
  id: string;
  serial: string;
  name: string;
  url: string;
  description: string;
  doc_url: string;
  auth_notes: string;
  contributors: ApiResource[];
  isMaster: boolean;
  isExpanded?: boolean;
}

// ============================================
// SERIAL GENERATOR - EXACT GRANDFATHER
// ============================================

function generateUniqueSerial(prefix: string, existingSerials: string[]): string {
  let serial = '';
  do {
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    serial = `${prefix}-${randomPart}`;
  } while (existingSerials.includes(serial));
  logger.debug('Serial.Generate', `Generated ${serial}`, { prefix });
  return serial;
}

// ============================================
// AUTH TYPE OPTGROUPS - EXACT GRANDFATHER
// ============================================

const AuthTypeSelect: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
  console.log('📝 AuthTypeSelect render:', value);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select an authentication type...</option>
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
  );
};

// ============================================
// CREDENTIALS FORM - EXACT GRANDFATHER FIELDS
// ============================================

const CredentialsForm: React.FC<{ authType: string }> = ({ authType }) => {
  console.log('🔐 CredentialsForm render:', authType);

  if (authType === 'curl-default') {
    return (
      <div className="action-trigger">
        <strong>Mode:</strong> Universal cURL Execution<br />
        <strong>Server-Side:</strong> No CORS restrictions<br />
        <strong>Credentials:</strong> Optional - can be embedded in cURL
      </div>
    );
  }

  if (authType === 'oauth-pkce') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Flow:</strong> Authorization Code + PKCE<br />
          <strong>Security:</strong> SHA256 code challenge<br />
          <strong>Callback Required:</strong> Yes - copy URL below
        </div>
        <div className="input-group"><label><span className="input-label">2.a</span> Auth URL<span className="required">*</span></label><input type="text" placeholder="https://accounts.google.com/o/oauth2/v2/auth" /></div>
        <div className="input-group"><label><span className="input-label">2.b</span> Token URL<span className="required">*</span></label><input type="text" placeholder="https://oauth2.googleapis.com/token" /></div>
        <div className="input-group"><label><span className="input-label">2.c</span> API Endpoint URL<span className="required">*</span></label><input type="text" placeholder="https://api.example.com/v1/endpoint" /></div>
        <div className="input-group"><label><span className="input-label">2.d</span> Client ID<span className="required">*</span></label><input type="text" placeholder="your-client-id" /></div>
        <div className="input-group"><label><span className="input-label">2.e</span> Scope <span className="label-badge">Optional</span></label><input type="text" placeholder="openid profile email" /></div>
        <div className="input-group"><label><span className="input-label">2.f</span> Redirect URI <span className="label-badge">Generated</span></label><input type="text" value={window.location.origin + '/callback'} readOnly /></div>
      </div>
    );
  }

  if (authType === 'oauth-auth-code') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Flow:</strong> Standard Authorization Code<br />
          <strong>Use Case:</strong> Web applications<br />
          <strong>Callback Required:</strong> Yes
        </div>
        <div className="input-group"><label><span className="input-label">2.a</span> Auth URL<span className="required">*</span></label><input type="text" placeholder="https://accounts.google.com/o/oauth2/v2/auth" /></div>
        <div className="input-group"><label><span className="input-label">2.b</span> Token URL<span className="required">*</span></label><input type="text" placeholder="https://oauth2.googleapis.com/token" /></div>
        <div className="input-group"><label><span className="input-label">2.c</span> API Endpoint URL<span className="required">*</span></label><input type="text" placeholder="https://api.example.com/v1/endpoint" /></div>
        <div className="input-group"><label><span className="input-label">2.d</span> Client ID<span className="required">*</span></label><input type="text" placeholder="your-client-id" /></div>
        <div className="input-group"><label><span className="input-label">2.e</span> Client Secret<span className="required">*</span></label><input type="password" placeholder="your-client-secret" /></div>
        <div className="input-group"><label><span className="input-label">2.f</span> Scope <span className="label-badge">Optional</span></label><input type="text" placeholder="openid profile email" /></div>
        <div className="input-group"><label><span className="input-label">2.g</span> Redirect URI <span className="label-badge">Generated</span></label><input type="text" value={window.location.origin + '/callback'} readOnly /></div>
      </div>
    );
  }

  if (authType === 'rest-api-key') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Auth:</strong> API Key or Bearer Token<br />
          <strong>Format:</strong> JSON<br />
          <strong>Callback Required:</strong> No
        </div>
        <div className="input-group"><label><span className="input-label">2.a</span> API Endpoint URL<span className="required">*</span></label><input type="text" placeholder="https://api.example.com/v1/endpoint" /></div>
        <div className="input-group"><label><span className="input-label">2.b</span> API Key / Token<span className="required">*</span></label><input type="password" placeholder="sk-..." /></div>
        <div className="input-group"><label><span className="input-label">2.c</span> Header Name <span className="label-badge">Default: Authorization</span></label><input type="text" placeholder="Authorization or X-API-Key" defaultValue="Authorization" /></div>
      </div>
    );
  }

  if (authType === 'basic-auth') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Auth:</strong> HTTP Basic Authentication<br />
          <strong>Format:</strong> Any<br />
          <strong>Callback Required:</strong> No
        </div>
        <div className="input-group"><label><span className="input-label">2.a</span> API Endpoint URL<span className="required">*</span></label><input type="text" placeholder="https://api.example.com/endpoint" /></div>
        <div className="input-group"><label><span className="input-label">2.b</span> Username<span className="required">*</span></label><input type="text" placeholder="username" /></div>
        <div className="input-group"><label><span className="input-label">2.c</span> Password<span className="required">*</span></label><input type="password" placeholder="password" /></div>
      </div>
    );
  }

  if (authType === 'github-direct') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Protocol:</strong> GitHub Direct Connect<br />
          <strong>Use Case:</strong> Fetch and run from repo<br />
          <strong>Callback Required:</strong> No
        </div>
        <div className="input-group"><label><span className="input-label">2.a</span> GitHub Repository<span className="required">*</span></label><input type="text" placeholder="owner/repo" /></div>
        <div className="input-group"><label><span className="input-label">2.b</span> Branch<span className="required">*</span></label><input type="text" defaultValue="main" /></div>
        <div className="input-group"><label><span className="input-label">2.c</span> GitHub PAT <span className="label-badge">Optional</span></label><input type="password" placeholder="ghp_..." /></div>
        <div className="input-group"><label><span className="input-label">2.d</span> Runtime<span className="required">*</span></label>
          <select><option value="javascript">JavaScript</option><option value="node">Node.js</option><option value="python">Python</option></select>
        </div>
        <div className="input-group"><label><span className="input-label">2.e</span> Install Command <span className="label-badge">Optional</span></label><input type="text" placeholder="npm install" /></div>
        <div className="input-group"><label><span className="input-label">2.f</span> Entrypoint Path<span className="required">*</span></label><input type="text" placeholder="src/index.js" /></div>
        <div className="input-group"><label><span className="input-label">2.g</span> Run Command<span className="required">*</span></label><input type="text" placeholder="node index.js" /></div>
      </div>
    );
  }

  if (authType === 'keyless-scraper') {
    return (
      <div className="action-trigger">
        <strong>Protocol:</strong> Keyless Access Web Scraper<br />
        <strong>Note:</strong> No credentials required. Proceed to Section 3.<br />
        <strong>Callback Required:</strong> No
      </div>
    );
  }

  // Placeholder for other auth types
  return (
    <div className="action-trigger action-trigger--empty">
      Select an authentication type to configure credentials.
    </div>
  );
};

// ============================================
// MAIN APP
// ============================================

const App: React.FC = () => {
  console.log('🔴 APP RENDER');

  // SAVED platforms (persisted)
  const [savedActivePlatforms, setSavedActivePlatforms] = useState<Platform[]>([]);
  const [archivedPlatforms, setArchivedPlatforms] = useState<Platform[]>([]);
  
  // WORKING platform (the form you're currently filling out)
  const [workingPlatform, setWorkingPlatform] = useState<Platform | null>(null);
  
  // Dropdown visibility
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [savedActiveVisible, setSavedActiveVisible] = useState(false);

  // Collect all serials for uniqueness check
  const getAllSerials = useCallback((): string[] => {
    const serials: string[] = [];
    const allPlatforms = [...savedActivePlatforms, ...archivedPlatforms];
    if (workingPlatform) allPlatforms.push(workingPlatform);
    
    allPlatforms.forEach(p => {
      serials.push(p.serial);
      p.contributors.forEach(r => {
        serials.push(r.serial);
        r.handshakes.forEach(h => {
          serials.push(h.serial);
          h.curlRequests.forEach(c => serials.push(c.serial));
          h.schemaModels.forEach(m => serials.push(m.serial));
          h.promotedActions.forEach(pa => serials.push(pa.serial));
        });
      });
    });
    return serials;
  }, [savedActivePlatforms, archivedPlatforms, workingPlatform]);

  useEffect(() => {
    console.log('🟢 APP MOUNT');
    logger.success('App.Init', 'Protocol OS mounted', { commentary: COMMENTARY.SYSTEM_INIT });
  }, []);

  // CREATE NEW WORKING PLATFORM
  const handleStartNewPlatform = useCallback(() => {
    console.log('🖱️ +New Platform');
    const serial = generateUniqueSerial('PLAT', getAllSerials());
    const newPlatform: Platform = {
      id: 'plat-' + Date.now(),
      serial,
      name: '',
      url: '', description: '', doc_url: '', auth_notes: '',
      contributors: [],
      isMaster: false,
      isExpanded: true,
    };
    setWorkingPlatform(newPlatform);
  }, [getAllSerials]);

  // SAVE WORKING PLATFORM TO SAVED ACTIVE
  const handleSaveWorkingPlatform = useCallback(() => {
    if (!workingPlatform) return;
    console.log('💾 Save Platform:', workingPlatform.serial);
    setSavedActivePlatforms(prev => [...prev, workingPlatform]);
    setWorkingPlatform(null); // Clear form for next
  }, [workingPlatform]);

  // ADD TO ARCHIVED
  const handleAddArchivedPlatform = useCallback(() => {
    console.log('🖱️ +ArchivedPlatform');
    const serial = generateUniqueSerial('PLAT', getAllSerials());
    const newPlatform: Platform = {
      id: 'arch-plat-' + Date.now(),
      serial,
      name: 'Archived Master Platform',
      url: '', description: '', doc_url: '', auth_notes: '',
      contributors: [],
      isMaster: true,
      isExpanded: false,
    };
    setArchivedPlatforms(prev => [...prev, newPlatform]);
  }, [getAllSerials]);

  // UPDATE PLATFORM (works on working, saved, or archived)
  const handleUpdatePlatform = useCallback((id: string, updates: Partial<Platform>) => {
    if (workingPlatform?.id === id) {
      setWorkingPlatform(prev => prev ? { ...prev, ...updates } : null);
    } else {
      setSavedActivePlatforms(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      setArchivedPlatforms(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  }, [workingPlatform]);

  // DELETE PLATFORM
  const handleDeletePlatform = useCallback((id: string) => {
    console.log('🗑️ Delete Platform:', id);
    if (workingPlatform?.id === id) {
      setWorkingPlatform(null);
    } else {
      setSavedActivePlatforms(prev => prev.filter(p => p.id !== id));
      setArchivedPlatforms(prev => prev.filter(p => p.id !== id));
    }
  }, [workingPlatform]);

  // INJECT FROM ARCHIVE TO ACTIVE
  const handleInjectFromArchive = useCallback((platformId: string) => {
    const platform = archivedPlatforms.find(p => p.id === platformId);
    if (platform) {
      console.log('💉 Inject from archive:', platform.serial);
      setSavedActivePlatforms(prev => [...prev, { ...platform, id: 'plat-' + Date.now() }]);
    }
  }, [archivedPlatforms]);

  // ARCHIVE FROM ACTIVE
  const handleArchiveFromActive = useCallback((platformId: string) => {
    const platform = savedActivePlatforms.find(p => p.id === platformId);
    if (platform) {
      console.log('📦 Archive from active:', platform.serial);
      setArchivedPlatforms(prev => [...prev, { ...platform, isMaster: true }]);
      setSavedActivePlatforms(prev => prev.filter(p => p.id !== platformId));
    }
  }, [savedActivePlatforms]);

  // RESOURCE HANDLERS
  const handleAddResource = useCallback((platformId: string) => {
    console.log('🖱️ +Resource for:', platformId);
    const serial = generateUniqueSerial('RES', getAllSerials());
    const newResource: ApiResource = {
      id: 'res-' + Date.now(),
      serial,
      title: '',
      url: '', description: '', doc_url: '', notes: '',
      handshakes: [],
      isExpanded: true,
    };
    
    if (workingPlatform?.id === platformId) {
      setWorkingPlatform(prev => prev ? { ...prev, contributors: [...prev.contributors, newResource] } : null);
    } else {
      const update = (p: Platform) => p.id === platformId 
        ? { ...p, contributors: [...p.contributors, newResource] } : p;
      setSavedActivePlatforms(prev => prev.map(update));
      setArchivedPlatforms(prev => prev.map(update));
    }
  }, [getAllSerials, workingPlatform]);

  const handleDeleteResource = useCallback((platformId: string, resourceId: string) => {
    if (workingPlatform?.id === platformId) {
      setWorkingPlatform(prev => prev ? { ...prev, contributors: prev.contributors.filter(r => r.id !== resourceId) } : null);
    } else {
      const update = (p: Platform) => p.id === platformId 
        ? { ...p, contributors: p.contributors.filter(r => r.id !== resourceId) } : p;
      setSavedActivePlatforms(prev => prev.map(update));
      setArchivedPlatforms(prev => prev.map(update));
    }
  }, [workingPlatform]);

  const handleUpdateResource = useCallback((platformId: string, resourceId: string, updates: Partial<ApiResource>) => {
    if (workingPlatform?.id === platformId) {
      setWorkingPlatform(prev => prev ? { 
        ...prev, 
        contributors: prev.contributors.map(r => r.id === resourceId ? { ...r, ...updates } : r) 
      } : null);
    } else {
      const update = (p: Platform) => p.id === platformId 
        ? { ...p, contributors: p.contributors.map(r => r.id === resourceId ? { ...r, ...updates } : r) } : p;
      setSavedActivePlatforms(prev => prev.map(update));
      setArchivedPlatforms(prev => prev.map(update));
    }
  }, [workingPlatform]);

  // HANDSHAKE HANDLERS
  const handleAddHandshake = useCallback((platformId: string, resourceId: string) => {
    console.log('🖱️ +Handshake for:', platformId, resourceId);
    const serial = generateUniqueSerial('HS', getAllSerials());
    const newHandshake: Handshake = {
      id: 'hs-' + Date.now(),
      serial,
      endpointName: '',
      authentication: { type: '' },
      curlRequests: [],
      schemaModels: [],
      promotedActions: [],
      status: 'unconfigured',
      isExpanded: true,
    };
    
    const updatePlatform = (p: Platform) => p.id === platformId 
      ? { ...p, contributors: p.contributors.map(r => r.id === resourceId 
          ? { ...r, handshakes: [...r.handshakes, newHandshake] } : r) } : p;
    
    if (workingPlatform?.id === platformId) {
      setWorkingPlatform(prev => prev ? updatePlatform(prev) : null);
    } else {
      setSavedActivePlatforms(prev => prev.map(updatePlatform));
      setArchivedPlatforms(prev => prev.map(updatePlatform));
    }
  }, [getAllSerials, workingPlatform]);

  const handleUpdateHandshake = useCallback((pId: string, rId: string, hId: string, updates: Partial<Handshake>) => {
    const updatePlatform = (p: Platform) => p.id === pId 
      ? { ...p, contributors: p.contributors.map(r => r.id === rId 
          ? { ...r, handshakes: r.handshakes.map(h => h.id === hId ? { ...h, ...updates } : h) } : r) } : p;
    
    if (workingPlatform?.id === pId) {
      setWorkingPlatform(prev => prev ? updatePlatform(prev) : null);
    } else {
      setSavedActivePlatforms(prev => prev.map(updatePlatform));
      setArchivedPlatforms(prev => prev.map(updatePlatform));
    }
  }, [workingPlatform]);

  const handleDeleteHandshake = useCallback((pId: string, rId: string, hId: string) => {
    const updatePlatform = (p: Platform) => p.id === pId 
      ? { ...p, contributors: p.contributors.map(r => r.id === rId 
          ? { ...r, handshakes: r.handshakes.filter(h => h.id !== hId) } : r) } : p;
    
    if (workingPlatform?.id === pId) {
      setWorkingPlatform(prev => prev ? updatePlatform(prev) : null);
    } else {
      setSavedActivePlatforms(prev => prev.map(updatePlatform));
      setArchivedPlatforms(prev => prev.map(updatePlatform));
    }
  }, [workingPlatform]);

  // TOGGLE HANDLERS
  const toggle = (id: string) => {
    if (workingPlatform?.id === id) {
      setWorkingPlatform(prev => prev ? { ...prev, isExpanded: !prev.isExpanded } : null);
    } else {
      const updateExp = (p: Platform) => p.id === id ? { ...p, isExpanded: !p.isExpanded } : p;
      setSavedActivePlatforms(prev => prev.map(updateExp));
      setArchivedPlatforms(prev => prev.map(updateExp));
    }
  };

  const toggleResource = (pId: string, rId: string) => {
    const update = (p: Platform) => p.id === pId 
      ? { ...p, contributors: p.contributors.map(r => r.id === rId ? { ...r, isExpanded: !r.isExpanded } : r) } : p;
    
    if (workingPlatform?.id === pId) {
      setWorkingPlatform(prev => prev ? update(prev) : null);
    } else {
      setSavedActivePlatforms(prev => prev.map(update));
      setArchivedPlatforms(prev => prev.map(update));
    }
  };

  const toggleHandshake = (pId: string, rId: string, hId: string) => {
    const update = (p: Platform) => p.id === pId 
      ? { ...p, contributors: p.contributors.map(r => r.id === rId 
          ? { ...r, handshakes: r.handshakes.map(h => h.id === hId ? { ...h, isExpanded: !h.isExpanded } : h) } : r) } : p;
    
    if (workingPlatform?.id === pId) {
      setWorkingPlatform(prev => prev ? update(prev) : null);
    } else {
      setSavedActivePlatforms(prev => prev.map(update));
      setArchivedPlatforms(prev => prev.map(update));
    }
  };

  // ============================================
  // RENDER PLATFORM SECTION
  // ============================================
  const renderPlatform = (platform: Platform, parentSerial: string = '') => {
    const fullSerial = parentSerial ? `${parentSerial}.${platform.serial}` : platform.serial;
    return (
      <details key={platform.id} className="platform-section" open={platform.isExpanded} data-id={platform.id}>
        <summary className="accordion-summary" onClick={(e) => { e.preventDefault(); toggle(platform.id); }}>
          <span className={platform.isMaster ? 'badge-master' : 'badge-unconfirmed'}>{platform.isMaster ? '🛡️' : '❓'}</span>
          <div className="accordion-title-container">
            <span className="accordion-title">{platform.name || 'Untitled Platform'}</span>
          </div>
          <div className="accordion-right">
            <span className="accordion-serial">{fullSerial}</span>
            <button className="btn-remove" onClick={(e) => { e.stopPropagation(); handleDeletePlatform(platform.id); }}>🗑️</button>
          </div>
        </summary>

        {platform.isExpanded && (
          <div className="accordion-content">
            <div className="form-group"><label><span className="input-label">1.a</span> Platform Name</label>
              <input type="text" value={platform.name} onChange={(e) => handleUpdatePlatform(platform.id, { name: e.target.value })} /></div>
            <div className="form-group"><label><span className="input-label">1.b</span> Platform URL</label>
              <input type="text" value={platform.url} placeholder="https://api.example.com" onChange={(e) => handleUpdatePlatform(platform.id, { url: e.target.value })} /></div>
            <div className="form-group"><label><span className="input-label">1.c</span> Description</label>
              <textarea value={platform.description} rows={2} onChange={(e) => handleUpdatePlatform(platform.id, { description: e.target.value })} /></div>
            <div className="form-group"><label><span className="input-label">1.d</span> Documentation URL</label>
              <input type="text" value={platform.doc_url} onChange={(e) => handleUpdatePlatform(platform.id, { doc_url: e.target.value })} /></div>
            <div className="form-group"><label><span className="input-label">1.e</span> Authentication Notes</label>
              <textarea value={platform.auth_notes} rows={2} onChange={(e) => handleUpdatePlatform(platform.id, { auth_notes: e.target.value })} /></div>

            <hr className="divider-full" />

            <div className="section-header">
              <h3>📦 API Resources</h3>
              <button className="btn btn--add-small" onClick={() => handleAddResource(platform.id)}>+ Add Resource</button>
            </div>

            {platform.contributors.map(resource => renderResource(platform, resource, fullSerial))}

            <div className="platform-actions">
              <div className="platform-actions-left">
                {!platform.isMaster && <button className="btn btn--confirm" onClick={() => handleUpdatePlatform(platform.id, { isMaster: true })}>✓ Confirm Master</button>}
                {workingPlatform?.id !== platform.id && (
                  <button className="btn btn--archive" onClick={() => handleArchiveFromActive(platform.id)}>📦 Archive</button>
                )}
              </div>
              <div className="platform-actions-right">
                <span className="save-status">Ready.</span>
                <button className="btn btn--text-danger" onClick={() => handleDeletePlatform(platform.id)}>Cancel</button>
                {workingPlatform?.id === platform.id ? (
                  <button className="btn btn--save" onClick={handleSaveWorkingPlatform}>💾 Save Platform</button>
                ) : (
                  <button className="btn btn--text-success">Update</button>
                )}
              </div>
            </div>
          </div>
        )}
      </details>
    );
  };

  // ============================================
  // RENDER RESOURCE SECTION
  // ============================================
  const renderResource = (platform: Platform, resource: ApiResource, parentSerial: string) => {
    const fullSerial = `${parentSerial}.${resource.serial}`;
    return (
      <details key={resource.id} className="contributor-section" open={resource.isExpanded}>
        <summary className="accordion-summary" onClick={(e) => { e.preventDefault(); toggleResource(platform.id, resource.id); }}>
          <span>📦</span>
          <div className="accordion-title-container">
            <span className="accordion-title">{resource.title || 'Untitled Resource'}</span>
          </div>
          <div className="accordion-right">
            <span className="accordion-serial">{fullSerial}</span>
            <button className="btn-remove" onClick={(e) => { e.stopPropagation(); handleDeleteResource(platform.id, resource.id); }}>🗑️</button>
          </div>
        </summary>

        {resource.isExpanded && (
          <div className="accordion-content">
            <div className="form-group"><label><span className="input-label">1.a</span> Resource Title</label>
              <input type="text" value={resource.title} onChange={(e) => handleUpdateResource(platform.id, resource.id, { title: e.target.value })} /></div>
            <div className="form-group"><label><span className="input-label">1.b</span> API URL</label>
              <input type="text" value={resource.url} onChange={(e) => handleUpdateResource(platform.id, resource.id, { url: e.target.value })} /></div>
            <div className="form-group"><label><span className="input-label">1.c</span> Description</label>
              <textarea value={resource.description} rows={2} onChange={(e) => handleUpdateResource(platform.id, resource.id, { description: e.target.value })} /></div>
            <div className="form-group"><label><span className="input-label">1.d</span> Doc URL</label>
              <input type="text" value={resource.doc_url} onChange={(e) => handleUpdateResource(platform.id, resource.id, { doc_url: e.target.value })} /></div>
            <div className="form-group"><label><span className="input-label">1.e</span> Notes</label>
              <textarea value={resource.notes} rows={2} onChange={(e) => handleUpdateResource(platform.id, resource.id, { notes: e.target.value })} /></div>

            <hr className="divider-sub" />

            <div className="section-header">
              <h4>🤝 Handshakes</h4>
              <button className="btn btn--add-small" onClick={() => handleAddHandshake(platform.id, resource.id)}>+ Add Handshake</button>
            </div>

            {resource.handshakes.map(handshake => renderHandshake(platform, resource, handshake, fullSerial))}
          </div>
        )}
      </details>
    );
  };

  // ============================================
  // RENDER HANDSHAKE SECTION - GRANDFATHER EXACT
  // ============================================
  const renderHandshake = (platform: Platform, resource: ApiResource, handshake: Handshake, parentSerial: string) => {
    const fullSerial = `${parentSerial}.${handshake.serial}`;
    return (
      <details key={handshake.id} className="handshake-section" open={handshake.isExpanded}>
        <summary className="accordion-summary" onClick={(e) => { e.preventDefault(); toggleHandshake(platform.id, resource.id, handshake.id); }}>
          <span className={`ekg-icon ekg-${handshake.status}`}>🤝</span>
          <div className="accordion-title-container">
            <span className="accordion-title">{handshake.endpointName || 'Untitled Handshake'}</span>
          </div>
          <div className="accordion-right">
            <span className="accordion-serial">{fullSerial}</span>
            <button className="btn-remove" onClick={(e) => { e.stopPropagation(); handleDeleteHandshake(platform.id, resource.id, handshake.id); }}>🗑️</button>
          </div>
        </summary>

        {handshake.isExpanded && (
          <div className="accordion-content">
            {/* SECTION 1: Protocol Channel */}
            <h4 className="handshake-step-header"><span className="step-number">1</span> Protocol Channel</h4>
            <div className="form-group">
              <label><span className="input-label">1.a</span> Integration Name <span className="label-badge">Optional</span></label>
              <input type="text" value={handshake.endpointName} placeholder="My API Integration"
                onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { endpointName: e.target.value })} />
            </div>
            <div className="form-group">
              <label><span className="input-label">1.b</span> Protocol Channel <span className="label-badge">Auto-Routes</span></label>
              <AuthTypeSelect 
                value={handshake.authentication.type as string}
                onChange={(val) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { 
                  authentication: { type: val },
                  status: val ? 'awaiting_auth' : 'unconfigured'
                })}
              />
            </div>

            {/* SECTION 2: Channel Configuration */}
            <h4 className="handshake-step-header"><span className="step-number">2</span> Channel Configuration</h4>
            <CredentialsForm authType={handshake.authentication.type as string} />

            {/* SECTION 3: Request Input */}
            <h4 className="handshake-step-header"><span className="step-number">3</span> Request Input</h4>
            <div className="form-group">
              <label><span className="input-label">3.a</span> Input Model (cURL, Schema, JSON, XML) <span className="label-badge">Primary</span></label>
              <textarea rows={6} placeholder="curl https://api.github.com/users/octocat" />
            </div>
            <div className="form-group">
              <label><span className="input-label">3.b</span> Dynamic Input <span className="label-badge">Replaces {'{INPUT}'}</span></label>
              <div className="dynamic-input-container">
                <div className="form-group">
                  <label><span className="input-label">3.b.i</span> Text Input</label>
                  <input type="text" placeholder="Enter text to replace {INPUT} placeholder..." />
                </div>
                <div className="or-separator">OR</div>
                <div className="form-group">
                  <label><span className="input-label">3.b.ii</span> File Input</label>
                  <input type="file" />
                </div>
              </div>
            </div>

            {/* SECTION 4: Execute */}
            <h4 className="handshake-step-header"><span className="step-number">4</span> Execution & Output</h4>
            <div className="form-group">
              <label><span className="input-label">4.a</span> Execute</label>
              <button className="btn btn--execute">🚀 EXECUTE REQUEST</button>
            </div>
          </div>
        )}
      </details>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="app">
      <header className="app__header">
        <div className="header-title-container" onClick={() => setArchiveVisible(!archiveVisible)}>
          <h1>Family Platform Master API Key Manager</h1>
          <p className="app__subtitle">Configure AI providers for content generation • Supports ALL file types</p>
        </div>
        <button className="btn-plus" onClick={handleStartNewPlatform} title="New Platform">+</button>
      </header>

      {/* ARCHIVED PLATFORMS DROPDOWN */}
      <div className={`header-subcontainer archive-panel ${archiveVisible ? 'is-visible' : ''}`}>
        <div className="archive-header">
          <h2>📦 Archived Master Platforms</h2>
          <button className="btn btn--secondary" onClick={handleAddArchivedPlatform}>+ Mint New Archived Master</button>
        </div>
        <div className="archived-platforms-container">
          {archivedPlatforms.length === 0 ? (
            <p className="empty-text">No archived platforms.</p>
          ) : (
            archivedPlatforms.map(p => (
              <div key={p.id} className="saved-platform-row">
                {renderPlatform(p)}
                <button className="btn btn--inject" onClick={() => handleInjectFromArchive(p.id)}>💉 Inject to Active</button>
              </div>
            ))
          )}
        </div>
      </div>

      <main className="app__main">
        {/* SAVED ACTIVE PLATFORMS - CLICKABLE HEADER */}
        <div className="saved-active-section">
          <h2 className="saved-active-header" onClick={() => setSavedActiveVisible(!savedActiveVisible)}>
            <span className="header-chevron">{savedActiveVisible ? '▼' : '▶'}</span>
            Active Family Platform Master API Key Managers
            <span className="saved-count">({savedActivePlatforms.length} saved)</span>
          </h2>
          
          <div className={`saved-active-container ${savedActiveVisible ? 'is-visible' : ''}`}>
            {savedActivePlatforms.length === 0 ? (
              <p className="empty-text">No saved active platforms. Fill out the form below and save.</p>
            ) : (
              savedActivePlatforms.map(p => renderPlatform(p))
            )}
          </div>
        </div>

        {/* WORKING FORM AREA */}
        <div className="working-form-section">
          <h3 className="working-form-header">
            {workingPlatform ? '✏️ New Platform' : '🆕 Start a New Platform'}
          </h3>
          
          {workingPlatform ? (
            renderPlatform(workingPlatform)
          ) : (
            <div className="empty-state">
              <p>Click the <span className="plus-hint">+</span> button above to start a new platform.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="app__footer">
        <span>Saved Active: {savedActivePlatforms.length} | Archived: {archivedPlatforms.length} | Working: {workingPlatform ? 1 : 0}</span>
      </footer>
    </div>
  );
};

export default App;
