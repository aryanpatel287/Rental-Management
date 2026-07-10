import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';
import { protect, restrictTo } from '../../auth/index.js';
import { queryInventoryValidator, adjustInventoryValidator } from '../validators/inventory.validator.js';

const router = Router();

router.get('/', protect, restrictTo('ADMIN', 'VENDOR'), queryInventoryValidator, inventoryController.getInventory);
router.get('/:productId', protect, restrictTo('ADMIN', 'VENDOR'), inventoryController.getProductInventory);
router.patch('/:productId', protect, restrictTo('ADMIN', 'VENDOR'), adjustInventoryValidator, inventoryController.adjustInventory);

export default router;
