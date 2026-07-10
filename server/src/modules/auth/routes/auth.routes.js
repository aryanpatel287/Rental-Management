import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as userController from '../controllers/user.controller.js';
import { protect, restrictTo, rateLimiter } from '../middleware/auth.middleware.js';
import { 
    registerValidator, 
    loginValidator, 
    updateProfileValidator, 
    changePasswordValidator, 
    updateRoleValidator 
} from '../validators/auth.validator.js';

const router = Router();

const authRateLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 30 });

// Public Routes
router.post('/register', authRateLimiter, registerValidator, authController.register);
router.post('/login', authRateLimiter, loginValidator, authController.login);
router.post('/logout', authController.logout);

// Authenticated Routes
router.use(protect);

router.get('/me', userController.getMe);
router.patch('/profile', updateProfileValidator, userController.updateProfile);
router.patch('/change-password', changePasswordValidator, userController.changePassword);
router.delete('/account', userController.deleteAccount);

// Admin Only Routes
router.use(restrictTo('ADMIN'));

router.get('/users', userController.adminListUsers);
router.get('/users/:id', userController.adminGetUserById);
router.patch('/users/:id/role', updateRoleValidator, userController.adminUpdateRole);
router.delete('/users/:id', userController.adminDeleteUser);

export default router;
