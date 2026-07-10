import express from 'express';
import * as definitionsController from '../controllers/definitions.controller.js';
import { protect, restrictTo } from '../../auth/index.js';

const router = express.Router();

// All definition routes require authentication
router.use(protect);

router.route('/')
    .get(definitionsController.listDefinitions)
    .post(restrictTo('ADMIN'), definitionsController.createDefinition);

router.route('/:slug')
    .get(definitionsController.getDefinition)
    .put(restrictTo('ADMIN'), definitionsController.updateDefinition)
    .delete(restrictTo('ADMIN'), definitionsController.deleteDefinition);

export default router;
