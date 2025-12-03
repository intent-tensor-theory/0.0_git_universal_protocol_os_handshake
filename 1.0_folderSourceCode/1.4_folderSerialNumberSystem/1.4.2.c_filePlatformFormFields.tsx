// ============================================
// PROTOCOL OS - PLATFORM FORM FIELDS
// ============================================
// Address: 1.4.2.c
// Purpose: Form Fields for Platform Configuration
// ============================================

import React, { useCallback, useMemo } from 'react';
import type { PlatformEdition, InstallationType } from '../1.4.1.a_filePlatformSerialNumberGenerator';
import type { PlatformConfiguration } from './1.4.2.a_filePlatformAccordionSection';

/**
 * Platform Form Fields
 * 
 * Displays and allows editing of platform configuration:
 * - Name
 * - Description
 * - Edition selection
 * - Installation type
 * - Custom metadata
 */

/**
 * Platform form values
 */
export interface PlatformFormValues {
  name: string;
  description?: string;
  edition: PlatformEdition;
  installationType?: InstallationType;
  metadata?: Record<string, unknown>;
}

/**
 * Platform form fields props
 */
export interface PlatformFormFieldsProps {
  /** Current values */
  values: Partial<PlatformConfiguration> | PlatformFormValues;
  
  /** Value change handler */
  onChange: (field: string, value: unknown) => void;
  
  /** Is in edit mode */
  isEditing: boolean;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Show all fields (expanded mode) */
  showAllFields?: boolean;
  
  /** Field validation errors */
  errors?: Record<string, string>;
  
  /** Custom class name */
  className?: string;
}

/**
 * Edition options with descriptions
 */
const EDITION_OPTIONS: Array<{
  value: PlatformEdition;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'community',
    label: 'Community',
    description: 'Free edition for personal use',
    icon: '🌱',
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'For individual professionals',
    icon: '💼',
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'For organizations and teams',
    icon: '🏢',
  },
  {
    value: 'developer',
    label: 'Developer',
    description: 'For development and testing',
    icon: '🛠️',
  },
];

/**
 * Installation type options
 */
const INSTALLATION_OPTIONS: Array<{
  value: InstallationType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: 'standalone',
    label: 'Standalone',
    description: 'Single machine installation',
    icon: '💻',
  },
  {
    value: 'cloud',
    label: 'Cloud',
    description: 'Cloud-hosted deployment',
    icon: '☁️',
  },
  {
    value: 'embedded',
    label: 'Embedded',
    description: 'Embedded in another application',
    icon: '🔌',
  },
  {
    value: 'container',
    label: 'Container',
    description: 'Docker/Kubernetes deployment',
    icon: '🐳',
  },
];

/**
 * Platform Form Fields Component
 */
export const PlatformFormFields: React.FC<PlatformFormFieldsProps> = ({
  values,
  onChange,
  isEditing,
  disabled = false,
  showAllFields = false,
  errors = {},
  className = '',
}) => {
  // ============================================
  // HANDLERS
  // ============================================

  const handleInputChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    onChange(name, value);
  }, [onChange]);

  const handleEditionChange = useCallback((edition: PlatformEdition) => {
    onChange('edition', edition);
  }, [onChange]);

  const handleInstallationChange = useCallback((installationType: InstallationType) => {
    onChange('installationType', installationType);
  }, [onChange]);

  // ============================================
  // COMPUTED
  // ============================================

  const currentEdition = useMemo(() => {
    const edition = (values as PlatformConfiguration).serial?.metadata?.edition || 
                   (values as PlatformFormValues).edition || 
                   'community';
    return EDITION_OPTIONS.find(opt => opt.value === edition) || EDITION_OPTIONS[0];
  }, [values]);

  const currentInstallation = useMemo(() => {
    const installationType = (values as PlatformConfiguration).serial?.metadata?.installationType || 
                            (values as PlatformFormValues).installationType || 
                            'standalone';
    return INSTALLATION_OPTIONS.find(opt => opt.value === installationType) || INSTALLATION_OPTIONS[0];
  }, [values]);

  // ============================================
  // RENDER
  // ============================================

  if (!isEditing) {
    // Read-only display mode
    return (
      <div className={`platform-form-fields platform-form-fields--readonly ${className}`}>
        {/* Name */}
        <div className="platform-form-fields__field">
          <label className="platform-form-fields__label">Name</label>
          <div className="platform-form-fields__value">
            {values.name || '—'}
          </div>
        </div>

        {/* Description */}
        {values.description && (
          <div className="platform-form-fields__field">
            <label className="platform-form-fields__label">Description</label>
            <div className="platform-form-fields__value">
              {values.description}
            </div>
          </div>
        )}

        {/* Edition */}
        <div className="platform-form-fields__field">
          <label className="platform-form-fields__label">Edition</label>
          <div className="platform-form-fields__value platform-form-fields__value--with-icon">
            <span className="platform-form-fields__icon">{currentEdition.icon}</span>
            <span>{currentEdition.label}</span>
            <span className="platform-form-fields__hint">{currentEdition.description}</span>
          </div>
        </div>

        {/* Installation Type */}
        {showAllFields && (
          <div className="platform-form-fields__field">
            <label className="platform-form-fields__label">Installation</label>
            <div className="platform-form-fields__value platform-form-fields__value--with-icon">
              <span className="platform-form-fields__icon">{currentInstallation.icon}</span>
              <span>{currentInstallation.label}</span>
              <span className="platform-form-fields__hint">{currentInstallation.description}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Editable mode
  return (
    <div className={`platform-form-fields platform-form-fields--editing ${className}`}>
      {/* Name Input */}
      <div className="platform-form-fields__field">
        <label 
          className="platform-form-fields__label"
          htmlFor="platform-name"
        >
          Name <span className="platform-form-fields__required">*</span>
        </label>
        <input
          type="text"
          id="platform-name"
          name="name"
          className={`platform-form-fields__input ${errors.name ? 'platform-form-fields__input--error' : ''}`}
          value={values.name || ''}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="My Platform"
          maxLength={100}
          required
        />
        {errors.name && (
          <span className="platform-form-fields__error">{errors.name}</span>
        )}
      </div>

      {/* Description Input */}
      <div className="platform-form-fields__field">
        <label 
          className="platform-form-fields__label"
          htmlFor="platform-description"
        >
          Description
        </label>
        <textarea
          id="platform-description"
          name="description"
          className={`platform-form-fields__textarea ${errors.description ? 'platform-form-fields__textarea--error' : ''}`}
          value={values.description || ''}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="Optional description for this platform..."
          rows={3}
          maxLength={500}
        />
        <div className="platform-form-fields__char-count">
          {(values.description || '').length}/500
        </div>
        {errors.description && (
          <span className="platform-form-fields__error">{errors.description}</span>
        )}
      </div>

      {/* Edition Selection */}
      {showAllFields && (
        <div className="platform-form-fields__field">
          <label className="platform-form-fields__label">Edition</label>
          <div className="platform-form-fields__options">
            {EDITION_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                className={`platform-form-fields__option ${
                  currentEdition.value === option.value 
                    ? 'platform-form-fields__option--selected' 
                    : ''
                }`}
                onClick={() => handleEditionChange(option.value)}
                disabled={disabled}
              >
                <span className="platform-form-fields__option-icon">{option.icon}</span>
                <span className="platform-form-fields__option-label">{option.label}</span>
                <span className="platform-form-fields__option-desc">{option.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Installation Type Selection */}
      {showAllFields && (
        <div className="platform-form-fields__field">
          <label className="platform-form-fields__label">Installation Type</label>
          <div className="platform-form-fields__options platform-form-fields__options--horizontal">
            {INSTALLATION_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                className={`platform-form-fields__option platform-form-fields__option--small ${
                  currentInstallation.value === option.value 
                    ? 'platform-form-fields__option--selected' 
                    : ''
                }`}
                onClick={() => handleInstallationChange(option.value)}
                disabled={disabled}
                title={option.description}
              >
                <span className="platform-form-fields__option-icon">{option.icon}</span>
                <span className="platform-form-fields__option-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Platform Create Form - full form for creating new platforms
 */
export interface PlatformCreateFormProps {
  /** Initial values */
  initialValues?: Partial<PlatformFormValues>;
  
  /** Submit handler */
  onSubmit: (values: PlatformFormValues) => void;
  
  /** Cancel handler */
  onCancel: () => void;
  
  /** Is submitting */
  isSubmitting?: boolean;
  
  /** Custom class name */
  className?: string;
}

export const PlatformCreateForm: React.FC<PlatformCreateFormProps> = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = '',
}) => {
  const [values, setValues] = React.useState<PlatformFormValues>({
    name: initialValues.name || '',
    description: initialValues.description || '',
    edition: initialValues.edition || 'community',
    installationType: initialValues.installationType || 'standalone',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleChange = useCallback((field: string, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!values.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (values.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    
    if (validate()) {
      onSubmit(values);
    }
  }, [values, validate, onSubmit]);

  return (
    <form 
      className={`platform-create-form ${className}`}
      onSubmit={handleSubmit}
    >
      <h3 className="platform-create-form__title">Create New Platform</h3>
      
      <PlatformFormFields
        values={values}
        onChange={handleChange}
        isEditing={true}
        disabled={isSubmitting}
        showAllFields={true}
        errors={errors}
      />

      <div className="platform-create-form__actions">
        <button
          type="button"
          className="platform-create-form__btn platform-create-form__btn--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="platform-create-form__btn platform-create-form__btn--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Platform'}
        </button>
      </div>
    </form>
  );
};

/**
 * Use platform form hook
 */
export function usePlatformForm(initialValues?: Partial<PlatformFormValues>) {
  const [values, setValues] = React.useState<PlatformFormValues>({
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    edition: initialValues?.edition || 'community',
    installationType: initialValues?.installationType || 'standalone',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = React.useState(false);

  const handleChange = useCallback((field: string, value: unknown) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!values.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const reset = useCallback(() => {
    setValues({
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      edition: initialValues?.edition || 'community',
      installationType: initialValues?.installationType || 'standalone',
    });
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);

  return {
    values,
    errors,
    isDirty,
    handleChange,
    validate,
    reset,
    setErrors,
  };
}

export default PlatformFormFields;
