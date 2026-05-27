import axios from 'axios';

// ==========================================
// 1. MASTER AXIOS INSTANCE
// ==========================================
// Dynamically resolve backend URL based on host environment (Render in prod, localhost in dev)
export const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://sonani-backend.onrender.com/api';
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // 🚀 Ise ON kar diya hai taaki Live Server (Render) token accept kar sake
  withCredentials: true 
});

// ==========================================
// 2. REQUEST INTERCEPTOR (Token Auto-Attach)
// ==========================================
api.interceptors.request.use(
  (config) => {
    // LocalStorage se token nikal kar har request me bhejenge (Double Security)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// 3. RESPONSE INTERCEPTOR (Auto Logout on 401)
// ==========================================
api.interceptors.response.use(
  (response) => {
    // Agar response sahi hai, toh use aage bhej do
    return response;
  },
  (error) => {
    // Agar Backend se "401 Unauthorized" (token expire/invalid) aaye
    if (error.response?.status === 401) {
      console.warn("Session Expired or Invalid Token. Logging out...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // User ko login page par dhakel dein
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export const optimizeCloudinaryUrl = (url, width) => {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('q_auto') && !url.includes('f_auto')) {
      const transform = width ? `q_auto,f_auto,w_${width},c_limit` : 'q_auto,f_auto';
      return url.replace('/upload/', `/upload/${transform}/`);
    }
  }
  return url;
};

export default api;