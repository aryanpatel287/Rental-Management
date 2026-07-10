import express from 'express';
import * as dataController from '../controllers/data.controller.js';
import { protect } from '../../auth/index.js';

// Merge parameters to preserve :slug inside nested routers if any
const router = express.Router({ mergeParams: true });

// All dynamic CRUD routes require authentication
router.use(protect);

router.route('/:slug')
    .get(dataController.loadEntityDefinition, dataController.listRecords)
    .post(dataController.loadEntityDefinition, dataController.createRecord);

router.route('/:slug/:id')
    .get(dataController.loadEntityDefinition, dataController.getRecord)
    .put(dataController.loadEntityDefinition, dataController.updateRecord)
    .delete(dataController.loadEntityDefinition, dataController.deleteRecord);

export default router;
