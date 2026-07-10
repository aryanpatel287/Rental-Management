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

export const createProductImageValidator = [
    body('url')
        .trim()
        .notEmpty()
        .withMessage('Image URL is required')
        .isURL()
        .withMessage('Image URL must be a valid URL'),
    body('isPrimary')
        .optional()
        .isBoolean()
        .withMessage('isPrimary must be a boolean'),
    validateRequest
];
