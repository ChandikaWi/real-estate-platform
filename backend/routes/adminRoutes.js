import express from 'express';
import { getUsers, deleteUser, createAdminUser, getAdminProperties, deleteAdminProperty, updateUserStatus, getAdminAnalytics, getPayments, getAllOrders, forceCancelOrder, getAllReviews, deleteReview } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, authorize('admin'));
router.route('/analytics').get(getAdminAnalytics);
router.route('/users').get(getUsers).post(createAdminUser);
router.route('/users/:id').delete(deleteUser);
router.route('/users/:id/status').put(updateUserStatus);
router.route('/properties').get(getAdminProperties);
router.route('/properties/:id').delete(deleteAdminProperty);
router.get('/payments', protect, authorize('admin'), getPayments);
router.get('/orders', getAllOrders);
router.put('/orders/:id/force-cancel', forceCancelOrder);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

export default router;