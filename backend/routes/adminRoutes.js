import express from 'express';
import { getUsers, deleteUser, getAdminProperties, deleteAdminProperty } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getUsers, deleteUser, getAdminProperties, deleteAdminProperty, updateUserStatus } from '../controllers/adminController.js';

const router = express.Router();

// Enforce both 'protect' (must be logged in) and 'authorize' (must be admin role)
router.use(protect, authorize('admin'));

router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .delete(deleteUser);

router.route('/properties')
  .get(getAdminProperties);

router.route('/properties/:id')
  .delete(deleteAdminProperty);

router.route('/users/:id/status')
  .put(updateUserStatus);
  
export default router;