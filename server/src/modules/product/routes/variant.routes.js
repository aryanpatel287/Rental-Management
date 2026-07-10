import { Router } from 'express';
import * as variantController from '../controllers/variant.controller.js';
import { protect, restrictTo } from '../../auth/index.js';
import { updateVariantValidator } from '../validators/variant.validators.js';

const router = Router();

router.patch('/:variantId', protect, restrictTo('ADMIN', 'VENDOR'), updateVariantValidator, variantController.updateVariant);
router.delete('/:variantId', protect, restrictTo('ADMIN', 'VENDOR'), variantController.deleteVariant);

export default router;
