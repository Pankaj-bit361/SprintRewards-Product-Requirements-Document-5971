import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SafeIcon from '@/common/SafeIcon';
import api from '@/api/axiosConfig.js';
import { useAuth } from '@/contexts/AuthContext';
import * as FiIcons from 'react-icons/fi';

const {
  FiUsers,
  FiUserPlus,
  FiMail,
  FiShield,
  FiUser,
  FiCrown,
  FiRefreshCw,
  FiTrendingUp,
  FiAward,
  FiCalendar,
  FiX
} = FiIcons;

const CommunityAdmin = () => {
  const { user, currentCommunityRole, isCommunityOwner } = useAuth();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, [user?.currentCommunityId]);

  const fetchCommunityData = async () => {
    if (!user?.currentCommunityId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/communities/${user.currentCommunityId}`);
      setCommunity(response.data);
    } catch (error) {
      console.error('Failed to fetch community:', error);
      toast.error('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    // Only owner can invite as admin
    if (inviteRole === 'admin' && !isCommunityOwner) {
      toast.error('Only community owner can invite admins');
      return;
    }

    try {
      setInviting(true);
      const response = await api.post(`/communities/${user.currentCommunityId}/invite`, {
        email: inviteEmail,
        role: inviteRole
      });

      // Check if user exists or invitation was sent
      if (response.data.userExists) {
        toast.success(`User added to community as ${inviteRole} successfully!`);
      } else {
        toast.success(`Invitation email sent to ${inviteEmail} as ${inviteRole}!`, {
          duration: 5000
        });
      }

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      fetchCommunityData();
    } catch (error) {
      console.error('Failed to invite user:', error);
      toast.error(error.response?.data?.message || 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SafeIcon icon={FiRefreshCw} className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Community not found</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Members',
      value: community.members?.length || 0,
      icon: FiUsers,
      color: 'text-blue-500'
    },
    {
      label: 'Admins',
      value: community.admins?.length || 0,
      icon: FiShield,
      color: 'text-purple-500'
    },
    {
      label: 'Points Per Sprint',
      value: community.settings?.rewardPointsPerSprint || 500,
      icon: FiAward,
      color: 'text-yellow-500'
    },
    {
      label: 'Active Sprint',
      value: 'Week ' + (new Date().getWeek() || 1),
      icon: FiCalendar,
      color: 'text-green-500'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {community.image ? (
              <img src={community.image} alt="Community" className="w-12 h-12 rounded-full object-cover border border-gray-800" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-800 flex items-center justify-center">
                <SafeIcon icon={FiUsers} className="w-6 h-6 text-gray-300" />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                Community Admin
              </h1>
              <p className="text-gray-400 mt-2">{community.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg hover:opacity-90 transition-all"
          >
            <SafeIcon icon={FiUserPlus} className="w-5 h-5" />
            <span>Invite User</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900 rounded-lg p-6 border border-gray-800"
            >
              <div className="flex items-center justify-between mb-4">
                <SafeIcon icon={stat.icon} className={`w-8 h-8 ${stat.color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Members List */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <SafeIcon icon={FiUsers} className="w-6 h-6" />
              <span>Community Members</span>
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {community.members?.map((member, index) => (
                  <motion.tr
                    key={member.userId?._id || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {member.userId?.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{member.userId?.name || 'Unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-gray-400">{member.userId?.email || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                        member.role === 'owner' 
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : member.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-500'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        <SafeIcon 
                          icon={member.role === 'owner' ? FiCrown : member.role === 'admin' ? FiShield : FiUser} 
                          className="w-3 h-3" 
                        />
                        <span className="capitalize">{member.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg border border-gray-800 max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Invite User</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <SafeIcon icon={FiX} className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <SafeIcon icon={FiMail} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="member">Member</option>
                  {isCommunityOwner && <option value="admin">Admin</option>}
                </select>
                {!isCommunityOwner && (
                  <p className="text-xs text-gray-500 mt-2">
                    Only community owner can invite admins
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={inviting}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviting ? 'Inviting...' : 'Send Invitation'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Helper to get week number
Date.prototype.getWeek = function() {
  const onejan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
};

export default CommunityAdmin;

