import express from 'express';
import { auth, isFounder } from '../middleware/auth.js';
import {
  getAllSprints,
  getSprintTasks,
  getTaskDetails,
  getUserTaskHistory,
  getQuestHiveUsers,
  getUsersFromTasks
} from '../services/questHiveService.js';
import User from '../models/User.js';

const router = express.Router();

// Get all sprints from Quest Hive
router.get('/sprints', auth, async (req, res) => {
  try {
    const sprints = await getAllSprints();
    res.json({
      success: true,
      data: sprints
    });
  } catch (error) {
    console.error('Error in /sprints:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get tasks for a specific sprint
router.get('/sprints/:sprintId/tasks', auth, async (req, res) => {
  try {
    const { sprintId } = req.params;
    const tasks = await getSprintTasks(sprintId);
    
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error(`Error in /sprints/${req.params.sprintId}/tasks:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get specific task details
router.get('/tasks/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await getTaskDetails(taskId);
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(`Error in /tasks/${req.params.taskId}:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's task history (for employees, only their own tasks; for founders, all tasks)
router.get('/users/:userId/tasks', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // If user is not founder and trying to access someone else's tasks, deny
    if (req.user.role !== 'founder' && userId !== 'me') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own tasks.'
      });
    }
    
    // If userId is 'me', get current user's mapped Quest Hive user ID
    let questHiveUserId = null;
    
    if (userId === 'me') {
      // Get current user's Quest Hive mapping
      questHiveUserId = req.user.questHiveUserId;
    } else if (req.user.role === 'founder') {
      // Founders can access any user's tasks
      questHiveUserId = userId;
    }
    
    const taskHistory = await getUserTaskHistory(questHiveUserId);
    
    res.json({
      success: true,
      ...taskHistory
    });
  } catch (error) {
    console.error(`Error in /users/${req.params.userId}/tasks:`, error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all Quest Hive users (founder only)
router.get('/users', auth, isFounder, async (req, res) => {
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
    const internalUsers = await User.find({ questHiveUserId: { $ne: null } });
    const mappedUserIds = new Set(internalUsers.map(user => user.questHiveUserId));
    
    // Add mapping status to Quest Hive users
    const usersWithMappingStatus = questHiveUsers.data.map(qhUser => ({
      ...qhUser,
      isMapped: mappedUserIds.has(qhUser.userId),
      internalUser: internalUsers.find(user => user.questHiveUserId === qhUser.userId)
    }));
    
    res.json({
      success: true,
      data: usersWithMappingStatus
    });
  } catch (error) {
    console.error('Error in /users:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get task history with filtering options
router.get('/task-history', auth, async (req, res) => {
  try {
    const { userId, sprintId, limit = 50, offset = 0 } = req.query;
    
    // If user is not founder, they can only see their own tasks
    let targetUserId = null;
    
    if (req.user.role === 'founder') {
      targetUserId = userId;
    } else {
      // For employees, use their mapped Quest Hive user ID
      targetUserId = req.user.questHiveUserId;
    }
    
    const taskHistory = await getUserTaskHistory(targetUserId);
    
    let filteredTasks = taskHistory.data;
    
    // Filter by sprint if specified
    if (sprintId) {
      filteredTasks = filteredTasks.filter(task => 
        task.sprintInfo?.sprintId === sprintId
      );
    }
    
    // Apply pagination
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedTasks,
      pagination: {
        total: filteredTasks.length,
        limit: parseInt(limit),
        offset: startIndex,
        hasMore: endIndex < filteredTasks.length
      }
    });
  } catch (error) {
    console.error('Error in /task-history:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;