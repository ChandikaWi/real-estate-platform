import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  soldPrice: { type: Number },
  previousPrice: { type: Number },
  isBoosted: { type: Boolean, default: false },
  boostExpiresAt: { type: Date, default: null },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true }
  },
  type: { type: String, required: true, enum: ['house', 'apartment', 'land'] },
  
  listingType: { type: String, enum: ['buy', 'rent'], default: 'buy' }, 
  
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  area: { type: Number, required: true },
  images: [{ type: String }],
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Active', 'Pending Review', 'Rejected', 'Reserved', 'Sold'], default: 'Pending Review' },
  views: { type: Number, default: 0 },
  valuationMetrics: {
    yearBuilt: { type: Number },
    distanceToTransport: { type: Number },
    parkingSpaces: { type: Number },
    conditionScore: { type: Number }
  }
}, { timestamps: true });

export default mongoose.model('Property', propertySchema);