import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
    // Note: email index is created as part of compound index (email, createdAt) below
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-delete after expiration
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
otpSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model('OTP', otpSchema);

