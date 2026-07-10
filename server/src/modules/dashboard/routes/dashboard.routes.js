import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { protect } from '../../auth/index.js';

const router = express.Router();

// Require authentication for all dashboard actions
router.use(protect);

router.get('/config', dashboardController.getDashboardConfig);

export default router;
