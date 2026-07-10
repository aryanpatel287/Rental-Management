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

export const createProductValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Product name is required'),
    body('categoryId')
        .trim()
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    body('salePrice')
        .isFloat({ min: 0 })
        .withMessage('Sale price must be a positive number'),
    body('costPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cost price must be a positive number'),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a positive integer'),
    body('isRentable')
        .optional()
        .isBoolean()
        .withMessage('isRentable must be a boolean'),
    validateRequest
];

export const updateProductValidator = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Product name cannot be empty'),
    body('categoryId')
        .optional()
        .trim()
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
    body('salePrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Sale price must be a positive number'),
    body('costPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cost price must be a positive number'),
    body('stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a positive integer'),
    body('isRentable')
        .optional()
        .isBoolean()
        .withMessage('isRentable must be a boolean'),
    validateRequest
];
