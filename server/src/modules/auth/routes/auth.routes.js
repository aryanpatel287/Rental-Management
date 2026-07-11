import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect, rateLimiter } from '../middleware/auth.middleware.js';
import { 
    registerValidator, 
    loginValidator, 
    changePasswordValidator, 
    forgotPasswordValidator, 
    resetPasswordValidator
} from '../validators/auth.validator.js';

const router = Router();

const authRateLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 30 });

// Public Routes
router.post('/register', authRateLimiter, registerValidator, authController.register);
router.post('/login', authRateLimiter, loginValidator, authController.login);
router.post('/forgot-password', authRateLimiter, forgotPasswordValidator, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOtpHandler);
router.post('/logout', authController.logout);

// Authenticated Routes
router.use(protect);

router.get('/me', authController.getMe);
router.get('/get-me', authController.getMe);
router.patch('/change-password', changePasswordValidator, authController.changePassword);

export default router;

