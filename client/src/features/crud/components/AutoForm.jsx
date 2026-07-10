import React, { useState, useEffect } from 'react';
import DynamicField from './DynamicField.jsx';

/**
 * Auto-generated Form component based on field definitions
 */
const AutoForm = ({
  fields = [],
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  validationErrors = [],
}) => {
  const [values, setValues] = useState({});
  const [localErrors, setLocalErrors] = useState({});

  // Initialize values
  useEffect(() => {
    const defaultVals = {};
    fields.forEach((field) => {
      // Set defaults
      if (initialValues[field.columnName] !== undefined) {
        defaultVals[field.columnName] = initialValues[field.columnName];
      } else if (field.defaultValue !== undefined && field.defaultValue !== null) {
        if (field.fieldType === 'boolean') {
          defaultVals[field.columnName] = field.defaultValue === 'true' || field.defaultValue === true;
        } else if (field.fieldType === 'number') {
          defaultVals[field.columnName] = Number(field.defaultValue);
        } else {
          defaultVals[field.columnName] = field.defaultValue;
        }
      } else {
        defaultVals[field.columnName] = field.fieldType === 'boolean' ? false : '';
      }
    });
    setValues(defaultVals);
    setLocalErrors({});
  }, [fields, initialValues]);

  // Sync external validation errors (e.g. from backend response)
  useEffect(() => {
    if (validationErrors && validationErrors.length > 0) {
      const extErrors = {};
      validationErrors.forEach((err) => {
        extErrors[err.field] = err.message;
      });
      setLocalErrors(extErrors);
    }
  }, [validationErrors]);

  const handleChange = (name, val) => {
    setValues((prev) => ({
      ...prev,
      [name]: val,
    }));
    
    // Clear error on modify
    if (localErrors[name]) {
      setLocalErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Evaluate field-level conditional rendering
  const shouldShowField = (field) => {
    if (!field.uiConfig || !field.uiConfig.dependsOn) {
      return true;
    }
    const { dependsOn, value } = field.uiConfig;
    
    // Return true if dependency value matches
    return values[dependsOn] === value;
  };

  const validateForm = () => {
    const errors = {};
    fields.forEach((field) => {
      if (!shouldShowField(field)) return;

      const val = values[field.columnName];
      
      // Required checks
      if (field.required && (val === undefined || val === null || val === '')) {
        errors[field.columnName] = `${field.name} is required`;
      }

      // Email format checks
      if (val && field.fieldType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val).trim())) {
          errors[field.columnName] = 'Invalid email address';
        }
      }
    });

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Filter values to only submit visible conditional fields
      const submittedValues = {};
      fields.forEach((field) => {
        if (shouldShowField(field)) {
          submittedValues[field.columnName] = values[field.columnName];
        }
      });
      onSubmit(submittedValues);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auto-form" noValidate>
      <div className="auto-form__fields">
        {fields
          .filter(shouldShowField)
          .map((field) => (
            <DynamicField
              key={field.columnName}
              field={field}
              value={values[field.columnName]}
              onChange={handleChange}
              error={localErrors[field.columnName]}
            />
          ))}
      </div>

      <div className="auto-form__actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="button-secondary"
            disabled={loading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="button-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <i className="ri-loader-4-line form-spinner" aria-hidden="true" />
              <span>Saving...</span>
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
};

export default AutoForm;
