import express from 'express';
import User from '../models/User.js';
import Community from '../models/Community.js';
import { auth, isFounder } from '../middleware/auth.js';

const router = express.Router();

// Get employees - founder gets all, owners get their community members
router.get('/', auth, async (req, res) => {
  try {
    const { communityId } = req.query;
    const isFounderUser = req.user.role === 'founder';

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    // If communityId is provided, filter and add community-specific data
    if (communityId) {
      const usersWithCommunityData = users
        .filter(user => {
          // If founder, include all; otherwise include only members of this community
          if (isFounderUser) return true;
          return user.communities?.some(c => c.communityId.toString() === communityId.toString());
        })
        .map(user => {
          const userCommunity = user.communities?.find(
            c => c.communityId.toString() === communityId.toString()
          );

          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            sprintPoints: user.sprintPoints,
            isEligible: user.isEligible,
            avatar: user.avatar,
            createdAt: user.createdAt,
            // Community-specific data
            rewardPoints: userCommunity?.rewardPoints || 0,
            claimablePoints: userCommunity?.claimablePoints || 0,
            totalGiven: userCommunity?.totalGiven || 0,
            totalReceived: userCommunity?.totalReceived || 0,
            communityRole: userCommunity?.role || 'member'
          };
        });

      return res.json(usersWithCommunityData);
    }

    // If no communityId
    if (isFounderUser) {
      // Founder can see all users (backward compatibility)
      return res.json(users);
    }

    return res.status(400).json({ message: 'Community ID is required for non-founder users' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update employee (founder only)
router.put('/:id', auth, isFounder, async (req, res) => {
  try {
    const { name, email, sprintPoints, rewardPoints } = req.body;

    const updateData = { name, email, sprintPoints, rewardPoints };

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      message: 'Employee updated successfully',
      user
    });
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



router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { communityId } = req.query;

    if (!communityId) {
      return res.status(400).json({ message: 'Community ID is required' });
    }

    // Get community members
    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const memberIds = community.members.map(m => m.userId);

    // Get all users and extract community-specific stats
    const users = await User.find({
      _id: { $in: memberIds },
      role: 'employee'
    }).select('name avatar communities');

    // Extract community-specific stats for each user
    const usersWithStats = users.map(user => {
      const userCommunity = user.communities.find(
        c => c.communityId.toString() === communityId.toString()
      );

      return {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        totalGiven: userCommunity?.totalGiven || 0,
        totalReceived: userCommunity?.totalReceived || 0
      };
    });

    // Sort and get top givers
    const topGivers = usersWithStats
      .sort((a, b) => b.totalGiven - a.totalGiven)
      .slice(0, 10)
      .map(u => ({
        _id: u._id,
        name: u.name,
        avatar: u.avatar,
        totalGiven: u.totalGiven
      }));

    // Sort and get top receivers
    const topReceivers = usersWithStats
      .sort((a, b) => b.totalReceived - a.totalReceived)
      .slice(0, 10)
      .map(u => ({
        _id: u._id,
        name: u.name,
        avatar: u.avatar,
        totalReceived: u.totalReceived
      }));

    res.json({
      topGivers,
      topReceivers
    });
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
    const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (!isWeekend) {
      return res.status(400).json({
        message: 'Points can only be unlocked on weekends'
      });
    }

    if (!user.isEligible) {
      return res.status(400).json({
        message: 'You are not eligible to unlock points this sprint'
      });
    }

    if (user.unlockedThisSprint) {
      return res.status(400).json({
        message: 'You have already unlocked points this sprint'
      });
    }

    // Get current community ID from request body
    const { communityId } = req.body;
    if (!communityId) {
      return res.status(400).json({ message: 'Community ID is required' });
    }

    // Find the community in user's communities array
    const communityIndex = user.communities.findIndex(
      c => c.communityId.toString() === communityId.toString()
    );

    if (communityIndex === -1) {
      return res.status(403).json({ message: 'You are not a member of this community' });
    }

    // Unlock 500 points to community-specific balance
    user.communities[communityIndex].rewardPoints =
      (user.communities[communityIndex].rewardPoints || 0) + 500;
    user.unlockedThisSprint = true;
    await user.save();

    res.json({
      message: 'Successfully unlocked 500 reward points!',
      rewardPoints: user.communities[communityIndex].rewardPoints
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;