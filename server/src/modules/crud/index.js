import express from 'express';
import definitionsRouter from './routes/definitions.routes.js';
import dataRouter from './routes/data.routes.js';

const crudRouter = express.Router();

// Route administration endpoints
crudRouter.use('/definitions', definitionsRouter);

// Route generic records operations
crudRouter.use('/', dataRouter);

export { crudRouter };
