import React, { useState } from 'react';
import { Link, Navigate } from 'react-router';

import FormGroup from '../components/FormGroup';
import { useAuth } from '../hooks/useAuth';
import {
    validateEmail,
    validateRequiredPassword,
} from '../utils/validation.utils';
import '../styles/auth.scss';

const createInitialErrors = () => ({
    email: '',
    password: '',
});

const Login = () => {
    const { handleLogin, loading, error, user } = useAuth();
    const [formValues, setFormValues] = useState({
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [touched, setTouched] = useState({
        email: false,
        password: false,
    });

    const [errors, setErrors] = useState(createInitialErrors);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    if (user) {
        return <Navigate to="/" replace />;
    }

    const validateField = (fieldName, fieldValue) => {
        if (fieldName === 'email') {
            return validateEmail(fieldValue);
        }

        if (fieldName === 'password') {
            return validateRequiredPassword(fieldValue);
        }

        return '';
    };

    const validateForm = () => {
        const nextErrors = {
            email: validateField('email', formValues.email),
            password: validateField('password', formValues.password),
        };

        setErrors(nextErrors);
        setTouched({ email: true, password: true });

        return !Object.values(nextErrors).some(Boolean);
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        handleChange(event);

        if (touched[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: validateField(name, value),
            }));
        }
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;

        setTouched((prev) => ({ ...prev, [name]: true }));
        setErrors((prev) => ({
            ...prev,
            [name]: validateField(name, value),
        }));
    };
    const isBusy = loading && isSubmitting;

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!validateForm()) {
            return;
        }

        try {
            await handleLogin({
                email: formValues.email,
                password: formValues.password,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-page auth-page--login">
            <section className="form-container auth-form-container auth-form-container--login">
                <div className="auth-branding">
                    <div className="auth-copy">
                        <p className="auth-eyebrow">Welcome back</p>
                        <h1 className="form-title">Sign in to your account</h1>
                        <p className="form-subtitle">
                            Access your workspace with the credentials you
                            already use.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="form-error form-error--inline">{error}</div>
                )}

                <form
                    className="auth-form"
                    onSubmit={handleFormSubmit}
                    noValidate
                >
                    <FormGroup
                        label="Email"
                        id="email"
                        name="email"
                        type="email"
                        value={formValues.email}
                        onBlur={handleBlur}
                        hasError={Boolean(touched.email && errors.email)}
                        errorMessage={touched.email ? errors.email : ''}
                        onChange={handleChange}
                        disabled={isBusy}
                    />

                    <FormGroup
                        label="Password"
                        id="password"
                        name="password"
                        type="password"
                        value={formValues.password}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        hasError={Boolean(touched.password && errors.password)}
                        errorMessage={touched.password ? errors.password : ''}
                        disabled={isBusy}
                    />

                    <div className="auth-actions">
                        <button
                            className="btn btn-auth-submit auth-submit-btn"
                            type="submit"
                            disabled={isBusy}
                            onChange={handleChange}
                        >
                            {isBusy ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>

                <div className="auth-footer-row">
                    <Link className="auth-link" to="/forgot-password">
                        Forgot password?
                    </Link>
                    <p className="form-footer">
                        New here?{' '}
                        <Link className="auth-link" to="/register">
                            Create account
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
};

export default Login;
