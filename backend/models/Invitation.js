import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member'
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Index for faster lookups
invitationSchema.index({ email: 1, communityId: 1 });
// Note: token index is already created by unique: true in schema definition
invitationSchema.index({ expiresAt: 1 });

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;

