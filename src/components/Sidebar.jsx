import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import SafeIcon from '@/common/SafeIcon';
import ThemeSwitcher from './ThemeSwitcher';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiLogOut, FiMenu, FiX, FiTrendingUp, FiUsers, FiSettings, FiHome } = FiIcons;

const Sidebar = () => {
  const { user, logout, isFounder, isCommunityOwner } = useAuth();
  const { theme } = useTheme();
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
    navigate('/');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: FiHome },
    { path: '/leaderboard', label: 'Leaderboard', icon: FiUsers },
    { path: '/transactions', label: 'Transactions', icon: FiTrendingUp },
    ...(isFounder || isCommunityOwner ? [{ path: '/admin', label: 'Admin Panel', icon: FiSettings }] : []),
  ];

  return (
    <>
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
        style={{
          backgroundColor: theme.surface,
          borderRightColor: theme.border,
          borderRightWidth: '1px',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: theme.border }}
        >
          {!isCollapsed && (
            <Link to="/" className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: theme.primary,
                  color: theme.background,
                }}
              >
                <span className="font-bold text-sm">BR</span>
              </div>
              <span className="font-bold text-xl" style={{ color: theme.text }}>
                Bravo
              </span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 transition-colors rounded-lg"
            style={{
              color: theme.textSecondary,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.primaryLight;
              e.target.style.color = theme.background;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = theme.textSecondary;
            }}
          >
            <SafeIcon icon={isCollapsed ? FiMenu : FiX} className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Takes up remaining space */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group relative"
                style={{
                  color:
                    location.pathname === item.path
                      ? theme.text
                      : theme.textSecondary,
                  backgroundColor:
                    location.pathname === item.path
                      ? theme.primaryLight
                      : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.backgroundColor = theme.primaryLight;
                    e.currentTarget.style.color = theme.background;
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = theme.textSecondary;
                  }
                }}
              >
                <SafeIcon icon={item.icon} className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
                {isCollapsed && (
                  <div
                    className="absolute left-16 px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.text,
                    }}
                  >
                    {item.label}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Section - Fixed at bottom */}
        <div
          className="border-t p-4"
          style={{ borderColor: theme.border }}
        >
          {!isCollapsed ? (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border"
                  style={{
                    backgroundColor: theme.primaryLight,
                    borderColor: theme.border,
                    color: theme.background,
                  }}
                >
                  <SafeIcon icon={FiUser} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: theme.text }}>
                    {user?.name}
                  </p>
                  <p
                    className="text-xs capitalize"
                    style={{ color: theme.textSecondary }}
                  >
                    {user?.role}
                  </p>
                </div>
              </div>

              {/* Switch Community Button */}
              <Link
                to="/switch-community"
                className="flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition-all"
                style={{
                  color: theme.textSecondary,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.surfaceLight;
                  e.currentTarget.style.color = theme.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = theme.textSecondary;
                }}
              >
                <SafeIcon icon={FiUsers} className="w-4 h-4" />
                <span className="text-sm">Switch Community</span>
              </Link>

              {/* Theme Switcher */}
              <div className="flex justify-center">
                <ThemeSwitcher />
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full px-3 py-2 text-left rounded-lg transition-all"
                style={{
                  color: theme.textSecondary,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.primaryLight;
                  e.currentTarget.style.color = theme.background;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = theme.textSecondary;
                }}
              >
                <SafeIcon icon={FiLogOut} className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Collapsed User Avatar */}
              <div className="flex justify-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border group relative"
                  style={{
                    backgroundColor: theme.primaryLight,
                    borderColor: theme.border,
                    color: theme.background,
                  }}
                >
                  <SafeIcon icon={FiUser} className="w-5 h-5" />
                  <div
                    className="absolute left-12 px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
                    style={{
                      backgroundColor: theme.primary,
                      color: theme.text,
                    }}
                  >
                    {user?.name}
                  </div>
                </div>
              </div>

              {/* Switch Community Button - Collapsed */}
              <Link
                to="/switch-community"
                className="w-full p-2 rounded-lg transition-all group relative flex justify-center"
                style={{
                  color: theme.textSecondary,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.surfaceLight;
                  e.currentTarget.style.color = theme.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = theme.textSecondary;
                }}
              >
                <SafeIcon icon={FiUsers} className="w-4 h-4" />
                <div
                  className="absolute left-12 px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap top-1/2 transform -translate-y-1/2 z-50"
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.text,
                  }}
                >
                  Switch Community
                </div>
              </Link>

              {/* Theme Switcher - Collapsed */}
              <div className="flex justify-center">
                <ThemeSwitcher />
              </div>

              {/* Collapsed Logout */}
              <button
                onClick={handleLogout}
                className="w-full p-2 rounded-lg transition-all group relative"
                style={{
                  color: theme.textSecondary,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.primaryLight;
                  e.currentTarget.style.color = theme.background;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = theme.textSecondary;
                }}
              >
                <SafeIcon icon={FiLogOut} className="w-4 h-4 mx-auto" />
                <div
                  className="absolute left-12 px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap top-1/2 transform -translate-y-1/2 z-50"
                  style={{
                    backgroundColor: theme.primary,
                    color: theme.text,
                  }}
                >
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