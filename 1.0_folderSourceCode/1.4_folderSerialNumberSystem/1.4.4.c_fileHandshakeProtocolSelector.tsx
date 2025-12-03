// ============================================
// PROTOCOL OS - HANDSHAKE PROTOCOL SELECTOR
// ============================================
// Address: 1.4.4.c
// Purpose: Protocol Selection for Handshake Configuration
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import type { ProtocolConfig } from './1.4.4.a_fileHandshakeAccordionSection';
import type { ResourceType } from '../1.4.1.b_fileResourceSerialNumberGenerator';

/**
 * Handshake Protocol Selector
 * 
 * Provides a comprehensive interface for selecting
 * authentication and API protocols:
 * - Grid view with icons
 * - Search and filter
 * - Category grouping
 * - Protocol details
 */

/**
 * Protocol category
 */
export type ProtocolCategory = 'oauth' | 'api' | 'realtime' | 'legacy' | 'custom';

/**
 * Protocol metadata for display
 */
export interface ProtocolDisplayInfo {
  id: string;
  name: string;
  type: ResourceType;
  category: ProtocolCategory;
  icon: string;
  description: string;
  version?: string;
  isPopular?: boolean;
  isDeprecated?: boolean;
  documentation?: string;
}

/**
 * Built-in protocol display info
 */
export const PROTOCOL_DISPLAY_INFO: Record<string, ProtocolDisplayInfo> = {
  'oauth-pkce': {
    id: 'oauth-pkce',
    name: 'OAuth 2.0 + PKCE',
    type: 'oauth',
    category: 'oauth',
    icon: '🔐',
    description: 'Secure OAuth with Proof Key for Code Exchange',
    isPopular: true,
  },
  'oauth-authcode': {
    id: 'oauth-authcode',
    name: 'OAuth 2.0 Auth Code',
    type: 'oauth',
    category: 'oauth',
    icon: '🔑',
    description: 'Standard OAuth authorization code flow',
    isPopular: true,
  },
  'oauth-implicit': {
    id: 'oauth-implicit',
    name: 'OAuth 2.0 Implicit',
    type: 'oauth',
    category: 'oauth',
    icon: '⚠️',
    description: 'Legacy implicit flow (deprecated)',
    isDeprecated: true,
  },
  'oauth-client-credentials': {
    id: 'oauth-client-credentials',
    name: 'Client Credentials',
    type: 'oauth',
    category: 'oauth',
    icon: '🤖',
    description: 'Machine-to-machine authentication',
    isPopular: true,
  },
  'api-key': {
    id: 'api-key',
    name: 'API Key',
    type: 'apikey',
    category: 'api',
    icon: '🔒',
    description: 'Simple API key authentication',
    isPopular: true,
  },
  'basic-auth': {
    id: 'basic-auth',
    name: 'Basic Auth',
    type: 'apikey',
    category: 'api',
    icon: '👤',
    description: 'HTTP Basic Authentication',
  },
  'bearer-token': {
    id: 'bearer-token',
    name: 'Bearer Token',
    type: 'apikey',
    category: 'api',
    icon: '🎫',
    description: 'Bearer token in Authorization header',
  },
  'graphql': {
    id: 'graphql',
    name: 'GraphQL',
    type: 'graphql',
    category: 'api',
    icon: '◈',
    description: 'GraphQL query endpoint',
    isPopular: true,
  },
  'rest': {
    id: 'rest',
    name: 'REST API',
    type: 'rest',
    category: 'api',
    icon: '🌐',
    description: 'RESTful HTTP API',
    isPopular: true,
  },
  'websocket': {
    id: 'websocket',
    name: 'WebSocket',
    type: 'websocket',
    category: 'realtime',
    icon: '⚡',
    description: 'Real-time bidirectional connection',
  },
  'sse': {
    id: 'sse',
    name: 'Server-Sent Events',
    type: 'websocket',
    category: 'realtime',
    icon: '📡',
    description: 'Server-to-client event streaming',
  },
  'soap': {
    id: 'soap',
    name: 'SOAP/XML',
    type: 'soap',
    category: 'legacy',
    icon: '📄',
    description: 'XML-based SOAP web service',
  },
  'github': {
    id: 'github',
    name: 'GitHub API',
    type: 'github',
    category: 'api',
    icon: '🐙',
    description: 'GitHub REST or GraphQL API',
    isPopular: true,
  },
  'scraper': {
    id: 'scraper',
    name: 'Web Scraper',
    type: 'scraper',
    category: 'custom',
    icon: '🕷️',
    description: 'Public web scraping (no auth)',
  },
  'custom': {
    id: 'custom',
    name: 'Custom Protocol',
    type: 'custom',
    category: 'custom',
    icon: '⚙️',
    description: 'Custom or unsupported protocol',
  },
};

/**
 * Category labels
 */
const CATEGORY_LABELS: Record<ProtocolCategory, string> = {
  oauth: 'OAuth & Authentication',
  api: 'API Protocols',
  realtime: 'Real-time',
  legacy: 'Legacy',
  custom: 'Custom',
};

/**
 * Category icons
 */
const CATEGORY_ICONS: Record<ProtocolCategory, string> = {
  oauth: '🔐',
  api: '🌐',
  realtime: '⚡',
  legacy: '📜',
  custom: '⚙️',
};

/**
 * Handshake protocol selector props
 */
export interface HandshakeProtocolSelectorProps {
  /** Selected protocol */
  selectedProtocol: ProtocolConfig | undefined;
  
  /** Available protocols */
  availableProtocols: ProtocolConfig[];
  
  /** Change handler */
  onChange: (protocol: ProtocolConfig) => void;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Is in edit mode */
  isEditing?: boolean;
  
  /** Show search */
  showSearch?: boolean;
  
  /** Show categories */
  showCategories?: boolean;
  
  /** Show popular first */
  showPopularFirst?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Handshake Protocol Selector Component
 */
export const HandshakeProtocolSelector: React.FC<HandshakeProtocolSelectorProps> = ({
  selectedProtocol,
  availableProtocols,
  onChange,
  disabled = false,
  isEditing = false,
  showSearch = true,
  showCategories = true,
  showPopularFirst = true,
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<ProtocolCategory>>(
    new Set(['oauth', 'api'])
  );

  // ============================================
  // COMPUTED
  // ============================================

  const enrichedProtocols = useMemo(() => {
    return availableProtocols.map(protocol => ({
      ...protocol,
      displayInfo: PROTOCOL_DISPLAY_INFO[protocol.id] || {
        id: protocol.id,
        name: protocol.name,
        type: protocol.type,
        category: 'custom' as ProtocolCategory,
        icon: '📦',
        description: protocol.description || '',
      },
    }));
  }, [availableProtocols]);

  const filteredProtocols = useMemo(() => {
    if (!searchQuery.trim()) return enrichedProtocols;
    
    const query = searchQuery.toLowerCase();
    return enrichedProtocols.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.displayInfo.description.toLowerCase().includes(query) ||
      p.type.toLowerCase().includes(query)
    );
  }, [enrichedProtocols, searchQuery]);

  const groupedProtocols = useMemo(() => {
    const groups: Record<ProtocolCategory, typeof enrichedProtocols> = {
      oauth: [],
      api: [],
      realtime: [],
      legacy: [],
      custom: [],
    };
    
    for (const protocol of filteredProtocols) {
      const category = protocol.displayInfo.category;
      groups[category].push(protocol);
    }
    
    // Sort by popularity within each category
    if (showPopularFirst) {
      for (const category of Object.keys(groups) as ProtocolCategory[]) {
        groups[category].sort((a, b) => {
          if (a.displayInfo.isPopular && !b.displayInfo.isPopular) return -1;
          if (!a.displayInfo.isPopular && b.displayInfo.isPopular) return 1;
          return 0;
        });
      }
    }
    
    return groups;
  }, [filteredProtocols, showPopularFirst]);

  const popularProtocols = useMemo(() => {
    return enrichedProtocols.filter(p => p.displayInfo.isPopular);
  }, [enrichedProtocols]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleToggleCategory = useCallback((category: ProtocolCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleSelectProtocol = useCallback((protocol: typeof enrichedProtocols[0]) => {
    if (disabled || !isEditing) return;
    onChange({
      id: protocol.id,
      name: protocol.name,
      type: protocol.type,
      version: protocol.version,
      description: protocol.displayInfo.description,
    });
  }, [disabled, isEditing, onChange]);

  // ============================================
  // RENDER
  // ============================================

  // Read-only mode
  if (!isEditing) {
    const displayInfo = selectedProtocol 
      ? PROTOCOL_DISPLAY_INFO[selectedProtocol.id] || { icon: '📦', description: '' }
      : null;
    
    return (
      <div className={`handshake-protocol-selector handshake-protocol-selector--readonly ${className}`}>
        <div className="handshake-protocol-selector__label">Protocol</div>
        {selectedProtocol ? (
          <div className="handshake-protocol-selector__selected">
            <span className="handshake-protocol-selector__selected-icon">
              {displayInfo?.icon || '📦'}
            </span>
            <div className="handshake-protocol-selector__selected-info">
              <span className="handshake-protocol-selector__selected-name">
                {selectedProtocol.name}
              </span>
              {selectedProtocol.version && (
                <span className="handshake-protocol-selector__selected-version">
                  v{selectedProtocol.version}
                </span>
              )}
              <span className="handshake-protocol-selector__selected-desc">
                {displayInfo?.description || selectedProtocol.description}
              </span>
            </div>
          </div>
        ) : (
          <div className="handshake-protocol-selector__empty">
            No protocol selected
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className={`handshake-protocol-selector handshake-protocol-selector--editing ${className}`}>
      <div className="handshake-protocol-selector__label">
        Select Protocol
      </div>

      {/* Search */}
      {showSearch && (
        <div className="handshake-protocol-selector__search">
          <input
            type="text"
            className="handshake-protocol-selector__search-input"
            placeholder="Search protocols..."
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={disabled}
          />
          {searchQuery && (
            <button
              type="button"
              className="handshake-protocol-selector__search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Popular Protocols Quick Access */}
      {!searchQuery && popularProtocols.length > 0 && (
        <div className="handshake-protocol-selector__popular">
          <div className="handshake-protocol-selector__popular-label">
            ⭐ Popular
          </div>
          <div className="handshake-protocol-selector__popular-grid">
            {popularProtocols.map(protocol => (
              <button
                key={protocol.id}
                type="button"
                className={`handshake-protocol-selector__popular-item ${
                  selectedProtocol?.id === protocol.id 
                    ? 'handshake-protocol-selector__popular-item--selected' 
                    : ''
                }`}
                onClick={() => handleSelectProtocol(protocol)}
                disabled={disabled}
                title={protocol.displayInfo.description}
              >
                <span className="handshake-protocol-selector__popular-icon">
                  {protocol.displayInfo.icon}
                </span>
                <span className="handshake-protocol-selector__popular-name">
                  {protocol.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categorized List */}
      {showCategories ? (
        <div className="handshake-protocol-selector__categories">
          {(Object.keys(groupedProtocols) as ProtocolCategory[]).map(category => {
            const protocols = groupedProtocols[category];
            if (protocols.length === 0) return null;
            
            const isExpanded = expandedCategories.has(category);
            
            return (
              <div key={category} className="handshake-protocol-selector__category">
                <button
                  type="button"
                  className={`handshake-protocol-selector__category-header ${
                    isExpanded ? 'handshake-protocol-selector__category-header--expanded' : ''
                  }`}
                  onClick={() => handleToggleCategory(category)}
                >
                  <span className="handshake-protocol-selector__category-icon">
                    {CATEGORY_ICONS[category]}
                  </span>
                  <span className="handshake-protocol-selector__category-name">
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="handshake-protocol-selector__category-count">
                    ({protocols.length})
                  </span>
                  <span className="handshake-protocol-selector__category-toggle">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="handshake-protocol-selector__category-list">
                    {protocols.map(protocol => (
                      <ProtocolItem
                        key={protocol.id}
                        protocol={protocol}
                        isSelected={selectedProtocol?.id === protocol.id}
                        onSelect={() => handleSelectProtocol(protocol)}
                        disabled={disabled}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Flat list
        <div className="handshake-protocol-selector__list">
          {filteredProtocols.map(protocol => (
            <ProtocolItem
              key={protocol.id}
              protocol={protocol}
              isSelected={selectedProtocol?.id === protocol.id}
              onSelect={() => handleSelectProtocol(protocol)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredProtocols.length === 0 && searchQuery && (
        <div className="handshake-protocol-selector__no-results">
          <p>No protocols found matching "{searchQuery}"</p>
          <button
            type="button"
            className="handshake-protocol-selector__clear-search"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Protocol item component
 */
interface ProtocolItemProps {
  protocol: {
    id: string;
    name: string;
    type: ResourceType;
    version?: string;
    displayInfo: ProtocolDisplayInfo;
  };
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

const ProtocolItem: React.FC<ProtocolItemProps> = ({
  protocol,
  isSelected,
  onSelect,
  disabled,
}) => {
  return (
    <button
      type="button"
      className={`handshake-protocol-selector__item ${
        isSelected ? 'handshake-protocol-selector__item--selected' : ''
      } ${protocol.displayInfo.isDeprecated ? 'handshake-protocol-selector__item--deprecated' : ''}`}
      onClick={onSelect}
      disabled={disabled}
    >
      <span className="handshake-protocol-selector__item-icon">
        {protocol.displayInfo.icon}
      </span>
      <div className="handshake-protocol-selector__item-info">
        <span className="handshake-protocol-selector__item-name">
          {protocol.name}
          {protocol.version && (
            <span className="handshake-protocol-selector__item-version">
              v{protocol.version}
            </span>
          )}
        </span>
        <span className="handshake-protocol-selector__item-desc">
          {protocol.displayInfo.description}
        </span>
      </div>
      {protocol.displayInfo.isPopular && (
        <span className="handshake-protocol-selector__item-badge">⭐</span>
      )}
      {protocol.displayInfo.isDeprecated && (
        <span className="handshake-protocol-selector__item-badge handshake-protocol-selector__item-badge--deprecated">
          ⚠️
        </span>
      )}
      {isSelected && (
        <span className="handshake-protocol-selector__item-check">✓</span>
      )}
    </button>
  );
};

/**
 * Compact protocol selector (dropdown style)
 */
export interface ProtocolDropdownSelectorProps {
  selectedProtocol: ProtocolConfig | undefined;
  availableProtocols: ProtocolConfig[];
  onChange: (protocol: ProtocolConfig) => void;
  disabled?: boolean;
  className?: string;
}

export const ProtocolDropdownSelector: React.FC<ProtocolDropdownSelectorProps> = ({
  selectedProtocol,
  availableProtocols,
  onChange,
  disabled = false,
  className = '',
}) => {
  const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const protocol = availableProtocols.find(p => p.id === event.target.value);
    if (protocol) {
      onChange(protocol);
    }
  }, [availableProtocols, onChange]);

  return (
    <div className={`protocol-dropdown-selector ${className}`}>
      <select
        className="protocol-dropdown-selector__select"
        value={selectedProtocol?.id || ''}
        onChange={handleChange}
        disabled={disabled}
      >
        <option value="">Select protocol...</option>
        {availableProtocols.map(protocol => {
          const displayInfo = PROTOCOL_DISPLAY_INFO[protocol.id];
          return (
            <option key={protocol.id} value={protocol.id}>
              {displayInfo?.icon || '📦'} {protocol.name}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default HandshakeProtocolSelector;
