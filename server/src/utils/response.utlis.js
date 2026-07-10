import jwt from 'jsonwebtoken';
import envConfig from '../config/envConfig.js';

/**
 * Centralised response structure
 */
export async function sendResponse({
    res,
    statusCode,
    message,
    success,
    error = null,
    ...additionalData
}) {
    return res.status(statusCode).json({
        message,
        success,
        error,
        ...additionalData,
    });
}

/**
 * Set the JWT token cookie on response
 */
export function setTokenCookie(res, token) {
    const cookieOptions = {
        ...envConfig.AUTH_COOKIE_OPTIONS,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };
    res.cookie('token', token, cookieOptions);
}

/**
 * Sign user token, set cookie, and send user response
 */
export async function sendTokenResponse(res, statusCode, message, user) {
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        envConfig.JWT_SECRET,
        { expiresIn: '24h' },
    );

    setTokenCookie(res, token);

    return sendResponse({
        res,
        statusCode,
        message,
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        },
    });
}
