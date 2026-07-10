import { body, validationResult } from 'express-validator';
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

export const createVariantValidator = [
    body('sku')
        .trim()
        .notEmpty()
        .withMessage('SKU is required'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a positive integer'),
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean'),
    validateRequest
];

export const updateVariantValidator = [
    body('sku')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('SKU cannot be empty'),
    body('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a positive integer'),
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean'),
    validateRequest
];
