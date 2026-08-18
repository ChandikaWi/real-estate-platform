import express from 'express';
import { sendMessage, getMessages, getPropertyMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.route('/')
  .post(protect, sendMessage)
  .get(protect, getMessages);
router.route('/:propertyId')
  .get(protect, getPropertyMessages);

export default router;