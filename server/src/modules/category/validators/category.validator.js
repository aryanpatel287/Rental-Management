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

export const createCategoryValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ max: 100 })
        .withMessage('Category name cannot exceed 100 characters'),
    body('slug')
        .optional()
        .trim()
        .matches(/^[a-zA-Z0-9-_]+$/)
        .withMessage('Slug can only contain alphanumeric characters, hyphens, and underscores'),
    body('description')
        .optional()
        .trim(),
    body('parentCategoryId')
        .optional({ nullable: true, checkFalsy: true })
        .isUUID()
        .withMessage('Parent category ID must be a valid UUID'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value'),
    validateRequest,
];

export const updateCategoryValidator = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Category name cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Category name cannot exceed 100 characters'),
    body('slug')
        .optional()
        .trim()
        .matches(/^[a-zA-Z0-9-_]+$/)
        .withMessage('Slug can only contain alphanumeric characters, hyphens, and underscores'),
    body('description')
        .optional()
        .trim(),
    body('parentCategoryId')
        .optional({ nullable: true, checkFalsy: true })
        .custom(value => {
            if (value === null || value === '') return true;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(value)) {
                throw new Error('Parent category ID must be a valid UUID or null');
            }
            return true;
        }),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value'),
    validateRequest,
];
