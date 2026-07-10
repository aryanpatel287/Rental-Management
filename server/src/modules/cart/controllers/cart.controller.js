import * as cartService from '../services/cart.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

function mapError(error) {
    const message = error.message;
    let statusCode = 500;

    if ([
        'CART_NOT_FOUND', 'ITEM_NOT_FOUND', 'PRODUCT_NOT_FOUND', 
        'VARIANT_NOT_FOUND', 'INVENTORY_NOT_FOUND'
    ].includes(message)) {
        statusCode = 404;
    } else if ([
        'INVALID_DATE_RANGE', 'INVALID_QUANTITY', 
        'PRODUCT_NOT_RENTABLE', 'PRODUCT_UNPUBLISHED', 'VARIANT_UNPUBLISHED'
    ].includes(message)) {
        statusCode = 400;
    } else if (['INSUFFICIENT_STOCK', 'RESERVATION_CONFLICT'].includes(message)) {
        statusCode = 409;
    } else if (message === 'Forbidden') {
        statusCode = 403;
    }

    return { statusCode, code: message };
}

export async function getCart(req, res) {
    try {
        const cart = await cartService.getCart(req.user.id);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Cart retrieved successfully',
            success: true,
            data: cart
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        const { statusCode, code } = mapError(error);
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error',
            success: false,
            error: code
        });
    }
}

export async function addItem(req, res) {
    try {
        const cart = await cartService.addItem(req.user.id, req.body);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Item added to cart successfully',
            success: true,
            data: cart
        });
    } catch (error) {
        console.error('Error adding item to cart:', error);
        const { statusCode, code } = mapError(error);
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error',
            success: false,
            error: code
        });
    }
}

export async function updateItem(req, res) {
    try {
        const cart = await cartService.updateItem(req.user.id, req.params.id, req.body);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Cart item updated successfully',
            success: true,
            data: cart
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        const { statusCode, code } = mapError(error);
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error',
            success: false,
            error: code
        });
    }
}

export async function removeItem(req, res) {
    try {
        const cart = await cartService.removeItem(req.user.id, req.params.id);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Item removed from cart successfully',
            success: true,
            data: cart
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        const { statusCode, code } = mapError(error);
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error',
            success: false,
            error: code
        });
    }
}

export async function clearCart(req, res) {
    try {
        const cart = await cartService.clearCart(req.user.id);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Cart cleared successfully',
            success: true,
            data: cart
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        const { statusCode, code } = mapError(error);
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error',
            success: false,
            error: code
        });
    }
}
