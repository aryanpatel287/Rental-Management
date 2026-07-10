import React from 'react';

/**
 * Dynamic input component mapping field metadata to HTML input components
 */
const DynamicField = ({ field, value, onChange, error }) => {
  const { name, columnName, fieldType, required, options, placeholder } = field;
  const inputId = `field-${columnName}`;
  const errorId = `error-${columnName}`;

  const handleChange = (e) => {
    let val = e.target.value;
    if (fieldType === 'boolean') {
      val = e.target.checked;
    } else if (fieldType === 'number') {
      val = val === '' ? '' : Number(val);
    }
    onChange(columnName, val);
  };

  const commonProps = {
    id: inputId,
    name: columnName,
    required: required,
    onChange: handleChange,
    placeholder: placeholder || `Enter ${name.toLowerCase()}`,
    className: `text-input ${error ? 'text-input--error' : ''}`,
    'aria-invalid': !!error,
    'aria-describedby': error ? errorId : undefined,
  };

  const renderInput = () => {
    switch (fieldType) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            value={value || ''}
            style={{ height: 'auto', minHeight: '100px', resize: 'vertical' }}
          />
        );

      case 'boolean':
        return (
          <div className="checkbox-field">
            <input
              type="checkbox"
              id={inputId}
              name={columnName}
              checked={!!value}
              onChange={handleChange}
              className="checkbox-field__input"
            />
            <label htmlFor={inputId} className="checkbox-field__label">
              {required ? `${name} *` : name}
            </label>
          </div>
        );

      case 'select':
        const opts = Array.isArray(options) ? options : [];
        return (
          <select
            {...commonProps}
            value={value || ''}
            className={`text-input select-input ${error ? 'text-input--error' : ''}`}
          >
            <option value="">Select an option</option>
            {opts.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label || opt.value}
              </option>
            ))}
          </select>
        );

      case 'date':
        // Format ISO string or date object to YYYY-MM-DD for date input type
        let dateValue = '';
        if (value) {
          try {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
              dateValue = dateObj.toISOString().split('T')[0];
            }
          } catch (e) {
            dateValue = '';
          }
        }
        return (
          <input
            type="date"
            {...commonProps}
            value={dateValue}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            {...commonProps}
            value={value ?? ''}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            {...commonProps}
            value={value || ''}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            {...commonProps}
            value={value || ''}
          />
        );
    }
  };

  if (fieldType === 'boolean') {
    return (
      <div className="form-group form-group--checkbox">
        {renderInput()}
        {error && (
          <p id={errorId} className="field-error-message" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="form-group">
      <label htmlFor={inputId} className="form-label">
        {name} {required && <span className="required-star">*</span>}
      </label>
      {renderInput()}
      {error && (
        <p id={errorId} className="field-error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default DynamicField;
