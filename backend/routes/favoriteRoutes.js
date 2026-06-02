import express from 'express';
import { addFavorite, getUserFavorites, removeFavorite } from '../controllers/favoriteController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only buyers should be saving properties
router.use(protect, authorize('buyer', 'admin'));

router.route('/')
  .post(addFavorite);

// Using the user ID param
router.route('/user/:userId')
  .get(getUserFavorites);

router.route('/:id')
  .delete(removeFavorite);

export default router;