// ============================================
// PROTOCOL OS - HANDSHAKE SAVE BUTTON
// ============================================
// Address: 1.4.4.h
// Purpose: Button for Saving Handshakes as Templates
// ============================================

import React, { useState, useCallback } from 'react';
import type { HandshakeConfiguration } from './1.4.4.a_fileHandshakeAccordionSection';

/**
 * Handshake Save Button
 * 
 * Provides interface for saving handshakes as reusable templates:
 * - Save button with confirmation
 * - Template name input
 * - Save status indication
 * - Unsaved changes warning
 */

/**
 * Save status
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Handshake save button props
 */
export interface HandshakeSaveButtonProps {
  /** Handshake configuration */
  handshake: HandshakeConfiguration;
  
  /** Save handler */
  onSave: (handshake: HandshakeConfiguration) => void;
  
  /** Is already saved as template */
  isSaved: boolean;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Show inline form */
  showInlineForm?: boolean;
  
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  
  /** Custom class name */
  className?: string;
}

/**
 * Handshake Save Button Component
 */
export const HandshakeSaveButton: React.FC<HandshakeSaveButtonProps> = ({
  handshake,
  onSave,
  isSaved,
  disabled = false,
  showInlineForm = false,
  size = 'medium',
  className = '',
}) => {
  // ============================================
  // STATE
  // ============================================

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [templateName, setTemplateName] = useState(handshake.name);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // ============================================
  // HANDLERS
  // ============================================

  const handleOpenForm = useCallback(() => {
    setIsFormOpen(true);
    setTemplateName(handshake.name);
  }, [handshake.name]);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setTemplateName(handshake.name);
    setSaveStatus('idle');
  }, [handshake.name]);

  const handleSave = useCallback(async () => {
    if (!templateName.trim()) return;
    
    setSaveStatus('saving');
    
    try {
      const savedHandshake: HandshakeConfiguration = {
        ...handshake,
        name: templateName,
        isSavedTemplate: true,
        updatedAt: new Date(),
      };
      
      onSave(savedHandshake);
      setSaveStatus('saved');
      
      // Reset after delay
      setTimeout(() => {
        setIsFormOpen(false);
        setSaveStatus('idle');
      }, 1500);
    } catch {
      setSaveStatus('error');
    }
  }, [handshake, templateName, onSave]);

  const handleQuickSave = useCallback(() => {
    if (isSaved) {
      // Already saved, just update
      onSave({
        ...handshake,
        updatedAt: new Date(),
      });
    } else {
      // Open form to save as new template
      handleOpenForm();
    }
  }, [handshake, isSaved, onSave, handleOpenForm]);

  // ============================================
  // RENDER
  // ============================================

  const buttonClasses = [
    'handshake-save-button',
    `handshake-save-button--${size}`,
    isSaved ? 'handshake-save-button--saved' : '',
    disabled ? 'handshake-save-button--disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  // Inline form mode
  if (showInlineForm || isFormOpen) {
    return (
      <div className="handshake-save-button__form-container">
        <div className="handshake-save-button__form">
          <div className="handshake-save-button__form-header">
            <span className="handshake-save-button__form-title">
              💾 Save as Template
            </span>
            <button
              type="button"
              className="handshake-save-button__form-close"
              onClick={handleCloseForm}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          
          <div className="handshake-save-button__form-body">
            <label className="handshake-save-button__form-label">
              Template Name
            </label>
            <input
              type="text"
              className="handshake-save-button__form-input"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="My API Template"
              disabled={saveStatus === 'saving'}
            />
            <p className="handshake-save-button__form-hint">
              Save this handshake configuration for reuse
            </p>
          </div>

          <div className="handshake-save-button__form-actions">
            <button
              type="button"
              className="handshake-save-button__form-btn handshake-save-button__form-btn--secondary"
              onClick={handleCloseForm}
              disabled={saveStatus === 'saving'}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`handshake-save-button__form-btn handshake-save-button__form-btn--primary handshake-save-button__form-btn--${saveStatus}`}
              onClick={handleSave}
              disabled={!templateName.trim() || saveStatus === 'saving'}
            >
              {saveStatus === 'saving' && '⏳ Saving...'}
              {saveStatus === 'saved' && '✓ Saved!'}
              {saveStatus === 'error' && '✗ Error'}
              {saveStatus === 'idle' && '💾 Save Template'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Button mode
  return (
    <div className="handshake-save-button__container">
      <button
        type="button"
        className={buttonClasses}
        onClick={handleQuickSave}
        disabled={disabled}
        title={isSaved ? 'Update saved template' : 'Save as template'}
      >
        <span className="handshake-save-button__icon">
          {isSaved ? '💾' : '📥'}
        </span>
        <span className="handshake-save-button__text">
          {isSaved ? 'Update Template' : 'Save as Template'}
        </span>
        {isSaved && (
          <span className="handshake-save-button__badge">
            ✓
          </span>
        )}
      </button>
      
      {!isSaved && (
        <span className="handshake-save-button__hint">
          Save this configuration for reuse
        </span>
      )}
    </div>
  );
};

/**
 * Template library component
 */
export interface TemplateLibraryProps {
  templates: HandshakeConfiguration[];
  onSelect: (template: HandshakeConfiguration) => void;
  onDelete?: (serial: string) => void;
  disabled?: boolean;
  className?: string;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates,
  onSelect,
  onDelete,
  disabled = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.protocol.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`template-library ${className}`}>
      <div className="template-library__header">
        <h4 className="template-library__title">
          📚 Template Library
        </h4>
        <span className="template-library__count">
          {templates.length} templates
        </span>
      </div>

      <div className="template-library__search">
        <input
          type="text"
          className="template-library__search-input"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredTemplates.length > 0 ? (
        <div className="template-library__list">
          {filteredTemplates.map(template => (
            <div key={template.serial.serial} className="template-library__item">
              <div className="template-library__item-info">
                <span className="template-library__item-name">
                  {template.name}
                </span>
                <span className="template-library__item-protocol">
                  {template.protocol.name}
                </span>
              </div>
              <div className="template-library__item-actions">
                <button
                  type="button"
                  className="template-library__item-btn template-library__item-btn--use"
                  onClick={() => onSelect(template)}
                  disabled={disabled}
                >
                  Use
                </button>
                {onDelete && (
                  <button
                    type="button"
                    className="template-library__item-btn template-library__item-btn--delete"
                    onClick={() => onDelete(template.serial.serial)}
                    disabled={disabled}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="template-library__empty">
          {searchQuery ? (
            <p>No templates found matching "{searchQuery}"</p>
          ) : (
            <p>No templates saved yet</p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Quick template selector dropdown
 */
export interface QuickTemplateSelectorProps {
  templates: HandshakeConfiguration[];
  onSelect: (template: HandshakeConfiguration) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const QuickTemplateSelector: React.FC<QuickTemplateSelectorProps> = ({
  templates,
  onSelect,
  disabled = false,
  placeholder = 'Load from template...',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (template: HandshakeConfiguration) => {
    onSelect(template);
    setIsOpen(false);
  };

  return (
    <div className={`quick-template-selector ${className}`}>
      <button
        type="button"
        className="quick-template-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || templates.length === 0}
      >
        <span className="quick-template-selector__icon">📚</span>
        <span className="quick-template-selector__text">{placeholder}</span>
        <span className="quick-template-selector__caret">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && templates.length > 0 && (
        <div className="quick-template-selector__dropdown">
          {templates.map(template => (
            <button
              key={template.serial.serial}
              type="button"
              className="quick-template-selector__option"
              onClick={() => handleSelect(template)}
            >
              <span className="quick-template-selector__option-name">
                {template.name}
              </span>
              <span className="quick-template-selector__option-protocol">
                {template.protocol.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Unsaved changes indicator
 */
export interface UnsavedChangesIndicatorProps {
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
  disabled?: boolean;
  className?: string;
}

export const UnsavedChangesIndicator: React.FC<UnsavedChangesIndicatorProps> = ({
  hasChanges,
  onSave,
  onDiscard,
  disabled = false,
  className = '',
}) => {
  if (!hasChanges) return null;

  return (
    <div className={`unsaved-changes-indicator ${className}`}>
      <span className="unsaved-changes-indicator__icon">⚠️</span>
      <span className="unsaved-changes-indicator__text">
        Unsaved changes
      </span>
      <div className="unsaved-changes-indicator__actions">
        <button
          type="button"
          className="unsaved-changes-indicator__btn unsaved-changes-indicator__btn--save"
          onClick={onSave}
          disabled={disabled}
        >
          Save
        </button>
        <button
          type="button"
          className="unsaved-changes-indicator__btn unsaved-changes-indicator__btn--discard"
          onClick={onDiscard}
          disabled={disabled}
        >
          Discard
        </button>
      </div>
    </div>
  );
};

/**
 * Save confirmation modal
 */
export interface SaveConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  templateName: string;
  isUpdate: boolean;
}

export const SaveConfirmationModal: React.FC<SaveConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  templateName,
  isUpdate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="save-confirmation-modal__overlay">
      <div className="save-confirmation-modal">
        <div className="save-confirmation-modal__header">
          <span className="save-confirmation-modal__icon">💾</span>
          <h3 className="save-confirmation-modal__title">
            {isUpdate ? 'Update Template' : 'Save Template'}
          </h3>
        </div>
        <div className="save-confirmation-modal__body">
          <p>
            {isUpdate 
              ? `Update the template "${templateName}"?`
              : `Save this configuration as "${templateName}"?`
            }
          </p>
        </div>
        <div className="save-confirmation-modal__actions">
          <button
            type="button"
            className="save-confirmation-modal__btn save-confirmation-modal__btn--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="save-confirmation-modal__btn save-confirmation-modal__btn--primary"
            onClick={onConfirm}
          >
            {isUpdate ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HandshakeSaveButton;
