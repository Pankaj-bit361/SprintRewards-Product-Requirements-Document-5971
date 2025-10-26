import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import SafeIcon from '@/common/SafeIcon';
import api from '@/api/axiosConfig.js';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';

const { FiChevronDown, FiCheck, FiUsers, FiRefreshCw, FiPlusCircle } = FiIcons;

const CommunitySwitcher = ({ isCollapsed }) => {
  const { user, switchCommunity } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchCommunity = async (communityId) => {
    if (communityId === user?.currentCommunityId) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(true);
      const result = await switchCommunity(communityId);

      if (result.success) {
        toast.success('Community switched successfully!');
        setIsOpen(false);

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

  // Get current community
  const currentCommunity = communities.find(
    c => c.communityId?._id === user?.currentCommunityId || c.communityId === user?.currentCommunityId
  );

  const currentCommunityName = currentCommunity?.communityId?.name || 'No Community';
  const currentCommunityRole = currentCommunity?.role || 'member';

  if (isCollapsed) {
    return (
      <div className="relative group" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all relative"
        >
          <SafeIcon icon={FiUsers} className="w-5 h-5 mx-auto" />

          {/* Tooltip */}
          <div className="absolute left-12 bg-gray-800 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap top-1/2 transform -translate-y-1/2 z-50">
            {currentCommunityName}
          </div>
        </button>

        {/* Dropdown for collapsed sidebar */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-full ml-2 top-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-w-[200px] z-50"
            >
              <div className="p-2 border-b border-gray-700">
                <p className="text-xs text-gray-400 px-2">Switch Community</p>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <SafeIcon icon={FiRefreshCw} className="w-4 h-4 text-gray-400 animate-spin" />
                  </div>
                ) : communities.length === 0 ? (
                  <p className="text-xs text-gray-500 px-2 py-2">No communities</p>
                ) : (
                  communities.map((community) => {
                    const isActive = community.communityId?._id === user?.currentCommunityId ||
                                    community.communityId === user?.currentCommunityId;
                    return (
                      <button
                        key={community.communityId?._id || community.communityId}
                        onClick={() => handleSwitchCommunity(community.communityId?._id || community.communityId)}
                        disabled={switching}
                        className={`w-full flex items-center justify-between px-2 py-2 rounded-md text-sm transition-all ${
                          isActive
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {community.communityId?.image ? (
                            <img src={community.communityId.image} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center flex-shrink-0">
                              <SafeIcon icon={FiUsers} className="w-3 h-3" />
                            </div>
                          )}
                          <div className="text-left min-w-0">
                            <p className="font-medium truncate">{community.communityId?.name || 'Unknown'}</p>
                            <p className="text-xs opacity-75 capitalize">{community.role}</p>
                          </div>
                        </div>
                        {isActive && <SafeIcon icon={FiCheck} className="w-4 h-4 ml-2 flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="p-2 border-t border-gray-700">
                <button
                  onClick={() => { setIsOpen(false); navigate('/create-community'); }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                >
                  <SafeIcon icon={FiPlusCircle} className="w-4 h-4" />
                  <span>Create Community</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all group"
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <SafeIcon icon={FiUsers} className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Community</p>
            <p className="text-sm font-medium text-white truncate">{currentCommunityName}</p>
          </div>
        </div>
        <SafeIcon
          icon={FiChevronDown}
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-2 left-0 right-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50"
          >
            <div className="p-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 px-2">Switch Community</p>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <SafeIcon icon={FiRefreshCw} className="w-4 h-4 text-gray-400 animate-spin" />
                </div>
              ) : communities.length === 0 ? (
                <p className="text-xs text-gray-500 px-2 py-2">No communities</p>
              ) : (
                communities.map((community) => {
                  const isActive = community.communityId?._id === user?.currentCommunityId ||
                                  community.communityId === user?.currentCommunityId;
                  return (
                    <button
                      key={community.communityId?._id || community.communityId}
                      onClick={() => handleSwitchCommunity(community.communityId?._id || community.communityId)}
                      disabled={switching}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      } ${switching ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {community.communityId?.image ? (
                          <img src={community.communityId.image} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center flex-shrink-0">
                            <SafeIcon icon={FiUsers} className="w-3 h-3" />
                          </div>
                        )}
                        <div className="text-left min-w-0">
                          <p className="font-medium truncate">{community.communityId?.name || 'Unknown'}</p>
                          <p className="text-xs opacity-75 capitalize">{community.role}</p>
                        </div>
                      </div>
                      {isActive && <SafeIcon icon={FiCheck} className="w-4 h-4 ml-2 flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
            <div className="p-2 border-t border-gray-700">
              <button
                onClick={() => { setIsOpen(false); navigate('/create-community'); }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm bg-purple-600 text-white hover:bg-purple-500 transition-colors"
              >
                <SafeIcon icon={FiPlusCircle} className="w-4 h-4" />
                <span>Create Community</span>
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunitySwitcher;
