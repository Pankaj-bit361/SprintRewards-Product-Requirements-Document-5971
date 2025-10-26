import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema({
  sprintNumber: {
    type: Number,
    required: true
  },
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'planning'],
    default: 'active'
  },
  eligibleUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalTasks: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  lastSynced: {
    type: Date,
    default: Date.now
  },
  // Sprint statistics
  statistics: {
    averageCompletionRate: {
      type: Number,
      default: 0
    },
    participationRate: {
      type: Number,
      default: 0
    },
    eligibilityRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  autoIndex: false // Disable auto-indexing - indexes are managed manually via scripts
});

// Index definitions (not auto-created due to autoIndex: false)
// Indexes are created via backend/scripts/completeSprintFix.js
sprintSchema.index({ communityId: 1, status: 1, startDate: -1 });
sprintSchema.index({ communityId: 1, sprintNumber: 1 }, { unique: true });

export default mongoose.model('Sprint', sprintSchema);