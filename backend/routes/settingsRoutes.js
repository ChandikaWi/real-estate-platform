import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getSettings) // Publicly readable so frontend knows to show maintenance page
  .put(protect, authorize('admin'), updateSettings);

export default router;
