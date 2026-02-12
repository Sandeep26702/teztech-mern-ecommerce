import jwt from "jsonwebtoken";
import User from "../models/User.js";
import BlacklistedToken from "../models/BlacklistedToken.js";

/* ================= AUTH CHECK ================= */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Extract token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    // 2️⃣ Check blacklist
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Session expired, please login again",
      });
    }

    // 3️⃣ Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Attach user
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user; // ✅ FULL USER ATTACHED

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
};
