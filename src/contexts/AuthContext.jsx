import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Try to get user from localStorage first (offline mode)
          const mockUser = localStorage.getItem('mockUser');
          if (mockUser) {
            const userData = JSON.parse(mockUser);
            setUser(userData);
            setLoading(false);
            return;
          }

          // If no mock user, try API
          const response = await fetch('http://localhost:3001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // API failed, clear token
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          // Network error or API not available
          console.log('API not available, checking offline data...');
          const mockUser = localStorage.getItem('mockUser');
          if (mockUser) {
            setUser(JSON.parse(mockUser));
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      // Try real API first
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        const { token: newToken, user: userData } = data;
        
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        localStorage.removeItem('mockUser'); // Clear mock data on successful login
        
        return { success: true };
      } else {
        // API failed, use mock authentication
        return mockLogin(email, password);
      }
    } catch (error) {
      // Network error or API not available, use mock authentication
      return mockLogin(email, password);
    }
  };

  const mockLogin = async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUsers = {
      'founder@example.com': {
        _id: '1',
        id: '1',
        name: 'John Founder',
        email: 'founder@example.com',
        role: 'founder',
        sprintPoints: 12,
        rewardPoints: 500,
        isEligible: true,
        unlockedThisSprint: false,
        totalGiven: 250,
        totalReceived: 100,
        avatar: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      'employee@example.com': {
        _id: '2',
        id: '2',
        name: 'Jane Employee',
        email: 'employee@example.com',
        role: 'employee',
        sprintPoints: 8,
        rewardPoints: 250,
        isEligible: true,
        unlockedThisSprint: false,
        totalGiven: 100,
        totalReceived: 150,
        avatar: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      'manager@example.com': {
        _id: '3',
        id: '3',
        name: 'Mike Manager',
        email: 'manager@example.com',
        role: 'employee',
        sprintPoints: 10,
        rewardPoints: 350,
        isEligible: true,
        unlockedThisSprint: false,
        totalGiven: 200,
        totalReceived: 180,
        avatar: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    const user = mockUsers[email.toLowerCase()];
    if (user && password === 'password123') {
      // Store mock token and user data
      const mockToken = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('token', mockToken);
      localStorage.setItem('mockUser', JSON.stringify(user));
      setToken(mockToken);
      setUser(user);
      
      return { success: true, user, isOffline: true };
    }
    
    return { success: false, message: 'Invalid email or password' };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('mockUser');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
    // Update stored mock user if in offline mode
    const mockUser = localStorage.getItem('mockUser');
    if (mockUser) {
      const updatedUser = { ...JSON.parse(mockUser), ...userData };
      localStorage.setItem('mockUser', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
    isFounder: user?.role === 'founder',
    isOffline: !!localStorage.getItem('mockUser')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};