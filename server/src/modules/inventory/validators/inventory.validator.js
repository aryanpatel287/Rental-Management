import { body, query, param, validationResult } from 'express-validator';
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

export const queryInventoryValidator = [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
    query('vendorId').optional().isUUID().withMessage('vendorId must be a valid UUID'),
    query('categoryId').optional().isUUID().withMessage('categoryId must be a valid UUID'),
    query('status').optional().isIn(['low-stock']).withMessage('status filter must be low-stock'),
    validateRequest
];

export const adjustInventoryValidator = [
    param('productId').isUUID().withMessage('productId parameter must be a valid UUID'),
    body('action').isIn(['increase', 'decrease', 'maintenance', 'restore', 'damaged']).withMessage('Invalid inventory action'),
    body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
    body('variantId').optional().isUUID().withMessage('variantId must be a valid UUID'),
    body('reason').trim().notEmpty().withMessage('reason for stock adjustment is required'),
    body('from').optional().isIn(['maintenance', 'damaged']).withMessage('from parameter must be either maintenance or damaged'),
    validateRequest
];
