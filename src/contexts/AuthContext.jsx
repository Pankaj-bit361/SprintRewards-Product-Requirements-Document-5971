import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/api/axiosConfig.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          const userData = response.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Auth check failed', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  // Direct login with token and user data (for OTP login)
  const loginWithToken = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Switch community
  const switchCommunity = async (communityId) => {
    try {
      const response = await api.post(`/communities/${communityId}/set-current`);

      // Update user's currentCommunityId
      const updatedUser = { ...user, currentCommunityId: communityId };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return { success: true };
    } catch (error) {
      console.error('Failed to switch community:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to switch community'
      };
    }
  };

  // Get current community role
  const getCurrentCommunityRole = () => {
    if (!user || !user.currentCommunityId) return null;
    const community = user.communities?.find(c =>
      (c.communityId?._id === user.currentCommunityId) ||
      (c.communityId === user.currentCommunityId)
    );
    return community?.role || null;
  };

  // Get current community data
  const getCurrentCommunity = () => {
    if (!user || !user.currentCommunityId) return null;
    const community = user.communities?.find(c =>
      (c.communityId?._id === user.currentCommunityId) ||
      (c.communityId === user.currentCommunityId)
    );
    return community || null;
  };

  // Get community-specific points
  const getCommunityPoints = () => {
    const community = getCurrentCommunity();
    return {
      rewardPoints: community?.rewardPoints || 0,
      claimablePoints: community?.claimablePoints || 0,
      totalGiven: community?.totalGiven || 0,
      totalReceived: community?.totalReceived || 0
    };
  };

  const currentCommunityRole = getCurrentCommunityRole();
  const isCommunityOwner = currentCommunityRole === 'owner';
  const isCommunityAdmin = currentCommunityRole === 'admin' || currentCommunityRole === 'owner';
  const communityPoints = getCommunityPoints();

  const value = {
    user,
    login,
    loginWithToken,
    logout,
    updateUser,
    switchCommunity,
    loading,
    isAuthenticated: !!user,
    isFounder: user?.role === 'founder',
    currentCommunityRole,
    isCommunityOwner,
    isCommunityAdmin,
    communityPoints,
    getCommunityPoints,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};