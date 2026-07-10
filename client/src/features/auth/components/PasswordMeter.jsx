import React, { useMemo } from 'react';
import { Check } from 'lucide-react';

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

    const strength = useMemo(() => {
        const passedCount = checks.filter(c => c.valid).length;
        if (password.length === 0) return { label: 'Empty', score: 0, colorClass: 'empty' };
        if (passedCount <= 1) return { label: 'Weak', score: 1, colorClass: 'weak' };
        if (passedCount <= 3) return { label: 'Medium', score: 2, colorClass: 'medium' };
        return { label: 'Strong', score: 3, colorClass: 'strong' };
    }, [checks, password]);

    if (!shouldShow) {
        return null;
    }

    return (
        <div className="password-meter-container" aria-label="Password strength assessment">
            <div className="password-meter-header">
                <span className="password-meter-title">Password Strength</span>
                <span className={`password-meter-status is-${strength.colorClass}`}>
                    {strength.label}
                </span>
            </div>

            <div className="password-meter-progress">
                <div className={`progress-bar-segment ${strength.score >= 1 ? `is-${strength.colorClass}` : ''}`} />
                <div className={`progress-bar-segment ${strength.score >= 2 ? `is-${strength.colorClass}` : ''}`} />
                <div className={`progress-bar-segment ${strength.score >= 3 ? `is-${strength.colorClass}` : ''}`} />
            </div>

            <ul className="password-rules" aria-label="Password requirements">
                {checks.map((rule) => (
                    <li key={rule.label} className={rule.valid ? 'is-valid' : ''}>
                        {rule.valid ? (
                            <Check className="password-rule-icon is-valid" size={14} />
                        ) : (
                            <div className="password-rule-dot" aria-hidden="true" />
                        )}
                        <span>{rule.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PasswordMeter;
