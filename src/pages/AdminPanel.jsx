import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SafeIcon from '@/common/SafeIcon';
import api from '@/api/axiosConfig.js';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import * as FiIcons from 'react-icons/fi';

const {
  FiUsers,
  FiTrash2,
  FiTrendingUp,
  FiGift,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiCheck,
  FiX,
  FiBarChart,
  FiActivity,
  FiTarget
} = FiIcons;

const AdminPanel = () => {
  const { user, isFounder, isCommunityOwner } = useAuth();
  const { theme } = useTheme();
  const [employees, setEmployees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let employeesRes, transactionsRes;
      const communityId = user.currentCommunityId;

      if (isFounder) {
        // Founders see users and transactions from current community
        [employeesRes, transactionsRes] = await Promise.all([
          api.get(`/users?communityId=${communityId}`),
          api.get(`/transactions/all?limit=100&communityId=${communityId}`)
        ]);
      } else if (isCommunityOwner) {
        // Community owners see only their community's members and transactions
        [employeesRes, transactionsRes] = await Promise.all([
          api.get(`/communities/${communityId}/members?includeAll=true`),
          api.get(`/transactions/history?limit=100&communityId=${communityId}&all=true`)
        ]);
      }

      setEmployees(employeesRes.data || []);

      // Handle different response structures
      const transactionData = transactionsRes.data;
      if (Array.isArray(transactionData)) {
        setTransactions(transactionData);
      } else if (transactionData && Array.isArray(transactionData.transactions)) {
        setTransactions(transactionData.transactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch admin data.');
      setEmployees([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    const confirmMessage = isFounder
      ? 'Are you sure you want to delete this user from the system?'
      : 'Are you sure you want to remove this member from your community?';

    if (window.confirm(confirmMessage)) {
      try {
        if (isFounder) {
          // Founders can delete users completely
          await api.delete(`/users/${memberId}`);
          toast.success('User deleted successfully!');
        } else {
          // Community owners can only remove from their community
          const communityId = user.currentCommunityId;
          await api.delete(`/communities/${communityId}/members/${memberId}`);
          toast.success('Member removed from community!');
        }
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to remove member');
      }
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

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const communityId = user.currentCommunityId;
      await api.post(`/communities/${communityId}/invite`, inviteForm);
      toast.success(`Invitation sent to ${inviteForm.email}`);
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'member' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    }
  };

  // Safe data processing with fallbacks
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const pendingTransactions = safeTransactions.filter(t => t && t.status === 'pending');
  const approvedTransactions = safeTransactions.filter(t => t && t.status === 'approved');
  const totalEmployees = safeEmployees.filter(e => e && e.role === 'employee').length;
  const eligibleEmployees = safeEmployees.filter(e => e && e.role === 'employee' && e.isEligible).length;
  const totalPointsInCirculation = safeEmployees.reduce((sum, e) => sum + (e?.rewardPoints || 0), 0);
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
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.text }}>Admin Panel</h1>
          <p style={{ color: theme.textSecondary }}>
            {isFounder
              ? 'Manage community members, transactions, and invite new users'
              : 'Manage your community members, view transactions, and invite new users'}
          </p>
          {!isFounder && (
            <div
              className="mt-2 inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium"
              style={{
                backgroundColor: `${theme.primary}20`,
                borderColor: theme.primary,
                color: theme.primary,
              }}
            >
              Community Owner View
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowInviteModal(true)}
            style={{
              backgroundColor: theme.primary,
              color: theme.background,
            }}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.primaryLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.primary;
            }}
          >
            <FiUsers className="w-5 h-5" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex space-x-2 mb-8 p-1 rounded-xl border"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}
      >
        {['employees', 'transactions', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              backgroundColor: activeTab === tab ? theme.primary : 'transparent',
              color: activeTab === tab ? theme.background : theme.textSecondary,
            }}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-300"
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.color = theme.text;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.color = theme.textSecondary;
              }
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: FiUsers, label: 'Total Employees', value: totalEmployees, delay: 0.1 },
          { icon: FiCheckCircle, label: 'Eligible This Sprint', value: eligibleEmployees, delay: 0.3 },
          { icon: FiGift, label: 'Total Points', value: totalPointsInCirculation, delay: 0.4 },
          { icon: FiClock, label: 'Pending Approvals', value: pendingTransactions.length, delay: 0.5 },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
            className="border rounded-xl p-6"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: theme.primaryLight,
                    color: theme.background,
                  }}
                >
                  <SafeIcon icon={stat.icon} className="w-6 h-6" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium" style={{ color: theme.textSecondary }}>{stat.label}</p>
                <p className="text-2xl font-bold" style={{ color: theme.primary }}>{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pending Approvals - For Founders and Community Owners */}
      {(isFounder || isCommunityOwner) && pendingTransactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-900 border border-gray-800 rounded-xl mb-8"
        >
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Pending Approvals</h2>
            <p className="text-sm text-gray-400 mt-1">Review and approve/reject transactions</p>
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
                    className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    title="Approve transaction"
                  >
                    <SafeIcon icon={FiCheck} />
                  </button>
                  <button
                    onClick={() => handleApproval(tx._id, 'reject')}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Reject transaction"
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
          className="border rounded-xl"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: theme.border }}>
            <h2 className="text-lg font-semibold" style={{ color: theme.text }}>Employees</h2>
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
                    className="flex items-center justify-between p-4 border rounded-lg transition-all"
                    style={{
                      borderColor: theme.border,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.surfaceLight}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center relative"
                        style={{ backgroundColor: theme.surfaceLight }}
                      >
                        {employee.avatar ? (
                          <img
                            src={employee.avatar}
                            alt={employee.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="font-medium text-sm" style={{ color: theme.text }}>
                            {employee.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}

                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium" style={{ color: theme.text }}>{employee.name || 'Unknown'}</p>
                        </div>
                        <p className="text-sm" style={{ color: theme.textSecondary }}>{employee.email || 'No email'}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs" style={{ color: theme.textSecondary }}>Sprint: {employee.sprintPoints || 0}/12</span>
                          <span className="text-xs" style={{ color: theme.textSecondary }}>Rewards: {employee.rewardPoints || 0}</span>
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: employee.isEligible ? theme.surfaceLight : theme.surface,
                              color: employee.isEligible ? theme.success : theme.textSecondary,
                            }}
                          >
                            <SafeIcon
                              icon={employee.isEligible ? FiCheckCircle : FiAlertCircle}
                              className="w-3 h-3 mr-1"
                            />
                            {employee.isEligible ? 'Eligible' : 'Not Eligible'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRemoveMember(employee._id)}
                        className="p-2 transition-colors"
                        style={{ color: theme.textSecondary }}
                        onMouseEnter={(e) => e.currentTarget.style.color = theme.error}
                        onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
                        title={isFounder ? 'Delete user' : 'Remove from community'}
                      >
                        <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SafeIcon icon={FiUsers} className="w-12 h-12 mx-auto mb-3" style={{ color: theme.textSecondary }} />
                <p style={{ color: theme.textSecondary }}>No employees yet</p>
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
          className="border rounded-xl"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: theme.border }}>
            <h2 className="text-lg font-semibold" style={{ color: theme.text }}>All Transactions</h2>
            <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>Complete transaction history across all employees</p>
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
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{
                      backgroundColor: theme.surfaceLight,
                      borderColor: theme.border,
                    }}
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
                        <p className="text-sm font-medium" style={{ color: theme.text }}>
                          {transaction.fromUserId?.name || 'Unknown'} → {transaction.toUserId?.name || 'Unknown'}
                        </p>
                        <p className="text-xs" style={{ color: theme.textSecondary }}>
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Unknown date'}
                        </p>
                        {transaction.message && (
                          <p className="text-xs italic mt-1" style={{ color: theme.textSecondary }}>"{transaction.message}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-lg font-bold" style={{ color: theme.text }}>{transaction.points || 0} pts</span>
                        <div
                          className="text-xs font-medium mt-1"
                          style={{
                            color: transaction.status === 'pending' ? theme.warning :
                                   transaction.status === 'approved' ? theme.success : theme.error
                          }}
                        >
                          {(transaction.status || 'unknown').toUpperCase()}
                        </div>
                      </div>
                      {/* Approve/Reject buttons for pending transactions (Founders and Community Owners) */}
                      {(isFounder || isCommunityOwner) && transaction.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproval(transaction._id, 'approve')}
                            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            title="Approve transaction"
                          >
                            <SafeIcon icon={FiCheck} />
                          </button>
                          <button
                            onClick={() => handleApproval(transaction._id, 'reject')}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Reject transaction"
                          >
                            <SafeIcon icon={FiX} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {safeTransactions.length > 20 && (
                  <div className="text-center py-4">
                    <p className="text-sm" style={{ color: theme.textSecondary }}>Showing 20 of {safeTransactions.length} transactions</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <SafeIcon icon={FiTrendingUp} className="w-12 h-12 mx-auto mb-3" style={{ color: theme.textSecondary }} />
                <p style={{ color: theme.textSecondary }}>No transactions yet</p>
                <p className="text-sm" style={{ color: theme.textSecondary }}>Transaction history will appear here once employees start sending points.</p>
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
          <div
            className="border rounded-xl p-6"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <SafeIcon icon={FiBarChart} className="w-6 h-6" style={{ color: theme.primary }} />
              <h2 className="text-lg font-semibold" style={{ color: theme.text }}>System Analytics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: theme.surfaceLight,
                  borderColor: theme.border,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: theme.textSecondary }}>Total Points Transferred</span>
                  <SafeIcon icon={FiActivity} className="w-4 h-4" style={{ color: theme.textSecondary }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: theme.text }}>{totalPointsTransferred}</div>
                <div className="text-xs mt-1" style={{ color: theme.textSecondary }}>Across all transactions</div>
              </div>

              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: theme.surfaceLight,
                  borderColor: theme.border,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: theme.textSecondary }}>Average Points per Transaction</span>
                  <SafeIcon icon={FiTarget} className="w-4 h-4" style={{ color: theme.textSecondary }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: theme.text }}>
                  {approvedTransactions.length > 0 ? Math.round(totalPointsTransferred / approvedTransactions.length) : 0}
                </div>
                <div className="text-xs mt-1" style={{ color: theme.textSecondary }}>Based on approved transactions</div>
              </div>

              <div
                className="rounded-lg p-4"
                style={{
                  backgroundColor: theme.surfaceLight,
                  borderColor: theme.border,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm" style={{ color: theme.textSecondary }}>Engagement Rate</span>
                  <SafeIcon icon={FiUsers} className="w-4 h-4" style={{ color: theme.textSecondary }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: theme.text }}>
                  {totalEmployees > 0 ? Math.round((eligibleEmployees / totalEmployees) * 100) : 0}%
                </div>
                <div className="text-xs mt-1" style={{ color: theme.textSecondary }}>Eligible employees this sprint</div>
              </div>
            </div>
          </div>

          {/* Transaction Status Breakdown */}
          <div
            className="border rounded-xl p-6"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.text }}>Transaction Status Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="border rounded-lg p-4"
                style={{
                  backgroundColor: `${theme.success}15`,
                  borderColor: `${theme.success}30`,
                }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiCheck} className="w-5 h-5" style={{ color: theme.success }} />
                  <span className="font-medium" style={{ color: theme.success }}>Approved</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: theme.text }}>{approvedTransactions.length}</div>
                <div className="text-sm" style={{ color: theme.textSecondary }}>
                  {totalPointsTransferred} points transferred
                </div>
              </div>

              <div
                className="border rounded-lg p-4"
                style={{
                  backgroundColor: `${theme.warning}15`,
                  borderColor: `${theme.warning}30`,
                }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiClock} className="w-5 h-5" style={{ color: theme.warning }} />
                  <span className="font-medium" style={{ color: theme.warning }}>Pending</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: theme.text }}>{pendingTransactions.length}</div>
                <div className="text-sm" style={{ color: theme.textSecondary }}>
                  {pendingTransactions.reduce((sum, t) => sum + (t?.points || 0), 0)} points pending
                </div>
              </div>

              <div
                className="border rounded-lg p-4"
                style={{
                  backgroundColor: `${theme.error}15`,
                  borderColor: `${theme.error}30`,
                }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <SafeIcon icon={FiX} className="w-5 h-5" style={{ color: theme.error }} />
                  <span className="font-medium" style={{ color: theme.error }}>Rejected</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: theme.text }}>
                  {safeTransactions.filter(t => t && t.status === 'rejected').length}
                </div>
                <div className="text-sm" style={{ color: theme.textSecondary }}>
                  {safeTransactions.filter(t => t && t.status === 'rejected').reduce((sum, t) => sum + (t?.points || 0), 0)} points rejected
                </div>
              </div>
            </div>
          </div>

          {/* Employee Performance Overview */}
          <div
            className="border rounded-xl p-6"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.text }}>Employee Performance Overview</h3>
            <div className="space-y-4">
              {safeEmployees.filter(e => e && e.role === 'employee').slice(0, 5).map((employee, index) => (
                <div
                  key={employee._id || index}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{
                    backgroundColor: theme.surfaceLight,
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.surface }}
                    >
                      {employee.avatar ? (
                        <img src={employee.avatar} alt={employee.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="font-medium text-sm" style={{ color: theme.text }}>{employee.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium" style={{ color: theme.text }}>{employee.name || 'Unknown'}</p>
                      <p className="text-xs" style={{ color: theme.textSecondary }}>Sprint Points: {employee.sprintPoints || 0}/12</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium" style={{ color: theme.text }}>{employee.rewardPoints || 0} points</div>
                    <div
                      className="text-xs"
                      style={{ color: employee.isEligible ? theme.success : theme.textSecondary }}
                    >
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

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative border rounded-2xl p-8 max-w-md w-full shadow-2xl"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: theme.primary, color: theme.background }}
                  >
                    <FiUsers className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: theme.text }}>
                      Invite Member
                    </h2>
                    <p className="text-sm" style={{ color: theme.textSecondary }}>Add someone to your community</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-2 rounded-lg transition-all"
                  style={{ color: theme.textSecondary }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.surfaceLight;
                    e.currentTarget.style.color = theme.text;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = theme.textSecondary;
                  }}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-6">
                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{
                      backgroundColor: theme.surfaceLight,
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                    placeholder="user@example.com"
                  />
                </div>

                {/* Role Select */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
                    Role
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all appearance-none cursor-pointer"
                    style={{
                      backgroundColor: theme.surfaceLight,
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                  >
                    <option value="member" style={{ backgroundColor: theme.surface }}>👤 Member</option>
                    <option value="admin" style={{ backgroundColor: theme.surface }}>⭐ Admin</option>
                    {isFounder && <option value="owner" style={{ backgroundColor: theme.surface }}>👑 Owner</option>}
                  </select>
                  <p className="mt-2 text-xs" style={{ color: theme.textSecondary }}>
                    {inviteForm.role === 'member' && '• Can send and receive points'}
                    {inviteForm.role === 'admin' && '• Can manage members and view reports'}
                    {inviteForm.role === 'owner' && '• Full control over the community'}
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                  <motion.button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 border rounded-lg font-medium transition-all"
                    style={{
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.surfaceLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg"
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.background,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.primaryLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.primary;
                    }}
                  >
                    Send Invite
                  </motion.button>
                </div>
              </form>

              {/* Info */}
              <div
                className="mt-6 pt-6 border-t"
                style={{ borderColor: theme.border }}
              >
                <p className="text-xs text-center" style={{ color: theme.textSecondary }}>
                  🔒 An invitation email will be sent to the provided address
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;