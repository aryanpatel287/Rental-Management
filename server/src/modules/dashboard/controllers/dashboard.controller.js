import * as dashboardService from '../services/dashboard.service.js';
import { sendResponse } from '../../../utils/response.utlis.js';

/**
 * Handle fetching dashboard layout configuration matching user role
 */
export async function getDashboardConfig(req, res, next) {
    try {
        const role = req.user.role;
        const layout = await dashboardService.getDashboardConfigForRole(role);

        return sendResponse({
            res,
            statusCode: 200,
            message: 'Dashboard layout configuration retrieved successfully',
            success: true,
            data: { layout }
        });
    } catch (error) {
        next(error);
    }
}
