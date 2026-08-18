import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  type: { 
    type: String, 
    enum: ['price_drop', 'visit_update', 'message', 'system', 'order', 'review', 'alert', 'order_update'], 
    required: true 
  },
  message: { type: String, required: true },
  link: { type: String, required: true }, 
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);