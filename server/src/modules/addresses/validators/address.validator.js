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

export const createAddressValidator = [
    body('type')
        .trim()
        .notEmpty()
        .withMessage('Type is required')
        .isIn(['billing', 'shipping'])
        .withMessage('Type must be either billing or shipping'),
    body('address1')
        .trim()
        .notEmpty()
        .withMessage('Address 1 is required'),
    body('address2')
        .optional()
        .trim(),
    body('city')
        .trim()
        .notEmpty()
        .withMessage('City is required'),
    body('state')
        .trim()
        .notEmpty()
        .withMessage('State is required'),
    body('country')
        .trim()
        .notEmpty()
        .withMessage('Country is required'),
    body('zipCode')
        .trim()
        .notEmpty()
        .withMessage('Zip Code is required'),
    body('isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault must be a boolean'),
    validateRequest,
];

export const updateAddressValidator = [
    body('type')
        .optional()
        .trim()
        .isIn(['billing', 'shipping'])
        .withMessage('Type must be either billing or shipping'),
    body('address1')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Address 1 cannot be empty'),
    body('address2')
        .optional()
        .trim(),
    body('city')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('City cannot be empty'),
    body('state')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('State cannot be empty'),
    body('country')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Country cannot be empty'),
    body('zipCode')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Zip Code cannot be empty'),
    body('isDefault')
        .optional()
        .isBoolean()
        .withMessage('isDefault must be a boolean'),
    validateRequest,
];
