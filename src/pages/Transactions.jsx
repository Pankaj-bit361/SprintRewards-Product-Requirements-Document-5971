import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import SafeIcon from '@/common/SafeIcon';
import api from '@/api/axiosConfig.js';
import * as FiIcons from 'react-icons/fi';

const { FiSend, FiGift, FiArrowRight, FiArrowLeft, FiClock, FiCheck, FiX } = FiIcons;

const Transactions = () => {
  const { user, isFounder, isCommunityOwner, communityPoints } = useAuth();
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({ toUserId: '', points: '', message: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!user?.currentCommunityId) {
        toast.error('No community selected');
        setLoading(false);
        return;
      }

      const [transactionsRes, membersRes] = await Promise.all([
        api.get('/transactions/history'),
        api.get(`/communities/${user.currentCommunityId}/members`)
      ]);

      setTransactions(transactionsRes.data.transactions);
      setEmployees(membersRes.data);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Could not load transaction data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendPoints = async (e) => {
    e.preventDefault();
    const pointsToSend = parseInt(sendForm.points);
    const currentBalance = communityPoints?.rewardPoints || 0;

    if (!isFounder && !isCommunityOwner && pointsToSend > currentBalance) {
      toast.error(`Insufficient reward points. You have ${currentBalance} points in this community.`);
      return;
    }
    try {
      const { data } = await api.post('/transactions/send', { ...sendForm, points: pointsToSend });
      toast.success(data.message);

      // Refresh user data to get updated community-specific points
      if (data.transaction.status !== 'pending') {
        // Reload page to refresh all data including community points
        window.location.reload();
      }

      setSendForm({ toUserId: '', points: '', message: '' });
      setShowSendModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send points');
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { icon: FiClock, color: 'text-yellow-400', label: 'Pending' };
      case 'approved': return { icon: FiCheck, color: 'text-green-400', label: 'Approved' };
      case 'rejected': return { icon: FiX, color: 'text-red-400', label: 'Rejected' };
      default: return { icon: FiCheck, color: 'text-green-400', label: 'Approved' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.text }}>Transactions</h1>
          <p style={{ color: theme.textSecondary }}>Send points and view your transaction history</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowSendModal(true)}
          style={{
            backgroundColor: theme.primary,
            color: theme.background,
          }}
          className="flex items-center px-6 py-3 rounded-lg font-medium transition-all shadow-lg"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.primaryLight;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.primary;
          }}
        >
          <SafeIcon icon={FiSend} className="w-5 h-5 mr-2" /> Send Points
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border rounded-xl p-6 mb-8"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1" style={{ color: theme.textSecondary }}>Available Balance (This Community)</p>
            <p className="text-3xl font-bold" style={{ color: theme.primary }}>{isFounder || isCommunityOwner ? 'Unlimited' : `${communityPoints?.rewardPoints || 0} Points`}</p>
          </div>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.primaryLight, color: theme.background }}
          >
            <SafeIcon icon={FiGift} className="w-8 h-8" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border rounded-xl"
        style={{
          backgroundColor: theme.surface,
          borderColor: theme.border,
        }}
      >
        <div
          className="p-6 border-b"
          style={{ borderColor: theme.border }}
        >
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>Transaction History</h2>
        </div>
        <div className="p-6">
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction, index) => {
                const isSent = transaction.fromUserId._id === user._id;
                const otherUser = isSent ? transaction.toUserId : transaction.fromUserId;
                const statusInfo = getStatusInfo(transaction.status);
                return (
                  <motion.div
                    key={transaction._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border rounded-lg transition-all"
                    style={{
                      borderColor: theme.border,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.surfaceLight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: isSent ? theme.primaryLight : theme.accentLight,
                          color: theme.background,
                        }}
                      >
                        <SafeIcon icon={isSent ? FiArrowRight : FiArrowLeft} className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: theme.text }}>{isSent ? 'Sent to' : 'Received from'} {otherUser?.name || 'a user'}</p>
                        <p className="text-sm" style={{ color: theme.textSecondary }}>{new Date(transaction.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {transaction.message && (<p className="text-sm italic mt-1" style={{ color: theme.textSecondary }}>"{transaction.message}"</p>)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-lg font-bold"
                        style={{
                          color: isSent ? theme.textSecondary : theme.success,
                        }}
                      >
                        {isSent ? '-' : '+'}{transaction.points}
                      </span>
                      <div className="flex items-center justify-end mt-1 text-sm font-medium" style={{ color: statusInfo.color }}>
                        <SafeIcon icon={statusInfo.icon} className="w-4 h-4 mr-1" />
                        <span>{statusInfo.label}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <SafeIcon icon={FiGift} className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No transactions yet</p>
              <p className="text-gray-600 text-sm">Start sending points to build your transaction history!</p>
            </div>
          )}
        </div>
      </motion.div>

      {showSendModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border rounded-xl max-w-md w-full p-6"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: theme.text }}>Send Points</h3>
            <form onSubmit={handleSendPoints} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Recipient</label>
                <select
                  value={sendForm.toUserId}
                  onChange={(e) => setSendForm({ ...sendForm, toUserId: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceLight,
                    color: theme.text,
                    focusRingColor: theme.primary,
                  }}
                  required
                >
                  <option value="">Select an employee</option>
                  {employees.map(employee => (<option key={employee._id} value={employee._id}>{employee.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Points (Available: {isFounder || isCommunityOwner ? 'Unlimited' : communityPoints?.rewardPoints || 0})</label>
                <input
                  type="number"
                  min="1"
                  max={isFounder || isCommunityOwner ? undefined : communityPoints?.rewardPoints || 0}
                  value={sendForm.points}
                  onChange={(e) => setSendForm({ ...sendForm, points: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceLight,
                    color: theme.text,
                  }}
                  placeholder="Enter points to send"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Message (Optional)</label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceLight,
                    color: theme.text,
                  }}
                  placeholder="Add a note..."
                  rows="3"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSendModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg transition-colors"
                  style={{
                    borderColor: theme.border,
                    color: theme.textSecondary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.surfaceLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg transition-all"
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
                  Send Points
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Transactions;