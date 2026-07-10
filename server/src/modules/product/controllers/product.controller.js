import * as productService from '../services/product.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export async function getProducts(req, res) {
    try {
        const { search, category, minPrice, maxPrice } = req.query;
        const filters = {};
        if (search) filters.search = search;
        if (category) filters.category = category;
        if (minPrice) filters.minPrice = parseFloat(minPrice);
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice);

        const productsList = await productService.getProductsService(filters, req.user);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Products retrieved successfully',
            success: true,
            data: { products: productsList }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Internal server error while fetching products',
            success: false,
            error: error.message
        });
    }
}

export async function getProduct(req, res) {
    try {
        const { id } = req.params;
        const product = await productService.getProductByIdOrSlugService(id);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product retrieved successfully',
            success: true,
            data: { product }
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        const statusCode = error.message.includes('not found') ? 404 : 500;
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while fetching product',
            success: false,
            error: error.message
        });
    }
}

export async function createProduct(req, res) {
    try {
        const newProduct = await productService.createProductService(req.body, req.user);
        
        return sendResponse({
            res,
            statusCode: 201,
            message: 'Product created successfully',
            success: true,
            data: { product: newProduct }
        });
    } catch (error) {
        console.error('Error creating product:', error);
        const statusCode = error.message.includes('already in use') || error.message.includes('does not exist') ? 400 : 500;
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while creating product',
            success: false,
            error: error.message
        });
    }
}

export async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const updatedProduct = await productService.updateProductService(id, req.body, req.user);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product updated successfully',
            success: true,
            data: { product: updatedProduct }
        });
    } catch (error) {
        console.error('Error updating product:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Forbidden')) {
            statusCode = 403;
        } else if (error.message.includes('already in use') || error.message.includes('does not exist')) {
            statusCode = 400;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while updating product',
            success: false,
            error: error.message
        });
    }
}

export async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        await productService.deleteProductService(id, req.user);
        
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product deleted successfully',
            success: true
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Forbidden')) {
            statusCode = 403;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while deleting product',
            success: false,
            error: error.message
        });
    }
}

export async function publishProduct(req, res) {
    try {
        const { id } = req.params;
        await productService.publishProductService(id, true, req.user);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product published successfully',
            success: true
        });
    } catch (error) {
        console.error('Error publishing product:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Forbidden')) {
            statusCode = 403;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while publishing product',
            success: false,
            error: error.message
        });
    }
}

export async function unpublishProduct(req, res) {
    try {
        const { id } = req.params;
        await productService.publishProductService(id, false, req.user);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product unpublished successfully',
            success: true
        });
    } catch (error) {
        console.error('Error unpublishing product:', error);
        let statusCode = 500;
        if (error.message.includes('not found')) {
            statusCode = 404;
        } else if (error.message.includes('Forbidden')) {
            statusCode = 403;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while unpublishing product',
            success: false,
            error: error.message
        });
    }
}

export async function getProductAvailability(req, res) {
    try {
        const { id } = req.params;
        const availability = await productService.getProductAvailabilityService(id);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product availability retrieved successfully',
            success: true,
            data: availability
        });
    } catch (error) {
        console.error('Error fetching availability:', error);
        const statusCode = error.message.includes('not found') ? 404 : 500;
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error while fetching availability',
            success: false,
            error: error.message
        });
    }
}
