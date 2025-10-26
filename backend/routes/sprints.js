import express from 'express';
import Sprint from '../models/Sprint.js';
import { auth, isFounder } from '../middleware/auth.js';
import { 
  getCurrentSprint, 
  syncSprintData, 
  getSprintStatistics,
  calculateUserSprintPoints 
} from '../services/sprintService.js';

const router = express.Router();

// Get current sprint with real-time data
router.get('/current', auth, async (req, res) => {
  try {
    const { communityId } = req.query;

    if (!communityId) {
      return res.status(400).json({ message: 'Community ID is required' });
    }

    const currentSprint = await Sprint.findOne({
      communityId,
      status: 'active'
    }).sort({ startDate: -1 });

    if (!currentSprint) {
      return res.status(404).json({ message: 'No active sprint found for this community' });
    }

    // If user is an employee, also get their personal sprint data
    if (req.user.role === 'employee') {
      const userSprintData = await calculateUserSprintPoints(req.user);

      return res.json({
        ...currentSprint.toObject(),
        userSprintData
      });
    }

    res.json(currentSprint);
  } catch (error) {
    console.error('Error getting current sprint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sprint statistics (founder only)
router.get('/statistics', auth, isFounder, async (req, res) => {
  try {
    const { communityId } = req.query;

    if (!communityId) {
      return res.status(400).json({ message: 'Community ID is required' });
    }

    const stats = await getSprintStatistics(communityId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting sprint statistics:', error);
    res.status(500).json({ message: error.message });
  }
});

// Sync sprint data (founder only)
router.post('/sync', auth, isFounder, async (req, res) => {
  try {
    const result = await syncSprintData();
    res.json({
      message: 'Sprint data synced successfully',
      data: result
    });
  } catch (error) {
    console.error('Error syncing sprint data:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's sprint points and task breakdown
router.get('/my-points', auth, async (req, res) => {
  try {
    if (req.user.role === 'founder') {
      return res.status(403).json({ message: 'Founders do not have sprint points' });
    }
    
    const sprintData = await calculateUserSprintPoints(req.user);
    res.json(sprintData);
  } catch (error) {
    console.error('Error getting user sprint points:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all sprints (founder only)
router.get('/', auth, isFounder, async (req, res) => {
  try {
    const { communityId } = req.query;

    if (!communityId) {
      return res.status(400).json({ message: 'Community ID is required' });
    }

    const sprints = await Sprint.find({ communityId })
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
    const { startDate, endDate, communityId } = req.body;

    if (!communityId) {
      return res.status(400).json({ message: 'Community ID is required' });
    }

    const sprintCount = await Sprint.countDocuments({ communityId });
    const sprint = new Sprint({
      sprintNumber: sprintCount + 1,
      communityId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'active'
    });

    await sprint.save();

    res.status(201).json({
      message: 'Sprint created successfully',
      sprint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update sprint status (founder only)
router.put('/:id/status', auth, isFounder, async (req, res) => {
  try {
    const { status } = req.body;
    
    const sprint = await Sprint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }
    
    res.json({
      message: 'Sprint status updated successfully',
      sprint
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;