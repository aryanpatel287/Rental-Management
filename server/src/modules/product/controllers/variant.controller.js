import * as variantService from '../services/variant.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export async function getVariants(req, res) {
    try {
        const { productId } = req.params;
        const variants = await variantService.getVariantsService(productId);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product variants retrieved successfully',
            success: true,
            data: { variants }
        });
    } catch (error) {
        console.error('Error fetching product variants:', error);
        const statusCode = error.message.includes('not found') ? 404 : 500;
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while fetching variants',
            success: false,
            error: error.message
        });
    }
}

export async function createVariant(req, res) {
    try {
        const { productId } = req.params;
        const newVariant = await variantService.createVariantService(productId, req.body, req.user);
        
        return sendResponse({
            res,
            statusCode: 201,
            message: 'Product variant created successfully',
            success: true,
            data: { variant: newVariant }
        });
    } catch (error) {
        console.error('Error creating variant:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Forbidden')) {
            statusCode = 403;
        } else if (error.message.includes('already in use')) {
            statusCode = 400;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while creating variant',
            success: false,
            error: error.message
        });
    }
}

export async function updateVariant(req, res) {
    try {
        const { variantId } = req.params;
        const updatedVariant = await variantService.updateVariantService(variantId, req.body, req.user);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product variant updated successfully',
            success: true,
            data: { variant: updatedVariant }
        });
    } catch (error) {
        console.error('Error updating variant:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Forbidden')) {
            statusCode = 403;
        } else if (error.message.includes('already in use')) {
            statusCode = 400;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while updating variant',
            success: false,
            error: error.message
        });
    }
}

export async function deleteVariant(req, res) {
    try {
        const { variantId } = req.params;
        await variantService.deleteVariantService(variantId, req.user);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product variant deleted successfully',
            success: true
        });
    } catch (error) {
        console.error('Error deleting variant:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Forbidden')) {
            statusCode = 403;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while deleting variant',
            success: false,
            error: error.message
        });
    }
}
