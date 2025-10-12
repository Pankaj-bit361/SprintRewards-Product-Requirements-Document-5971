import Sprint from '../models/Sprint.js';
import User from '../models/User.js';
import { getAllSprints, getSprintTasks } from './questHiveService.js';

// Get or create current sprint based on Quest Hive data
export const getCurrentSprint = async () => {
  try {
    // First, get the latest sprint from Quest Hive
    const questHiveData = await getAllSprints();
    const questHiveSprints = questHiveData.data?.sprints || [];
    
    if (questHiveSprints.length === 0) {
      throw new Error('No sprints found in Quest Hive');
    }

    // Sort by start date to get the latest sprint
    const latestQuestHiveSprint = questHiveSprints.sort(
      (a, b) => new Date(b.startDate) - new Date(a.startDate)
    )[0];

    // Check if we have this sprint in our local database
    let localSprint = await Sprint.findOne({
      questHiveSprintId: latestQuestHiveSprint.sprintId
    });

    if (!localSprint) {
      // Create new local sprint based on Quest Hive data
      const sprintCount = await Sprint.countDocuments();
      localSprint = new Sprint({
        sprintNumber: sprintCount + 1,
        startDate: new Date(latestQuestHiveSprint.startDate),
        endDate: new Date(latestQuestHiveSprint.endDate),
        status: 'active',
        questHiveSprintId: latestQuestHiveSprint.sprintId,
        questHiveData: latestQuestHiveSprint
      });
      await localSprint.save();
      console.log(`Created new sprint ${localSprint.sprintNumber} from Quest Hive`);
    }

    return localSprint;
  } catch (error) {
    console.error('Error getting current sprint:', error);
    throw error;
  }
};

// Calculate sprint points for a user based on Quest Hive tasks
export const calculateUserSprintPoints = async (user) => {
  try {
    if (!user.questHiveUserId) {
      return {
        sprintPoints: 0,
        completedTasks: 0,
        totalTasks: 0,
        completionRate: 0,
        taskBreakdown: {
          completed: 0,
          inProgress: 0,
          todo: 0,
          blocked: 0
        }
      };
    }

    // Get current sprint
    const currentSprint = await getCurrentSprint();
    
    // Get user's tasks for current sprint from Quest Hive
    const sprintTasks = await getSprintTasks(currentSprint.questHiveSprintId);
    
    // Filter tasks for this specific user
    const userTasks = sprintTasks.data?.filter(task => task.userId === user.questHiveUserId) || [];
    
    // Count tasks by status
    const taskBreakdown = {
      completed: 0,
      inProgress: 0,
      todo: 0,
      blocked: 0
    };

    userTasks.forEach(task => {
      if (task.completed || task.status === 'CLOSED' || task.status === 'completed') {
        taskBreakdown.completed++;
      } else if (task.inProgress || task.status === 'IN_PROGRESS' || task.status === 'in-progress') {
        taskBreakdown.inProgress++;
      } else if (task.blocked || task.status === 'blocked') {
        taskBreakdown.blocked++;
      } else {
        taskBreakdown.todo++;
      }
    });

    const totalTasks = userTasks.length;
    const completedTasks = taskBreakdown.completed;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate sprint points based on completion rate and task quality
    let sprintPoints = 0;
    
    if (totalTasks > 0) {
      // Base points from completion rate (0-8 points)
      const completionPoints = Math.min(8, Math.floor((completionRate / 100) * 8));
      
      // Bonus points for having tasks (1-2 points)
      const participationPoints = totalTasks >= 3 ? 2 : totalTasks >= 1 ? 1 : 0;
      
      // Penalty for blocked tasks
      const blockedPenalty = Math.min(2, taskBreakdown.blocked);
      
      // Bonus for in-progress tasks (shows active work)
      const progressBonus = Math.min(2, taskBreakdown.inProgress);
      
      sprintPoints = Math.max(0, Math.min(12, 
        completionPoints + participationPoints + progressBonus - blockedPenalty
      ));
    }

    return {
      sprintPoints,
      completedTasks,
      totalTasks,
      completionRate: Math.round(completionRate * 10) / 10,
      taskBreakdown,
      currentSprint: {
        sprintNumber: currentSprint.sprintNumber,
        startDate: currentSprint.startDate,
        endDate: currentSprint.endDate,
        questHiveSprintId: currentSprint.questHiveSprintId
      }
    };
  } catch (error) {
    console.error('Error calculating sprint points for user:', user.email, error);
    return {
      sprintPoints: 0,
      completedTasks: 0,
      totalTasks: 0,
      completionRate: 0,
      taskBreakdown: {
        completed: 0,
        inProgress: 0,
        todo: 0,
        blocked: 0
      }
    };
  }
};

// Update sprint points for all users
export const updateAllUserSprintPoints = async () => {
  try {
    const users = await User.find({ role: 'employee', questHiveUserId: { $ne: null } });
    const results = [];

    for (const user of users) {
      try {
        const sprintData = await calculateUserSprintPoints(user);
        
        // Update user's sprint points and eligibility
        user.sprintPoints = sprintData.sprintPoints;
        user.isEligible = sprintData.sprintPoints >= 8; // Threshold for eligibility
        user.sprintData = {
          completedTasks: sprintData.completedTasks,
          totalTasks: sprintData.totalTasks,
          completionRate: sprintData.completionRate,
          taskBreakdown: sprintData.taskBreakdown,
          lastUpdated: new Date()
        };
        
        await user.save();
        
        results.push({
          userId: user._id,
          email: user.email,
          sprintPoints: sprintData.sprintPoints,
          isEligible: user.isEligible,
          taskData: sprintData
        });
      } catch (userError) {
        console.error(`Error updating sprint points for user ${user.email}:`, userError);
        results.push({
          userId: user._id,
          email: user.email,
          error: userError.message
        });
      }
    }

    return {
      success: true,
      updatedUsers: results.length,
      results
    };
  } catch (error) {
    console.error('Error updating all user sprint points:', error);
    throw error;
  }
};

// Sync sprint data with Quest Hive
export const syncSprintData = async () => {
  try {
    // Get current sprint
    const currentSprint = await getCurrentSprint();
    
    // Update all user sprint points
    const updateResults = await updateAllUserSprintPoints();
    
    // Update sprint statistics
    const users = await User.find({ role: 'employee', questHiveUserId: { $ne: null } });
    const eligibleUsers = users.filter(user => user.isEligible);
    
    currentSprint.eligibleUsers = eligibleUsers.map(user => user._id);
    currentSprint.totalTasks = users.reduce((sum, user) => sum + (user.sprintData?.totalTasks || 0), 0);
    currentSprint.completedTasks = users.reduce((sum, user) => sum + (user.sprintData?.completedTasks || 0), 0);
    currentSprint.lastSynced = new Date();
    
    await currentSprint.save();

    return {
      success: true,
      sprint: currentSprint,
      userUpdates: updateResults
    };
  } catch (error) {
    console.error('Error syncing sprint data:', error);
    throw error;
  }
};

// Get sprint statistics
export const getSprintStatistics = async () => {
  try {
    const currentSprint = await getCurrentSprint();
    const users = await User.find({ role: 'employee', questHiveUserId: { $ne: null } });
    
    const stats = {
      currentSprint: {
        sprintNumber: currentSprint.sprintNumber,
        startDate: currentSprint.startDate,
        endDate: currentSprint.endDate,
        questHiveSprintId: currentSprint.questHiveSprintId,
        status: currentSprint.status
      },
      totalEmployees: users.length,
      eligibleEmployees: users.filter(user => user.isEligible).length,
      averageSprintPoints: users.length > 0 ? 
        Math.round((users.reduce((sum, user) => sum + (user.sprintPoints || 0), 0) / users.length) * 10) / 10 : 0,
      totalTasks: users.reduce((sum, user) => sum + (user.sprintData?.totalTasks || 0), 0),
      completedTasks: users.reduce((sum, user) => sum + (user.sprintData?.completedTasks || 0), 0),
      taskBreakdown: users.reduce((acc, user) => {
        const breakdown = user.sprintData?.taskBreakdown || { completed: 0, inProgress: 0, todo: 0, blocked: 0 };
        acc.completed += breakdown.completed;
        acc.inProgress += breakdown.inProgress;
        acc.todo += breakdown.todo;
        acc.blocked += breakdown.blocked;
        return acc;
      }, { completed: 0, inProgress: 0, todo: 0, blocked: 0 }),
      eligibilityRate: users.length > 0 ? 
        Math.round((users.filter(user => user.isEligible).length / users.length) * 100) : 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting sprint statistics:', error);
    throw error;
  }
};