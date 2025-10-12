import axios from 'axios';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Sprint from '../models/Sprint.js';
import { syncSprintData } from './sprintService.js';

// Mock AI service - replace with actual AI implementation
export const runAICheck = async (userId) => {
  try {
    const user = await User.findById(userId);
    const tasks = await Task.find({ userId, status: 'completed' });

    // Simple mock AI logic
    const completedTasks = tasks.length;
    const totalTasks = await Task.countDocuments({ userId });
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Mock scoring
    let confidenceScore = Math.min(90, completionRate + Math.random() * 20);
    let isEligible = completionRate >= 60 && completedTasks >= 3;

    const result = {
      isEligible,
      confidenceScore: Math.round(confidenceScore),
      remarks: isEligible 
        ? `Good performance with ${completedTasks} completed tasks (${completionRate.toFixed(1)}% completion rate)`
        : `Needs improvement: ${completedTasks} completed tasks (${completionRate.toFixed(1)}% completion rate)`
    };

    // Update user
    user.isEligible = isEligible;
    user.aiCheckResult = {
      ...result,
      lastChecked: new Date()
    };
    await user.save();

    return result;
  } catch (error) {
    console.error('AI Check Error:', error);
    return {
      isEligible: false,
      confidenceScore: 0,
      remarks: 'AI check failed'
    };
  }
};

export const runWeeklyAICheck = async () => {
  try {
    console.log('Running weekly AI check...');
    
    // Sync sprint data with Quest Hive first
    await syncSprintData();
    
    const employees = await User.find({ role: 'employee', questHiveUserId: { $ne: null } });
    const currentSprint = await Sprint.findOne({ status: 'active' });
    
    if (!currentSprint) {
      console.log('No active sprint found');
      return;
    }

    const eligibleUsers = [];
    
    for (const employee of employees) {
      // Use Quest Hive-based eligibility (already calculated in syncSprintData)
      if (employee.isEligible) {
        eligibleUsers.push(employee._id);
      }
    }

    // Update sprint with eligible users
    currentSprint.eligibleUsers = eligibleUsers;
    await currentSprint.save();

    console.log(`AI Check completed. ${eligibleUsers.length} users are eligible.`);
    return {
      success: true,
      eligibleUsers: eligibleUsers.length,
      totalUsers: employees.length
    };
  } catch (error) {
    console.error('Weekly AI Check Error:', error);
    throw error;
  }
};

export const resetSprint = async () => {
  try {
    console.log('Resetting sprint...');
    
    // Mark current sprint as completed
    await Sprint.updateMany(
      { status: 'active' },
      { status: 'completed' }
    );

    // Reset all users for new sprint
    await User.updateMany(
      { role: 'employee' },
      {
        sprintPoints: 0,
        isEligible: false,
        unlockedThisSprint: false,
        aiCheckResult: {},
        sprintData: {
          completedTasks: 0,
          totalTasks: 0,
          completionRate: 0,
          taskBreakdown: {
            completed: 0,
            inProgress: 0,
            todo: 0,
            blocked: 0
          },
          lastUpdated: new Date()
        }
      }
    );

    // Sync with Quest Hive to get new sprint data
    await syncSprintData();

    console.log('Sprint reset completed and synced with Quest Hive.');
    return {
      success: true,
      message: 'Sprint reset completed successfully'
    };
  } catch (error) {
    console.error('Sprint Reset Error:', error);
    throw error;
  }
};