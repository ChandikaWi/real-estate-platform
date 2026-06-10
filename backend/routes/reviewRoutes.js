import express from 'express';
import { getSellerReviews, addReview, updateReview, deleteReview } from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/seller/:sellerId', getSellerReviews);
router.post('/', protect, authorize('buyer'), addReview);
router.put('/:id', protect, authorize('buyer'), updateReview);
router.delete('/:id', protect, authorize('buyer', 'admin'), deleteReview);

export default router;