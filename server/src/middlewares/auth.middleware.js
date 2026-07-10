import jwt from 'jsonwebtoken';
import envConfig from '../config/envConfig.js';
import redis from '../config/cache.js';

async function authUser(req, res, next) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                message: 'Unauthorized. No token provided.',
                success: false,
            });
        }

        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
            return res.status(401).json({
                message: 'Unauthorized. blacklisted token.',
                success: false,
                error: 'Token is blacklisted',
            });
        }

        const decoded = jwt.verify(token, envConfig.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
        };

        next();
    } catch (error) {
        console.log('Auth middleware error:', error);
        return res.status(401).json({
            message: 'Unauthorized. Invalid token.',
            error: error.message,
            success: false,
        });
    }
}

export { authUser };
