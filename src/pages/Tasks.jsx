import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit3, FiTrash2, FiClock, FiCheckCircle, FiAlertCircle, FiPlay, FiPause } = FiIcons;

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimatedHours: ''
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/tasks', taskForm);
      toast.success('Task created successfully!');
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/tasks/${editingTask._id}`, taskForm);
      toast.success('Task updated successfully!');
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/tasks/${taskId}`);
        toast.success('Task deleted successfully!');
        fetchTasks();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Task status updated!');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const resetForm = () => {
    setTaskForm({ title: '', description: '', priority: 'medium', estimatedHours: '' });
    setEditingTask(null);
    setShowCreateModal(false);
  };

  const openEditModal = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedHours: task.estimatedHours.toString()
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-white bg-gray-700';
      case 'in-progress': return 'text-white bg-gray-700';
      case 'blocked': return 'text-white bg-gray-700';
      default: return 'text-white bg-gray-700';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'blocked', label: 'Blocked' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Tasks</h1>
          <p className="text-gray-400">Manage your sprint tasks and track progress</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all shadow-lg"
        >
          <SafeIcon icon={FiPlus} className="w-5 h-5 mr-2" />
          Add Task
        </motion.button>
      </div>

      {/* Task Stats */}
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
                <SafeIcon icon={getStatusIcon(status.value)} className={`w-8 h-8 text-gray-400`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tasks Grid */}
      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <motion.div
              key={task._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all"
            >
              {/* Task Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">{task.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{task.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Task Meta */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                <span className="text-xs text-gray-500">{task.estimatedHours}h estimated</span>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-400">Status</label>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  className={`w-full p-2 text-sm rounded-lg border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent`}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Footer */}
              <div className="flex items-center mt-4 pt-4 border-t border-gray-800">
                <SafeIcon icon={getStatusIcon(task.status)} className={`w-4 h-4 mr-2 text-gray-400`} />
                <span className="text-xs text-gray-500">
                  Created {new Date(task.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <SafeIcon icon={FiClock} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No tasks yet</p>
          <p className="text-gray-600 text-sm mb-6">Create your first task to start tracking your progress!</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all"
          >
            <SafeIcon icon={FiPlus} className="w-5 h-5 mr-2" />
            Create Task
          </button>
        </div>
      )}

      {/* Create/Edit Task Modal */}
      {showCreateModal && (
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