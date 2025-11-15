import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  is_2fa_enabled: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string, twofa_code?: string) => Promise<{ success: boolean; requires_2fa?: boolean; error?: string }>;
  register: (userData: { username: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          authAPI.setToken(storedToken);
          const response = await authAPI.getMe();
          setUser(response.user);
          setToken(storedToken);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string, twofa_code?: string) => {
    try {
      console.log('Attempting login for username:', username);
      const response = await authAPI.login({ username, password, twofa_code });
      console.log('Login response:', response);
      
      if (response.requires_2fa) {
        return { success: false, requires_2fa: true };
      }

      if (response.token) {
        localStorage.setItem('token', response.token);
        authAPI.setToken(response.token);
        setToken(response.token);
        setUser(response.user);
        console.log('Login successful, user set:', response.user);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Login failed' 
      };
    }
  };

  const register = async (userData: { username: string; email: string; password: string; phone?: string }) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        authAPI.setToken(response.token);
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      }

      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    authAPI.setToken(null);
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};