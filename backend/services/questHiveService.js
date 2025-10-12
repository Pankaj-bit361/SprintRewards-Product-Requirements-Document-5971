import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const QUEST_HIVE_BASE_URL = "https://addons.questera.ai/api/quest-hive";

// Quest Hive API configuration
const questHiveConfig = {
  apiKey:
    process.env.QUEST_HIVE_API_KEY || "k-8860e8e6-1f30-4573-bbc6-730f12fd9b28",
  entityId:
    process.env.QUEST_HIVE_ENTITY_ID ||
    "e-30923f47-5920-4415-ad99-ebcd7a4a6e6f",
  token:
    process.env.QUEST_HIVE_TOKEN ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1LWMwMzViYmVjLTk1ZWEtNDM2MS1iZGFhLWZlNTM0OWM1Y2NkZSIsImlhdCI6MTc1Nzk5NjgyMywiZXhwIjoxNzYwNTg4ODIzfQ.vyu2pVKgmZYP3EMGs2rYxG6t7u1WzM1QBuNeKI-GS5E",
  userId:
    process.env.QUEST_HIVE_USER_ID || "u-c035bbec-95ea-4361-bdaa-fe5349c5ccde",
};

// Create axios instance with default headers
const questHiveAPI = axios.create({
  baseURL: QUEST_HIVE_BASE_URL,
  headers: {
    // apikey: questHiveConfig.apiKey,
    entityid: questHiveConfig.entityId,
  },
});

// Get all sprints for the entity
export const getAllSprints = async () => {
  try {
    const response = await questHiveAPI.get(
      `/users/${questHiveConfig.userId}/initial-data?entityId=${questHiveConfig.entityId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching sprints from Quest Hive:", error.message);
    throw new Error("Failed to fetch sprints from Quest Hive");
  }
};

// Get tasks for a specific sprint
export const getSprintTasks = async (sprintId) => {
  try {
    const response = await questHiveAPI.get(`/sprints/${sprintId}/tasks`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching tasks for sprint ${sprintId}:`,
      error.message
    );
    throw new Error(`Failed to fetch tasks for sprint ${sprintId}`);
  }
};

// Get specific task details
export const getTaskDetails = async (taskId) => {
  try {
    const response = await questHiveAPI.get(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error.message);
    throw new Error(`Failed to fetch task ${taskId}`);
  }
};

// Get user's task history across all sprints
export const getUserTaskHistory = async (questHiveUserId = null) => {
  try {
    // First get all sprints
    const sprintsData = await getAllSprints();
    const sprints = sprintsData.data?.sprints || [];

    let allTasks = [];

    // Get tasks from each sprint
    for (const sprint of sprints) {
      try {
        const sprintTasks = await getSprintTasks(sprint.sprintId);
        if (sprintTasks.data && sprintTasks.data.length > 0) {
          // Filter tasks by user if questHiveUserId is provided
          const userTasks = questHiveUserId
            ? sprintTasks.data.filter((task) => task.userId === questHiveUserId)
            : sprintTasks.data;

          // Add sprint info to each task
          const tasksWithSprint = userTasks.map((task) => ({
            ...task,
            sprintInfo: {
              sprintId: sprint.sprintId,
              startDate: sprint.startDate,
              endDate: sprint.endDate,
            },
          }));

          allTasks = [...allTasks, ...tasksWithSprint];
        }
      } catch (sprintError) {
        console.warn(
          `Failed to fetch tasks for sprint ${sprint.sprintId}:`,
          sprintError.message
        );
        continue;
      }
    }

    return {
      success: true,
      data: allTasks,
      totalTasks: allTasks.length,
    };
  } catch (error) {
    console.error("Error fetching user task history:", error.message);
    throw new Error("Failed to fetch user task history");
  }
};

// Get all Quest Hive users from the entity
export const getQuestHiveUsers = async () => {
  try {
    const response = await questHiveAPI.get(`/users`);

    console.log("Users response:", response.data.data.length);

    if (!response.data || !response.data.success) {
      return {
        success: false,
        data: [],
        totalUsers: 0,
      };
    }

    return {
      success: true,
      data: response.data.data || [],
      totalUsers: response.data.data.length,
    };
  } catch (error) {
    console.error("Error fetching Quest Hive users:", error.message);
    throw new Error("Failed to fetch Quest Hive users");
  }
};

// Get unique users from task data (alternative method)
export const getUsersFromTasks = async () => {
  try {
    const taskHistory = await getUserTaskHistory();
    const users = new Set();

    taskHistory.data.forEach((task) => {
      if (task.userId) {
        users.add(task.userId);
      }
    });

    return Array.from(users).map((userId) => ({
      questHiveUserId: userId,
      email: `${userId}@questlabs.biz`, // Generate email from userId
      name: `User ${userId.substring(0, 8)}`, // Generate name from userId
    }));
  } catch (error) {
    console.error("Error fetching Quest Hive users from tasks:", error.message);
    throw error;
  }
};
