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

export const createQuotationValidator = [
    body('couponCode').optional({ checkFalsy: true }).isString().withMessage('couponCode must be a string'),
    validateRequest
];

export const updateQuotationValidator = [
    body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
    body('items.*.productId').isUUID().withMessage('productId must be a valid UUID'),
    body('items.*.variantId').optional({ nullable: true }).isUUID().withMessage('variantId must be a valid UUID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
    body('items.*.rentalStart').isISO8601().withMessage('rentalStart must be a valid date'),
    body('items.*.rentalEnd').isISO8601().withMessage('rentalEnd must be a valid date'),
    body('items.*.rentPeriod').optional().isIn(['Hour', 'Day', 'Week']).withMessage('rentPeriod must be Hour, Day, or Week'),
    validateRequest
];
