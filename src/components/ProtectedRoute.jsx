import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({
  children,
  requireFounder = false,
  requireCommunityOwner = false,
  requireCommunityAdmin = false
}) => {
  const { user, loading, currentCommunityRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check global founder role
  if (requireFounder && user.role !== 'founder') {
    return <Navigate to="/" replace />;
  }

  // Check community owner role (founders are also allowed)
  if (requireCommunityOwner && user.role !== 'founder' && currentCommunityRole !== 'owner') {
    return <Navigate to="/" replace />;
  }

  // Check community admin role (owner or admin, founders also allowed)
  if (requireCommunityAdmin && user.role !== 'founder' && !['owner', 'admin'].includes(currentCommunityRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;