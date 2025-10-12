import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1,
    },
    message: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['transfer', 'unlock', 'adjustment'],
      default: 'transfer',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);