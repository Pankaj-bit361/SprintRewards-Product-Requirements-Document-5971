import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import SafeIcon from '@/common/SafeIcon';
import api from '@/api/axiosConfig.js';
import * as FiIcons from 'react-icons/fi';

const { FiSend, FiGift, FiArrowRight, FiArrowLeft, FiClock, FiCheck, FiX } = FiIcons;

const Transactions = () => {
  const { user, updateUser, isFounder } = useAuth();
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
      const [transactionsRes, usersRes] = await Promise.all([
        api.get('/transactions/history'),
        isFounder ? api.get('/users') : Promise.resolve({ data: [] }) // Only fetch all users if founder
      ]);
      setTransactions(transactionsRes.data.transactions);
      if (isFounder) {
        setEmployees(usersRes.data.filter(u => u.role === 'employee'));
      } else {
        // Fetch employees for sending points if not founder
        const allUsers = await api.get('/users/leaderboard'); // a way to get users without being admin
        setEmployees(allUsers.data.topGivers.concat(allUsers.data.topReceivers).filter((u, i, self) => i === self.findIndex(t => t._id === u._id) && u._id !== user._id));
      }
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
    if (!isFounder && pointsToSend > user.rewardPoints) {
      toast.error('Insufficient reward points');
      return;
    }
    try {
      const { data } = await api.post('/transactions/send', { ...sendForm, points: pointsToSend });
      toast.success(data.message);

      if (data.transaction.status !== 'pending' && !isFounder) {
        updateUser({
          rewardPoints: user.rewardPoints - pointsToSend,
          totalGiven: user.totalGiven + pointsToSend
        });
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
          <h1 className="text-4xl font-bold text-white mb-2">Transactions</h1>
          <p className="text-gray-400">Send points and view your transaction history</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowSendModal(true)} className="flex items-center px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all shadow-lg" >
          <SafeIcon icon={FiSend} className="w-5 h-5 mr-2" /> Send Points
        </motion.button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-white mb-8" >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-white">{isFounder ? 'Unlimited' : `${user?.rewardPoints} Points`}</p>
          </div>
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center"><SafeIcon icon={FiGift} className="w-8 h-8 text-white" /></div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900 border border-gray-800 rounded-xl" >
        <div className="p-6 border-b border-gray-800"><h2 className="text-lg font-semibold text-white">Transaction History</h2></div>
        <div className="p-6">
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction, index) => {
                const isSent = transaction.fromUserId._id === user._id;
                const otherUser = isSent ? transaction.toUserId : transaction.fromUserId;
                const statusInfo = getStatusInfo(transaction.status);
                return (
                  <motion.div key={transaction._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center justify-between p-4 border border-gray-800 rounded-lg hover:bg-gray-800 transition-all" >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSent ? 'bg-gray-700' : 'bg-gray-700'}`}><SafeIcon icon={isSent ? FiArrowRight : FiArrowLeft} className={`w-6 h-6 text-white`} /></div>
                      <div>
                        <p className="font-medium text-white">{isSent ? 'Sent to' : 'Received from'} {otherUser?.name || 'a user'}</p>
                        <p className="text-sm text-gray-500">{new Date(transaction.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {transaction.message && (<p className="text-sm text-gray-400 italic mt-1">"{transaction.message}"</p>)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${isSent ? 'text-gray-400' : 'text-white'}`}>{isSent ? '-' : '+'}{transaction.points}</span>
                      <div className={`flex items-center justify-end mt-1 text-sm font-medium ${statusInfo.color}`}>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Send Points</h3>
            <form onSubmit={handleSendPoints} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-300 mb-2">Recipient</label><select value={sendForm.toUserId} onChange={(e) => setSendForm({ ...sendForm, toUserId: e.target.value })} className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent" required ><option value="">Select an employee</option>{employees.map(employee => (<option key={employee._id} value={employee._id}>{employee.name}</option>))}</select></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-2">Points (Available: {isFounder ? 'Unlimited' : user?.rewardPoints})</label><input type="number" min="1" max={isFounder ? undefined : user?.rewardPoints} value={sendForm.points} onChange={(e) => setSendForm({ ...sendForm, points: e.target.value })} className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent" placeholder="Enter points to send" required /></div>
              <div><label className="block text-sm font-medium text-gray-300 mb-2">Message (Optional)</label><textarea value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-white focus:border-transparent" placeholder="Add a note..." rows="3" /></div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowSendModal(false)} className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-all">Send Points</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Transactions;