import express from 'express';
import { getProperties, createProperty, deleteProperty } from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProperties)
  .post(protect, authorize('seller', 'admin'), createProperty);

router.route('/:id')
  .delete(protect, authorize('seller', 'admin'), deleteProperty);

export default router;