import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';

/**
 * RegisterPage view
 */
const RegisterPage = () => {
  const { register, actionLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Inputs state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Field validation errors state
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Input refs for focus management
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // If already authenticated, redirect to profile immediately
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (actionLoading) return;
    setFormError(null);

    // Local basic validations first
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Full Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus first error field
      if (newErrors.name) {
        nameRef.current?.focus();
      } else if (newErrors.email) {
        emailRef.current?.focus();
      } else if (newErrors.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    // Reset errors and execute registration
    setErrors({});
    const result = await register(name, email, password);

    if (result.success) {
      navigate('/profile');
    } else {
      if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
        // Parse field validation errors from backend
        const backendErrors = {};
        result.errors.forEach((err) => {
          backendErrors[err.path] = err.msg;
        });
        setErrors(backendErrors);

        // Focus first field with error
        if (backendErrors.name) {
          nameRef.current?.focus();
        } else if (backendErrors.email) {
          emailRef.current?.focus();
        } else if (backendErrors.password) {
          passwordRef.current?.focus();
        }
      } else {
        // Show general error message inside the form
        setFormError(result.message || 'Registration failed');
      }
    }
  };

  return (
    <main className="auth-canvas" role="main">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo" aria-hidden="true">
            <i className="ri-command-fill" />
          </div>
          <h2>Create your account</h2>
          <p>Get started with Goat Template developer platform tools</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {formError && (
            <div className="auth-alert" role="alert">
              <i className="ri-error-warning-fill" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="register-name">Full Name</label>
            <div className="input-wrapper">
              <input
                ref={nameRef}
                id="register-name"
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe…"
                className={`text-input ${errors.name ? 'text-input--error' : ''}`}
                autoComplete="name"
                disabled={actionLoading}
                required
              />
              <i className="ri-user-line" aria-hidden="true" />
            </div>
            {errors.name && (
              <span className="form-error-text" id="name-error">
                <i className="ri-error-warning-fill" aria-hidden="true" />
                {errors.name}
              </span>
            )}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="register-email">Email Address</label>
            <div className="input-wrapper">
              <input
                ref={emailRef}
                id="register-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com…"
                className={`text-input ${errors.email ? 'text-input--error' : ''}`}
                autoComplete="email"
                spellCheck={false}
                disabled={actionLoading}
                required
              />
              <i className="ri-mail-line" aria-hidden="true" />
            </div>
            {errors.email && (
              <span className="form-error-text" id="email-error">
                <i className="ri-error-warning-fill" aria-hidden="true" />
                {errors.email}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <div className="input-wrapper">
              <input
                ref={passwordRef}
                id="register-password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters…"
                className={`text-input ${errors.password ? 'text-input--error' : ''}`}
                autoComplete="new-password"
                disabled={actionLoading}
                required
              />
              <i className="ri-lock-line" aria-hidden="true" />
            </div>
            {errors.password && (
              <span className="form-error-text" id="password-error">
                <i className="ri-error-warning-fill" aria-hidden="true" />
                {errors.password}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="button-primary"
            disabled={actionLoading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {actionLoading ? (
              <>
                <i
                  className="ri-loader-5-line"
                  style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }}
                  aria-hidden="true"
                />
                <span>Creating account…</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
