import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ============================================================
    1. PROTECT (Authentication Middleware)
    Logic: Verifies the JWT token from either Headers or Cookies
============================================================ */
export const protect = async (req, res, next) => {
  let token;

  // 🚀 DOUBLE GUARD FIX: Check both Header and Cookie

  // Check 1: Check Authorization Headers (Axios Interceptor)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // Check 2: If not found in headers, check incoming Cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token was found in either location
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
  const staffRoles = ["admin", "subadmin", "sales team", "designer", "manufacturing", "purchase"];
  if (req.user && staffRoles.includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: "Access denied: Requires staff privileges" 
    });
  }
};