import express from 'express';
import { processCheckout, getBuyerOrders, getSellerOrders, updateOrderStatus } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/checkout', protect, authorize('buyer', 'admin'), processCheckout);
router.get('/buyer', protect, authorize('buyer', 'admin'), getBuyerOrders);
router.get('/seller', protect, authorize('seller', 'admin'), getSellerOrders);
router.put('/:id/status', protect, authorize('buyer', 'seller'), updateOrderStatus);

export default router;