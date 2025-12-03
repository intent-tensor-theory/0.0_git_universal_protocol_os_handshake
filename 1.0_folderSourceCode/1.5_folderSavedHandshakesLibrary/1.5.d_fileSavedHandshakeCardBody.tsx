// ============================================
// PROTOCOL OS - SAVED HANDSHAKE CARD BODY
// ============================================
// Address: 1.5.d
// Purpose: Card Body with Configuration Details
// ============================================

import React, { useState, useCallback, useMemo } from 'react';
import { SavedHandshake } from './1.5.e_fileSavedHandshakeVersioningLogic';
import type { ViewMode } from './1.5.a_fileSavedHandshakesContainer';

/**
 * Saved Handshake Card Body
 * 
 * Displays the body section of a saved handshake card with:
 * - Configuration summary
 * - Request preview
 * - Tags with editing
 * - Category selection
 * - Notes/description
 */

/**
 * Card body props
 */
export interface SavedHandshakeCardBodyProps {
  /** Handshake data */
  handshake: SavedHandshake;
  
  /** View mode */
  viewMode?: ViewMode;
  
  /** Is category editing */
  isCategoryEditing?: boolean;
  
  /** Is tags editing */
  isTagsEditing?: boolean;
  
  /** Available categories */
  availableCategories?: string[];
  
  /** Available tags */
  availableTags?: string[];
  
  /** On category change */
  onCategoryChange?: (category: string) => void;
  
  /** On tags change */
  onTagsChange?: (tags: string[]) => void;
  
  /** On cancel category edit */
  onCancelCategoryEdit?: () => void;
  
  /** On cancel tags edit */
  onCancelTagsEdit?: () => void;
  
  /** Show configuration preview */
  showConfigPreview?: boolean;
  
  /** Show request preview */
  showRequestPreview?: boolean;
  
  /** Custom class name */
  className?: string;
}

/**
 * Saved Handshake Card Body Component
 */
export const SavedHandshakeCardBody: React.FC<SavedHandshakeCardBodyProps> = ({
  handshake,
  viewMode = 'grid',
  isCategoryEditing = false,
  isTagsEditing = false,
  availableCategories = [],
  availableTags = [],
  onCategoryChange,
  onTagsChange,
  onCancelCategoryEdit,
  onCancelTagsEdit,
  showConfigPreview = true,
  showRequestPreview = true,
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(handshake.tags || []);

  // ============================================
  // COMPUTED
  // ============================================

  const configSummary = useMemo(() => {
    const summary: Array<{ label: string; value: string }> = [];
    
    // Protocol type
    summary.push({
      label: 'Protocol',
      value: handshake.protocol.name,
    });
    
    // Handshake type
    summary.push({
      label: 'Type',
      value: capitalizeFirst(handshake.handshakeType),
    });
    
    // Request method and URL (if available)
    if (handshake.configuration?.request) {
      const { method, url } = handshake.configuration.request;
      if (method) {
        summary.push({
          label: 'Method',
          value: method,
        });
      }
      if (url) {
        summary.push({
          label: 'URL',
          value: truncateUrl(url, 40),
        });
      }
    }
    
    // Credentials type (if available)
    if (handshake.configuration?.credentials?.type) {
      summary.push({
        label: 'Auth',
        value: capitalizeFirst(handshake.configuration.credentials.type),
      });
    }
    
    return summary;
  }, [handshake]);

  const requestPreview = useMemo(() => {
    if (!handshake.configuration?.request) return null;
    
    const { method, url, headers, body } = handshake.configuration.request;
    
    return {
      method: method || 'GET',
      url: url || '',
      headerCount: headers ? Object.keys(headers).length : 0,
      hasBody: !!body,
    };
  }, [handshake.configuration?.request]);

  const suggestedTags = useMemo(() => {
    return availableTags.filter(tag => !selectedTags.includes(tag));
  }, [availableTags, selectedTags]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleAddTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags(prev => [...prev, trimmedTag]);
    }
    setNewTag('');
  }, [selectedTags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  }, []);

  const handleSaveTags = useCallback(() => {
    onTagsChange?.(selectedTags);
  }, [selectedTags, onTagsChange]);

  const handleCancelTags = useCallback(() => {
    setSelectedTags(handshake.tags || []);
    onCancelTagsEdit?.();
  }, [handshake.tags, onCancelTagsEdit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag(newTag);
    }
  }, [newTag, handleAddTag]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`saved-handshake-card-body saved-handshake-card-body--${viewMode} ${className}`}>
      {/* Description */}
      {handshake.description && viewMode === 'grid' && (
        <p className="saved-handshake-card-body__description">
          {handshake.description}
        </p>
      )}

      {/* Configuration Summary */}
      {showConfigPreview && (
        <div className="saved-handshake-card-body__config">
          <h4 className="saved-handshake-card-body__section-title">Configuration</h4>
          <div className="saved-handshake-card-body__config-grid">
            {configSummary.map((item, index) => (
              <div key={index} className="saved-handshake-card-body__config-item">
                <span className="saved-handshake-card-body__config-label">
                  {item.label}
                </span>
                <span className="saved-handshake-card-body__config-value">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Preview */}
      {showRequestPreview && requestPreview && (
        <div className="saved-handshake-card-body__request">
          <div className="saved-handshake-card-body__request-line">
            <span className={`saved-handshake-card-body__method saved-handshake-card-body__method--${requestPreview.method.toLowerCase()}`}>
              {requestPreview.method}
            </span>
            <span className="saved-handshake-card-body__url">
              {requestPreview.url || '(No URL configured)'}
            </span>
          </div>
          <div className="saved-handshake-card-body__request-meta">
            {requestPreview.headerCount > 0 && (
              <span className="saved-handshake-card-body__request-meta-item">
                📋 {requestPreview.headerCount} header{requestPreview.headerCount !== 1 ? 's' : ''}
              </span>
            )}
            {requestPreview.hasBody && (
              <span className="saved-handshake-card-body__request-meta-item">
                📦 Has body
              </span>
            )}
          </div>
        </div>
      )}

      {/* Category */}
      <div className="saved-handshake-card-body__category">
        <span className="saved-handshake-card-body__category-label">Category:</span>
        {isCategoryEditing ? (
          <div className="saved-handshake-card-body__category-edit">
            <select
              className="saved-handshake-card-body__category-select"
              value={handshake.category || ''}
              onChange={(e) => onCategoryChange?.(e.target.value)}
              autoFocus
            >
              <option value="">Uncategorized</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="button"
              className="saved-handshake-card-body__category-cancel"
              onClick={onCancelCategoryEdit}
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="saved-handshake-card-body__category-value">
            {handshake.category || 'Uncategorized'}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="saved-handshake-card-body__tags">
        <span className="saved-handshake-card-body__tags-label">Tags:</span>
        
        {isTagsEditing ? (
          <div className="saved-handshake-card-body__tags-edit">
            {/* Current Tags */}
            <div className="saved-handshake-card-body__tags-list">
              {selectedTags.map(tag => (
                <span key={tag} className="saved-handshake-card-body__tag saved-handshake-card-body__tag--editable">
                  #{tag}
                  <button
                    type="button"
                    className="saved-handshake-card-body__tag-remove"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            {/* Add New Tag */}
            <div className="saved-handshake-card-body__tag-input-wrapper">
              <input
                type="text"
                className="saved-handshake-card-body__tag-input"
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {newTag && (
                <button
                  type="button"
                  className="saved-handshake-card-body__tag-add"
                  onClick={() => handleAddTag(newTag)}
                >
                  +
                </button>
              )}
            </div>
            
            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div className="saved-handshake-card-body__tag-suggestions">
                <span className="saved-handshake-card-body__tag-suggestions-label">
                  Suggestions:
                </span>
                {suggestedTags.slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className="saved-handshake-card-body__tag-suggestion"
                    onClick={() => handleAddTag(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
            
            {/* Actions */}
            <div className="saved-handshake-card-body__tags-actions">
              <button
                type="button"
                className="saved-handshake-card-body__tags-cancel"
                onClick={handleCancelTags}
              >
                Cancel
              </button>
              <button
                type="button"
                className="saved-handshake-card-body__tags-save"
                onClick={handleSaveTags}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="saved-handshake-card-body__tags-list">
            {(handshake.tags && handshake.tags.length > 0) ? (
              handshake.tags.map(tag => (
                <span key={tag} className="saved-handshake-card-body__tag">
                  #{tag}
                </span>
              ))
            ) : (
              <span className="saved-handshake-card-body__tags-empty">
                No tags
              </span>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {handshake.notes && (
        <div className="saved-handshake-card-body__notes">
          <h4 className="saved-handshake-card-body__section-title">Notes</h4>
          <p className="saved-handshake-card-body__notes-content">
            {handshake.notes}
          </p>
        </div>
      )}

      {/* Serial Reference */}
      {handshake.serial && (
        <div className="saved-handshake-card-body__serial">
          <span className="saved-handshake-card-body__serial-label">Serial:</span>
          <code className="saved-handshake-card-body__serial-value">
            {handshake.serial}
          </code>
        </div>
      )}
    </div>
  );
};

/**
 * Configuration detail row
 */
export interface ConfigDetailRowProps {
  label: string;
  value: string | React.ReactNode;
  icon?: string;
  className?: string;
}

export const ConfigDetailRow: React.FC<ConfigDetailRowProps> = ({
  label,
  value,
  icon,
  className = '',
}) => {
  return (
    <div className={`config-detail-row ${className}`}>
      {icon && <span className="config-detail-row__icon">{icon}</span>}
      <span className="config-detail-row__label">{label}</span>
      <span className="config-detail-row__value">{value}</span>
    </div>
  );
};

/**
 * Request method badge
 */
export interface MethodBadgeProps {
  method: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({
  method,
  size = 'medium',
  className = '',
}) => {
  const methodLower = method.toLowerCase();
  
  return (
    <span className={`method-badge method-badge--${methodLower} method-badge--${size} ${className}`}>
      {method}
    </span>
  );
};

/**
 * Tag editor component
 */
export interface TagEditorProps {
  tags: string[];
  availableTags?: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  className?: string;
}

export const TagEditor: React.FC<TagEditorProps> = ({
  tags,
  availableTags = [],
  onChange,
  maxTags = 10,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  
  const handleAdd = useCallback((tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
  }, [tags, maxTags, onChange]);
  
  const handleRemove = useCallback((tag: string) => {
    onChange(tags.filter(t => t !== tag));
  }, [tags, onChange]);
  
  const suggestions = availableTags.filter(t => !tags.includes(t));
  
  return (
    <div className={`tag-editor ${className}`}>
      <div className="tag-editor__tags">
        {tags.map(tag => (
          <span key={tag} className="tag-editor__tag">
            #{tag}
            <button
              type="button"
              className="tag-editor__remove"
              onClick={() => handleRemove(tag)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      
      <input
        type="text"
        className="tag-editor__input"
        placeholder="Add tag..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && inputValue) {
            e.preventDefault();
            handleAdd(inputValue);
          }
        }}
        disabled={tags.length >= maxTags}
      />
      
      {suggestions.length > 0 && (
        <div className="tag-editor__suggestions">
          {suggestions.slice(0, 5).map(tag => (
            <button
              key={tag}
              type="button"
              className="tag-editor__suggestion"
              onClick={() => handleAdd(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Category selector component
 */
export interface CategorySelectorProps {
  value: string;
  options: string[];
  onChange: (category: string) => void;
  allowCreate?: boolean;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  options,
  onChange,
  allowCreate = true,
  className = '',
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  const handleCreate = useCallback(() => {
    if (newCategory.trim()) {
      onChange(newCategory.trim());
      setIsCreating(false);
      setNewCategory('');
    }
  }, [newCategory, onChange]);
  
  if (isCreating) {
    return (
      <div className={`category-selector category-selector--creating ${className}`}>
        <input
          type="text"
          className="category-selector__input"
          placeholder="New category name..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
            if (e.key === 'Escape') setIsCreating(false);
          }}
          autoFocus
        />
        <button
          type="button"
          className="category-selector__create-btn"
          onClick={handleCreate}
        >
          ✓
        </button>
        <button
          type="button"
          className="category-selector__cancel-btn"
          onClick={() => setIsCreating(false)}
        >
          ✕
        </button>
      </div>
    );
  }
  
  return (
    <div className={`category-selector ${className}`}>
      <select
        className="category-selector__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Uncategorized</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {allowCreate && (
        <button
          type="button"
          className="category-selector__new-btn"
          onClick={() => setIsCreating(true)}
          title="Create new category"
        >
          +
        </button>
      )}
    </div>
  );
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate URL for display
 */
function truncateUrl(url: string, maxLength: number): string {
  if (url.length <= maxLength) return url;
  
  // Try to keep protocol and domain
  const match = url.match(/^(https?:\/\/[^\/]+)/);
  if (match && match[1].length < maxLength - 3) {
    const domain = match[1];
    const remaining = maxLength - domain.length - 3;
    return domain + '/...' + url.slice(-Math.max(0, remaining));
  }
  
  return url.substring(0, maxLength - 3) + '...';
}

export default SavedHandshakeCardBody;
