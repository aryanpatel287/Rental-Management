import { useContext, useState } from 'react';
import { AuthContext } from '../auth.context';
import { resendOtp, verifyEmail } from '../services/auth.api';

export const useVerifyEmail = () => {
    const context = useContext(AuthContext);
    const { setUser } = context;

    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [resendMessage, setResendMessage] = useState('');

    const handleVerifyEmail = async ({ email, otp }) => {
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        setResendMessage('');

        try {
            const data = await verifyEmail({ email, otp });

            if (data?.success) {
                setSuccessMessage(
                    data.message || 'Email verified successfully',
                );
            }

            if (data?.user) {
                setUser(data.user);
            }

            return { success: true, data };
        } catch (err) {
            const responseData = err?.response?.data;
            const message =
                responseData?.message ||
                err?.message ||
                'Email verification failed.';
            const errors = Array.isArray(responseData?.errors)
                ? responseData.errors
                : [];

            setError(message);

            return {
                success: false,
                message,
                errors,
            };
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async ({ email }) => {
        setResendLoading(true);
        setError(null);
        setResendMessage('');

        try {
            const normalizedEmail =
                typeof email === 'string' ? email.trim().toLowerCase() : '';

            const data = await resendOtp({ email: normalizedEmail });

            if (data?.success) {
                setResendMessage(data.message || 'OTP resent successfully.');
            }

            return { success: true, data };
        } catch (err) {
            const responseData = err?.response?.data;
            const message =
                responseData?.message ||
                err?.message ||
                'Unable to resend OTP.';

            setError(message);

            return {
                success: false,
                message,
            };
        } finally {
            setResendLoading(false);
        }
    };

    return {
        handleVerifyEmail,
        handleResendOtp,
        loading,
        resendLoading,
        error,
        successMessage,
        resendMessage,
    };
};
