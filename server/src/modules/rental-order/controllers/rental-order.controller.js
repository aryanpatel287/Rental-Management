import * as orderService from '../services/rental-order.service.js';
import * as orderRepo from '../repository/rental-order.repository.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export async function confirmQuotation(req, res) {
    try {
        const order = await orderService.confirmQuotation(req.params.id, req.user);
        return sendResponse({
            res,
            statusCode: 201,
            message: 'Quotation confirmed and order created successfully',
            success: true,
            data: { order }
        });
    } catch (error) {
        console.error('Error confirming quotation:', error);
        let code = 500;
        if (['QUOTATION_NOT_FOUND'].includes(error.message)) {
            code = 404;
        } else if (['QUOTATION_ALREADY_CONFIRMED', 'INSUFFICIENT_STOCK'].includes(error.message)) {
            code = 400;
        }
        return sendResponse({
            res,
            statusCode: code,
            message: error.message || 'Internal server error',
            success: false,
            error: error.message
        });
    }
}

export async function getOrders(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const filter = { page: Number(page), limit: Number(limit) };

        if (req.user.role === 'USER') {
            filter.customerId = req.user.id;
        } else if (req.user.role === 'VENDOR') {
            filter.vendorId = req.user.id;
        }

        const orders = await orderRepo.findOrders(filter);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Orders retrieved successfully',
            success: true,
            data: { orders }
        });
    } catch (error) {
        console.error('Error retrieving orders:', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Internal server error',
            success: false,
            error: error.message
        });
    }
}

export async function getOrder(req, res) {
    try {
        const order = await orderRepo.findById(req.params.id);
        if (!order) {
            return sendResponse({ res, statusCode: 404, message: 'Order not found', success: false });
        }

        if (req.user.role === 'USER' && order.customerId !== req.user.id) {
            return sendResponse({ res, statusCode: 403, message: 'Unauthorized access', success: false });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Order details retrieved successfully',
            success: true,
            data: { order }
        });
    } catch (error) {
        console.error('Error retrieving order details:', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Internal server error',
            success: false,
            error: error.message
        });
    }
}

export async function updateOrder(req, res) {
    try {
        const updated = await orderRepo.update(req.params.id, req.body);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Order updated successfully',
            success: true,
            data: { order: updated }
        });
    } catch (error) {
        console.error('Error updating order:', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Internal server error',
            success: false,
            error: error.message
        });
    }
}

export async function changeStatus(req, res) {
    try {
        const updated = await orderService.updateOrderStatus(req.params.id, req.body.status, req.user);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Order status updated successfully',
            success: true,
            data: { order: updated }
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        let code = error.message === 'ORDER_NOT_FOUND' ? 404 : 400;
        return sendResponse({
            res,
            statusCode: code,
            message: error.message || 'Internal server error',
            success: false,
            error: error.message
        });
    }
}

export async function cancelOrder(req, res) {
    try {
        const updated = await orderService.cancelOrder(req.params.id, req.user);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Order cancelled successfully',
            success: true,
            data: { order: updated }
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        let code = error.message === 'ORDER_NOT_FOUND' ? 404 : 400;
        return sendResponse({
            res,
            statusCode: code,
            message: error.message || 'Internal server error',
            success: false,
            error: error.message
        });
    }
}
