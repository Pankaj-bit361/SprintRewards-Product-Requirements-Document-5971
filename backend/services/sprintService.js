import Sprint from '../models/Sprint.js';
import User from '../models/User.js';
import Community from '../models/Community.js';

// Helper: Get start of week (Monday 00:00:00)
const getStartOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Helper: Get end of week (Sunday 23:59:59)
const getEndOfWeek = (date = new Date()) => {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
};

// Get or create current sprint for a community
export const getCurrentSprint = async (communityId) => {
  try {
    if (!communityId) {
      throw new Error('Community ID is required');
    }

    const now = new Date();

    // Get the current active sprint for this community
    let currentSprint = await Sprint.findOne({
      communityId,
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    if (!currentSprint) {
      // Check if there's a sprint that should have ended
      const expiredSprint = await Sprint.findOne({
        communityId,
        status: 'active',
        endDate: { $lt: now }
      });

      if (expiredSprint) {
        // Complete the expired sprint
        expiredSprint.status = 'completed';
        await expiredSprint.save();
        console.log(`Completed sprint ${expiredSprint.sprintNumber} for community ${communityId}`);
      }

      // Create new sprint for current week
      currentSprint = await createWeeklySprint(communityId);
    }

    return currentSprint;
  } catch (error) {
    console.error('Error getting current sprint:', error);
    throw error;
  }
};

// Create a new weekly sprint for a community
export const createWeeklySprint = async (communityId) => {
  try {
    const community = await Community.findById(communityId).populate('members.userId');
    if (!community) {
      throw new Error('Community not found');
    }

    const now = new Date();
    const startDate = getStartOfWeek(now);
    const endDate = getEndOfWeek(now);

    // Get sprint count for this community
    const sprintCount = await Sprint.countDocuments({ communityId });

    const newSprint = new Sprint({
      sprintNumber: sprintCount + 1,
      communityId,
      startDate,
      endDate,
      status: 'active'
    });

    await newSprint.save();
    console.log(`✅ Created new weekly sprint ${newSprint.sprintNumber} for community ${communityId} (${community.name})`);
    console.log(`   Sprint period: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // 🎁 ALLOCATE REWARD POINTS TO COMMUNITY MEMBERS (EXCLUDING OWNERS)
    const pointsToAllocate = community.settings?.rewardPointsPerSprint || 500;

    // Update each member's community-specific reward points (skip owners)
    let updatedCount = 0;
    for (const member of community.members) {
      // Skip owners - they have unlimited points
      if (member.role === 'owner') {
        continue;
      }

      const user = await User.findById(member.userId);
      if (user) {
        // Find the community in user's communities array
        const communityIndex = user.communities.findIndex(
          c => c.communityId.toString() === communityId.toString()
        );

        if (communityIndex !== -1) {
          // Increment community-specific reward points ONLY
          user.communities[communityIndex].rewardPoints =
            (user.communities[communityIndex].rewardPoints || 0) + pointsToAllocate;

          await user.save();
          updatedCount++;
        }
      }
    }

    console.log(`💰 Allocated ${pointsToAllocate} reward points to ${updatedCount} members (owners excluded)`);

    return newSprint;
  } catch (error) {
    console.error('Error creating weekly sprint:', error);
    throw error;
  }
};

// Calculate sprint points for a user in their current community
export const calculateUserSprintPoints = async (user, communityId = null) => {
  try {
    // Use user's current community if not specified
    const targetCommunityId = communityId || user.currentCommunityId;

    if (!targetCommunityId) {
      throw new Error('No community ID available for user');
    }

    // Get current sprint for the community
    const currentSprint = await getCurrentSprint(targetCommunityId);

    // Return default sprint data (no external task tracking)
    return {
      sprintPoints: user.sprintPoints || 0,
      completedTasks: user.sprintData?.completedTasks || 0,
      totalTasks: user.sprintData?.totalTasks || 0,
      completionRate: user.sprintData?.completionRate || 0,
      taskBreakdown: user.sprintData?.taskBreakdown || {
        completed: 0,
        inProgress: 0,
        todo: 0,
        blocked: 0
      },
      currentSprint: {
        sprintNumber: currentSprint.sprintNumber,
        startDate: currentSprint.startDate,
        endDate: currentSprint.endDate
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

// Update sprint points for all users in a community
export const updateAllUserSprintPoints = async (communityId) => {
  try {
    const community = await Community.findById(communityId).populate('members.userId');
    if (!community) {
      throw new Error('Community not found');
    }

    const memberIds = community.members.map(m => m.userId);
    const users = await User.find({
      _id: { $in: memberIds },
      role: 'employee'
    });

    const results = [];
    const eligibilityThreshold = community.settings.eligibilityThreshold || 8;

    for (const user of users) {
      try {
        const sprintData = await calculateUserSprintPoints(user, communityId);

        // Update user's sprint points and eligibility
        user.sprintPoints = sprintData.sprintPoints;
        user.isEligible = sprintData.sprintPoints >= eligibilityThreshold;
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

// Sync sprint data for a community
export const syncSprintData = async (communityId) => {
  try {
    // Get current sprint
    const currentSprint = await getCurrentSprint(communityId);

    // Update all user sprint points
    const updateResults = await updateAllUserSprintPoints(communityId);

    // Get community members
    const community = await Community.findById(communityId).populate('members.userId');
    const memberIds = community.members.map(m => m.userId);
    const users = await User.find({
      _id: { $in: memberIds },
      role: 'employee'
    });

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

// Get sprint statistics for a community
export const getSprintStatistics = async (communityId) => {
  try {
    const currentSprint = await getCurrentSprint(communityId);

    // Get community members
    const community = await Community.findById(communityId).populate('members.userId');
    const memberIds = community.members.map(m => m.userId);
    const users = await User.find({
      _id: { $in: memberIds },
      role: 'employee'
    });

    const stats = {
      currentSprint: {
        sprintNumber: currentSprint.sprintNumber,
        startDate: currentSprint.startDate,
        endDate: currentSprint.endDate,
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

// Check and create sprints for all communities (scheduled job)
export const checkAndCreateSprints = async () => {
  try {
    const communities = await Community.find();
    const results = [];

    for (const community of communities) {
      try {
        // This will auto-create sprint if needed
        const sprint = await getCurrentSprint(community._id);
        results.push({
          communityId: community._id,
          communityName: community.name,
          sprintNumber: sprint.sprintNumber,
          status: 'ok'
        });
      } catch (error) {
        console.error(`Error checking sprint for community ${community.name}:`, error);
        results.push({
          communityId: community._id,
          communityName: community.name,
          error: error.message
        });
      }
    }

    return {
      success: true,
      checked: communities.length,
      results
    };
  } catch (error) {
    console.error('Error checking and creating sprints:', error);
    throw error;
  }
};

// Complete expired sprints and create new ones (scheduled job)
export const rolloverSprints = async () => {
  try {
    const now = new Date();

    // Find all expired active sprints
    const expiredSprints = await Sprint.find({
      status: 'active',
      endDate: { $lt: now }
    });

    const results = [];

    for (const sprint of expiredSprints) {
      try {
        // Complete the sprint
        sprint.status = 'completed';
        await sprint.save();

        // Create new sprint for the community
        const newSprint = await createWeeklySprint(sprint.communityId);

        results.push({
          communityId: sprint.communityId,
          completedSprint: sprint.sprintNumber,
          newSprint: newSprint.sprintNumber,
          status: 'success'
        });
      } catch (error) {
        console.error(`Error rolling over sprint for community ${sprint.communityId}:`, error);
        results.push({
          communityId: sprint.communityId,
          error: error.message
        });
      }
    }

    return {
      success: true,
      rolledOver: results.length,
      results
    };
  } catch (error) {
    console.error('Error rolling over sprints:', error);
    throw error;
  }
};