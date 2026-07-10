import * as crudService from '../services/crud.service.js';
import * as definitionService from '../services/definition.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Middleware to load entity definition and columns before executing CRUD actions
 */
export async function loadEntityDefinition(req, res, next) {
    try {
        const slug = req.params.slug;
        const entity = await definitionService.getEntityBySlug(slug);
        if (!entity || !entity.isActive) {
            return sendResponse({
                res,
                statusCode: 404,
                message: `Active entity database definition for "${slug}" does not exist.`,
                success: false
            });
        }
        req.entityDefinition = entity;
        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Dynamic input validation helper
 */
function validateDataFields(data, fields, isUpdate = false) {
    const errors = [];
    const validFieldMap = new Map(fields.map(f => [f.columnName, f]));

    // Check for required fields (only on creation)
    if (!isUpdate) {
        for (const field of fields) {
            if (field.required && (data[field.columnName] === undefined || data[field.columnName] === null || data[field.columnName] === '')) {
                errors.push({ field: field.columnName, message: `Field "${field.name}" is required` });
            }
        }
    }

    // Validate type formatting and inputs
    for (const [key, val] of Object.entries(data)) {
        if (validFieldMap.has(key)) {
            const field = validFieldMap.get(key);
            
            // Skip empty optional fields
            if (val === undefined || val === null || val === '') {
                if (field.required && isUpdate) {
                    errors.push({ field: key, message: `Field "${field.name}" cannot be empty` });
                }
                continue;
            }

            // Type validations
            if (field.fieldType === 'number') {
                const num = Number(val);
                if (isNaN(num)) {
                    errors.push({ field: key, message: `Field "${field.name}" must be a valid number` });
                }
            } else if (field.fieldType === 'boolean') {
                if (typeof val !== 'boolean' && val !== 'true' && val !== 'false') {
                    errors.push({ field: key, message: `Field "${field.name}" must be a boolean (true/false)` });
                }
            } else if (field.fieldType === 'date') {
                const timestamp = Date.parse(val);
                if (isNaN(timestamp)) {
                    errors.push({ field: key, message: `Field "${field.name}" must be a valid ISO date` });
                }
            } else if (field.fieldType === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(String(val).trim())) {
                    errors.push({ field: key, message: `Field "${field.name}" must be a valid email address` });
                }
            }
        }
    }

    return errors;
}

export async function listRecords(req, res, next) {
    try {
        const { page, limit, sortBy, sortOrder, ...queryFilters } = req.query;
        const { slug, fields } = req.entityDefinition;

        // Parse filters from remaining query keys
        const filters = {};
        const fieldNames = new Set(fields.map(f => f.columnName));
        for (const [k, v] of Object.entries(queryFilters)) {
            if (fieldNames.has(k)) {
                filters[k] = v;
            }
        }

        const result = await crudService.findMany(slug, fields, {
            page,
            limit,
            sortBy,
            sortOrder,
            filters
        });

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Records retrieved successfully',
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export async function getRecord(req, res, next) {
    try {
        const { slug } = req.entityDefinition;
        const record = await crudService.findById(slug, req.params.id);
        
        if (!record) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Record not found',
                success: false
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Record retrieved successfully',
            success: true,
            data: { record }
        });
    } catch (error) {
        next(error);
    }
}

export async function createRecord(req, res, next) {
    try {
        const { slug, fields } = req.entityDefinition;
        
        const errors = validateDataFields(req.body, fields, false);
        if (errors.length > 0) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Validation failed',
                success: false,
                errors
            });
        }

        const record = await crudService.createOne(slug, req.body, fields);
        return sendResponse({
            res,
            statusCode: 201,
            message: 'Record created successfully',
            success: true,
            data: { record }
        });
    } catch (error) {
        next(error);
    }
}

export async function updateRecord(req, res, next) {
    try {
        const { slug, fields } = req.entityDefinition;
        
        const errors = validateDataFields(req.body, fields, true);
        if (errors.length > 0) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Validation failed',
                success: false,
                errors
            });
        }

        const record = await crudService.updateOne(slug, req.params.id, req.body, fields);
        if (!record) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Record not found or already deleted',
                success: false
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Record updated successfully',
            success: true,
            data: { record }
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteRecord(req, res, next) {
    try {
        const { slug } = req.entityDefinition;
        const record = await crudService.softDelete(slug, req.params.id);
        
        if (!record) {
            return sendResponse({
                res,
                statusCode: 404,
                message: 'Record not found or already deleted',
                success: false
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Record soft deleted successfully',
            success: true
        });
    } catch (error) {
        next(error);
    }
}
