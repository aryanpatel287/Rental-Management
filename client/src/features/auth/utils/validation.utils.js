export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const defaultEmailMessages = {
    required: 'Email is required.',
    invalid: 'Enter a valid email address.',
};

export const defaultPasswordMessages = {
    required: 'Password is required.',
    minLength: 'Password must be at least 8 characters long.',
    strength: 'Password must include at least one uppercase letter, one number, and one special character.',
    confirmRequired: 'Please confirm your new password.',
    mismatch: 'Passwords do not match.',
};

export const validateEmail = (value, options = {}) => {
    const { requiredMessage = defaultEmailMessages.required, invalidMessage = defaultEmailMessages.invalid } = options;

    if (!value?.trim()) {
        return requiredMessage;
    }

    return emailPattern.test(value.trim()) ? '' : invalidMessage;
};

export const validateRequiredPassword = (value, options = {}) => {
    const { requiredMessage = defaultPasswordMessages.required } = options;

    return value?.trim() ? '' : requiredMessage;
};

export const validatePasswordStrength = (value, options = {}) => {
    const {
        requiredMessage = defaultPasswordMessages.required,
        minLengthMessage = defaultPasswordMessages.minLength,
        strengthMessage = defaultPasswordMessages.strength,
    } = options;

    const trimmedPassword = value?.trim() ?? '';

    if (!trimmedPassword) {
        return requiredMessage;
    }

    if (trimmedPassword.length < 8) {
        return minLengthMessage;
    }

    if (!passwordPattern.test(trimmedPassword)) {
        return strengthMessage;
    }

    return '';
};

export const validatePasswordMatch = (password, confirmPassword, options = {}) => {
    const { requiredMessage = defaultPasswordMessages.confirmRequired, mismatchMessage = defaultPasswordMessages.mismatch } = options;

    if (!confirmPassword?.trim()) {
        return requiredMessage;
    }

    return password === confirmPassword ? '' : mismatchMessage;
};

export const getPasswordChecks = (password) => [
    {
        label: 'At least 8 characters',
        valid: password.length >= 8,
    },
    {
        label: 'One uppercase letter',
        valid: /[A-Z]/.test(password),
    },
    {
        label: 'One number',
        valid: /\d/.test(password),
    },
    {
        label: 'One special character',
        valid: /[^A-Za-z0-9]/.test(password),
    },
];
