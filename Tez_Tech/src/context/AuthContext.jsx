import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/* ================= CONTEXT ================= */
export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/* ================= AXIOS INSTANCE ================= */
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ FIX
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================= PROVIDER ================= */
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token')
  );

  const [loading, setLoading] = useState(true);

  /* ================= CHECK AUTH ON LOAD ================= */
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/users/profile')
      .then((res) => {
        if (res.data.success) {
          setUser(res.data.user);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        logout(true);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ================= LOGIN ================= */
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        setUser(res.data.user);
        setIsAuthenticated(true);

        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed',
      };
    }
  };

  /* ================= REGISTER ================= */
  const register = async (data) => {
    try {
      const res = await api.post('/auth/register', data);

      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));

        setUser(res.data.user);
        setIsAuthenticated(true);

        return { success: true };
      }

      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed',
      };
    }
  };

  /* ================= LOGOUT ================= */
  const logout = (silent = false) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
    setIsAuthenticated(false);

    if (!silent) {
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, register, logout, api }}
    >
      {children}
    </AuthContext.Provider>
  );
};
