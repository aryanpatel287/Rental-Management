import { Router } from 'express';
import * as cartController from '../controllers/cart.controller.js';
import { protect } from '../../auth/index.js';
import { addItemValidator, updateItemValidator, deleteItemValidator } from '../validators/cart.validators.js';

const router = Router();

router.use(protect); // All routes require authentication

router.get('/', cartController.getCart);
router.post('/items', addItemValidator, cartController.addItem);
router.patch('/items/:id', updateItemValidator, cartController.updateItem);
router.delete('/items/:id', deleteItemValidator, cartController.removeItem);
router.delete('/clear', cartController.clearCart);

export default router;
