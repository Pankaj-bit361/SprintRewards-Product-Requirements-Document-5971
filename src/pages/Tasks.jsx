import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SafeIcon from '@/common/SafeIcon';
import api from '@/api/axiosConfig.js';
import { useAuth } from '@/contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit3, FiTrash2, FiClock, FiCheckCircle, FiAlertCircle, FiPlay, FiMessageSquare, FiFilter, FiUsers, FiCalendar, FiRefreshCw, FiExternalLink } = FiIcons;

const Tasks = () => {
  const { user, isFounder } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [questHiveTasks, setQuestHiveTasks] = useState([]);
  const [questHiveUsers, setQuestHiveUsers] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questHiveLoading, setQuestHiveLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('internal'); // 'internal' or 'quest-hive'
  const [filters, setFilters] = useState({
    userId: '',
    sprintId: '',
    search: ''
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimatedHours: '',
    founderFeedback: ''
  });

  useEffect(() => {
    fetchInternalTasks();
    if (isFounder) {
      fetchQuestHiveData();
    }
  }, [isFounder]);

  useEffect(() => {
    if (activeTab === 'quest-hive') {
      fetchQuestHiveTasks();
    }
  }, [activeTab, filters]);

  const fetchInternalTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Could not load your tasks.');
    } finally {
      setLoading(false);
    }
  };

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
      if (filters.userId) params.append('userId', filters.userId);
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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', taskForm);
      toast.success('Task created successfully!');
      resetForm();
      fetchInternalTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/tasks/${editingTask._id}`, taskForm);
      toast.success('Task updated successfully!');
      resetForm();
      fetchInternalTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${taskId}`);
        toast.success('Task deleted successfully!');
        fetchInternalTasks();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Task status updated!');
      fetchInternalTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task status');
    }
  };

  const resetForm = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      estimatedHours: '',
      founderFeedback: ''
    });
    setEditingTask(null);
    setShowCreateModal(false);
  };

  const openEditModal = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedHours: task.estimatedHours?.toString() || '',
      founderFeedback: task.founderFeedback || ''
    });
    setEditingTask(task);
    setShowCreateModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return FiCheckCircle;
      case 'in-progress': return FiPlay;
      case 'blocked': return FiAlertCircle;
      default: return FiClock;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-white bg-black';
      case 'high': return 'text-white bg-gray-800';
      case 'medium': return 'text-white bg-gray-700';
      default: return 'text-white bg-gray-600';
    }
  };

  const formatQuestHiveTaskStatus = (task) => {
    // Map Quest Hive task properties to our status system
    if (task.completed) return 'completed';
    if (task.inProgress) return 'in-progress';
    if (task.blocked) return 'blocked';
    return 'todo';
  };

  const getQuestHiveUserName = (userId) => {
    const qhUser = questHiveUsers.find(user => user.userId === userId);
    return qhUser ? qhUser.name : `User ${userId?.substring(0, 8)}`;
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'blocked', label: 'Blocked' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const currentTasks = activeTab === 'internal' ? tasks : questHiveTasks;
  const isQuestHiveTab = activeTab === 'quest-hive';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {isFounder ? "Task Management" : "My Tasks"}
          </h1>
          <p className="text-gray-400">
            {isQuestHiveTab ? "Quest Hive external tasks" : "Internal sprint tasks and progress tracking"}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {isQuestHiveTab && (
            <button
              onClick={fetchQuestHiveTasks}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all"
            >
              <SafeIcon icon={FiRefreshCw} className="w-4 h-4 mr-2" />
              Refresh
            </button>
          )}
          
          {!isFounder && !isQuestHiveTab && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all shadow-lg"
            >
              <SafeIcon icon={FiPlus} className="w-5 h-5 mr-2" />
              Add Task
            </motion.button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      {isFounder && (
        <div className="flex space-x-2 mb-8 p-1 bg-gray-900 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'internal'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Internal Tasks
          </button>
          <button
            onClick={() => setActiveTab('quest-hive')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'quest-hive'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <SafeIcon icon={FiExternalLink} className="w-4 h-4 mr-2" />
            Quest Hive Tasks
          </button>
        </div>
      )}

      {/* Show Quest Hive tab for employees if they have questHiveUserId */}
      {!isFounder && user?.questHiveUserId && (
        <div className="flex space-x-2 mb-8 p-1 bg-gray-900 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'internal'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Internal Tasks
          </button>
          <button
            onClick={() => setActiveTab('quest-hive')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === 'quest-hive'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <SafeIcon icon={FiExternalLink} className="w-4 h-4 mr-2" />
            My Quest Hive Tasks
          </button>
        </div>
      )}

      {/* Filters for Quest Hive tasks */}
      {isQuestHiveTab && isFounder && (
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

      {/* Stats Cards */}
      {!isQuestHiveTab && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {statusOptions.map((status, index) => {
            const count = tasks.filter(task => task.status === status.value).length;
            return (
              <motion.div
                key={status.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{status.label}</p>
                    <p className="text-2xl font-bold text-white">{count}</p>
                  </div>
                  <SafeIcon icon={getStatusIcon(status.value)} className="w-8 h-8 text-gray-400" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Tasks Grid */}
      {questHiveLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-2 text-gray-400">Loading Quest Hive tasks...</span>
        </div>
      ) : currentTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentTasks.map((task, index) => (
            <motion.div
              key={isQuestHiveTab ? task._id || task.taskId : task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all flex flex-col justify-between relative"
            >
              {/* Quest Hive Badge */}
              {isQuestHiveTab && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                    <SafeIcon icon={FiExternalLink} className="w-3 h-3 mr-1" />
                    Quest Hive
                  </span>
                </div>
              )}

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
                  
                  {!isQuestHiveTab && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                      </button>
                      {!isFounder && (
                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Quest Hive specific info */}
                {isQuestHiveTab && (
                  <div className="mb-4 space-y-2">
                    {task.sprintInfo && (
                      <div className="flex items-center text-xs text-gray-500">
                        <SafeIcon icon={FiCalendar} className="w-3 h-3 mr-1" />
                        Sprint: {new Date(task.sprintInfo.startDate).toLocaleDateString()} - {new Date(task.sprintInfo.endDate).toLocaleDateString()}
                      </div>
                    )}
                    {task.userId && (
                      <div className="flex items-center text-xs text-gray-500">
                        <SafeIcon icon={FiUsers} className="w-3 h-3 mr-1" />
                        Assigned: {getQuestHiveUserName(task.userId)}
                      </div>
                    )}
                  </div>
                )}

                {/* Internal task specific info */}
                {!isQuestHiveTab && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {task.estimatedHours}h estimated
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-400">Status</label>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className="w-full p-2 text-sm rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {task.founderFeedback && (
                      <div className="mt-4 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                        <p className="text-xs font-bold text-gray-400 mb-1">Founder Feedback</p>
                        <p className="text-sm text-gray-300 italic">"{task.founderFeedback}"</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center mt-4 pt-4 border-t border-gray-800">
                <SafeIcon 
                  icon={getStatusIcon(isQuestHiveTab ? formatQuestHiveTaskStatus(task) : task.status)} 
                  className="w-4 h-4 mr-2 text-gray-400" 
                />
                <span className="text-xs text-gray-500">
                  {!isQuestHiveTab && isFounder ? `${task.userId?.name} - ` : ''}
                  {isQuestHiveTab ? 'External Task' : `Created ${new Date(task.createdAt).toLocaleDateString()}`}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <SafeIcon icon={FiClock} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {isQuestHiveTab ? 'No Quest Hive tasks found' : 'No tasks yet'}
          </p>
          <p className="text-gray-600 text-sm mb-6">
            {isQuestHiveTab 
              ? user?.questHiveUserId 
                ? 'No tasks found for your Quest Hive account. Try adjusting filters or check Quest Hive directly.'
                : 'Your account is not linked to Quest Hive. Contact your administrator to link your account.'
              : 'Create your first task to start tracking your progress!'
            }
          </p>
          {!isFounder && !isQuestHiveTab && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all"
            >
              <SafeIcon icon={FiPlus} className="w-5 h-5 mr-2" />
              Create Task
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Task Modal */}
      {showCreateModal && !isQuestHiveTab && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Describe the task"
                  rows="3"
                />
              </div>

              {isFounder && editingTask && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Founder Feedback</label>
                  <textarea
                    value={taskForm.founderFeedback}
                    onChange={(e) => setTaskForm({ ...taskForm, founderFeedback: e.target.value })}
                    className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Provide feedback..."
                    rows="3"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={taskForm.estimatedHours}
                    onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                    className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Hours"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Tasks;