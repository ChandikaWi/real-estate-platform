import express from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  deleteUserProfile,
  forgotPassword,
  resetPassword   
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Authentication Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// PASSWORD RECOVERY ROUTES
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// PROFILE ROUTES
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)
  .delete(protect, deleteUserProfile);

export default router;