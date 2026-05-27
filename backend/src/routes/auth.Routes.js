import express from "express";
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
  createSubAdmin, // 🆕 Added: Import this controller
  verifyOtp,
  resendOtp
} from "../controllers/auth.Controller.js";

import { protect, authorize } from "../middleware/auth.Middleware.js"; // 🆕 Added: Import authorize
import { trafficLogger } from "../middleware/trafficLogger.js";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword
} from "../middleware/authValidator.js";

const router = express.Router();

// Apply traffic logger to all auth routes
router.use(trafficLogger);

/* ================= PUBLIC ROUTES ================= */
router.post("/register", validateRegister, register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", validateLogin, login);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.put("/reset-password/:token", validateResetPassword, resetPassword);

/* ================= PROTECTED ROUTES (Logged in Users) ================= */
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

/* ================= ADMIN ROUTES (Role Based) ================= */
// 🔐 Sirf Admin hi is route ko access kar sakta hai
router.post(
  "/create-subadmin", 
  protect, 
  authorize("admin"), 
  createSubAdmin
);

export default router;