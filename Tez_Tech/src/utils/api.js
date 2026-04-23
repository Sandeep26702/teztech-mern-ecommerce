import axios from 'axios';

// ==========================================
// 1. MASTER AXIOS INSTANCE
// ==========================================
// 🚀 THE FINAL BOSS FIX: Ab Vercel majboori mein sirf Render ko hi call karega!
const API_URL = 'https://sonani-backend.onrender.com/api';

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

export default api;