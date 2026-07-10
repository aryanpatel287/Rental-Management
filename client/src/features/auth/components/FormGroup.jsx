import React, { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../styles/_form-group.scss';

const FormGroup = ({
  label,
  id,
  placeholder,
  type,
  value,
  onChange,
  name,
  hasError,
  errorMessage,
  onBlur,
  onFocus,
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);

  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const inputValue = value ?? '';

  const handleTogglePassword = (e) => {
    e.preventDefault();
    setShowPassword(!showPassword);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`form-group${hasError ? ' error' : ''}${isPassword ? ' has-password' : ''}`}>
      <input
        ref={inputRef}
        value={inputValue}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        name={name || id}
        className="form-input"
        type={inputType}
        id={id}
        placeholder={placeholder || ' '}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={errorMessage ? `${id}-error` : undefined}
        disabled={disabled}
      />

      {isPassword && (
        <button
          type="button"
          className="password-toggle-btn"
          onMouseDown={handleTogglePassword}
          tabIndex="-1"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}

      <label className="form-label" htmlFor={id}>
        {label}
      </label>

      {errorMessage ? (
        <p className="form-error" id={`${id}-error`}>
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default FormGroup;