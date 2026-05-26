import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true }
}, { timestamps: true });

// Ensure a user can only favorite a specific property once
favoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

export default mongoose.model('Favorite', favoriteSchema);