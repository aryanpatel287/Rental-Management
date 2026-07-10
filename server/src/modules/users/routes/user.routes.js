import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { protect, restrictTo } from '../../auth/middleware/auth.middleware.js';
import { updateProfileValidator, updateUserAdminValidator } from '../validators/user.validator.js';

const router = Router();

// Protect all routes in User Module
router.use(protect);

// Self endpoints
router.patch('/profile', updateProfileValidator, userController.updateProfile);
router.get('/:id', userController.getUserById);

// Vendor/Customer queries
router.get('/vendors', userController.getVendors);
router.get('/customers', restrictTo('ADMIN', 'VENDOR'), userController.getCustomers);

// Administrative endpoints (Admin only)
router.use(restrictTo('ADMIN'));

router.get('/', userController.listUsers);
router.patch('/:id', updateUserAdminValidator, userController.updateUserAdmin);
router.delete('/:id', userController.deleteUser);

export default router;
