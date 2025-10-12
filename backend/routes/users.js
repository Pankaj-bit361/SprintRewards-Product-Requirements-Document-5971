import express from 'express';
import User from '../models/User.js';
import { auth, isFounder } from '../middleware/auth.js';

const router = express.Router();

// Get all employees (founder only)
router.get('/', auth, isFounder, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add employee (founder only)
router.post('/', auth, isFounder, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Employee already exists' });
    }

    // Create employee
    const user = new User({
      name,
      email,
      password,
      role: 'employee',
      sprintPoints: 12,
      rewardPoints: 0
    });

    await user.save();

    res.status(201).json({
      message: 'Employee added successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sprintPoints: user.sprintPoints,
        rewardPoints: user.rewardPoints
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update employee (founder only)
router.put('/:id', auth, isFounder, async (req, res) => {
  try {
    const { name, email, sprintPoints, rewardPoints } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, sprintPoints, rewardPoints },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete employee (founder only)
router.delete('/:id', auth, isFounder, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const topGivers = await User.find({ role: 'employee' })
      .select('name totalGiven avatar')
      .sort({ totalGiven: -1 })
      .limit(10);

    const topReceivers = await User.find({ role: 'employee' })
      .select('name totalReceived avatar')
      .sort({ totalReceived: -1 })
      .limit(10);

    res.json({ topGivers, topReceivers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unlock reward points (weekend only)
router.post('/unlock-points', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if it's weekend (Saturday or Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday

    if (!isWeekend) {
      return res.status(400).json({ message: 'Points can only be unlocked on weekends' });
    }

    if (!user.isEligible) {
      return res.status(400).json({ message: 'You are not eligible to unlock points this sprint' });
    }

    if (user.unlockedThisSprint) {
      return res.status(400).json({ message: 'You have already unlocked points this sprint' });
    }

    // Unlock 500 points
    user.rewardPoints += 500;
    user.unlockedThisSprint = true;
    await user.save();

    res.json({ 
      message: 'Successfully unlocked 500 reward points!',
      rewardPoints: user.rewardPoints
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;