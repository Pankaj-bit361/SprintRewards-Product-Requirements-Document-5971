import express from 'express';
import Sprint from '../models/Sprint.js';
import { auth, isFounder } from '../middleware/auth.js';

const router = express.Router();

// Get current sprint
router.get('/current', auth, async (req, res) => {
  try {
    const currentSprint = await Sprint.findOne({ status: 'active' });
    
    if (!currentSprint) {
      // Create new sprint if none exists
      const sprintCount = await Sprint.countDocuments();
      const newSprint = new Sprint({
        sprintNumber: sprintCount + 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        status: 'active'
      });
      
      await newSprint.save();
      return res.json(newSprint);
    }

    res.json(currentSprint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all sprints (founder only)
router.get('/', auth, isFounder, async (req, res) => {
  try {
    const sprints = await Sprint.find()
      .populate('eligibleUsers', 'name email')
      .sort({ sprintNumber: -1 });

    res.json(sprints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new sprint (founder only)
router.post('/', auth, isFounder, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const sprintCount = await Sprint.countDocuments();
    
    const sprint = new Sprint({
      sprintNumber: sprintCount + 1,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'active'
    });

    await sprint.save();

    res.status(201).json({ message: 'Sprint created successfully', sprint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;