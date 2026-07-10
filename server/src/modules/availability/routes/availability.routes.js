import { Router } from 'express';
import { checkAvailability } from '../services/availability.service.js';
import { checkAvailabilityValidator } from '../validators/availability.validator.js';
import { sendResponse } from '../../../utils/response.utlis.js';

const router = Router();

router.post('/check', checkAvailabilityValidator, async (req, res) => {
    try {
        const result = await checkAvailability(req.body);
        const statusCode = result.available ? 200 : 409;
        return sendResponse({
            res,
            statusCode,
            message: result.available ? 'Stock is available' : 'Stock is unavailable',
            success: result.available,
            data: result
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        let statusCode = 500;
        if (['PRODUCT_NOT_FOUND', 'VARIANT_NOT_FOUND', 'INVENTORY_NOT_FOUND'].includes(error.message)) {
            statusCode = 404;
        } else if (['INVALID_DATE_RANGE', 'INVALID_QUANTITY'].includes(error.message)) {
            statusCode = 400;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error',
            success: false,
            error: error.message
        });
    }
});

export default router;
