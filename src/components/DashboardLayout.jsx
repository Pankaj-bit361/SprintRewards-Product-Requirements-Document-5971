import React from 'react';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar />
      {/* Dynamic margin that responds to sidebar width */}
      <main className="flex-1 transition-all duration-300 sidebar-expanded:ml-64 sidebar-collapsed:ml-20">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;