import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import FormGroup from '../components/FormGroup';
import '../styles/verify-email.scss';
import { useVerifyEmail } from '../hooks/useVerifyEmail.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const otpPattern = /^[A-Za-z0-9]{6}$/;
const OTP_COOLDOWN_SECONDS = 300;

const formatCountdown = (seconds) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');

    return `${mins}:${secs}`;
};

const createInitialErrors = () => ({
    email: '',
    otp: '',
});

const VerifyEmail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        handleVerifyEmail,
        handleResendOtp,
        loading,
        resendLoading,
        error,
        successMessage,
        resendMessage,
    } = useVerifyEmail();

    const initialEmail = useMemo(() => {
        const stateEmail = location.state?.email;

        if (typeof stateEmail === 'string' && stateEmail.trim()) {
            return stateEmail.trim().toLowerCase();
        }

        const searchParams = new URLSearchParams(location.search);
        const queryEmail = searchParams.get('email');

        return typeof queryEmail === 'string'
            ? queryEmail.trim().toLowerCase()
            : '';
    }, [location.search, location.state]);

    const [formValues, setFormValues] = useState({
        email: initialEmail,
        otp: '',
    });
    const [errors, setErrors] = useState(createInitialErrors);
    const [touched, setTouched] = useState({
        email: false,
        otp: false,
    });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [resendSecondsLeft, setResendSecondsLeft] = useState(() => {
        const stateCooldown = location.state?.cooldownSeconds;

        if (
            typeof stateCooldown === 'number' &&
            Number.isFinite(stateCooldown) &&
            stateCooldown >= 0
        ) {
            return Math.floor(stateCooldown);
        }

        return OTP_COOLDOWN_SECONDS;
    });

    useEffect(() => {
        if (successMessage) {
            setShowSuccessModal(true);
        }
    }, [successMessage]);

    useEffect(() => {
        if (resendSecondsLeft <= 0) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setResendSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [resendSecondsLeft]);

    const validateField = (fieldName, fieldValue) => {
        if (fieldName === 'email') {
            if (!fieldValue.trim()) {
                return 'Email is required.';
            }

            return emailPattern.test(fieldValue.trim())
                ? ''
                : 'Enter a valid email address.';
        }

        if (fieldName === 'otp') {
            if (!fieldValue.trim()) {
                return 'OTP is required.';
            }

            return otpPattern.test(fieldValue.trim())
                ? ''
                : 'OTP must be exactly 6 letters/numbers.';
        }

        return '';
    };

    const validateForm = () => {
        const nextErrors = {
            email: validateField('email', formValues.email),
            otp: validateField('otp', formValues.otp),
        };

        setErrors(nextErrors);
        setTouched({ email: true, otp: true });

        return !Object.values(nextErrors).some(Boolean);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        const nextValue = name === 'otp' ? value.replace(/\s+/g, '') : value;

        setFormValues((prev) => ({ ...prev, [name]: nextValue }));

        if (touched[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: validateField(name, nextValue),
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

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const result = await handleVerifyEmail({
            email: formValues.email.trim().toLowerCase(),
            otp: formValues.otp.trim(),
        });

        if (result?.success) {
            setErrors(createInitialErrors());
            setTouched({ email: false, otp: false });
            return;
        }

        const nextErrors = createInitialErrors();

        if (Array.isArray(result?.errors)) {
            result.errors.forEach((fieldError) => {
                const fieldName = fieldError.path || fieldError.param || '';

                if (fieldName && nextErrors[fieldName] !== undefined) {
                    nextErrors[fieldName] =
                        fieldError.msg || fieldError.message || result.message;
                }
            });
        }

        if (nextErrors.email || nextErrors.otp) {
            setErrors(nextErrors);
            setTouched({ email: true, otp: true });
        }
    };

    const handleResendClick = async () => {
        if (resendSecondsLeft > 0 || resendLoading) {
            return;
        }

        const result = await handleResendOtp({ email: formValues.email });

        if (result?.success) {
            setResendSecondsLeft(OTP_COOLDOWN_SECONDS);
        }
    };

    return (
        <main className="auth-page auth-page--verify-email">
            <div className="form-container auth-form-container auth-form-container--verify">
                <div className="form-header">
                    <h1 className="form-title">Verify your email</h1>
                    <p className="form-subtitle">
                        Enter the 6-digit code we sent to your email address.
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <FormGroup
                        label="Email"
                        id="verify-email"
                        name="email"
                        type="email"
                        value={formValues.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        hasError={Boolean(touched.email && errors.email)}
                        errorMessage={touched.email ? errors.email : ''}
                    />

                    <FormGroup
                        label="OTP"
                        id="otp"
                        name="otp"
                        type="text"
                        value={formValues.otp}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        hasError={Boolean(touched.otp && errors.otp)}
                        errorMessage={touched.otp ? errors.otp : ''}
                    />

                    <div className="verify-resend-row">
                        <p className="verify-resend-hint">
                            {resendSecondsLeft > 0
                                ? `Resend available in ${formatCountdown(resendSecondsLeft)}`
                                : 'Did not receive the code?'}
                        </p>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleResendClick}
                            disabled={
                                resendLoading ||
                                loading ||
                                resendSecondsLeft > 0 ||
                                !formValues.email.trim()
                            }
                        >
                            {resendLoading ? 'Resending...' : 'Resend OTP'}
                        </button>
                    </div>

                    {error ? (
                        <div className="form-status" role="alert">
                            {error}
                        </div>
                    ) : null}

                    {!error && resendMessage ? (
                        <div
                            className="form-status form-status--success"
                            role="status"
                            aria-live="polite"
                        >
                            {resendMessage}
                        </div>
                    ) : null}

                    <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <p className="form-footer">
                    <Link to="/register">Back to register</Link>
                </p>
            </div>

            {showSuccessModal ? (
                <div className="verify-modal-backdrop" role="presentation">
                    <section
                        className="verify-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="verify-success-title"
                    >
                        <div className="verify-modal__icon" aria-hidden="true">
                            ✓
                        </div>
                        <h2
                            id="verify-success-title"
                            className="verify-modal__title"
                        >
                            Email verified successfully
                        </h2>
                        <p className="verify-modal__text">
                            Your account is now verified. You can continue to
                            login.
                        </p>
                        <div className="verify-modal__actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => navigate('/login')}
                            >
                                Continue to login
                            </button>
                        </div>
                    </section>
                </div>
            ) : null}
        </main>
    );
};

export default VerifyEmail;
