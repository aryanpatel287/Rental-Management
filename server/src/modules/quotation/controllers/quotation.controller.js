import * as quotationService from '../services/quotation.service.js';
import * as quotationRepo from '../repository/quotation.repository.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export async function createQuotation(req, res) {
    try {
        const { couponCode } = req.body;
        const qtn = await quotationService.createQuotationFromCart(req.user.id, couponCode);
        return sendResponse({
            res,
            statusCode: 201,
            message: 'Quotation created successfully',
            success: true,
            data: { quotation: qtn }
        });
    } catch (error) {
        console.error('Error creating quotation:', error);
        let code = 500;
        if (['EMPTY_CART', 'INSUFFICIENT_STOCK', 'INVALID_COUPON'].includes(error.message)) {
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

export async function getQuotations(req, res) {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const filter = { page: Number(page), limit: Number(limit), status };

        if (req.user.role === 'USER') {
            filter.customerId = req.user.id;
        } else if (req.user.role === 'VENDOR') {
            filter.vendorId = req.user.id;
        }

        const quotationsList = await quotationRepo.findQuotations(filter);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Quotations retrieved successfully',
            success: true,
            data: { quotations: quotationsList }
        });
    } catch (error) {
        console.error('Error retrieving quotations:', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Internal server error while fetching quotations',
            success: false,
            error: error.message
        });
    }
}

export async function getQuotation(req, res) {
    try {
        const qtn = await quotationRepo.findQuotationById(req.params.id);
        if (!qtn) {
            return sendResponse({ res, statusCode: 404, message: 'Quotation not found', success: false });
        }

        // Authorization check
        if (req.user.role === 'USER' && qtn.customerId !== req.user.id) {
            return sendResponse({ res, statusCode: 403, message: 'Unauthorized access', success: false });
        }

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Quotation details retrieved successfully',
            success: true,
            data: { quotation: qtn }
        });
    } catch (error) {
        console.error('Error retrieving quotation detail:', error);
        return sendResponse({
            res,
            statusCode: 500,
            message: 'Internal server error',
            success: false,
            error: error.message
        });
    }
}

export async function updateQuotation(req, res) {
    try {
        const updated = await quotationService.updateQuotation(req.params.id, req.body.items, req.user.id);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Quotation updated successfully',
            success: true,
            data: { quotation: updated }
        });
    } catch (error) {
        console.error('Error updating quotation:', error);
        let code = 500;
        if (['QUOTATION_NOT_FOUND', 'UNAUTHORIZED'].includes(error.message)) {
            code = 403;
        } else if (['QUOTATION_ALREADY_CONFIRMED', 'INVALID_DATE_RANGE', 'INSUFFICIENT_STOCK'].includes(error.message)) {
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

export async function deleteQuotation(req, res) {
    try {
        await quotationService.deleteQuotation(req.params.id, req.user.id);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Quotation deleted successfully',
            success: true
        });
    } catch (error) {
        console.error('Error deleting quotation:', error);
        let code = 500;
        if (['QUOTATION_NOT_FOUND', 'UNAUTHORIZED'].includes(error.message)) {
            code = 403;
        } else if (error.message === 'QUOTATION_ALREADY_CONFIRMED') {
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

export async function sendQuotation(req, res) {
    try {
        const updated = await quotationService.sendQuotation(req.params.id, req.user);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Quotation sent successfully',
            success: true,
            data: { quotation: updated[0] }
        });
    } catch (error) {
        console.error('Error sending quotation:', error);
        let code = error.message === 'QUOTATION_NOT_FOUND' ? 404 : 400;
        return sendResponse({
            res,
            statusCode: code,
            message: error.message || 'Internal server error',
            success: false,
            error: error.message
        });
    }
}

export async function cancelQuotation(req, res) {
    try {
        const updated = await quotationService.cancelQuotation(req.params.id, req.user);
        return sendResponse({
            res,
            statusCode: 200,
            message: 'Quotation cancelled successfully',
            success: true,
            data: { quotation: updated[0] }
        });
    } catch (error) {
        console.error('Error cancelling quotation:', error);
        let code = 500;
        if (error.message === 'QUOTATION_NOT_FOUND') code = 404;
        else if (error.message === 'UNAUTHORIZED') code = 403;
        else code = 400;
        return sendResponse({
            res,
            statusCode: code,
            message: error.message || 'Internal server error',
            success: false,
            error: error.message
        });
    }
}
