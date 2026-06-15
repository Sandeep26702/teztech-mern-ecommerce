import express from "express";
import { getHomeLayout, updateHomeLayout } from "../controllers/layoutController.js";
import { protect, authorize } from "../middleware/auth.Middleware.js";

// 🔥 NEW: Importing the Cloudinary upload utility (verify the path)
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
// 🔥 Enabled upload.any() so that video and all images upload directly to Cloudinary without limits
router.put(
  "/home", 
  protect, 
  authorize("admin", "subadmin"), 
  upload.any(), 
  updateHomeLayout
);

export default router;