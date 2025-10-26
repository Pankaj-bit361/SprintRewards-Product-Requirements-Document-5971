import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: '' // URL or base64 data URL for the community image/logo
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  settings: {
    pointsPerSprint: {
      type: Number,
      default: 12,
      description: 'Maximum sprint points a user can earn (for eligibility)'
    },
    rewardPointsPerSprint: {
      type: Number,
      default: 500,
      description: 'Reward points allocated to each member at sprint start'
    },
    eligibilityThreshold: {
      type: Number,
      default: 8,
      description: 'Sprint points needed to be eligible for rewards'
    },
    weekendUnlockEnabled: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalMembers: {
      type: Number,
      default: 0
    },
    totalTransactions: {
      type: Number,
      default: 0
    },
    totalPointsDistributed: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
communitySchema.index({ owner: 1 });
communitySchema.index({ 'members.userId': 1 });
communitySchema.index({ isDefault: 1 });

export default mongoose.model('Community', communitySchema);

