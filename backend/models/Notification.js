import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who receives it
  type: { type: String, enum: ['price_drop', 'visit_update', 'message', 'system'], required: true },
  message: { type: String, required: true },
  link: { type: String, required: true }, // Where clicking the notification takes them
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);