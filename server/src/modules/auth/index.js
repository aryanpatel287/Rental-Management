import authRouter from './routes/auth.routes.js';
import { protect, restrictTo } from './middleware/auth.middleware.js';

export { authRouter, protect, restrictTo };
