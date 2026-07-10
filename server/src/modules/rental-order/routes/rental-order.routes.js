import { Router } from 'express';
import { protect, restrictTo } from '../../auth/index.js';
import * as orderController from '../controllers/rental-order.controller.js';
import { updateOrderValidator, changeStatusValidator } from '../validators/rental-order.validators.js';

const router = Router();

router.use(protect);

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrder);
router.patch('/:id', updateOrderValidator, orderController.updateOrder);
router.patch('/:id/status', changeStatusValidator, orderController.changeStatus);
router.post('/:id/cancel', orderController.cancelOrder);

export default router;
