// ============================================
// PROTOCOL OS - KEYLESS SCRAPER CREDENTIAL FORM FIELDS
// ============================================
// Address: 1.3.11.b
// Purpose: React component for Keyless Scraper configuration UI
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import type { ProtocolFieldDefinition } from '../1.3.b_fileProtocolHandshakeModuleInterface';
import { 
  KeylessScraperHandshakeExecutor, 
  USER_AGENTS,
  type RobotsTxtRules,
} from './1.3.11.a_fileKeylessScraperHandshakeExecutor';

/**
 * Scraping preset configuration
 */
export interface ScrapingPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  userAgent: string;
  requestDelay: number;
  respectRobotsTxt: boolean;
  rotateUserAgents: boolean;
  notes?: string;
}

/**
 * Presets for common scraping scenarios
 */
export const SCRAPING_PRESETS: ScrapingPreset[] = [
  {
    id: 'polite',
    name: 'Polite Scraper',
    icon: '🐢',
    description: 'Slow, respectful scraping',
    userAgent: 'chrome_windows',
    requestDelay: 3000,
    respectRobotsTxt: true,
    rotateUserAgents: false,
    notes: 'Best for sites with strict rate limits. 3 second delay between requests.',
  },
  {
    id: 'moderate',
    name: 'Moderate Speed',
    icon: '🚶',
    description: 'Balanced speed and respect',
    userAgent: 'chrome_windows',
    requestDelay: 1000,
    respectRobotsTxt: true,
    rotateUserAgents: false,
    notes: 'Good balance for most sites. 1 second delay.',
  },
  {
    id: 'fast',
    name: 'Fast Scraper',
    icon: '🏃',
    description: 'Quick data collection',
    userAgent: 'chrome_windows',
    requestDelay: 500,
    respectRobotsTxt: true,
    rotateUserAgents: true,
    notes: 'For sites that allow faster access. Use responsibly.',
  },
  {
    id: 'stealth',
    name: 'Stealth Mode',
    icon: '🥷',
    description: 'Rotate user agents',
    userAgent: 'chrome_windows',
    requestDelay: 2000,
    respectRobotsTxt: true,
    rotateUserAgents: true,
    notes: 'Rotates user agents to appear as different browsers.',
  },
  {
    id: 'research',
    name: 'Research Mode',
    icon: '🔬',
    description: 'For academic research',
    userAgent: 'chrome_windows',
    requestDelay: 5000,
    respectRobotsTxt: true,
    rotateUserAgents: false,
    notes: 'Very conservative for research purposes. 5 second delay.',
  },
  {
    id: 'custom',
    name: 'Custom Settings',
    icon: '⚙️',
    description: 'Configure manually',
    userAgent: 'chrome_windows',
    requestDelay: 1000,
    respectRobotsTxt: true,
    rotateUserAgents: false,
  },
];

/**
 * Props for the credential form
 */
export interface KeylessScraperCredentialFormFieldsProps {
  /** Current credential values */
  values: Record<string, unknown>;
  
  /** Callback when values change */
  onChange: (values: Record<string, unknown>) => void;
  
  /** Callback to test connection */
  onTestConnection?: () => void;
  
  /** Callback to test scrape a URL */
  onTestScrape?: (url: string) => void;
  
  /** Callback when form is submitted */
  onSubmit?: () => void;
  
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  
  /** Whether the form is disabled */
  disabled?: boolean;
  
  /** Validation errors from parent */
  errors?: Record<string, string>;
  
  /** Current connection status */
  connectionStatus?: 'none' | 'testing' | 'connected' | 'error';
  
  /** Robots.txt rules */
  robotsRules?: RobotsTxtRules;
  
  /** Last scrape result preview */
  lastScrapePreview?: { url: string; title?: string; textLength?: number; linkCount?: number };
  
  /** Custom class name */
  className?: string;
}

/**
 * Keyless Scraper Credential Form Fields Component
 */
export const KeylessScraperCredentialFormFields: React.FC<KeylessScraperCredentialFormFieldsProps> = ({
  values,
  onChange,
  onTestConnection,
  onTestScrape,
  onSubmit,
  isLoading = false,
  disabled = false,
  errors = {},
  connectionStatus = 'none',
  robotsRules,
  lastScrapePreview,
  className = '',
}) => {
  // State for selected preset
  const [selectedPreset, setSelectedPreset] = useState<string>('moderate');
  
  // State for collapsible sections
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    preset: true,
    target: true,
    browser: false,
    rateLimiting: true,
    requests: false,
    proxy: false,
    caching: false,
    reliability: false,
    advanced: false,
    testScrape: false,
  });

  // State for test scrape URL
  const [testUrl, setTestUrl] = useState('');

  // Get executor for utilities
  const executor = useMemo(() => new KeylessScraperHandshakeExecutor(), []);

  // Get current preset
  const currentPreset = useMemo(() => 
    SCRAPING_PRESETS.find((p) => p.id === selectedPreset),
    [selectedPreset]
  );

  // Handle preset selection
  const handlePresetSelect = useCallback((presetId: string) => {
    setSelectedPreset(presetId);
    
    const preset = SCRAPING_PRESETS.find((p) => p.id === presetId);
    if (preset && preset.id !== 'custom') {
      onChange({
        ...values,
        userAgent: preset.userAgent,
        requestDelay: preset.requestDelay,
        respectRobotsTxt: preset.respectRobotsTxt,
        rotateUserAgents: preset.rotateUserAgents,
      });
    }
  }, [values, onChange]);

  // Handle field change
  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    onChange({
      ...values,
      [fieldId]: value,
    });
    // Switch to custom preset when manually changing
    if (['userAgent', 'requestDelay', 'respectRobotsTxt', 'rotateUserAgents'].includes(fieldId)) {
      setSelectedPreset('custom');
    }
  }, [values, onChange]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.();
  }, [onSubmit]);

  // Handle test scrape
  const handleTestScrape = useCallback(() => {
    if (testUrl) {
      onTestScrape?.(testUrl);
    }
  }, [testUrl, onTestScrape]);

  // Render group header
  const renderGroupHeader = (
    groupId: string,
    label: string,
    description?: string,
    badge?: React.ReactNode
  ) => (
    <button
      type="button"
      className="scraper-form__group-header"
      onClick={() => toggleGroup(groupId)}
      aria-expanded={expandedGroups[groupId]}
    >
      <span className="scraper-form__group-icon">
        {expandedGroups[groupId] ? '▼' : '▶'}
      </span>
      <span className="scraper-form__group-label">{label}</span>
      {badge}
      {description && (
        <span className="scraper-form__group-description">{description}</span>
      )}
    </button>
  );

  // Render preset selector
  const renderPresetSelector = () => (
    <div className="scraper-form__presets">
      <label className="scraper-form__label">Scraping Mode</label>
      <div className="scraper-form__preset-grid">
        {SCRAPING_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`scraper-form__preset-button ${
              selectedPreset === preset.id ? 'scraper-form__preset-button--selected' : ''
            }`}
            onClick={() => handlePresetSelect(preset.id)}
            disabled={disabled || isLoading}
          >
            <span className="scraper-form__preset-icon">{preset.icon}</span>
            <span className="scraper-form__preset-name">{preset.name}</span>
            <span className="scraper-form__preset-desc">{preset.description}</span>
          </button>
        ))}
      </div>
      {currentPreset?.notes && (
        <div className="scraper-form__preset-notes">
          💡 {currentPreset.notes}
        </div>
      )}
    </div>
  );

  // Render target fields
  const renderTargetFields = () => (
    <div className="scraper-form__target">
      <div className="scraper-form__field">
        <label htmlFor="baseUrl" className="scraper-form__label">
          Base URL
          <span className="scraper-form__required">*</span>
        </label>
        <input
          id="baseUrl"
          type="url"
          className={`scraper-form__input ${errors.baseUrl ? 'scraper-form__input--error' : ''}`}
          value={(values.baseUrl as string) || ''}
          onChange={(e) => handleFieldChange('baseUrl', e.target.value)}
          placeholder="https://example.com"
          disabled={disabled || isLoading}
        />
        {errors.baseUrl && (
          <span className="scraper-form__error">{errors.baseUrl}</span>
        )}
      </div>

      {/* Connection status */}
      <div className="scraper-form__connection-status">
        {connectionStatus === 'connected' ? (
          <div className="scraper-form__status scraper-form__status--success">
            <span className="scraper-form__status-icon">✓</span>
            <span>Website reachable</span>
          </div>
        ) : connectionStatus === 'testing' ? (
          <div className="scraper-form__status scraper-form__status--pending">
            <span className="scraper-form__status-icon">⏳</span>
            <span>Testing connection...</span>
          </div>
        ) : connectionStatus === 'error' ? (
          <div className="scraper-form__status scraper-form__status--error">
            <span className="scraper-form__status-icon">✗</span>
            <span>Connection failed</span>
          </div>
        ) : null}

        {onTestConnection && (
          <button
            type="button"
            className="scraper-form__test-button"
            onClick={onTestConnection}
            disabled={disabled || isLoading || !values.baseUrl || connectionStatus === 'testing'}
          >
            {connectionStatus === 'testing' ? 'Testing...' : '🔌 Test Connection'}
          </button>
        )}
      </div>

      {/* Robots.txt info */}
      {robotsRules && (
        <div className="scraper-form__robots-info">
          <div className="scraper-form__robots-header">
            <span className="scraper-form__robots-icon">🤖</span>
            <span>robots.txt</span>
          </div>
          <div className="scraper-form__robots-details">
            {robotsRules.crawlDelay && (
              <div>Crawl delay: {robotsRules.crawlDelay / 1000}s</div>
            )}
            {robotsRules.disallowed.length > 0 && (
              <div>Disallowed paths: {robotsRules.disallowed.length}</div>
            )}
            {robotsRules.sitemaps.length > 0 && (
              <div>Sitemaps: {robotsRules.sitemaps.length}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Render browser fields
  const renderBrowserFields = () => (
    <div className="scraper-form__browser">
      <div className="scraper-form__field">
        <label htmlFor="userAgent" className="scraper-form__label">
          User Agent
        </label>
        <select
          id="userAgent"
          className="scraper-form__select"
          value={(values.userAgent as string) || 'chrome_windows'}
          onChange={(e) => handleFieldChange('userAgent', e.target.value)}
          disabled={disabled || isLoading}
        >
          <option value="chrome_windows">Chrome (Windows)</option>
          <option value="chrome_mac">Chrome (macOS)</option>
          <option value="chrome_linux">Chrome (Linux)</option>
          <option value="firefox_windows">Firefox (Windows)</option>
          <option value="firefox_mac">Firefox (macOS)</option>
          <option value="safari_mac">Safari (macOS)</option>
          <option value="edge_windows">Edge (Windows)</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {values.userAgent === 'custom' && (
        <div className="scraper-form__field">
          <label htmlFor="customUserAgent" className="scraper-form__label">
            Custom User Agent
          </label>
          <input
            id="customUserAgent"
            type="text"
            className="scraper-form__input"
            value={(values.customUserAgent as string) || ''}
            onChange={(e) => handleFieldChange('customUserAgent', e.target.value)}
            placeholder="Mozilla/5.0 ..."
            disabled={disabled || isLoading}
          />
        </div>
      )}

      <div className="scraper-form__field">
        <label className="scraper-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.rotateUserAgents as boolean) || false}
            onChange={(e) => handleFieldChange('rotateUserAgents', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Rotate User Agents
        </label>
        <span className="scraper-form__hint">
          Automatically cycle through different browsers
        </span>
      </div>

      {/* Show current user agent */}
      <div className="scraper-form__current-ua">
        <span className="scraper-form__ua-label">Current:</span>
        <code className="scraper-form__ua-value">
          {values.userAgent === 'custom' 
            ? (values.customUserAgent as string || 'Not set')
            : USER_AGENTS[values.userAgent as keyof typeof USER_AGENTS] || USER_AGENTS.chrome_windows
          }
        </code>
      </div>
    </div>
  );

  // Render rate limiting fields
  const renderRateLimitingFields = () => (
    <div className="scraper-form__rate-limiting">
      <div className="scraper-form__field">
        <label htmlFor="requestDelay" className="scraper-form__label">
          Request Delay (ms)
        </label>
        <input
          id="requestDelay"
          type="number"
          className="scraper-form__input"
          value={(values.requestDelay as number) || 1000}
          onChange={(e) => handleFieldChange('requestDelay', parseInt(e.target.value, 10))}
          placeholder="1000"
          disabled={disabled || isLoading}
          min={0}
        />
        <span className="scraper-form__hint">
          Time to wait between requests ({((values.requestDelay as number) || 1000) / 1000}s = ~{Math.floor(3600000 / ((values.requestDelay as number) || 1000))} req/hour)
        </span>
      </div>

      <div className="scraper-form__field">
        <label className="scraper-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.respectRobotsTxt as boolean) !== false}
            onChange={(e) => handleFieldChange('respectRobotsTxt', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Respect robots.txt
        </label>
        <span className="scraper-form__hint">
          Follow website scraping rules (recommended)
        </span>
      </div>

      {/* Rate limit visualization */}
      <div className="scraper-form__rate-viz">
        <div className="scraper-form__rate-bar">
          <div 
            className="scraper-form__rate-fill"
            style={{ 
              width: `${Math.min(100, ((values.requestDelay as number) || 1000) / 50)}%`,
              backgroundColor: ((values.requestDelay as number) || 1000) >= 2000 
                ? '#22c55e' 
                : ((values.requestDelay as number) || 1000) >= 1000 
                  ? '#eab308' 
                  : '#ef4444'
            }}
          />
        </div>
        <div className="scraper-form__rate-labels">
          <span>Fast (risky)</span>
          <span>Moderate</span>
          <span>Polite (safe)</span>
        </div>
      </div>
    </div>
  );

  // Render request settings
  const renderRequestSettings = () => (
    <div className="scraper-form__requests">
      <div className="scraper-form__field">
        <label className="scraper-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.followRedirects as boolean) !== false}
            onChange={(e) => handleFieldChange('followRedirects', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Follow Redirects
        </label>
      </div>

      {values.followRedirects !== false && (
        <div className="scraper-form__field">
          <label htmlFor="maxRedirects" className="scraper-form__label">
            Max Redirects
          </label>
          <input
            id="maxRedirects"
            type="number"
            className="scraper-form__input"
            value={(values.maxRedirects as number) || 5}
            onChange={(e) => handleFieldChange('maxRedirects', parseInt(e.target.value, 10))}
            placeholder="5"
            disabled={disabled || isLoading}
            min={1}
            max={20}
          />
        </div>
      )}

      <div className="scraper-form__field">
        <label htmlFor="timeout" className="scraper-form__label">
          Request Timeout (ms)
        </label>
        <input
          id="timeout"
          type="number"
          className="scraper-form__input"
          value={(values.timeout as number) || 30000}
          onChange={(e) => handleFieldChange('timeout', parseInt(e.target.value, 10))}
          placeholder="30000"
          disabled={disabled || isLoading}
          min={1000}
        />
      </div>
    </div>
  );

  // Render proxy settings
  const renderProxySettings = () => (
    <div className="scraper-form__proxy">
      <div className="scraper-form__field">
        <label htmlFor="proxyUrl" className="scraper-form__label">
          Proxy URL
          <span className="scraper-form__optional">(Optional)</span>
        </label>
        <input
          id="proxyUrl"
          type="url"
          className="scraper-form__input"
          value={(values.proxyUrl as string) || ''}
          onChange={(e) => handleFieldChange('proxyUrl', e.target.value)}
          placeholder="http://proxy.example.com:8080"
          disabled={disabled || isLoading}
        />
        <span className="scraper-form__hint">
          HTTP/HTTPS proxy server for requests
        </span>
      </div>
    </div>
  );

  // Render caching settings
  const renderCachingSettings = () => (
    <div className="scraper-form__caching">
      <div className="scraper-form__field">
        <label className="scraper-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.cacheResponses as boolean) || false}
            onChange={(e) => handleFieldChange('cacheResponses', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Cache Responses
        </label>
        <span className="scraper-form__hint">
          Store responses to avoid duplicate requests
        </span>
      </div>

      {values.cacheResponses && (
        <div className="scraper-form__field">
          <label htmlFor="cacheTtl" className="scraper-form__label">
            Cache TTL (seconds)
          </label>
          <input
            id="cacheTtl"
            type="number"
            className="scraper-form__input"
            value={(values.cacheTtl as number) || 300}
            onChange={(e) => handleFieldChange('cacheTtl', parseInt(e.target.value, 10))}
            placeholder="300"
            disabled={disabled || isLoading}
            min={60}
          />
        </div>
      )}
    </div>
  );

  // Render reliability settings
  const renderReliabilitySettings = () => (
    <div className="scraper-form__reliability">
      <div className="scraper-form__field">
        <label className="scraper-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.retryOnFailure as boolean) !== false}
            onChange={(e) => handleFieldChange('retryOnFailure', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Retry on Failure
        </label>
      </div>

      {values.retryOnFailure !== false && (
        <>
          <div className="scraper-form__field">
            <label htmlFor="maxRetries" className="scraper-form__label">
              Max Retries
            </label>
            <input
              id="maxRetries"
              type="number"
              className="scraper-form__input"
              value={(values.maxRetries as number) || 3}
              onChange={(e) => handleFieldChange('maxRetries', parseInt(e.target.value, 10))}
              placeholder="3"
              disabled={disabled || isLoading}
              min={1}
              max={10}
            />
          </div>

          <div className="scraper-form__field">
            <label htmlFor="retryDelay" className="scraper-form__label">
              Retry Delay (ms)
            </label>
            <input
              id="retryDelay"
              type="number"
              className="scraper-form__input"
              value={(values.retryDelay as number) || 2000}
              onChange={(e) => handleFieldChange('retryDelay', parseInt(e.target.value, 10))}
              placeholder="2000"
              disabled={disabled || isLoading}
              min={500}
            />
          </div>
        </>
      )}
    </div>
  );

  // Render advanced settings
  const renderAdvancedSettings = () => (
    <div className="scraper-form__advanced">
      <div className="scraper-form__field">
        <label htmlFor="customHeaders" className="scraper-form__label">
          Custom Headers (JSON)
        </label>
        <textarea
          id="customHeaders"
          className="scraper-form__textarea scraper-form__textarea--code"
          value={(values.customHeaders as string) || ''}
          onChange={(e) => handleFieldChange('customHeaders', e.target.value)}
          placeholder='{"Accept-Language": "en-US"}'
          disabled={disabled || isLoading}
          rows={3}
        />
      </div>

      <div className="scraper-form__field">
        <label className="scraper-form__checkbox-label">
          <input
            type="checkbox"
            checked={(values.acceptCookies as boolean) !== false}
            onChange={(e) => handleFieldChange('acceptCookies', e.target.checked)}
            disabled={disabled || isLoading}
          />
          Accept Cookies
        </label>
        <span className="scraper-form__hint">
          Store and send cookies with requests
        </span>
      </div>
    </div>
  );

  // Render test scrape section
  const renderTestScrape = () => (
    <div className="scraper-form__test-scrape">
      <div className="scraper-form__field">
        <label htmlFor="testUrl" className="scraper-form__label">
          Test URL
        </label>
        <div className="scraper-form__input-row">
          <input
            id="testUrl"
            type="text"
            className="scraper-form__input"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="/page-to-scrape"
            disabled={disabled || isLoading}
          />
          <button
            type="button"
            className="scraper-form__scrape-button"
            onClick={handleTestScrape}
            disabled={disabled || isLoading || !testUrl || !values.baseUrl}
          >
            🔍 Scrape
          </button>
        </div>
      </div>

      {lastScrapePreview && (
        <div className="scraper-form__scrape-preview">
          <div className="scraper-form__preview-header">
            <span className="scraper-form__preview-icon">📄</span>
            <span className="scraper-form__preview-url">{lastScrapePreview.url}</span>
          </div>
          <div className="scraper-form__preview-details">
            {lastScrapePreview.title && (
              <div><strong>Title:</strong> {lastScrapePreview.title}</div>
            )}
            {lastScrapePreview.textLength !== undefined && (
              <div><strong>Text:</strong> {lastScrapePreview.textLength.toLocaleString()} characters</div>
            )}
            {lastScrapePreview.linkCount !== undefined && (
              <div><strong>Links:</strong> {lastScrapePreview.linkCount}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <form
      className={`scraper-form ${className}`}
      onSubmit={handleSubmit}
    >
      {/* Preset Selection */}
      <div className="scraper-form__group">
        {renderGroupHeader('preset', 'Scraping Mode')}
        {expandedGroups.preset && (
          <div className="scraper-form__group-content">
            {renderPresetSelector()}
          </div>
        )}
      </div>

      {/* Target */}
      <div className="scraper-form__group">
        {renderGroupHeader('target', 'Target Website', undefined,
          connectionStatus === 'connected' ? (
            <span className="scraper-form__badge scraper-form__badge--success">✓ Reachable</span>
          ) : null
        )}
        {expandedGroups.target && (
          <div className="scraper-form__group-content">
            {renderTargetFields()}
          </div>
        )}
      </div>

      {/* Browser */}
      <div className="scraper-form__group">
        {renderGroupHeader('browser', 'Browser Emulation', undefined,
          values.rotateUserAgents ? (
            <span className="scraper-form__badge">Rotating</span>
          ) : null
        )}
        {expandedGroups.browser && (
          <div className="scraper-form__group-content">
            {renderBrowserFields()}
          </div>
        )}
      </div>

      {/* Rate Limiting */}
      <div className="scraper-form__group">
        {renderGroupHeader('rateLimiting', 'Rate Limiting', undefined,
          <span className="scraper-form__badge">{((values.requestDelay as number) || 1000) / 1000}s delay</span>
        )}
        {expandedGroups.rateLimiting && (
          <div className="scraper-form__group-content">
            {renderRateLimitingFields()}
          </div>
        )}
      </div>

      {/* Request Settings */}
      <div className="scraper-form__group">
        {renderGroupHeader('requests', 'Request Settings')}
        {expandedGroups.requests && (
          <div className="scraper-form__group-content">
            {renderRequestSettings()}
          </div>
        )}
      </div>

      {/* Proxy */}
      <div className="scraper-form__group">
        {renderGroupHeader('proxy', 'Proxy', undefined,
          values.proxyUrl ? (
            <span className="scraper-form__badge">Configured</span>
          ) : null
        )}
        {expandedGroups.proxy && (
          <div className="scraper-form__group-content">
            {renderProxySettings()}
          </div>
        )}
      </div>

      {/* Caching */}
      <div className="scraper-form__group">
        {renderGroupHeader('caching', 'Caching', undefined,
          values.cacheResponses ? (
            <span className="scraper-form__badge">Enabled</span>
          ) : null
        )}
        {expandedGroups.caching && (
          <div className="scraper-form__group-content">
            {renderCachingSettings()}
          </div>
        )}
      </div>

      {/* Reliability */}
      <div className="scraper-form__group">
        {renderGroupHeader('reliability', 'Reliability')}
        {expandedGroups.reliability && (
          <div className="scraper-form__group-content">
            {renderReliabilitySettings()}
          </div>
        )}
      </div>

      {/* Advanced */}
      <div className="scraper-form__group">
        {renderGroupHeader('advanced', 'Advanced Settings')}
        {expandedGroups.advanced && (
          <div className="scraper-form__group-content">
            {renderAdvancedSettings()}
          </div>
        )}
      </div>

      {/* Test Scrape */}
      {onTestScrape && (
        <div className="scraper-form__group">
          {renderGroupHeader('testScrape', 'Test Scrape')}
          {expandedGroups.testScrape && (
            <div className="scraper-form__group-content">
              {renderTestScrape()}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      {onSubmit && (
        <div className="scraper-form__actions">
          <button
            type="submit"
            className="scraper-form__submit"
            disabled={disabled || isLoading || !values.baseUrl}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      )}
    </form>
  );
};

/**
 * Hook for managing Keyless Scraper credential form state
 */
export function useKeylessScraperCredentialForm(initialValues: Record<string, unknown> = {}) {
  const [values, setValues] = useState<Record<string, unknown>>({
    requestDelay: 1000,
    respectRobotsTxt: true,
    followRedirects: true,
    maxRedirects: 5,
    timeout: 30000,
    acceptCookies: true,
    retryOnFailure: true,
    maxRetries: 3,
    retryDelay: 2000,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'testing' | 'connected' | 'error'>('none');
  const [robotsRules, setRobotsRules] = useState<RobotsTxtRules | undefined>();
  const [lastScrapePreview, setLastScrapePreview] = useState<{
    url: string;
    title?: string;
    textLength?: number;
    linkCount?: number;
  } | undefined>();

  const executor = useMemo(() => new KeylessScraperHandshakeExecutor(), []);

  const handleChange = useCallback((newValues: Record<string, unknown>) => {
    setValues(newValues);
    setIsDirty(true);
    setConnectionStatus('none');
    
    // Clear errors for changed fields
    const changedFields = Object.keys(newValues).filter(
      (key) => newValues[key] !== values[key]
    );
    if (changedFields.length > 0) {
      setErrors((prev) => {
        const next = { ...prev };
        changedFields.forEach((field) => delete next[field]);
        return next;
      });
    }
  }, [values]);

  const validate = useCallback(() => {
    const result = executor.validateCredentials(values);
    setErrors(result.fieldErrors);
    return result.valid;
  }, [values, executor]);

  const reset = useCallback((newValues: Record<string, unknown> = {}) => {
    setValues({
      requestDelay: 1000,
      respectRobotsTxt: true,
      followRedirects: true,
      maxRedirects: 5,
      timeout: 30000,
      acceptCookies: true,
      retryOnFailure: true,
      maxRetries: 3,
      retryDelay: 2000,
      ...newValues,
    });
    setErrors({});
    setIsDirty(false);
    setConnectionStatus('none');
    setRobotsRules(undefined);
    setLastScrapePreview(undefined);
  }, []);

  /**
   * Test the connection
   */
  const testConnection = useCallback(async () => {
    setConnectionStatus('testing');
    
    try {
      const authResult = await executor.authenticate(values);
      
      if (authResult.type === 'complete') {
        setConnectionStatus('connected');
        
        // Fetch robots.txt
        if (values.respectRobotsTxt !== false && values.baseUrl) {
          const robotsResult = await executor.fetchRobotsTxt(values.baseUrl as string);
          if (robotsResult.rules) {
            setRobotsRules(robotsResult.rules);
          }
        }

        return { success: true };
      } else {
        setConnectionStatus('error');
        return { success: false, error: authResult.error };
      }
    } catch (error) {
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [values, executor]);

  /**
   * Test scrape a URL
   */
  const testScrape = useCallback(async (url: string) => {
    try {
      const result = await executor.executeRequest({
        credentials: values as any,
        url,
        method: 'GET',
        headers: {},
      });

      if (result.success) {
        const html = result.rawBody;
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const links = KeylessScraperHandshakeExecutor.extractLinks(html, values.baseUrl as string);
        const text = KeylessScraperHandshakeExecutor.extractText(html);

        setLastScrapePreview({
          url,
          title: titleMatch ? titleMatch[1].trim() : undefined,
          textLength: text.length,
          linkCount: links.length,
        });

        return { success: true, html, links, text };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scrape failed';
      return { success: false, error: errorMessage };
    }
  }, [values, executor]);

  return {
    values,
    errors,
    isDirty,
    connectionStatus,
    robotsRules,
    lastScrapePreview,
    handleChange,
    validate,
    reset,
    setErrors,
    testConnection,
    testScrape,
  };
}

export default KeylessScraperCredentialFormFields;
