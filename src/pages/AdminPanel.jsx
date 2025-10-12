import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiUserPlus, FiEdit3, FiTrash2, FiRefreshCw, FiTrendingUp, FiGift, FiCheckCircle, FiAlertCircle } = FiIcons;

const AdminPanel = () => {
  const [employees, setEmployees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, transactionsRes] = await Promise.all([
        axios.get('/users'),
        axios.get('/transactions/all?limit=10')
      ]);
      setEmployees(employeesRes.data);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/users', employeeForm);
      toast.success('Employee added successfully!');
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...employeeForm };
      delete updateData.password; // Don't update password in edit mode
      await axios.put(`/users/${editingEmployee._id}`, updateData);
      toast.success('Employee updated successfully!');
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`/users/${employeeId}`);
        toast.success('Employee deleted successfully!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete employee');
      }
    }
  };

  const resetForm = () => {
    setEmployeeForm({ name: '', email: '', password: '' });
    setEditingEmployee(null);
    setShowAddModal(false);
  };

  const openEditModal = (employee) => {
    setEmployeeForm({
      name: employee.name,
      email: employee.email,
      password: ''
    });
    setEditingEmployee(employee);
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const totalEmployees = employees.filter(e => e.role === 'employee').length;
  const eligibleEmployees = employees.filter(e => e.role === 'employee' && e.isEligible).length;
  const totalPointsInCirculation = employees.reduce((sum, e) => sum + e.rewardPoints, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400">Manage employees and monitor system activity</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all shadow-lg"
        >
          <SafeIcon icon={FiUserPlus} className="w-5 h-5 mr-2" />
          Add Employee
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiUsers} className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Employees</p>
              <p className="text-2xl font-bold text-white">{totalEmployees}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiCheckCircle} className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Eligible This Sprint</p>
              <p className="text-2xl font-bold text-white">{eligibleEmployees}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiGift} className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Points</p>
              <p className="text-2xl font-bold text-white">{totalPointsInCirculation}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Recent Transactions</p>
              <p className="text-2xl font-bold text-white">{transactions.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Employees Management */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900 border border-gray-800 rounded-xl"
        >
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Employees</h2>
          </div>
          <div className="p-6">
            {employees.filter(e => e.role === 'employee').length > 0 ? (
              <div className="space-y-4">
                {employees.filter(e => e.role === 'employee').map((employee, index) => (
                  <motion.div
                    key={employee._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border border-gray-800 rounded-lg hover:bg-gray-800 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {employee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{employee.name}</p>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            Sprint: {employee.sprintPoints}/12
                          </span>
                          <span className="text-xs text-gray-500">
                            Rewards: {employee.rewardPoints}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            employee.isEligible ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400'
                          }`}>
                            <SafeIcon icon={employee.isEligible ? FiCheckCircle : FiAlertCircle} className="w-3 h-3 mr-1" />
                            {employee.isEligible ? 'Eligible' : 'Not Eligible'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee._id)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SafeIcon icon={FiUsers} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No employees yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-900 border border-gray-800 rounded-xl"
        >
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          </div>
          <div className="p-6">
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction, index) => (
                  <motion.div
                    key={transaction._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                        <SafeIcon icon={FiGift} className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {transaction.fromUserId.name} → {transaction.toUserId.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-white">{transaction.points} pts</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SafeIcon icon={FiTrendingUp} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h3>
            <form onSubmit={editingEmployee ? handleUpdateEmployee : handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </div>
              {!editingEmployee && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                  <input
                    type="password"
                    value={employeeForm.password}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                    className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                </div>
              )}
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
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;