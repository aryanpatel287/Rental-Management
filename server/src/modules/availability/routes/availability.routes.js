import { Router } from 'express';
import { checkAvailability } from '../services/availability.service.js';
import { checkAvailabilityValidator } from '../validators/availability.validator.js';
import { sendResponse } from '../../../utils/response.utlis.js';
import { protect, restrictTo } from '../../auth/index.js';
import { reservations } from '../../../db/schema/schema.js';
import { db } from '../../../config/database.js';
import { eq } from 'drizzle-orm';

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

router.get('/', protect, restrictTo('ADMIN'), async (req, res) => {
    try {
        const list = await db.select().from(reservations);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Reservations retrieved successfully',
            success: true,
            data: { reservations: list }
        });
    } catch (err) {
        return sendResponse({
            res,
            statusCode: 500,
            message: err.message || 'Internal server error',
            success: false
        });
    }
});

router.get('/:id', protect, restrictTo('ADMIN'), async (req, res) => {
    try {
        const rows = await db.select().from(reservations).where(eq(reservations.id, req.params.id));
        if (rows.length === 0) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Reservation not found',
                success: false
            });
        }
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Reservation retrieved successfully',
            success: true,
            data: { reservation: rows[0] }
        });
    } catch (err) {
        return sendResponse({
            res,
            statusCode: 500,
            message: err.message || 'Internal server error',
            success: false
        });
    }
});

export default router;
