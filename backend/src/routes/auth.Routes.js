import express from "express";
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
  createSubAdmin // 🆕 Added: Import this controller
} from "../controllers/auth.Controller.js";

import { protect, authorize } from "../middleware/auth.Middleware.js"; // 🆕 Added: Import authorize

const router = express.Router();

/* ================= PUBLIC ROUTES ================= */
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

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