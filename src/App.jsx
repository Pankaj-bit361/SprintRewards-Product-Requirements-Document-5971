import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Transactions from './pages/Transactions';
import Tasks from './pages/Tasks';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
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
                color: '#fff'
              }
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <div className="min-h-screen">
                  <Navbar />
                  <main className="pt-16">
                    <Dashboard />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <div className="min-h-screen">
                  <Navbar />
                  <main className="pt-16">
                    <Leaderboard />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <div className="min-h-screen">
                  <Navbar />
                  <main className="pt-16">
                    <Transactions />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute>
                <div className="min-h-screen">
                  <Navbar />
                  <main className="pt-16">
                    <Tasks />
                  </main>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireFounder>
                <div className="min-h-screen">
                  <Navbar />
                  <main className="pt-16">
                    <AdminPanel />
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;