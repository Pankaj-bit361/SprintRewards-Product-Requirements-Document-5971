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
    default: 12
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
    sparse: true, // Allows multiple null values
    index: true // Add index for faster lookups
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

// Method to sync with Quest Hive data
userSchema.methods.syncWithQuestHive = function(questHiveUser) {
  this.questHiveData = {
    entityId: questHiveUser.entityId,
    companyRole: questHiveUser.companyRole || questHiveUser.role,
    team: questHiveUser.team || [],
    avatar: questHiveUser.avatar || '',
    lastSynced: new Date()
  };
  
  // Update avatar if Quest Hive has one and we don't
  if (questHiveUser.avatar && !this.avatar) {
    this.avatar = questHiveUser.avatar;
  }
};

// Static method to find user by Quest Hive ID
userSchema.statics.findByQuestHiveId = function(questHiveUserId) {
  return this.findOne({ questHiveUserId });
};

// Static method to get users with Quest Hive mapping
userSchema.statics.findMappedUsers = function() {
  return this.find({ questHiveUserId: { $ne: null } });
};

export default mongoose.model('User', userSchema);