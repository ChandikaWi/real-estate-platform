import Message from '../models/Message.js';

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, propertyId, message } = req.body;
    
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

    // Populate data so the frontend renders names/titles immediately
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'name email')
      .populate('propertyId', 'title');

    // REAL-TIME EMIT - Send the message to the receiver's private room
    const io = req.app.get('io');
    io.to(receiverId.toString()).emit('receive_message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ receiverId: req.user._id })
      .populate('senderId', 'name email')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get chat history between buyer and seller for a specific property
export const getPropertyMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      propertyId: req.params.propertyId,
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }]
    })
    .populate('senderId', 'name')
    .sort({ createdAt: 1 }); // Oldest first for chat window flow
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};