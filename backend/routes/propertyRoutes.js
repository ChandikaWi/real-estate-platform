import express from 'express';
import { getProperties, createProperty, deleteProperty, getPropertyById, updateProperty, getSellerProperties, getSellerAnalytics, getPropertiesBySellerId } from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProperties)
  .post(protect, authorize('seller', 'admin'), createProperty);

router.route('/seller/me')
  .get(protect, authorize('seller'), getSellerProperties);

router.route('/seller/analytics')
  .get(protect, authorize('seller'), getSellerAnalytics);

// Route for public seller profiles
router.route('/user/:sellerId')
  .get(getPropertiesBySellerId);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, authorize('seller', 'admin'), updateProperty)
  .delete(protect, authorize('seller', 'admin'), deleteProperty);

export default router;