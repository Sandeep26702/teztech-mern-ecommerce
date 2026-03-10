import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
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

// Saved addresses
router.get("/addresses", protect, getUserAddresses);
router.post("/addresses", protect, addUserAddress);
router.put("/addresses/:addressId", protect, updateUserAddress);
router.delete("/addresses/:addressId", protect, deleteUserAddress);
router.put("/addresses/:addressId/default", protect, setDefaultAddress);

export default router;
