import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { calculateUserSprintPoints } from '../services/sprintService.js';

const router = express.Router();

// Register (only for initial founder setup)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // If trying to register a founder, check if one already exists
    if (role === 'founder') {
      const founderExists = await User.findOne({ role: 'founder' });
      if (founderExists) {
        return res.status(403).json({
          message: 'A founder account already exists. Cannot create another.'
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = new User({
      name,
      email,
      password,
      role: role || 'employee'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If user is employee and has Quest Hive ID, calculate current sprint points
    let userSprintData = null;
    if (user.role === 'employee' && user.questHiveUserId) {
      try {
        userSprintData = await calculateUserSprintPoints(user);
        // Update user with latest sprint data
        user.sprintPoints = userSprintData.sprintPoints;
        user.isEligible = userSprintData.sprintPoints >= 8;
        user.sprintData = {
          completedTasks: userSprintData.completedTasks,
          totalTasks: userSprintData.totalTasks,
          completionRate: userSprintData.completionRate,
          taskBreakdown: userSprintData.taskBreakdown,
          lastUpdated: new Date()
        };
        await user.save();
      } catch (sprintError) {
        console.error('Error calculating sprint points during login:', sprintError);
        // Don't fail login if sprint calculation fails
      }
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const responseData = {
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sprintPoints: user.sprintPoints,
        rewardPoints: user.rewardPoints,
        isEligible: user.isEligible,
        unlockedThisSprint: user.unlockedThisSprint,
        questHiveUserId: user.questHiveUserId,
        sprintData: user.sprintData
      }
    };

    // Include sprint data in response if available
    if (userSprintData) {
      responseData.user.currentSprintData = userSprintData;
    }

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user with updated sprint data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    // If user is employee and has Quest Hive ID, get fresh sprint data
    if (user.role === 'employee' && user.questHiveUserId) {
      try {
        const userSprintData = await calculateUserSprintPoints(user);
        
        // Update user with latest sprint data if it's been more than 5 minutes
        const lastUpdated = user.sprintData?.lastUpdated;
        const shouldUpdate = !lastUpdated || 
          (new Date() - new Date(lastUpdated)) > 5 * 60 * 1000; // 5 minutes
        
        if (shouldUpdate) {
          user.sprintPoints = userSprintData.sprintPoints;
          user.isEligible = userSprintData.sprintPoints >= 8;
          user.sprintData = {
            completedTasks: userSprintData.completedTasks,
            totalTasks: userSprintData.totalTasks,
            completionRate: userSprintData.completionRate,
            taskBreakdown: userSprintData.taskBreakdown,
            lastUpdated: new Date()
          };
          await user.save();
        }
        
        // Include current sprint data in response
        const responseData = user.toObject();
        responseData.currentSprintData = userSprintData;
        
        return res.json(responseData);
      } catch (sprintError) {
        console.error('Error getting sprint data for user:', sprintError);
        // Return user data without sprint calculation if it fails
      }
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;