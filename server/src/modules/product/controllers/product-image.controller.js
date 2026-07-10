import * as productImageService from '../services/product-image.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export async function uploadProductImage(req, res) {
    try {
        const { productId } = req.params;
        const newImage = await productImageService.createProductImageService(productId, req.body, req.user);
        
        return sendResponse({
            res,
            statusCode: 201,
            message: 'Product image uploaded successfully',
            success: true,
            data: { image: newImage }
        });
    } catch (error) {
        console.error('Error uploading product image:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Forbidden')) {
            statusCode = 403;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while uploading product image',
            success: false,
            error: error.message
        });
    }
}

export async function deleteProductImage(req, res) {
    try {
        const { productId, imageId } = req.params;
        await productImageService.deleteProductImageService(productId, imageId, req.user);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product image deleted successfully',
            success: true
        });
    } catch (error) {
        console.error('Error deleting product image:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Forbidden')) {
            statusCode = 403;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while deleting product image',
            success: false,
            error: error.message
        });
    }
}
