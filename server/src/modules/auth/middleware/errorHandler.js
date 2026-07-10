import envConfig from '../../../config/envConfig.js';
import { sendResponse } from '../../../utils/response.utlis.js';

export function errorHandler(err, req, res, next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    const message = err.message || 'Something went wrong';
    const errorDetails = envConfig.IS_PRODUCTION ? null : err.stack || err.toString();

    console.error('API Error:', err);

    return sendResponse({
        res,
        statusCode: err.statusCode,
        message,
        success: false,
        error: errorDetails,
    });
}
