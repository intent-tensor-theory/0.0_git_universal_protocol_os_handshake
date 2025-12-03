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
  const [viewMode, setViewMode] = useState<ViewMode>('builder');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [systemStatus] = useState<'healthy' | 'loading' | 'error'>('healthy');

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    logger.success('App.Init', 'Protocol OS application mounted', {
      commentary: COMMENTARY.SYSTEM_INIT,
      data: { viewMode, platformCount: platforms.length },
    });

    // Cleanup on unmount
    return () => {
      logger.info('App.Unmount', 'Application unmounting', {
        commentary: COMMENTARY.SYSTEM_SHUTDOWN,
      });
    };
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleAddPlatform = () => {
    logger.group('Platform.Add');
    
    const result = logger.catch('Platform.Create', () => {
      const newPlatform: Platform = {
        id: 'plat-' + Date.now().toString(),
        name: 'New Platform',
        edition: 'free',
        status: 'active',
        isExpanded: true,
      };
      
      logger.debug('Platform.Generate', 'Platform object created', {
        commentary: 'Generating unique ID using timestamp for platform identification',
        data: newPlatform,
      });
      
      return newPlatform;
    }, {
      commentary: 'Attempting to create new platform object',
    });

    if (result) {
      setPlatforms(prev => {
        const updated = [...prev, result];
        logger.success('Platform.Add', `Platform "${result.name}" added successfully`, {
          commentary: COMMENTARY.PLATFORM_CREATED,
          data: { 
            platformId: result.id, 
            totalPlatforms: updated.length 
          },
        });
        return updated;
      });
    }
    
    logger.groupEnd();
  };

  const handleDeletePlatform = (id: string) => {
    logger.group('Platform.Delete');
    
    const platformToDelete = platforms.find(p => p.id === id);
    
    if (!platformToDelete) {
      logger.warn('Platform.Delete', `Platform not found: ${id}`, {
        commentary: 'Attempted to delete a platform that does not exist in state',
        data: { searchedId: id, availableIds: platforms.map(p => p.id) },
      });
      logger.groupEnd();
      return;
    }

    logger.info('Platform.Delete', `Deleting platform: ${platformToDelete.name}`, {
      commentary: 'Initiating platform deletion - this will remove the platform from state',
      data: platformToDelete,
    });

    setPlatforms(prev => {
      const updated = prev.filter(p => p.id !== id);
      logger.success('Platform.Delete', `Platform "${platformToDelete.name}" deleted`, {
        commentary: COMMENTARY.PLATFORM_DELETED,
        data: { 
          deletedId: id, 
          remainingPlatforms: updated.length 
        },
      });
      return updated;
    });
    
    logger.groupEnd();
  };

  const handleViewModeChange = (newMode: ViewMode) => {
    logger.info('View.Change', `Switching view mode: ${viewMode} → ${newMode}`, {
      commentary: 'View modes control the layout: Builder for editing, Library for browsing saved handshakes, Split for both',
      data: { from: viewMode, to: newMode },
    });
    setViewMode(newMode);
  };

  // ============================================
  // RENDER
  // ============================================

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
              onClick={() => handleViewModeChange('builder')}
            >
              🔧 Builder
            </button>
            <button
              className={'app__view-btn' + (viewMode === 'library' ? ' app__view-btn--active' : '')}
              onClick={() => handleViewModeChange('library')}
            >
              📚 Library
            </button>
            <button
              className={'app__view-btn' + (viewMode === 'split' ? ' app__view-btn--active' : '')}
              onClick={() => handleViewModeChange('split')}
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
            <button className="app__add-btn" onClick={handleAddPlatform}>
              + Add Platform
            </button>
          </div>
          
          <div className="app__tree">
            {platforms.length > 0 ? (
              platforms.map(platform => (
                <div key={platform.id} className="platform-card">
                  <div className="platform-card__header">
                    <span className="platform-card__icon">🌐</span>
                    <span className="platform-card__name">{platform.name}</span>
                    <span className={'platform-card__badge platform-card__badge--' + platform.edition}>
                      {platform.edition}
                    </span>
                    <button 
                      className="platform-card__delete-btn"
                      onClick={() => handleDeletePlatform(platform.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="platform-card__body">
                    <p>Add resources and handshakes to this platform</p>
                    <button className="platform-card__btn">+ Add Resource</button>
                  </div>
                </div>
              ))
            ) : (
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
                <button className="app__empty-btn" onClick={handleAddPlatform}>
                  Create Your First Platform
                </button>
              </div>
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
            {platforms.length} platforms · 250 source files · 26 build phases
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
