import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';

import FormGroup from '../components/FormGroup';
import PasswordMeter from '../components/PasswordMeter';
import { useAuth } from '../hooks/useAuth';
import {
    validateEmail,
    validatePasswordMatch,
    validatePasswordStrength,
} from '../utils/validation.utils';
import '../styles/auth.scss';

//FIXME: The otp in the server is case sensitive and in the input of password -> 4MOS9X (all caps are value are uppercase)
// - the input should be case sensitive as well otherwise the otp will be invalid

//TODO: add resend otp functionality from the frontend side (server side api is implemented - check the auth.routes)
//TODO: add a timer cooldown for the 120 seconds and the check for the resend limit reached (server side api is implemented - check the auth.routes)
//NOTE: both functionality are a case of the same api response from the server when requesting otp - check the auth.routes for more details

const initialFormValues = {
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
};

const createInitialErrors = () => ({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
});

const createInitialTouched = (step = 'request') => ({
    email: false,
    otp: step === 'reset',
    password: step === 'reset',
    confirmPassword: step === 'reset',
});

const normalizeOtpValue = (value) => value.replace(/\s+/g, '');

const getFieldError = (fieldName, fieldValue, values = {}) => {
    if (fieldName === 'email') {
        return validateEmail(fieldValue);
    }

    if (fieldName === 'otp') {
        if (!fieldValue.trim()) {
            return 'OTP is required.';
        }

        return fieldValue.trim().length === 6
            ? ''
            : 'OTP must be exactly 6 characters long.';
    }

    if (fieldName === 'password') {
        return validatePasswordStrength(fieldValue);
    }

    if (fieldName === 'confirmPassword') {
        return validatePasswordMatch(values.password, fieldValue);
    }

    return '';
};

const getValidationErrors = (step, values) => ({
    email: getFieldError('email', values.email),
    otp: step === 'reset' ? getFieldError('otp', values.otp) : '',
    password:
        step === 'reset' ? getFieldError('password', values.password) : '',
    confirmPassword:
        step === 'reset'
            ? getFieldError('confirmPassword', values.confirmPassword, values)
            : '',
});

const getStepCopy = (step) =>
    step === 'request'
        ? 'Enter your email address and we will send a one-time password to help you reset your password.'
        : 'Enter the OTP we sent and choose a new password.';

const getSubmitLabel = (step, loading) => {
    if (step === 'request') {
        return loading ? 'Sending OTP...' : 'Send OTP';
    }

    return loading ? 'Resetting password...' : 'Reset password';
};

const getBannerClassName = (statusType) =>
    statusType === 'success'
        ? 'toast-banner is-success'
        : 'toast-banner is-error';

const StatusBanner = ({ message, statusType }) => {
    if (!message) {
        return null;
    }

    return (
        <div
            className={getBannerClassName(statusType)}
            role="status"
            aria-live="polite"
        >
            {message}
        </div>
    );
};

const ResetPasswordFields = ({
    formValues,
    errors,
    touched,
    onChange,
    onBlur,
    loading,
}) => (
    <>
        <FormGroup
            label="OTP"
            id="otp"
            name="otp"
            type="text"
            value={formValues.otp}
            onChange={onChange}
            onBlur={onBlur}
            hasError={Boolean(touched.otp && errors.otp)}
            errorMessage={touched.otp ? errors.otp : ''}
            disabled={loading}
        />
        <p className="otp-help">
            Use the OTP from your email. It expires in 5 minutes.
        </p>
        <FormGroup
            label="New password"
            id="password"
            name="password"
            type="password"
            value={formValues.password}
            onChange={onChange}
            onBlur={onBlur}
            hasError={Boolean(touched.password && errors.password)}
            errorMessage={touched.password ? errors.password : ''}
            disabled={loading}
        >
            <PasswordMeter password={formValues.password} />
        </FormGroup>
        <FormGroup
            label="Confirm password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formValues.confirmPassword}
            onChange={onChange}
            onBlur={onBlur}
            hasError={Boolean(
                touched.confirmPassword && errors.confirmPassword,
            )}
            errorMessage={touched.confirmPassword ? errors.confirmPassword : ''}
            disabled={loading}
        />
    </>
);

const ForgotPasswordFields = ({
    step,
    formValues,
    errors,
    touched,
    onChange,
    onBlur,
    loading,
}) => (
    <>
        <FormGroup
            label="Email"
            id="email"
            name="email"
            type="email"
            value={formValues.email}
            onChange={onChange}
            onBlur={onBlur}
            hasError={Boolean(touched.email && errors.email)}
            errorMessage={touched.email ? errors.email : ''}
            disabled={loading || step === 'reset'}
        />

        {step === 'reset' ? (
            <ResetPasswordFields
                formValues={formValues}
                errors={errors}
                touched={touched}
                onChange={onChange}
                onBlur={onBlur}
                loading={loading}
            />
        ) : null}
    </>
);

const ForgotPassword = () => {
    const { user, handleRequestPasswordReset, handleResetPassword, error } =
        useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState('request');
    const [formValues, setFormValues] = useState(initialFormValues);
    const [errors, setErrors] = useState(createInitialErrors);
    const [touched, setTouched] = useState(() =>
        createInitialTouched('request'),
    );
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // if (!isInitialized) {
    //     return <div>Loading...</div>;
    // }

    if (user) {
        return <Navigate to="/" replace />;
    }

    const validateForm = () => {
        const nextErrors = getValidationErrors(step, formValues);

        setErrors(nextErrors);
        setTouched(createInitialTouched(step));

        return !Object.values(nextErrors).some(Boolean);
    };

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        const normalizedValue =
            name === 'otp' ? normalizeOtpValue(value) : value;

        const nextValues = {
            ...formValues,
            [name]: normalizedValue,
        };

        setFormValues(nextValues);

        if (touched[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: getFieldError(name, normalizedValue, nextValues),
            }));
        }

        if (statusMessage) {
            setStatusMessage('');
            setStatusType('');
        }
    };

    const handleBlur = (event) => {
        const { name, value } = event.target;
        const normalizedValue =
            name === 'otp' ? normalizeOtpValue(value) : value;

        setTouched((prev) => ({
            ...prev,
            [name]: true,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: getFieldError(name, normalizedValue, {
                ...formValues,
                [name]: normalizedValue,
            }),
        }));
    };

    const handleRequestOtp = async (event) => {
        event.preventDefault();
        setStatusMessage('');
        setStatusType('');

        if (!validateForm()) {
            return;
        }

        let result;
        setIsSubmitting(true);

        try {
            result = await handleRequestPasswordReset({
                email: formValues.email,
            });
        } finally {
            setIsSubmitting(false);
        }

        if (!result.success) {
            return;
        }

        setStep('reset');
        setStatusMessage(
            result.data?.message ||
                'If an account exists for this email, a password reset OTP has been sent.',
        );
        setStatusType('success');
    };

    const handleResetPasswordSubmit = async (event) => {
        event.preventDefault();
        setStatusMessage('');
        setStatusType('');

        if (!validateForm()) {
            return;
        }

        let result;
        setIsSubmitting(true);

        try {
            result = await handleResetPassword({
                email: formValues.email,
                otp: formValues.otp,
                password: formValues.password,
                confirmPassword: formValues.confirmPassword,
            });
        } finally {
            setIsSubmitting(false);
        }

        if (!result.success) {
            return;
        }

        navigate('/login', { replace: true });
    };

    return (
        <main className="auth-page auth-page--split">
            <div className="auth-hero-pane">
                <div className="auth-hero-content">
                    <div className="auth-hero-logo">
                        <svg className="auth-hero-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="auth-hero-title">RentalHub</h2>
                    <p className="auth-hero-tagline">Seamless rental management, from quotation to checkout.</p>
                </div>
            </div>

            <div className="auth-form-pane">
                <section className="auth-form-card">
                    <div className="form-header">
                        <h1 className="form-title">Forgot password</h1>
                        <p className="forgot-password-copy">{getStepCopy(step)}</p>
                    </div>

                    <StatusBanner
                        message={error || statusMessage}
                        statusType={error ? 'error' : statusType}
                    />

                    <form
                        onSubmit={
                            step === 'request'
                                ? handleRequestOtp
                                : handleResetPasswordSubmit
                        }
                        noValidate
                    >
                        <ForgotPasswordFields
                            step={step}
                            formValues={formValues}
                            errors={errors}
                            touched={touched}
                            onChange={handleFieldChange}
                            onBlur={handleBlur}
                            loading={isSubmitting}
                        />

                        <button
                            className="btn btn-auth-submit"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {getSubmitLabel(step, isSubmitting)}
                        </button>
                    </form>

                    <p className="form-footer">
                        <Link className="auth-link" to="/login">Back to login</Link>
                    </p>
                </section>
            </div>
        </main>
    );
};

export default ForgotPassword;
