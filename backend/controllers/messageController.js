import Message from '../models/Message.js';

// @desc    Send a message
// @route   POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, propertyId, message } = req.body;
    
    // Prevent sending a message to yourself
    if (receiverId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot send a message to yourself' });
    }

    const newMessage = new Message({
      senderId: req.user._id,
      receiverId,
      propertyId,
      message
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for logged-in user (Receiver)
// @route   GET /api/messages
export const getMessages = async (req, res) => {
  try {
    // Fetch messages where the logged-in user is the receiver
    const messages = await Message.find({ receiverId: req.user._id })
      .populate('senderId', 'name email')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};