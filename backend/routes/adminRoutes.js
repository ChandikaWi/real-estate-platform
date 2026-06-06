import express from 'express';
import { 
  getUsers, 
  deleteUser, 
  getAdminProperties, 
  deleteAdminProperty, 
  updateUserStatus 
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Enforce both 'protect' (must be logged in) and 'authorize' (must be admin role)
router.use(protect, authorize('admin'));

router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .delete(deleteUser);

// Status Route (Ban/Verify)
router.route('/users/:id/status')
  .put(updateUserStatus);

router.route('/properties')
  .get(getAdminProperties);

router.route('/properties/:id')
  .delete(deleteAdminProperty);

export default router;