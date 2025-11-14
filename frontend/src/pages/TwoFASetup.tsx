import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';

const TwoFASetup: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'totp' | 'sms' | 'email' | 'push'>('totp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // TOTP setup state
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // OTP states
  const [pushToken, setPushToken] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      await authAPI.get2FAStatus();
      // Status response can be used for UI updates if needed
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    }
  };

  const setupTOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.setup2FA();
      setTotpSecret(response.secret);
      setQrCode(response.qrcode);
      setSuccess('TOTP setup initiated. Scan the QR code with your authenticator app.');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to setup TOTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (!totpToken) {
      setError('Please enter the TOTP code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authAPI.verify2FA(totpToken);
      setBackupCodes(response.backup_codes);
      setSuccess('2FA enabled successfully! Please save your backup codes.');
      updateUser({ is_2fa_enabled: true });
      fetchStatus();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Invalid TOTP code');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;

    setLoading(true);
    setError('');
    try {
      await authAPI.disable2FA(password);
      setSuccess('2FA disabled successfully');
      updateUser({ is_2fa_enabled: false });
      fetchStatus();
      // Reset states
      setTotpSecret('');
      setQrCode('');
      setBackupCodes([]);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const sendSMSOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.sendSMSOTP();
      setSuccess(`SMS OTP sent to ${response.phone_masked}`);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send SMS OTP');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.sendEmailOTP();
      setSuccess(`Email OTP sent to ${response.email_masked}`);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send Email OTP');
    } finally {
      setLoading(false);
    }
  };

  const sendPushNotification = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authAPI.sendPushNotification();
      setPushToken(response.token);
      setSuccess('Push notification sent! Check your device.');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to send push notification');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'totp', name: 'Authenticator App', icon: '📱' },
    { id: 'sms', name: 'SMS', icon: '💬' },
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'push', name: 'Push Notification', icon: '🔔' }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Two-Factor Authentication Setup</h1>
        <p className="mt-2 text-gray-600">
          Secure your account with additional authentication methods
        </p>
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">2FA Status</h2>
            <p className={`mt-1 text-sm ${user?.is_2fa_enabled ? 'text-success-600' : 'text-warning-600'}`}>
              {user?.is_2fa_enabled ? '✅ Two-factor authentication is enabled' : '⚠️ Two-factor authentication is disabled'}
            </p>
          </div>
          {user?.is_2fa_enabled && (
            <button
              onClick={disable2FA}
              disabled={loading}
              className="px-4 py-2 bg-danger-600 text-white rounded-md hover:bg-danger-700 disabled:opacity-50"
            >
              Disable 2FA
            </button>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* 2FA Methods Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* TOTP Tab */}
          {activeTab === 'totp' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Authenticator App (TOTP)
              </h3>
              <p className="text-gray-600 mb-6">
                Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
              </p>

              {!totpSecret ? (
                <button
                  onClick={setupTOTP}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Setup TOTP'}
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">1. Scan QR Code</h4>
                      {qrCode && (
                        <img src={qrCode} alt="TOTP QR Code" className="border rounded-lg" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">2. Or enter manually</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-600">Secret Key:</p>
                        <code className="text-sm font-mono">{totpSecret}</code>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">3. Verify Setup</h4>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={totpToken}
                        onChange={(e) => setTotpToken(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        maxLength={6}
                      />
                      <button
                        onClick={verifyTOTP}
                        disabled={loading || !totpToken}
                        className="px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 disabled:opacity-50"
                      >
                        {loading ? 'Verifying...' : 'Verify & Enable'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {backupCodes.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Backup Codes</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Save these backup codes in a safe place. You can use them to access your account if you lose your device.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, index) => (
                      <code key={index} className="text-sm bg-white p-2 rounded border">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SMS Tab */}
          {activeTab === 'sms' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">SMS Authentication</h3>
              <p className="text-gray-600 mb-6">
                Receive authentication codes via SMS. Note: This is a simulation for educational purposes.
              </p>
              
              {user?.phone ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Phone number: <span className="font-mono">{user.phone}</span>
                  </p>
                  <button
                    onClick={sendSMSOTP}
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Test SMS'}
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-yellow-700">
                    No phone number associated with your account. Please update your profile to use SMS authentication.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Email Authentication</h3>
              <p className="text-gray-600 mb-6">
                Receive authentication codes via email. Uses a local SMTP server for demonstration.
              </p>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Email address: <span className="font-mono">{user?.email}</span>
                </p>
                <button
                  onClick={sendEmailOTP}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
            </div>
          )}

          {/* Push Tab */}
          {activeTab === 'push' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
              <p className="text-gray-600 mb-6">
                Receive authentication prompts as push notifications. This is a simulation of mobile push notifications.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={sendPushNotification}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Test Push'}
                </button>

                {pushToken && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="font-medium text-blue-800 mb-2">📱 Simulated Push Notification</h4>
                    <p className="text-blue-700 text-sm mb-3">
                      Login attempt detected. Token: <code className="bg-white px-1 rounded">{pushToken}</code>
                    </p>
                    <div className="space-x-2">
                      <button className="px-3 py-1 bg-success-600 text-white text-sm rounded">
                        ✓ Approve
                      </button>
                      <button className="px-3 py-1 bg-danger-600 text-white text-sm rounded">
                        ✗ Deny
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFASetup;