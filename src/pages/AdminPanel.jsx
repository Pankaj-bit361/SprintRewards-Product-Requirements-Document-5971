import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SafeIcon from '@/common/SafeIcon';
import api from '@/api/axiosConfig.js';
import * as FiIcons from 'react-icons/fi';

const {
  FiUsers,
  FiEdit3,
  FiTrash2,
  FiTrendingUp,
  FiGift,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiLink,
  FiExternalLink,
  FiBarChart,
  FiActivity,
  FiTarget
} = FiIcons;

const AdminPanel = () => {
  const [employees, setEmployees] = useState([]);
  const [questHiveUsers, setQuestHiveUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questHiveLoading, setQuestHiveLoading] = useState(false);
  const [showQuestHiveModal, setShowQuestHiveModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('employees');
  const [questHiveForm, setQuestHiveForm] = useState({
    questHiveUserId: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [employeesRes, transactionsRes] = await Promise.all([
        api.get('/users'),
        api.get('/transactions/all?limit=100')
      ]);
      
      setEmployees(employeesRes.data || []);
      
      // Handle different response structures
      const transactionData = transactionsRes.data;
      if (Array.isArray(transactionData)) {
        setTransactions(transactionData);
      } else if (transactionData && Array.isArray(transactionData.transactions)) {
        setTransactions(transactionData.transactions);
      } else {
        console.warn('Unexpected transaction data structure:', transactionData);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch admin data.');
      // Set default values on error
      setEmployees([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestHiveUsers = async () => {
    setQuestHiveLoading(true);
    try {
      const response = await api.get('/users/quest-hive-users');
      if (response.data && response.data.success) {
        setQuestHiveUsers(response.data.data || []);
      } else {
        setQuestHiveUsers([]);
      }
    } catch (error) {
      console.error('Error fetching Quest Hive users:', error);
      toast.error('Failed to fetch Quest Hive users.');
      setQuestHiveUsers([]);
    } finally {
      setQuestHiveLoading(false);
    }
  };

  const handleCreateFromQuestHive = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/from-quest-hive', questHiveForm);
      toast.success('Employee created from Quest Hive user successfully!');
      closeQuestHiveModal();
      fetchData();
      fetchQuestHiveUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create employee from Quest Hive user');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/users/${employeeId}`);
        toast.success('Employee deleted successfully!');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete employee');
      }
    }
  };

  const handleSyncWithQuestHive = async (employeeId) => {
    try {
      await api.post(`/users/${employeeId}/sync-quest-hive`);
      toast.success('Employee synced with Quest Hive successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sync with Quest Hive');
    }
  };

  const handleApproval = async (transactionId, action) => {
    try {
      await api.post(`/transactions/${transactionId}/${action}`);
      toast.success(`Transaction ${action}ed successfully!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} transaction.`);
    }
  };

  const openQuestHiveModal = () => {
    fetchQuestHiveUsers();
    setShowQuestHiveModal(true);
  };

  const closeQuestHiveModal = () => {
    setShowQuestHiveModal(false);
    setQuestHiveForm({
      questHiveUserId: '',
      password: ''
    });
  };

  // Safe data processing with fallbacks
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];
  
  const pendingTransactions = safeTransactions.filter(t => t && t.status === 'pending');
  const approvedTransactions = safeTransactions.filter(t => t && t.status === 'approved');
  const totalEmployees = safeEmployees.filter(e => e && e.role === 'employee').length;
  const eligibleEmployees = safeEmployees.filter(e => e && e.role === 'employee' && e.isEligible).length;
  const totalPointsInCirculation = safeEmployees.reduce((sum, e) => sum + (e?.rewardPoints || 0), 0);
  const questHiveMappedEmployees = safeEmployees.filter(e => e && e.questHiveUserId).length;
  const totalPointsTransferred = approvedTransactions.reduce((sum, t) => sum + (t?.points || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-400">Manage Quest Hive employees and monitor system activity</p>
        </div>
        <div className="flex items-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openQuestHiveModal}
            className="flex items-center px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all shadow-lg"
          >
            <SafeIcon icon={FiLink} className="w-5 h-5 mr-2" />
            Add from Quest Hive
          </motion.button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-8 p-1 bg-gray-900 rounded-xl border border-gray-800">
        {['employees', 'transactions', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === tab
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
                <SafeIcon icon={FiLink} className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Quest Hive Users</p>
              <p className="text-2xl font-bold text-white">{questHiveMappedEmployees}</p>
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
          transition={{ delay: 0.4 }}
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
          transition={{ delay: 0.5 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                <SafeIcon icon={FiClock} className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Pending Approvals</p>
              <p className="text-2xl font-bold text-white">{pendingTransactions.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pending Approvals */}
      {pendingTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-900 border border-gray-800 rounded-xl mb-8"
        >
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Pending Approvals</h2>
          </div>
          <div className="p-6 space-y-4">
            {pendingTransactions.map(tx => (
              <div
                key={tx._id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-white">
                    {tx.fromUserId?.name || 'Unknown User'} → {tx.toUserId?.name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {tx.points || 0} points - <span className="italic">"{tx.message || 'No message'}"</span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproval(tx._id, 'approve')}
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                  >
                    <SafeIcon icon={FiCheck} />
                  </button>
                  <button
                    onClick={() => handleApproval(tx._id, 'reject')}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <SafeIcon icon={FiX} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tab Content */}
      {activeTab === 'employees' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900 border border-gray-800 rounded-xl"
        >
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Quest Hive Employees</h2>
          </div>
          <div className="p-6">
            {safeEmployees.filter(e => e && e.role === 'employee').length > 0 ? (
              <div className="space-y-4">
                {safeEmployees.filter(e => e && e.role === 'employee').map((employee, index) => (
                  <motion.div
                    key={employee._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border border-gray-800 rounded-lg hover:bg-gray-800 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center relative">
                        {employee.avatar ? (
                          <img
                            src={employee.avatar}
                            alt={employee.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-medium text-sm">
                            {employee.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <SafeIcon icon={FiLink} className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-white">{employee.name || 'Unknown'}</p>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                            <SafeIcon icon={FiExternalLink} className="w-3 h-3 mr-1" />
                            Quest Hive
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{employee.email || 'No email'}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">Sprint: {employee.sprintPoints || 0}/12</span>
                          <span className="text-xs text-gray-500">Rewards: {employee.rewardPoints || 0}</span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              employee.isEligible
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-800 text-gray-400'
                            }`}
                          >
                            <SafeIcon
                              icon={employee.isEligible ? FiCheckCircle : FiAlertCircle}
                              className="w-3 h-3 mr-1"
                            />
                            {employee.isEligible ? 'Eligible' : 'Not Eligible'}
                          </span>
                        </div>
                        {employee.questHiveData && (
                          <div className="text-xs text-gray-500 mt-1">
                            Quest Hive ID: {employee.questHiveUserId || 'N/A'} | 
                            Team: {employee.questHiveData.team?.join(', ') || 'N/A'} | 
                            Role: {employee.questHiveData.companyRole || 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSyncWithQuestHive(employee._id)}
                        className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Sync with Quest Hive"
                      >
                        <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee._id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
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
                <p className="text-gray-500">No Quest Hive employees yet</p>
                <p className="text-gray-600 text-sm">Add employees from Quest Hive to get started.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900 border border-gray-800 rounded-xl"
        >
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">All Transactions</h2>
            <p className="text-sm text-gray-400 mt-1">Complete transaction history across all employees</p>
          </div>
          <div className="p-6">
            {safeTransactions.length > 0 ? (
              <div className="space-y-4">
                {safeTransactions.slice(0, 20).map((transaction, index) => (
                  <motion.div
                    key={transaction._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.status === 'pending' ? 'bg-yellow-500/20' :
                        transaction.status === 'approved' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        <SafeIcon 
                          icon={
                            transaction.status === 'pending' ? FiClock :
                            transaction.status === 'approved' ? FiCheck : FiX
                          } 
                          className={`w-5 h-5 ${
                            transaction.status === 'pending' ? 'text-yellow-400' :
                            transaction.status === 'approved' ? 'text-green-400' : 'text-red-400'
                          }`} 
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {transaction.fromUserId?.name || 'Unknown'} → {transaction.toUserId?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Unknown date'}
                        </p>
                        {transaction.message && (
                          <p className="text-xs text-gray-500 italic mt-1">"{transaction.message}"</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-white">{transaction.points || 0} pts</span>
                      <div className={`text-xs font-medium mt-1 ${
                        transaction.status === 'pending' ? 'text-yellow-400' :
                        transaction.status === 'approved' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {(transaction.status || 'unknown').toUpperCase()}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {safeTransactions.length > 20 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Showing 20 of {safeTransactions.length} transactions</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <SafeIcon icon={FiTrendingUp} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-gray-600 text-sm">Transaction history will appear here once employees start sending points.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* System Analytics */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <SafeIcon icon={FiBarChart} className="w-6 h-6 text-white" />
              <h2 className="text-lg font-semibold text-white">System Analytics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Points Transferred</span>
                  <SafeIcon icon={FiActivity} className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-white">{totalPointsTransferred}</div>
                <div className="text-xs text-gray-500 mt-1">Across all transactions</div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Average Points per Transaction</span>
                  <SafeIcon icon={FiTarget} className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {approvedTransactions.length > 0 ? Math.round(totalPointsTransferred / approvedTransactions.length) : 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">Based on approved transactions</div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Engagement Rate</span>
                  <SafeIcon icon={FiUsers} className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {totalEmployees > 0 ? Math.round((eligibleEmployees / totalEmployees) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Eligible employees this sprint</div>
              </div>
            </div>
          </div>

          {/* Transaction Status Breakdown */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Transaction Status Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiCheck} className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Approved</span>
                </div>
                <div className="text-2xl font-bold text-white">{approvedTransactions.length}</div>
                <div className="text-sm text-gray-400">
                  {totalPointsTransferred} points transferred
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiClock} className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">Pending</span>
                </div>
                <div className="text-2xl font-bold text-white">{pendingTransactions.length}</div>
                <div className="text-sm text-gray-400">
                  {pendingTransactions.reduce((sum, t) => sum + (t?.points || 0), 0)} points pending
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiX} className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">Rejected</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {safeTransactions.filter(t => t && t.status === 'rejected').length}
                </div>
                <div className="text-sm text-gray-400">
                  {safeTransactions.filter(t => t && t.status === 'rejected').reduce((sum, t) => sum + (t?.points || 0), 0)} points rejected
                </div>
              </div>
            </div>
          </div>

          {/* Employee Performance Overview */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Employee Performance Overview</h3>
            <div className="space-y-4">
              {safeEmployees.filter(e => e && e.role === 'employee').slice(0, 5).map((employee, index) => (
                <div key={employee._id || index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      {employee.avatar ? (
                        <img src={employee.avatar} alt={employee.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-medium text-sm">{employee.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{employee.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">Sprint Points: {employee.sprintPoints || 0}/12</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{employee.rewardPoints || 0} points</div>
                    <div className={`text-xs ${employee.isEligible ? 'text-green-400' : 'text-gray-400'}`}>
                      {employee.isEligible ? 'Eligible' : 'Not Eligible'}
                    </div>
                  </div>
                </div>
              ))}
              {safeEmployees.filter(e => e && e.role === 'employee').length === 0 && (
                <div className="text-center py-8">
                  <SafeIcon icon={FiUsers} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No employee data available</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Quest Hive User Selection Modal */}
      {showQuestHiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Add Employee from Quest Hive</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchQuestHiveUsers}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Refresh"
                  >
                    <SafeIcon icon={FiRefreshCw} className="w-4 h-4" />
                  </button>
                  <button
                    onClick={closeQuestHiveModal}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Close"
                  >
                    <SafeIcon icon={FiX} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              {questHiveLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-2 text-gray-400">Loading Quest Hive users...</span>
                </div>
              ) : questHiveUsers.length > 0 ? (
                <div className="space-y-3">
                  {questHiveUsers.map((qhUser) => (
                    <div
                      key={qhUser.userId || qhUser.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        questHiveForm.questHiveUserId === (qhUser.userId || qhUser.id)
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setQuestHiveForm({ ...questHiveForm, questHiveUserId: qhUser.userId || qhUser.id })}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                          {qhUser.avatar ? (
                            <img
                              src={qhUser.avatar}
                              alt={qhUser.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-medium text-sm">
                              {qhUser.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-white">{qhUser.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-400">{qhUser.email || 'No email'}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">ID: {qhUser.userId || qhUser.id || 'N/A'}</span>
                            <span className="text-xs text-gray-500">Role: {qhUser.companyRole || qhUser.role || 'N/A'}</span>
                            {qhUser.team && Array.isArray(qhUser.team) && (
                              <span className="text-xs text-gray-500">Team: {qhUser.team.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <SafeIcon icon={FiUsers} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No available Quest Hive users found</p>
                  <p className="text-gray-600 text-sm">All users may already be mapped or there was an error loading users.</p>
                </div>
              )}
            </div>

            {questHiveForm.questHiveUserId && (
              <form onSubmit={handleCreateFromQuestHive} className="p-6 border-t border-gray-800">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Set Password</label>
                  <input
                    type="password"
                    value={questHiveForm.password}
                    onChange={(e) => setQuestHiveForm({ ...questHiveForm, password: e.target.value })}
                    className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent"
                    placeholder="Enter password for this employee"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={closeQuestHiveModal}
                    className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    Add Employee
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;