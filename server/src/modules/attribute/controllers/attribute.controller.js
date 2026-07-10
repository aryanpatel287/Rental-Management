import * as attributeService from '../services/attribute.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export async function getAttributes(req, res) {
    try {
        const attributes = await attributeService.getAttributesService();
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Attributes retrieved successfully',
            success: true,
            data: { attributes }
        });
    } catch (error) {
        console.error('Error fetching attributes:', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Internal server error while fetching attributes',
            success: false,
            error: error.message
        });
    }
}

export async function createAttribute(req, res) {
    try {
        const newAttribute = await attributeService.createAttributeService(req.body);
        return sendResponse({
            res,
            statusCode: 201,
            message: 'Attribute created successfully',
            success: true,
            data: { attribute: newAttribute }
        });
    } catch (error) {
        console.error('Error creating attribute:', error);
        const statusCode = error.message.includes('already in use') ? 400 : 500;
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while creating attribute',
            success: false,
            error: error.message
        });
    }
}

export async function updateAttribute(req, res) {
    try {
        const { id } = req.params;
        const updated = await attributeService.updateAttributeService(id, req.body);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Attribute updated successfully',
            success: true,
            data: { attribute: updated }
        });
    } catch (error) {
        console.error('Error updating attribute:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('already in use')) {
            statusCode = 400;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while updating attribute',
            success: false,
            error: error.message
        });
    }
}

export async function deleteAttribute(req, res) {
    try {
        const { id } = req.params;
        await attributeService.deleteAttributeService(id);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Attribute deleted successfully',
            success: true
        });
    } catch (error) {
        console.error('Error deleting attribute:', error);
        const statusCode = error.message.includes('not found') ? 404 : 500;
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while deleting attribute',
            success: false,
            error: error.message
        });
    }
}
