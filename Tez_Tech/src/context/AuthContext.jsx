/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/* ================= CONTEXT CREATION ================= */
export const AuthContext = createContext();

// Custom Hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

/* ================= AXIOS SETUP ================= */
// Backend URL (Make sure this matches your server port)
const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request Interceptor: Attach Token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= PROVIDER COMPONENT ================= */
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= 1. VERIFY TOKEN ON RELOAD ================= */
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Backend route must be: router.get("/me", verifyToken, getMe)
        const res = await api.get("/auth/me");

        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout(); // Invalid token
        }
      } catch (err) {
        console.error("Token verification failed:", err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= 2. REGISTER ================= */
  const register = async (userData) => {
    try {
      // Debug log
      console.log("Sending Register Data:", userData);

      const res = await api.post("/auth/register", userData);

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        // Navigate user to dashboard or home after register
        navigate("/"); 
        return { success: true };
      }
    } catch (err) {
      console.error("Register Error:", err.response?.data || err.message);
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed",
      };
    }
  };

  /* ================= 3. LOGIN ================= */
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/"); // Redirect to home
        return { success: true };
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  /* ================= 4. LOGOUT ================= */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  /* ================= 5. CREATE SUBADMIN (Admin Only) ================= */
  const createSubAdmin = async (formData) => {
    try {
      const res = await api.post("/auth/create-subadmin", formData);
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to create Subadmin",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        createSubAdmin,
        api, // Exporting api instance for use in other components
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};