import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  aiValuationThreshold: { type: Number, default: 15 },
  maintenanceMode: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
