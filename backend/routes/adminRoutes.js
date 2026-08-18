import express from 'express';
import { getUsers, deleteUser, getAdminProperties, deleteAdminProperty, updateUserStatus, getAdminAnalytics } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getPayments } from '../controllers/adminController.js';

const router = express.Router();
router.use(protect, authorize('admin'));
router.route('/analytics').get(getAdminAnalytics);
router.route('/users').get(getUsers);
router.route('/users/:id').delete(deleteUser);
router.route('/users/:id/status').put(updateUserStatus);
router.route('/properties').get(getAdminProperties);
router.route('/properties/:id').delete(deleteAdminProperty);
router.get('/payments', protect, authorize('admin'), getPayments);

export default router;