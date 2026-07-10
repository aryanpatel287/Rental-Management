import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth.js';

/**
 * LoginPage view
 */
const LoginPage = () => {
  const { login, actionLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Inputs state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Field validation errors state
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Input refs for focus management
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
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus first error field
      if (newErrors.email) {
        emailRef.current?.focus();
      } else if (newErrors.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    // Reset errors and execute login
    setErrors({});
    const result = await login(email, password);

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
        if (backendErrors.email) {
          emailRef.current?.focus();
        } else if (backendErrors.password) {
          passwordRef.current?.focus();
        }
      } else {
        // Show general error message inside the form
        setFormError(result.message || 'Invalid email or password');
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
          <h2>Welcome back</h2>
          <p>Sign in to manage your Goat Template projects</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {formError && (
            <div className="auth-alert" role="alert">
              <i className="ri-error-warning-fill" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="input-wrapper">
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@example.com…"
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
            <label htmlFor="login-password">Password</label>
            <div className="input-wrapper">
              <input
                ref={passwordRef}
                id="login-password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`text-input ${errors.password ? 'text-input--error' : ''}`}
                autoComplete="current-password"
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
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?
          <Link to="/register">Sign up</Link>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
