import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, AlertTriangle, Lock, Eye, EyeOff, CheckCircle, XCircle, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

interface DefenseStatus {
  webauthn: {
    enabled: boolean;
    device_count: number;
    devices: any[];
  };
  device_binding: {
    enabled: boolean;
    trusted_devices: number;
    current_device_trusted: boolean;
  };
  rate_limiting: {
    enabled: boolean;
    activeLimits: any[];
    timestamp: string;
  };
  alerts: {
    recent_count: number;
    latest_alerts: any[];
  };
}

interface DefenseLog {
  id: string;
  defense_type: string;
  action: string;
  status: string;
  timestamp: string;
  details: any;
}

const DefenseCenter: React.FC = () => {
  const { user } = useAuth();
  const [defenseStatus, setDefenseStatus] = useState<DefenseStatus>({
    webauthn: {
      enabled: false,
      device_count: 0,
      devices: []
    },
    device_binding: {
      enabled: false,
      trusted_devices: 0,
      current_device_trusted: false
    },
    rate_limiting: {
      enabled: true,
      activeLimits: [],
      timestamp: ''
    },
    alerts: {
      recent_count: 0,
      latest_alerts: []
    }
  });
  const [defenseLogs, setDefenseLogs] = useState<DefenseLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // WebAuthn states
  const [webauthnDevices, setWebauthnDevices] = useState<any[]>([]);
  const [registering, setRegistering] = useState(false);

  // Device Binding states
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);
  const [currentDevice, setCurrentDevice] = useState<string>('');

  // Rate Limiting states
  const [rateLimitConfig, setRateLimitConfig] = useState({
    maxAttempts: 5,
    windowMinutes: 15,
    enabled: true
  });

  // Alert System states
  const [alertConfig, setAlertConfig] = useState({
    emailAlerts: true,
    smsAlerts: false,
    threshold: 3,
    enabled: true
  });

  useEffect(() => {
    fetchDefenseStatus();
    fetchDefenseLogs();
    fetchWebAuthnDevices();
    fetchTrustedDevices();
  }, []);

  const fetchDefenseStatus = async () => {
    try {
      console.log('📊 Fetching defense status...');
      const response = await authAPI.get('/defenses/status');
      setDefenseStatus(response.data);
      console.log('✅ Defense status loaded:', response.data);
    } catch (error: any) {
      console.error('❌ Failed to fetch defense status:', error);
      // Set default status if fetch fails
      setDefenseStatus({
        webauthn: {
          enabled: false,
          device_count: 0,
          devices: []
        },
        device_binding: {
          enabled: false,
          trusted_devices: 0,
          current_device_trusted: false
        },
        rate_limiting: {
          enabled: true,
          activeLimits: [],
          timestamp: ''
        },
        alerts: {
          recent_count: 0,
          latest_alerts: []
        }
      });
    }
  };

  const fetchDefenseLogs = async () => {
    try {
      console.log('📋 Fetching defense logs...');
      const response = await authAPI.get('/defenses/logs');
      setDefenseLogs(response.data.logs || []);
      console.log(`✅ Loaded ${response.data.logs?.length || 0} defense logs`);
    } catch (error: any) {
      console.error('❌ Failed to fetch defense logs:', error);
      setDefenseLogs([]);
    }
  };

  const fetchWebAuthnDevices = async () => {
    try {
      console.log('🔐 Fetching WebAuthn devices...');
      const response = await authAPI.get('/defenses/webauthn/devices');
      setWebauthnDevices(response.data || []);
      console.log(`✅ Loaded ${response.data?.length || 0} WebAuthn devices`);
    } catch (error: any) {
      console.error('❌ Failed to fetch WebAuthn devices:', error);
      setWebauthnDevices([]);
    }
  };

  const fetchTrustedDevices = async () => {
    try {
      console.log('📱 Fetching trusted devices...');
      const response = await authAPI.get('/defenses/device-binding/devices');
      setTrustedDevices(response.data || []);
      console.log(`✅ Loaded ${response.data?.length || 0} trusted devices`);
    } catch (error: any) {
      console.error('❌ Failed to fetch trusted devices:', error);
      setTrustedDevices([]);
    }
  };

  const registerWebAuthnDevice = async () => {
    setRegistering(true);
    try {
      // Create simulated WebAuthn credential data
      const simulatedCredential = {
        deviceName: `Security Key ${webauthnDevices.length + 1}`,
        userAgent: navigator.userAgent,
        credentialId: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        publicKey: {
          kty: 'EC',
          alg: 'ES256',
          crv: 'P-256',
          x: btoa(Math.random().toString()).substr(0, 32),
          y: btoa(Math.random().toString()).substr(0, 32)
        },
        transports: ['usb', 'nfc'],
        attestationType: 'packed'
      };

      console.log('🔐 Registering simulated WebAuthn device:', simulatedCredential.deviceName);
      
      const response = await authAPI.post('/defenses/webauthn/register', simulatedCredential);
      
      alert(`WebAuthn device "${simulatedCredential.deviceName}" registered successfully!`);
      fetchWebAuthnDevices();
      setDefenseStatus(prev => ({ 
        ...prev, 
        webauthn: { ...prev.webauthn, enabled: true, device_count: prev.webauthn.device_count + 1 } 
      }));
    } catch (error: any) {
      console.error('WebAuthn registration failed:', error);
      const errorMessage = error.response?.data?.error || 'Failed to register WebAuthn device';
      alert(`Registration failed: ${errorMessage}`);
    } finally {
      setRegistering(false);
    }
  };

  const bindCurrentDevice = async () => {
    setLoading(true);
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack
      };

      console.log('📱 Binding device with info:', deviceInfo);

      const response = await authAPI.post('/defenses/device-binding/bind', {
        deviceInfo,
        deviceName: currentDevice || `${navigator.platform} Device ${trustedDevices.length + 1}`
      });

      alert(`Device "${response.data.deviceName || currentDevice}" bound successfully!`);
      fetchTrustedDevices();
      setDefenseStatus(prev => ({ 
        ...prev, 
        device_binding: { ...prev.device_binding, enabled: true, trusted_devices: prev.device_binding.trusted_devices + 1 } 
      }));
      setCurrentDevice('');
    } catch (error: any) {
      console.error('Device binding failed:', error);
      const errorMessage = error.response?.data?.error || 'Failed to bind device';
      alert(`Device binding failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRateLimitConfig = async () => {
    setLoading(true);
    try {
      console.log('⚙️ Updating rate limiting config:', rateLimitConfig);
      
      const response = await authAPI.post('/defenses/rate-limiting/config', rateLimitConfig);
      
      alert(`Rate limiting updated: ${rateLimitConfig.maxAttempts} attempts per ${rateLimitConfig.windowMinutes} minutes`);
      setDefenseStatus(prev => ({ 
        ...prev, 
        rate_limiting: { ...prev.rate_limiting, enabled: rateLimitConfig.enabled } 
      }));
    } catch (error: any) {
      console.error('Failed to update rate limiting:', error);
      const errorMessage = error.response?.data?.error || 'Configuration update failed';
      alert(`Rate limiting update failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertConfig = async () => {
    setLoading(true);
    try {
      console.log('🚨 Updating alert system config:', alertConfig);
      
      const response = await authAPI.post('/defenses/alert-system/config', alertConfig);
      
      const alertTypes = [];
      if (alertConfig.emailAlerts) alertTypes.push('Email');
      if (alertConfig.smsAlerts) alertTypes.push('SMS');
      
      alert(`Alert system updated: ${alertTypes.join(' & ')} alerts with threshold ${alertConfig.threshold}`);
      // Alert system is always enabled, just showing recent count
      fetchDefenseStatus();
    } catch (error: any) {
      console.error('Failed to update alert system:', error);
      const errorMessage = error.response?.data?.error || 'Configuration update failed';
      alert(`Alert system update failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const testDefense = async (defenseType: string) => {
    setLoading(true);
    try {
      console.log(`🧪 Testing ${defenseType} defense...`);
      
      const response = await authAPI.post(`/defenses/${defenseType}/test`);
      
      const defenseNames: { [key: string]: string } = {
        'webauthn': 'WebAuthn Security Keys',
        'device-binding': 'Device Binding',
        'rate-limiting': 'Rate Limiting',
        'alert-system': 'Alert System'
      };
      
      alert(`✅ ${defenseNames[defenseType] || defenseType} test completed successfully!\n\n${response.data.message || response.data.testResult}`);
      
      // Refresh logs and status
      fetchDefenseLogs();
      fetchDefenseStatus();
    } catch (error: any) {
      console.error(`${defenseType} test failed:`, error);
      const errorMessage = error.response?.data?.error || `${defenseType} test failed`;
      alert(`❌ Defense test failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">WebAuthn</h3>
            <p className="text-sm text-gray-600">Hardware Security</p>
          </div>
          <div className={`p-2 rounded-full ${defenseStatus.webauthn.enabled ? 'bg-green-100' : 'bg-red-100'}`}>
            {defenseStatus.webauthn.enabled ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
        <div className="mt-4">
          <span className={`px-2 py-1 text-xs rounded-full ${
            defenseStatus.webauthn.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {defenseStatus.webauthn.device_count} Devices
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Device Binding</h3>
            <p className="text-sm text-gray-600">Trusted Devices</p>
          </div>
          <div className={`p-2 rounded-full ${defenseStatus.device_binding.enabled ? 'bg-green-100' : 'bg-red-100'}`}>
            {defenseStatus.device_binding.enabled ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
        <div className="mt-4">
          <span className={`px-2 py-1 text-xs rounded-full ${
            defenseStatus.device_binding.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {defenseStatus.device_binding.trusted_devices} Devices
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Rate Limiting</h3>
            <p className="text-sm text-gray-600">Brute Force Protection</p>
          </div>
          <div className={`p-2 rounded-full ${defenseStatus.rate_limiting.enabled ? 'bg-green-100' : 'bg-red-100'}`}>
            {defenseStatus.rate_limiting.enabled ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
        <div className="mt-4">
          <span className={`px-2 py-1 text-xs rounded-full ${
            defenseStatus.rate_limiting.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {defenseStatus.rate_limiting.activeLimits.length} Active Limits
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Alert System</h3>
            <p className="text-sm text-gray-600">Threat Monitoring</p>
          </div>
          <div className={`p-2 rounded-full ${defenseStatus.alerts.recent_count >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            {defenseStatus.alerts.recent_count >= 0 ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
          </div>
        </div>
        <div className="mt-4">
          <span className={`px-2 py-1 text-xs rounded-full ${
            defenseStatus.alerts.recent_count >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {defenseStatus.alerts.recent_count} Recent Alerts
          </span>
        </div>
      </div>
    </div>
  );

  const renderWebAuthn = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">WebAuthn Security Keys</h3>
        <button
          onClick={registerWebAuthnDevice}
          disabled={registering || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {registering && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          )}
          <span>{registering ? 'Registering Security Key...' : 'Register New Security Key'}</span>
        </button>
      </div>

      <div className="space-y-4">
        {webauthnDevices.length === 0 ? (
          <p className="text-gray-600">No WebAuthn devices registered.</p>
        ) : (
          webauthnDevices.map((device, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{device.deviceName || `Device ${index + 1}`}</h4>
                  <p className="text-sm text-gray-600">Registered: {new Date(device.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                  <button
                    onClick={() => testDefense('webauthn')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderDeviceBinding = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Trusted Devices</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Device name (optional)"
            value={currentDevice}
            onChange={(e) => setCurrentDevice(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={bindCurrentDevice}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Bind This Device
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {trustedDevices.length === 0 ? (
          <p className="text-gray-600">No trusted devices configured.</p>
        ) : (
          trustedDevices.map((device, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{device.device_name}</h4>
                  <p className="text-sm text-gray-600">Platform: {device.platform}</p>
                  <p className="text-sm text-gray-600">Last seen: {new Date(device.last_seen).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Trusted</span>
                  <button
                    onClick={() => testDefense('device-binding')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderRateLimiting = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Rate Limiting Configuration</h3>
      
      <div className="space-y-6">
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={rateLimitConfig.enabled}
              onChange={(e) => setRateLimitConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-900">Enable Rate Limiting</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Attempts
            </label>
            <input
              type="number"
              value={rateLimitConfig.maxAttempts}
              onChange={(e) => setRateLimitConfig(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) }))}
              className="w-full border rounded-lg px-3 py-2"
              min="1"
              max="20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Window (minutes)
            </label>
            <input
              type="number"
              value={rateLimitConfig.windowMinutes}
              onChange={(e) => setRateLimitConfig(prev => ({ ...prev, windowMinutes: parseInt(e.target.value) }))}
              className="w-full border rounded-lg px-3 py-2"
              min="1"
              max="60"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={updateRateLimitConfig}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Update Configuration
          </button>
          <button
            onClick={() => testDefense('rate-limiting')}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Test Rate Limiting
          </button>
        </div>
      </div>
    </div>
  );

  const renderAlertSystem = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Alert System Configuration</h3>
      
      <div className="space-y-6">
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={alertConfig.enabled}
              onChange={(e) => setAlertConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-900">Enable Alert System</span>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={alertConfig.emailAlerts}
                onChange={(e) => setAlertConfig(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Email Alerts</span>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={alertConfig.smsAlerts}
                onChange={(e) => setAlertConfig(prev => ({ ...prev, smsAlerts: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">SMS Alerts</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Threshold (failed attempts)
            </label>
            <input
              type="number"
              value={alertConfig.threshold}
              onChange={(e) => setAlertConfig(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
              className="w-full border rounded-lg px-3 py-2"
              min="1"
              max="10"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={updateAlertConfig}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Update Configuration
          </button>
          <button
            onClick={() => testDefense('alert-system')}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Test Alert System
          </button>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Defense Activity Logs</h3>
        <button
          onClick={fetchDefenseLogs}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {defenseLogs.length === 0 ? (
          <p className="text-gray-600">No defense activity logged yet.</p>
        ) : (
          defenseLogs.slice(0, 10).map((log, index) => (
            <div key={log.id || index} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{log.defense_type.toUpperCase()}</h4>
                  <p className="text-sm text-gray-600">{log.action}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {log.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Defense Center</h1>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'webauthn', label: 'WebAuthn', icon: Lock },
            { id: 'device-binding', label: 'Device Binding', icon: Smartphone },
            { id: 'rate-limiting', label: 'Rate Limiting', icon: Shield },
            { id: 'alert-system', label: 'Alert System', icon: AlertTriangle },
            { id: 'logs', label: 'Activity Logs', icon: Eye }
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'webauthn' && renderWebAuthn()}
        {activeTab === 'device-binding' && renderDeviceBinding()}
        {activeTab === 'rate-limiting' && renderRateLimiting()}
        {activeTab === 'alert-system' && renderAlertSystem()}
        {activeTab === 'logs' && renderLogs()}
      </div>
    </div>
  );
};

export default DefenseCenter;