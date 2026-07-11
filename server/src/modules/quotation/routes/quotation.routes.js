import { Router } from 'express';
import { protect, restrictTo } from '../../auth/index.js';
import * as qtnController from '../controllers/quotation.controller.js';
import { confirmQuotation } from '../../rental-order/controllers/rental-order.controller.js';
import { createQuotationValidator, updateQuotationValidator } from '../validators/quotation.validators.js';

const router = Router();

router.use(protect);

router.post('/', createQuotationValidator, qtnController.createQuotation);
router.get('/', qtnController.getQuotations);
router.get('/:id', qtnController.getQuotation);
router.patch('/:id', updateQuotationValidator, qtnController.updateQuotation);
router.delete('/:id', qtnController.deleteQuotation);

router.post('/:id/send', restrictTo('ADMIN', 'VENDOR'), qtnController.sendQuotation);
router.post('/:id/cancel', qtnController.cancelQuotation);
router.post('/:id/confirm', confirmQuotation);

export default router;
