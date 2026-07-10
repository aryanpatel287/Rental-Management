import { useState, useContext } from 'react';

import { AuthContext } from '../auth.context';
import {
    register,
    login,
    requestPasswordReset,
    resetPassword,
    logout,
    getMe,
} from '../services/auth.api';

export const useAuth = () => {
    const context = useContext(AuthContext);

    const { loading, setLoading, user, setUser, error, setError } = context;

    const handleRegister = async ({ name, email, password }) => {
        setLoading(true);
        setError(null);

        let data;
        try {
            data = await register({ name, email, password });
            console.log('Registration Failed', data);
            if (data?.user) {
                setUser(data.user);
                sessionStorage.setItem('user', JSON.stringify(data.user));
            }

            return data;
        } catch (err) {
            const responseData = err?.response?.data;
            const message =
                responseData?.message || err?.message || 'Registration failed.';
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

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        setError(null);

        let data;
        try {
            data = await login({ email, password });
            if (data?.user) {
                setUser(data.user);
                sessionStorage.setItem('user', JSON.stringify(data.user));
            } else {
                throw new Error(data?.message || 'Login Failed');
            }
        } catch (error) {
            setError(data?.message || 'Login Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPasswordReset = async ({ email }) => {
        setLoading(true);
        setError(null);

        try {
            const data = await requestPasswordReset({ email });

            if (data?.success === false) {
                setError(data.message || 'Request failed.');
                return {
                    success: false,
                    message: data.message || 'Request failed.',
                };
            }

            return { success: true, data };
        } catch (err) {
            const responseData = err?.response?.data;
            const message =
                responseData?.message ||
                err?.message ||
                'Unable to send reset email.';

            setError(message);

            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async ({
        email,
        otp,
        password,
        confirmPassword,
    }) => {
        setLoading(true);
        setError(null);

        try {
            const data = await resetPassword({
                email,
                otp,
                password,
                confirmPassword,
            });

            if (data?.success === false) {
                setError(data.message || 'Password reset failed.');
                return {
                    success: false,
                    message: data.message || 'Password reset failed.',
                };
            }

            setUser(null);
            sessionStorage.removeItem('user');

            return { success: true, data };
        } catch (err) {
            const responseData = err?.response?.data;
            const message =
                responseData?.message ||
                err?.message ||
                'Password reset failed.';

            setError(message);

            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            sessionStorage.removeItem('user');
        } catch (error) {
            console.error('Logout Failed', error);
        }
    };

    const handleGetMe = async () => {
        let data;
        try {
            setLoading(true);

            if (sessionStorage.getItem('user')) {
                setUser(JSON.parse(sessionStorage.getItem('user')));
                return;
            }

            data = await getMe();
            setUser(data?.user || null);
        } catch (error) {
            console.error('Failed to fetch user data', error);
            setError(data?.message || 'Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    return {
        handleRegister,
        handleLogin,
        handleLogout,
        handleRequestPasswordReset,
        handleResetPassword,
        handleGetMe,
        user,
        loading,
        error,
    };
};
