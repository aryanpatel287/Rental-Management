import { body, param, validationResult } from 'express-validator';
import { sendResponse } from '../../../utils/response.utlis.js';

function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendResponse({
            res,
            statusCode: 400,
            message: 'Validation failed',
            success: false,
            errors: errors.array(),
        });
    }
    next();
}

export const updateOrderValidator = [
    body('notes').optional().isString().withMessage('notes must be a string'),
    validateRequest
];

export const changeStatusValidator = [
    body('status').isIn(['Confirmed', 'PickedUp', 'Active', 'Returned', 'Completed', 'Cancelled']).withMessage('Invalid status value'),
    validateRequest
];
