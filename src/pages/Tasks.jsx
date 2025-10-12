import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SafeIcon from '@/common/SafeIcon';
import api from '@/api/axiosConfig.js';
import { useAuth } from '@/contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';

const {
  FiRefreshCw,
  FiExternalLink,
  FiFilter,
  FiUsers,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiPlay,
  FiAlertCircle
} = FiIcons;

const Tasks = () => {
  const { user, isFounder } = useAuth();
  const [questHiveTasks, setQuestHiveTasks] = useState([]);
  const [questHiveUsers, setQuestHiveUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState(null);
  const [questHiveLoading, setQuestHiveLoading] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    sprintId: '',
    search: ''
  });

  useEffect(() => {
    if (isFounder) {
      fetchQuestHiveData();
    }
    fetchCurrentSprintAndTasks();
  }, [isFounder]);

  useEffect(() => {
    if (filters.sprintId || filters.userId || filters.search) {
      fetchQuestHiveTasks();
    }
  }, [filters]);

  const fetchQuestHiveData = async () => {
    try {
      const [sprintsResponse, usersResponse] = await Promise.all([
        api.get('/quest-hive/sprints'),
        api.get('/quest-hive/users')
      ]);

      if (sprintsResponse.data.success) {
        setSprints(sprintsResponse.data.data?.data?.sprints || []);
      }

      if (usersResponse.data.success) {
        setQuestHiveUsers(usersResponse.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching Quest Hive data:', error);
      toast.error('Could not load Quest Hive data.');
    }
  };

  const fetchCurrentSprintAndTasks = async () => {
    setQuestHiveLoading(true);
    try {
      // First, get all sprints to find the latest one
      const sprintsResponse = await api.get('/quest-hive/sprints');
      
      if (sprintsResponse.data.success) {
        const allSprints = sprintsResponse.data.data?.data?.sprints || [];
        setSprints(allSprints);
        
        // Get the latest sprint (most recent by date)
        if (allSprints.length > 0) {
          const latestSprint = allSprints.reduce((latest, sprint) => {
            return new Date(sprint.startDate) > new Date(latest.startDate) ? sprint : latest;
          });
          
          setCurrentSprint(latestSprint);
          
          // Now fetch tasks for the latest sprint
          await fetchTasksForSprint(latestSprint.sprintId);
        }
      }
    } catch (error) {
      console.error('Error fetching current sprint and tasks:', error);
      toast.error('Could not load current sprint tasks.');
    } finally {
      setQuestHiveLoading(false);
    }
  };

  const fetchTasksForSprint = async (sprintId) => {
    try {
      const response = await api.get(`/quest-hive/sprints/${sprintId}/tasks`);
      
      if (response.data.success) {
        let tasks = response.data.data || [];
        
        // Filter tasks by user if not founder
        if (!isFounder && user?.questHiveUserId) {
          tasks = tasks.filter(task => task.userId === user.questHiveUserId);
        }
        
        // Apply search filter if specified
        if (filters.search) {
          tasks = tasks.filter(task =>
            task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            task.description?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        
        // Apply user filter if specified (for founders)
        if (isFounder && filters.userId) {
          tasks = tasks.filter(task => task.userId === filters.userId);
        }
        
        setQuestHiveTasks(tasks);
      }
    } catch (error) {
      console.error(`Error fetching tasks for sprint ${sprintId}:`, error);
      toast.error('Could not load sprint tasks.');
    }
  };

  const fetchQuestHiveTasks = async () => {
    if (!filters.sprintId && !currentSprint) {
      return;
    }

    setQuestHiveLoading(true);
    try {
      const sprintId = filters.sprintId || currentSprint?.sprintId;
      await fetchTasksForSprint(sprintId);
    } catch (error) {
      console.error('Error fetching Quest Hive tasks:', error);
      toast.error('Could not load Quest Hive tasks.');
    } finally {
      setQuestHiveLoading(false);
    }
  };

  const handleSprintChange = (sprintId) => {
    setFilters({ ...filters, sprintId });
    if (sprintId) {
      fetchTasksForSprint(sprintId);
    } else {
      // If no sprint selected, use current sprint
      if (currentSprint) {
        fetchTasksForSprint(currentSprint.sprintId);
      }
    }
  };

  const getStatusIcon = (task) => {
    if (task.completed || task.status === 'completed') return FiCheckCircle;
    if (task.inProgress || task.status === 'in-progress') return FiPlay;
    if (task.blocked || task.status === 'blocked') return FiAlertCircle;
    return FiClock;
  };

  const formatQuestHiveTaskStatus = (task) => {
    if (task.completed || task.status === 'completed') return 'Completed';
    if (task.inProgress || task.status === 'in-progress') return 'In Progress';
    if (task.blocked || task.status === 'blocked') return 'Blocked';
    return 'To Do';
  };

  const getQuestHiveUserName = (userId) => {
    const qhUser = questHiveUsers.find(user => user.userId === userId);
    return qhUser ? qhUser.name : `User ${userId?.substring(0, 8)}`;
  };

  const getStatusColor = (task) => {
    if (task.completed || task.status === 'completed') return 'text-green-400';
    if (task.inProgress || task.status === 'in-progress') return 'text-blue-400';
    if (task.blocked || task.status === 'blocked') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {isFounder ? "Quest Hive Task Management" : "My Quest Hive Tasks"}
          </h1>
          <p className="text-gray-400">
            Quest Hive tasks and progress tracking from external system
          </p>
          {currentSprint && (
            <div className="mt-2 text-sm text-gray-500">
              Current Sprint: {new Date(currentSprint.startDate).toLocaleDateString()} - {new Date(currentSprint.endDate).toLocaleDateString()}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchCurrentSprintAndTasks}
            className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <div className="flex items-center mb-4">
          <SafeIcon icon={FiFilter} className="w-5 h-5 mr-2 text-white" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sprint Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sprint</label>
            <select
              value={filters.sprintId}
              onChange={(e) => handleSprintChange(e.target.value)}
              className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="">Current Sprint</option>
              {sprints.map((sprint) => (
                <option key={sprint.sprintId} value={sprint.sprintId}>
                  Sprint {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter (Founder only) */}
          {isFounder && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">User</label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="">All Users</option>
                {questHiveUsers.map((user) => (
                  <option key={user.userId || user.questHiveUserId} value={user.userId || user.questHiveUserId}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search tasks..."
              className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      {questHiveLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-2 text-gray-400">Loading Quest Hive tasks...</span>
        </div>
      ) : questHiveTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questHiveTasks.map((task, index) => (
            <motion.div
              key={task._id || task.taskId || task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all flex flex-col justify-between relative"
            >
              {/* Quest Hive Badge */}
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                  <SafeIcon icon={FiExternalLink} className="w-3 h-3 mr-1" />
                  Quest Hive
                </span>
              </div>

              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-4">
                    <h3 className="font-semibold text-white mb-2">
                      {task.title || task.name || 'Untitled Task'}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      {task.description || task.details || 'No description available'}
                    </p>
                  </div>
                </div>

                {/* Task Info */}
                <div className="mb-4 space-y-2">
                  {/* Sprint Info */}
                  <div className="flex items-center text-xs text-gray-500">
                    <SafeIcon icon={FiCalendar} className="w-3 h-3 mr-1" />
                    Sprint: {currentSprint ? (
                      `${new Date(currentSprint.startDate).toLocaleDateString()} - ${new Date(currentSprint.endDate).toLocaleDateString()}`
                    ) : 'Current Sprint'}
                  </div>

                  {/* User Info (for founders) */}
                  {task.userId && isFounder && (
                    <div className="flex items-center text-xs text-gray-500">
                      <SafeIcon icon={FiUsers} className="w-3 h-3 mr-1" />
                      Assigned: {getQuestHiveUserName(task.userId)}
                    </div>
                  )}

                  {/* Task ID */}
                  {task.taskId && (
                    <div className="flex items-center text-xs text-gray-500">
                      Task ID: {task.taskId}
                    </div>
                  )}

                  {/* Estimated Hours */}
                  {task.estimatedHours && (
                    <div className="flex items-center text-xs text-gray-500">
                      <SafeIcon icon={FiClock} className="w-3 h-3 mr-1" />
                      Estimated: {task.estimatedHours}h
                    </div>
                  )}

                  {/* Actual Hours */}
                  {task.actualHours && (
                    <div className="flex items-center text-xs text-gray-500">
                      <SafeIcon icon={FiClock} className="w-3 h-3 mr-1" />
                      Actual: {task.actualHours}h
                    </div>
                  )}
                </div>
              </div>

              {/* Status Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center">
                  <SafeIcon 
                    icon={getStatusIcon(task)} 
                    className={`w-4 h-4 mr-2 ${getStatusColor(task)}`} 
                  />
                  <span className={`text-xs font-medium ${getStatusColor(task)}`}>
                    {formatQuestHiveTaskStatus(task)}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  External Task
                </span>
              </div>

              {/* Progress Bar (if applicable) */}
              {task.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <SafeIcon icon={FiExternalLink} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            No Quest Hive tasks found
          </p>
          <p className="text-gray-600 text-sm mb-6">
            {user?.questHiveUserId
              ? 'No tasks found for the current sprint. Try refreshing or check Quest Hive directly.'
              : 'Your account is not linked to Quest Hive. Contact your administrator to link your account.'
            }
          </p>
          {!questHiveLoading && (
            <button
              onClick={fetchCurrentSprintAndTasks}
              className="inline-flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all"
            >
              <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
              Refresh Tasks
            </button>
          )}
        </div>
      )}

      {/* Task Summary */}
      {questHiveTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Sprint Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {questHiveTasks.length}
              </div>
              <div className="text-sm text-gray-400">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {questHiveTasks.filter(task => task.completed || task.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {questHiveTasks.filter(task => task.inProgress || task.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {questHiveTasks.length > 0 
                  ? Math.round((questHiveTasks.filter(task => task.completed || task.status === 'completed').length / questHiveTasks.length) * 100)
                  : 0
                }%
              </div>
              <div className="text-sm text-gray-400">Completion Rate</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Tasks;