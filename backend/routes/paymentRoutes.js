import express from 'express';
import { createMockCheckoutSession, getSessionDetails, confirmMockPayment } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-session', protect, authorize('seller'), createMockCheckoutSession);
router.get('/session/:id', protect, authorize('seller'), getSessionDetails);
router.post('/confirm', protect, authorize('seller'), confirmMockPayment);

export default router;