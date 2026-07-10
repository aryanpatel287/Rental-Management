import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { protect, restrictTo } from '../../auth/index.js';
import { createCategoryValidator, updateCategoryValidator } from '../validators/category.validator.js';

const router = Router();

// GET is public
router.get('/', categoryController.getCategories);

// POST, PATCH, DELETE require Admin role
router.post('/', protect, restrictTo('ADMIN'), createCategoryValidator, categoryController.createCategory);
router.patch('/:id', protect, restrictTo('ADMIN'), updateCategoryValidator, categoryController.updateCategory);
router.delete('/:id', protect, restrictTo('ADMIN'), categoryController.deleteCategory);

export default router;
