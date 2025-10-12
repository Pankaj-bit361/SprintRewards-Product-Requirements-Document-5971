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
  }
}, {
  timestamps: true
});

export default mongoose.model('Sprint', sprintSchema);