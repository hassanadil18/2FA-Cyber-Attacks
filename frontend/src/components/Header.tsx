import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">2FA</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Cyber Attacks Lab
              </h1>
            </Link>
            
            {isAuthenticated && (
              <nav className="hidden md:flex space-x-6">
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-primary-600 font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/2fa-setup" 
                  className="text-gray-600 hover:text-primary-600 font-medium"
                >
                  2FA Setup
                </Link>
                <Link 
                  to="/attacks" 
                  className="text-gray-600 hover:text-danger-600 font-medium"
                >
                  Attack Simulation
                </Link>
                <Link 
                  to="/defenses" 
                  className="text-gray-600 hover:text-success-600 font-medium"
                >
                  Defense Center
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-medium text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">
                    {user?.username}
                  </span>
                  {user?.is_2fa_enabled && (
                    <span className="px-2 py-1 bg-success-100 text-success-700 text-xs rounded-full">
                      2FA Enabled
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mt-4 bg-warning-50 border border-warning-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-warning-700">
                <strong>Educational Purpose Only:</strong> This lab simulates cyber attacks for learning. 
                All attacks are contained and do not affect real systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;