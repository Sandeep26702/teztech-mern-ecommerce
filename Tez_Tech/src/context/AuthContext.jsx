/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import axios from "axios";

import { getApiUrl } from "../utils/api.js";

/* ================= CONTEXT CREATION ================= */
export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

/* ================= AXIOS SETUP ================= */
const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // 🚀 VERY IMPORTANT: Live server pe third-party cookies ke liye
});

// REQUEST INTERCEPTOR: Har API call me token khud lag jayega
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

// RESPONSE INTERCEPTOR: Token expire hone par auto-logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token expired or invalid. Logging out globally...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"; 
      }
    }
    return Promise.reject(error);
  }
);

/* ================= PROVIDER COMPONENT ================= */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasVerifiedRef = useRef(false);

  // 1. VERIFY USER (Page refresh par login bachata hai)
  useEffect(() => {
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    const verifyUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout(); 
        }
      } catch (err) {
        if (err.code !== "ERR_NETWORK") {
          localStorage.removeItem("token"); 
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data.success) {
        setUser(res.data.user);
        return res.data.user;
      }
      return null;
    } catch {
      return null;
    }
  };

  // 🚀 HELPER: Guest Cart ko Database me merge karna
  const handleCartMerge = async (token) => {
    try {
      const storedCart = localStorage.getItem("guestCart");
      const localItems = storedCart ? JSON.parse(storedCart) : [];

      if (localItems.length > 0) {
        await axios.post(
          `${API_URL}/cart/merge`,
          { localItems },
          { 
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true 
          }
        );
        localStorage.removeItem("guestCart");
        console.log("Cart merged successfully!");
      }
    } catch (err) {
      console.error("Failed to merge cart:", err);
    }
  };

  /* ================= 2. REGISTER ================= */
  const register = async (userData) => {
    try {
      const res = await api.post("/auth/register", userData);

      if (res.data.success) {
        return { 
          success: true, 
          email: res.data.email, 
          message: res.data.message 
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed",
      };
    }
  };

  /* ================= OTP VERIFICATION ================= */
  const verifyOtp = async (email, otp) => {
    try {
      const res = await api.post("/auth/verify-otp", { email, otp });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
        
        await handleCartMerge(res.data.token);
        
        // Delay taaki local storage theek se save ho jaye
        setTimeout(() => {
          window.location.href = "/"; 
        }, 400);

        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Verification failed",
      };
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await api.post("/auth/resend-otp", { email });
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to resend OTP",
      };
    }
  };

  /* ================= 3. LOGIN ================= */
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
        
        await handleCartMerge(res.data.token);
        
        // Delay taaki local storage theek se save ho jaye
        setTimeout(() => {
            window.location.href = "/"; 
        }, 400);

        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        isVerified: err.response?.data?.isVerified !== false,
        email: err.response?.data?.email,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  /* ================= 4. LOGOUT ================= */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cartItems"); 
    localStorage.removeItem("quoteItems");
    localStorage.removeItem("guestCart");

    setUser(null);
    window.location.href = "/login";
  };

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
        verifyOtp,
        resendOtp,
        logout,
        createSubAdmin,
        api, // Exporting Custom Axios for other components
        refreshUser,
        updateCurrentUser: setUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};