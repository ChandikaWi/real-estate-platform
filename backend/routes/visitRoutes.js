import express from 'express';
import { createVisit, getBuyerVisits, getSellerVisits, updateVisitStatus, deleteVisit } from '../controllers/visitController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/', protect, authorize('buyer'), createVisit);
router.get('/buyer', protect, authorize('buyer'), getBuyerVisits);
router.get('/seller', protect, authorize('seller'), getSellerVisits);
router.put('/:id/status', protect, authorize('seller'), updateVisitStatus);
router.delete('/:id', protect, authorize('buyer'), deleteVisit);

export default router;