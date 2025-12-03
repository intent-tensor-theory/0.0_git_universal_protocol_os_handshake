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

import React, { useState, useCallback, useEffect, useMemo } from 'react';

// State Management
import { 
  StateManager, 
  getStateManager,
  AppState,
  Platform,
  Resource,
  Handshake,
  selectPlatformsOrdered,
  selectResourcesForPlatform,
  selectHandshakesForResource,
} from './1.4_folderStateManagement/1.4.a_filePlatformResourceHandshakeStateManager';

// Data Serialization
import { 
  DataSerializer,
  exportToFile,
  importFromFile 
} from './1.4_folderStateManagement/1.4.b_filePlatformResourceHandshakeDataSerializer';

// Database Persistence
import { getActiveProvider } from './1.2_folderDatabasePersistenceProviders/1.2.c_fileActiveDatabaseProviderToggle';

// UI Components
import { SystemLoggerDisplay } from './1.7_folderSharedUserInterfaceComponents/1.7.1_folderSystemLoggerDisplay/1.7.1.a_fileSystemLoggerDisplay';
import { systemLogger } from './1.7_folderSharedUserInterfaceComponents/1.7.1_folderSystemLoggerDisplay/1.7.1.b_fileSystemLoggerInstance';
import { EkgStatusIndicator } from './1.7_folderSharedUserInterfaceComponents/1.7.2_folderEkgStatusIndicator/1.7.2.a_fileEkgStatusIndicator';
import { MasterBadgeIndicator } from './1.7_folderSharedUserInterfaceComponents/1.7.3_folderMasterBadgeIndicator/1.7.3.a_fileMasterBadgeIndicator';
import { AccordionPlusButton } from './1.7_folderSharedUserInterfaceComponents/1.7.5_folderAccordionPlusButton/1.7.5.a_fileAccordionPlusButton';
import { ThreeDimensionalButton } from './1.7_folderSharedUserInterfaceComponents/1.7.7_folderThreeDimensionalButton/1.7.7.a_fileThreeDimensionalButton';

// Accordion Sections
import { PlatformAccordionSection } from './1.4_folderPlatformResourceHandshakeTree/1.4.2_folderPlatformAccordionSection/1.4.2.a_filePlatformAccordionSection';
import { ResourceAccordionSection } from './1.4_folderPlatformResourceHandshakeTree/1.4.3_folderResourceAccordionSection/1.4.3.a_fileResourceAccordionSection';
import { HandshakeAccordionSection } from './1.4_folderPlatformResourceHandshakeTree/1.4.4_folderHandshakeAccordionSection/1.4.4.a_fileHandshakeAccordionSection';

// Saved Handshakes Library
import { SavedHandshakesContainer } from './1.5_folderSavedHandshakesLibrary/1.5.a_fileSavedHandshakesContainer';

// Execution Output
import { ExecutionOutputContainer } from './1.6_folderExecutionOutput/1.6.a_fileExecutionOutputContainer';

// Application Config
import { getEnvironmentConfig } from './1.1_folderApplicationConfiguration/1.1.a_fileApplicationEnvironmentConfiguration';
import { APP_VERSION_METADATA } from './1.1_folderApplicationConfiguration/1.1.b_fileApplicationVersionMetadata';

// ============================================
// TYPES
// ============================================

/**
 * View mode
 */
type ViewMode = 'builder' | 'library' | 'split';

/**
 * Panel visibility
 */
interface PanelVisibility {
  logger: boolean;
  output: boolean;
}

// ============================================
// MAIN APP COMPONENT
// ============================================

const App: React.FC = () => {
  // ============================================
  // STATE
  // ============================================

  const [stateManager] = useState(() => getStateManager());
  const [appState, setAppState] = useState<AppState>(stateManager.getState());
  const [viewMode, setViewMode] = useState<ViewMode>('builder');
  const [panels, setPanels] = useState<PanelVisibility>({ logger: false, output: true });
  const [isInitialized, setIsInitialized] = useState(false);
  const [executionResult, setExecutionResult] = useState<unknown>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = stateManager.subscribe((newState) => {
      setAppState(newState);
    });

    // Initialize from persistence
    initializeFromPersistence();

    // Log initialization
    systemLogger.info('Protocol OS initialized', {
      version: APP_VERSION_METADATA.version,
      build: APP_VERSION_METADATA.buildNumber,
    });

    return () => {
      unsubscribe();
    };
  }, [stateManager]);

  /**
   * Initialize state from persistence layer
   */
  const initializeFromPersistence = async () => {
    try {
      const provider = getActiveProvider();
      const savedData = await provider.load('protocol-os-state');
      
      if (savedData) {
        const importResult = DataSerializer.deserialize(savedData, { validate: true });
        
        if (importResult.success && importResult.state) {
          stateManager.dispatch('STATE_LOAD', { state: importResult.state });
          systemLogger.info('State restored from persistence', {
            platforms: importResult.stats.platformsImported,
            resources: importResult.stats.resourcesImported,
            handshakes: importResult.stats.handshakesImported,
          });
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      systemLogger.error('Failed to restore state', { error });
      setIsInitialized(true);
    }
  };

  /**
   * Save state to persistence
   */
  const saveStateToPersistence = useCallback(async () => {
    try {
      const provider = getActiveProvider();
      const serialized = DataSerializer.serialize(appState, { prettyPrint: false });
      await provider.save('protocol-os-state', serialized);
      stateManager.dispatch('STATE_MARK_SAVED', {});
      systemLogger.info('State saved to persistence');
    } catch (error) {
      systemLogger.error('Failed to save state', { error });
    }
  }, [appState, stateManager]);

  // Auto-save on state changes (debounced)
  useEffect(() => {
    if (!isInitialized || !appState.meta.isDirty) return;

    const timeout = setTimeout(() => {
      saveStateToPersistence();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [appState, isInitialized, saveStateToPersistence]);

  // ============================================
  // COMPUTED
  // ============================================

  const platforms = useMemo(() => selectPlatformsOrdered(appState), [appState]);
  
  const expandedPlatformIds = useMemo(
    () => Array.from(appState.ui.view.expandedPlatforms),
    [appState.ui.view.expandedPlatforms]
  );
  
  const expandedResourceIds = useMemo(
    () => Array.from(appState.ui.view.expandedResources),
    [appState.ui.view.expandedResources]
  );

  const savedHandshakes = useMemo(() => {
    return Object.values(appState.handshakes);
  }, [appState.handshakes]);

  const systemStatus = useMemo(() => {
    if (appState.ui.error) return 'error';
    if (appState.ui.isLoading) return 'loading';
    if (isExecuting) return 'executing';
    return 'healthy';
  }, [appState.ui.error, appState.ui.isLoading, isExecuting]);

  // ============================================
  // HANDLERS - PLATFORMS
  // ============================================

  const handleAddPlatform = useCallback(() => {
    stateManager.dispatch('PLATFORM_ADD', {
      platform: {
        name: 'New Platform',
        edition: 'free',
        status: 'active',
      },
    });
    systemLogger.info('Platform created');
  }, [stateManager]);

  const handleUpdatePlatform = useCallback((id: string, updates: Partial<Platform>) => {
    stateManager.dispatch('PLATFORM_UPDATE', { id, updates });
  }, [stateManager]);

  const handleDeletePlatform = useCallback((id: string) => {
    stateManager.dispatch('PLATFORM_DELETE', { id });
    systemLogger.info('Platform deleted', { id });
  }, [stateManager]);

  const handleTogglePlatformExpand = useCallback((id: string) => {
    if (expandedPlatformIds.includes(id)) {
      stateManager.dispatch('PLATFORM_COLLAPSE', { id });
    } else {
      stateManager.dispatch('PLATFORM_EXPAND', { id });
    }
  }, [stateManager, expandedPlatformIds]);

  // ============================================
  // HANDLERS - RESOURCES
  // ============================================

  const handleAddResource = useCallback((platformId: string) => {
    stateManager.dispatch('RESOURCE_ADD', {
      platformId,
      resource: {
        name: 'New Resource',
        type: 'api',
        status: 'unknown',
        handshakeIds: [],
      },
    });
    systemLogger.info('Resource created', { platformId });
  }, [stateManager]);

  const handleUpdateResource = useCallback((id: string, updates: Partial<Resource>) => {
    stateManager.dispatch('RESOURCE_UPDATE', { id, updates });
  }, [stateManager]);

  const handleDeleteResource = useCallback((id: string) => {
    stateManager.dispatch('RESOURCE_DELETE', { id });
    systemLogger.info('Resource deleted', { id });
  }, [stateManager]);

  const handleToggleResourceExpand = useCallback((id: string) => {
    if (expandedResourceIds.includes(id)) {
      stateManager.dispatch('RESOURCE_COLLAPSE', { id });
    } else {
      stateManager.dispatch('RESOURCE_EXPAND', { id });
    }
  }, [stateManager, expandedResourceIds]);

  // ============================================
  // HANDLERS - HANDSHAKES
  // ============================================

  const handleAddHandshake = useCallback((resourceId: string) => {
    stateManager.dispatch('HANDSHAKE_ADD', {
      resourceId,
      handshake: {
        name: 'New Handshake',
        protocol: { type: 'curl', name: 'cURL Default' },
        handshakeType: 'request',
        configuration: {},
        status: 'draft',
      },
    });
    systemLogger.info('Handshake created', { resourceId });
  }, [stateManager]);

  const handleUpdateHandshake = useCallback((id: string, updates: Partial<Handshake>, createVersion = false) => {
    stateManager.dispatch('HANDSHAKE_UPDATE', { id, updates, createVersion });
  }, [stateManager]);

  const handleDeleteHandshake = useCallback((id: string) => {
    stateManager.dispatch('HANDSHAKE_DELETE', { id });
    systemLogger.info('Handshake deleted', { id });
  }, [stateManager]);

  const handleDuplicateHandshake = useCallback((id: string) => {
    stateManager.dispatch('HANDSHAKE_DUPLICATE', { id });
    systemLogger.info('Handshake duplicated', { id });
  }, [stateManager]);

  const handleExecuteHandshake = useCallback(async (handshake: Handshake) => {
    setIsExecuting(true);
    stateManager.dispatch('HANDSHAKE_EXECUTE', { id: handshake.id });
    systemLogger.info('Executing handshake', { name: handshake.name });

    try {
      // Simulate execution - in production, this would call the actual executor
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = {
        success: true,
        statusCode: 200,
        duration: 1500,
        executedAt: new Date(),
      };

      stateManager.dispatch('HANDSHAKE_EXECUTION_COMPLETE', {
        id: handshake.id,
        result,
      });

      setExecutionResult(result);
      systemLogger.info('Handshake executed successfully', result);
    } catch (error) {
      const result = {
        success: false,
        executedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      stateManager.dispatch('HANDSHAKE_EXECUTION_COMPLETE', {
        id: handshake.id,
        result,
      });

      setExecutionResult(result);
      systemLogger.error('Handshake execution failed', { error });
    } finally {
      setIsExecuting(false);
    }
  }, [stateManager]);

  // ============================================
  // HANDLERS - IMPORT/EXPORT
  // ============================================

  const handleExport = useCallback(async () => {
    try {
      await exportToFile(appState, `protocol-os-export-${Date.now()}`);
      systemLogger.info('Data exported successfully');
    } catch (error) {
      systemLogger.error('Export failed', { error });
    }
  }, [appState]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const result = await importFromFile(file, { merge: true, validate: true });
      
      if (result.success && result.state) {
        stateManager.dispatch('STATE_LOAD', { state: result.state });
        systemLogger.info('Data imported successfully', result.stats);
      } else {
        systemLogger.error('Import failed', { errors: result.errors });
      }
    } catch (error) {
      systemLogger.error('Import failed', { error });
    }
  }, [stateManager]);

  // ============================================
  // RENDER
  // ============================================

  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner">
          <EkgStatusIndicator status="loading" size="large" />
        </div>
        <div className="app-loading__text">Initializing Protocol OS...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app__header">
        <div className="app__header-left">
          <h1 className="app__title">
            <span className="app__title-icon">🤝</span>
            Protocol OS
          </h1>
          <MasterBadgeIndicator 
            label={`v${APP_VERSION_METADATA.version}`}
            variant="info"
            size="small"
          />
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
          <EkgStatusIndicator status={systemStatus} label="System" />
          
          <button
            className="app__panel-toggle"
            onClick={() => setPanels(p => ({ ...p, logger: !p.logger }))}
            title="Toggle Logger"
          >
            📋
          </button>
          
          <ThreeDimensionalButton
            label="Export"
            icon="📤"
            onClick={handleExport}
            size="small"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="app__main">
        {/* Builder Panel */}
        {(viewMode === 'builder' || viewMode === 'split') && (
          <section className={`app__panel app__panel--builder ${viewMode === 'split' ? 'app__panel--half' : ''}`}>
            <div className="app__panel-header">
              <h2 className="app__panel-title">
                <span className="app__panel-title-icon">Δ</span>
                Platform → Resource → Handshake
              </h2>
              <AccordionPlusButton
                onClick={handleAddPlatform}
                tooltip="Add Platform"
              />
            </div>
            
            <div className="app__tree">
              {platforms.length > 0 ? (
                platforms.map(platform => (
                  <PlatformAccordionSection
                    key={platform.id}
                    platform={platform}
                    isExpanded={expandedPlatformIds.includes(platform.id)}
                    onToggleExpand={() => handleTogglePlatformExpand(platform.id)}
                    onUpdate={(updates) => handleUpdatePlatform(platform.id, updates)}
                    onDelete={() => handleDeletePlatform(platform.id)}
                    onAddResource={() => handleAddResource(platform.id)}
                  >
                    {selectResourcesForPlatform(platform.id)(appState).map(resource => (
                      <ResourceAccordionSection
                        key={resource.id}
                        resource={resource}
                        isExpanded={expandedResourceIds.includes(resource.id)}
                        onToggleExpand={() => handleToggleResourceExpand(resource.id)}
                        onUpdate={(updates) => handleUpdateResource(resource.id, updates)}
                        onDelete={() => handleDeleteResource(resource.id)}
                        onAddHandshake={() => handleAddHandshake(resource.id)}
                      >
                        {selectHandshakesForResource(resource.id)(appState).map(handshake => (
                          <HandshakeAccordionSection
                            key={handshake.id}
                            handshake={handshake}
                            onUpdate={(updates, createVersion) => 
                              handleUpdateHandshake(handshake.id, updates, createVersion)
                            }
                            onDelete={() => handleDeleteHandshake(handshake.id)}
                            onDuplicate={() => handleDuplicateHandshake(handshake.id)}
                            onExecute={() => handleExecuteHandshake(handshake)}
                          />
                        ))}
                      </ResourceAccordionSection>
                    ))}
                  </PlatformAccordionSection>
                ))
              ) : (
                <div className="app__empty">
                  <div className="app__empty-icon">🚀</div>
                  <div className="app__empty-title">Welcome to Protocol OS</div>
                  <div className="app__empty-message">
                    Create your first platform to get started with the Universal API Handshake System
                  </div>
                  <ThreeDimensionalButton
                    label="Create Platform"
                    icon="+"
                    onClick={handleAddPlatform}
                    variant="primary"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Library Panel */}
        {(viewMode === 'library' || viewMode === 'split') && (
          <section className={`app__panel app__panel--library ${viewMode === 'split' ? 'app__panel--half' : ''}`}>
            <SavedHandshakesContainer
              handshakes={savedHandshakes}
              onSelect={(h) => {
                stateManager.dispatch('HANDSHAKE_SELECT', { id: h.id });
                if (viewMode === 'library') setViewMode('builder');
              }}
              onUpdate={(h) => handleUpdateHandshake(h.id, h)}
              onDelete={(id) => handleDeleteHandshake(id)}
              onDuplicate={(h) => handleDuplicateHandshake(h.id)}
              onExport={(handshakes) => {
                const filtered = {
                  ...appState,
                  handshakes: Object.fromEntries(
                    handshakes.map(h => [h.id, h])
                  ),
                };
                exportToFile(filtered, 'handshakes-export');
              }}
              onImport={handleImport}
            />
          </section>
        )}

        {/* Execution Output Panel */}
        {panels.output && (
          <aside className="app__sidebar app__sidebar--output">
            <ExecutionOutputContainer
              result={executionResult}
              isExecuting={isExecuting}
            />
          </aside>
        )}
      </main>

      {/* System Logger */}
      {panels.logger && (
        <aside className="app__logger">
          <SystemLoggerDisplay
            onClose={() => setPanels(p => ({ ...p, logger: false }))}
          />
        </aside>
      )}

      {/* Footer */}
      <footer className="app__footer">
        <div className="app__footer-left">
          <span className="app__footer-status">
            {appState.meta.isDirty ? '● Unsaved changes' : '✓ All changes saved'}
          </span>
        </div>
        <div className="app__footer-center">
          <span className="app__footer-stats">
            {Object.keys(appState.platforms).length} platforms · 
            {Object.keys(appState.resources).length} resources · 
            {Object.keys(appState.handshakes).length} handshakes
          </span>
        </div>
        <div className="app__footer-right">
          <span className="app__footer-brand">
            Intent Tensor Theory Architecture
          </span>
        </div>
      </footer>

      {/* Global Styles */}
      <style>{`
        .app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: var(--color-background, #0f172a);
          color: var(--color-text-primary, #f1f5f9);
        }

        .app__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: var(--glass-background, rgba(255, 255, 255, 0.05));
          border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
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
          margin: 0;
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
          color: var(--color-text-secondary, #94a3b8);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .app__view-btn:hover {
          color: var(--color-text-primary, #f1f5f9);
        }

        .app__view-btn--active {
          background: var(--color-primary, #3b82f6);
          color: white;
        }

        .app__panel-toggle {
          padding: 0.5rem;
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .app__panel-toggle:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--color-text-primary);
        }

        .app__main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .app__panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .app__panel--half {
          flex: 0 0 50%;
          border-right: 1px solid var(--color-border);
        }

        .app__panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid var(--color-border);
        }

        .app__panel-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .app__panel-title-icon {
          color: var(--color-primary);
        }

        .app__tree {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .app__sidebar {
          width: 400px;
          border-left: 1px solid var(--color-border);
          overflow-y: auto;
        }

        .app__logger {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 300px;
          z-index: 100;
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
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .app__empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .app__empty-message {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 1.5rem;
          max-width: 400px;
        }

        .app__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid var(--color-border);
          font-size: 0.75rem;
          color: var(--color-text-muted, #64748b);
        }

        .app__footer-status {
          color: var(--color-success, #22c55e);
        }

        .app__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--color-background, #0f172a);
          color: var(--color-text-primary, #f1f5f9);
        }

        .app__loading-text {
          margin-top: 1rem;
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }
      `}</style>
    </div>
  );
};

export default App;
