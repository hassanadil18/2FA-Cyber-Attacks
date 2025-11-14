import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './components/Dashboard';
import TwoFASetup from './pages/TwoFASetup';
import AttackSimulation from './pages/AttackSimulation';
import DefenseCenter from './pages/DefenseCenter';
import { useAuth } from './hooks/useAuth';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/2fa-setup" element={isAuthenticated ? <TwoFASetup /> : <Navigate to="/login" />} />
          <Route path="/attacks" element={isAuthenticated ? <AttackSimulation /> : <Navigate to="/login" />} />
          <Route path="/defenses" element={isAuthenticated ? <DefenseCenter /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
