import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema({
  sprintNumber: {
    type: Number,
    required: true,
    unique: true
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
  // Quest Hive integration fields
  questHiveSprintId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  questHiveData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
  timestamps: true
});

// Index for faster queries
sprintSchema.index({ questHiveSprintId: 1 });
sprintSchema.index({ status: 1, startDate: -1 });

export default mongoose.model('Sprint', sprintSchema);