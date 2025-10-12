import express from 'express';
import User from '../models/User.js';
import { auth, isFounder } from '../middleware/auth.js';
import { getQuestHiveUsers, getUsersFromTasks } from '../services/questHiveService.js';

const router = express.Router();

// Get all employees (founder only)
router.get('/', auth, isFounder, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Quest Hive users for employee creation (founder only)
router.get('/quest-hive-users', auth, isFounder, async (req, res) => {
  try {
    let questHiveUsers;
    
    try {
      // Try to get users from Quest Hive API
      questHiveUsers = await getQuestHiveUsers();
    } catch (apiError) {
      console.warn('Failed to get users from Quest Hive API, trying task history method:', apiError.message);
      // Fallback to getting users from task history
      const usersFromTasks = await getUsersFromTasks();
      questHiveUsers = {
        success: true,
        data: usersFromTasks.map(user => ({
          userId: user.questHiveUserId,
          name: user.name,
          email: user.email,
          role: 'MEMBER',
          companyRole: 'EMPLOYEE',
          entityId: process.env.QUEST_HIVE_ENTITY_ID,
          team: ['Development']
        }))
      };
    }
    
    // Get existing internal users to show mapping status
    const internalUsers = await User.findMappedUsers();
    const mappedUserIds = new Set(internalUsers.map(user => user.questHiveUserId));
    
    // Filter out users that are already mapped and exclude owners
    const availableUsers = questHiveUsers.data.filter(qhUser => 
      !mappedUserIds.has(qhUser.userId) );
    
    res.json({
      success: true,
      data: availableUsers
    });
  } catch (error) {
    console.error('Error fetching Quest Hive users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Quest Hive users' 
    });
  }
});

// Create employee from Quest Hive user (founder only)
router.post('/from-quest-hive', auth, isFounder, async (req, res) => {
  try {
    const { questHiveUserId, password } = req.body;
    
    if (!questHiveUserId || !password) {
      return res.status(400).json({ 
        message: 'Quest Hive User ID and password are required' 
      });
    }
    
    // Check if user already exists with this Quest Hive ID
    const existingUser = await User.findByQuestHiveId(questHiveUserId);
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Employee already exists for this Quest Hive user' 
      });
    }
    
    // Get Quest Hive user data
    let questHiveUsers;
    try {
      questHiveUsers = await getQuestHiveUsers();
    } catch (apiError) {
      const usersFromTasks = await getUsersFromTasks();
      questHiveUsers = {
        success: true,
        data: usersFromTasks.map(user => ({
          userId: user.questHiveUserId,
          name: user.name,
          email: user.email,
          role: 'MEMBER',
          companyRole: 'EMPLOYEE',
          entityId: process.env.QUEST_HIVE_ENTITY_ID,
          team: ['Development']
        }))
      };
    }
    
    const questHiveUser = questHiveUsers.data.find(user => user.userId === questHiveUserId);
    if (!questHiveUser) {
      return res.status(404).json({ 
        message: 'Quest Hive user not found' 
      });
    }
    
    // Check if email already exists in our system
    const existingEmailUser = await User.findOne({ email: questHiveUser.email });
    if (existingEmailUser) {
      return res.status(400).json({ 
        message: 'A user with this email already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      name: questHiveUser.name,
      email: questHiveUser.email,
      password,
      role: 'employee',
      questHiveUserId: questHiveUser.userId,
      sprintPoints: 12,
      rewardPoints: 0,
      avatar: questHiveUser.avatar || ''
    });
    
    // Sync with Quest Hive data
    user.syncWithQuestHive(questHiveUser);
    
    await user.save();
    
    res.status(201).json({
      message: 'Employee created successfully from Quest Hive user',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        questHiveUserId: user.questHiveUserId,
        sprintPoints: user.sprintPoints,
        rewardPoints: user.rewardPoints,
        avatar: user.avatar,
        questHiveData: user.questHiveData
      }
    });
  } catch (error) {
    console.error('Error creating employee from Quest Hive user:', error);
    res.status(500).json({ message: error.message });
  }
});



router.post('/', auth, isFounder, async (req, res) => {
  try {
    const { name, email, password, questHiveUserId } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Employee already exists' });
    }
    
    // If questHiveUserId is provided, check if it's already mapped
    if (questHiveUserId) {
      const existingQHUser = await User.findByQuestHiveId(questHiveUserId);
      if (existingQHUser) {
        return res.status(400).json({ 
          message: 'This Quest Hive user is already mapped to another employee' 
        });
      }
    }
    
    // Create employee
    const user = new User({
      name,
      email,
      password,
      role: 'employee',
      questHiveUserId: questHiveUserId || null,
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
        questHiveUserId: user.questHiveUserId,
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
    const { name, email, sprintPoints, rewardPoints, questHiveUserId } = req.body;
    
    // If updating questHiveUserId, check if it's already mapped to another user
    if (questHiveUserId) {
      const existingQHUser = await User.findByQuestHiveId(questHiveUserId);
      if (existingQHUser && existingQHUser._id.toString() !== req.params.id) {
        return res.status(400).json({ 
          message: 'This Quest Hive user is already mapped to another employee' 
        });
      }
    }
    
    const updateData = {
      name,
      email,
      sprintPoints,
      rewardPoints
    };
    
    // Only update questHiveUserId if provided
    if (questHiveUserId !== undefined) {
      updateData.questHiveUserId = questHiveUserId || null;
    }
    
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

// Sync employee with Quest Hive data (founder only)
router.post('/:id/sync-quest-hive', auth, isFounder, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.questHiveUserId) {
      return res.status(404).json({ 
        message: 'Employee not found or not linked to Quest Hive' 
      });
    }
    
    // Get Quest Hive user data
    const questHiveUsers = await getQuestHiveUsers();
    const questHiveUser = questHiveUsers.data.find(
      qhUser => qhUser.userId === user.questHiveUserId
    );
    
    if (!questHiveUser) {
      return res.status(404).json({ 
        message: 'Quest Hive user not found' 
      });
    }
    
    // Update user with Quest Hive data
    user.name = questHiveUser.name;
    user.email = questHiveUser.email;
    user.syncWithQuestHive(questHiveUser);
    
    await user.save();
    
    res.json({
      message: 'Employee synced with Quest Hive successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        questHiveData: user.questHiveData
      }
    });
  } catch (error) {
    console.error('Error syncing with Quest Hive:', error);
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
      .select('name totalGiven avatar questHiveUserId')
      .sort({ totalGiven: -1 })
      .limit(10);
    
    const topReceivers = await User.find({ role: 'employee' })
      .select('name totalReceived avatar questHiveUserId')
      .sort({ totalReceived: -1 })
      .limit(10);
    
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