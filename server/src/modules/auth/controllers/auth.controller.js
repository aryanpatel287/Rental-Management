import * as authService from '../services/auth.service.js';
import { sendResponse, sendTokenResponse } from '../../../utils/response.utlis.js';

/**
 * Handle user registration request
 */
export async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;
        const user = await authService.register({ name, email, password });
        return sendTokenResponse(res, 201, 'User registered successfully', user);
    } catch (error) {
        next(error);
    }
}

/**
 * Handle user login request
 */
export async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const user = await authService.login({ email, password });
        return sendTokenResponse(res, 200, 'User logged in successfully', user);
    } catch (error) {
        next(error);
    }
}

/**
 * Handle user logout request
 */
export async function logout(req, res, next) {
    try {
        const token = req.token || req.cookies.token;
        if (token) {
            await authService.logout(token);
        }
        
        res.clearCookie('token');

        return sendResponse({
            res,
            statusCode: 200,
            message: 'User logged out successfully',
            success: true,
        });
    } catch (error) {
        next(error);
    }
}
