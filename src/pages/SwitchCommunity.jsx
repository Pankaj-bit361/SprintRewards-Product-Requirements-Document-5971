import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '@/common/SafeIcon';
import api from '@/api/axiosConfig.js';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';

const { FiCheck, FiUsers, FiRefreshCw, FiArrowLeft, FiPlusCircle } = FiIcons;

const SwitchCommunity = () => {
  const { user, switchCommunity } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Fetch user's communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        const response = await api.get('/communities');
        setCommunities(response.data.communities || []);
      } catch (error) {
        console.error('Failed to fetch communities:', error);
        toast.error('Failed to load communities');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCommunities();
    }
  }, [user]);

  const handleSwitchCommunity = async (communityId) => {
    if (communityId === user?.currentCommunityId) {
      toast.success('Already in this community');
      return;
    }

    try {
      setSwitching(true);
      const result = await switchCommunity(communityId);
      
      if (result.success) {
        toast.success('Community switched successfully!');
        
        // Reload the page to refresh all data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(result.message || 'Failed to switch community');
      }
    } catch (error) {
      console.error('Error switching community:', error);
      toast.error('Failed to switch community');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: theme.background }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 transition-colors"
              style={{ color: theme.textSecondary }}
              onMouseEnter={(e) => e.currentTarget.style.color = theme.primary}
              onMouseLeave={(e) => e.currentTarget.style.color = theme.textSecondary}
            >
              <SafeIcon icon={FiArrowLeft} className="w-5 h-5" />
              <span>Back</span>
            </button>
            <button
              onClick={() => navigate('/create-community')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: theme.primary, color: theme.background }}
            >
              <SafeIcon icon={FiPlusCircle} className="w-5 h-5" />
              <span>Create Community</span>
            </button>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.text }}>
            Switch Community
          </h1>
          <p style={{ color: theme.textSecondary }}>
            Select a community to switch to
          </p>
        </div>

        {/* Communities List */}
        <div
          className="border rounded-2xl p-6"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <SafeIcon icon={FiRefreshCw} className="w-12 h-12 mb-4 animate-spin" style={{ color: theme.primary }} />
              <p style={{ color: theme.textSecondary }}>Loading communities...</p>
            </div>
          ) : communities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <SafeIcon icon={FiUsers} className="w-12 h-12 mb-4" style={{ color: theme.textSecondary }} />
              <p style={{ color: theme.textSecondary }}>No communities found</p>
              <button
                onClick={() => navigate('/create-community')}
                className="mt-4 px-4 py-2 rounded-lg font-medium"
                style={{ backgroundColor: theme.primary, color: theme.background }}
              >
                Create Community
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {communities.map((community) => {
                const isActive = community.communityId?._id === user?.currentCommunityId || 
                                community.communityId === user?.currentCommunityId;
                const communityName = community.communityId?.name || 'Unknown Community';
                const communityRole = community.role || 'member';

                return (
                  <motion.button
                    key={community.communityId?._id || community.communityId}
                    onClick={() => handleSwitchCommunity(community.communityId?._id || community.communityId)}
                    disabled={switching || isActive}
                    whileHover={!isActive ? { scale: 1.02 } : {}}
                    whileTap={!isActive ? { scale: 0.98 } : {}}
                    className="w-full flex items-center justify-between p-4 rounded-xl transition-all border-2"
                    style={{
                      backgroundColor: isActive ? theme.primaryLight : theme.surfaceLight,
                      borderColor: isActive ? theme.primary : theme.border,
                      color: isActive ? theme.background : theme.text,
                      cursor: switching || isActive ? 'not-allowed' : 'pointer',
                      opacity: switching && !isActive ? 0.5 : 1,
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      {community.communityId?.image ? (
                        <img
                          src={community.communityId.image}
                          alt="Community"
                          className="w-12 h-12 rounded-full object-cover border"
                          style={{ borderColor: isActive ? theme.primary : theme.border }}
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: isActive ? theme.background : theme.surface,
                            color: isActive ? theme.primary : theme.text,
                          }}
                        >
                          <SafeIcon icon={FiUsers} className="w-6 h-6" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-semibold text-lg">{communityName}</p>
                        <p
                          className="text-sm capitalize"
                          style={{
                            color: isActive ? theme.background : theme.textSecondary,
                            opacity: 0.8,
                          }}
                        >
                          {communityRole}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center space-x-2"
                      >
                        <SafeIcon icon={FiCheck} className="w-6 h-6" />
                        <span className="font-medium">Active</span>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SwitchCommunity;

