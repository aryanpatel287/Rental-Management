import React, { useMemo } from 'react';

import '../styles/password-meter.scss';

const PasswordMeter = ({ password = '', isVisible }) => {
    const checks = useMemo(
        () => [
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
        ],
        [password],
    );

    const shouldShow =
        typeof isVisible === 'boolean' ? isVisible : password.length > 0;

    if (!shouldShow) {
        return null;
    }

    return (
        <ul className="password-rules" aria-label="Password requirements">
            {checks.map((rule) => (
                <li key={rule.label} className={rule.valid ? 'is-valid' : ''}>
                    <span className="password-rule-dot" aria-hidden="true" />
                    <span>{rule.label}</span>
                </li>
            ))}
        </ul>
    );
};

export default PasswordMeter;
