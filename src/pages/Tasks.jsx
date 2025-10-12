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
  FiAlertCircle,
  FiTarget,
  FiCode,
  FiFileText
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
        const allSprints = sprintsResponse.data.data?.data?.sprints || [];
        // Sort sprints by start date (latest first)
        const sortedSprints = allSprints.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        setSprints(sortedSprints);
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
        // Sort sprints by start date (latest first)
        const sortedSprints = allSprints.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        setSprints(sortedSprints);
        
        // Get the latest sprint (most recent by date)
        if (sortedSprints.length > 0) {
          const latestSprint = sortedSprints[0]; // First item after sorting
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
        
        // Enhanced task parsing and filtering
        tasks = tasks.map(task => parseTaskContent(task));
        
        if (!isFounder && user?.questHiveUserId) {
          tasks = tasks.filter(task => 
            task.assignee?.includes(user.questHiveUserId) || 
            task.userId === user.questHiveUserId
          );
        }

        if (filters.search) {
          tasks = tasks.filter(task =>
            task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            task.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
            task.parsedContent?.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            task.parsedContent?.description?.toLowerCase().includes(filters.search.toLowerCase())
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

  // Enhanced task content parser
  const parseTaskContent = (task) => {
    let parsedTask = { ...task };
    
    try {
      // If task content is a string, try to parse it
      if (typeof task.content === 'string') {
        // Try to parse as JSON first
        try {
          const jsonContent = JSON.parse(task.content);
          parsedTask.parsedContent = jsonContent;
        } catch (jsonError) {
          // If not JSON, try to extract structured data from text
          const textContent = task.content;
          
          // Extract title (first line or until first newline)
          const lines = textContent.split('\n').filter(line => line.trim());
          const title = lines[0]?.replace(/^#+\s*/, '').trim() || task.title || 'Untitled Task';
          
          // Extract description (remaining content)
          const description = lines.slice(1).join('\n').trim() || task.description || '';
          
          // Extract any structured information
          const tags = extractTags(textContent);
          const priority = extractPriority(textContent);
          const estimatedTime = extractEstimatedTime(textContent);
          
          parsedTask.parsedContent = {
            title,
            description,
            tags,
            priority,
            estimatedTime,
            originalContent: textContent
          };
        }
      }
      
      // Ensure we have a display title and description
      parsedTask.displayTitle = parsedTask.parsedContent?.title || 
                                task.title || 
                                task.name || 
                                'Untitled Task';
      
      parsedTask.displayDescription = parsedTask.parsedContent?.description || 
                                     task.description || 
                                     task.details || 
                                     task.content?.substring(0, 200) || 
                                     'No description available';
      
      // Extract task type/category
      parsedTask.taskType = determineTaskType(parsedTask);
      
    } catch (error) {
      console.warn('Error parsing task content:', error);
      // Fallback to original task structure
      parsedTask.displayTitle = task.title || task.name || 'Untitled Task';
      parsedTask.displayDescription = task.description || task.details || 'No description available';
      parsedTask.taskType = 'general';
    }
    
    return parsedTask;
  };

  // Helper functions for content parsing
  const extractTags = (content) => {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const extractPriority = (content) => {
    const priorityRegex = /priority:\s*(high|medium|low|urgent)/i;
    const match = content.match(priorityRegex);
    return match ? match[1].toLowerCase() : 'medium';
  };

  const extractEstimatedTime = (content) => {
    const timeRegex = /(?:estimated?|time|duration):\s*(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|days?|d)/i;
    const match = content.match(timeRegex);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      return unit.startsWith('d') ? value * 8 : value; // Convert days to hours
    }
    return null;
  };

  const determineTaskType = (task) => {
    const content = (task.content || task.displayTitle + ' ' + task.displayDescription).toLowerCase();
    
    if (content.includes('bug') || content.includes('fix') || content.includes('error')) {
      return 'bug';
    }
    if (content.includes('feature') || content.includes('implement') || content.includes('add')) {
      return 'feature';
    }
    if (content.includes('review') || content.includes('test') || content.includes('qa')) {
      return 'review';
    }
    if (content.includes('document') || content.includes('doc') || content.includes('readme')) {
      return 'documentation';
    }
    if (content.includes('refactor') || content.includes('optimize') || content.includes('improve')) {
      return 'improvement';
    }
    
    return 'general';
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
    if (task.completed || task.status === 'completed' || task.status === 'CLOSED') return FiCheckCircle;
    if (task.inProgress || task.status === 'IN_PROGRESS' || task.status === 'in-progress') return FiPlay;
    if (task.blocked || task.status === 'blocked') return FiAlertCircle;
    return FiClock;
  };

  const formatQuestHiveTaskStatus = (task) => {
    if (task.completed || task.status === 'CLOSED' || task.status === 'completed') return 'Completed';
    if (task.inProgress || task.status === 'IN_PROGRESS' || task.status === 'in-progress') return 'In Progress';
    if (task.blocked || task.status === 'blocked') return 'Blocked';
    return 'To Do';
  };

  const getQuestHiveUserName = (userId) => {
    const qhUser = questHiveUsers.find(user => user.userId === userId);
    return qhUser ? qhUser.name : `User ${userId?.substring(0, 8)}`;
  };

  const getStatusColor = (task) => {
    if (task.completed || task.status === 'completed' || task.status === 'CLOSED') return 'text-green-400';
    if (task.inProgress || task.status === 'in-progress' || task.status === 'IN_PROGRESS') return 'text-blue-400';
    if (task.blocked || task.status === 'blocked') return 'text-red-400';
    return 'text-gray-400';
  };

  const getTaskTypeIcon = (taskType) => {
    switch (taskType) {
      case 'bug': return FiAlertCircle;
      case 'feature': return FiTarget;
      case 'review': return FiCheckCircle;
      case 'documentation': return FiFileText;
      case 'improvement': return FiCode;
      default: return FiClock;
    }
  };

  const getTaskTypeColor = (taskType) => {
    switch (taskType) {
      case 'bug': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'feature': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'review': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'documentation': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'improvement': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
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
              <option value="">Current Sprint (Latest)</option>
              {sprints.map((sprint) => (
                <option key={sprint.sprintId} value={sprint.sprintId}>
                  {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                  {sprint === currentSprint && ' (Current)'}
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
                    {/* Task Type Badge */}
                    {task.taskType && (
                      <div className="mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTaskTypeColor(task.taskType)}`}>
                          <SafeIcon icon={getTaskTypeIcon(task.taskType)} className="w-3 h-3 mr-1" />
                          {task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)}
                        </span>
                      </div>
                    )}
                    
                    <h3 className="font-semibold text-white mb-2">
                      {task.displayTitle}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-3">
                      {task.displayDescription}
                    </p>

                    {/* Tags */}
                    {task.parsedContent?.tags && task.parsedContent.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.parsedContent.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-700 text-gray-300">
                            #{tag}
                          </span>
                        ))}
                        {task.parsedContent.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{task.parsedContent.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Priority */}
                    {task.parsedContent?.priority && (
                      <div className="mb-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.parsedContent.priority)}`}>
                          Priority: {task.parsedContent.priority.charAt(0).toUpperCase() + task.parsedContent.priority.slice(1)}
                        </span>
                      </div>
                    )}
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
                  {(task.estimatedHours || task.parsedContent?.estimatedTime) && (
                    <div className="flex items-center text-xs text-gray-500">
                      <SafeIcon icon={FiClock} className="w-3 h-3 mr-1" />
                      Estimated: {task.estimatedHours || task.parsedContent.estimatedTime}h
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {questHiveTasks.length}
              </div>
              <div className="text-sm text-gray-400">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {questHiveTasks.filter(task => 
                  task.completed || 
                  task.status === 'completed' || 
                  task.status === 'CLOSED'
                ).length}
              </div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {questHiveTasks.filter(task => 
                  task.inProgress || 
                  task.status === 'in-progress' || 
                  task.status === 'IN_PROGRESS'
                ).length}
              </div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {questHiveTasks.filter(task => 
                  task.blocked || 
                  task.status === 'blocked'
                ).length}
              </div>
              <div className="text-sm text-gray-400">Blocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {questHiveTasks.length > 0 
                  ? Math.round((questHiveTasks.filter(task => 
                      task.completed || 
                      task.status === 'completed' || 
                      task.status === 'CLOSED'
                    ).length / questHiveTasks.length) * 100)
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