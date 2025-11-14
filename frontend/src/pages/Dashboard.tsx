import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to the 2FA Cyber Attacks Lab
        </h1>
        <p className="mt-2 text-gray-600">
          Hello {user?.username}! Explore our educational security features.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 2FA Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                user?.is_2fa_enabled ? 'bg-success-100' : 'bg-warning-100'
              }`}>
                <svg className={`w-5 h-5 ${
                  user?.is_2fa_enabled ? 'text-success-600' : 'text-warning-600'
                }`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">2FA Status</h3>
              <p className={`text-sm ${
                user?.is_2fa_enabled ? 'text-success-600' : 'text-warning-600'
              }`}>
                {user?.is_2fa_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/2fa-setup"
              className="block w-full text-left px-4 py-2 bg-primary-50 text-primary-700 rounded-md hover:bg-primary-100 transition-colors"
            >
              Set up 2FA
            </a>
            <a
              href="/attacks"
              className="block w-full text-left px-4 py-2 bg-danger-50 text-danger-700 rounded-md hover:bg-danger-100 transition-colors"
            >
              View Attack Simulations
            </a>
            <a
              href="/defenses"
              className="block w-full text-left px-4 py-2 bg-success-50 text-success-700 rounded-md hover:bg-success-100 transition-colors"
            >
              Configure Defenses
            </a>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Login Attempts</span>
              <span className="text-sm font-medium text-gray-900">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Attack Simulations</span>
              <span className="text-sm font-medium text-gray-900">0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Defense Activations</span>
              <span className="text-sm font-medium text-gray-900">0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Educational Laboratory Environment
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This platform simulates real-world 2FA attack scenarios in a safe, controlled environment. 
                All attacks are isolated and designed for educational purposes only. Use this knowledge 
                responsibly to improve security awareness and defense strategies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;