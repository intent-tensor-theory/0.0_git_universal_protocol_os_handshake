// ============================================
// PROTOCOL OS - MAIN APPLICATION COMPONENT
// ============================================
// Address: 1.0.b
// Purpose: Root Application Component and Layout
// ============================================

/**
 * Protocol OS Application
 * 
 * The root component that orchestrates the Universal API
 * Handshake System. Implements Intent Tensor Theory's
 * recursive hierarchy:
 * 
 * Δ₁ Platforms  → Service providers (Google, Stripe, etc.)
 * Δ₂ Resources  → API endpoints within platforms
 * Δ₃ Handshakes → Authentication/request configurations
 * Δ₄ Execution  → Request execution and response handling
 * Δ₅ Validation → Response validation and processing
 * Δ₆ Collapse   → State persistence and completion
 */

import React, { useState } from 'react';

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
      id: `plat-${Date.now()}`,
      name: 'New Platform',
      edition: 'free',
      status: 'active',
      isExpanded: true,
    };
    setPlatforms([...platforms, newPlatform]);
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
              className={`app__view-btn ${viewMode === 'builder' ? 'app__view-btn--active' : ''}`}
              onClick={() => setViewMode('builder')}
            >
              🔧 Builder
            </button>
            <button
              className={`app__view-btn ${viewMode === 'library' ? 'app__view-btn--active' : ''}`}
              onClick={() => setViewMode('library')}
            >
              📚 Library
            </button>
            <button
              className={`app__view-btn ${viewMode === 'split' ? 'app__view-btn--active' : ''}`}
              onClick={() => setViewMode('split')}
            >
              ⊞ Split
            </button>
          </div>
        </div>
        
        <div className="app__header-right">
          <div className={`app__status app__status--${systemStatus}`}>
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
                    <span className={`platform-card__badge platform-card__badge--${platform.edition}`}>
                      {platform.edition}
                    </span>
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
            {platforms.length} platforms · 245 source files · 26 build phases
          </span>
        </div>
        <div className="app__footer-right">
          <span className="app__footer-brand">
            Intent Tensor Theory Architecture
          </span>
        </div>
      </footer>

      {/* Styles */}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          color: #f1f5f9;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .app__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .app__header-left,
        .app__header-center,
        .app__header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .app__title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .app__badge {
          padding: 0.25rem 0.5rem;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: #60a5fa;
        }

        .app__view-toggle {
          display: flex;
          gap: 0.25rem;
          padding: 0.25rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 0.5rem;
        }

        .app__view-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          border-radius: 0.375rem;
          color: #94a3b8;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .app__view-btn:hover {
          color: #f1f5f9;
        }

        .app__view-btn--active {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .app__status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 0.5rem;
        }

        .app__status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 2s infinite;
        }

        .app__status--error .app__status-dot {
          background: #ef4444;
        }

        .app__status--loading .app__status-dot {
          background: #f59e0b;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .app__main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .app__panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .app__panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .app__panel-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .app__panel-title-icon {
          color: #8b5cf6;
          font-size: 1.25rem;
        }

        .app__add-btn {
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
        }

        .app__add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
        }

        .app__tree {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .platform-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          margin-bottom: 1rem;
          overflow: hidden;
          transition: all 0.2s;
        }

        .platform-card:hover {
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1);
        }

        .platform-card__header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .platform-card__icon {
          font-size: 1.5rem;
        }

        .platform-card__name {
          flex: 1;
          font-weight: 600;
        }

        .platform-card__badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .platform-card__badge--free {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .platform-card__badge--pro {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        .platform-card__badge--enterprise {
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
        }

        .platform-card__body {
          padding: 1rem;
        }

        .platform-card__body p {
          color: #94a3b8;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .platform-card__btn {
          padding: 0.5rem 1rem;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 0.375rem;
          color: #60a5fa;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .platform-card__btn:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        .app__empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }

        .app__empty-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .app__empty-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #f1f5f9 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .app__empty-message {
          font-size: 1rem;
          color: #94a3b8;
          margin-bottom: 2rem;
          max-width: 500px;
        }

        .app__empty-features {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .feature {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #e2e8f0;
        }

        .app__empty-btn {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border: none;
          border-radius: 0.75rem;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
        }

        .app__empty-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
        }

        .app__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.75rem;
          color: #64748b;
        }

        .app__footer-status {
          color: #22c55e;
        }

        .app__footer-brand {
          background: linear-gradient(90deg, #8b5cf6, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
};

export default App;
