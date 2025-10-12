import axios from 'axios';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Sprint from '../models/Sprint.js';

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
    const employees = await User.find({ role: 'employee' });
    const currentSprint = await Sprint.findOne({ status: 'active' });
    
    if (!currentSprint) return;

    const eligibleUsers = [];

    for (const employee of employees) {
      const result = await runAICheck(employee._id);
      if (result.isEligible) {
        eligibleUsers.push(employee._id);
      }
    }

    // Update sprint with eligible users
    currentSprint.eligibleUsers = eligibleUsers;
    await currentSprint.save();

    console.log(`AI Check completed. ${eligibleUsers.length} users are eligible.`);
  } catch (error) {
    console.error('Weekly AI Check Error:', error);
  }
};

export const resetSprint = async () => {
  try {
    // Mark current sprint as completed
    await Sprint.updateMany({ status: 'active' }, { status: 'completed' });

    // Reset all users for new sprint
    await User.updateMany(
      { role: 'employee' },
      {
        sprintPoints: 12,
        isEligible: false,
        unlockedThisSprint: false,
        aiCheckResult: {}
      }
    );

    // Create new sprint
    const sprintCount = await Sprint.countDocuments();
    const newSprint = new Sprint({
      sprintNumber: sprintCount + 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active'
    });

    await newSprint.save();

    console.log(`Sprint reset completed. New sprint #${newSprint.sprintNumber} started.`);
  } catch (error) {
    console.error('Sprint Reset Error:', error);
  }
};