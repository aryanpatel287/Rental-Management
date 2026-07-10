import * as inventoryService from '../services/inventory.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export async function getInventory(req, res) {
    try {
        const list = await inventoryService.getInventoryList(req.query);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Inventory retrieved successfully',
            success: true,
            data: { inventory: list }
        });
    } catch (error) {
        console.error('Error listing inventory:', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Internal server error while retrieving inventory',
            success: false,
            error: error.message
        });
    }
}

export async function getProductInventory(req, res) {
    try {
        const details = await inventoryService.getProductInventory(req.params.productId);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Product inventory details retrieved successfully',
            success: true,
            data: details
        });
    } catch (error) {
        console.error('Error getting product inventory details:', error);
        const code = error.message === 'PRODUCT_NOT_FOUND' ? 404 : 500;
        return sendResponse({
            res,
            statusCode: code,
            message: error.message || 'Internal server error',
            success: false,
            error: error.message
        });
    }
}

export async function adjustInventory(req, res) {
    try {
        const updated = await inventoryService.adjustInventory(req.params.productId, req.body, req.user);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Inventory adjusted successfully',
            success: true,
            data: { inventory: updated }
        });
    } catch (error) {
        console.error('Error adjusting inventory:', error);
        let statusCode = 500;
        if (['PRODUCT_NOT_FOUND', 'INVENTORY_NOT_FOUND'].includes(error.message)) {
            statusCode = 404;
        } else if (['INVALID_QUANTITY', 'INSUFFICIENT_STOCK', 'INVALID_ACTION'].includes(error.message)) {
            statusCode = 400;
        }
        return sendResponse({
            res,
            statusCode,
            message: error.message || 'Internal server error',
            success: false,
            error: error.message
        });
    }
}
