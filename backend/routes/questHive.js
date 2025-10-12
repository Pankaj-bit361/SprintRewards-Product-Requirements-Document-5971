import express from 'express';
import { auth, isFounder } from '../middleware/auth.js';
import {
  getAllSprints,
  getSprintTasks,
  getTaskDetails,
  getUserTaskHistory,
  getQuestHiveUsers
} from '../services/questHiveService.js';

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
    // For now, we'll get all tasks since we don't have the mapping set up yet
    const questHiveUserId = userId === 'me' ? null : userId;
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
    const users = await getQuestHiveUsers();
    
    res.json({
      success: true,
      data: users
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
    const targetUserId = req.user.role === 'founder' ? userId : null;
    
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