import express from 'express';
import { sendMessage, getMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Both routes require the user to be logged in
router.route('/')
  .post(protect, sendMessage)
  .get(protect, getMessages);

export default router;