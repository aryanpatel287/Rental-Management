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

export const addItemValidator = [
    body('productId').isUUID().withMessage('productId must be a valid UUID'),
    body('variantId').optional({ nullable: true }).isUUID().withMessage('variantId must be a valid UUID'),
    body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
    body('startDate').isISO8601().withMessage('startDate must be a valid ISO8601 date'),
    body('endDate').isISO8601().withMessage('endDate must be a valid ISO8601 date'),
    body('rentPeriod').optional().isIn(['Hour', 'Day', 'Week']).withMessage('rentPeriod must be Hour, Day, or Week'),
    validateRequest
];

export const updateItemValidator = [
    param('id').isUUID().withMessage('id must be a valid UUID'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
    body('variantId').optional({ nullable: true }).isUUID().withMessage('variantId must be a valid UUID'),
    body('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO8601 date'),
    body('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO8601 date'),
    body('rentPeriod').optional().isIn(['Hour', 'Day', 'Week']).withMessage('rentPeriod must be Hour, Day, or Week'),
    validateRequest
];

export const deleteItemValidator = [
    param('id').isUUID().withMessage('id must be a valid UUID'),
    validateRequest
];
