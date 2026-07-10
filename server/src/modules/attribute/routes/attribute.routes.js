import { Router } from 'express';
import * as attributeController from '../controllers/attribute.controller.js';
import { protect, restrictTo } from '../../auth/index.js';
import { attributeValidator } from '../validators/attribute.validators.js';

const router = Router();

// Public
router.get('/', attributeController.getAttributes);

// Admin Only
router.post('/', protect, restrictTo('ADMIN'), attributeValidator, attributeController.createAttribute);
router.patch('/:id', protect, restrictTo('ADMIN'), attributeValidator, attributeController.updateAttribute);
router.delete('/:id', protect, restrictTo('ADMIN'), attributeController.deleteAttribute);

export default router;
