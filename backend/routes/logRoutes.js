import express from 'express';
import { getLogs } from '../controllers/logController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getLogs);

export default router;
