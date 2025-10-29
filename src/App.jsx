import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import Leaderboard from '@/pages/Leaderboard';
import Transactions from '@/pages/Transactions';
import AdminPanel from '@/pages/AdminPanel';
import CommunityAdmin from '@/pages/CommunityAdmin';
import SwitchCommunity from '@/pages/SwitchCommunity';
import CreateCommunity from '@/pages/CreateCommunity';
import Login from '@/pages/Login';
import OTPVerification from '@/pages/OTPVerification';
import '@/App.css';
import '@/theme.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <div className="min-h-screen bg-black">
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/otp-verification" element={<OTPVerification />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Leaderboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Transactions />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireCommunityAdmin>
                  <DashboardLayout>
                    <AdminPanel />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/community-admin"
              element={
                <ProtectedRoute requireCommunityAdmin>
                  <DashboardLayout>
                    <CommunityAdmin />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/switch-community"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SwitchCommunity />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-community"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <CreateCommunity />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;