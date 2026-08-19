import express from 'express';
import { createReport, getReports, updateReportStatus } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createReport)
  .get(protect, authorize('admin'), getReports);

router.route('/:id/status')
  .put(protect, authorize('admin'), updateReportStatus);

export default router;
