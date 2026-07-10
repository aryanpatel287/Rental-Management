import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { protect, restrictTo } from '../../auth/index.js';
import { createProductValidator, updateProductValidator } from '../validators/product.validators.js';

import { verifyToken } from '../../auth/utils/jwt.js';
import { getUserById } from '../../../dao/user.dao.js';

async function optionalProtect(req, res, next) {
    let token;
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
        try {
            const decoded = verifyToken(token);
            const user = await getUserById(decoded.id);
            if (user && user.isActive) {
                req.user = user;
            }
        } catch (_) {}
    }
    next();
}

const router = Router();

// Public / Customer Routes
router.get('/', optionalProtect, productController.getProducts);
router.get('/:id', productController.getProduct);
router.get('/:id/availability', productController.getProductAvailability);

// Vendor / Admin Write Routes
router.post('/', protect, restrictTo('ADMIN', 'VENDOR'), createProductValidator, productController.createProduct);
router.patch('/:id', protect, restrictTo('ADMIN', 'VENDOR'), updateProductValidator, productController.updateProduct);
router.delete('/:id', protect, restrictTo('ADMIN', 'VENDOR'), productController.deleteProduct);

// Publishing Routes
router.patch('/:id/publish', protect, restrictTo('ADMIN', 'VENDOR'), productController.publishProduct);
router.patch('/:id/unpublish', protect, restrictTo('ADMIN', 'VENDOR'), productController.unpublishProduct);

export default router;
