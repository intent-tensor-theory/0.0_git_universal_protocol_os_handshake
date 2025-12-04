// ============================================
// PROTOCOL OS - MAIN APPLICATION COMPONENT
// ============================================
// Address: 1.0.b
// Purpose: Root Application Component and Layout
// ============================================

import React, { useState, useEffect } from 'react';
import './app.css';
import { logger, COMMENTARY } from './1.8_folderSharedUtilities/1.8.g_fileSystemLogger';

// ============================================
// TYPES
// ============================================

type ViewMode = 'builder' | 'library' | 'split';

interface Platform {
  id: string;
  name: string;
  edition: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive';
  isExpanded?: boolean;
}

// ============================================
// MAIN APP COMPONENT
// ============================================

const App: React.FC = () => {
  // ============================================
  // STATE - Log every state initialization
  // ============================================
  
  console.log('🔴 APP COMPONENT FUNCTION EXECUTING - This runs on every render');
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    console.log('🟡 useState(viewMode) initializer running - setting to "builder"');
    return 'builder';
  });
  
  const [platforms, setPlatforms] = useState<Platform[]>(() => {
    console.log('🟡 useState(platforms) initializer running - setting to empty array');
    return [];
  });
  
  const [systemStatus] = useState<'healthy' | 'loading' | 'error'>(() => {
    console.log('🟡 useState(systemStatus) initializer running - setting to "healthy"');
    return 'healthy';
  });

  console.log('🔵 Current State:', { viewMode, platformCount: platforms.length, systemStatus });

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    console.log('🟢 useEffect MOUNT - App component mounted to DOM');
    logger.success('App.Init', 'Protocol OS application mounted', {
      commentary: COMMENTARY.SYSTEM_INIT,
      data: { viewMode, platformCount: platforms.length },
    });

    return () => {
      console.log('🔴 useEffect CLEANUP - App component unmounting');
      logger.info('App.Unmount', 'Application unmounting', {
        commentary: COMMENTARY.SYSTEM_SHUTDOWN,
      });
    };
  }, []);

  // ============================================
  // CLICK HANDLERS - Exhaustive Logging
  // ============================================

  const handleAddPlatform = () => {
    // FIRST THING: Log that click was received
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🖱️ CLICK DETECTED: handleAddPlatform() function called');
    console.log('═══════════════════════════════════════════════════════════');
    
    logger.info('Click.Detected', 'Add Platform button was clicked', {
      commentary: 'The onClick event fired and reached the handler function',
      data: { timestamp: Date.now(), currentPlatformCount: platforms.length },
    });

    try {
      console.log('📦 Creating new platform object...');
      
      const newPlatform: Platform = {
        id: 'plat-' + Date.now().toString(),
        name: 'New Platform',
        edition: 'free',
        status: 'active',
        isExpanded: true,
      };
      
      console.log('✅ Platform object created:', newPlatform);
      logger.debug('Platform.ObjectCreated', 'New platform object instantiated', {
        commentary: 'Platform object created in memory, not yet added to state',
        data: newPlatform,
      });

      console.log('📤 Calling setPlatforms to update React state...');
      
      setPlatforms(prev => {
        console.log('🔄 Inside setPlatforms callback');
        console.log('   Previous platforms:', prev);
        
        const updated = [...prev, newPlatform];
        
        console.log('   New platforms array:', updated);
        console.log('   New count:', updated.length);
        
        logger.success('Platform.StateUpdated', 'React state updated with new platform', {
          commentary: COMMENTARY.PLATFORM_CREATED,
          data: { 
            platformId: newPlatform.id, 
            previousCount: prev.length,
            newCount: updated.length,
          },
        });
        
        return updated;
      });

      console.log('✅ setPlatforms call completed (state update is async)');
      logger.success('Platform.Add', 'Add platform operation completed', {
        commentary: 'The handler finished executing. React will re-render with new state.',
      });
      
    } catch (error) {
      console.error('❌ ERROR in handleAddPlatform:', error);
      logger.error('Platform.Add.Error', 'Failed to add platform', {
        commentary: 'An exception was thrown during platform creation',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🏁 handleAddPlatform() function complete');
    console.log('═══════════════════════════════════════════════════════════');
  };

  const handleDeletePlatform = (id: string) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🖱️ CLICK DETECTED: handleDeletePlatform() called with id:', id);
    console.log('═══════════════════════════════════════════════════════════');
    
    logger.info('Click.Detected', 'Delete Platform button was clicked', {
      commentary: 'Delete click received for platform',
      data: { platformId: id },
    });

    try {
      const platformToDelete = platforms.find(p => p.id === id);
      console.log('🔍 Found platform to delete:', platformToDelete);
      
      if (!platformToDelete) {
        console.warn('⚠️ Platform not found with id:', id);
        logger.warn('Platform.Delete.NotFound', `Platform not found: ${id}`, {
          commentary: 'Attempted to delete a platform that does not exist in state',
          data: { searchedId: id, availableIds: platforms.map(p => p.id) },
        });
        return;
      }

      console.log('📤 Calling setPlatforms to remove platform...');
      
      setPlatforms(prev => {
        console.log('🔄 Inside setPlatforms callback for delete');
        const updated = prev.filter(p => p.id !== id);
        console.log('   Filtered platforms:', updated);
        
        logger.success('Platform.Delete', `Platform deleted`, {
          commentary: COMMENTARY.PLATFORM_DELETED,
          data: { deletedId: id, remainingCount: updated.length },
        });
        
        return updated;
      });
      
    } catch (error) {
      console.error('❌ ERROR in handleDeletePlatform:', error);
      logger.error('Platform.Delete.Error', 'Failed to delete platform', {
        commentary: 'An exception was thrown during platform deletion',
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  };

  const handleViewModeChange = (newMode: ViewMode) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🖱️ CLICK DETECTED: handleViewModeChange() called');
    console.log('   Current mode:', viewMode);
    console.log('   New mode:', newMode);
    console.log('═══════════════════════════════════════════════════════════');
    
    logger.info('Click.Detected', 'View mode button clicked', {
      commentary: 'View mode toggle clicked',
      data: { from: viewMode, to: newMode },
    });

    try {
      setViewMode(newMode);
      console.log('✅ setViewMode called with:', newMode);
      
      logger.success('View.Changed', `View mode changed to ${newMode}`, {
        commentary: 'View modes control the layout: Builder for editing, Library for browsing saved handshakes, Split for both',
      });
      
    } catch (error) {
      console.error('❌ ERROR in handleViewModeChange:', error);
      logger.error('View.Change.Error', 'Failed to change view mode', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  };

  const handleAddResource = (platformId: string) => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🖱️ CLICK DETECTED: handleAddResource() called');
    console.log('   Platform ID:', platformId);
    console.log('═══════════════════════════════════════════════════════════');
    
    logger.info('Click.Detected', 'Add Resource button clicked', {
      commentary: 'Resource addition requested for platform',
      data: { platformId },
    });
    
    // TODO: Implement resource addition
    console.log('⚠️ handleAddResource not yet implemented');
    logger.warn('Resource.Add.NotImplemented', 'Resource addition not yet implemented', {
      commentary: 'This feature is part of the next development phase',
    });
  };

  // ============================================
  // RENDER - Log render cycle
  // ============================================
  
  console.log('🎨 RENDER: Building JSX with current state');
  console.log('   Platforms to render:', platforms.length);

  return (
    <div className="app">
      {/* Header */}
      <header className="app__header">
        <div className="app__header-left">
          <h1 className="app__title">
            <span className="app__title-icon">🤝</span>
            Protocol OS
          </h1>
          <span className="app__badge">v1.0.0</span>
        </div>
        
        <div className="app__header-center">
          <div className="app__view-toggle">
            <button
              className={'app__view-btn' + (viewMode === 'builder' ? ' app__view-btn--active' : '')}
              onClick={() => {
                console.log('🖱️ RAW CLICK: Builder button onClick fired');
                handleViewModeChange('builder');
              }}
            >
              🔧 Builder
            </button>
            <button
              className={'app__view-btn' + (viewMode === 'library' ? ' app__view-btn--active' : '')}
              onClick={() => {
                console.log('🖱️ RAW CLICK: Library button onClick fired');
                handleViewModeChange('library');
              }}
            >
              📚 Library
            </button>
            <button
              className={'app__view-btn' + (viewMode === 'split' ? ' app__view-btn--active' : '')}
              onClick={() => {
                console.log('🖱️ RAW CLICK: Split button onClick fired');
                handleViewModeChange('split');
              }}
            >
              ⊞ Split
            </button>
          </div>
        </div>
        
        <div className="app__header-right">
          <div className={'app__status app__status--' + systemStatus}>
            <span className="app__status-dot"></span>
            <span className="app__status-text">System {systemStatus}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app__main">
        <section className="app__panel">
          <div className="app__panel-header">
            <h2 className="app__panel-title">
              <span className="app__panel-title-icon">Δ</span>
              Platform → Resource → Handshake
            </h2>
            <button 
              className="app__add-btn" 
              onClick={() => {
                console.log('🖱️ RAW CLICK: Add Platform button onClick fired');
                handleAddPlatform();
              }}
            >
              + Add Platform
            </button>
          </div>
          
          <div className="app__tree">
            {platforms.length > 0 ? (
              <>
                {console.log('🎨 RENDER: Rendering', platforms.length, 'platform cards')}
                {platforms.map((platform, index) => {
                  console.log(`🎨 RENDER: Rendering platform card ${index}:`, platform.id);
                  return (
                    <div key={platform.id} className="platform-card">
                      <div className="platform-card__header">
                        <span className="platform-card__icon">🌐</span>
                        <span className="platform-card__name">{platform.name}</span>
                        <span className={'platform-card__badge platform-card__badge--' + platform.edition}>
                          {platform.edition}
                        </span>
                        <button 
                          className="platform-card__delete-btn"
                          onClick={() => {
                            console.log('🖱️ RAW CLICK: Delete button onClick fired for:', platform.id);
                            handleDeletePlatform(platform.id);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="platform-card__body">
                        <p>Add resources and handshakes to this platform</p>
                        <button 
                          className="platform-card__btn"
                          onClick={() => {
                            console.log('🖱️ RAW CLICK: Add Resource button onClick fired for:', platform.id);
                            handleAddResource(platform.id);
                          }}
                        >
                          + Add Resource
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {console.log('🎨 RENDER: Rendering empty state (no platforms)')}
                <div className="app__empty">
                  <div className="app__empty-icon">🚀</div>
                  <div className="app__empty-title">Welcome to Protocol OS</div>
                  <div className="app__empty-message">
                    Universal API Handshake System with Intent Tensor Theory Architecture
                  </div>
                  <div className="app__empty-features">
                    <div className="feature">✅ 11 Protocol Handlers</div>
                    <div className="feature">✅ 5 Database Providers</div>
                    <div className="feature">✅ State Management with Undo/Redo</div>
                    <div className="feature">✅ Versioned Handshake Library</div>
                    <div className="feature">✅ ITT-based Δ₁→Δ₆ Execution Flow</div>
                  </div>
                  <button 
                    className="app__empty-btn" 
                    onClick={() => {
                      console.log('🖱️ RAW CLICK: Create First Platform button onClick fired');
                      handleAddPlatform();
                    }}
                  >
                    Create Your First Platform
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app__footer">
        <div className="app__footer-left">
          <span className="app__footer-status">✓ Ready</span>
        </div>
        <div className="app__footer-center">
          <span className="app__footer-stats">
            {platforms.length} platforms · 251 source files · 26 build phases
          </span>
        </div>
        <div className="app__footer-right">
          <span className="app__footer-brand">
            Intent Tensor Theory Architecture
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
