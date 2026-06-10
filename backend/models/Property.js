import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true }, 
  description: { type: String, required: true }, 
  price: { type: Number, required: true },
  previousPrice: { type: Number, default: null },
  views: { type: Number, default: 0 }, 
  location: { 
    city: { type: String, required: true },
    address: { type: String, required: true }
  },
  type: { type: String, enum: ['house', 'apartment', 'land'], required: true }, 
  bedrooms: { type: Number, required: true }, 
  bathrooms: { type: Number, required: true }, 
  area: { type: Number, required: true }, 
  images: [{ type: String }], 
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  
  // Data payload for XGBoost/Random Forest model
  valuationMetrics: {
    yearBuilt: { type: Number },
    distanceToTransport: { type: Number },
    parkingSpaces: { type: Number },
    conditionScore: { type: Number },
  }
}, { timestamps: true });

// Indexing for search performance
propertySchema.index({ 'location.city': 1, price: 1 });

export default mongoose.model('Property', propertySchema);