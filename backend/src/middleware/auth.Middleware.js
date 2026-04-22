import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ============================================================
    1. PROTECT (Authentication Middleware)
    Logic: Verifies the JWT token from either Headers or Cookies
============================================================ */
export const protect = async (req, res, next) => {
  let token;

  // 🚀 DOUBLE GUARD FIX: Check both Header and Cookie

  // Check 1: Headers mein check karega (Axios Interceptor wala)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // Check 2: Agar header mein nahi mila, toh Cookies mein dhoondhega
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Agar dono jagah token nahi mila
  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, please login again" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: req.user.blockedReason || "Your account has been blocked by admin",
      });
    }

    next(); 
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ success: false, message: "Not authorized, token failed" });
  }
};

/* ============================================================
    2. AUTHORIZE (Role-Based Access Control)
============================================================ */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }
    next();
  };
};

/* ============================================================
    3. ADMIN (Admin & Subadmin Helper)
============================================================ */
export const admin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "subadmin")) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: "Access denied: Requires Admin or Subadmin privileges" 
    });
  }
};