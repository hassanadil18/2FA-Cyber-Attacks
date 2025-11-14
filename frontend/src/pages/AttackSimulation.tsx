import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../services/api';
import { Shield, Wifi, Smartphone, RotateCcw, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';

interface AttackResult {
  attack_id: string;
  status: string;
  details: any;
  message: string;
}

const AttackSimulation: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'phishing' | 'mitm' | 'sim-swap' | 'replay'>('phishing');
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, AttackResult>>({});
  const [error, setError] = useState<string>('');

  // Phishing Attack State
  const [phishingData, setPhishingData] = useState({
    target_email: 'victim@example.com',
    attack_type: 'credential_harvest',
    template: 'fake_login_page',
    domain: 'fake-2fa-lab.local'
  });

  // MITM Attack State
  const [mitmData, setMitmData] = useState({
    target_ip: '192.168.1.100',
    method: 'arp_spoofing',
    interface: 'eth0',
    ssl_strip: true
  });

  // SIM Swap Attack State
  const [simSwapData, setSimSwapData] = useState({
    target_phone: '+1234567890',
    carrier: 'Verizon',
    method: 'social_engineering',
    attacker_device: 'iPhone12_sim_123456'
  });

  // Replay Attack State
  const [replayData, setReplayData] = useState({
    method: 'otp_replay',
    target_type: 'totp_token',
    captured_token: '123456',
    replay_attempts: 3
  });

  const executeAttack = async (attackType: string, data: any) => {
    setLoading(attackType);
    setError('');
    
    try {
      const response = await authAPI.post(`/attacks/${attackType}`, data);
      setResults(prev => ({ ...prev, [attackType]: response }));
      
      // For some attacks, check status after a delay
      if (attackType === 'mitm' || attackType === 'sim-swap') {
        setTimeout(async () => {
          try {
            const statusResponse = await authAPI.get(`/attacks/${attackType}/${response.attack_id}/status`);
            setResults(prev => ({ 
              ...prev, 
              [attackType]: { ...prev[attackType], details: { ...prev[attackType].details, ...statusResponse } }
            }));
          } catch (err) {
            console.error('Error getting attack status:', err);
          }
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to execute ${attackType} attack`);
    } finally {
      setLoading(null);
    }
  };

  const renderAttackResult = (attackType: string) => {
    const result = results[attackType];
    if (!result) return null;

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center mb-3">
          {result.status === 'completed' ? (
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          ) : result.status === 'failed' ? (
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
          ) : (
            <Loader className="w-5 h-5 text-blue-500 mr-2 animate-spin" />
          )}
          <h4 className="font-semibold text-gray-900">Attack Result</h4>
        </div>
        
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Attack ID:</span> {result.attack_id}</p>
          <p><span className="font-medium">Status:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              result.status === 'completed' ? 'bg-green-100 text-green-800' :
              result.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {result.status}
            </span>
          </p>
          <p><span className="font-medium">Message:</span> {result.message}</p>
          
          {result.details && (
            <div className="mt-3">
              <p className="font-medium mb-2">Details:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Attack Simulation</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              <strong>Educational Purpose Only:</strong> This lab simulates cyber attacks for learning. 
              All attacks are contained and do not affect real systems.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Attack Type Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'phishing', name: 'Phishing Attack', icon: Shield },
              { id: 'mitm', name: 'MITM Attack', icon: Wifi },
              { id: 'sim-swap', name: 'SIM Swap Attack', icon: Smartphone },
              { id: 'replay', name: 'Replay Attack', icon: RotateCcw },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Attack Forms */}
      <div className="bg-white rounded-lg shadow">
        {/* Phishing Attack */}
        {activeTab === 'phishing' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-6 h-6 text-red-500 mr-2" />
              Phishing Attack Simulation
            </h2>
            <p className="text-gray-600 mb-6">
              Simulate credential harvesting attacks using fake login pages and phishing emails.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Email
                </label>
                <input
                  type="email"
                  value={phishingData.target_email}
                  onChange={(e) => setPhishingData(prev => ({ ...prev, target_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="victim@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attack Type
                </label>
                <select
                  value={phishingData.attack_type}
                  onChange={(e) => setPhishingData(prev => ({ ...prev, attack_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="credential_harvest">Credential Harvest</option>
                  <option value="2fa_bypass">2FA Bypass</option>
                  <option value="session_hijack">Session Hijack</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <select
                  value={phishingData.template}
                  onChange={(e) => setPhishingData(prev => ({ ...prev, template: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fake_login_page">Fake Login Page</option>
                  <option value="security_alert">Security Alert</option>
                  <option value="account_suspension">Account Suspension</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fake Domain
                </label>
                <input
                  type="text"
                  value={phishingData.domain}
                  onChange={(e) => setPhishingData(prev => ({ ...prev, domain: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="fake-2fa-lab.local"
                />
              </div>
            </div>
            
            <button
              onClick={() => executeAttack('phishing', phishingData)}
              disabled={loading === 'phishing'}
              className="mt-6 bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading === 'phishing' ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shield className="w-4 h-4 mr-2" />
              )}
              Execute Phishing Attack
            </button>
            
            {renderAttackResult('phishing')}
          </div>
        )}

        {/* MITM Attack */}
        {activeTab === 'mitm' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Wifi className="w-6 h-6 text-orange-500 mr-2" />
              Man-in-the-Middle Attack Simulation
            </h2>
            <p className="text-gray-600 mb-6">
              Simulate traffic interception, ARP spoofing, and SSL stripping attacks.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target IP Address
                </label>
                <input
                  type="text"
                  value={mitmData.target_ip}
                  onChange={(e) => setMitmData(prev => ({ ...prev, target_ip: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="192.168.1.100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attack Method
                </label>
                <select
                  value={mitmData.method}
                  onChange={(e) => setMitmData(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="arp_spoofing">ARP Spoofing</option>
                  <option value="dns_spoofing">DNS Spoofing</option>
                  <option value="dhcp_spoofing">DHCP Spoofing</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network Interface
                </label>
                <select
                  value={mitmData.interface}
                  onChange={(e) => setMitmData(prev => ({ ...prev, interface: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="eth0">eth0</option>
                  <option value="wlan0">wlan0</option>
                  <option value="en0">en0</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ssl_strip"
                  checked={mitmData.ssl_strip}
                  onChange={(e) => setMitmData(prev => ({ ...prev, ssl_strip: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="ssl_strip" className="ml-2 block text-sm text-gray-700">
                  Enable SSL Stripping
                </label>
              </div>
            </div>
            
            <button
              onClick={() => executeAttack('mitm', mitmData)}
              disabled={loading === 'mitm'}
              className="mt-6 bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading === 'mitm' ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4 mr-2" />
              )}
              Execute MITM Attack
            </button>
            
            {renderAttackResult('mitm')}
          </div>
        )}

        {/* SIM Swap Attack */}
        {activeTab === 'sim-swap' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Smartphone className="w-6 h-6 text-purple-500 mr-2" />
              SIM Swap Attack Simulation
            </h2>
            <p className="text-gray-600 mb-6">
              Simulate social engineering attacks on mobile carriers to transfer SIM ownership.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Phone Number
                </label>
                <input
                  type="tel"
                  value={simSwapData.target_phone}
                  onChange={(e) => setSimSwapData(prev => ({ ...prev, target_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Carrier
                </label>
                <select
                  value={simSwapData.carrier}
                  onChange={(e) => setSimSwapData(prev => ({ ...prev, carrier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Verizon">Verizon</option>
                  <option value="AT&T">AT&T</option>
                  <option value="T-Mobile">T-Mobile</option>
                  <option value="Sprint">Sprint</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attack Method
                </label>
                <select
                  value={simSwapData.method}
                  onChange={(e) => setSimSwapData(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="social_engineering">Social Engineering</option>
                  <option value="insider_threat">Insider Threat</option>
                  <option value="identity_theft">Identity Theft</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attacker Device ID
                </label>
                <input
                  type="text"
                  value={simSwapData.attacker_device}
                  onChange={(e) => setSimSwapData(prev => ({ ...prev, attacker_device: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="iPhone12_sim_123456"
                />
              </div>
            </div>
            
            <button
              onClick={() => executeAttack('sim-swap', simSwapData)}
              disabled={loading === 'sim-swap'}
              className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading === 'sim-swap' ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              Execute SIM Swap Attack
            </button>
            
            {renderAttackResult('sim-swap')}
          </div>
        )}

        {/* Replay Attack */}
        {activeTab === 'replay' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <RotateCcw className="w-6 h-6 text-green-500 mr-2" />
              Replay Attack Simulation
            </h2>
            <p className="text-gray-600 mb-6">
              Simulate OTP replay attacks and token reuse attempts.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attack Method
                </label>
                <select
                  value={replayData.method}
                  onChange={(e) => setReplayData(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="otp_replay">OTP Replay</option>
                  <option value="session_replay">Session Replay</option>
                  <option value="token_replay">Token Replay</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Type
                </label>
                <select
                  value={replayData.target_type}
                  onChange={(e) => setReplayData(prev => ({ ...prev, target_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="totp_token">TOTP Token</option>
                  <option value="sms_otp">SMS OTP</option>
                  <option value="email_otp">Email OTP</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Captured Token
                </label>
                <input
                  type="text"
                  value={replayData.captured_token}
                  onChange={(e) => setReplayData(prev => ({ ...prev, captured_token: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replay Attempts
                </label>
                <input
                  type="number"
                  value={replayData.replay_attempts}
                  onChange={(e) => setReplayData(prev => ({ ...prev, replay_attempts: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
            </div>
            
            <button
              onClick={() => executeAttack('replay', replayData)}
              disabled={loading === 'replay'}
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading === 'replay' ? (
                <Loader className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Execute Replay Attack
            </button>
            
            {renderAttackResult('replay')}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttackSimulation;