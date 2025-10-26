import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Sidebar from './Sidebar';
import FloatingThemeSwitcher from './FloatingThemeSwitcher';
import CurrentCommunityBar from './CurrentCommunityBar';

const DashboardLayout = ({ children }) => {
  const { theme } = useTheme();

  if (!theme) {
    return null; // or a loading spinner
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: theme.background }}
    >
      <Sidebar />
      {/* Dynamic margin that responds to sidebar width */}
      <main className="flex-1 transition-all duration-300 sidebar-expanded:ml-64 sidebar-collapsed:ml-20">
        <div className="p-8">
          {/* <CurrentCommunityBar /> */}
          {children}
        </div>
      </main>
      {/* Floating Theme Switcher */}
      <FloatingThemeSwitcher />
    </div>
  );
};

export default DashboardLayout;