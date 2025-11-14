import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Users, Lock, Download, RefreshCw, Activity } from 'lucide-react';
import { authAPI } from '../services/api';

interface Stats {
  totalUsers?: number;
  activeUsers?: number;
  failedLogins?: number;
  defenseActivations?: number;
}

interface ThreatIntelligence {
  threatLevel?: string;
  intelligence?: {
    suspiciousIPs?: Array<{
      ip_address: string;
      failed_attempts: number;
    }>;
    attackPatterns?: Array<{
      attack_type: string;
      frequency: number;
    }>;
  };
}

interface LiveActivity {
  activity_type: string;
  activity: string;
  details: string;
  success: boolean;
  created_at: string;
}

// Interfaces
interface Stats {
  totalUsers?: number;
  activeUsers?: number;
  failedLogins?: number;
  defenseActivations?: number;
  [key: string]: any;
}

interface LiveActivity {
  activity_type: string;
  activity: string;
  details: string;
  success: boolean;
  created_at: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({});
  const [attacks, setAttacks] = useState<any[]>([]);
  const [defenses, setDefenses] = useState<any[]>([]);
  const [liveActivity, setLiveActivity] = useState<LiveActivity[]>([]);
  const [threatIntelligence, setThreatIntelligence] = useState<ThreatIntelligence>({});
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [activeTab, setActiveTab] = useState('overview');

  const loadAnalytics = useCallback(async () => {
    try {
      const [attackAnalytics, defenseAnalytics] = await Promise.all([
        authAPI.get(`/dashboard/analytics/attacks?timeframe=${selectedTimeframe}`),
        authAPI.get(`/dashboard/analytics/defenses?timeframe=${selectedTimeframe}`)
      ]);

      setAttacks(attackAnalytics);
      setDefenses(defenseAnalytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [selectedTimeframe]);

  useEffect(() => {
    loadDashboardData();
    loadLiveData();
    const interval = setInterval(loadLiveData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [selectedTimeframe, activeTab, loadAnalytics]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, attacksData, defensesData] = await Promise.all([
        authAPI.get('/dashboard/stats'),
        authAPI.get('/dashboard/attacks?limit=10'),
        authAPI.get('/dashboard/defenses?limit=10')
      ]);

      setStats(statsData);
      setAttacks(attacksData);
      setDefenses(defensesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveData = async () => {
    try {
      const [activityData, threatData] = await Promise.all([
        authAPI.get('/dashboard/activity/live?limit=15'),
        authAPI.get('/dashboard/threat-intelligence')
      ]);

      setLiveActivity(activityData.activities || []);
      setThreatIntelligence(threatData);
    } catch (error) {
      console.error('Error loading live data:', error);
    }
  };

  const exportLogs = async (type: string, format: string) => {
    try {
      const response = await fetch(`/api/dashboard/export/logs?type=${type}&format=${format}&days=7`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-logs-${type}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    color: string;
    change?: number;
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, change }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        <Icon className="h-8 w-8" style={{ color }} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Real-time monitoring and analytics for 2FA cyber attacks simulation
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={loadDashboardData}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-6">
              <nav className="flex space-x-8">
                {['overview', 'analytics', 'threats', 'logs'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Health Alert */}
        {threatIntelligence.threatLevel && threatIntelligence.threatLevel !== 'low' && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${getThreatLevelColor(threatIntelligence.threatLevel)}`}>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="font-medium">
                Current Threat Level: {threatIntelligence.threatLevel.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats.totalUsers || 0}
                icon={Users}
                color="#3B82F6"
              />
              <StatCard
                title="Active 2FA Users"
                value={stats.activeUsers || 0}
                icon={Shield}
                color="#10B981"
              />
              <StatCard
                title="Failed Logins (24h)"
                value={stats.failedLogins || 0}
                icon={Lock}
                color="#EF4444"
              />
              <StatCard
                title="Defense Activations"
                value={stats.defenseActivations || 0}
                icon={Activity}
                color="#8B5CF6"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Attacks */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Attack Attempts</h3>
                <div className="space-y-4">
                  {attacks.slice(0, 5).map((attack, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{attack.attack_type}</p>
                        <p className="text-sm text-gray-600">
                          Target: {attack.username || 'Unknown'} | 
                          Status: {attack.success ? 'Successful' : 'Blocked'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(attack.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Defenses */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Defense Activations</h3>
                <div className="space-y-4">
                  {defenses.slice(0, 5).map((defense, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{defense.defense_type}</p>
                        <p className="text-sm text-gray-600">{defense.action_taken}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        defense.effectiveness === 'blocked' || defense.effectiveness === 'protected'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {defense.effectiveness}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Live Activity Feed</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {liveActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.activity_type === 'attack' ? 'bg-red-500' :
                        activity.activity_type === 'defense' ? 'bg-green-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                        <p className="text-xs text-gray-500">{activity.details}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Timeframe Selector */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Analytics Dashboard</h3>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>

              {/* Analytics Charts Placeholder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Attack Types Distribution</h4>
                  <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                    <p className="text-gray-500">Chart: Attack types breakdown</p>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Defense Effectiveness</h4>
                  <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
                    <p className="text-gray-500">Chart: Defense success rates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Threat Intelligence</h3>
              
              {threatIntelligence.intelligence && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Suspicious IPs */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Suspicious IP Addresses</h4>
                    <div className="space-y-2">
                      {threatIntelligence.intelligence.suspiciousIPs?.slice(0, 5).map((ip, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                          <span className="font-mono text-sm">{ip.ip_address}</span>
                          <span className="text-sm text-red-600">{ip.failed_attempts} attempts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attack Patterns */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Attack Patterns</h4>
                    <div className="space-y-2">
                      {threatIntelligence.intelligence.attackPatterns?.map((pattern, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                          <span className="text-sm">{pattern.attack_type}</span>
                          <span className="text-sm text-yellow-600">{pattern.frequency}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Security Logs</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportLogs('all', 'json')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export JSON
                </button>
                <button
                  onClick={() => exportLogs('all', 'csv')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Log filtering and display would go here */}
              <p className="text-gray-500 text-center py-8">
                Log export functionality available. Use export buttons to download security logs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;