import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    withCredentials: true,
});

export async function register({ name, email, password }) {
    try {
        const response = await api.post('/api/auth/register', {
            name,
            email,
            password,
        });

        return response.data;
    } catch (err) {
        throw err;
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post('/api/auth/login', {
            email,
            password,
        });
        return response.data;
    } catch (error) {
        throw new Error('Login Failed');
    }
}

export async function verifyEmail({ email, otp }) {
    try {
        const response = await api.post('/api/auth/verify-email', {
            email,
            otp,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function resendOtp({ email }) {
    try {
        const response = await api.post('/api/auth/resend-otp', {
            email,
        });

        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function requestPasswordReset({ email }) {
    const response = await api.post('/api/auth/forgot-password', {
        email,
    });

    return response.data;
}

export async function resetPassword({ email, otp, password, confirmPassword }) {
    const response = await api.post('/api/auth/reset-password', {
        email,
        otp,
        password,
        confirmPassword,
    });

    return response.data;
}

export async function logout() {
    try {
        await api.post('/api/auth/logout');
    } catch (err) {
        console.error('Logout Failed', err);
    }
}

export async function getMe() {
    try {
        const response = await api.get('/api/auth/get-me');
        return response.data;
    } catch (err) {
        console.error('Failed to fetch user data', err);
        return null;
    }
}
