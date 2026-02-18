import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ================= 1. PROTECT (Login Check) ================= */
export const protect = async (req, res, next) => {
  let token;

  // Header check karein
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // "Bearer " hatake token nikalein
      token = req.headers.authorization.split(" ")[1];

      // Token Verify
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // User data req object me store karein
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
};

/* ================= 2. AUTHORIZE (Role Check) ================= */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};