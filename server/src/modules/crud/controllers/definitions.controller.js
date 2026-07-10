import * as definitionService from '../services/definition.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export async function listDefinitions(req, res, next) {
    try {
        const entities = await definitionService.listEntities();
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Entity definitions retrieved successfully',
            success: true,
            data: { entities }
        });
    } catch (error) {
        next(error);
    }
}

export async function createDefinition(req, res, next) {
    try {
        const { name, slug, description, fields } = req.body;
        
        if (!name || !slug || !fields || !Array.isArray(fields)) {
            return sendResponse({
                res,
                statusCode: 400,
                message: 'Invalid request payload. Name, slug, and fields array are required.',
                success: false
            });
        }

        const existing = await definitionService.getEntityBySlug(slug);
        if (existing) {
            return sendResponse({
                res,
                statusCode: 400,
                message: `An entity definition with slug "${slug}" already exists.`,
                success: false
            });
        }

        const newEntity = await definitionService.createEntity({
            name,
            slug,
            description,
            fields
        });

        return sendResponse({
            res,
            statusCode: 201,
            message: 'Entity definition created and database table initialized successfully',
            success: true,
            data: { entity: newEntity }
        });
    } catch (error) {
        next(error);
    }
}

export async function getDefinition(req, res, next) {
    try {
        const entity = await definitionService.getEntityBySlug(req.params.slug);
        if (!entity) {
            return sendResponse({
                res,
                statusCode: 404,
                message: `Entity definition for "${req.params.slug}" not found`,
                success: false
            });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Entity definition retrieved successfully',
            success: true,
            data: { entity }
        });
    } catch (error) {
        next(error);
    }
}

export async function updateDefinition(req, res, next) {
    try {
        const entity = await definitionService.updateEntity(req.params.slug, req.body);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Entity definition and database schema updated successfully',
            success: true,
            data: { entity }
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return sendResponse({
                res,
                statusCode: 404,
                message: error.message,
                success: false
            });
        }
        next(error);
    }
}

export async function deleteDefinition(req, res, next) {
    try {
        await definitionService.deleteEntity(req.params.slug);
        return sendResponse({
            res,
            statusCode: 200,
            message: `Entity definition "${req.params.slug}" and its database table dropped successfully`,
            success: true
        });
    } catch (error) {
        if (error.message.includes('not found')) {
            return sendResponse({
                res,
                statusCode: 404,
                message: error.message,
                success: false
            });
        }
        next(error);
    }
}
