import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['Property', 'User', 'Review'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Resolved', 'Dismissed'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
