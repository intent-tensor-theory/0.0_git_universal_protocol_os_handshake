// ============================================
// PROTOCOL OS - RESOURCE FORM FIELDS
// ============================================
// Address: 1.4.3.c
// Purpose: Form Fields for Resource Configuration
// ============================================

import React, { useCallback, useMemo } from 'react';
import type { ResourceType, ResourceStatus } from '../1.4.1.b_fileResourceSerialNumberGenerator';
import type { ResourceConfiguration } from './1.4.3.a_fileResourceAccordionSection';

/**
 * Resource Form Fields
 * 
 * Displays and allows editing of resource configuration:
 * - Name
 * - Description
 * - Endpoint URL
 * - Resource type specific fields
 * - Status
 */

/**
 * Resource form values
 */
export interface ResourceFormValues {
  name: string;
  description?: string;
  resourceType: ResourceType;
  status: ResourceStatus;
  endpointUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Resource form fields props
 */
export interface ResourceFormFieldsProps {
  /** Current values */
  values: Partial<ResourceConfiguration> | ResourceFormValues;
  
  /** Value change handler */
  onChange: (field: string, value: unknown) => void;
  
  /** Is in edit mode */
  isEditing: boolean;
  
  /** Is disabled */
  disabled?: boolean;
  
  /** Resource type (for type-specific fields) */
  resourceType?: ResourceType;
  
  /** Show all fields (expanded mode) */
  showAllFields?: boolean;
  
  /** Field validation errors */
  errors?: Record<string, string>;
  
  /** Custom class name */
  className?: string;
}

/**
 * Resource type configurations
 */
const RESOURCE_TYPE_CONFIGS: Record<ResourceType, {
  hasEndpoint: boolean;
  endpointLabel: string;
  endpointPlaceholder: string;
  additionalFields?: Array<{
    id: string;
    label: string;
    type: 'text' | 'select' | 'checkbox';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
}> = {
  oauth: {
    hasEndpoint: true,
    endpointLabel: 'Authorization Server URL',
    endpointPlaceholder: 'https://auth.example.com',
    additionalFields: [
      {
        id: 'authorizationEndpoint',
        label: 'Authorization Endpoint',
        type: 'text',
        placeholder: '/authorize',
      },
      {
        id: 'tokenEndpoint',
        label: 'Token Endpoint',
        type: 'text',
        placeholder: '/token',
      },
    ],
  },
  apikey: {
    hasEndpoint: true,
    endpointLabel: 'API Base URL',
    endpointPlaceholder: 'https://api.example.com',
    additionalFields: [
      {
        id: 'keyPlacement',
        label: 'Key Placement',
        type: 'select',
        options: [
          { value: 'header', label: 'Header' },
          { value: 'query', label: 'Query Parameter' },
          { value: 'body', label: 'Request Body' },
        ],
      },
    ],
  },
  graphql: {
    hasEndpoint: true,
    endpointLabel: 'GraphQL Endpoint',
    endpointPlaceholder: 'https://api.example.com/graphql',
  },
  rest: {
    hasEndpoint: true,
    endpointLabel: 'API Base URL',
    endpointPlaceholder: 'https://api.example.com/v1',
  },
  websocket: {
    hasEndpoint: true,
    endpointLabel: 'WebSocket URL',
    endpointPlaceholder: 'wss://ws.example.com',
  },
  soap: {
    hasEndpoint: true,
    endpointLabel: 'WSDL URL',
    endpointPlaceholder: 'https://api.example.com/service?wsdl',
  },
  github: {
    hasEndpoint: true,
    endpointLabel: 'GitHub Enterprise URL (optional)',
    endpointPlaceholder: 'https://github.mycompany.com',
    additionalFields: [
      {
        id: 'repository',
        label: 'Repository',
        type: 'text',
        placeholder: 'owner/repo',
      },
    ],
  },
  scraper: {
    hasEndpoint: true,
    endpointLabel: 'Target URL',
    endpointPlaceholder: 'https://example.com',
    additionalFields: [
      {
        id: 'respectRobotsTxt',
        label: 'Respect robots.txt',
        type: 'checkbox',
      },
    ],
  },
  custom: {
    hasEndpoint: true,
    endpointLabel: 'Endpoint URL',
    endpointPlaceholder: 'https://api.example.com',
  },
};

/**
 * Status options
 */
const STATUS_OPTIONS: Array<{
  value: ResourceStatus;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    value: 'active',
    label: 'Active',
    icon: '✓',
    description: 'Resource is active and ready to use',
  },
  {
    value: 'inactive',
    label: 'Inactive',
    icon: '○',
    description: 'Resource is configured but not active',
  },
  {
    value: 'expired',
    label: 'Expired',
    icon: '⏰',
    description: 'Credentials have expired',
  },
  {
    value: 'revoked',
    label: 'Revoked',
    icon: '⊘',
    description: 'Access has been revoked',
  },
  {
    value: 'error',
    label: 'Error',
    icon: '✗',
    description: 'Configuration error',
  },
];

/**
 * Resource Form Fields Component
 */
export const ResourceFormFields: React.FC<ResourceFormFieldsProps> = ({
  values,
  onChange,
  isEditing,
  disabled = false,
  resourceType,
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
    const { name, value, type } = event.target;
    const finalValue = type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked 
      : value;
    onChange(name, finalValue);
  }, [onChange]);

  const handleStatusChange = useCallback((status: ResourceStatus) => {
    onChange('status', status);
  }, [onChange]);

  // ============================================
  // COMPUTED
  // ============================================

  const currentType = resourceType || (values as ResourceFormValues).resourceType || 'custom';
  const typeConfig = RESOURCE_TYPE_CONFIGS[currentType];
  const currentStatus = (values as ResourceConfiguration).status || 
                       (values as ResourceFormValues).status || 
                       'active';

  const metadataValues = useMemo(() => {
    const metadata = (values as ResourceConfiguration).metadata || 
                    (values as ResourceFormValues).metadata || 
                    {};
    return metadata;
  }, [values]);

  // ============================================
  // RENDER
  // ============================================

  if (!isEditing) {
    // Read-only display mode
    return (
      <div className={`resource-form-fields resource-form-fields--readonly ${className}`}>
        {/* Name */}
        <div className="resource-form-fields__field">
          <label className="resource-form-fields__label">Name</label>
          <div className="resource-form-fields__value">
            {values.name || '—'}
          </div>
        </div>

        {/* Description */}
        {values.description && (
          <div className="resource-form-fields__field">
            <label className="resource-form-fields__label">Description</label>
            <div className="resource-form-fields__value">
              {values.description}
            </div>
          </div>
        )}

        {/* Endpoint URL */}
        {typeConfig.hasEndpoint && (values as ResourceConfiguration).endpointUrl && (
          <div className="resource-form-fields__field">
            <label className="resource-form-fields__label">{typeConfig.endpointLabel}</label>
            <div className="resource-form-fields__value resource-form-fields__value--url">
              <code>{(values as ResourceConfiguration).endpointUrl}</code>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="resource-form-fields__field">
          <label className="resource-form-fields__label">Status</label>
          <div className="resource-form-fields__value">
            <span className={`resource-form-fields__status-badge resource-form-fields__status-badge--${currentStatus}`}>
              {STATUS_OPTIONS.find(s => s.value === currentStatus)?.icon} {currentStatus}
            </span>
          </div>
        </div>

        {/* Additional Type-Specific Fields */}
        {typeConfig.additionalFields && showAllFields && (
          typeConfig.additionalFields.map(field => {
            const fieldValue = metadataValues[field.id];
            if (fieldValue === undefined) return null;
            
            return (
              <div key={field.id} className="resource-form-fields__field">
                <label className="resource-form-fields__label">{field.label}</label>
                <div className="resource-form-fields__value">
                  {field.type === 'checkbox' 
                    ? (fieldValue ? 'Yes' : 'No')
                    : field.type === 'select'
                      ? field.options?.find(o => o.value === fieldValue)?.label || fieldValue
                      : String(fieldValue)
                  }
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // Editable mode
  return (
    <div className={`resource-form-fields resource-form-fields--editing ${className}`}>
      {/* Name Input */}
      <div className="resource-form-fields__field">
        <label 
          className="resource-form-fields__label"
          htmlFor="resource-name"
        >
          Name <span className="resource-form-fields__required">*</span>
        </label>
        <input
          type="text"
          id="resource-name"
          name="name"
          className={`resource-form-fields__input ${errors.name ? 'resource-form-fields__input--error' : ''}`}
          value={values.name || ''}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="My API Connection"
          maxLength={100}
          required
        />
        {errors.name && (
          <span className="resource-form-fields__error">{errors.name}</span>
        )}
      </div>

      {/* Description Input */}
      <div className="resource-form-fields__field">
        <label 
          className="resource-form-fields__label"
          htmlFor="resource-description"
        >
          Description
        </label>
        <textarea
          id="resource-description"
          name="description"
          className={`resource-form-fields__textarea ${errors.description ? 'resource-form-fields__textarea--error' : ''}`}
          value={values.description || ''}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="Optional description for this resource..."
          rows={2}
          maxLength={500}
        />
        <div className="resource-form-fields__char-count">
          {(values.description || '').length}/500
        </div>
        {errors.description && (
          <span className="resource-form-fields__error">{errors.description}</span>
        )}
      </div>

      {/* Endpoint URL Input */}
      {typeConfig.hasEndpoint && (
        <div className="resource-form-fields__field">
          <label 
            className="resource-form-fields__label"
            htmlFor="resource-endpoint"
          >
            {typeConfig.endpointLabel}
          </label>
          <input
            type="url"
            id="resource-endpoint"
            name="endpointUrl"
            className={`resource-form-fields__input resource-form-fields__input--url ${errors.endpointUrl ? 'resource-form-fields__input--error' : ''}`}
            value={(values as ResourceConfiguration).endpointUrl || ''}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder={typeConfig.endpointPlaceholder}
          />
          {errors.endpointUrl && (
            <span className="resource-form-fields__error">{errors.endpointUrl}</span>
          )}
        </div>
      )}

      {/* Status Selection */}
      {showAllFields && (
        <div className="resource-form-fields__field">
          <label className="resource-form-fields__label">Status</label>
          <div className="resource-form-fields__status-options">
            {STATUS_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                className={`resource-form-fields__status-option ${
                  currentStatus === option.value 
                    ? 'resource-form-fields__status-option--selected' 
                    : ''
                } resource-form-fields__status-option--${option.value}`}
                onClick={() => handleStatusChange(option.value)}
                disabled={disabled}
                title={option.description}
              >
                <span className="resource-form-fields__status-icon">{option.icon}</span>
                <span className="resource-form-fields__status-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Additional Type-Specific Fields */}
      {typeConfig.additionalFields && showAllFields && (
        <div className="resource-form-fields__additional">
          <h4 className="resource-form-fields__additional-title">
            Additional Settings
          </h4>
          {typeConfig.additionalFields.map(field => (
            <div key={field.id} className="resource-form-fields__field">
              <label 
                className="resource-form-fields__label"
                htmlFor={`resource-${field.id}`}
              >
                {field.label}
              </label>
              
              {field.type === 'text' && (
                <input
                  type="text"
                  id={`resource-${field.id}`}
                  name={field.id}
                  className="resource-form-fields__input"
                  value={String(metadataValues[field.id] || '')}
                  onChange={(e) => onChange(`metadata.${field.id}`, e.target.value)}
                  disabled={disabled}
                  placeholder={field.placeholder}
                />
              )}
              
              {field.type === 'select' && field.options && (
                <select
                  id={`resource-${field.id}`}
                  name={field.id}
                  className="resource-form-fields__select"
                  value={String(metadataValues[field.id] || '')}
                  onChange={(e) => onChange(`metadata.${field.id}`, e.target.value)}
                  disabled={disabled}
                >
                  <option value="">Select...</option>
                  {field.options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              
              {field.type === 'checkbox' && (
                <label className="resource-form-fields__checkbox-label">
                  <input
                    type="checkbox"
                    id={`resource-${field.id}`}
                    name={field.id}
                    className="resource-form-fields__checkbox"
                    checked={Boolean(metadataValues[field.id])}
                    onChange={(e) => onChange(`metadata.${field.id}`, e.target.checked)}
                    disabled={disabled}
                  />
                  <span className="resource-form-fields__checkbox-text">
                    Enabled
                  </span>
                </label>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Resource Create Form - full form for creating new resources
 */
export interface ResourceCreateFormProps {
  /** Parent platform serial */
  platformSerial: string;
  
  /** Initial values */
  initialValues?: Partial<ResourceFormValues>;
  
  /** Submit handler */
  onSubmit: (values: ResourceFormValues) => void;
  
  /** Cancel handler */
  onCancel: () => void;
  
  /** Is submitting */
  isSubmitting?: boolean;
  
  /** Allowed resource types */
  allowedTypes?: ResourceType[];
  
  /** Custom class name */
  className?: string;
}

export const ResourceCreateForm: React.FC<ResourceCreateFormProps> = ({
  platformSerial,
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  allowedTypes,
  className = '',
}) => {
  const allTypes: ResourceType[] = ['oauth', 'apikey', 'graphql', 'rest', 'websocket', 'soap', 'github', 'scraper', 'custom'];
  const availableTypes = allowedTypes || allTypes;

  const [values, setValues] = React.useState<ResourceFormValues>({
    name: initialValues.name || '',
    description: initialValues.description || '',
    resourceType: initialValues.resourceType || availableTypes[0],
    status: initialValues.status || 'active',
    endpointUrl: '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleChange = useCallback((field: string, value: unknown) => {
    if (field.startsWith('metadata.')) {
      const metaField = field.replace('metadata.', '');
      setValues(prev => ({
        ...prev,
        metadata: {
          ...(prev.metadata || {}),
          [metaField]: value,
        },
      }));
    } else {
      setValues(prev => ({ ...prev, [field]: value }));
    }
    
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
      className={`resource-create-form ${className}`}
      onSubmit={handleSubmit}
    >
      <h3 className="resource-create-form__title">Add New Resource</h3>
      <p className="resource-create-form__subtitle">
        Platform: <code>{platformSerial}</code>
      </p>
      
      {/* Resource Type Selection */}
      <div className="resource-create-form__type-selector">
        <label className="resource-form-fields__label">Resource Type</label>
        <div className="resource-create-form__type-grid">
          {availableTypes.map(type => (
            <button
              key={type}
              type="button"
              className={`resource-create-form__type-btn ${
                values.resourceType === type ? 'resource-create-form__type-btn--selected' : ''
              }`}
              onClick={() => handleChange('resourceType', type)}
              disabled={isSubmitting}
            >
              <span className="resource-create-form__type-icon">
                {getResourceTypeIcon(type)}
              </span>
              <span className="resource-create-form__type-label">
                {getResourceTypeLabel(type)}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <ResourceFormFields
        values={values}
        onChange={handleChange}
        isEditing={true}
        disabled={isSubmitting}
        resourceType={values.resourceType}
        showAllFields={true}
        errors={errors}
      />

      <div className="resource-create-form__actions">
        <button
          type="button"
          className="resource-create-form__btn resource-create-form__btn--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="resource-create-form__btn resource-create-form__btn--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Resource'}
        </button>
      </div>
    </form>
  );
};

/**
 * Get resource type icon
 */
function getResourceTypeIcon(type: ResourceType): string {
  const icons: Record<ResourceType, string> = {
    oauth: '🔑',
    apikey: '🔒',
    graphql: '◈',
    rest: '🌐',
    websocket: '⚡',
    soap: '📄',
    github: '🐙',
    scraper: '🕷️',
    custom: '⚙️',
  };
  return icons[type] || '📦';
}

/**
 * Get resource type label
 */
function getResourceTypeLabel(type: ResourceType): string {
  const labels: Record<ResourceType, string> = {
    oauth: 'OAuth',
    apikey: 'API Key',
    graphql: 'GraphQL',
    rest: 'REST API',
    websocket: 'WebSocket',
    soap: 'SOAP',
    github: 'GitHub',
    scraper: 'Scraper',
    custom: 'Custom',
  };
  return labels[type] || type;
}

/**
 * Use resource form hook
 */
export function useResourceForm(initialValues?: Partial<ResourceFormValues>) {
  const [values, setValues] = React.useState<ResourceFormValues>({
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    resourceType: initialValues?.resourceType || 'rest',
    status: initialValues?.status || 'active',
    endpointUrl: '',
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
      resourceType: initialValues?.resourceType || 'rest',
      status: initialValues?.status || 'active',
      endpointUrl: '',
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

export default ResourceFormFields;
