import express from 'express';
import { handleChatQuery } from '../controllers/chatbotController.js';

const router = express.Router();

// Public route so buyers can chat even before logging in
router.post('/', handleChatQuery);

export default router;