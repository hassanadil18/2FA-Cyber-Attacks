import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class APIService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.setToken(null);
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  // Generic HTTP methods
  async get(endpoint: string, params?: any) {
    const response = await this.api.get(endpoint, { params });
    return response.data;
  }

  async post(endpoint: string, data?: any) {
    const response = await this.api.post(endpoint, data);
    return response.data;
  }

  async put(endpoint: string, data?: any) {
    const response = await this.api.put(endpoint, data);
    return response.data;
  }

  async delete(endpoint: string) {
    const response = await this.api.delete(endpoint);
    return response.data;
  }

  // Authentication endpoints
  async login(data: { username: string; password: string; twofa_code?: string }) {
    console.log('API: Making login request to', `${this.api.defaults.baseURL}/auth/login`);
    console.log('API: Login data:', { username: data.username, password: '***', twofa_code: data.twofa_code });
    const response = await this.api.post('/auth/login', data);
    console.log('API: Login response status:', response.status);
    return response.data;
  }

  async register(data: { username: string; email: string; password: string; phone?: string }) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async getMe() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await this.api.put('/auth/change-password', data);
    return response.data;
  }

  // 2FA endpoints
  async setup2FA() {
    const response = await this.api.post('/2fa/totp/setup');
    return response.data;
  }

  async verify2FA(token: string) {
    const response = await this.api.post('/2fa/totp/verify', { token });
    return response.data;
  }

  async disable2FA(password: string, confirmation_code?: string) {
    const response = await this.api.post('/2fa/disable', { password, confirmation_code });
    return response.data;
  }

  async sendSMSOTP() {
    const response = await this.api.post('/2fa/sms/send');
    return response.data;
  }

  async sendEmailOTP() {
    const response = await this.api.post('/2fa/email/send');
    return response.data;
  }

  async verifyOTP(code: string, type: string) {
    const response = await this.api.post('/2fa/otp/verify', { code, type });
    return response.data;
  }

  async sendPushNotification() {
    const response = await this.api.post('/2fa/push/send');
    return response.data;
  }

  async verifyPushToken(token: string, action: 'approve' | 'deny') {
    const response = await this.api.post('/2fa/push/verify', { token, action });
    return response.data;
  }

  async get2FAStatus() {
    const response = await this.api.get('/2fa/status');
    return response.data;
  }

  async regenerateBackupCodes() {
    const response = await this.api.post('/2fa/backup-codes/regenerate');
    return response.data;
  }

  // Dashboard endpoints
  async getDashboardStats() {
    const response = await this.api.get('/dashboard/stats');
    return response.data;
  }

  async getLoginAttempts(limit?: number) {
    const response = await this.api.get('/dashboard/login-attempts', {
      params: { limit }
    });
    return response.data;
  }

  async getAttackLogs(limit?: number) {
    const response = await this.api.get('/dashboard/attacks', {
      params: { limit }
    });
    return response.data;
  }

  async getDefenseLogs(limit?: number) {
    const response = await this.api.get('/dashboard/defenses', {
      params: { limit }
    });
    return response.data;
  }

  async getSecurityEvents(limit?: number) {
    const response = await this.api.get('/dashboard/security-events', {
      params: { limit }
    });
    return response.data;
  }

  // Attack simulation endpoints
  async simulatePhishingAttack(data: any) {
    const response = await this.api.post('/attacks/phishing', data);
    return response.data;
  }

  async simulateMITMAttack(data: any) {
    const response = await this.api.post('/attacks/mitm', data);
    return response.data;
  }

  async simulateSIMSwapAttack(data: any) {
    const response = await this.api.post('/attacks/sim-swap', data);
    return response.data;
  }

  async simulateReplayAttack(data: any) {
    const response = await this.api.post('/attacks/replay', data);
    return response.data;
  }

  // Defense endpoints
  async getDefenseStatus() {
    const response = await this.api.get('/defenses/status');
    return response.data;
  }

  async updateDefenseSettings(settings: any) {
    const response = await this.api.post('/defenses/update', settings);
    return response.data;
  }
}

export const authAPI = new APIService();
export default APIService;