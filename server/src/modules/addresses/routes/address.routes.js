import { Router } from 'express';
import * as addressController from '../controllers/address.controller.js';
import { protect } from '../../auth/middleware/auth.middleware.js';
import { createAddressValidator, updateAddressValidator } from '../validators/address.validator.js';

const router = Router();

// Protect all address routes
router.use(protect);

router.get('/', addressController.listAddresses);
router.post('/', createAddressValidator, addressController.createAddressHandler);
router.patch('/:id', updateAddressValidator, addressController.updateAddressHandler);
router.delete('/:id', addressController.deleteAddressHandler);

export default router;
