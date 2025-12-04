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
// TYPES
// ============================================

interface Authentication {
  type: string;
  [key: string]: unknown;
}

interface Handshake {
  id: string;
  serial: string;
  endpointName: string;
  authentication: Authentication;
  status: 'unconfigured' | 'awaiting_auth' | 'healthy' | 'failed';
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
// CONSTANTS - EXACT AUTH TYPES FROM GRANDFATHER
// ============================================

const AUTH_TYPES = [
  { value: '', label: 'Select an authentication type...' },
  { value: 'curl-default', label: 'Universal cURL Execution' },
  { value: 'oauth-pkce', label: 'OAuth 2.0 (PKCE)' },
  { value: 'oauth-auth-code', label: 'OAuth 2.0 (Authorization Code)' },
  { value: 'oauth-implicit', label: 'OAuth 2.0 (Implicit Grant)' },
  { value: 'client-credentials', label: 'OAuth 2.0 (Client Credentials)' },
  { value: 'rest-api-key', label: 'REST API Key / Bearer Token' },
  { value: 'basic-auth', label: 'HTTP Basic Authentication' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'websocket', label: 'WebSocket' },
  { value: 'soap-xml', label: 'SOAP/XML' },
  { value: 'sse', label: 'Server-Sent Events' },
  { value: 'grpc-web', label: 'gRPC-Web' },
  { value: 'github-direct', label: 'GitHub Direct Connect' },
  { value: 'keyless-scraper', label: 'Keyless Web Scraper' },
];

// ============================================
// SERIAL GENERATOR
// ============================================

function generateSerial(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${randomPart}`;
}

// ============================================
// CREDENTIALS FORM RENDERER - EXACT GRANDFATHER STRUCTURE
// ============================================

interface CredentialsFormProps {
  authType: string;
  authentication: Authentication;
  onUpdate: (field: string, value: string) => void;
}

const CredentialsForm: React.FC<CredentialsFormProps> = ({ authType, authentication, onUpdate }) => {
  console.log('🎨 CredentialsForm render:', authType);

  const renderInput = (
    fieldId: string,
    label: string,
    placeholder: string,
    options?: { required?: boolean; type?: string; badge?: string; defaultValue?: string; readonly?: boolean }
  ) => (
    <div className="input-group">
      <label>
        <span className="input-label">{fieldId}</span> {label}
        {options?.required && <span className="required">*</span>}
        {options?.badge && <span className="label-badge">{options.badge}</span>}
      </label>
      <input
        type={options?.type || 'text'}
        placeholder={placeholder}
        defaultValue={options?.defaultValue}
        readOnly={options?.readonly}
        onChange={(e) => onUpdate(fieldId.replace('.', '_'), e.target.value)}
      />
    </div>
  );

  const renderSelect = (
    fieldId: string,
    label: string,
    selectOptions: { value: string; label: string }[],
    options?: { required?: boolean }
  ) => (
    <div className="input-group">
      <label>
        <span className="input-label">{fieldId}</span> {label}
        {options?.required && <span className="required">*</span>}
      </label>
      <select onChange={(e) => onUpdate(fieldId.replace('.', '_'), e.target.value)}>
        {selectOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  // CURL-DEFAULT
  if (authType === 'curl-default') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Mode:</strong> Universal cURL Execution<br />
          <strong>Server-Side:</strong> No CORS restrictions<br />
          <strong>Credentials:</strong> Optional - can be embedded in cURL
        </div>
      </div>
    );
  }

  // OAUTH-PKCE
  if (authType === 'oauth-pkce') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Flow:</strong> Authorization Code + PKCE<br />
          <strong>Security:</strong> SHA256 code challenge<br />
          <strong>Callback Required:</strong> Yes - copy URL below
        </div>
        {renderInput('2.a', 'Auth URL', 'https://accounts.google.com/o/oauth2/v2/auth', { required: true })}
        {renderInput('2.b', 'Token URL', 'https://oauth2.googleapis.com/token', { required: true })}
        {renderInput('2.c', 'API Endpoint URL', 'https://api.example.com/v1/endpoint', { required: true })}
        {renderInput('2.d', 'Client ID', 'your-client-id', { required: true })}
        {renderInput('2.e', 'Scope', 'openid profile email', { badge: 'Optional' })}
        {renderInput('2.f', 'Redirect URI', window.location.origin + '/callback', { badge: 'Generated', readonly: true })}
      </div>
    );
  }

  // OAUTH-AUTH-CODE
  if (authType === 'oauth-auth-code') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Flow:</strong> Standard Authorization Code<br />
          <strong>Use Case:</strong> Web applications<br />
          <strong>Callback Required:</strong> Yes - copy URL below
        </div>
        {renderInput('2.a', 'Auth URL', 'https://accounts.google.com/o/oauth2/v2/auth', { required: true })}
        {renderInput('2.b', 'Token URL', 'https://oauth2.googleapis.com/token', { required: true })}
        {renderInput('2.c', 'API Endpoint URL', 'https://api.example.com/v1/endpoint', { required: true })}
        {renderInput('2.d', 'Client ID', 'your-client-id', { required: true })}
        {renderInput('2.e', 'Client Secret', 'your-client-secret', { required: true, type: 'password' })}
        {renderInput('2.f', 'Scope', 'openid profile email', { badge: 'Optional' })}
        {renderInput('2.g', 'Redirect URI', window.location.origin + '/callback', { badge: 'Generated', readonly: true })}
      </div>
    );
  }

  // OAUTH-IMPLICIT
  if (authType === 'oauth-implicit') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Flow:</strong> Implicit Grant<br />
          <strong>Use Case:</strong> Client-side apps<br />
          <strong>Callback Required:</strong> Yes - copy URL below
        </div>
        {renderInput('2.a', 'Auth URL', 'https://accounts.google.com/o/oauth2/v2/auth', { required: true })}
        {renderInput('2.b', 'API Endpoint URL', 'https://api.example.com/v1/endpoint', { required: true })}
        {renderInput('2.c', 'Client ID', 'your-client-id', { required: true })}
        {renderInput('2.d', 'Scope', 'openid profile email', { badge: 'Optional' })}
        {renderInput('2.e', 'Redirect URI', window.location.origin + '/callback', { badge: 'Generated', readonly: true })}
      </div>
    );
  }

  // CLIENT-CREDENTIALS
  if (authType === 'client-credentials') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Flow:</strong> Client Credentials Grant<br />
          <strong>Use Case:</strong> Server-to-server auth<br />
          <strong>Callback Required:</strong> No
        </div>
        {renderInput('2.a', 'Token URL', 'https://oauth2.googleapis.com/token', { required: true })}
        {renderInput('2.b', 'API Endpoint URL', 'https://api.example.com/v1/endpoint', { required: true })}
        {renderInput('2.c', 'Client ID', 'your-client-id', { required: true })}
        {renderInput('2.d', 'Client Secret', 'your-client-secret', { required: true, type: 'password' })}
        {renderInput('2.e', 'Scope', 'read write', { badge: 'Optional' })}
      </div>
    );
  }

  // REST-API-KEY
  if (authType === 'rest-api-key') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Auth:</strong> API Key or Bearer Token<br />
          <strong>Format:</strong> JSON<br />
          <strong>Callback Required:</strong> No
        </div>
        {renderInput('2.a', 'API Endpoint URL', 'https://api.example.com/v1/endpoint', { required: true })}
        {renderInput('2.b', 'API Key / Token', 'sk-...', { required: true, type: 'password' })}
        {renderInput('2.c', 'Header Name', 'Authorization or X-API-Key', { badge: 'Default: Authorization', defaultValue: 'Authorization' })}
      </div>
    );
  }

  // BASIC-AUTH
  if (authType === 'basic-auth') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Auth:</strong> HTTP Basic Authentication<br />
          <strong>Format:</strong> Any<br />
          <strong>Callback Required:</strong> No
        </div>
        {renderInput('2.a', 'API Endpoint URL', 'https://api.example.com/endpoint', { required: true })}
        {renderInput('2.b', 'Username', 'username', { required: true })}
        {renderInput('2.c', 'Password', 'password', { required: true, type: 'password' })}
      </div>
    );
  }

  // GRAPHQL
  if (authType === 'graphql') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Protocol:</strong> GraphQL over HTTP<br />
          <strong>Format:</strong> Query + Variables<br />
          <strong>Callback Required:</strong> No
        </div>
        {renderInput('2.a', 'GraphQL Endpoint', 'https://api.example.com/graphql', { required: true })}
        {renderInput('2.b', 'Auth Token', 'Bearer token or API key', { badge: 'Optional', type: 'password' })}
      </div>
    );
  }

  // WEBSOCKET
  if (authType === 'websocket') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Protocol:</strong> WebSocket<br />
          <strong>Connection:</strong> Persistent, bidirectional<br />
          <strong>Callback Required:</strong> No
        </div>
        {renderInput('2.a', 'WebSocket URL', 'wss://example.com/socket', { required: true })}
        {renderInput('2.b', 'Connection Timeout', '10000', { badge: 'ms', defaultValue: '10000' })}
      </div>
    );
  }

  // SOAP-XML
  if (authType === 'soap-xml') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Protocol:</strong> SOAP over HTTP<br />
          <strong>Format:</strong> XML with SOAP Envelope<br />
          <strong>Callback Required:</strong> No
        </div>
        {renderInput('2.a', 'SOAP Endpoint', 'https://service.example.com/soap', { required: true })}
        {renderInput('2.b', 'SOAP Action', 'http://example.com/GetData', { badge: 'Optional' })}
        {renderInput('2.c', 'Username', 'For WS-Security', { badge: 'Optional' })}
        {renderInput('2.d', 'Password', 'For WS-Security', { badge: 'Optional', type: 'password' })}
      </div>
    );
  }

  // SSE
  if (authType === 'sse') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Protocol:</strong> Server-Sent Events<br />
          <strong>Connection:</strong> Unidirectional server to client<br />
          <strong>Callback Required:</strong> No
        </div>
        {renderInput('2.a', 'SSE URL', 'https://example.com/events', { required: true })}
      </div>
    );
  }

  // GRPC-WEB
  if (authType === 'grpc-web') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Protocol:</strong> gRPC-Web<br />
          <strong>Note:</strong> Requires protobuf definitions in model input<br />
          <strong>Callback Required:</strong> No
        </div>
        {renderInput('2.a', 'gRPC Endpoint', 'https://grpc.example.com/service', { required: true })}
        {renderInput('2.b', 'Auth Token', 'Bearer token', { badge: 'Optional', type: 'password' })}
      </div>
    );
  }

  // GITHUB-DIRECT
  if (authType === 'github-direct') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Protocol:</strong> GitHub Direct Connect<br />
          <strong>Use Case:</strong> Fetch and run from repo<br />
          <strong>Callback Required:</strong> No
        </div>
        {renderInput('2.a', 'GitHub Repository', 'owner/repo', { required: true })}
        {renderInput('2.b', 'Branch', 'main', { required: true, defaultValue: 'main' })}
        {renderInput('2.c', 'GitHub PAT', 'ghp_...', { badge: 'Optional', type: 'password' })}
        {renderSelect('2.d', 'Runtime', [
          { value: 'javascript', label: 'JavaScript' },
          { value: 'node', label: 'Node.js' },
          { value: 'python', label: 'Python' },
        ], { required: true })}
        {renderInput('2.e', 'Install Command', 'npm install', { badge: 'Optional' })}
        {renderInput('2.f', 'Entrypoint Path', 'src/index.js', { required: true })}
        {renderInput('2.g', 'Run Command', 'node index.js', { required: true })}
      </div>
    );
  }

  // KEYLESS-SCRAPER
  if (authType === 'keyless-scraper') {
    return (
      <div className="credentials-form">
        <div className="action-trigger">
          <strong>Protocol:</strong> Keyless Access Web Scraper<br />
          <strong>Note:</strong> No credentials required. Proceed to Section 3.<br />
          <strong>Callback Required:</strong> No
        </div>
      </div>
    );
  }

  // DEFAULT - No auth type selected
  return (
    <div className="credentials-form">
      <div className="action-trigger action-trigger--empty">
        Select an authentication type above to configure credentials.
      </div>
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================

const App: React.FC = () => {
  console.log('🔴 APP RENDER');

  const [platforms, setPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    console.log('🟢 APP MOUNT');
    logger.success('App.Init', 'Protocol OS mounted', { commentary: COMMENTARY.SYSTEM_INIT });
  }, []);

  // PLATFORM HANDLERS
  const handleAddPlatform = useCallback(() => {
    console.log('🖱️ +Platform');
    const newPlatform: Platform = {
      id: 'plat-' + Date.now(),
      serial: generateSerial('PLAT'),
      name: 'Untitled Platform',
      url: '', description: '', doc_url: '', auth_notes: '',
      contributors: [],
      isMaster: false,
      isExpanded: true,
    };
    setPlatforms(prev => [...prev, newPlatform]);
  }, []);

  const handleUpdatePlatform = useCallback((id: string, updates: Partial<Platform>) => {
    setPlatforms(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const handleDeletePlatform = useCallback((id: string) => {
    setPlatforms(prev => prev.filter(p => p.id !== id));
  }, []);

  // RESOURCE HANDLERS
  const handleAddResource = useCallback((platformId: string) => {
    console.log('🖱️ +Resource');
    const newResource: ApiResource = {
      id: 'res-' + Date.now(),
      serial: generateSerial('RES'),
      title: 'Untitled API Resource',
      url: '', description: '', doc_url: '', notes: '',
      handshakes: [],
      isExpanded: true,
    };
    setPlatforms(prev => prev.map(p => p.id === platformId 
      ? { ...p, contributors: [...p.contributors, newResource] } 
      : p
    ));
  }, []);

  const handleUpdateResource = useCallback((platformId: string, resourceId: string, updates: Partial<ApiResource>) => {
    setPlatforms(prev => prev.map(p => p.id === platformId 
      ? { ...p, contributors: p.contributors.map(r => r.id === resourceId ? { ...r, ...updates } : r) }
      : p
    ));
  }, []);

  const handleDeleteResource = useCallback((platformId: string, resourceId: string) => {
    setPlatforms(prev => prev.map(p => p.id === platformId 
      ? { ...p, contributors: p.contributors.filter(r => r.id !== resourceId) }
      : p
    ));
  }, []);

  // HANDSHAKE HANDLERS
  const handleAddHandshake = useCallback((platformId: string, resourceId: string) => {
    console.log('🖱️ +Handshake');
    const newHandshake: Handshake = {
      id: 'hs-' + Date.now(),
      serial: generateSerial('HS'),
      endpointName: 'New API Handshake',
      authentication: { type: '' },
      status: 'unconfigured',
      isExpanded: true,
    };
    setPlatforms(prev => prev.map(p => p.id === platformId 
      ? { ...p, contributors: p.contributors.map(r => r.id === resourceId 
          ? { ...r, handshakes: [...r.handshakes, newHandshake] }
          : r
        )}
      : p
    ));
  }, []);

  const handleUpdateHandshake = useCallback((platformId: string, resourceId: string, handshakeId: string, updates: Partial<Handshake>) => {
    setPlatforms(prev => prev.map(p => p.id === platformId 
      ? { ...p, contributors: p.contributors.map(r => r.id === resourceId 
          ? { ...r, handshakes: r.handshakes.map(h => h.id === handshakeId ? { ...h, ...updates } : h) }
          : r
        )}
      : p
    ));
  }, []);

  const handleDeleteHandshake = useCallback((platformId: string, resourceId: string, handshakeId: string) => {
    setPlatforms(prev => prev.map(p => p.id === platformId 
      ? { ...p, contributors: p.contributors.map(r => r.id === resourceId 
          ? { ...r, handshakes: r.handshakes.filter(h => h.id !== handshakeId) }
          : r
        )}
      : p
    ));
  }, []);

  // TOGGLE HANDLERS
  const togglePlatform = (id: string) => setPlatforms(prev => prev.map(p => p.id === id ? { ...p, isExpanded: !p.isExpanded } : p));
  const toggleResource = (pId: string, rId: string) => setPlatforms(prev => prev.map(p => p.id === pId 
    ? { ...p, contributors: p.contributors.map(r => r.id === rId ? { ...r, isExpanded: !r.isExpanded } : r) } : p));
  const toggleHandshake = (pId: string, rId: string, hId: string) => setPlatforms(prev => prev.map(p => p.id === pId 
    ? { ...p, contributors: p.contributors.map(r => r.id === rId 
        ? { ...r, handshakes: r.handshakes.map(h => h.id === hId ? { ...h, isExpanded: !h.isExpanded } : h) } : r) } : p));

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="app">
      <header className="app__header">
        <h1>🤝 Protocol OS</h1>
        <p className="app__subtitle">Family Platform | Resource | Handshake | Protocol</p>
        <button className="btn btn--add" onClick={handleAddPlatform}>+ Add New Platform</button>
      </header>

      <main className="app__main">
        {platforms.length === 0 ? (
          <div className="empty-state">
            <p>No active platforms configured.</p>
            <p>Click "Add New Platform" to begin.</p>
          </div>
        ) : (
          platforms.map(platform => (
            <details key={platform.id} className="platform-section" open={platform.isExpanded}>
              <summary className="accordion-summary" onClick={(e) => { e.preventDefault(); togglePlatform(platform.id); }}>
                <span className={platform.isMaster ? 'master-badge' : 'unconfirmed-badge'}>
                  {platform.isMaster ? '🛡️' : '❓'}
                </span>
                <div className="accordion-title-container">
                  <span>{platform.name}</span>
                  <span className="accordion-serial">{platform.serial}</span>
                </div>
                <button className="btn-remove" onClick={(e) => { e.stopPropagation(); handleDeletePlatform(platform.id); }}>✕</button>
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

                  {platform.contributors.map(resource => (
                    <details key={resource.id} className="contributor-section" open={resource.isExpanded}>
                      <summary className="accordion-summary" onClick={(e) => { e.preventDefault(); toggleResource(platform.id, resource.id); }}>
                        <span>📦</span>
                        <div className="accordion-title-container">
                          <span>{resource.title}</span>
                          <span className="accordion-serial">{resource.serial}</span>
                        </div>
                        <button className="btn-remove" onClick={(e) => { e.stopPropagation(); handleDeleteResource(platform.id, resource.id); }}>✕</button>
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

                          {resource.handshakes.map(handshake => (
                            <details key={handshake.id} className="handshake-section" open={handshake.isExpanded}>
                              <summary className="accordion-summary" onClick={(e) => { e.preventDefault(); toggleHandshake(platform.id, resource.id, handshake.id); }}>
                                <span className={'ekg-icon ekg-' + handshake.status}>🤝</span>
                                <div className="accordion-title-container">
                                  <span>{handshake.endpointName}</span>
                                  <span className="accordion-serial">{handshake.serial}</span>
                                </div>
                                <button className="btn-remove" onClick={(e) => { e.stopPropagation(); handleDeleteHandshake(platform.id, resource.id, handshake.id); }}>✕</button>
                              </summary>

                              {handshake.isExpanded && (
                                <div className="accordion-content">
                                  {/* STEP 1: ENDPOINT NAME */}
                                  <h4 className="handshake-step-header"><span className="step-number">1</span> Endpoint Configuration</h4>
                                  <div className="form-group">
                                    <label><span className="input-label">1.a</span> Endpoint Name<span className="required">*</span></label>
                                    <input 
                                      type="text" 
                                      value={handshake.endpointName}
                                      placeholder="e.g., Get User Profile"
                                      onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { endpointName: e.target.value })}
                                    />
                                  </div>

                                  {/* STEP 2: CREDENTIALS */}
                                  <h4 className="handshake-step-header"><span className="step-number">2</span> Credentials & Authentication</h4>
                                  <div className="form-group">
                                    <label><span className="input-label">2.0</span> Authentication Type<span className="required">*</span></label>
                                    <select 
                                      value={handshake.authentication.type}
                                      onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { 
                                        authentication: { type: e.target.value },
                                        status: e.target.value ? 'awaiting_auth' : 'unconfigured'
                                      })}
                                    >
                                      {AUTH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                  </div>
                                  
                                  <CredentialsForm 
                                    authType={handshake.authentication.type}
                                    authentication={handshake.authentication}
                                    onUpdate={(field, value) => handleUpdateHandshake(platform.id, resource.id, handshake.id, {
                                      authentication: { ...handshake.authentication, [field]: value }
                                    })}
                                  />

                                  {/* STEP 3: MODEL INPUT (placeholder) */}
                                  <h4 className="handshake-step-header"><span className="step-number">3</span> Model Input / Request Body</h4>
                                  <div className="form-group">
                                    <label><span className="input-label">3.a</span> Model Input<span className="required">*</span></label>
                                    <textarea rows={4} placeholder='{"query": "{INPUT}", "limit": 10}' />
                                  </div>

                                  <div className="platform-actions">
                                    <button className="btn btn--execute">🚀 EXECUTE REQUEST</button>
                                  </div>
                                </div>
                              )}
                            </details>
                          ))}
                        </div>
                      )}
                    </details>
                  ))}

                  <div className="platform-actions">
                    {!platform.isMaster && <button className="btn btn--confirm" onClick={() => handleUpdatePlatform(platform.id, { isMaster: true })}>✓ Confirm Master & Save</button>}
                    <button className="btn btn--save">💾 Save</button>
                  </div>
                </div>
              )}
            </details>
          ))
        )}
      </main>

      <footer className="app__footer">
        <span>{platforms.length} platforms · {platforms.reduce((s,p)=>s+p.contributors.length,0)} resources · {platforms.reduce((s,p)=>s+p.contributors.reduce((x,r)=>x+r.handshakes.length,0),0)} handshakes</span>
      </footer>
    </div>
  );
};

export default App;
