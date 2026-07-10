import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import envConfig from './config/envConfig.js';
import { authRouter } from './modules/auth/index.js';
import { userRouter } from './modules/users/index.js';
import { addressRouter } from './modules/addresses/index.js';
import { crudRouter } from './modules/crud/index.js';
import { dashboardRouter } from './modules/dashboard/index.js';
import { categoryRouter } from './modules/category/index.js';
import { productRouter } from './modules/product/index.js';
import variantRouter from './modules/product/routes/variant.routes.js';
import { attributeRouter } from './modules/attribute/index.js';
import { inventoryRouter } from './modules/inventory/index.js';
import { availabilityRouter } from './modules/availability/index.js';

const app = express();

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: envConfig.CLIENT_ORIGINS,
        credentials: true,
    }),
);
app.use(morgan('combined'));

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/crud', crudRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/variants', variantRouter);
app.use('/api/attributes', attributeRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/reservations', availabilityRouter);


export default app;
