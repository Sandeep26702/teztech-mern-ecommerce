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
  // 🚀 Enabled so that Live Server (Render) can accept the credentials/token
  withCredentials: true 
});

// ==========================================
// 2. REQUEST INTERCEPTOR (Token Auto-Attach)
// ==========================================
api.interceptors.request.use(
  (config) => {
    // Retrieve token from LocalStorage and send it in each request (Double Security)
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
    // If the response is valid, forward it
    return response;
  },
  (error) => {
    // If Backend returns "401 Unauthorized" (token expired/invalid)
    if (error.response?.status === 401) {
      console.warn("Session Expired or Invalid Token. Logging out...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect the user to the login page
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