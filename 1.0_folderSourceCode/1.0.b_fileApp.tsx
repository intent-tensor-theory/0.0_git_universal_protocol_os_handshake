// ============================================
// PROTOCOL OS - MAIN APPLICATION COMPONENT
// ============================================
// Address: 1.0.b
// Purpose: Root Application Component and Layout
// ============================================

import React, { useState } from 'react';
import './app.css';

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

  const handleAddPlatform = () => {
    const newPlatform: Platform = {
      id: 'plat-' + Date.now().toString(),
      name: 'New Platform',
      edition: 'free',
      status: 'active',
      isExpanded: true,
    };
    setPlatforms(prev => [...prev, newPlatform]);
  };

  const handleDeletePlatform = (id: string) => {
    setPlatforms(prev => prev.filter(p => p.id !== id));
  };

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
              onClick={() => setViewMode('builder')}
            >
              🔧 Builder
            </button>
            <button
              className={'app__view-btn' + (viewMode === 'library' ? ' app__view-btn--active' : '')}
              onClick={() => setViewMode('library')}
            >
              📚 Library
            </button>
            <button
              className={'app__view-btn' + (viewMode === 'split' ? ' app__view-btn--active' : '')}
              onClick={() => setViewMode('split')}
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
            {platforms.length} platforms · 247 source files · 26 build phases
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
