import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { protect, restrictTo } from '../../auth/index.js';
import { createProductValidator, updateProductValidator } from '../validators/product.validators.js';
import { createProductImageValidator } from '../validators/product-image.validators.js';
import * as productImageController from '../controllers/product-image.controller.js';
import { createVariantValidator } from '../validators/variant.validators.js';
import * as variantController from '../controllers/variant.controller.js';

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

// Product Images Routes
router.post('/:productId/images', protect, restrictTo('ADMIN', 'VENDOR'), createProductImageValidator, productImageController.uploadProductImage);
router.delete('/:productId/images/:imageId', protect, restrictTo('ADMIN', 'VENDOR'), productImageController.deleteProductImage);

// Product Variants Routes
router.get('/:productId/variants', variantController.getVariants);
router.post('/:productId/variants', protect, restrictTo('ADMIN', 'VENDOR'), createVariantValidator, variantController.createVariant);

export default router;
