/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token expired or invalid. Logging out globally...");
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"; 
      }
    }
    return Promise.reject(error);
  }
);

/* ================= PROVIDER COMPONENT ================= */
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        console.error("Token verification failed:", err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, []);

  // 🚀 Helper Function: Merge Local Cart to DB
  const handleCartMerge = async (token) => {
    try {
      const storedCart = localStorage.getItem("guestCart");
      const localItems = storedCart ? JSON.parse(storedCart) : [];

      if (localItems.length > 0) {
        // Send local items to merge API
        await axios.post(
          `${API_URL}/cart/merge`,
          { localItems },
          { headers: { Authorization: `Bearer ${token}` } } // Pass token manually since interceptor might not catch up instantly
        );
        // Clear local storage after successful merge
        localStorage.removeItem("guestCart");
        console.log("Cart merged successfully on Auth!");
      }
    } catch (err) {
      console.error("Failed to merge cart during auth:", err);
    }
  };

  /* ================= 2. REGISTER ================= */
  const register = async (userData) => {
    try {
      const res = await api.post("/auth/register", userData);

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        
        // Merge Cart BEFORE redirecting
        await handleCartMerge(res.data.token);
        
        window.location.href = "/"; 
        return { success: true };
      }
    } catch (err) {
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
        
        // Merge Cart BEFORE redirecting
        await handleCartMerge(res.data.token);
        
        window.location.href = "/"; 
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Login failed",
      };
    }
  };

  /* ================= 4. LOGOUT ================= */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("cartItems"); 
    localStorage.removeItem("quoteItems");
    localStorage.removeItem("guestCart"); // Clear guest cart too just in case

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
        logout,
        createSubAdmin,
        api, 
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};