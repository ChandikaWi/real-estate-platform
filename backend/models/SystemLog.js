import mongoose from 'mongoose';

const systemLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['auth', 'moderation', 'transaction', 'system'],
    },
    action: {
      type: String,
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Null if system action
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // Target can be a user, property, order, etc.
    },
    details: {
      type: Object, // Flexible JSON object for any extra context
      default: {},
    },
  },
  { timestamps: true }
);

const SystemLog = mongoose.model('SystemLog', systemLogSchema);
export default SystemLog;
