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

export const registerValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('A valid email is required')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    validateRequest,
];

export const loginValidator = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('A valid email is required')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validateRequest,
];

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
    validateRequest,
];

export const changePasswordValidator = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long'),
    validateRequest,
];

export const updateRoleValidator = [
    body('role')
        .notEmpty()
        .withMessage('Role is required')
        .isIn(['USER', 'ADMIN'])
        .withMessage('Role must be either USER or ADMIN'),
    validateRequest,
];
