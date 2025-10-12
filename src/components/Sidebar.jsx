import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import SafeIcon from '@/common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiLogOut, FiMenu, FiX, FiTrendingUp, FiUsers, FiSettings, FiList, FiHome } = FiIcons;

const Sidebar = () => {
  const { user, logout, isFounder } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update CSS custom property when sidebar state changes
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '256px');
    
    // Add/remove classes to body for CSS targeting
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
      document.body.classList.remove('sidebar-expanded');
    } else {
      document.body.classList.add('sidebar-expanded');
      document.body.classList.remove('sidebar-collapsed');
    }
    
    return () => {
      document.body.classList.remove('sidebar-collapsed', 'sidebar-expanded');
    };
  }, [isCollapsed]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/tasks', label: 'Tasks', icon: FiList },
    { path: '/leaderboard', label: 'Leaderboard', icon: FiUsers },
    { path: '/transactions', label: 'Transactions', icon: FiTrendingUp },
    ...(isFounder ? [{ path: '/admin', label: 'Admin Panel', icon: FiSettings }] : []),
  ];

  return (
    <>
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed left-0 top-0 h-full bg-gray-900 border-r border-gray-800 z-50 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          {!isCollapsed && (
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">SR</span>
              </div>
              <span className="font-bold text-xl text-white">SprintRewards</span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
          >
            <SafeIcon icon={isCollapsed ? FiMenu : FiX} className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group relative ${
                  location.pathname === item.path
                    ? 'text-white bg-gray-800 shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <SafeIcon icon={item.icon} className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
                {isCollapsed && (
                  <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-800 p-4">
          {!isCollapsed ? (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                  <SafeIcon icon={FiUser} className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Points Display */}
              <div className="bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Sprint Points</span>
                  <span className="text-sm font-bold text-white">{user?.sprintPoints || 0}/12</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div 
                    className="bg-white h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${((user?.sprintPoints || 0) / 12) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Reward Points</span>
                  <span className="text-sm font-bold text-white">
                    {isFounder ? '∞' : user?.rewardPoints || 0}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full px-3 py-2 text-left text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              >
                <SafeIcon icon={FiLogOut} className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Collapsed User Avatar */}
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 group relative">
                  <SafeIcon icon={FiUser} className="w-5 h-5 text-white" />
                  <div className="absolute left-12 bg-gray-800 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {user?.name}
                  </div>
                </div>
              </div>

              {/* Collapsed Points */}
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">SP</div>
                <div className="text-sm font-bold text-white">{user?.sprintPoints || 0}</div>
              </div>

              {/* Collapsed Logout */}
              <button
                onClick={handleLogout}
                className="w-full p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all group relative"
              >
                <SafeIcon icon={FiLogOut} className="w-4 h-4 mx-auto" />
                <div className="absolute left-12 bg-gray-800 text-white px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap top-1/2 transform -translate-y-1/2 z-50">
                  Logout
                </div>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content Spacer - this pushes content to the right */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0`}></div>
    </>
  );
};

export default Sidebar;