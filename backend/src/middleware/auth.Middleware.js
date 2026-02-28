import jwt from "jsonwebtoken";
import User from "../models/User.js";


/* ============================================================
    1. PROTECT (Authentication Middleware)
    Logic: Verifies the JWT token and attaches the user object 
    to the request (req.user). This ensures the user is logged in.
============================================================ */
export const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from the "Bearer <token>" string
      token = req.headers.authorization.split(" ")[1];

      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from DB (excluding password) and attach to req.user
      req.user = await User.findById(decoded.id).select("-password");

      // If user no longer exists in DB but token is still valid
      if (!req.user) {
        return res.status(401).json({ success: false, message: "User no longer exists" });
      }

      next(); // Move to the next middleware or controller
    } catch (error) {
      console.error("Token verification failed:", error.message);
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  }

  // If no token was found in the headers
  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
  }
};

/* ============================================================
    2. AUTHORIZE (Role-Based Access Control)
    Logic: Checks if the logged-in user's role matches the 
    allowed roles for a specific route.
============================================================ */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user role exists in the allowed roles array
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
    Logic: A shorthand middleware to allow both Admins and 
    Subadmins for management routes (like viewing all quotes).
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