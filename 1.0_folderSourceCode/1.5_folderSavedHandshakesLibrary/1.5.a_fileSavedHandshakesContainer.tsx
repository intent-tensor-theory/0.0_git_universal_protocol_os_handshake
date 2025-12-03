// ============================================
// PROTOCOL OS - SAVED HANDSHAKES CONTAINER
// ============================================
// Address: 1.5.a
// Purpose: Main Container for Saved Handshakes Library
// ============================================

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SavedHandshakeCard } from './1.5.b_fileSavedHandshakeCard';
import { 
  SavedHandshake, 
  HandshakeVersion,
  createNewVersion,
  getLatestVersion,
  compareVersions 
} from './1.5.e_fileSavedHandshakeVersioningLogic';
import './1.5.f_fileSavedHandshakesLibrary.css';

/**
 * Saved Handshakes Container
 * 
 * Manages the library of saved handshake templates with:
 * - Search and filtering
 * - Category organization
 * - Sort options
 * - Grid/list views
 * - Import/export functionality
 * 
 * Implements Intent Tensor Theory principles for
 * recursive template management and versioning.
 */

/**
 * Sort options
 */
export type SortOption = 
  | 'name-asc'
  | 'name-desc'
  | 'date-newest'
  | 'date-oldest'
  | 'usage-most'
  | 'usage-least'
  | 'protocol';

/**
 * View mode
 */
export type ViewMode = 'grid' | 'list';

/**
 * Filter criteria
 */
export interface FilterCriteria {
  /** Search query */
  searchQuery: string;
  
  /** Protocol types */
  protocols: string[];
  
  /** Handshake types */
  handshakeTypes: string[];
  
  /** Categories */
  categories: string[];
  
  /** Tags */
  tags: string[];
  
  /** Date range */
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  
  /** Show favorites only */
  favoritesOnly: boolean;
  
  /** Show archived */
  showArchived: boolean;
}

/**
 * Saved handshakes container props
 */
export interface SavedHandshakesContainerProps {
  /** Saved handshakes */
  handshakes: SavedHandshake[];
  
  /** Available categories */
  categories?: string[];
  
  /** Available tags */
  availableTags?: string[];
  
  /** On handshake select */
  onSelect?: (handshake: SavedHandshake) => void;
  
  /** On handshake update */
  onUpdate?: (handshake: SavedHandshake) => void;
  
  /** On handshake delete */
  onDelete?: (handshakeId: string) => void;
  
  /** On handshake duplicate */
  onDuplicate?: (handshake: SavedHandshake) => void;
  
  /** On handshake export */
  onExport?: (handshakes: SavedHandshake[]) => void;
  
  /** On handshakes import */
  onImport?: (file: File) => void;
  
  /** Default view mode */
  defaultViewMode?: ViewMode;
  
  /** Default sort option */
  defaultSort?: SortOption;
  
  /** Show import/export */
  showImportExport?: boolean;
  
  /** Allow multi-select */
  allowMultiSelect?: boolean;
  
  /** Is loading */
  isLoading?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Default filter criteria
 */
const DEFAULT_FILTERS: FilterCriteria = {
  searchQuery: '',
  protocols: [],
  handshakeTypes: [],
  categories: [],
  tags: [],
  favoritesOnly: false,
  showArchived: false,
};

/**
 * Saved Handshakes Container Component
 */
export const SavedHandshakesContainer: React.FC<SavedHandshakesContainerProps> = ({
  handshakes,
  categories = [],
  availableTags = [],
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onExport,
  onImport,
  defaultViewMode = 'grid',
  defaultSort = 'date-newest',
  showImportExport = true,
  allowMultiSelect = false,
  isLoading = false,
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [sortOption, setSortOption] = useState<SortOption>(defaultSort);
  const [filters, setFilters] = useState<FilterCriteria>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // ============================================
  // COMPUTED
  // ============================================

  const filteredHandshakes = useMemo(() => {
    return handshakes.filter(h => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          h.name,
          h.description || '',
          h.protocol.name,
          h.category || '',
          ...(h.tags || []),
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }
      
      // Protocol filter
      if (filters.protocols.length > 0) {
        if (!filters.protocols.includes(h.protocol.type)) {
          return false;
        }
      }
      
      // Handshake type filter
      if (filters.handshakeTypes.length > 0) {
        if (!filters.handshakeTypes.includes(h.handshakeType)) {
          return false;
        }
      }
      
      // Category filter
      if (filters.categories.length > 0) {
        if (!h.category || !filters.categories.includes(h.category)) {
          return false;
        }
      }
      
      // Tags filter
      if (filters.tags.length > 0) {
        const handshakeTags = h.tags || [];
        if (!filters.tags.some(tag => handshakeTags.includes(tag))) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateRange) {
        const updatedAt = h.updatedAt.getTime();
        if (filters.dateRange.start && updatedAt < filters.dateRange.start.getTime()) {
          return false;
        }
        if (filters.dateRange.end && updatedAt > filters.dateRange.end.getTime()) {
          return false;
        }
      }
      
      // Favorites filter
      if (filters.favoritesOnly && !h.isFavorite) {
        return false;
      }
      
      // Archived filter
      if (!filters.showArchived && h.isArchived) {
        return false;
      }
      
      return true;
    });
  }, [handshakes, filters]);

  const sortedHandshakes = useMemo(() => {
    const sorted = [...filteredHandshakes];
    
    switch (sortOption) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'date-newest':
        sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case 'date-oldest':
        sorted.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
        break;
      case 'usage-most':
        sorted.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'usage-least':
        sorted.sort((a, b) => (a.usageCount || 0) - (b.usageCount || 0));
        break;
      case 'protocol':
        sorted.sort((a, b) => a.protocol.name.localeCompare(b.protocol.name));
        break;
    }
    
    // Always put favorites first
    sorted.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
    
    return sorted;
  }, [filteredHandshakes, sortOption]);

  const statistics = useMemo(() => {
    return {
      total: handshakes.length,
      filtered: filteredHandshakes.length,
      favorites: handshakes.filter(h => h.isFavorite).length,
      archived: handshakes.filter(h => h.isArchived).length,
      byProtocol: handshakes.reduce((acc, h) => {
        acc[h.protocol.type] = (acc[h.protocol.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: handshakes.reduce((acc, h) => {
        const cat = h.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [handshakes, filteredHandshakes]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>(availableTags);
    handshakes.forEach(h => {
      (h.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [handshakes, availableTags]);

  const allCategories = useMemo(() => {
    const catSet = new Set<string>(categories);
    handshakes.forEach(h => {
      if (h.category) catSet.add(h.category);
    });
    return Array.from(catSet).sort();
  }, [handshakes, categories]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearchChange = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const handleFilterChange = useCallback((key: keyof FilterCriteria, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleSelect = useCallback((handshake: SavedHandshake) => {
    if (allowMultiSelect) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(handshake.id)) {
          next.delete(handshake.id);
        } else {
          next.add(handshake.id);
        }
        return next;
      });
    }
    onSelect?.(handshake);
  }, [allowMultiSelect, onSelect]);

  const handleToggleFavorite = useCallback((handshake: SavedHandshake) => {
    onUpdate?.({
      ...handshake,
      isFavorite: !handshake.isFavorite,
      updatedAt: new Date(),
    });
  }, [onUpdate]);

  const handleToggleArchive = useCallback((handshake: SavedHandshake) => {
    onUpdate?.({
      ...handshake,
      isArchived: !handshake.isArchived,
      updatedAt: new Date(),
    });
  }, [onUpdate]);

  const handleUpdateCategory = useCallback((handshake: SavedHandshake, category: string) => {
    onUpdate?.({
      ...handshake,
      category,
      updatedAt: new Date(),
    });
  }, [onUpdate]);

  const handleUpdateTags = useCallback((handshake: SavedHandshake, tags: string[]) => {
    onUpdate?.({
      ...handshake,
      tags,
      updatedAt: new Date(),
    });
  }, [onUpdate]);

  const handleExportSelected = useCallback(() => {
    if (selectedIds.size === 0) {
      onExport?.(sortedHandshakes);
    } else {
      const selected = sortedHandshakes.filter(h => selectedIds.has(h.id));
      onExport?.(selected);
    }
  }, [selectedIds, sortedHandshakes, onExport]);

  const handleImportClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onImport?.(file);
      }
    };
    input.click();
  }, [onImport]);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === sortedHandshakes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedHandshakes.map(h => h.id)));
    }
  }, [selectedIds.size, sortedHandshakes]);

  const handleExpandCard = useCallback((handshakeId: string | null) => {
    setExpandedCardId(prev => prev === handshakeId ? null : handshakeId);
  }, []);

  // ============================================
  // RENDER
  // ============================================

  const hasActiveFilters = 
    filters.searchQuery ||
    filters.protocols.length > 0 ||
    filters.handshakeTypes.length > 0 ||
    filters.categories.length > 0 ||
    filters.tags.length > 0 ||
    filters.favoritesOnly ||
    filters.showArchived;

  return (
    <div className={`saved-handshakes-container ${className}`}>
      {/* Header */}
      <div className="saved-handshakes-container__header">
        <div className="saved-handshakes-container__header-left">
          <h2 className="saved-handshakes-container__title">
            📚 Saved Handshakes
          </h2>
          <span className="saved-handshakes-container__count">
            {statistics.filtered} of {statistics.total}
          </span>
        </div>
        
        <div className="saved-handshakes-container__header-right">
          {showImportExport && (
            <div className="saved-handshakes-container__import-export">
              {onImport && (
                <button
                  type="button"
                  className="saved-handshakes-container__btn saved-handshakes-container__btn--secondary"
                  onClick={handleImportClick}
                >
                  📥 Import
                </button>
              )}
              {onExport && (
                <button
                  type="button"
                  className="saved-handshakes-container__btn saved-handshakes-container__btn--secondary"
                  onClick={handleExportSelected}
                >
                  📤 Export {selectedIds.size > 0 ? `(${selectedIds.size})` : 'All'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="saved-handshakes-container__toolbar">
        {/* Search */}
        <div className="saved-handshakes-container__search">
          <span className="saved-handshakes-container__search-icon">🔍</span>
          <input
            type="text"
            className="saved-handshakes-container__search-input"
            placeholder="Search handshakes..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {filters.searchQuery && (
            <button
              type="button"
              className="saved-handshakes-container__search-clear"
              onClick={() => handleSearchChange('')}
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="saved-handshakes-container__quick-filters">
          <button
            type="button"
            className={`saved-handshakes-container__quick-filter ${filters.favoritesOnly ? 'saved-handshakes-container__quick-filter--active' : ''}`}
            onClick={() => handleFilterChange('favoritesOnly', !filters.favoritesOnly)}
          >
            ⭐ Favorites ({statistics.favorites})
          </button>
          
          <button
            type="button"
            className={`saved-handshakes-container__quick-filter ${filters.showArchived ? 'saved-handshakes-container__quick-filter--active' : ''}`}
            onClick={() => handleFilterChange('showArchived', !filters.showArchived)}
          >
            📦 Archived ({statistics.archived})
          </button>
          
          <button
            type="button"
            className={`saved-handshakes-container__filter-toggle ${isFilterPanelOpen ? 'saved-handshakes-container__filter-toggle--active' : ''}`}
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          >
            🎛️ Filters
            {hasActiveFilters && (
              <span className="saved-handshakes-container__filter-badge">●</span>
            )}
          </button>
        </div>

        {/* View Controls */}
        <div className="saved-handshakes-container__view-controls">
          {/* Sort */}
          <select
            className="saved-handshakes-container__sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="date-newest">Newest First</option>
            <option value="date-oldest">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="usage-most">Most Used</option>
            <option value="usage-least">Least Used</option>
            <option value="protocol">By Protocol</option>
          </select>
          
          {/* View Mode */}
          <div className="saved-handshakes-container__view-mode">
            <button
              type="button"
              className={`saved-handshakes-container__view-btn ${viewMode === 'grid' ? 'saved-handshakes-container__view-btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ▦
            </button>
            <button
              type="button"
              className={`saved-handshakes-container__view-btn ${viewMode === 'list' ? 'saved-handshakes-container__view-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterPanelOpen && (
        <div className="saved-handshakes-container__filter-panel">
          {/* Categories */}
          <div className="saved-handshakes-container__filter-group">
            <label className="saved-handshakes-container__filter-label">
              Categories
            </label>
            <div className="saved-handshakes-container__filter-options">
              {allCategories.map(category => (
                <button
                  key={category}
                  type="button"
                  className={`saved-handshakes-container__filter-option ${
                    filters.categories.includes(category) ? 'saved-handshakes-container__filter-option--selected' : ''
                  }`}
                  onClick={() => {
                    const newCategories = filters.categories.includes(category)
                      ? filters.categories.filter(c => c !== category)
                      : [...filters.categories, category];
                    handleFilterChange('categories', newCategories);
                  }}
                >
                  {category}
                  <span className="saved-handshakes-container__filter-option-count">
                    {statistics.byCategory[category] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="saved-handshakes-container__filter-group">
              <label className="saved-handshakes-container__filter-label">
                Tags
              </label>
              <div className="saved-handshakes-container__filter-options">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`saved-handshakes-container__filter-option saved-handshakes-container__filter-option--tag ${
                      filters.tags.includes(tag) ? 'saved-handshakes-container__filter-option--selected' : ''
                    }`}
                    onClick={() => {
                      const newTags = filters.tags.includes(tag)
                        ? filters.tags.filter(t => t !== tag)
                        : [...filters.tags, tag];
                      handleFilterChange('tags', newTags);
                    }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              className="saved-handshakes-container__clear-filters"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Multi-Select Actions */}
      {allowMultiSelect && selectedIds.size > 0 && (
        <div className="saved-handshakes-container__selection-bar">
          <span className="saved-handshakes-container__selection-count">
            {selectedIds.size} selected
          </span>
          <button
            type="button"
            className="saved-handshakes-container__selection-action"
            onClick={handleSelectAll}
          >
            {selectedIds.size === sortedHandshakes.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}

      {/* Content */}
      <div className={`saved-handshakes-container__content saved-handshakes-container__content--${viewMode}`}>
        {isLoading ? (
          <div className="saved-handshakes-container__loading">
            <span className="saved-handshakes-container__loading-spinner">⏳</span>
            <span>Loading handshakes...</span>
          </div>
        ) : sortedHandshakes.length > 0 ? (
          <div className={`saved-handshakes-container__${viewMode}`}>
            {sortedHandshakes.map(handshake => (
              <SavedHandshakeCard
                key={handshake.id}
                handshake={handshake}
                isSelected={selectedIds.has(handshake.id)}
                isExpanded={expandedCardId === handshake.id}
                viewMode={viewMode}
                onSelect={() => handleSelect(handshake)}
                onToggleFavorite={() => handleToggleFavorite(handshake)}
                onToggleArchive={() => handleToggleArchive(handshake)}
                onDuplicate={() => onDuplicate?.(handshake)}
                onDelete={() => onDelete?.(handshake.id)}
                onUpdateCategory={(category) => handleUpdateCategory(handshake, category)}
                onUpdateTags={(tags) => handleUpdateTags(handshake, tags)}
                onExpand={() => handleExpandCard(handshake.id)}
                availableCategories={allCategories}
                availableTags={allTags}
              />
            ))}
          </div>
        ) : (
          <div className="saved-handshakes-container__empty">
            <div className="saved-handshakes-container__empty-icon">
              {hasActiveFilters ? '🔍' : '📭'}
            </div>
            <div className="saved-handshakes-container__empty-title">
              {hasActiveFilters ? 'No matching handshakes' : 'No saved handshakes'}
            </div>
            <div className="saved-handshakes-container__empty-message">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search query'
                : 'Save a handshake configuration to see it here'}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                className="saved-handshakes-container__empty-action"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Compact library view
 */
export interface CompactLibraryViewProps {
  handshakes: SavedHandshake[];
  onSelect: (handshake: SavedHandshake) => void;
  maxVisible?: number;
  className?: string;
}

export const CompactLibraryView: React.FC<CompactLibraryViewProps> = ({
  handshakes,
  onSelect,
  maxVisible = 5,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filtered = useMemo(() => {
    if (!searchQuery) return handshakes.slice(0, maxVisible);
    
    const query = searchQuery.toLowerCase();
    return handshakes
      .filter(h => h.name.toLowerCase().includes(query))
      .slice(0, maxVisible);
  }, [handshakes, searchQuery, maxVisible]);
  
  return (
    <div className={`compact-library-view ${className}`}>
      <input
        type="text"
        className="compact-library-view__search"
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="compact-library-view__list">
        {filtered.map(h => (
          <button
            key={h.id}
            type="button"
            className="compact-library-view__item"
            onClick={() => onSelect(h)}
          >
            <span className="compact-library-view__icon">
              {h.isFavorite ? '⭐' : '📋'}
            </span>
            <span className="compact-library-view__name">{h.name}</span>
            <span className="compact-library-view__protocol">{h.protocol.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SavedHandshakesContainer;
