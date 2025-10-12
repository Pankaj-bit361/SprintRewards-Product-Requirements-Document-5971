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
    fetchQuestHiveTasks();
  }, [isFounder]);

  useEffect(() => {
    fetchQuestHiveTasks();
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

  const fetchQuestHiveTasks = async () => {
    setQuestHiveLoading(true);
    try {
      const params = new URLSearchParams();
      
      // For employees, use their questHiveUserId automatically
      if (!isFounder && user?.questHiveUserId) {
        params.append('userId', 'me'); // This will use the employee's own questHiveUserId
      } else if (isFounder && filters.userId) {
        params.append('userId', filters.userId);
      }
      
      if (filters.sprintId) params.append('sprintId', filters.sprintId);
      params.append('limit', '100');

      const response = await api.get(`/quest-hive/task-history?${params.toString()}`);
      
      if (response.data.success) {
        let filteredTasks = response.data.data || [];

        // Apply search filter
        if (filters.search) {
          filteredTasks = filteredTasks.filter(task =>
            task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            task.description?.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        setQuestHiveTasks(filteredTasks);
      }
    } catch (error) {
      console.error('Error fetching Quest Hive tasks:', error);
      toast.error('Could not load Quest Hive tasks.');
    } finally {
      setQuestHiveLoading(false);
    }
  };

  const getStatusIcon = (task) => {
    if (task.completed) return FiCheckCircle;
    if (task.inProgress) return FiPlay;
    if (task.blocked) return FiAlertCircle;
    return FiClock;
  };

  const formatQuestHiveTaskStatus = (task) => {
    if (task.completed) return 'Completed';
    if (task.inProgress) return 'In Progress';
    if (task.blocked) return 'Blocked';
    return 'To Do';
  };

  const getQuestHiveUserName = (userId) => {
    const qhUser = questHiveUsers.find(user => user.userId === userId);
    return qhUser ? qhUser.name : `User ${userId?.substring(0, 8)}`;
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
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchQuestHiveTasks}
            className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters for founders */}
      {isFounder && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center mb-4">
            <SafeIcon icon={FiFilter} className="w-5 h-5 mr-2 text-white" />
            <h3 className="text-lg font-semibold text-white">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sprint</label>
              <select
                value={filters.sprintId}
                onChange={(e) => setFilters({ ...filters, sprintId: e.target.value })}
                className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="">All Sprints</option>
                {sprints.map((sprint) => (
                  <option key={sprint.sprintId} value={sprint.sprintId}>
                    Sprint {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
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
      )}

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
              key={task._id || task.taskId}
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

                {/* Quest Hive specific info */}
                <div className="mb-4 space-y-2">
                  {task.sprintInfo && (
                    <div className="flex items-center text-xs text-gray-500">
                      <SafeIcon icon={FiCalendar} className="w-3 h-3 mr-1" />
                      Sprint: {new Date(task.sprintInfo.startDate).toLocaleDateString()} - {new Date(task.sprintInfo.endDate).toLocaleDateString()}
                    </div>
                  )}
                  {task.userId && isFounder && (
                    <div className="flex items-center text-xs text-gray-500">
                      <SafeIcon icon={FiUsers} className="w-3 h-3 mr-1" />
                      Assigned: {getQuestHiveUserName(task.userId)}
                    </div>
                  )}
                  {task.questHiveUserId && (
                    <div className="flex items-center text-xs text-gray-500">
                      <SafeIcon icon={FiUsers} className="w-3 h-3 mr-1" />
                      Quest Hive ID: {task.questHiveUserId}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center mt-4 pt-4 border-t border-gray-800">
                <SafeIcon 
                  icon={getStatusIcon(task)} 
                  className="w-4 h-4 mr-2 text-gray-400" 
                />
                <span className="text-xs text-gray-500 mr-4">
                  {formatQuestHiveTaskStatus(task)}
                </span>
                <span className="text-xs text-gray-500">
                  External Task
                </span>
              </div>
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
              ? 'No tasks found for your Quest Hive account. Try refreshing or check Quest Hive directly.' 
              : 'Your account is not linked to Quest Hive. Contact your administrator to link your account.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Tasks;