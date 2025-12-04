// ============================================
// PROTOCOL OS - MAIN APPLICATION COMPONENT
// ============================================
// Address: 1.0.b
// Purpose: Root Application Component with Full Form Hierarchy
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import './app.css';
import { logger, COMMENTARY } from './1.8_folderSharedUtilities/1.8.g_fileSystemLogger';

// ============================================
// TYPES - Matching Grandfather Code Structure
// ============================================

type ViewMode = 'builder' | 'library' | 'split';
type HandshakeStatus = 'unconfigured' | 'awaiting_auth' | 'healthy' | 'failed';

interface Authentication {
  type: string;
  [key: string]: unknown;
}

interface Handshake {
  id: string;
  serial: string;
  endpointName: string;
  authentication: Authentication;
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
// CONSTANTS
// ============================================

const AUTH_TYPES = [
  'Select an authentication type...',
  'API Key / Basic Auth',
  'OAuth 2.0 (Authorization Code)',
  'OAuth 2.0 (PKCE)',
  'OAuth 2.0 (Client Credentials)',
  'GitHub Direct Execution',
  'Web Scraper (No Auth - Keyless exchange)',
];

// ============================================
// SERIAL GENERATOR
// ============================================

function generateSerial(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const serial = `${prefix}-${randomPart}`;
  console.log(`🔢 Generated serial: ${serial}`);
  return serial;
}

// ============================================
// MAIN APP COMPONENT
// ============================================

const App: React.FC = () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔴 APP COMPONENT RENDER START');
  console.log('═══════════════════════════════════════════════════════════');

  const [viewMode, setViewMode] = useState<ViewMode>('builder');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [systemStatus] = useState<'healthy' | 'loading' | 'error'>('healthy');

  console.log('🔵 Current State:', { 
    viewMode, 
    platformCount: platforms.length,
  });

  useEffect(() => {
    console.log('🟢 useEffect MOUNT');
    logger.success('App.Init', 'Protocol OS application mounted', {
      commentary: COMMENTARY.SYSTEM_INIT,
    });
    return () => console.log('🔴 useEffect CLEANUP');
  }, []);

  // ============================================
  // PLATFORM HANDLERS
  // ============================================

  const handleAddPlatform = useCallback(() => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🖱️ handleAddPlatform() CALLED');
    console.log('═══════════════════════════════════════════════════════════');
    
    logger.info('Platform.Add.Start', 'Creating new platform', {
      commentary: COMMENTARY.PLATFORM_CREATED,
    });

    const newPlatform: Platform = {
      id: 'plat-' + Date.now().toString(),
      serial: generateSerial('PLAT'),
      name: 'Untitled Platform',
      url: '',
      description: '',
      doc_url: '',
      auth_notes: '',
      contributors: [],
      isMaster: false,
      isExpanded: true,
    };

    console.log('📦 New platform object:', newPlatform);

    setPlatforms(prev => {
      console.log('🔄 setPlatforms callback - adding platform');
      const updated = [...prev, newPlatform];
      console.log('   New platform count:', updated.length);
      return updated;
    });
  }, []);

  const handleUpdatePlatform = useCallback((platformId: string, updates: Partial<Platform>) => {
    console.log('🖱️ handleUpdatePlatform:', { platformId, updates });
    setPlatforms(prev => prev.map(p => p.id === platformId ? { ...p, ...updates } : p));
  }, []);

  const handleDeletePlatform = useCallback((platformId: string) => {
    console.log('🖱️ handleDeletePlatform:', platformId);
    setPlatforms(prev => prev.filter(p => p.id !== platformId));
  }, []);

  const handleTogglePlatform = useCallback((platformId: string) => {
    console.log('🖱️ handleTogglePlatform:', platformId);
    setPlatforms(prev => prev.map(p => p.id === platformId ? { ...p, isExpanded: !p.isExpanded } : p));
  }, []);

  // ============================================
  // RESOURCE HANDLERS
  // ============================================

  const handleAddResource = useCallback((platformId: string) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🖱️ handleAddResource() for platform:', platformId);
    console.log('═══════════════════════════════════════════════════════════');

    const newResource: ApiResource = {
      id: 'res-' + Date.now().toString(),
      serial: generateSerial('RES'),
      title: 'Untitled API Resource',
      url: '',
      description: '',
      doc_url: '',
      notes: '',
      handshakes: [],
      isExpanded: true,
    };

    console.log('📦 New resource:', newResource);

    setPlatforms(prev => prev.map(p => {
      if (p.id === platformId) {
        console.log('🔄 Adding resource to platform:', p.name);
        return { ...p, contributors: [...p.contributors, newResource] };
      }
      return p;
    }));
  }, []);

  const handleUpdateResource = useCallback((platformId: string, resourceId: string, updates: Partial<ApiResource>) => {
    console.log('🖱️ handleUpdateResource:', { resourceId, updates });
    setPlatforms(prev => prev.map(p => {
      if (p.id === platformId) {
        return { ...p, contributors: p.contributors.map(r => r.id === resourceId ? { ...r, ...updates } : r) };
      }
      return p;
    }));
  }, []);

  const handleDeleteResource = useCallback((platformId: string, resourceId: string) => {
    console.log('🖱️ handleDeleteResource:', { platformId, resourceId });
    setPlatforms(prev => prev.map(p => {
      if (p.id === platformId) {
        return { ...p, contributors: p.contributors.filter(r => r.id !== resourceId) };
      }
      return p;
    }));
  }, []);

  const handleToggleResource = useCallback((platformId: string, resourceId: string) => {
    console.log('🖱️ handleToggleResource:', { platformId, resourceId });
    setPlatforms(prev => prev.map(p => {
      if (p.id === platformId) {
        return { ...p, contributors: p.contributors.map(r => r.id === resourceId ? { ...r, isExpanded: !r.isExpanded } : r) };
      }
      return p;
    }));
  }, []);

  // ============================================
  // HANDSHAKE HANDLERS
  // ============================================

  const handleAddHandshake = useCallback((platformId: string, resourceId: string) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🖱️ handleAddHandshake()');
    console.log('   Platform:', platformId, 'Resource:', resourceId);
    console.log('═══════════════════════════════════════════════════════════');

    const newHandshake: Handshake = {
      id: 'hs-' + Date.now().toString(),
      serial: generateSerial('HS'),
      endpointName: 'New API Handshake',
      authentication: { type: 'Select an authentication type...' },
      status: 'unconfigured',
      isExpanded: true,
    };

    console.log('📦 New handshake:', newHandshake);

    setPlatforms(prev => prev.map(p => {
      if (p.id === platformId) {
        return {
          ...p,
          contributors: p.contributors.map(r => {
            if (r.id === resourceId) {
              console.log('🔄 Adding handshake to resource:', r.title);
              return { ...r, handshakes: [...r.handshakes, newHandshake] };
            }
            return r;
          }),
        };
      }
      return p;
    }));
  }, []);

  const handleUpdateHandshake = useCallback((platformId: string, resourceId: string, handshakeId: string, updates: Partial<Handshake>) => {
    console.log('🖱️ handleUpdateHandshake:', { handshakeId, updates });
    setPlatforms(prev => prev.map(p => {
      if (p.id === platformId) {
        return {
          ...p,
          contributors: p.contributors.map(r => {
            if (r.id === resourceId) {
              return { ...r, handshakes: r.handshakes.map(h => h.id === handshakeId ? { ...h, ...updates } : h) };
            }
            return r;
          }),
        };
      }
      return p;
    }));
  }, []);

  const handleDeleteHandshake = useCallback((platformId: string, resourceId: string, handshakeId: string) => {
    console.log('🖱️ handleDeleteHandshake:', { handshakeId });
    setPlatforms(prev => prev.map(p => {
      if (p.id === platformId) {
        return {
          ...p,
          contributors: p.contributors.map(r => {
            if (r.id === resourceId) {
              return { ...r, handshakes: r.handshakes.filter(h => h.id !== handshakeId) };
            }
            return r;
          }),
        };
      }
      return p;
    }));
  }, []);

  const handleToggleHandshake = useCallback((platformId: string, resourceId: string, handshakeId: string) => {
    console.log('🖱️ handleToggleHandshake:', { handshakeId });
    setPlatforms(prev => prev.map(p => {
      if (p.id === platformId) {
        return {
          ...p,
          contributors: p.contributors.map(r => {
            if (r.id === resourceId) {
              return { ...r, handshakes: r.handshakes.map(h => h.id === handshakeId ? { ...h, isExpanded: !h.isExpanded } : h) };
            }
            return r;
          }),
        };
      }
      return p;
    }));
  }, []);

  // ============================================
  // RENDER
  // ============================================

  console.log('🎨 RENDER: Building JSX with', platforms.length, 'platforms');

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-left">
          <h1 className="app__title">🤝 Protocol OS</h1>
          <span className="app__badge">v1.0.0</span>
        </div>
        <div className="app__header-center">
          <div className="app__view-toggle">
            {(['builder', 'library', 'split'] as ViewMode[]).map(mode => (
              <button key={mode} className={'app__view-btn' + (viewMode === mode ? ' app__view-btn--active' : '')}
                onClick={() => { console.log('🖱️ View:', mode); setViewMode(mode); }}>
                {mode === 'builder' ? '🔧 Builder' : mode === 'library' ? '📚 Library' : '⊞ Split'}
              </button>
            ))}
          </div>
        </div>
        <div className="app__header-right">
          <div className={'app__status app__status--' + systemStatus}>
            <span className="app__status-dot"></span>
            <span>System {systemStatus}</span>
          </div>
        </div>
      </header>

      <main className="app__main">
        <section className="app__panel">
          <div className="app__panel-header">
            <h2 className="app__panel-title"><span className="app__panel-title-icon">Δ</span> Platform → Resource → Handshake</h2>
            <button className="app__add-btn" onClick={() => { console.log('🖱️ RAW: +Platform'); handleAddPlatform(); }}>+ Add Platform</button>
          </div>
          
          <div className="app__tree">
            {platforms.length > 0 ? platforms.map(platform => (
              <div key={platform.id} className="platform-card">
                <div className="platform-card__header" onClick={() => { console.log('🖱️ Toggle platform'); handleTogglePlatform(platform.id); }}>
                  <span className="platform-card__icon">{platform.isMaster ? '🛡️' : '❓'}</span>
                  <span className="platform-card__name">{platform.name}</span>
                  <span className={'platform-card__badge platform-card__badge--' + (platform.isMaster ? 'master' : 'unconfirmed')}>{platform.isMaster ? 'MASTER' : 'UNCONFIRMED'}</span>
                  <span className="platform-card__serial">{platform.serial}</span>
                  <button className="platform-card__delete-btn" onClick={(e) => { e.stopPropagation(); console.log('🖱️ Delete platform'); handleDeletePlatform(platform.id); }}>✕</button>
                </div>
                
                {platform.isExpanded && (
                  <div className="platform-card__body">
                    <div className="form-group"><label>Platform Name</label><input type="text" value={platform.name} placeholder="e.g., Google Cloud" onChange={(e) => { console.log('📝 name:', e.target.value); handleUpdatePlatform(platform.id, { name: e.target.value }); }} /></div>
                    <div className="form-group"><label>Platform URL</label><input type="text" value={platform.url} placeholder="https://api.example.com" onChange={(e) => handleUpdatePlatform(platform.id, { url: e.target.value })} /></div>
                    <div className="form-group"><label>Description</label><textarea value={platform.description} placeholder="Describe this platform..." rows={2} onChange={(e) => handleUpdatePlatform(platform.id, { description: e.target.value })} /></div>
                    <div className="form-group"><label>Documentation URL</label><input type="text" value={platform.doc_url} placeholder="https://developer.example.com" onChange={(e) => handleUpdatePlatform(platform.id, { doc_url: e.target.value })} /></div>
                    <div className="form-group"><label>Auth Notes</label><textarea value={platform.auth_notes} placeholder="Authentication notes..." rows={2} onChange={(e) => handleUpdatePlatform(platform.id, { auth_notes: e.target.value })} /></div>
                    
                    <hr className="divider" />
                    
                    <div className="section-header"><h4>📦 API Resources</h4><button className="btn btn--add-small" onClick={() => { console.log('🖱️ +Resource'); handleAddResource(platform.id); }}>+ Add Resource</button></div>
                    
                    {platform.contributors.length > 0 ? platform.contributors.map(resource => (
                      <div key={resource.id} className="resource-card">
                        <div className="resource-card__header" onClick={() => { console.log('🖱️ Toggle resource'); handleToggleResource(platform.id, resource.id); }}>
                          <span className="resource-card__icon">📦</span>
                          <span className="resource-card__name">{resource.title}</span>
                          <span className="resource-card__serial">{resource.serial}</span>
                          <button className="resource-card__delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteResource(platform.id, resource.id); }}>✕</button>
                        </div>
                        
                        {resource.isExpanded && (
                          <div className="resource-card__body">
                            <div className="form-group"><label>Resource Title</label><input type="text" value={resource.title} placeholder="e.g., Get User" onChange={(e) => handleUpdateResource(platform.id, resource.id, { title: e.target.value })} /></div>
                            <div className="form-group"><label>API URL</label><input type="text" value={resource.url} placeholder="https://api.example.com/users" onChange={(e) => handleUpdateResource(platform.id, resource.id, { url: e.target.value })} /></div>
                            <div className="form-group"><label>Description</label><textarea value={resource.description} placeholder="Describe this resource..." rows={2} onChange={(e) => handleUpdateResource(platform.id, resource.id, { description: e.target.value })} /></div>
                            <div className="form-group"><label>Doc URL</label><input type="text" value={resource.doc_url} onChange={(e) => handleUpdateResource(platform.id, resource.id, { doc_url: e.target.value })} /></div>
                            <div className="form-group"><label>Notes</label><textarea value={resource.notes} rows={2} onChange={(e) => handleUpdateResource(platform.id, resource.id, { notes: e.target.value })} /></div>
                            
                            <hr className="divider" />
                            
                            <div className="section-header"><h4>🤝 Handshakes</h4><button className="btn btn--add-small" onClick={() => { console.log('🖱️ +Handshake'); handleAddHandshake(platform.id, resource.id); }}>+ Add Handshake</button></div>
                            
                            {resource.handshakes.length > 0 ? resource.handshakes.map(handshake => (
                              <div key={handshake.id} className="handshake-card">
                                <div className="handshake-card__header" onClick={() => { console.log('🖱️ Toggle handshake'); handleToggleHandshake(platform.id, resource.id, handshake.id); }}>
                                  <span className="handshake-card__icon">🤝</span>
                                  <span className="handshake-card__name">{handshake.endpointName}</span>
                                  <span className={'handshake-card__status handshake-card__status--' + handshake.status}>{handshake.status}</span>
                                  <span className="handshake-card__serial">{handshake.serial}</span>
                                  <button className="handshake-card__delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteHandshake(platform.id, resource.id, handshake.id); }}>✕</button>
                                </div>
                                
                                {handshake.isExpanded && (
                                  <div className="handshake-card__body">
                                    <div className="form-group"><label>Endpoint Name</label><input type="text" value={handshake.endpointName} onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { endpointName: e.target.value })} /></div>
                                    <div className="form-group">
                                      <label>Authentication Type</label>
                                      <select value={handshake.authentication.type} onChange={(e) => { console.log('📝 auth:', e.target.value); handleUpdateHandshake(platform.id, resource.id, handshake.id, { authentication: { type: e.target.value }, status: e.target.value === AUTH_TYPES[0] ? 'unconfigured' : 'awaiting_auth' }); }}>
                                        {AUTH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                    </div>
                                    
                                    {handshake.authentication.type === 'API Key / Basic Auth' && (
                                      <div className="auth-fields">
                                        <div className="form-group"><label>API Key</label><input type="password" placeholder="Your API key" onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { authentication: { ...handshake.authentication, apiKey: e.target.value } })} /></div>
                                        <div className="form-group"><label>Header Name</label><input type="text" defaultValue="Authorization" onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { authentication: { ...handshake.authentication, headerName: e.target.value } })} /></div>
                                      </div>
                                    )}
                                    
                                    {handshake.authentication.type === 'OAuth 2.0 (PKCE)' && (
                                      <div className="auth-fields">
                                        <div className="form-group"><label>Auth URL</label><input type="text" placeholder="https://provider.com/oauth/authorize" onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { authentication: { ...handshake.authentication, authUrl: e.target.value } })} /></div>
                                        <div className="form-group"><label>Token URL</label><input type="text" placeholder="https://provider.com/oauth/token" onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { authentication: { ...handshake.authentication, tokenUrl: e.target.value } })} /></div>
                                        <div className="form-group"><label>Client ID</label><input type="text" onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { authentication: { ...handshake.authentication, clientId: e.target.value } })} /></div>
                                        <div className="form-group"><label>Redirect URI</label><input type="text" onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { authentication: { ...handshake.authentication, redirectUri: e.target.value } })} /></div>
                                        <div className="form-group"><label>Scopes</label><input type="text" placeholder="openid profile email" onChange={(e) => handleUpdateHandshake(platform.id, resource.id, handshake.id, { authentication: { ...handshake.authentication, scopes: e.target.value } })} /></div>
                                      </div>
                                    )}
                                    
                                    <div className="handshake-card__actions">
                                      <button className="btn btn--execute" onClick={() => { console.log('🖱️ Execute'); alert('Execute coming soon!'); }}>🚀 Execute</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )) : <div className="empty-state--small"><p>No handshakes. Add one to configure authentication.</p></div>}
                          </div>
                        )}
                      </div>
                    )) : <div className="empty-state--small"><p>No resources. Add one to configure API endpoints.</p></div>}
                    
                    <div className="platform-card__actions">
                      {!platform.isMaster && <button className="btn btn--confirm" onClick={() => { console.log('🖱️ Confirm Master'); handleUpdatePlatform(platform.id, { isMaster: true }); }}>✓ Confirm Master</button>}
                      <button className="btn btn--save" onClick={() => { console.log('🖱️ Save'); alert('LocalStorage save coming soon!'); }}>💾 Save</button>
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="app__empty">
                <div className="app__empty-icon">🚀</div>
                <div className="app__empty-title">Welcome to Protocol OS</div>
                <div className="app__empty-message">Universal API Handshake System</div>
                <div className="app__empty-features">
                  <div className="feature">✅ Platform → Resource → Handshake</div>
                  <div className="feature">✅ 6 Auth Types</div>
                  <div className="feature">✅ Serial Tracking</div>
                </div>
                <button className="app__empty-btn" onClick={() => { console.log('🖱️ Create First'); handleAddPlatform(); }}>Create Your First Platform</button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="app__footer">
        <span className="app__footer-status">✓ Ready</span>
        <span>{platforms.length} plat · {platforms.reduce((s,p)=>s+p.contributors.length,0)} res · {platforms.reduce((s,p)=>s+p.contributors.reduce((x,r)=>x+r.handshakes.length,0),0)} hs</span>
        <span className="app__footer-brand">ITT Architecture</span>
      </footer>
    </div>
  );
};

export default App;
