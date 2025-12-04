// ============================================
// PROTOCOL OS - MAIN APPLICATION COMPONENT
// ============================================
// Address: 1.0.b
// Mirrors: Grandfather Code Structure EXACTLY
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import './app.css';
import { logger, COMMENTARY } from './1.8_folderSharedUtilities/1.8.g_fileSystemLogger';
import { ReadmeHelpModal } from './1.7_folderSharedUserInterfaceComponents/1.7.8_folderReadmeHelpModal/1.7.8.a_fileReadmeHelpModalComponent';
import { 
  initializeDatabase, 
  getActiveProvider, 
  isDatabaseInitialized,
  getActiveProviderType 
} from './1.2_folderDatabasePersistence/1.2.c_fileActiveDatabaseProviderToggle';

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
  
  // README Help Modal state
  const [helpModalSection, setHelpModalSection] = useState<1 | 2 | 3 | 4 | null>(null);
  const [helpModalAuthType, setHelpModalAuthType] = useState<string>('');
  
  // Database connection state
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

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
    
    // Initialize database on mount
    const initDb = async () => {
      try {
        console.log('🗄️ Initializing database...');
        const result = await initializeDatabase();
        
        if (result.success) {
          setDbReady(true);
          const providerType = getActiveProviderType();
          console.log(`✅ Database ready: ${providerType}`);
          logger.success('Database.Init', `Connected to ${providerType} provider`, {
            commentary: COMMENTARY.SYSTEM_INIT
          });
          
          // Load saved platforms from database
          if (isDatabaseInitialized()) {
            try {
              const db = getActiveProvider();
              const platformsResult = await db.getAllPlatforms();
              
              if (platformsResult.success && platformsResult.data) {
                // Separate active and archived platforms
                const active = platformsResult.data.filter((p: Platform) => !p.isMaster);
                const archived = platformsResult.data.filter((p: Platform) => p.isMaster);
                
                // Add UI state (isExpanded) that isn't persisted
                setSavedActivePlatforms(active.map((p: Platform) => ({ ...p, isExpanded: false })));
                setArchivedPlatforms(archived.map((p: Platform) => ({ ...p, isExpanded: false })));
                
                console.log(`📦 Loaded ${active.length} active, ${archived.length} archived platforms`);
                logger.info('Database.Load', `Loaded ${platformsResult.data.length} platforms`, {
                  active: active.length,
                  archived: archived.length
                });
              }
            } catch (loadError) {
              console.warn('⚠️ Could not load platforms:', loadError);
            }
          }
        } else {
          setDbError(result.error || 'Unknown database error');
          console.warn('⚠️ Database init failed:', result.error);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setDbError(errorMsg);
        console.error('❌ Database error:', err);
      }
    };
    
    initDb();
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

  // HELPER: Collapse all containers in a platform
  const collapsePlatform = (platform: Platform): Platform => ({
    ...platform,
    isExpanded: false,
    contributors: platform.contributors.map(r => ({
      ...r,
      isExpanded: false,
      handshakes: r.handshakes.map(h => ({ ...h, isExpanded: false }))
    }))
  });

  // SAVE WORKING PLATFORM TO SAVED ACTIVE
  const handleSaveWorkingPlatform = useCallback(async () => {
    if (!workingPlatform) return;
    console.log('💾 Save to Active:', workingPlatform.serial);
    
    const platformToSave = collapsePlatform({ ...workingPlatform, isMaster: false });
    
    // Persist to database if ready
    if (dbReady && isDatabaseInitialized()) {
      try {
        const db = getActiveProvider();
        // Remove UI-only fields before saving
        const { isExpanded, ...persistData } = platformToSave;
        const result = await db.createPlatform(persistData as any);
        
        if (result.success) {
          console.log('✅ Persisted to database:', workingPlatform.serial);
          logger.success('Database.Save', `Saved active platform ${workingPlatform.serial}`, {
            id: workingPlatform.id,
            commentary: COMMENTARY.USER_ACTION
          });
        } else {
          console.warn('⚠️ Database save failed:', result.error);
        }
      } catch (err) {
        console.error('❌ Database save error:', err);
      }
    }
    
    setSavedActivePlatforms(prev => [...prev, platformToSave]);
    setWorkingPlatform(null); // Clear form for next
  }, [workingPlatform, dbReady]);

  // SAVE WORKING PLATFORM DIRECTLY TO ARCHIVE
  const handleSaveToArchive = useCallback(async () => {
    if (!workingPlatform) return;
    console.log('💾 Save to Archive:', workingPlatform.serial);
    
    const platformToSave = collapsePlatform({ ...workingPlatform, isMaster: true });
    
    // Persist to database if ready
    if (dbReady && isDatabaseInitialized()) {
      try {
        const db = getActiveProvider();
        // Remove UI-only fields before saving
        const { isExpanded, ...persistData } = platformToSave;
        const result = await db.createPlatform(persistData as any);
        
        if (result.success) {
          console.log('✅ Persisted to database:', workingPlatform.serial);
          logger.success('Database.Save', `Saved archived platform ${workingPlatform.serial}`, {
            id: workingPlatform.id,
            commentary: COMMENTARY.USER_ACTION
          });
        } else {
          console.warn('⚠️ Database save failed:', result.error);
        }
      } catch (err) {
        console.error('❌ Database save error:', err);
      }
    }
    
    setArchivedPlatforms(prev => [...prev, platformToSave]);
    setWorkingPlatform(null); // Clear form for next
  }, [workingPlatform, dbReady]);

  // TRANSFER FROM ARCHIVE TO ACTIVE
  const handleTransferToActive = useCallback((platformId: string) => {
    const platform = archivedPlatforms.find(p => p.id === platformId);
    if (platform) {
      console.log('↔️ Transfer to Active:', platform.serial);
      setSavedActivePlatforms(prev => [...prev, { ...platform, id: 'plat-' + Date.now() }]);
      setArchivedPlatforms(prev => prev.filter(p => p.id !== platformId));
    }
  }, [archivedPlatforms]);

  // TRANSFER FROM ACTIVE TO ARCHIVE
  const handleTransferToArchive = useCallback((platformId: string) => {
    const platform = savedActivePlatforms.find(p => p.id === platformId);
    if (platform) {
      console.log('↔️ Transfer to Archive:', platform.serial);
      setArchivedPlatforms(prev => [...prev, { ...platform, id: 'arch-' + Date.now() }]);
      setSavedActivePlatforms(prev => prev.filter(p => p.id !== platformId));
    }
  }, [savedActivePlatforms]);

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
  const renderPlatform = (platform: Platform, context: 'working' | 'active' | 'archive' = 'working') => {
    const fullSerial = platform.serial;
    return (
      <details key={platform.id} className="platform-section" open={platform.isExpanded} data-id={platform.id}>
        <summary className="accordion-summary" onClick={(e) => { e.preventDefault(); toggle(platform.id); }}>
          <span className={platform.isMaster ? 'badge-master' : 'badge-unconfirmed'}>{platform.isMaster ? '🛡️' : '❓'}</span>
          <div className="accordion-title-container">
            <span className="accordion-title">{platform.name || 'Untitled Platform'}</span>
          </div>
          <div className="accordion-right">
            <span className="accordion-serial">{fullSerial}</span>
            {context === 'active' && (
              <button className="btn-transfer-mini btn-transfer-mini--amber" onClick={(e) => { e.stopPropagation(); handleTransferToArchive(platform.id); }} title="Transfer to Archive">
                → Archive
              </button>
            )}
            {context === 'archive' && (
              <button className="btn-transfer-mini btn-transfer-mini--teal" onClick={(e) => { e.stopPropagation(); handleTransferToActive(platform.id); }} title="Transfer to Active">
                → Active
              </button>
            )}
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
                <button className="btn-icon btn-icon--danger" onClick={() => handleDeletePlatform(platform.id)} title="Delete">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                  </svg>
                </button>
              </div>
              <div className="platform-actions-right">
                {workingPlatform?.id === platform.id && (
                  <>
                    <button className="btn-icon btn-icon--green" onClick={handleSaveWorkingPlatform} title="Save to Active">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a3 3 0 110-6 3 3 0 010 6zm3-10H7V5h8v4z"/>
                      </svg>
                    </button>
                    <button className="btn-icon btn-icon--amber" onClick={handleSaveToArchive} title="Save to Archive">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a3 3 0 110-6 3 3 0 010 6zm3-10H7V5h8v4z"/>
                      </svg>
                    </button>
                  </>
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
            <h4 
              className="handshake-step-header handshake-step-header--clickable" 
              onClick={() => setHelpModalSection(1)}
              title="Click for help"
            >
              <span className="step-number">1</span> Protocol Channel <span className="help-icon">?</span>
            </h4>
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
            <h4 
              className="handshake-step-header handshake-step-header--clickable" 
              onClick={() => {
                setHelpModalAuthType(handshake.authentication.type as string);
                setHelpModalSection(2);
              }}
              title="Click for help"
            >
              <span className="step-number">2</span> Channel Configuration <span className="help-icon">?</span>
            </h4>
            <CredentialsForm authType={handshake.authentication.type as string} />

            {/* SECTION 3: Request Input */}
            <h4 
              className="handshake-step-header handshake-step-header--clickable" 
              onClick={() => setHelpModalSection(3)}
              title="Click for help"
            >
              <span className="step-number">3</span> Request Input <span className="help-icon">?</span>
            </h4>
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
            <h4 
              className="handshake-step-header handshake-step-header--clickable" 
              onClick={() => setHelpModalSection(4)}
              title="Click for help"
            >
              <span className="step-number">4</span> Execution & Output <span className="help-icon">?</span>
            </h4>
            <div className="form-group">
              <label><span className="input-label">4.a</span> Execute</label>
              <button 
                className="btn btn--execute"
                onClick={() => {
                  console.log('🚀 EXECUTE CLICKED:', {
                    handshakeId: handshake.id,
                    handshakeSerial: handshake.serial,
                    endpointName: handshake.endpointName,
                    authType: handshake.authentication.type,
                    timestamp: new Date().toISOString()
                  });
                  logger.info('Execute.Click', `Executing handshake ${handshake.serial}`, {
                    handshakeId: handshake.id,
                    authType: handshake.authentication.type,
                    commentary: COMMENTARY.USER_ACTION
                  });
                  // TODO: Wire to protocol executor based on handshake.authentication.type
                }}
              >
                🚀 EXECUTE REQUEST
              </button>
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
          <span className="archive-count">{archivedPlatforms.length} archived</span>
        </div>
        <div className="archived-platforms-container">
          {archivedPlatforms.length === 0 ? (
            <p className="empty-text">No archived platforms. Save a platform with the amber disk to archive it.</p>
          ) : (
            archivedPlatforms.map(p => renderPlatform(p, 'archive'))
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
              <p className="empty-text">No saved active platforms. Fill out the form below and save with the green disk.</p>
            ) : (
              savedActivePlatforms.map(p => renderPlatform(p, 'active'))
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
        <span className={`db-status ${dbReady ? 'db-status--connected' : 'db-status--disconnected'}`}>
          {dbReady ? `🗄️ ${getActiveProviderType()}` : dbError ? `❌ ${dbError}` : '⏳ Connecting...'}
        </span>
      </footer>

      {/* README Help Modal - fetches documentation from respective departments */}
      <ReadmeHelpModal
        isOpen={helpModalSection !== null}
        onClose={() => setHelpModalSection(null)}
        section={helpModalSection || 1}
        authType={helpModalAuthType}
      />
    </div>
  );
};

export default App;
