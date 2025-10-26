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
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for faster queries
transactionSchema.index({ communityId: 1, createdAt: -1 });
transactionSchema.index({ fromUserId: 1, communityId: 1 });
transactionSchema.index({ toUserId: 1, communityId: 1 });

export default mongoose.model('Transaction', transactionSchema);