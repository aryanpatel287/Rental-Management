import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import envConfig from './config/envConfig.js';
import { authRouter } from './modules/auth/index.js';
import { errorHandler } from './modules/auth/middleware/errorHandler.js';
import { crudRouter } from './modules/crud/index.js';
import { dashboardRouter } from './modules/dashboard/index.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: envConfig.CLIENT_ORIGINS,
        credentials: true,
    }),
);
app.use(morgan('combined')); //  Logging middleware for better debugging

app.use('/api/auth', authRouter);
app.use('/api/crud', crudRouter);
app.use('/api/dashboard', dashboardRouter);

// Centralized Global Error Handler (must be last)
app.use(errorHandler);

export default app;
