import express from 'express';
import { getProperties, createProperty, deleteProperty, getPropertyById, updateProperty, getSellerProperties, getSellerAnalytics, getPropertiesBySellerId, getRecommendations, getSimilarProperties, getLifestyleMatches, updatePropertyStatus } from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getAIValuation } from '../controllers/propertyController.js';

const router = express.Router();

router.route('/')
  .get(getProperties)
  .post(protect, authorize('seller', 'admin'), createProperty);

router.route('/seller/me')
  .get(protect, authorize('seller'), getSellerProperties);

router.route('/seller/analytics')
  .get(protect, authorize('seller'), getSellerAnalytics);

router.route('/recommendations')
  .get(protect, authorize('buyer'), getRecommendations);

router.route('/lifestyle-match')
  .post(getLifestyleMatches);

router.route('/user/:sellerId')
  .get(getPropertiesBySellerId);

router.route('/:id/similar')
  .get(getSimilarProperties);

router.route('/:id/status')
  .put(protect, authorize('admin'), updatePropertyStatus);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, authorize('seller', 'admin'), updateProperty)
  .delete(protect, authorize('seller', 'admin'), deleteProperty);

router.post('/predict-price', protect, getAIValuation);

export default router;