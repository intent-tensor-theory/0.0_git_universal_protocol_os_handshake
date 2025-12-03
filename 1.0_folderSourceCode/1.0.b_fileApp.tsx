// ============================================
// PROTOCOL OS - MAIN APPLICATION COMPONENT
// ============================================
// Address: 1.0.b
// Purpose: Root Application Component and Layout
// ============================================

import React, { useState } from 'react';

/**
 * Protocol OS Application
 * 
 * The root component that orchestrates the Universal API
 * Handshake System. Implements Intent Tensor Theory's
 * recursive hierarchy.
 */
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'builder' | 'library'>('builder');

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <h1 className="app-title">
            <span className="app-title-icon">🤝</span>
            Protocol OS
          </h1>
          <span className="app-version">v1.0.0</span>
        </div>
        
        <nav className="app-nav">
          <button
            className={`nav-btn ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            🔧 Builder
          </button>
          <button
            className={`nav-btn ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            📚 Library
          </button>
        </nav>
        
        <div className="app-header-right">
          <div className="status-indicator">
            <span className="status-dot"></span>
            System Ready
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'builder' ? (
          <section className="panel panel-builder">
            <div className="panel-header">
              <h2>
                <span className="delta">Δ</span>
                Platform → Resource → Handshake
              </h2>
              <button className="btn-add">+ Add Platform</button>
            </div>
            
            <div className="panel-content">
              <div className="empty-state">
                <div className="empty-icon">🚀</div>
                <h3>Welcome to Protocol OS</h3>
                <p>Create your first platform to get started with the Universal API Handshake System</p>
                <button className="btn-primary">Create Platform</button>
              </div>
            </div>
          </section>
        ) : (
          <section className="panel panel-library">
            <div className="panel-header">
              <h2>📚 Saved Handshakes</h2>
              <div className="search-box">
                <input type="text" placeholder="Search handshakes..." />
              </div>
            </div>
            
            <div className="panel-content">
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Saved Handshakes</h3>
                <p>Your saved handshakes will appear here</p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <span>Intent Tensor Theory Architecture</span>
        <span>Built with Ghostless Coding Principles</span>
      </footer>

      <style>{`
        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #f1f5f9;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .app-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .app-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }

        .app-title-icon {
          font-size: 1.75rem;
        }

        .app-version {
          padding: 0.25rem 0.75rem;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 9999px;
          font-size: 0.75rem;
          color: #60a5fa;
        }

        .app-nav {
          display: flex;
          gap: 0.5rem;
          padding: 0.25rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0.5rem;
        }

        .nav-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          border-radius: 0.375rem;
          color: #94a3b8;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          color: #f1f5f9;
        }

        .nav-btn.active {
          background: #3b82f6;
          color: white;
        }

        .app-header-right {
          display: flex;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .app-main {
          flex: 1;
          padding: 2rem;
        }

        .panel {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1rem;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .panel-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .delta {
          color: #3b82f6;
          font-weight: 700;
        }

        .btn-add {
          padding: 0.5rem 1rem;
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 0.5rem;
          color: #60a5fa;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        .search-box input {
          padding: 0.5rem 1rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: #f1f5f9;
          font-size: 0.875rem;
          width: 250px;
        }

        .search-box input::placeholder {
          color: #64748b;
        }

        .panel-content {
          padding: 2rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .empty-state p {
          color: #94a3b8;
          margin: 0 0 1.5rem 0;
          max-width: 400px;
        }

        .btn-primary {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          border-radius: 0.5rem;
          color: white;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .app-footer {
          display: flex;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.75rem;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};

export default App;
