import { Router } from 'express';
import {
    registerUserController,
    loginUserController,
    forgotPasswordController,
    resetPasswordController,
    logoutUserController,
    getMeController,
    verifyEmailController,
    resendOtpController,
} from '../controllers/auth.controller.js';
import {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
} from '../validators/auth.validators.js';
import { authUser, rateLimiting } from '../middlewares/auth.middleware.js';

const authRoutes = Router();

/**
 * @route POST /api/auth/register
 * @description Register a user
 * @access Public
 */
authRoutes.post('/register', registerValidator, registerUserController);

/**
 * @route POST /api/auth/login
 * @description Login a user
 * @access Public
 */
authRoutes.post('/login', loginValidator, loginUserController);

/**
 * @route POST /api/auth/forgot-password
 * @description Initiate forgot password process
 * @access Public
 */
authRoutes.post(
    '/forgot-password',
    rateLimiting,
    forgotPasswordValidator,
    forgotPasswordController,
);

/**
 * @route POST /api/auth/reset-password
 * @description Reset password using OTP
 * @access Public
 */
authRoutes.post(
    '/reset-password',
    resetPasswordValidator,
    resetPasswordController,
);

/**
 * @route POST /api/auth/logout
 * @description Logout a user
 * @access Private
 */
authRoutes.post('/logout', authUser, logoutUserController);

/**
 * @route GET /api/auth/get-me
 * @description Get current user profile
 * @access Private
 */
authRoutes.get('/get-me', authUser, getMeController);

/**
 * @route POST /api/auth/verify-email
 * @description Verify user's email address
 * @access Public
 */
authRoutes.post('/verify-email', verifyEmailController);

/**
 * @route POST /api/auth/resend-otp
 * @description Resend OTP for email verification
 * @access Public
 */
authRoutes.post('/resend-otp', resendOtpController);

export default authRoutes;
