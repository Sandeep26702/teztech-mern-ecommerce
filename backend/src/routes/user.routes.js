import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword
} from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.Middleware.js";
import upload from "../utils/upload.js";

const router = express.Router();

/* ===============================
   USER PROFILE ROUTES (SECURE)
================================ */

// 🔐 Get logged-in user profile
router.get("/profile", protect, getProfile);

// 🔐 Update profile (name, phone, address, photo)
router.put(
  "/profile",
  protect,
  upload.single("profileImage"),
  updateProfile
);

// 🔐 Change password
router.put("/change-password", protect, changePassword);

export default router;