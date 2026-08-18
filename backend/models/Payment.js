import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  amount: { type: Number, required: true },
  planType: { type: String, required: true }, // e.g., '7_days', '14_days'
  status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);