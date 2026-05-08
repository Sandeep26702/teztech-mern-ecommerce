import express from "express";
import { getHomeLayout, updateHomeLayout } from "../controllers/layoutController.js";
import { protect, authorize } from "../middleware/auth.Middleware.js";

// 🔥 Naya Cloudinary wala upload import kar rahe hain (path check kar lena)
import upload from "../utils/upload.js"; 

const router = express.Router();

/**
 * @route   GET /api/layout/home
 * @desc    Fetch home layout data
 * @access  Public
 */
router.get("/home", getHomeLayout);

/**
 * @route   PUT /api/layout/home
 * @desc    Update home layout data
 * @access  Private (Admin/Subadmin only)
 */
// 🔥 upload.any() laga diya taaki video aur sari images bina kisi limit ke Cloudinary chali jayein
router.put(
  "/home", 
  protect, 
  authorize("admin", "subadmin"), 
  upload.any(), 
  updateHomeLayout
);

export default router;