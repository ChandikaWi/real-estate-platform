import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  finalSoldPrice: { type: Number },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Completed', 'Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);