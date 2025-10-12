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

export default mongoose.model('User', userSchema);