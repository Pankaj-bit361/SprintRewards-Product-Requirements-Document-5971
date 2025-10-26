import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['founder', 'employee'],
    default: 'employee'
  },
  sprintPoints: {
    type: Number,
    default: 0,
    min: 0,
    max: 12
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  isEligible: {
    type: Boolean,
    default: false
  },
  unlockedThisSprint: {
    type: Boolean,
    default: false
  },
  totalGiven: {
    type: Number,
    default: 0
  },
  totalReceived: {
    type: Number,
    default: 0
  },
  aiCheckResult: {
    isEligible: Boolean,
    confidenceScore: Number,
    remarks: String,
    lastChecked: Date
  },
  avatar: {
    type: String,
    default: ''
  },
  // Quest Hive integration
  questHiveUserId: {
    type: String,
    default: null,
    sparse: true,
    index: true
  },
  questHiveData: {
    entityId: String,
    companyRole: String,
    team: [String],
    avatar: String,
    lastSynced: {
      type: Date,
      default: Date.now
    }
  },
  // Sprint tracking data
  sprintData: {
    completedTasks: {
      type: Number,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    taskBreakdown: {
      completed: {
        type: Number,
        default: 0
      },
      inProgress: {
        type: Number,
        default: 0
      },
      todo: {
        type: Number,
        default: 0
      },
      blocked: {
        type: Number,
        default: 0
      }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    currentSprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint'
    }
  },
  // Multi-community support
  communities: [{
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    // Community-specific points
    rewardPoints: {
      type: Number,
      default: 0
    },
    claimablePoints: {
      type: Number,
      default: 0
    },
    totalGiven: {
      type: Number,
      default: 0
    },
    totalReceived: {
      type: Number,
      default: 0
    }
  }],
  currentCommunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.updateSprintData = function(sprintData) {
  this.sprintData = {
    ...this.sprintData,
    ...sprintData,
    lastUpdated: new Date()
  };

  // Update sprint points based on task completion
  this.sprintPoints = sprintData.sprintPoints || this.sprintPoints;
  this.isEligible = this.sprintPoints >= 8; // Threshold for eligibility
};

// Static method to get sprint statistics for all users
userSchema.statics.getSprintStatistics = async function() {
  const users = await this.find({ role: 'employee' });

  return {
    totalUsers: users.length,
    eligibleUsers: users.filter(user => user.isEligible).length,
    averageSprintPoints: users.length > 0 ?
      users.reduce((sum, user) => sum + user.sprintPoints, 0) / users.length : 0,
    totalTasks: users.reduce((sum, user) => sum + (user.sprintData?.totalTasks || 0), 0),
    completedTasks: users.reduce((sum, user) => sum + (user.sprintData?.completedTasks || 0), 0)
  };
};

export default mongoose.model('User', userSchema);