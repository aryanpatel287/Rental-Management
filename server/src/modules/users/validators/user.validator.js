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

export const updateProfileValidator = [
    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty'),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('A valid email is required')
        .normalizeEmail(),
    body('phone')
        .optional()
        .trim(),
    body('companyName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Company Name cannot be empty'),
    body('gstin')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('GSTIN cannot be empty')
        .isLength({ min: 15, max: 15 })
        .withMessage('GSTIN must be exactly 15 characters long'),
    body('avatar')
        .optional()
        .trim(),
    validateRequest,
];

export const updateUserAdminValidator = [
    body('role')
        .optional()
        .trim()
        .isIn(['ADMIN', 'VENDOR', 'CUSTOMER'])
        .withMessage('Role must be ADMIN, VENDOR, or CUSTOMER'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),
    validateRequest,
];
